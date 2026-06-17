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

const DOMAIN_ORDER = DOMAINS.map((d) => d.id);

// --- The one daily insight ---
// Compares today's raw result against this domain's recent average and the
// user's overall pattern, and returns one honest, encouraging observation.
export function dailyInsight(session, profile) {
  const { domain, rawScore, type } = session;
  const name = domainName(domain);

  // Prior average for this domain (excluding today's session).
  const priorScores = profile.history
    .filter((h) => h.domain === domain)
    .slice(0, -1)
    .map((h) => h.rawScore != null ? h.rawScore : h.newDomainScore);
  const priorAvg = priorScores.length
    ? priorScores.reduce((a, b) => a + b, 0) / priorScores.length
    : null;

  const streak = profile.streak?.current || 1;
  const lines = [];

  // Returning after a gap — name the return as the rep, never the absence.
  const totalSessions = (profile.sessions || []).length;
  const returnedAfterLapse = streak === 1 && totalSessions > 1;

  if (returnedAfterLapse) {
    lines.push('You came back. That’s the part most people skip — not the streak, the return. Today counts double for being the harder rep.');
  } else if ([3, 7, 14, 30, 50, 100].includes(streak)) {
    // Streak milestone is the retention moment.
    lines.push(`That's ${streak} days in a row. The streak isn't the point — but the person who shows up ${streak} days running is already becoming someone different.`);
  }

  if (priorAvg != null) {
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
  comm: 'The effective word is clear and kind at once. Most people manage one; you practiced holding both.',
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
    `${greeting} your starting profile — a snapshot of where you are today, not a verdict. The only honest use of a baseline is as the line you grow from.`,
    ``,
    `Your overall Formation Index is ${index}. Think of it less as a grade and more as the resting heart rate of your inner life: useful mostly as a number to watch move.`,
    ``,
    `Your clearest strength right now is ${hi.name} — ${hi.short.toLowerCase()}. ${hi.blurb} Protect this one; it's an asset most people are quietly losing.`,
    ``,
    `Your biggest opening for growth is ${lo.name} — ${lo.short.toLowerCase()}. ${lo.aiRationale} This is where your first weeks of sessions will move the most.`,
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

  // Biggest mover (up).
  let bestGain = null;
  for (const id of DOMAIN_ORDER) {
    const t = domainTrend(history, id);
    if (t.first == null) continue;
    if (!bestGain || t.delta > bestGain.delta) bestGain = { id, ...t };
  }
  if (bestGain && bestGain.delta > 2) {
    out.push(`Biggest gain: ${domainName(bestGain.id)} is up ${bestGain.delta} points since you started. The work is showing.`);
  }

  // Most-practiced vs. neglected.
  const counts = {};
  for (const h of history) counts[h.domain] = (counts[h.domain] || 0) + 1;
  const practiced = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (practiced.length) {
    out.push(`Most-practiced lately: ${domainName(practiced[0][0])} (${practiced[0][1]} sessions).`);
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
