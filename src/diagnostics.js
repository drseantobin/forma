// diagnostics.js — the BUILDER-FACING measurement dashboard's data layer. PURE, no DOM.
//
// It does not invent any new psychometrics; it AGGREGATES the signals that already exist
// (reliability.js confidence/evidence + analytics.js stability/cohort gates) into one honest
// picture of "are Forma's measures working?". Two layers, kept deliberately separate:
//   1. ON THIS DEVICE, NOW — what one person's own data can show: how many measures, how
//      confident each capacity's score is, and how STEADY repeated scores are (consistency,
//      not a true reliability coefficient — one person can't yield test-retest r).
//   2. AWAITING THE COHORT — the per-item difficulty/discrimination and test-retest r that
//      make validity DEMONSTRABLE. These need a pooled, many-person dataset (the consented
//      research pipeline → server), so on one device they're gated/empty. We surface the
//      thresholds so the instrument is visible even before the data exists.
//
// Interior/Spiritual Life is NEVER included (it's walled everywhere; callers pass non-interior ids).

import { domainEvidence, confidence, scaleFreshness, indexConfidence } from './reliability.js';
import { summarizeResearch, domainStability, ITEM_MIN_N, RETEST_MIN_PAIRS, STABILITY_MIN_SESSIONS } from './analytics.js';

// Turn the durable measured-score history into the event shape domainStability expects.
// history rows are { date, domain, newDomainScore, ... } and only measured sessions are logged,
// so every row here is a real measurement. Chronological (append order) = measurement order.
function historyAsEvents(profile) {
  const h = (profile && Array.isArray(profile.history)) ? profile.history : [];
  return h
    .filter((r) => r && r.domain && r.domain !== 'interior' && typeof r.newDomainScore === 'number')
    .map((r) => ({ domain: r.domain, score: r.newDomainScore, measured: true, day: r.date }));
}

export function builderDiagnostics(profile, domainIds) {
  const p = profile || {};
  const ids = (Array.isArray(domainIds) ? domainIds : []).filter((id) => id && id !== 'interior');
  const events = historyAsEvents(p);

  const perCapacity = ids.map((id) => {
    const ev = domainEvidence(p, id);
    const conf = confidence(p, id);
    const fr = scaleFreshness(p, id);
    const stab = domainStability(events, id); // { n, ready, meanAbsStep?, sd?, mean? }
    return {
      id,
      evidence: ev.evidence,
      level: conf.level,        // 'provisional' | 'building' | 'established'
      label: conf.label,
      frozen: !!(fr && fr.frozen),
      stability: stab,
    };
  });

  const levels = perCapacity.reduce((a, c) => { a[c.level] = (a[c.level] || 0) + 1; return a; }, {});
  const research = (p.research && Array.isArray(p.research.queue)) ? summarizeResearch(p.research.queue) : null;
  const focus = (Array.isArray(p.focusChecks) ? p.focusChecks : []);
  const bestMs = focus.reduce((m, f) => (f && typeof f.medianMs === 'number' && (m == null || f.medianMs < m)) ? f.medianMs : m, null);

  return {
    measuredSessions: events.length,
    daysOfData: new Set(events.map((e) => e.day).filter(Boolean)).size,
    index: indexConfidence(p),     // { covered, total, thin, note }
    levels,                        // count by confidence level
    perCapacity,
    research,                      // null when research-sharing is off (no cohort contribution)
    focusChecks: { n: focus.length, bestMs },
    // The cohort-only validity engine — shown as thresholds so the instrument is legible
    // before the data exists. On one device these stats are always suppressed.
    cohortGates: {
      itemMinN: ITEM_MIN_N,
      retestMinPairs: RETEST_MIN_PAIRS,
      stabilityMin: STABILITY_MIN_SESSIONS,
    },
  };
}
