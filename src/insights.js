// insights.js — deterministic, rule-based interpretation.
//
// Two jobs:
//   1. dailyInsight()  — the single observation the loop returns each session.
//   2. weeklyPatterns()/interpretBaseline() — the longitudinal read.
//
// This is also the OFFLINE fallback for the agentic coach: Forma must give
// genuinely useful interpretive feedback even with no API key. Every line here
// obeys the guardrails — growth framing only, never shame, never diagnose.

import { DOMAINS, domainName, bandFor, getDomain, activeDomainIds } from './domains.js';
import { domainTrend } from './progress.js';
import { scaleFreshness } from './reliability.js';

const DOMAIN_ORDER = DOMAINS.map((d) => d.id);

// --- The one daily insight ---
// Compares today's raw result against this domain's recent average and the
// user's overall pattern, and returns one honest, encouraging observation.
export function dailyInsight(session, profile) {
  const { domain, rawScore, type } = session;
  const name = domainName(domain);

  // Prior average for this domain (excluding today's session). Use only DIRECT
  // measurements of this domain: secondary-credit rows (exerciseType ".*-secondary",
  // written by applySession) carry the PRIMARY exercise's rawScore, not a real
  // measurement of this domain — including them contaminates the average and can
  // flag a genuine session as "below your recent average" when it isn't.
  // A MEASURED session appended a history row, so drop the last one (today's) before
  // averaging. An UNSCORED replay (rawScore null) appended NO row — slicing it would
  // silently discard a real prior measurement, so keep the full list in that case.
  const rows = profile.history
    .filter((h) => h.domain === domain && !String(h.exerciseType || '').endsWith('-secondary'));
  const priorScores = (rawScore != null ? rows.slice(0, -1) : rows)
    .map((h) => h.rawScore != null ? h.rawScore : h.newDomainScore);
  const priorAvg = priorScores.length
    ? priorScores.reduce((a, b) => a + b, 0) / priorScores.length
    : null;

  const streak = profile.streak?.current || 1;
  const lines = [];

  // Returning after a gap — name the return as the rep, never the absence.
  const totalSessions = (profile.sessions || []).length;
  const returnedAfterLapse = streak === 1 && totalSessions > 1;

  // Lead with CONNECTION + encouragement before any numbers (Sean): meet the person and
  // honour the rep first; the score is context that follows, never the opening verdict.
  if (returnedAfterLapse) {
    lines.push('You came back. That’s the part most people skip — not the streak, the return. Today counts double for being the harder rep.');
  } else if ([3, 7, 14, 30, 50, 100].includes(streak)) {
    // Streak milestone is the retention moment.
    lines.push(`That's ${streak} days in a row. The streak isn't the point — but the person who shows up ${streak} days running is already becoming someone different.`);
  } else {
    // The everyday case: a warm, varied opener that acknowledges the person and the effort
    // BEFORE the score, so the insight never leads with a number. Deterministic (keyed to
    // session count) so it's stable, not random.
    const openers = [
      `Good — you gave ${name} a few real minutes just now. That choice, made again and again, is the formation itself.`,
      `Nice work showing up for ${name} today. Before any number: the doing is the point, and you did it.`,
      `That’s a genuine rep on ${name}. Most people mean to and don’t — you’re here, and that’s what compounds.`,
      `You turned toward ${name} on purpose today. Hold that for a moment — it matters more than where the score lands.`,
    ];
    lines.push(openers[totalSessions % openers.length]);
  }

  if (rawScore == null) {
    // An unscored replay produced NO new measurement — never fabricate a "steady /
    // above / below" comparison (that would be NaN against priorAvg) or a band from a
    // null score. Name it honestly: the rep counts, the scale just didn't move.
    lines.push(`Reflection saved for ${name}. This one didn't add a new measurement — you'd already used the fresh items — but showing up is the rep, and the next new item will move the scale.`);
  } else if (priorAvg != null) {
    const diff = rawScore - priorAvg;
    if (diff >= 12) {
      lines.push(`Your ${name} result today was noticeably stronger than your recent average — a real step, not noise.`);
    } else if (diff <= -12) {
      lines.push(`Today's ${name} result came in below your recent average. One low session says almost nothing — what matters is that you showed up to it. Tired days are data, not failure.`);
    } else {
      lines.push(`Steady work on ${name} today — right around your recent pattern. Consistency is what compounds.`);
    }
  } else {
    // First time on this domain.
    const band = bandFor(rawScore);
    lines.push(`First session on ${name}. Today's result sits in the "${band.label}" range — your starting line, nothing more. ${band.note}`);
  }

  // Type-specific closing nudge — grounded in the exact capacity just trained,
  // so every modality lands a specific, on-thesis line (not a generic one).
  if (TYPE_NUDGE[type]) lines.push(TYPE_NUDGE[type]);

  return lines.join(' ');
}

