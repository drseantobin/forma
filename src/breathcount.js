// src/breathcount.js — Breath-Counting Task scoring (BCT; Levinson, Stoll, Kindy, Merry &
// Davidson 2014; Wong et al. 2018). An OBJECTIVE meta-awareness / sustained-attention measure:
// the person silently counts breaths, tapping "breath" for 1-8 and a separate "ninth" on breath 9,
// restarting at 1; a "lost count" reset when they notice they've drifted. Pure, no DOM.
//
// Raw input is an ordered event list: { type: 'B'|'N'|'R', t?: ms }. A cycle closes on each N
// (correct iff exactly 8 B preceded it) or on an R (a self-caught miscount). A span that runs past
// the cap with no N is an UNCAUGHT miss (the person has lost the task — crediting it would inflate
// the denominator with non-data).
//
// TWO separable signals, never collapsed (this is the crux): ACCURACY = counting fidelity /
// sustained attention; RESET RATE = meta-awareness CONDITIONAL on having drifted (what fraction of
// your errors you caught yourself). A person can have mediocre accuracy but excellent reset rate —
// drifty yet self-aware — and that real profile must survive scoring.

export const BCT_CAP = 18;          // 2× the 9-count target: a span this long with no N = lost the task
export const BCT_MIN_CYCLES = 6;    // floor: a proportion over fewer closed cycles is noise, not a score
export const BCT_MIN_BREATH_MS = 1500; // a real breath is slower than this; faster mean B-spacing ⇒ gaming
export const BCT_CV_FLOOR = 0.08;   // real breathing varies; near-metronomic B-spacing ⇒ gaming

export function breathCountScore(events) {
  const evs = (Array.isArray(events) ? events : []).filter((e) => e && (e.type === 'B' || e.type === 'N' || e.type === 'R'));
  let bInCycle = 0, lastB = null;
  let correct = 0, incorrectNine = 0, selfCaught = 0, uncaught = 0;
  const intervals = [];
  for (const e of evs) {
    if (e.type === 'B') {
      if (lastB != null && typeof e.t === 'number') intervals.push(e.t - lastB);
      lastB = typeof e.t === 'number' ? e.t : lastB;
      bInCycle += 1;
      if (bInCycle >= BCT_CAP) { uncaught += 1; bInCycle = 0; lastB = null; } // runaway auto-close
    } else if (e.type === 'N') {
      if (bInCycle === 8) correct += 1; else incorrectNine += 1;
      bInCycle = 0; lastB = null;
    } else if (e.type === 'R') {
      selfCaught += 1; bInCycle = 0; lastB = null;
    }
  }
  const errors = incorrectNine + selfCaught + uncaught;
  const closedCycles = correct + errors;
  const base = { closedCycles, correct, incorrectNine, selfCaught, uncaught };
  if (closedCycles < BCT_MIN_CYCLES) return { ...base, ready: false };

  // ACCURACY: Levinson-faithful — every error (incl. a self-caught one) is in the denominator AND
  // counted as a miss, so the number is comparable to the published ~16-22% lab error rate.
  const accuracy = correct / closedCycles;
  // RESET RATE: of ALL the errors (the times you lost count), what fraction did you catch yourself —
  // Levinson's "% of errors self-caught" (~29-35%). The meta-awareness signal; reported on its own,
  // NEVER subtracted from accuracy a second time.
  const resetRate = errors > 0 ? selfCaught / errors : null;

  // GAMING DEFENSE (the biggest validity threat: unverifiable self-administration). Mechanical
  // tapping with no real breathing yields near-perfect accuracy that masquerades as elite attention.
  let suspectGaming = false;
  if (intervals.length >= 8) {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (intervals.length - 1);
    const cv = mean > 0 ? Math.sqrt(variance) / mean : 0;
    if (mean < BCT_MIN_BREATH_MS || cv < BCT_CV_FLOOR) suspectGaming = true;
  }
  return { ...base, ready: true, accuracy, resetRate, suspectGaming };
}

// Honest caveats the UI must state verbatim (the breathing-unverifiable one is load-bearing).
export const BREATHCOUNT_CAVEATS = [
  'This measures meta-awareness and sustained attention — not “mindfulness,” and not how spiritual you are.',
  'We can’t verify you’re actually breathing. It trusts you to count real breaths; tapping in a rhythm without breathing only fools yourself.',
  'Losing count is normal — even practiced people miscount often. Catching yourself is the skill, which is why the reset is a feature, not a failure.',
];

// Directional, non-verdict reading. Surfaces the separable accuracy × reset-rate profile honestly,
// and never celebrates a suspected-gaming run.
export function breathCountReading(score) {
  if (!score || !score.ready) {
    return { level: 'not-ready', note: `You completed ${score ? score.correct : 0} clean cycles. Below ${BCT_MIN_CYCLES} we show your tally but not a score — too little to be honest about.` };
  }
  if (score.suspectGaming) {
    return { level: 'suspect', note: 'Your taps were unusually fast or even — this only works if you’re truly counting breaths. No score this time; try it again, unhurried and honest.' };
  }
  const acc = Math.round(score.accuracy * 100);
  const caught = score.resetRate == null ? null : Math.round(score.resetRate * 100);
  if (score.accuracy >= 0.8 && (caught == null || score.selfCaught <= 1)) {
    return { level: 'steady', note: `Steady attention — you stayed with the count ${acc}% of the time, with little drift.` };
  }
  if (caught != null && score.resetRate >= 0.5) {
    return { level: 'drifty-aware', note: `Your count drifted (${acc}% clean), but you noticed and caught yourself most times — meta-awareness is doing its job. That noticing is the muscle being built.` };
  }
  return { level: 'drifting-unnoticed', note: `The count drifted (${acc}% clean) and slipped past you more than you caught — the growth edge is noticing sooner, not counting harder. The reset button is how you train the catch.` };
}
