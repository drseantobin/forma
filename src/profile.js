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
    settings: { apiKey: '', model: 'claude-opus-4-8', name: '', faithTrack: false },
    baseline: null, // { date, domainScores, responses }
    domainScores: {}, // current EMA scale per domain (0..100)
    sessions: [], // raw daily-loop results
    history: [], // per-domain update log (drives trends)
    indexHistory: [], // [{date, formationIndex}]
    focusChecks: [], // [{date, ts, medianMs, score, trials}] — the distraction-recovery micro-test
    plan: null, // the active weekly Formation Plan (see planner.js)
    goals: [], // [{id, domain, text, createdAt, done}]
    streak: { current: 0, longest: 0, lastDate: null },
    coachLog: [], // [{role, content, ts}]
    // Consented, de-identified research/improvement data (see research.js). Off by
    // default — captures nothing until the user explicitly opts in. No name/contact
    // ever lives here; interior content is never collected.
    research: { consent: false, consentedAt: null, demographics: {}, queue: [], installId: '' },
    // CONTACT tier (identified, opt-in): an email for future reminders. SEPARATE
    // from research and deliberately NOT linkable to it — no installId here, ever.
    contact: { consent: false, email: '', consentedAt: null },
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
  // Scope = every keyed-answer type (scoreDecision family + matrix + crt). Open-ended
  // types are correctly excluded: reflection/contemplation/stay are unkeyed, and
  // vignette/sentence are AI-scored on free text, so a repeat is still a real response.
  // (profile.sessions does not yet include this session, so .some() tests prior history.)
  const RECALL_PRONE = new Set(['crt', 'decision', 'tradeoff', 'stem', 'comm', 'attend', 'steu', 'matrix']);
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
    default:
      return {};
  }
}

// Opt-in / opt-out of the Interior Life track. Enabling seeds a neutral interior
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
  delete p.domainScores.interior;
  return p;
}

export function addGoal(profile, domain, text) {
  const p = clone(profile);
  p.goals.push({ id: `g-${Date.now()}`, domain, text, createdAt: new Date().toISOString(), done: false });
  return p;
}

export function toggleGoal(profile, goalId) {
  const p = clone(profile);
  const g = p.goals.find((x) => x.id === goalId);
  if (g) g.done = !g.done;
  return p;
}

// Granular privacy control: wipe the coach conversation (the most sensitive data)
// without touching the formation record — scores, sessions, goals all survive.
export function clearCoachLog(profile) {
  const p = clone(profile);
  p.coachLog = [];
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
  if (p.settings.model == null) p.settings.model = 'claude-opus-4-8';
  if (p.settings.name == null) p.settings.name = '';
  if (p.settings.faithTrack == null) p.settings.faithTrack = false;
  p.domainScores = obj(p.domainScores);
  p.sessions = arr(p.sessions);
  p.history = arr(p.history);
  p.indexHistory = arr(p.indexHistory);
  p.focusChecks = arr(p.focusChecks);
  p.goals = arr(p.goals);
  p.coachLog = arr(p.coachLog);
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
  // Contact tier (identified) — coerce by type, default to no-consent/empty. Kept
  // structurally separate from research; never carries an installId.
  p.contact = obj(p.contact);
  if (typeof p.contact.consent !== 'boolean') p.contact.consent = false;
  if (typeof p.contact.email !== 'string') p.contact.email = '';
  if (p.contact.consentedAt === undefined) p.contact.consentedAt = null;
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
