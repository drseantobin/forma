// progress.js — longitudinal progress: streaks, trends, bands, sparklines.
// Pure functions so the "scales that rate progress" are testable and reliable.

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
// Same day → unchanged. Consecutive day → +1. Gap → reset to 1.
export function updateStreak(streak, dateStr) {
  const s = streak || { current: 0, longest: 0, lastDate: null };
  if (s.lastDate === dateStr) return { ...s };
  let current;
  if (s.lastDate && daysBetween(s.lastDate, dateStr) === 1) {
    current = s.current + 1;
  } else {
    current = 1;
  }
  return {
    current,
    longest: Math.max(s.longest || 0, current),
    lastDate: dateStr,
  };
}

// Is the streak still alive as of `today`? (Active if last session was today
// or yesterday.) Used to show a warm vs. cooled flame.
export function streakAlive(streak, today = todayStr()) {
  if (!streak || !streak.lastDate) return false;
  const gap = daysBetween(streak.lastDate, today);
  return gap === 0 || gap === 1;
}

// Trend for one domain from the history log (chronological entries with
// {domain, newDomainScore}). Returns first, latest, delta, direction.
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
