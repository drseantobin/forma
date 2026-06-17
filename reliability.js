// reliability.js — measurement confidence for each domain scale.
//
// A score backed by one noisy session must not look as authoritative as one
// backed by twenty. For an employer-facing CREDENTIAL and for honest formation,
// the platform has to say how much evidence stands behind a number. This is the
// difference between a real measurement instrument and a vanity metric.
//
// Evidence = the baseline estimate (if present) + each session that directly
// measured the domain (primary domain of the session). Secondary credit nudges
// the scale but isn't a direct measurement, so it doesn't raise confidence.
// Pure functions, no DOM — fully testable.

// How many direct measurements stand behind a domain's scale.
export function domainEvidence(profile, domainId) {
  const sessions = (profile.sessions || []).filter((s) => s.domain === domainId).length;
  const hasBaseline = !!(profile.baseline && profile.baseline.domainScores
    && profile.baseline.domainScores[domainId] != null);
  return { sessions, hasBaseline, evidence: sessions + (hasBaseline ? 1 : 0) };
}

// Confidence band for a domain scale. Thresholds are deliberately conservative:
// a single data point is always 'provisional', and 'established' takes a real
// streak of measurement. { level, label, sessions, evidence }.
export function confidence(profile, domainId) {
  const { sessions, hasBaseline, evidence } = domainEvidence(profile, domainId);
  let level = 'provisional';
  if (evidence >= 5) level = 'established';
  else if (evidence >= 2) level = 'building';
  const label = { provisional: 'Provisional', building: 'Building', established: 'Established' }[level];
  return { level, label, sessions, hasBaseline, evidence };
}

// A short, honest UI tag — only worth showing until the score is established
// (once established the number can stand on its own). Returns '' when established.
export function confidenceTag(profile, domainId) {
  const c = confidence(profile, domainId);
  if (c.level === 'established') return '';
  const n = c.sessions;
  const basis = n === 0 ? 'baseline only' : `${n} session${n === 1 ? '' : 's'}`;
  return `${c.label} · ${basis}`;
}

// Should an earned-milestone celebration fire for this domain? Only once there's
// enough evidence that a band crossing reflects real growth, not a lucky single
// session swinging the EMA across a boundary. (Tightens the v25 milestone.)
export function milestoneEligible(profile, domainId) {
  return domainEvidence(profile, domainId).evidence >= 3;
}
