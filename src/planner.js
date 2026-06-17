// planner.js — the Formation Planner (the spec's weekly planning agent).
//
// Each week Forma generates a structured 7-day plan: which capacities to train,
// in what sequence, at what intensity — a dynamic response to THIS person's
// pattern, not a generic curriculum. The plan then drives the daily loop: the
// session asks the planner what today's focus is before falling back to the
// generic "weakest domain" heuristic.
//
// The plan structure is deterministic and rule-based (works with no key). An
// optional live narrative (planNarrative) adds a coach's framing when a key
// is present.

import { DOMAINS, getDomain, activeDomainIds } from './domains.js';
import { todayStr, daysBetween } from './progress.js';
import { complete, hasKey } from './coach.js';

const ORDER = DOMAINS.map((d) => d.id);

export function typeForDomain(id) {
  if (id === 'memory') return 'memory';
  if (id === 'judgment') return 'decision';
  if (id === 'reading' || id === 'attention') return 'reading';
  return 'reflection'; // persistence, ai_autonomy, presence, values
}

const TYPE_LABEL = {
  reading: 'Deep reading',
  memory: 'Working memory',
  decision: 'Judgment scenario',
  reflection: 'Reflection',
};
export function typeLabel(type) { return TYPE_LABEL[type] || type; }

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00'); // noon avoids DST midnight skips
  d.setDate(d.getDate() + n);
  return todayStr(d);
}
function clampInt(n, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(n))); }

function dayRationale(domain, isTheme) {
  const short = getDomain(domain).short.toLowerCase();
  return isTheme
    ? `This week's focus capacity — ${short}.`
    : `Cross-training so no scale goes cold — ${short}.`;
}

// Generate a fresh 7-day plan from the person's current profile.
export function generatePlan(profile, opts = {}) {
  const now = opts.now ? new Date(opts.now) : new Date();
  const start = todayStr(now);
  const scores = profile.domainScores || {};
  const order = activeDomainIds(profile.settings && profile.settings.faithTrack);

  // Rank weakest-first; unseen domains treated as mid (50).
  const ranked = order.slice().sort((a, b) => (scores[a] ?? 50) - (scores[b] ?? 50));
  const pick = (i) => ranked[i] || ranked[0] || ORDER[0];

  // Emphasize the weakest (the theme gets 2 of 7 days) while covering SIX distinct
  // capacities across the week — so no domain's scale goes stale from never being
  // the daily focus. Earlier this only ever rotated the 4 weakest, leaving 6+ of
  // the capacities untouched in a given week.
  const pattern = [pick(0), pick(1), pick(2), pick(3), pick(0), pick(4), pick(5)];
  const theme = pick(0);

  const days = pattern.map((domain, i) => {
    const score = scores[domain] ?? 50;
    const isTheme = domain === theme;
    const intensity = clampInt((isTheme ? 4 : 3) - Math.floor(score / 40) + (i >= 5 ? -1 : 0), 1, 5);
    return {
      dayIndex: i,
      date: addDays(start, i),
      domain,
      type: typeForDomain(domain),
      intensity,
      title: getDomain(domain).name,
      rationale: dayRationale(domain, isTheme),
    };
  });

  const themeName = getDomain(theme).name;
  const themeScore = scores[theme];
  return {
    weekStart: start,
    generatedAt: now.toISOString(),
    theme,
    targetText: themeScore != null
      ? `Lift your ${themeName} scale this week — at ${themeScore}, it's your biggest opening.`
      : `Build a baseline on ${themeName} this week.`,
    days,
  };
}

// Is the stored plan missing or older than its 7-day window?
export function planIsStale(plan, today = todayStr()) {
  if (!plan || !plan.weekStart) return true;
  const age = daysBetween(plan.weekStart, today);
  return age < 0 || age >= 7;
}

// Annotate plan days with completion, derived from real sessions (a day is
// "done" if any session happened on that date). Pure — returns a new array.
export function planWithProgress(plan, profile) {
  const sessionDates = new Set((profile.sessions || []).map((s) => s.date));
  return plan.days.map((d) => ({ ...d, done: sessionDates.has(d.date) }));
}

// What capacity should today's session train? Defer to the plan; null if no
// plan covers today (caller falls back to the generic recommendation).
export function focusForToday(profile, today = todayStr()) {
  const plan = profile.plan;
  if (!plan || !plan.days || !plan.days.length) return null;
  const day = plan.days.find((d) => d.date === today);
  if (day) return day.domain;
  // No exact date match but still inside the week (e.g. a DST skip): use the day
  // matching how far we are in. Outside the window → null (caller regenerates).
  const offset = daysBetween(plan.weekStart, today);
  if (offset >= 0 && offset < plan.days.length) return plan.days[offset].domain;
  return null;
}

const PLAN_SYSTEM = `You are Forma's Formation Planner, writing a short, warm framing for the week's plan. 2-3 sentences. Name the week's focus capacity and why it matters for this person, and one encouraging, concrete note about how to approach the week. Formation framing only — no clinical language, no hype, no "journey"/"lean into"/"powerful".`;

// Optional live narrative; falls back to the rule-based target text.
export async function planNarrative(profile, plan) {
  const fallback = plan.targetText;
  if (!hasKey(profile)) return { text: fallback, live: false };
  try {
    const themeName = getDomain(plan.theme).name;
    const summary = plan.days.map((d) => `${d.date}: ${d.title} (intensity ${d.intensity})`).join('; ');
    const text = await complete(profile, {
      system: PLAN_SYSTEM,
      maxTokens: 240,
      messages: [{ role: 'user', content: `This week's focus capacity is ${themeName}. The 7-day plan: ${summary}. Their current scales: ${JSON.stringify(profile.domainScores)}. Write the framing.` }],
    });
    return { text: text || fallback, live: !!text };
  } catch {
    return { text: fallback, live: false };
  }
}
