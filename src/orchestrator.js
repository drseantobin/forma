// orchestrator.js — the parent process from the spec's agentic architecture.
//
// Given the current profile state, it decides the next best action for the loop
// and, when a session is due, chooses WHICH exercise modality to run for the
// planned focus domain. This is what keeps the loop varied and the measurement
// broad: each domain is sampled by more than one validated task type, which is
// more robust than leaning on any single (often only fair-reliability) task.
//
// Pure and deterministic given (profile, seenIds, recentTypes); the only
// non-determinism is the underlying exercise pickers' randomness.

import { focusForToday } from './planner.js';
import { recommendFocus } from './insights.js';
import { pickExercise, makeNBackExercise, CRT, makeStreamExercise, makeContemplation, STAY, makeVigilanceExercise, VIGNETTES, TRADEOFFS, makeMathFluency, makePursuitExercise, MAZE, SENTENCES, makeDigitSpan, MATRICES, STEM, COMM } from './exercises.js';
import { recentSeenIds } from './profile.js';
import { hasKey } from './coach.js';
import { todayStr } from './progress.js';

// Today's focus domain: the weekly plan leads; the generic heuristic backs it up.
export function nextFocus(profile, today = todayStr()) {
  return focusForToday(profile, today) || recommendFocus(profile);
}

// Decide the next action for the loop (used to label Home / drive the CTA).
export function nextAction(profile, today = todayStr()) {
  if (!profile.baseline) return { kind: 'onboard' };
  const doneToday = (profile.sessions || []).some((s) => s.date === today);
  const focus = nextFocus(profile, today);
  // Nudge a Focus Check roughly twice a week for the distraction-recovery metric.
  const lastFocus = (profile.focusChecks || [])[ (profile.focusChecks || []).length - 1 ];
  const focusStale = !lastFocus || (today > lastFocus.date && hashDay(today) % 3 === 0);
  return {
    kind: doneToday ? 'done' : 'session',
    focus,
    suggestFocusCheck: !!focusStale,
  };
}

function hashDay(dateStr) {
  let h = 0;
  for (let i = 0; i < dateStr.length; i++) h = (h * 31 + dateStr.charCodeAt(i)) >>> 0;
  return h;
}

// Choose the actual exercise for this session: the planned focus domain, with a
// modality chosen by current level and recent variety.
export function chooseExercise(profile, opts = {}) {
  const rng = opts.rng || Math.random;
  const focus = opts.focus || nextFocus(profile);
  const score = (profile.domainScores && profile.domainScores[focus]) ?? 40;
  const seen = recentSeenIds(profile);
  const recentTypes = (profile.sessions || []).slice(-3).map((s) => s.type);

  if (focus === 'memory') {
    const level = Math.max(1, Math.round(score / 25));
    // Rotate the n-back trainer, timed mental math, and sequence recall.
    if (!recentTypes.includes('nback')) return makeNBackExercise(level, rng);
    if (!recentTypes.includes('mathfluency')) return makeMathFluency(level);
    if (!recentTypes.includes('digitspan')) return makeDigitSpan(level, rng);
    return pickExercise('memory', { level, seenIds: seen, rng });
  }

  if (focus === 'judgment') {
    // Rotate cognitive-reflection ("The Lure"), matrix reasoning, and decisions.
    if (!recentTypes.includes('crt')) return pickFrom(CRT, seen, rng);
    if (!recentTypes.includes('matrix')) return pickFrom(MATRICES, seen, rng);
    return pickExercise('judgment', { seenIds: seen, rng });
  }

  if (focus === 'attention') {
    // Rotate the vigilance test, the "Follow the Dot" pursuit tracker, the SART
    // "Stream", and deep reading — several distinct attention task types.
    const level = Math.max(1, Math.round(score / 25));
    if (!recentTypes.includes('vigilance')) return makeVigilanceExercise(level);
    if (!recentTypes.includes('pursuit')) return makePursuitExercise(level);
    if (!recentTypes.includes('stream')) return makeStreamExercise(level, rng);
    return pickExercise('attention', { seenIds: seen, rng });
  }

  if (focus === 'reading') {
    // Alternate the maze/cloze test with full-passage comprehension.
    if (!recentTypes.includes('maze')) return pickFrom(MAZE, seen, rng);
    return pickExercise('reading', { seenIds: seen, rng });
  }

  if (focus === 'persistence') {
    // Alternate the behavioral "Stay" drill with a frustration-tolerance reflection.
    if (!recentTypes.includes('stay')) return pickFrom(STAY, seen, rng);
    return pickExercise('persistence', { seenIds: seen, rng });
  }

  if (focus === 'ai_autonomy') {
    // "The Trade" scenario activity, alternated with a reflection.
    if (!recentTypes.includes('tradeoff')) return pickFrom(TRADEOFFS, seen, rng);
    return pickExercise('ai_autonomy', { seenIds: seen, rng });
  }

  if (focus === 'communication') {
    // The AI-scored vignette is the richest showcase for communication, but it
    // needs a live key. With a key, lead with the vignette. Without one, the
    // keyless communication SJT is still a real performance measure (so this
    // AI-Readiness pillar isn't self-report only) — rotated with reflection.
    if (hasKey(profile) && !recentTypes.includes('vignette')) return pickFrom(VIGNETTES, seen, rng);
    if (!recentTypes.includes('comm')) return pickFrom(COMM, seen, rng);
    return pickExercise('communication', { seenIds: seen, rng });
  }

  if (focus === 'emotion_regulation') {
    // STEM (validated emotion-management SJT) is the performance measure here;
    // alternate it with a reflection so it isn't the same item every time.
    if (!recentTypes.includes('stem')) return pickFrom(STEM, seen, rng);
    return pickExercise('emotion_regulation', { seenIds: seen, rng });
  }

  if (focus === 'interior') {
    // Alternate the contemplative-silence timer with a spiritual reflection.
    const level = Math.max(1, Math.round(score / 25));
    if (!recentTypes.includes('contemplation')) return makeContemplation(level);
    return pickExercise('interior', { seenIds: seen, rng });
  }

  if (focus === 'values') {
    // The AI-scored sentence-completion is the showcase for self-knowledge;
    // needs a live key. Otherwise a values reflection.
    if (hasKey(profile) && !recentTypes.includes('sentence')) return pickFrom(SENTENCES, seen, rng);
    return pickExercise('values', { seenIds: seen, rng });
  }

  const level = Math.max(1, Math.round(score / 20));
  return pickExercise(focus, { level, seenIds: seen, rng });
}

function pickFrom(list, seenIds, rng = Math.random) {
  const fresh = list.filter((c) => !seenIds.includes(c.id));
  const pool = fresh.length ? fresh : list;
  return pool[Math.floor(rng() * pool.length)];
}
