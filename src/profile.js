// profile.js — the user model and its persistence.
//
// Privacy architecture (a non-negotiable guardrail from the spec): the
// behavioral log is sensitive. Forma stores it ONLY in this browser's
// localStorage. Nothing is sent anywhere — with one exception the user opts
// into explicitly: if they add their own Claude API key, coaching prompts go
// directly to Anthropic and nowhere else. No Forma server exists.
//
// Pure state transforms (createProfile, applySession, ...) are separated from
// storage (loadProfile/saveProfile) so the logic is testable without a DOM.

import { DOMAINS } from './domains.js';
import { updateEMA, formationIndex, scoreExercise } from './scoring.js';
import { updateStreak, todayStr } from './progress.js';
import { bandIndex } from './milestones.js';

export const STORAGE_KEY = 'forma.profile.v1';
const VERSION = 1;
const DOMAIN_ORDER = DOMAINS.map((d) => d.id);

export function createProfile() {
  return {
    version: VERSION,
    createdAt: new Date().toISOString(),
    settings: { provider: 'anthropic', apiKey: '', model: 'claude-opus-4-8', name: '', faithTrack: false, researchEndpoint: '' },
    baseline: null, // { date, domainScores, responses }
    domainScores: {}, // current EMA scale per domain (0..100)
    sessions: [], // raw daily-loop results
    history: [], // per-domain update log (drives trends)
    indexHistory: [], // [{date, formationIndex}]
    focusChecks: [], // [{date, ts, medianMs, score, trials}] — the distraction-recovery micro-test
    plan: null, // the active weekly Formation Plan (see planner.js)
    goals: [], // [{id, domain, text, createdAt, done}]
    streak: { current: 0, longest: 0, lastDate: null },
    coachLog: [], // [{role, content, ts}] — the GENERAL coach thread
    // Per-domain coach threads, keyed by domain id (like separate chats — one space per
    // capacity, so the coach can track a conversation about that area over time). The
    // general thread stays in coachLog (above). { [domainId]: [{role, content, ts}] }.
    coachThreads: {},
    // Archived past-day coach messages per thread ('general' + domain ids). Chats are never
    // CLEARED (which would lose context) — older days fold here so the live view stays fresh
    // ("just the day's") while the coach can still draw on the whole history. coachDay marks
    // which local day the LIVE threads belong to, so a new day auto-archives the prior day.
    coachHistory: {},
    coachDay: null,
    // Consented, de-identified research/improvement data (see research.js). Off by
    // default — captures nothing until the user explicitly opts in. No name/contact
    // ever lives here; interior content is never collected.
    research: { consent: false, consentedAt: null, demographics: {}, queue: [], installId: '', nextSeq: 0 },
    // CONTACT tier (identified, opt-in): an email for future reminders. SEPARATE
    // from research and deliberately NOT linkable to it — no installId here, ever.
    contact: { consent: false, email: '', consentedAt: null },
    // RELEASE-OF-INFORMATION tier (identified, opt-in, the person's choice): authorize
    // sharing the interior-excluded snapshot with a named third party. Default OFF;
    // only the user can enable it. Also no installId — not linkable to research.
    release: { consent: false, recipient: '', scope: 'snapshot', snapshot: null, consentedAt: null },
  };
}

// Record a Focus Check (the distraction-recovery micro-test). Also gently
// credits the Attention scale, since a sharp focus check is sustained attention.
export function applyFocusCheck(profile, { medianMs, score, trials }, opts = {}) {
  const p = clone(profile);
  const now = opts.now ? new Date(opts.now) : new Date();
  p.focusChecks = p.focusChecks || [];
  p.focusChecks.push({
    date: todayStr(now),
    ts: now.toISOString(),
    medianMs: Math.round(medianMs),
    score,
    trials: trials || null,
  });
  const prev = p.domainScores.attention;
  p.domainScores.attention = updateEMA(prev, score, (opts.alpha ?? 0.3) * 0.6);
  return p;
}

