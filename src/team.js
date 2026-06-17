// team.js — employer/team aggregate signals (the B2B layer, preview-stage).
//
// Privacy is the whole point: an employer view shows only AGGREGATED development
// signals across a team — never an individual's raw data, and NEVER the optional
// Interior Life track. There is no backend yet, so the dashboard runs on a
// deterministic sample cohort, clearly labeled as a preview.

import { DOMAINS, bandFor, BANDS } from './domains.js';

// The capacities an employer sees — the core ten, never the interior/faith track.
const CORE = DOMAINS.map((d) => d.id);

// The composite that tells an employer what they actually want to know in the
// AI transition: can this team exercise judgment over AI output, stay independent,
// read deeply, and communicate well.
export const AI_READINESS_DOMAINS = ['judgment', 'ai_autonomy', 'reading', 'communication'];

// AI-Readiness composite for a single scores map (an individual OR a team's
// per-domain averages): the mean of the four AI-transition capacities. Returns
// null when none of them have a score yet, so callers can show "—" honestly.
export function aiReadinessOf(domainScores) {
  const vals = AI_READINESS_DOMAINS
    .map((id) => domainScores && domainScores[id])
    .filter((v) => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

// A deterministic synthetic cohort (no RNG — seeded by index, so it's stable).
export function sampleCohort(n = 8) {
  const members = [];
  for (let i = 0; i < n; i++) {
    const domainScores = {};
    CORE.forEach((id, j) => {
      domainScores[id] = 42 + ((i * 17 + j * 23 + 7) % 47); // spread 42..88
    });
    members.push({ id: `Member ${i + 1}`, domainScores });
  }
  return members;
}

// Aggregate a cohort into team-level signals.
export function aggregate(members) {
  if (!members || !members.length) return { n: 0, avgIndex: 0, perDomain: {}, aiReadiness: 0 };
  const perDomain = {};
  CORE.forEach((id) => {
    const vals = members.map((m) => m.domainScores && m.domainScores[id]).filter((v) => v != null);
    perDomain[id] = vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
  });
  const avgIndex = Math.round(CORE.reduce((a, id) => a + perDomain[id], 0) / CORE.length);
  const aiReadiness = aiReadinessOf(perDomain) || 0;
  return { n: members.length, avgIndex, perDomain, aiReadiness };
}

// How a team is SPREAD across the bands for one capacity — the signal an average
// hides. Two teams can share an average of 60 while one is uniformly Strong and
// the other is half Thriving, half Emerging. Returns counts keyed by band.
export function bandDistribution(members, domainId) {
  const counts = {};
  BANDS.forEach((b) => { counts[b.key] = 0; });
  (members || []).forEach((m) => {
    const v = m.domainScores && m.domainScores[domainId];
    if (v == null) return;
    counts[bandFor(v).key] += 1;
  });
  return counts;
}

// A team's clearest strengths and development priorities, from per-domain averages
// — the actionable takeaway an employer wants. Returns sorted [{id, score}] lists.
export function teamHighlights(perDomain, n = 3) {
  const entries = Object.keys(perDomain).map((id) => ({ id, score: perDomain[id] }));
  const byScore = entries.slice().sort((a, b) => b.score - a.score);
  return {
    strengths: byScore.slice(0, n),
    priorities: byScore.slice().reverse().slice(0, n),
  };
}
