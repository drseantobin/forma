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
  const measured = rawScore != null;

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
  // Defensive defaults for older/partial saves.
  p.settings = p.settings || { apiKey: '', model: 'claude-opus-4-8', name: '', faithTrack: false };
  if (p.settings.faithTrack == null) p.settings.faithTrack = false;
  p.domainScores = p.domainScores || {};
  p.sessions = p.sessions || [];
  p.history = p.history || [];
  p.indexHistory = p.indexHistory || [];
  p.focusChecks = p.focusChecks || [];
  p.goals = p.goals || [];
  p.coachLog = p.coachLog || [];
  p.streak = p.streak || { current: 0, longest: 0, lastDate: null };
  return p;
}

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

export { DOMAIN_ORDER };
