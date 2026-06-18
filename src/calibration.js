// src/calibration.js — confidence-accuracy CALIBRATION (the "is your self-assessment honest?"
// judgment measure, in the AI-age spirit of knowing when you actually know vs should verify).
//
// Behavioral and SELF-INCRIMINATING by construction: to score well you must actually be RIGHT
// when you say you're confident — you can't fake it without the knowledge. So, unlike the obscured
// measures, this one is fully TRANSPARENT about how it's scored (that transparency teaches the
// calibration concept rather than corrupting the measure — the obscuring directive does NOT apply).
// Pure, no DOM.
//
// Items are two-alternative (2AFC): confidence lives in [50,100] (below 50 is incoherent — you'd
// just switch answers). conf_prob = confidence/100 ∈ [0.5,1.0] is literally P(my answer is correct).
// (Brier 1950; the over/under-confidence O/U index; Lichtenstein & Fischhoff calibration literature.)

export const CALIBRATION_MIN = 10;        // hard floor: never report below this many scored items
export const CALIBRATION_DEADBAND = 0.10; // ± band around zero bias that reads as "well-calibrated"

// Honest caveats the UI must state (centralized here so the screen renders them verbatim).
export const CALIBRATION_CAVEATS = [
  'This is calibration on general-knowledge questions — it does not transfer cleanly to your real decisions, your work, or your faith.',
  'It is one sitting of a handful of questions; how hard the questions happen to be shapes the result.',
  'It is a formation mirror, not a trait and not a diagnosis.',
];

function clean(trials) {
  return (Array.isArray(trials) ? trials : []).filter(
    (t) => t && typeof t.confidence === 'number' && t.confidence >= 50 && t.confidence <= 100 && typeof t.correct === 'boolean'
  );
}

// Score a set of {confidence:50..100, correct:bool} trials.
//  - bias  = mean(conf_prob) − accuracy  (HEADLINE; + = overconfident, − = underconfident)
//  - brier = mean((conf_prob − correct)^2)  (builder-secondary; conflates calibration + resolution,
//            so it is NOT decomposed at this n — the binning that needs would be pure noise)
export function calibrationScore(trials) {
  const list = clean(trials);
  const n = list.length;
  if (n < CALIBRATION_MIN) return { n, ready: false };
  let sumProb = 0, sumCorrect = 0, sumBrier = 0;
  for (const t of list) {
    const p = t.confidence / 100;
    const c = t.correct ? 1 : 0;
    sumProb += p; sumCorrect += c; sumBrier += (p - c) * (p - c);
  }
  const meanConf = sumProb / n;     // 0.5..1.0
  const accuracy = sumCorrect / n;  // 0..1
  return { n, ready: true, accuracy, meanConf, bias: meanConf - accuracy, brier: sumBrier / n };
}

// 3-level directional reading with a dead-band, handled ASYMMETRICALLY: an overconfident result is
// mirrored plainly (the safe, useful direction); an underconfident result is NOT pushed toward "be
// more confident" (the documented harm) — it's simply reflected. Never a verdict, never a number-chase.
export function calibrationReading(score) {
  if (!score || !score.ready) {
    return { level: 'not-ready', note: `Answer at least ${CALIBRATION_MIN} to see a read — fewer is too noisy to mean anything.` };
  }
  const pts = Math.round(score.bias * 100);
  const acc = Math.round(score.accuracy * 100);
  if (score.bias >= CALIBRATION_DEADBAND) {
    return { level: 'overconfident', note: `On these questions you were about ${pts} points more confident than accurate (${acc}% right). Worth noticing where certainty ran ahead of knowledge — that gap is the cue to slow down and check.` };
  }
  if (score.bias <= -CALIBRATION_DEADBAND) {
    return { level: 'underconfident', note: `You were actually more accurate (${acc}% right) than you felt here. On this set your caution cost you nothing — you may know more than you give yourself credit for.` };
  }
  return { level: 'well-calibrated', note: `Your confidence tracked your accuracy closely here (${acc}% right) — a well-calibrated read on what you do and don't know.` };
}

// Optional coarse 2-bin summary — only meaningful at >= 15 items, and each bin only shown when it
// holds >= 5 items (else it is sampling noise dressed as a finding). "Fairly sure" (<=70%) vs "very
// sure" (>=80%); the 75% middle is dropped to keep the bins clean. Returns null when not enough.
export function calibrationBins(trials) {
  const list = clean(trials);
  if (list.length < 15) return null;
  const bin = (pred) => {
    const items = list.filter(pred);
    if (items.length < 5) return null;
    return { n: items.length, accuracy: items.filter((t) => t.correct).length / items.length };
  };
  return { fairlySure: bin((t) => t.confidence <= 70), verySure: bin((t) => t.confidence >= 80) };
}
