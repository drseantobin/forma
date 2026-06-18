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
// An UNSCORED session (an AI-scored reflection the model couldn't grade — no key,
// API failure, bad parse) is recorded for the streak but produced no measurement,
// so it must NOT count as evidence either.
// Pure functions, no DOM — fully testable.

import { activeDomainIds } from './domains.js';
import { getConstruct } from './constructs.js';

// How many direct measurements stand behind a domain's scale.
export function domainEvidence(profile, domainId) {
  const sessions = (profile.sessions || []).filter((s) => s.domain === domainId && !s.unscored).length;
  const hasBaseline = !!(profile.baseline && profile.baseline.domainScores
    && profile.baseline.domainScores[domainId] != null);
  return { sessions, hasBaseline, evidence: sessions + (hasBaseline ? 1 : 0) };
}

// Practice-type reps (contemplation / reflection) are unscored BY NATURE — they're
// formation, not failed measurements — so they must NOT count toward "scale frozen."
// Mirrors exercises.exerciseMode; kept tiny here to avoid a module cycle.
const PRACTICE_TYPES = new Set(['contemplation', 'reflection']);

// Honest staleness signal (scientific-validity review, v152). The v138 gate correctly
// leaves a RE-SERVED keyed item unscored — but once a small keyed bank is exhausted,
// EVERY further session in that domain is unscored, so the scale FREEZES while
// confidence() keeps reporting "building/established" off past sessions. The number
// looks MORE trustworthy as it stops being measured. Detect it: if the recent
// MEASURE-type sessions in a domain were all unscored, the items are used up and the
// scale is no longer live. (Generated tasks — n-back/vigilance/etc. — make fresh
// content every time, so they never trip this; it fires for exhausted keyed banks.)
export function scaleFreshness(profile, domainId) {
  const measures = (profile.sessions || []).filter((s) => s.domain === domainId && !PRACTICE_TYPES.has(s.type));
  const recent = measures.slice(-3); // 3 consecutive unscored measures = bank clearly exhausted
  const frozen = recent.length >= 3 && recent.every((s) => s.unscored);
  return { frozen, recentMeasures: recent.length };
}

// Confidence band for a domain scale. Thresholds are deliberately conservative:
// a single data point is always 'provisional', and 'established' takes a real
// streak of measurement. { level, label, sessions, evidence, frozen }.
export function confidence(profile, domainId) {
  const { sessions, hasBaseline, evidence } = domainEvidence(profile, domainId);
  let level = 'provisional';
  if (evidence >= 5) level = 'established';
  else if (evidence >= 2) level = 'building';
  const { frozen } = scaleFreshness(profile, domainId);
  // `level` is left intact (indexConfidence/milestoneEligible branch on it); the
  // honest staleness rides alongside as `frozen` + an overriding label.
  const label = frozen
    ? 'Items used up — not re-measured lately'
    : { provisional: 'Provisional', building: 'Building', established: 'Established' }[level];
  return { level, label, sessions, hasBaseline, evidence, frozen };
}

// A short, honest UI tag — only worth showing until the score is established
// (once established the number can stand on its own). Returns '' when established.
export function confidenceTag(profile, domainId) {
  const c = confidence(profile, domainId);
  // Surface staleness even on an otherwise-"established" scale — the one place the
  // old tag lied by omission (an exhausted bank read as a settled number).
  if (c.frozen) return 'Items used up — keep practicing; fresh measures coming';
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

// Confidence in the HEADLINE composite (Formation Index). The per-domain
// confidence above is never felt by the user at the top-line number — so a
// brand-new profile shows a bare, authoritative "62" identical to a fully
// measured, long-tenured one. This aggregates: the index is "thin" (provisional)
// when fewer than half the active capacities are measured, or most of those are
// still provisional, or there are fewer than two. Returns a note for callers to
// show next to the headline, so the composite carries the humility the domains do.
export function indexConfidence(profile) {
  const faith = !!(profile && profile.settings && profile.settings.faithTrack);
  const ids = activeDomainIds(faith);
  const scores = (profile && profile.domainScores) || {};
  const scored = ids.filter((id) => scores[id] != null);
  const covered = scored.length;
  const total = ids.length;
  const provisional = scored.filter((id) => confidence(profile, id).level === 'provisional').length;
  const thin = covered < 2 || covered < total / 2 || provisional > covered / 2;
  return {
    covered,
    total,
    thin,
    note: thin ? `Provisional · ${covered} of ${total} capacities measured` : '',
  };
}

const _LEVEL_ORDER = { provisional: 0, building: 1, established: 2 };

// Confidence in a CONSTRUCT profile (the v184 construct layer). A construct is only as trustworthy
// as its WEAKEST measured facet — and, per the honesty contract, it is NEVER a validated single score
// yet (`validated` stays false until a CFA on pooled data beats a 1-factor g model). So this reports
// PROFILE confidence: how many member facets are measured, the weakest facet's level, whether any
// bank is frozen — always framed as a provisional profile, never a settled construct score. Only
// domain-backed facets count here; standalone instruments roll in once they persist scores. Pure.
export function constructConfidence(profile, constructId) {
  const c = getConstruct(constructId);
  const memberDomains = c ? c.facets.flatMap((f) => f.domains || []) : [];
  const scores = (profile && profile.domainScores) || {};
  const measuredIds = memberDomains.filter((d) => scores[d] != null);
  const total = memberDomains.length;
  const measured = measuredIds.length;
  if (!c || measured === 0) {
    return { constructId, measured: 0, total, frozenAny: false, worstLevel: null, thin: true, validated: false, note: 'Not yet measured' };
  }
  let worstOrder = 99, frozenAny = false;
  for (const d of measuredIds) {
    const cf = confidence(profile, d);
    if (_LEVEL_ORDER[cf.level] < worstOrder) worstOrder = _LEVEL_ORDER[cf.level];
    if (cf.frozen) frozenAny = true;
  }
  const worstLevel = Object.keys(_LEVEL_ORDER).find((k) => _LEVEL_ORDER[k] === worstOrder) || 'provisional';
  const thin = measured < total || worstLevel === 'provisional' || frozenAny;
  const note = frozenAny
    ? `Provisional profile · some items used up · ${measured} of ${total} facets`
    : `${thin ? 'Provisional' : 'Profile'} · ${measured} of ${total} facets measured`;
  return { constructId, measured, total, frozenAny, worstLevel, thin, validated: false, note };
}
