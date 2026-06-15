// scoring.js — the scoring engine. Pure functions, no side effects, fully
// testable. Every measure resolves to a 0–100 scale so domains are comparable
// and the longitudinal "scales" the spec calls for line up cleanly.

export function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function round(n) {
  return Math.round(n);
}

// --- Self-report Likert (1..5) → 0..100, with reverse scoring ---
export function scoreLikert(value, reverse = false) {
  const v = reverse ? 6 - value : value; // reverse: 1↔5, 2↔4, 3↔3
  return clamp(((v - 1) / 4) * 100);
}

// Baseline: average each domain's item scores → { domainId: 0..100 }
export function domainScoresFromBaseline(items, responses) {
  const sums = {};
  const counts = {};
  for (const item of items) {
    const raw = responses[item.id];
    if (raw == null) continue;
    const s = scoreLikert(raw, item.reverse);
    sums[item.domain] = (sums[item.domain] || 0) + s;
    counts[item.domain] = (counts[item.domain] || 0) + 1;
  }
  const out = {};
  for (const d of Object.keys(sums)) {
    out[d] = round(sums[d] / counts[d]);
  }
  return out;
}

// --- Reading comprehension: weighted by question kind ---
// Inference items (bridging ideas, drawing an unstated conclusion) predict
// comprehension better than recall items, so they carry more weight.
export function scoreReading(answerIndices, questions) {
  if (!questions.length) return 0;
  let earned = 0;
  let total = 0;
  questions.forEach((q, i) => {
    const w = q.kind === 'inference' ? 1.5 : 1;
    total += w;
    if (answerIndices[i] === q.answer) earned += w;
  });
  return round((earned / total) * 100);
}

// --- The Stream (SART go/no-go): respond to all but the rare target ---
// Inhibition (no-go accuracy) is weighted more heavily than go accuracy, since
// failed inhibition is the sustained-attention/mind-wandering signal.
export function scoreStream(tapped, items) {
  if (!items.length) return 0;
  const tset = new Set(tapped);
  let go = 0; let goCorrect = 0; let nogo = 0; let nogoCorrect = 0;
  items.forEach((it, i) => {
    if (it.nogo) { nogo++; if (!tset.has(i)) nogoCorrect++; }
    else { go++; if (tset.has(i)) goCorrect++; }
  });
  const goAcc = go ? goCorrect / go : 1;
  const nogoAcc = nogo ? nogoCorrect / nogo : 1;
  return clamp(round((goAcc * 0.4 + nogoAcc * 0.6) * 100));
}

// --- Stay (frustration tolerance): behavioral persistence + self-report ---
export function scoreStay(stayed, selfRating) {
  const behavioral = stayed ? 100 : 25;
  return clamp(round(behavioral * 0.7 + scoreSelfRating(selfRating || 3) * 0.3));
}

// --- Contemplation (interior-life silence practice): proportion of target sat ---
export function scoreContemplation(seconds, targetSeconds) {
  if (!targetSeconds) return 0;
  return clamp(round(Math.min(1, seconds / targetSeconds) * 100));
}

// --- Working memory: position-correct recall, length-weighted ---
// Reward getting items in the RIGHT position. A longer sequence recalled
// perfectly should not score lower than a short one, so we score by proportion.
export function scoreMemory(recalled, sequence) {
  if (!sequence.length) return 0;
  let hits = 0;
  for (let i = 0; i < sequence.length; i++) {
    if (recalled[i] && recalled[i] === sequence[i]) hits++;
  }
  const proportion = hits / sequence.length;
  // Small length bonus: longer sequences are harder, so a perfect long recall
  // earns a touch more credit (capped at 100).
  const lengthBonus = sequence.length >= 7 ? 1.05 : 1.0;
  return clamp(round(proportion * 100 * lengthBonus));
}

// --- Decision scenario: the chosen option carries its own reasoning score ---
export function scoreDecision(optionId, options) {
  const opt = options.find((o) => o.id === optionId);
  return opt ? clamp(opt.score) : 0;
}

// --- Reflection: honest self-rating (1..5) → 0..100 ---
// The written reflection itself is interpreted by the coach; the number comes
// from the user's own honest self-rating. (The AI coach may nuance this, but we
// never silently override the person's self-report — a trust guardrail.)
export function scoreSelfRating(value) {
  return scoreLikert(value, false);
}

// --- Cognitive Reflection ("The Lure"): did they override the intuitive pull? ---
// Reflective/correct = 100; took the intuitive lure = 30 (you can watch the bias
// happen); other wrong = 55. A wrong answer is still formative — the explanation
// names the bias — so we never zero it.
export function scoreCRT(optionId, options) {
  const opt = options.find((o) => o.id === optionId);
  if (!opt) return 0;
  if (opt.kind === 'reflective') return 100;
  if (opt.kind === 'intuitive') return 30;
  return 55;
}

// --- n-back: overall decision accuracy across judgeable positions (i >= n) ---
// correct = hits (flagged a real match) + correct rejections (didn't flag a
// non-match). Reported as a percentage. False alarms cost via lost rejections.
export function scoreNBack(flagged, targets, sequenceLength, n) {
  const judgeable = sequenceLength - n;
  if (judgeable <= 0) return 0;
  const tset = new Set(targets);
  const fset = new Set(flagged);
  const hits = targets.filter((t) => fset.has(t)).length;
  const falseAlarms = flagged.filter((f) => !tset.has(f) && f >= n).length;
  const nonTargets = judgeable - targets.length;
  const correctRejections = Math.max(0, nonTargets - falseAlarms);
  return clamp(round(((hits + correctRejections) / judgeable) * 100));
}

// Dispatch: score any completed exercise response → 0..100
export function scoreExercise(exercise, response) {
  switch (exercise.type) {
    case 'reading':
      return scoreReading(response.answers || [], exercise.questions);
    case 'memory':
      return scoreMemory(response.recalled || [], exercise.sequence);
    case 'decision':
      return scoreDecision(response.optionId, exercise.options);
    case 'crt':
      return scoreCRT(response.optionId, exercise.options);
    case 'nback':
      return scoreNBack(response.flagged || [], exercise.targets, exercise.sequence.length, exercise.n);
    case 'stream':
      return scoreStream(response.tapped || [], exercise.items);
    case 'stay':
      return scoreStay(response.stayed, response.selfRating);
    case 'contemplation':
      return scoreContemplation(response.seconds || 0, exercise.targetSeconds);
    case 'reflection':
      return scoreSelfRating(response.selfRating || 3);
    default:
      return 0;
  }
}

// --- Longitudinal update: exponential moving average ---
// A new session nudges the domain scale toward the new result without erasing
// history. alpha = how much the newest result moves the number (0.3 = gentle).
export function updateEMA(prev, sample, alpha = 0.3) {
  if (prev == null || Number.isNaN(prev)) return round(sample);
  return round(prev * (1 - alpha) + sample * alpha);
}

// --- The headline: Formation Index (weighted mean of all domains) ---
export function formationIndex(domainScores, weights = null) {
  const ids = Object.keys(domainScores);
  if (!ids.length) return 0;
  let wsum = 0;
  let total = 0;
  for (const id of ids) {
    const w = weights && weights[id] != null ? weights[id] : 1;
    total += domainScores[id] * w;
    wsum += w;
  }
  return round(total / wsum);
}