// Commit the baseline diagnostic into the profile.
export function applyBaseline(profile, domainScores, responses) {
  const p = clone(profile);
  const date = todayStr();
  p.baseline = { date, domainScores: { ...domainScores }, responses: { ...responses } };
  p.domainScores = { ...domainScores };
  // Seed the index history so the first chart point is the baseline.
  p.indexHistory = [{ date, formationIndex: formationIndex(domainScores) }];
  return p;
}

// Apply a completed daily session. Returns { profile, session } where session
// includes the computed rawScore and the new domain scale value.
// How a session's score was produced — so AI-judged scores never silently pool with objective
// performance scores in the psychometric pipeline (forma-validity flag, v324). 'ai-judged' = a
// rubric placed by the coach model; 'self-report' = the person's own rating; 'performance' = scored
// from behavior/accuracy on the task. Recorded per session for honest downstream analysis.
const AI_JUDGED_TYPES = ['reflection', 'vignette', 'sentence'];
const SELF_REPORT_TYPES = ['meaning', 'contemplation'];
// Response-aware (v326, per Codex): an AI-judged type that produced NO aiScore (no key / fail) is
// 'unscored' — never mislabel a keyless self-rating as an 'ai-judged' measurement (which would let it
// silently move the EMA/confidence). Only a real AI placement counts as 'ai-judged'.
export function scoreSourceFor(type, response = {}) {
  if (AI_JUDGED_TYPES.includes(type)) return (response && response.aiScore != null) ? 'ai-judged' : 'unscored';
  if (SELF_REPORT_TYPES.includes(type)) return 'self-report';
  return 'performance';
}

export function applySession(profile, exercise, response, opts = {}) {
  const p = clone(profile);
  const now = opts.now ? new Date(opts.now) : new Date();
  const date = todayStr(now);
  const rawScore = scoreExercise(exercise, response);
  const domain = exercise.domain;
  // An AI-scored exercise (vignette/sentence) can come back UNMEASURED — null —
  // when there's no key, the API failed, or the model's output was unparseable.
  // We never fabricate a number onto the longitudinal scale: an unmeasured
  // session is recorded (it counts as showing up, for the streak) but leaves the
  // domain scale, history, Formation Index, and confidence completely untouched.
  // A re-served KEYED-ANSWER item is likewise unmeasured. Once an item has shown
  // you its keyed "best" answer AND the rationale for it (CRT names the bias; the
  // SJT family and matrix reveal the correct option + explanation on lock-in),
  // re-selecting that option measures RECALL, not the capacity — and would ratchet
  // the domain toward the keyed ceiling (100) by memory. The SJT banks are small
  // (5–6 items), so focused practice exhausts them in weeks and the picker then
  // recycles seen items; scoring those replays would inflate exactly the relational/
  // AI-readiness domains an employer scrutinizes most, while confidence (which counts
  // sessions) rises — the number looks MORE trustworthy as it degrades into recall.
  // Scope = every keyed-answer type (scoreDecision family + matrix + crt + reading's keyed
  // inference questions + maze's keyed cloze blanks — a re-served passage is re-answered from
  // memory, not comprehension). Open-ended types are correctly excluded: reflection/contemplation/
  // stay are unkeyed, and vignette/sentence are AI-scored on free text, so a repeat is still a real
  // response. Generated types (nback/series/span/mathfluency/vigilance/pursuit) carry a fresh id per
  // serve, so every item is genuinely new and they need no gate.
  // (profile.sessions does not yet include this session, so .some() tests prior history.)
  const RECALL_PRONE = new Set(['crt', 'decision', 'tradeoff', 'stem', 'comm', 'attend', 'steu', 'matrix', 'reading', 'maze', 'reliance']);
  const isSingleUseReplay = RECALL_PRONE.has(exercise.type)
    && (p.sessions || []).some((s) => s.exerciseId === exercise.id);
  const measured = rawScore != null && !isSingleUseReplay;

  const alpha = opts.alpha ?? 0.3;
  const prev = p.domainScores[domain];
  const newDomainScore = measured ? updateEMA(prev, rawScore, alpha) : (prev ?? null);
  if (measured) p.domainScores[domain] = newDomainScore;

  // Some exercises legitimately train a second capacity. Deep reading, for
  // instance, IS sustained attention — so a reading session also credits
  // Attention, at a gentler weight (you weren't testing it directly).
  let secondaryEntry = null;
  if (measured && exercise.secondaryDomain && exercise.secondaryDomain !== domain) {
    const sd = exercise.secondaryDomain;
    const prevSec = p.domainScores[sd];
    const newSec = updateEMA(prevSec, rawScore, alpha * 0.6);
    p.domainScores[sd] = newSec;
    secondaryEntry = { domain: sd, newDomainScore: newSec };
  }

  const fi = formationIndex(p.domainScores);

  // High-water band latch: the highest band this domain has EVER reached, so a
  // band-ascension milestone fires only on a genuine FIRST crossing — not every
  // time the gentle EMA wobbles back up over a boundary it already cleared.
  // `priorBandPeak` (the peak BEFORE this session) is stamped on the session for
  // the milestone check; the peak itself advances only on a measured session.
  let priorBandPeak = -1;
  if (measured) {
    p.bandPeak = p.bandPeak || {};
    priorBandPeak = p.bandPeak[domain] != null ? p.bandPeak[domain] : bandIndex(prev);
    p.bandPeak[domain] = Math.max(priorBandPeak, bandIndex(newDomainScore));
  }

  const session = {
    date,
    hour: now.getHours(),
    ts: now.toISOString(),
    exerciseId: exercise.id,
    type: exercise.type,
    domain,
    rawScore,
    prevDomainScore: prev ?? null,
    newDomainScore,
    priorBandPeak,
    unscored: !measured,
    scoreSource: scoreSourceFor(exercise.type, response),
    response: summarizeResponse(exercise, response),
  };
  p.sessions.push(session);
  // Only a real measurement enters the longitudinal record (history + index).
  if (measured) {
    p.history.push({
      date,
      domain,
      exerciseType: exercise.type,
      rawScore,
      newDomainScore,
      formationIndex: fi,
    });
    if (secondaryEntry) {
      p.history.push({
        date,
        domain: secondaryEntry.domain,
        exerciseType: `${exercise.type}-secondary`,
        rawScore,
        newDomainScore: secondaryEntry.newDomainScore,
        formationIndex: fi,
      });
    }

    // One index-history point per day (update if same day already logged).
    const lastIdx = p.indexHistory[p.indexHistory.length - 1];
    if (lastIdx && lastIdx.date === date) lastIdx.formationIndex = fi;
    else p.indexHistory.push({ date, formationIndex: fi });
  }

  // Showing up counts for the streak even when a reflection couldn't be scored.
  p.streak = updateStreak(p.streak, date);
  return { profile: p, session };
}

