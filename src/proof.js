// proof.js — the falsifiable 90-day claim, made auditable.
//
// The Forma strategy stakes the product on three measurable, user-auditable
// claims over 90 days:
//   1. Improvement in sustained reading-comprehension retention.
//   2. Reduction in AI-assisted task initiation for tasks you could do yourself
//      (i.e. rising AI-independence).
//   3. Increased recovery speed from distraction (a daily micro-test).
//
// This module turns the data Forma already collects — plus a quick reaction
// "Focus Check" — into honest, growth-framed progress metrics. Pure functions;
// no side effects. Everything is framed as evidence-for-yourself, never a verdict.

import { clamp, round, rtToAttentionScore } from './scoring.js';
import { domainTrend, daysBetween, todayStr } from './progress.js';

// Map a median reaction time (ms) from the Focus Check to a 0–100 score, using
// the same mapping as the live vigilance test so identical performance scores
// identically across both attention measures.
export function scoreFocusCheck(medianMs) {
  return rtToAttentionScore(medianMs);
}

export function median(nums) {
  if (!nums || !nums.length) return null;
  const a = [...nums].sort((x, y) => x - y);
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

// A single auditable metric from a domain's longitudinal data.
function metricFromDomain(profile, domain) {
  const t = domainTrend(profile.history || [], domain);
  const baseline = (profile.baseline && profile.baseline.domainScores && profile.baseline.domainScores[domain] != null)
    ? profile.baseline.domainScores[domain]
    : (t.first != null ? t.first : null);
  const current = (profile.domainScores && profile.domainScores[domain] != null)
    ? profile.domainScores[domain]
    : (t.latest != null ? t.latest : baseline);
  const delta = (baseline != null && current != null) ? current - baseline : 0;
  return { baseline, current, delta, points: t.points, samples: t.points.length };
}

function focusMetric(profile) {
  const fc = profile.focusChecks || [];
  const points = fc.map((c) => c.score);
  const baseline = points.length ? points[0] : null;
  const current = points.length ? points[points.length - 1] : null;
  const delta = (baseline != null && current != null) ? current - baseline : 0;
  const bestMs = fc.length ? Math.min(...fc.map((c) => c.medianMs)) : null;
  return { baseline, current, delta, points, samples: points.length, bestMs };
}

// Naive linear projection of a delta out to 90 days. Deliberately conservative:
// returns null until there's enough elapsed time to mean anything. Always
// labelled as a projection in the UI, never as a promise.
export function project90(delta, daysElapsed) {
  if (!daysElapsed || daysElapsed < 3 || !delta) return null;
  return round((delta / daysElapsed) * 90);
}

export function daysSinceBaseline(profile, today = todayStr()) {
  const start = profile.baseline && profile.baseline.date;
  return start ? Math.max(0, daysBetween(start, today)) : 0;
}

// The full proof snapshot for the UI.
export function proofMetrics(profile, today = todayStr()) {
  const daysElapsed = daysSinceBaseline(profile, today);
  return {
    daysElapsed,
    daysRemaining: Math.max(0, 90 - daysElapsed),
    reading: metricFromDomain(profile, 'reading'),
    aiIndependence: metricFromDomain(profile, 'ai_autonomy'),
    focus: focusMetric(profile),
  };
}
