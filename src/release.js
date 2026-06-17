// release.js — the RELEASE-OF-INFORMATION consent tier (identified, opt-in, the
// individual's choice). A person may authorize sharing their results with a named
// third party (an employer). Like contact.js this is IDENTIFIED and lives in its own
// profile block, deliberately NOT linkable to the de-identified research data (no
// installId here, ever). There is no backend/employer integration yet, so this only
// RECORDS the authorization locally, server-ready; nothing is transmitted.
//
// What can be released is a CLOSED scope — only the interior-EXCLUDED Capacity
// Snapshot (scores + confidence, with its diagnosis/hiring disclaimer). The releasable
// artifact is FROZEN at authorization time (a dated copy the person actually saw), so
// later score changes never silently update what was released, and an employer can't
// treat a one-time release as a live feed. Pure functions, no DOM, no network.
//
// AUTONOMY: consent defaults OFF and can ONLY be set by the person in their own
// Settings — there is no code path, URL param, or org config that can enable it
// remotely. Revoking is a hard delete (recipient + frozen snapshot wiped).

export const RELEASE_SCHEMA = 1;
export const RELEASE_FIELDS = ['consent', 'recipient', 'scope', 'snapshot', 'consentedAt'];

export function ensureRelease(profile) {
  if (!profile.release || typeof profile.release !== 'object' || Array.isArray(profile.release)) {
    profile.release = {};
  }
  const r = profile.release;
  if (typeof r.consent !== 'boolean') r.consent = false;
  if (typeof r.recipient !== 'string') r.recipient = '';
  if (typeof r.scope !== 'string') r.scope = 'snapshot';
  if (r.snapshot === undefined) r.snapshot = null;
  if (r.consentedAt === undefined) r.consentedAt = null;
  return r;
}

// Authorize a release to a NAMED recipient, freezing a copy of the snapshot the
// person is releasing. Throws on a blank recipient (a bare yes isn't informed).
// `snapshot` is passed in by the caller (already built) — keeps this module decoupled.
export function setRelease(profile, { recipient, snapshot } = {}, opts = {}) {
  const r = ensureRelease(profile);
  const who = String(recipient || '').trim();
  if (!who) throw new Error('Name who you’re authorizing.');
  r.consent = true;
  r.recipient = who.slice(0, 120);
  r.scope = 'snapshot'; // closed enum: only ever the interior-excluded snapshot
  r.snapshot = snapshot || null; // FROZEN copy at authorization time, not a live ref
  r.consentedAt = opts.now || new Date().toISOString();
  return profile;
}

// Withdraw: a hard delete — the authorization, the recipient, and the frozen artifact
// are all wiped. (Nothing is transmitted yet, so withdrawal today is total.)
export function clearRelease(profile) {
  const r = ensureRelease(profile);
  r.consent = false;
  r.recipient = '';
  r.scope = 'snapshot';
  r.snapshot = null;
  r.consentedAt = null;
  return profile;
}