// Keep the stored response compact and non-sensitive-by-default.
function summarizeResponse(exercise, response) {
  switch (exercise.type) {
    case 'reading':
      return { answers: response.answers };
    case 'memory':
      return { recalled: response.recalled };
    case 'decision':
      return { optionId: response.optionId };
    case 'reflection':
      return { selfRating: response.selfRating, text: response.text || '' };
    case 'contemplation':
      return {
        seconds: response.seconds,
        presence: response.presence,
        distraction: response.distraction,
        eyes: response.eyes,
        timeFelt: response.timeFelt,
        note: response.note || '',
      };
    case 'guided':
      // ACT guided practice, stored on-device. For NON-interior practices the coach may
      // surface the value/action/note back to the person (their own keyed model) so it can
      // refer to what they actually said — but interior/faith guided content (the Examen) is
      // still walled from every API path (coach.js profileSummary filters domain==='interior',
      // and distress text is excluded), and a guided session remains unscored.
      return {
        moduleId: response.moduleId,
        completed: !!response.completed,
        before: response.before,
        after: response.after,
        value: response.value || '',
        action: response.action || '',
        note: response.note || '',
      };
    default:
      return {};
  }
}

// Opt-in / opt-out of the Spiritual Life track. Enabling seeds a neutral interior
// score (if not already baselined) so it appears on the scales and gets trained;
// disabling removes it from the scored set so it leaves the Formation Index and
// the radar entirely.
export function enableFaithTrack(profile) {
  const p = clone(profile);
  p.settings.faithTrack = true;
  if (p.domainScores.interior == null) p.domainScores.interior = 50;
  // Seed the baseline too, so the 90-day delta for interior is consistent.
  if (p.baseline && p.baseline.domainScores && p.baseline.domainScores.interior == null) {
    p.baseline.domainScores.interior = 50;
  }
  return p;
}
export function disableFaithTrack(profile) {
  const p = clone(profile);
  p.settings.faithTrack = false;
  // Remove ALL stored interior state, not just the live score — disabling fully removes the
  // Spiritual Life track, so no orphaned interior data lingers in baseline/bandPeak. Privacy: the
  // interior track is private and must never leak into a non-faith profile, and a future read of
  // baseline.domainScores/bandPeak without the faith gate is exactly how an orphan would leak it.
  // Re-enabling re-seeds fresh (the honest behavior on an explicit opt-out), not a stale resurrection.
  delete p.domainScores.interior;
  if (p.baseline && p.baseline.domainScores) delete p.baseline.domainScores.interior;
  if (p.bandPeak) delete p.bandPeak.interior;
  delete p.interiorLens; // the private reflective lens is interior data too — clear it on opt-out
  return p;
}