// One distinct, growth-framed closing line per exercise type. Keyed by the same
// `type` strings scoreExercise dispatches on, so each session's insight ends with
// something true about THAT capacity — the part AI can't do for you.
export const TYPE_NUDGE = {
  reading: 'Reading to the end — really to the end — is countercultural now. That’s the rep.',
  maze: 'Filling the right word from context is comprehension working in real time — reading actively, not just passing your eyes over it.',
  memory: 'Every time you hold a sequence yourself instead of offloading it, you’re keeping the workbench in working order.',
  digitspan: 'Running the digits backward makes you hold AND rearrange at once — that’s working memory, not just recall.',
  nback: 'Tracking what matched a few steps back is your mind resisting the pull of only-right-now. Rare, and trainable.',
  mathfluency: 'Doing the arithmetic yourself keeps a sense of number alive — so you can still tell when an answer is simply wrong.',
  decision: 'Reasoning hygiene is a muscle: it’s built one deliberate pause at a time.',
  crt: 'The first answer that feels obvious is exactly the one worth doubting. You practiced the pause.',
  matrix: 'Finding the pattern with no instructions is fluid reasoning — the part of thinking that doesn’t come pre-packaged.',
  tradeoff: 'Independence isn’t using AI less — it’s staying awake to which efforts are worth keeping. You just named one.',
  stem: 'Managing a feeling well isn’t suppressing it — it’s choosing the response that actually helps. A skill, not a temperament.',
  steu: 'Naming which feeling a moment actually evokes is the quiet root of emotional skill — you can’t work with what you can’t name.',
  comm: 'The effective word is clear and kind at once. Most people manage one; you practiced holding both.',
  attend: 'Being with someone without fixing them is harder than it sounds — the urge to help pulls you out of presence. You practiced staying.',
  vignette: 'How you’d actually respond — not what you know you should say — is where communication lives. You worked the real thing.',
  sentence: 'What you completed without stopping to think says more than a careful answer would. Self-knowledge starts with noticing it.',
  reflection: 'Naming it honestly is most of the work here. You can’t form what you won’t look at.',
  stay: 'Staying with the hard thing a little past the urge to quit — that’s the whole muscle. You just trained it.',
  contemplation: 'Sitting in silence and coming back when you drift IS the practice. Nothing to achieve, only to return to.',
  vigilance: 'Holding attention on the dull and unchanging is harder than it sounds — and exactly what distraction erodes. You held.',
  pursuit: 'Keeping the target under steady attention is sustained focus made visible. Small, real, trainable.',
  stream: 'Catching yourself before the automatic response is inhibition — the brake behind every good decision.',
};

// --- Interpretive read of the baseline (onboarding result, offline version) ---
export function interpretBaseline(domainScores, name = '') {
  const entries = DOMAIN_ORDER.map((id) => ({ id, score: domainScores[id] })).filter((e) => e.score != null);
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const growth = sorted[sorted.length - 1];
  const index = Math.round(entries.reduce((a, e) => a + e.score, 0) / entries.length);

  const hi = getDomain(strongest.id);
  const lo = getDomain(growth.id);
  const greeting = name ? `${name}, here's` : "Here's";

  return [
    `${greeting} your starting profile — a snapshot of how you see yourself today, not a verdict and not yet a measurement. The only honest use of a baseline is as the line you grow from.`,
    ``,
    `Your overall Formation Index is ${index}. Think of it less as a grade and more as the resting heart rate of your inner life: useful mostly as a number to watch move.`,
    ``,
    `By your own rating, your clearest strength right now is ${hi.name} — ${hi.short.toLowerCase()}. ${hi.blurb} The sessions will test that against real performance; if it holds, it's an asset most people are quietly losing.`,
    ``,
    `By your own rating, your biggest opening for growth is ${lo.name} — ${lo.short.toLowerCase()}. ${lo.aiRationale} Self-ratings are often least reliable exactly here — which is why your first weeks of measured sessions will tell you something you can't tell yourself.`,
    ``,
    `Nothing here is fixed. These are capacities, not traits — every one of them responds to deliberate practice. That's the whole wager of Forma: the more cognition gets automated, the more the mind you keep in your own hands is worth.`,
  ].join('\n');
}

