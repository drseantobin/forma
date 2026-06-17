// progress.js — longitudinal progress: streaks, trends, bands, sparklines.
// Pure functions so the "scales that rate progress" are testable and reliable.

// Deep-link / PWA app-shortcut routing: a URL like ?go=session opens that view.
// Returns a valid route from the query string, or null. Allowlisted so a crafted
// link can't push the app to an unknown state; pure + tested.
export const DEEP_LINK_ROUTES = ['home', 'session', 'progress', 'coach', 'settings', 'plan', 'proof', 'team', 'snapshot', 'methods'];
export function startRoute(search) {
  if (!search) return null;
  // Pure string parsing (no URLSearchParams — keeps it testable outside a browser).
  const q = String(search).replace(/^\?/, '');
  for (const pair of q.split('&')) {
    const eq = pair.indexOf('=');
    const key = eq === -1 ? pair : pair.slice(0, eq);
    if (key === 'go') {
      let val = eq === -1 ? '' : pair.slice(eq + 1);
      try { val = decodeURIComponent(val); } catch (e) { /* keep raw */ }
      return DEEP_LINK_ROUTES.includes(val) ? val : null;
    }
  }
  return null;
}

export function todayStr(d = new Date()) {
  // Local YYYY-MM-DD (a "day" is the user's local calendar day).
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysBetween(aStr, bStr) {
  const a = new Date(aStr + 'T00:00:00');
  const b = new Date(bStr + 'T00:00:00');
  return Math.round((b - a) / 86400000);
}

// Update a streak given the prior streak state and the day a session happened.
//   Same day        → unchanged.
//   Consecutive day → +1 (and a clean day RESTORES the one-time grace).
//   Missed one day  → GRACE: the chain holds (no +1, since no practice happened
//                     that day) but only if grace is available; spends it.
//   Otherwise       → reset to 1.
// Grace makes formation forgiving without being dishonest: a grace day never
// adds to the count, and you can't chain grace-on-grace (a real clean day must
// come between). The proven cost of a single missed day erasing a long streak
// is churn; "the return is the rep" is more true to formation anyway.
export function updateStreak(streak, dateStr) {
  const s = streak || { current: 0, longest: 0, lastDate: null, heldOnce: false };
  if (s.lastDate === dateStr) return { ...s, graced: false };
  const gap = s.lastDate ? daysBetween(s.lastDate, dateStr) : null;
  let current = s.current || 0;
  let heldOnce = !!s.heldOnce;
  let graced = false;
  if (gap === 1) {
    current += 1;
    heldOnce = false; // a clean consecutive day refreshes the grace
  } else if (gap === 2 && !heldOnce && current > 0) {
    // Missed exactly one day with grace available: hold the chain, spend grace.
    heldOnce = true;
    graced = true;
  } else {
    current = 1;
    heldOnce = false;
  }
  return {
    current,
    longest: Math.max(s.longest || 0, current),
    lastDate: dateStr,
    heldOnce,
    graced, // transient: true only on the update where grace was just spent
  };
}

// Is the streak still alive as of `today`? Warm if the last session was today or
// yesterday — and still RECOVERABLE today after a single missed day when grace
// is available (so the flame doesn't read "dead" when one more session saves it).
export function streakAlive(streak, today = todayStr()) {
  if (!streak || !streak.lastDate) return false;
  const gap = daysBetween(streak.lastDate, today);
  if (gap === 0 || gap === 1) return true;
  return gap === 2 && !streak.heldOnce && (streak.current || 0) > 0;
}

// True when someone is returning after a lapse: the streak is no longer alive
// but there's real history behind them (>1 session). This is the home front-door
// signal for a WARM re-entry — re-anchor on progress already banked rather than
// leading with a broken-streak guilt cue (a documented churn driver). It keys off
// streak-not-alive (evaluated BEFORE today's session) rather than insights.js's
// post-session `streak === 1`, which only resets after the comeback rep is done.
export function isLapsedReturn(profile, today = todayStr()) {
  if (!profile) return false;
  const sessions = (profile.sessions || []).length;
  return sessions > 1 && !streakAlive(profile.streak, today);
}

// Trend for one domain from the history log (chronological entries with
// {domain, newDomainScore}). Returns first, latest, delta, direction.
// Trend of the headline Formation Index over its history — so the home hero can
// show momentum at a glance ("+N since you began"), not just a static number.
export function indexTrend(indexHistory) {
  const pts = (indexHistory || []).map((x) => x.formationIndex).filter((v) => v != null);
  if (pts.length < 2) return { delta: 0, direction: 'flat', points: pts };
  const delta = pts[pts.length - 1] - pts[0];
  const direction = delta > 2 ? 'up' : delta < -2 ? 'down' : 'flat';
  return { delta, direction, points: pts };
}

export function domainTrend(history, domainId) {
  const pts = history.filter((h) => h.domain === domainId).map((h) => h.newDomainScore);
  if (!pts.length) return { first: null, latest: null, delta: 0, direction: 'flat', points: [] };
  const first = pts[0];
  const latest = pts[pts.length - 1];
  const delta = latest - first;
  const direction = delta > 2 ? 'up' : delta < -2 ? 'down' : 'flat';
  return { first, latest, delta, direction, points: pts };
}

// Build a small inline SVG sparkline path from a series of 0..100 values.
export function sparklinePath(values, width = 120, height = 32, pad = 3) {
  if (!values.length) return '';
  if (values.length === 1) {
    const y = height - pad - (values[0] / 100) * (height - pad * 2);
    return `M ${pad} ${y} L ${width - pad} ${y}`;
  }
  const span = width - pad * 2;
  const step = span / (values.length - 1);
  return values
    .map((v, i) => {
      const x = pad + i * step;
      const y = height - pad - (clampPct(v) / 100) * (height - pad * 2);
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function clampPct(v) {
  return Math.max(0, Math.min(100, v));
}

// Compute SVG points for a radar/spider chart of domain scores.
// Returns { points: "x,y x,y ...", axes: [{x,y,labelX,labelY,...}] }.
export function radarGeometry(domainScores, order, cx, cy, r) {
  const ids = order.filter((id) => domainScores[id] != null);
  const n = ids.length;
  const axes = [];
  const pts = [];
  ids.forEach((id, i) => {
    const angle = (-Math.PI / 2) + (i / n) * Math.PI * 2; // start at top
    const score = clampPct(domainScores[id]);
    const rr = (score / 100) * r;
    const x = cx + Math.cos(angle) * rr;
    const y = cy + Math.sin(angle) * rr;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    axes.push({
      id,
      angle,
      x,
      y,
      axisX: cx + Math.cos(angle) * r,
      axisY: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (r + 16),
      labelY: cy + Math.sin(angle) * (r + 16),
    });
  });
  return { points: pts.join(' '), axes };
}