export function addGoal(profile, domain, text) {
  const p = clone(profile);
  // checkins: dates the commitment was kept — so it's TRACKED over time, not a
  // one-click-and-it's-gone toggle. (done is kept for back-compat / archive.)
  p.goals.push({ id: `g-${Date.now()}`, domain, text, createdAt: new Date().toISOString(), done: false, checkins: [] });
  return p;
}

export function toggleGoal(profile, goalId) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  if (g) g.done = !g.done;
  return p;
}

// The commitment CHECK-IN (v340 — the keystone from the full-program review): the app asks, the
// person answers, three-state so a day when the cue never arose is NEVER counted as a miss
// (practice.js's own honesty rule). 'kept' lands in checkins (the same record the weekly review
// and coach read); 'missed' lands in misses (fuel for a sharper if-then, not guilt); 'no-moment'
// records only that we asked. askedOn stops the reveal from re-asking the same day.
// Prompted progress-monitoring is itself an active ingredient (Harkin et al. 2016, d≈.40).
export function checkinGoal(profile, goalId, dateStr, result) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  if (g) {
    g.checkins = Array.isArray(g.checkins) ? g.checkins : [];
    g.misses = Array.isArray(g.misses) ? g.misses : [];
    if (result === 'kept' && !g.checkins.includes(dateStr)) g.checkins.push(dateStr);
    if (result === 'missed' && !g.misses.includes(dateStr)) g.misses.push(dateStr);
    g.askedOn = dateStr;
  }
  return p;
}

// Track a commitment over time: toggle today's check-in (kept / un-kept). The
// commitment STAYS in the list — tracking is recurring, not one-and-done.
export function trackGoal(profile, goalId, dateStr) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  if (g) {
    g.checkins = Array.isArray(g.checkins) ? g.checkins : [];
    const i = g.checkins.indexOf(dateStr);
    if (i >= 0) g.checkins.splice(i, 1); else g.checkins.push(dateStr);
  }
  return p;
}

// Edit a commitment's text (the pencil control).
export function editGoal(profile, goalId, text) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  const t = String(text || '').trim();
  if (g && t) g.text = t.slice(0, 120);
  return p;
}

// The Spiritual-identity LENS (v265) — a PRIVATE, non-scored reflective map of where a person
// notices themselves across three faith components (Belief / Practice / Belonging), each by a
// NON-RANKED status (settled / exploring / inherited / drifting). Grounded in Marcia's identity
// STATUS-by-component framing (Halevy 2025), deliberately NOT a Fowler-style stage/altitude ladder.
// Honesty: this is a mirror, NEVER a score — it stays on the device in the profile, walled like the
// rest of the interior track (never an API / coach / snapshot / employer surface), because Forma
// does not presume to "stage" anyone's soul. Setting an empty/invalid status clears that component.
export const LENS_COMPONENTS = ['belief', 'practice', 'belonging'];
export const LENS_STATUSES = ['settled', 'exploring', 'inherited', 'drifting'];
export function setInteriorLens(profile, component, status) {
  const p = clone(profile);
  if (!LENS_COMPONENTS.includes(component)) return p;
  p.interiorLens = (p.interiorLens && typeof p.interiorLens === 'object' && !Array.isArray(p.interiorLens)) ? { ...p.interiorLens } : {};
  if (LENS_STATUSES.includes(status)) p.interiorLens[component] = status;
  else delete p.interiorLens[component];
  return p;
}

