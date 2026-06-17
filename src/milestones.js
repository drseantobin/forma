// milestones.js — earned, growth-framed celebration moments.
//
// The headline milestone is a BAND ASCENSION: a domain's longitudinal scale
// crossing into a higher band (Emerging → Developing → Strong → Thriving).
// Because the scale moves by a gentle EMA, this is rare and genuinely earned —
// it marks real measured growth, not arbitrary points. This is the substance
// behind a "staple, sticky" product: the reward is the capacity, not a token.
//
// Guardrails: we celebrate ascents ONLY (never mark a decline — growth-framing),
// and never fire on a baseline-seeded first value, since nothing has been earned
// yet. Pure functions, no DOM, fully testable.

import { BANDS, bandFor, getDomain } from './domains.js';

// Index of a score's band in BANDS (0 = Emerging … 3 = Thriving); -1 if null.
export function bandIndex(score) {
  if (score == null || Number.isNaN(score)) return -1;
  const key = bandFor(score).key;
  return BANDS.findIndex((b) => b.key === key);
}

// Did this session lift a domain's scale into a NEW, higher band?
// Returns { band, fromBand, domainId } for the band just reached, or null.
// Requires a real prior score — a first-ever (baseline-seeded) value isn't an
// achievement, so it never fires on prev == null.
// `peakIndex` is the highest band this domain has EVER reached before now (the
// high-water mark). A band only counts as "newly reached" if it clears both the
// prior session's band AND that peak — otherwise the gentle EMA oscillating back
// up over a boundary would re-celebrate a band the person already earned weeks
// ago (a hollow, recurring confetti the spec's honest-mechanics ethic forbids).
export function bandAscension(prevScore, newScore, domainId, peakIndex = -1) {
  if (prevScore == null || newScore == null) return null;
  const from = bandIndex(prevScore);
  const to = bandIndex(newScore);
  const floor = Math.max(from, peakIndex);
  if (to > floor && to >= 0) return { band: BANDS[to], fromBand: BANDS[from] || null, domainId };
  return null;
}

// Streak milestones — the habit-loop celebration, at meaningful intervals only
// (so it stays rare enough to feel earned).
const STREAK_MARKS = [3, 7, 14, 30, 50, 100, 365];
export function streakMilestone(current) {
  return STREAK_MARKS.includes(current) ? current : null;
}

// The next streak mark above the current count — for an HONEST forward-pull on
// the home streak chip ("2 days to a week"). Returns null past the top mark, so
// the horizon quietly disappears rather than inventing an endless ladder.
export function nextStreakMark(current) {
  return STREAK_MARKS.find((m) => m > (current || 0)) || null;
}

// Human copy for a band ascension. Growth-framed, specific, never hyperbolic.
export function ascensionLine(asc) {
  if (!asc) return '';
  const d = getDomain(asc.domainId);
  const name = d ? d.name : asc.domainId;
  return `You’ve reached ${asc.band.label} in ${name}`;
}