// --- Weekly pattern report (longitudinal, the "Insight Report") ---
export function weeklyPatterns(profile) {
  const out = [];
  const history = profile.history || [];
  if (history.length < 2) {
    return ['Not enough history yet for patterns — a few more daily sessions and Forma will start noticing things about you that are genuinely true.'];
  }

  // Biggest mover (up). Anchor "since you started" on the BASELINE, not the first
  // daily session — applyBaseline seeds only indexHistory, so domainTrend.first is
  // session-1, not baseline, and the raw delta would silently drop the baseline→
  // session-1 jump (under-reporting growth, and dropping a single-session domain
  // whose delta is 0). Mirrors snapshot.js / proof.js. (v94; same class as v74.)
  const baseScores = (profile.baseline && profile.baseline.domainScores) || {};
  let bestGain = null;
  let frozenMover = null; // a big apparent rise on a FROZEN (exhausted-bank) scale —
  // that's recall settling, not new growth, so it must NOT be celebrated as a gain
  // (the v152/v155 honesty rule, applied to the line that also feeds the coach).
  for (const id of DOMAIN_ORDER) {
    const t = domainTrend(history, id);
    if (t.latest == null) continue;
    const base = baseScores[id] != null ? baseScores[id] : t.first;
    if (base == null) continue;
    const delta = t.latest - base;
    if (scaleFreshness(profile, id).frozen) {
      if (delta > 2 && (!frozenMover || delta > frozenMover.delta)) frozenMover = { id, delta };
      continue;
    }
    if (!bestGain || delta > bestGain.delta) bestGain = { id, delta };
  }
  if (bestGain && bestGain.delta > 2) {
    out.push(`Biggest gain: ${domainName(bestGain.id)} is up ${bestGain.delta} points since you started. The work is showing.`);
  } else if (frozenMover) {
    out.push(`${domainName(frozenMover.id)} reads higher, but its items are used up — treat that as the score settling, not new growth. It’ll re-measure as fresh items arrive.`);
  }

  // Most-practiced vs. neglected.
  const counts = {};
  for (const h of history) counts[h.domain] = (counts[h.domain] || 0) + 1;
  const practiced = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (practiced.length) {
    out.push(`Most-practiced lately: ${domainName(practiced[0][0])} (${practiced[0][1]} session${practiced[0][1] === 1 ? '' : 's'}).`);
    const neglected = DOMAIN_ORDER.filter((id) => !counts[id]);
    if (neglected.length) {
      out.push(`Untouched so far: ${neglected.map(domainName).join(', ')}. Worth a visit — growth often hides in the domain we avoid.`);
    }
  }

  // Time-of-day correlation, if we have enough timestamped sessions.
  const tod = timeOfDayPattern(profile.sessions || []);
  if (tod) out.push(tod);

  // Current standing.
  const idx = profile.indexHistory || [];
  if (idx.length >= 2) {
    const delta = idx[idx.length - 1].formationIndex - idx[0].formationIndex;
    const word = delta > 0 ? `up ${delta}` : delta < 0 ? `down ${Math.abs(delta)}` : 'flat';
    out.push(`Your Formation Index is ${word} since you began. Trajectories matter more than any single number.`);
  }

  return out;
}

function timeOfDayPattern(sessions) {
  const buckets = { morning: [], midday: [], evening: [] };
  for (const s of sessions) {
    if (s.rawScore == null || s.hour == null) continue;
    if (s.hour < 12) buckets.morning.push(s.rawScore);
    else if (s.hour < 18) buckets.midday.push(s.rawScore);
    else buckets.evening.push(s.rawScore);
  }
  const avgs = Object.entries(buckets)
    .filter(([, arr]) => arr.length >= 3)
    .map(([k, arr]) => ({ k, avg: arr.reduce((a, b) => a + b, 0) / arr.length }));
  if (avgs.length < 2) return null;
  avgs.sort((a, b) => b.avg - a.avg);
  const best = avgs[0];
  const worst = avgs[avgs.length - 1];
  if (best.avg - worst.avg < 8) return null;
  return `You tend to perform best in the ${best.k}: about ${Math.round(best.avg - worst.avg)} points higher than your ${worst.k} sessions. Worth scheduling the hard reps accordingly.`;
}

// Which domain should today's session target? Lowest current score that hasn't
// been practiced in the last two sessions (so we cover ground but stay varied).
export function recommendFocus(profile) {
  const scores = profile.domainScores || {};
  const recent = (profile.history || []).slice(-2).map((h) => h.domain);
  const order = activeDomainIds(profile.settings && profile.settings.faithTrack);
  const candidates = order.filter((id) => scores[id] != null);
  if (!candidates.length) return DOMAIN_ORDER[0];
  const fresh = candidates.filter((id) => !recent.includes(id));
  const pool = fresh.length ? fresh : candidates;
  return pool.sort((a, b) => scores[a] - scores[b])[0];
}