// Attach an OPTIONAL coping plan to a commitment (Sniehotta 2005 coping planning): a
// proactively-chosen "if <obstacle>, I'll <recovery>" the person sets ahead of a hard day.
// The recovery clause is positive by design. NEVER triggered by a missed/absent check-in —
// a missing check-in is not a failure; this is set only when the person chooses to. Clears
// the plan if either field is emptied. Both fields capped like editGoal.
export function setCoping(profile, goalId, when, then) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  if (g) {
    const w = String(when || '').trim().slice(0, 120);
    const t = String(then || '').trim().slice(0, 120);
    if (w && t) g.coping = { when: w, then: t };
    else delete g.coping;
  }
  return p;
}

// Delete a commitment (the trash control).
export function removeGoal(profile, goalId) {
  const p = clone(profile);
  p.goals = p.goals.filter((x) => x.id !== goalId);
  return p;
}

// Granular privacy control: wipe the coach conversation (the most sensitive data)
// without touching the formation record — scores, sessions, goals all survive.
export function clearCoachLog(profile) {
  const p = clone(profile);
  p.coachLog = [];
  p.coachThreads = {};   // clear every per-domain thread too, not just the general one
  p.coachHistory = {};   // and the archived history — a true wipe (the Settings "clear" control)
  p.coachDay = null;
  return p;
}

// On a NEW local day, fold the prior day's LIVE coach messages (general + every domain thread)
// into coachHistory, then start the day fresh. Chats are ARCHIVED, never cleared — the coach
// shows "just the day's" while keeping the whole conversation as memory. `today` = todayStr().
// First-ever call (coachDay null) just adopts the current messages as today's (no disruption).
export function foldCoachHistory(profile, today) {
  const p = clone(profile);
  if (p.coachDay === today) return p;
  if (p.coachDay == null) { p.coachDay = today; return p; }
  p.coachHistory = (p.coachHistory && typeof p.coachHistory === 'object') ? p.coachHistory : {};
  const fold = (key, live) => {
    if (live && live.length) {
      p.coachHistory[key] = (p.coachHistory[key] || []).concat(live);
      if (p.coachHistory[key].length > 400) p.coachHistory[key] = p.coachHistory[key].slice(-400);
    }
  };
  fold('general', p.coachLog);
  p.coachLog = [];
  p.coachThreads = p.coachThreads || {};
  for (const k of Object.keys(p.coachThreads)) { fold(k, p.coachThreads[k]); p.coachThreads[k] = []; }
  p.coachDay = today;
  return p;
}

export function recentSeenIds(profile, n = 4) {
  return (profile.sessions || []).slice(-n).map((s) => s.exerciseId);
}

// The most recent sessions, newest first — for the auditable "recent activity"
// log (every score the person earned, in order). Pure.
export function recentSessions(profile, n = 8) {
  // Only sessions that produced a real score — this is the "scores you've earned"
  // auditable record. Unscored AI reflections (model couldn't grade them) aren't
  // measurements and would render as a null band, so they're left out.
  return (profile.sessions || []).filter((s) => !s.unscored).slice(-n).reverse();
}

// ---- storage (browser only) ----
export function loadProfile() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return migrate(p);
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  if (!profile) return; // never persist the string "null"
  // Cap the chat log at the persistence boundary so a multi-year daily user can't
  // silently overflow the ~5MB localStorage quota (where setItem throws and the
  // catch below would swallow it → silent data loss for exactly the long-term
  // users the app courts). The live coach only reads the last several turns
  // (coach.js buildCoachMessages slices to 8), so nothing functional is lost.
  // The longitudinal measures (sessions/history/indexHistory) grow slowly and are
  // the actual value, so they are NOT pruned. Mutates in place to keep the
  // in-memory log consistent with what's stored.
  if (profile.coachLog && profile.coachLog.length > 200) {
    profile.coachLog = profile.coachLog.slice(-200);
  }
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
  } catch {
    /* storage full or unavailable — fail quietly; data is best-effort local */
  }
}

