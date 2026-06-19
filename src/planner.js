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

import { DOMAINS, getDomain, activeDomainIds, bandFor } from './domains.js';
import { todayStr, daysBetween } from './progress.js';
import { complete, hasKey } from './coach.js';
import { confidence, indexConfidence } from './reliability.js';

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

export function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00'); // noon avoids DST midnight skips
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

// The capacity tomorrow's plan points at — used for a gentle "come back for X"
// forward-pull after today's session. Returns null when the plan doesn't cover
// tomorrow (the caller supplies a fallback). Pure.
export function tomorrowFocus(profile, today = todayStr()) {
  return focusForToday(profile, addDays(today, 1));
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

  // Days since each domain was last the focus of a session (Infinity if never).
  const lastSeen = {};
  for (const s of (profile.sessions || [])) {
    if (!s.domain) continue;
    if (!lastSeen[s.domain] || s.date > lastSeen[s.domain]) lastSeen[s.domain] = s.date;
  }
  const staleness = (id) => (lastSeen[id] ? Math.max(0, daysBetween(lastSeen[id], start)) : Infinity);

  // The THEME is the weakest by score — the "biggest opening" framing depends on
  // that — and it gets 2 of the 7 days.
  const byScore = order.slice().sort((a, b) => (scores[a] ?? 50) - (scores[b] ?? 50));
  const theme = byScore[0] || ORDER[0];

  // The other five slots are ranked by NEED = weak AND/OR stale, so a mid-scoring
  // capacity that's gone unpracticed for weeks still cycles back in (otherwise its
  // scale silently goes stale). Staleness is capped so one very old domain can't
  // dominate; a never-practiced domain (Infinity) sorts to the front.
  const need = (id) => (scores[id] ?? 50) - Math.min(staleness(id), 30) * 1.5;
  const rest = order.filter((id) => id !== theme).sort((a, b) => need(a) - need(b));
  const r = (i) => rest[i] || rest[rest.length - 1] || theme;

  // Weakest theme ×2, plus five distinct need-ranked capacities = SIX distinct/week.
  const pattern = [theme, r(0), r(1), r(2), theme, r(3), r(4)];

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
  // Honest framing (forma-validity v247): NEVER assert a single self-administered score as a precise
  // fact ("at 42") or a superlative cross-capacity verdict ("biggest opening"). Two separate hedges
  // for two separate claims: the BAND wording is gated on THIS scale's confidence (provisional at 1
  // measure); the RANKING wording (why this capacity is the theme) is gated on indexConfidence().thin
  // — because the "weakest" comparison trusts ALL scales, and can be dominated by the noisiest
  // least-measured one. "Most room to grow" is earned ONLY when the theme is established AND the
  // comparison field isn't thin. Otherwise we "start here", framed as a choice, not a verdict.
  const band = themeScore != null ? bandFor(themeScore) : null;
  const themeEstablished = confidence(profile, theme).level === 'established';
  const rankingThin = indexConfidence(profile).thin;
  let targetText;
  if (themeScore == null) {
    targetText = `Build a baseline on ${themeName} this week — a few measurements and we'll see where there's room to grow.`;
  } else if (!themeEstablished) {
    targetText = `This week starts with ${themeName}. An early read places it in the ${band.label} range — too little measurement to call it firmly yet, so we're treating it as a place to grow rather than a verdict. A good capacity to give your attention this week.`;
  } else if (rankingThin) {
    targetText = `This week starts with ${themeName} — your measurements place it in the ${band.label} range, a capacity with real room to grow. With only some of your other scales measured so far, we're starting here rather than calling it your weakest; a good place to focus this week.`;
  } else {
    targetText = `This week starts with ${themeName} — across your measured capacities it currently has the most room to grow, sitting in the ${band.label} range. A good place to focus this week.`;
  }
  return {
    weekStart: start,
    generatedAt: now.toISOString(),
    theme,
    targetText,
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

const PLAN_SYSTEM = `You are Forma's Formation Planner, writing a short, warm framing for the week's plan. 2-3 sentences. Name the week's focus capacity and why it matters for this person, and one encouraging, concrete note about how to approach the week. Formation framing only — no clinical language, no hype, no "journey"/"lean into"/"powerful".

If the person has an open commitment for the focus capacity, you may acknowledge it warmly as something they are already practicing in daily life, as a SEPARATE thought from anything about their score or "opening." Treat the habit as the formation in itself. Never state or imply that the commitment will move, raise, or improve their score, and never present it as the way to close the week's gap. The number and the habit are independent — keep them in separate sentences.

Never cite a raw numeric score or imply false precision — a person's score is a single self-administered reading, not an exact fact. Speak only in the band words you're given (Emerging / Developing / Strong / Thriving), never a number. Only call the focus capacity their "weakest", their "biggest opening", or the one with "the most room to grow" if you are explicitly told the ranking is well-measured; otherwise frame it simply as where the week starts — a place to grow, not a ranked verdict.`;

// Optional live narrative; falls back to the rule-based target text.
export async function planNarrative(profile, plan) {
  // Bridge the islands: if the person already has an open commitment FOR the focus capacity, name
  // it — so the weekly framing references their real-life formation, not just in-app sessions.
  // Honesty (forma-validity v246): keep it a SEPARATE thought from the score-framed targetText. The
  // "Separately:" break + "regardless of what the scale does" is load-bearing — it re-points the
  // habit at the CAPACITY, not at "lifting the scale", so it never reads as the cause of a score
  // move. Name ONE commitment (a tally would reintroduce a quantified-progress frame); empty → none.
  const themeCommit = (profile.goals || []).find((g) => g && !g.done && g.domain === plan.theme && String(g.text || '').trim());
  const commitmentText = themeCommit ? String(themeCommit.text).trim() : '';
  const fallback = commitmentText
    ? `${plan.targetText} Separately: in daily life you're already practicing this capacity — “${commitmentText}”. That practice is the real formation here; keep it going this week, regardless of what the scale does.`
    : plan.targetText;
  if (!hasKey(profile)) return { text: fallback, live: false };
  try {
    const themeName = getDomain(plan.theme).name;
    const summary = plan.days.map((d) => `${d.date}: ${d.title} (intensity ${d.intensity})`).join('; ');
    // Honesty (forma-validity v248): NEVER hand the model raw scores — it can't fabricate "your
    // weakest at 42" if it never sees the number. Give it the BAND word + an explicit flag for
    // whether a cross-capacity ranking is earned (theme well-measured AND the field not thin),
    // mirroring the offline targetText gating (v247). PLAN_SYSTEM enforces band-only + ranking gate.
    const themeScore = (profile.domainScores || {})[plan.theme];
    const band = themeScore != null ? bandFor(themeScore) : null;
    const rankingEarned = confidence(profile, plan.theme).level === 'established' && !indexConfidence(profile).thin;
    const standing = band
      ? `Their ${themeName} currently sits in the ${band.label} range${rankingEarned ? ', and across their measured capacities it has the most room to grow' : ' — an early read, too few measurements to rank it against their other capacities yet'}.`
      : `They haven't measured ${themeName} yet — this week is about establishing a baseline.`;
    // Pass the commitment as keyed-construct context, NOT next to the schedule — so the model
    // can't weave it into the plan-as-cause (forma-validity v246).
    const commitLine = commitmentText ? ` Their open commitment for ${themeName}: "${commitmentText}".` : '';
    const text = await complete(profile, {
      system: PLAN_SYSTEM,
      maxTokens: 240,
      messages: [{ role: 'user', content: `This week's focus capacity is ${themeName}. ${standing} The 7-day plan: ${summary}.${commitLine} Write the framing.` }],
    });
    return { text: text || fallback, live: !!text };
  } catch {
    return { text: fallback, live: false };
  }
}
