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
import { pickExercise, makeNBackExercise, CRT, makeStreamExercise, makeContemplation, STAY, makeVigilanceExercise } from './exercises.js';
import { recentSeenIds } from './profile.js';
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
    // Alternate the n-back trainer with sequence recall so neither plateaus.
    if (!recentTypes.includes('nback')) return makeNBackExercise(level, rng);
    return pickExercise('memory', { level, seenIds: seen, rng });
  }

  if (focus === 'judgment') {
    // Alternate cognitive-reflection ("The Lure") with decision scenarios.
    if (!recentTypes.includes('crt')) return pickFrom(CRT, seen, rng);
    return pickExercise('judgment', { seenIds: seen, rng });
  }

  if (focus === 'attention') {
    // Rotate the live vigilance test, the SART "Stream", and deep reading so the
    // attention scale is sampled by several distinct task types.
    const level = Math.max(1, Math.round(score / 25));
    if (!recentTypes.includes('vigilance')) return makeVigilanceExercise(level);
    if (!recentTypes.includes('stream')) return makeStreamExercise(level, rng);
    return pickExercise('attention', { seenIds: seen, rng });
  }

  if (focus === 'persistence') {
    // Alternate the behavioral "Stay" drill with a frustration-tolerance reflection.
    if (!recentTypes.includes('stay')) return pickFrom(STAY, seen, rng);
    return pickExercise('persistence', { seenIds: seen, rng });
  }

  if (focus === 'interior') {
    // Alternate the contemplative-silence timer with a spiritual reflection.
    const level = Math.max(1, Math.round(score / 25));
    if (!recentTypes.includes('contemplation')) return makeContemplation(level);
    return pickExercise('interior', { seenIds: seen, rng });
  }

  const level = Math.max(1, Math.round(score / 20));
  return pickExercise(focus, { level, seenIds: seen, rng });
}

function pickFrom(list, seenIds, rng = Math.random) {
  const fresh = list.filter((c) => !seenIds.includes(c.id));
  const pool = fresh.length ? fresh : list;
  return pool[Math.floor(rng() * pool.length)];
}
