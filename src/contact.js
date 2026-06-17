// contact.js — the CONTACT consent tier (identified, opt-in, separate by design).
//
// A user may opt in to provide an email so Forma can later send reminders /
// encouragement / results. This is IDENTIFIED data and is deliberately kept in its
// OWN module and its own profile block (`profile.contact`), with a hard rule:
//
//   It is NEVER linkable to the de-identified research data. `profile.contact` has
//   NO `installId` and NO code path here reads `profile.research`. If the email and
//   the anonymous research events ever shared a key, the research set could be
//   re-identified — which would break the whole privacy guarantee. So this file
//   touches ONLY `profile.contact`, and the future server flush sends the email
//   (contact tier) and the anonymous events (research tier) on separate channels
//   with no shared identifier.
//
// There is no backend yet: setContact only STORES the email locally. NOTHING here
// makes a network call — the email sits in localStorage until Sean's server exists.
// Pure functions, no DOM, fully testable.

export const CONTACT_SCHEMA = 1;
// The only fields this block ever holds. Note the absence of installId — on purpose.
export const CONTACT_FIELDS = ['consent', 'email', 'consentedAt'];

export function isValidEmail(s) {
  const e = String(s || '').trim();
  return e.length > 0 && e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

// Ensure the contact block exists and is well-typed (defensive; mirrors migrate).
export function ensureContact(profile) {
  if (!profile.contact || typeof profile.contact !== 'object' || Array.isArray(profile.contact)) {
    profile.contact = {};
  }
  const c = profile.contact;
  if (typeof c.consent !== 'boolean') c.consent = false;
  if (typeof c.email !== 'string') c.email = '';
  if (c.consentedAt === undefined) c.consentedAt = null;
  return c;
}

// Opt in with an email. Throws on an invalid email so the UI can show inline help.
// Touches ONLY profile.contact — never research, never an installId.
export function setContact(profile, email, opts = {}) {
  const c = ensureContact(profile);
  const e = String(email || '').trim();
  if (!isValidEmail(e)) throw new Error('Please enter a valid email address.');
  c.consent = true;
  c.email = e;
  c.consentedAt = opts.now || new Date().toISOString();
  return profile;
}

// Withdraw: deletes the email and turns the consent off. Leaves research untouched.
export function clearContact(profile) {
  const c = ensureContact(profile);
  c.consent = false;
  c.email = '';
  c.consentedAt = null;
  return profile;
}
