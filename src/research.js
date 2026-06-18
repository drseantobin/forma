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
//     never enters an event. Only the numeric score, the short keyed option id
//     (e.g. 'a' or 2 — a choice, not content), and the keyed ITEM id (e.g.
//     'stem-credit' — which item, needed for item difficulty/discrimination and the
//     factor model) are kept. The item id is a non-PII internal identifier, not content.
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
  // The keyed ITEM id (which exercise) — the unit of item analysis (difficulty, discrimination)
  // and the column key of the future CFA person×indicator matrix. A non-PII internal id, not content;
  // interior events are already dropped above. Generated tasks carry their task-type id (fine — they're
  // analyzed separately from keyed banks, per the validity review).
  if (session.exerciseId != null && (typeof session.exerciseId === 'string' || typeof session.exerciseId === 'number')) {
    ev.item = session.exerciseId;
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
  // Monotonic per-install sequence — lets the future server dedup on (installId, seq)
  // so a re-sent batch (POST landed but response lost) is idempotent. Stays strictly
  // inside the research tier (shares installId); never appears in contact/release.
  if (typeof r.nextSeq !== 'number') r.nextSeq = 0;
  return r;
}

// Record a completed session into the local, server-ready queue — ONLY with consent.
// Mutates and returns the profile. A no-op (literally nothing captured) without consent.
export function recordSession(profile, session, response, today) {
  const r = ensureResearch(profile);
  if (!r.consent) return profile;
  const ev = buildEvent(session, response, today);
  if (!ev) return profile;
  ev.seq = r.nextSeq++;
  r.queue.push(ev);
  if (r.queue.length > QUEUE_CAP) r.queue = r.queue.slice(-QUEUE_CAP);
  return profile;
}

// ----- server-ready flush (pipeline #8). INERT until an endpoint is configured. -----
export const FLUSH_SCHEMA = 1;
// ALLOW-LIST: the ONLY fields that may leave the device. PII is impossible by
// construction — buildBatch never references profile.contact/release/settings/coachLog.
const FLUSH_EVENT_FIELDS = ['t', 'day', 'type', 'domain', 'score', 'measured', 'option', 'item', 'seq'];
function cleanFlushEvent(ev) {
  if (!ev || typeof ev !== 'object') return null;
  const out = {};
  FLUSH_EVENT_FIELDS.forEach((k) => { if (ev[k] !== undefined) out[k] = ev[k]; });
  return out;
}

// Build the de-identified payload, or null if nothing should be sent. PURE.
export function buildBatch(profile) {
  const r = ensureResearch(profile);
  if (!r.consent || !r.installId) return null;       // consent gate, baked in
  const events = (r.queue || []).map(cleanFlushEvent).filter(Boolean);
  if (!events.length) return null;
  return {
    schema: FLUSH_SCHEMA,
    installId: r.installId,                          // the ONLY identifier
    consentedAt: r.consentedAt,                      // already day-coarse
    demographics: cleanDemographics(r.demographics), // re-run the allow-list at the wire
    events,
  };
}

// Send the batch when consent + endpoint are present. Offline-safe + fails-silent: on
// ANY failure the events are KEPT and nothing throws into the app. On success, remove
// EXACTLY the sent events (n captured before the await) so a session queued mid-POST
// survives. Never sends without consent or an endpoint.
export async function flushResearch(profile, { endpoint, fetchImpl, save } = {}) {
  const r = ensureResearch(profile);
  if (!r.consent || !endpoint) return { sent: 0 };
  const batch = buildBatch(profile);
  if (!batch) return { sent: 0 };
  const n = batch.events.length; // capture BEFORE await — race fix
  const doFetch = fetchImpl || (typeof fetch !== 'undefined' ? fetch : null);
  if (!doFetch) return { sent: 0 };
  let res;
  try {
    res = await doFetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(batch) });
  } catch (e) { return { sent: 0 }; }          // network failure → keep events, swallow
  if (!res || !res.ok) return { sent: 0 };     // non-2xx → keep events, swallow
  r.queue = (r.queue || []).slice(n);          // remove sent; in-flight (index >= n) survives
  if (save) { try { save(); } catch (e) { /* noop */ } }
  return { sent: n };
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