// ---- onboarding resume ----
// The baseline is the longest, most interruption-prone flow (44 self-report items
// across 11 screens). Persisting in-progress onboarding means a closed tab, locked
// phone, or killed PWA doesn't wipe a person's answers and dump them back at the
// start — they resume exactly where they left off. Cleared once the baseline is
// committed (a finished profile no longer needs it).
const ONBOARD_KEY = 'forma.onboard.v1';
export function saveOnboard(onboard) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(ONBOARD_KEY, JSON.stringify(onboard));
  } catch { /* best-effort */ }
}
export function loadOnboard() {
  try {
    const raw = typeof localStorage !== 'undefined' && localStorage.getItem(ONBOARD_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw);
    return (o && typeof o === 'object' && !Array.isArray(o)) ? o : null;
  } catch {
    return null;
  }
}
export function clearOnboard() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(ONBOARD_KEY);
  } catch { /* noop */ }
}

export function exportProfile(profile) {
  // API key is excluded from exports so a shared backup never leaks a secret.
  const copy = clone(profile);
  if (copy.settings) copy.settings.apiKey = '';
  // The Demo Mode sample marker must never ride out in a backup — a re-imported
  // file should become a real profile, not a phantom sample.
  delete copy.demo;
  return JSON.stringify(copy, null, 2);
}

// Restore a profile from an exported JSON string. Validates that it actually
// looks like a Forma profile before accepting it, so a wrong or corrupt file
// can't silently replace someone's data. Throws an Error with a plain-language
// message on bad input. Runs through migrate() so older/partial backups are
// normalized. The export never contains an API key, so the caller decides
// whether to carry the current key over.
export function importProfile(jsonString) {
  let raw;
  try {
    raw = JSON.parse(jsonString);
  } catch {
    throw new Error('That file isn’t valid JSON — make sure it’s a Forma export.');
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('That doesn’t look like a Forma backup.');
  }
  const looksLikeProfile = 'domainScores' in raw
    && ('sessions' in raw || 'history' in raw || 'baseline' in raw);
  if (!looksLikeProfile) {
    throw new Error('That file is missing Forma’s data — it may be from another app.');
  }
  return migrate(raw);
}

