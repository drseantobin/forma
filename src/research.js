// research.js — the consented, DE-IDENTIFIED measurement pipeline.
//
// Forma's improvement data answers "what works / which items measure well / does
// the program actually move scores" — NEVER "who". The privacy guardrails are baked
// in HERE, structurally, not left to callers to remember:
//   • Captures NOTHING unless the user has explicitly consented (research.consent).
//   • DE-IDENTIFIED only — there is no name and no contact field in an event, ever.
//     A single random installId ties one device's events together; that's the only
//     identifier, and it exists only once consent is given.
//   • The optional Interior Life / faith track is NEVER collected — a 'interior'
//     domain event is dropped whole, mirroring the snapshot's exclusion.
//   • NO FREE TEXT, ever. Reflection / sentence-completion / vignette / coach text
//     never enters an event. Only the numeric score and the short keyed option id
//     (e.g. 'a' or 2 — a choice, not content) are kept.
//   • Day-coarse timestamps (no clock time), so events can't be lined up to
//     re-identify someone in a small sample.
//
// Built LOCAL-FIRST and SERVER-READY: events queue in the profile now; a later
// flush layer can batch them to a consented endpoint (Sean's own hosting). Until
// then this is inert in production (consent defaults off) and fully unit-testable
// as pure functions — no DOM, no network.

export const RESEARCH_SCHEMA = 1;
const QUEUE_CAP = 1000; // a generous local backlog before the oldest events roll off

// De-identified demographics we accept. ALL optional, ALL coarse by design. Anything
// not on this allow-list is dropped — so a caller (or a future form bug) cannot
// smuggle a name, email, or other identifier into the dataset.
export const DEMOGRAPHIC_FIELDS = ['ageBand', 'sex', 'region', 'role', 'aiExposure', 'education', 'faithTradition'];

export function cleanDemographics(input) {
  const out = {};
  if (!input || typeof input !== 'object' || Array.isArray(input)) return out;
  DEMOGRAPHIC_FIELDS.forEach((k) => {
    const v = input[k];
    if (typeof v === 'string' && v.trim()) out[k] = v.trim().slice(0, 40);
  });
  return out;
}

// Build a de-identified event from a completed session, or null if it must not be
// captured at all. Pure: no side effects, no I/O. `response` is the RAW response —
// we read ONLY its short optionId; its free-text fields are never touched.
export function buildEvent(session, response, today) {
  if (!session) return null;
  // Interior / faith content is never collected — drop the whole event.
  if (session.domain === 'interior') return null;
  const ev = {
    t: 'session',
    day: String(session.date || today || '').slice(0, 10), // day-coarse, no clock time
    type: session.type || null,
    domain: session.domain || null,
    score: session.rawScore == null ? null : session.rawScore,
    measured: session.unscored !== true,
  };
  // A short keyed option id is the CHOICE (the heart of item analysis), not content.
  // Free-text exercises carry no optionId, so their words never reach here — only
  // the numeric score does. We copy ONLY this one field off the raw response.
  if (response && (typeof response.optionId === 'string' || typeof response.optionId === 'number')) {
    ev.option = response.optionId;
  }
  return ev;
}

// Ensure the research block exists and is well-typed (defensive; mirrors migrate).
export function ensureResearch(profile) {
  if (!profile.research || typeof profile.research !== 'object' || Array.isArray(profile.research)) {
    profile.research = {};
  }
  const r = profile.research;
  if (typeof r.consent !== 'boolean') r.consent = false;
  if (r.consentedAt === undefined) r.consentedAt = null;
  if (!r.demographics || typeof r.demographics !== 'object' || Array.isArray(r.demographics)) r.demographics = {};
  if (!Array.isArray(r.queue)) r.queue = [];
  if (typeof r.installId !== 'string') r.installId = '';
  return r;
}

// Record a completed session into the local, server-ready queue — ONLY with consent.
// Mutates and returns the profile. A no-op (literally nothing captured) without consent.
export function recordSession(profile, session, response, today) {
  const r = ensureResearch(profile);
  if (!r.consent) return profile;
  const ev = buildEvent(session, response, today);
  if (!ev) return profile;
  r.queue.push(ev);
  if (r.queue.length > QUEUE_CAP) r.queue = r.queue.slice(-QUEUE_CAP);
  return profile;
}

// Set (or withdraw) consent. On grant: mint a random installId (once), stamp the
// time, store cleaned demographics. On withdrawal: stop collecting AND drop the
// queued events — honoring "delete my data" at the same moment they opt out.
export function setConsent(profile, consent, demographics, opts = {}) {
  const r = ensureResearch(profile);
  r.consent = !!consent;
  if (r.consent) {
    if (!r.installId) r.installId = opts.makeId ? opts.makeId() : genId();
    // DAY-COARSE on purpose (parity with event.day). A full-precision timestamp here
    // would be stamped at the same instant as the IDENTIFIED contact.consentedAt — a
    // high-precision join key that could re-link the anonymous research data to the
    // email once a flush ships. installId is already kept out of contact; this closes
    // the other cross-tier back-door. The identified contact tier keeps its own stamp.
    if (!r.consentedAt) r.consentedAt = String(opts.now || new Date().toISOString()).slice(0, 10);
    if (demographics !== undefined) r.demographics = cleanDemographics(demographics);
  } else {
    r.queue = [];
  }
  return profile;
}

function genId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch (e) { /* fall through */ }
  // Non-crypto fallback: a random, non-identifying token. Uniqueness across a device
  // population isn't security-critical here (events are anonymous regardless).
  return 'rid-' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
