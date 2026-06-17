// scoring.js — the scoring engine. Pure functions, no side effects, fully
// testable. Every measure resolves to a 0–100 scale so domains are comparable
// and the longitudinal "scales" the spec calls for line up cleanly.

export function clamp(n, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, n));
}

export function round(n) {
  return Math.round(n);
}

// --- Self-report Likert → 0..100, with reverse scoring ---
// `points` = number of scale options (5 for daily self-ratings, 7 for the
// baseline). Reverse flips around the midpoint regardless of scale length.
export function scoreLikert(value, reverse = false, points = 5) {
  const v = reverse ? (points + 1) - value : value;
  return clamp(((v - 1) / (points - 1)) * 100);
}

// Baseline: average each domain's item scores → { domainId: 0..100 }
export function domainScoresFromBaseline(items, responses, points = 5) {
  const sums = {};
  const counts = {};
  for (const item of items) {
    const raw = responses[item.id];
    if (raw == null) continue;
    const s = scoreLikert(raw, item.reverse, points);
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

// --- Pursuit tracking: proportion of time the cursor stayed on the target ---
// Validated visuomotor sustained-attention paradigm. onFrames/totalFrames.
export function scorePursuit(onFrames, totalFrames) {
  if (!totalFrames) return 0;
  return clamp(round((onFrames / totalFrames) * 100));
}

// --- Maze/cloze reading: proportion of blanks filled with the right word ---
export function scoreMaze(answers, blanks) {
  if (!blanks || !blanks.length) return 0;
  let correct = 0;
  blanks.forEach((b, i) => { if (answers[i] === b.answer) correct++; });
  return round((correct / blanks.length) * 100);
}

// --- Mental Math fluency: throughput (correct answers vs a target) ---
export function scoreMathFluency(correct, target = 14) {
  if (!target) return 0;
  return clamp(round((correct / target) * 100));
}

// --- Contemplation (interior-life silence practice) ---
// Staying the whole time is the rep, so completion sets the ceiling. An honest
// self-rating of presence (1..7, scattered..fully present) then modulates within
// it — but someone who sat the full time while distracted still floors at half
// credit, because showing up and coming back IS the practice. When no presence
// rating is given (older sessions), fall back to pure completion.
export function scoreContemplation(seconds, targetSeconds, presence = null) {
  if (!targetSeconds) return 0;
  const completion = Math.min(1, (seconds || 0) / targetSeconds);
  if (presence == null) return clamp(round(completion * 100));
  const p = Math.max(0, Math.min(1, (presence - 1) / 6));
  return clamp(round(completion * 100 * (0.5 + 0.5 * p)));
}

// Shared mapping from a (median) reaction time in ms to a 0–100 attention score,
// so the live vigilance test and the Focus Check score the same RT identically.
// Anchors: 250ms→90, 450ms→60, 650ms→30 (slope -0.15, intercept 127.5).
export function rtToAttentionScore(ms) {
  return clamp(round(127.5 - 0.15 * ms));
}

// --- Vigilance (Psychomotor Vigilance Task lineage): live sustained attention ---
// trials: [{rt:number} | {rt:null,miss:true} | {falseStart:true}]. Faster median
// reaction = sharper attention; lapses (slow RTs), misses, and pressing early all
// cost. This is a genuine performance measure, not self-report.
export function scoreVigilance(trials) {
  if (!trials || !trials.length) return 0;
  const valid = trials.filter((t) => typeof t.rt === 'number' && !t.falseStart);
  const falseStarts = trials.filter((t) => t.falseStart).length;
  const misses = trials.filter((t) => t.miss).length;
  if (!valid.length) return clamp(8 - falseStarts * 2 - misses);
  const rts = valid.map((t) => t.rt).sort((a, b) => a - b);
  const m = Math.floor(rts.length / 2);
  const medRT = rts.length % 2 ? rts[m] : (rts[m - 1] + rts[m]) / 2;
  const lapses = valid.filter((t) => t.rt > 500).length;
  const score = rtToAttentionScore(medRT) - (lapses * 3 + falseStarts * 5 + misses * 6);
  return clamp(round(score));
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
  // Length bonus only on PERFECT long recall (its stated intent) — so it doesn't
  // silently inflate partial recalls on long sequences.
  const lengthBonus = (sequence.length >= 7 && proportion === 1) ? 1.05 : 1.0;
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
// Reflective/correct = 100; took the intuitive lure = 40 (you engaged the problem
// in the expected way, just didn't override); other wrong = 25 (didn't read it
// carefully). Always formative — the explanation names the bias — so never zeroed.
export function scoreCRT(optionId, options) {
  const opt = options.find((o) => o.id === optionId);
  if (!opt) return 0;
  if (opt.kind === 'reflective') return 100;
  if (opt.kind === 'intuitive') return 40;
  return 25;
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
    case 'digitspan':
      // Recall is entered backward, so score against the reversed digit list.
      return scoreMemory(response.recalled || [], exercise.digits.slice().reverse());
    case 'decision':
    case 'tradeoff':
    case 'stem':
    case 'comm':
    case 'attend':
      // SJT family (judgment / emotion-management / communication / presence): the
      // chosen option carries its rated effectiveness score, same mechanism throughout.
      return scoreDecision(response.optionId, exercise.options);
    case 'matrix':
      // Fluid-reasoning item: right or wrong, but a wrong attempt still engaged.
      return response.optionId === exercise.answer ? 100 : 35;
    case 'crt':
      return scoreCRT(response.optionId, exercise.options);
    case 'nback':
      return scoreNBack(response.flagged || [], exercise.targets, exercise.sequence.length, exercise.n);
    case 'stream':
      return scoreStream(response.tapped || [], exercise.items);
    case 'stay':
      return scoreStay(response.stayed, response.selfRating);
    case 'contemplation':
      return scoreContemplation(response.seconds || 0, exercise.targetSeconds, response.presence != null ? response.presence : null);
    case 'vigilance':
      return scoreVigilance(response.trials || []);
    case 'vignette':
    case 'sentence':
      // Scored by Claude in the UI before completion; stored on the response.
      return clamp(round(response.aiScore != null ? response.aiScore : 60));
    case 'mathfluency':
      return scoreMathFluency(response.correct || 0, exercise.target);
    case 'maze':
      return scoreMaze(response.answers || [], (exercise.parts || []).filter((p) => p.blank).map((p) => p.blank));
    case 'pursuit':
      return scorePursuit(response.onFrames || 0, response.totalFrames || 0);
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
