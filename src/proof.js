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

import { clamp, round, rtToAttentionScore, ANTICIPATION_MS, isValidReaction } from './scoring.js';
import { domainTrend, daysBetween, todayStr } from './progress.js';

// Map a median reaction time (ms) from the Focus Check to a 0–100 score, using
// the same mapping as the live vigilance test so identical performance scores
// identically across both attention measures.
export function scoreFocusCheck(medianMs) {
  return rtToAttentionScore(medianMs);
}

// Anticipation handling lives in scoring.js (shared with the live vigilance
// test); re-exported here so the Focus Check UI and tests keep importing it
// from proof.js.
export { ANTICIPATION_MS, isValidReaction };

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
  // The sparkline must span the SAME range as the delta the header reports
  // (baseline → current). `t.points` holds only post-baseline sessions (the
  // baseline never enters history), so plotting it alone amputates the
  // baseline→session-1 growth and visibly understates progress on the very page
  // built to PROVE it. Prepend the baseline so chart and number agree.
  const series = baseline != null ? [baseline, ...t.points] : t.points;
  return { baseline, current, delta, points: t.points, series, samples: t.points.length };
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

// Naive straight-line projection of a delta out to 90 days. Deliberately
// conservative: needs a FULL WEEK of data before it will project at all (a
// 3-day fluke shouldn't drive a 90-day claim), and — when a baseline is given —
// BOUNDS the projected final to the 0–100 scale. Without this an unbounded line
// could "project" a lucky first week to +300, nonsense on a 0–100 measure and
// corrosive to the page's honest framing. Always labelled a projection, never
// a promise.
export function project90(delta, daysElapsed, baseline = null) {
  if (!daysElapsed || daysElapsed < 7 || !delta) return null;
  const projDelta = round((delta / daysElapsed) * 90);
  if (baseline == null) return projDelta;
  // Return the bounded delta so baseline + delta always lands within [0, 100].
  return clamp(baseline + projDelta, 0, 100) - baseline;
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
