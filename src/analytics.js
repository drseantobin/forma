// analytics.js — honest, on-device summaries of the user's OWN de-identified research
// queue (research.js events). PURE, no DOM, no network.
//
// This powers the "what you've shared" transparency view in Settings: it shows EXACTLY
// what anonymous sharing contributes — counts + mean scores, by domain and by exercise
// type — so the consent is legible, not a black box. It can ONLY show what the queue
// holds: numeric scores + a short option id, dated to the day. There is no name, no
// free text, and no interior content to show (those never enter the queue).
//
// NOTE what this deliberately CANNOT compute: per-ITEM difficulty / discrimination and
// population norms. Events carry no item id (by design), and those statistics need a
// pooled, many-person dataset — that's the future server dashboard's job, gated to a
// real sample. This local view is the honest single-user preview, not the norms engine.

export function summarizeResearch(events) {
  const list = Array.isArray(events) ? events : [];
  const days = new Set();
  const byDomain = {};
  const byType = {};
  let measured = 0;
  for (const e of list) {
    if (!e || typeof e !== 'object') continue;
    if (e.day) days.add(e.day);
    // Only events that actually produced a score contribute to the means; a recorded-
    // but-unscored event (e.g. a replay) still counts toward "shared" but not the mean.
    if (e.measured && typeof e.score === 'number') {
      measured++;
      (byDomain[e.domain] || (byDomain[e.domain] = { n: 0, sum: 0 }));
      byDomain[e.domain].n++; byDomain[e.domain].sum += e.score;
      const ty = e.type || 'other';
      (byType[ty] || (byType[ty] = { n: 0, sum: 0 }));
      byType[ty].n++; byType[ty].sum += e.score;
    }
  }
  const mk = (obj) => Object.keys(obj)
    .map((k) => ({ key: k, n: obj[k].n, mean: Math.round(obj[k].sum / obj[k].n) }))
    .sort((a, b) => b.n - a.n);
  return { total: list.length, measured, days: days.size, domains: mk(byDomain), types: mk(byType) };
}

// Below this many repeated MEASURE-type scores in a domain, any consistency figure
// is itself too noisy to report — show "not enough re-tests yet" instead of false
// precision (mirrors confidence()'s provisional-at-n=1 caution).
export const STABILITY_MIN_SESSIONS = 4;

// domainStability — test-retest CONSISTENCY of one person's OWN repeated measured
// scores for a domain, over their de-identified research queue. This is the missing
// reliability primitive: reliability.js reports confidence by the COUNT of measures;
// this asks whether those repeated measures AGREE.
//
// Reported as raw points on the native 0–100 scale, NEVER collapsed into a single
// 0–1 "reliability coefficient": a one-person time series cannot yield a true
// test-retest r (no parallel form, and score variance is confounded with the real
// change Forma is trying to cause). meanAbsStep = average absolute change between
// consecutive measurements; sd = sample standard deviation of the scores.
//
// PURE. Caller must honor two honesty rules in the UI: (1) consistency is not growth
// and can mean task-familiarity; (2) stability on a FROZEN/keyed-exhausted bank is
// recall, not reliability — label it so (see snapshot.js precedent).
export function domainStability(events, domainId) {
  const list = Array.isArray(events) ? events : [];
  const xs = [];
  for (const e of list) {
    if (!e || typeof e !== 'object') continue;
    // Same guard as summarizeResearch so the two can't drift; queue is append-order
    // (chronological), so xs is already in measurement order.
    if (e.measured && typeof e.score === 'number' && e.domain === domainId) xs.push(e.score);
  }
  const n = xs.length;
  if (n < STABILITY_MIN_SESSIONS) return { n, ready: false };
  let stepSum = 0;
  for (let i = 1; i < n; i++) stepSum += Math.abs(xs[i] - xs[i - 1]);
  const meanAbsStep = stepSum / (n - 1);
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const variance = xs.reduce((a, b) => a + (b - mean) * (b - mean), 0) / (n - 1);
  const sd = Math.sqrt(variance);
  return { n, ready: true, meanAbsStep: Math.round(meanAbsStep), sd: Math.round(sd), mean: Math.round(mean) };
}