function migrate(p) {
  if (!p.version) p.version = VERSION;
  // Defense-in-depth: a restored backup is real data — never an in-memory sample.
  // Strips the marker off any older/leaked export that predates the exportProfile fix.
  delete p.demo;
  // Defensive defaults for older / partial / foreign saves. Coerce by TYPE, not
  // just truthiness: a structurally-valid stored object with a wrong-typed field
  // (e.g. sessions:{} from a partial or foreign write) is truthy, so a falsy-only
  // `|| []` guard lets it slip straight to first render and crash boot
  // (({}).some is not a function → uncaught TypeError → white-screen, no recovery).
  // loadProfile's try/catch only handles malformed JSON, not valid-JSON-wrong-shape.
  const arr = (v) => (Array.isArray(v) ? v : []);
  const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});
  p.settings = obj(p.settings);
  if (p.settings.apiKey == null) p.settings.apiKey = '';
  if (p.settings.provider == null) p.settings.provider = 'anthropic';
  if (p.settings.model == null) p.settings.model = 'claude-opus-4-8';
  if (p.settings.researchEndpoint == null) p.settings.researchEndpoint = ''; // empty = flush inert
  if (p.settings.name == null) p.settings.name = '';
  if (p.settings.faithTrack == null) p.settings.faithTrack = false;
  p.domainScores = obj(p.domainScores);
  p.sessions = arr(p.sessions);
  p.history = arr(p.history);
  p.indexHistory = arr(p.indexHistory);
  p.focusChecks = arr(p.focusChecks);
  p.goals = arr(p.goals);
  // Backfill the check-in log on commitments saved before tracking existed.
  p.goals.forEach((g) => { if (g && typeof g === 'object' && !Array.isArray(g.checkins)) g.checkins = []; });
  p.coachLog = arr(p.coachLog);
  // Per-domain coach threads — sanitize to an object of capped message arrays.
  p.coachThreads = (p.coachThreads && typeof p.coachThreads === 'object' && !Array.isArray(p.coachThreads)) ? p.coachThreads : {};
  for (const k of Object.keys(p.coachThreads)) {
    p.coachThreads[k] = arr(p.coachThreads[k]);
    if (p.coachThreads[k].length > 200) p.coachThreads[k] = p.coachThreads[k].slice(-200);
  }
  // Archived coach history (per thread) — same shape, deeper cap (it's the long memory).
  p.coachHistory = (p.coachHistory && typeof p.coachHistory === 'object' && !Array.isArray(p.coachHistory)) ? p.coachHistory : {};
  for (const k of Object.keys(p.coachHistory)) {
    p.coachHistory[k] = arr(p.coachHistory[k]);
    if (p.coachHistory[k].length > 400) p.coachHistory[k] = p.coachHistory[k].slice(-400);
  }
  if (p.coachDay === undefined) p.coachDay = null;
  p.streak = obj(p.streak);
  if (p.streak.current == null) p.streak.current = 0;
  if (p.streak.longest == null) p.streak.longest = 0;
  if (p.streak.lastDate === undefined) p.streak.lastDate = null;
  // Research block (de-identified, opt-in). Coerce by type so a pre-research or
  // partial save can't crash the capture path; defaults to no-consent (collect nothing).
  p.research = obj(p.research);
  if (typeof p.research.consent !== 'boolean') p.research.consent = false;
  if (p.research.consentedAt === undefined) p.research.consentedAt = null;
  p.research.demographics = obj(p.research.demographics);
  p.research.queue = arr(p.research.queue);
  if (typeof p.research.installId !== 'string') p.research.installId = '';
  if (typeof p.research.nextSeq !== 'number') p.research.nextSeq = 0;
  // Contact tier (identified) — coerce by type, default to no-consent/empty. Kept
  // structurally separate from research; never carries an installId.
  p.contact = obj(p.contact);
  if (typeof p.contact.consent !== 'boolean') p.contact.consent = false;
  if (typeof p.contact.email !== 'string') p.contact.email = '';
  if (p.contact.consentedAt === undefined) p.contact.consentedAt = null;
  // Release-of-information tier (identified) — coerce by type; default OFF. Also kept
  // separate from research; never carries an installId.
  p.release = obj(p.release);
  if (typeof p.release.consent !== 'boolean') p.release.consent = false;
  if (typeof p.release.recipient !== 'string') p.release.recipient = '';
  if (typeof p.release.scope !== 'string') p.release.scope = 'snapshot';
  if (p.release.snapshot === undefined) p.release.snapshot = null;
  if (p.release.consentedAt === undefined) p.release.consentedAt = null;
  if (p.bandPeak != null && (typeof p.bandPeak !== 'object' || Array.isArray(p.bandPeak))) p.bandPeak = null;
  // Backfill the band high-water mark (added v98) for profiles saved BEFORE it
  // existed. Without this, a returning pre-v98 user who already reached a band
  // (then drifted down via the EMA) gets a false "you've reached X" re-celebration
  // the first time the scale wobbles back over that boundary — the exact hollow
  // re-fire the latch was built to prevent. Fully reconstructable: history stores
  // {domain, newDomainScore} for every measured session. Idempotent (only when
  // absent); domains with baseline-only / no history fall back to bandIndex(prev)
  // in applySession, matching post-v98 behavior.
  if (!p.bandPeak) {
    p.bandPeak = {};
    for (const h of p.history) {
      if (h.newDomainScore == null) continue;
      const b = bandIndex(h.newDomainScore);
      if (b > (p.bandPeak[h.domain] ?? -1)) p.bandPeak[h.domain] = b;
    }
  }
  return p;
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export { DOMAIN_ORDER };
