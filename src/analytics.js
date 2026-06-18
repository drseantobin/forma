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
// ============================================================================
// BUILDER-ONLY psychometrics over the POOLED, de-identified research records.
// These compute the reliability/validity numbers that make Forma's measures DEMONSTRABLE — but only
// once enough consented data has pooled (on the server, later). Every stat is GATED: suppressed below a
// defensible N, so a number is never shown off too few people. NOT user-facing — for the builder and the
// eventual validity white paper. A "record" is one de-identified event the server has joined to its
// install: { installId, domain, item, score (0-100), measured, day }. Pure, no DOM. (Approach per the
// construct-validity review: item difficulty, corrected item-total discrimination, test-retest on
// repeated measures; per-item stats suppressed below ~30 independent installs.)
// ============================================================================
export const ITEM_MIN_N = 30;        // independent installs before a per-item stat is trustworthy
export const RETEST_MIN_PAIRS = 50;  // person-pairs before a test-retest r is trustworthy
const _avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const _round2 = (x) => (x == null ? null : Math.round(x * 100) / 100);
function _clean(records) {
  return (Array.isArray(records) ? records : []).filter((r) => r && r.measured && typeof r.score === 'number' && r.item != null && r.domain != null && r.installId != null);
}
function _pearson(xs, ys) {
  const n = xs.length;
  if (n < 2) return null;
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
  for (let i = 0; i < n; i++) { sx += xs[i]; sy += ys[i]; sxx += xs[i] * xs[i]; syy += ys[i] * ys[i]; sxy += xs[i] * ys[i]; }
  const cov = sxy - (sx * sy) / n, vx = sxx - (sx * sx) / n, vy = syy - (sy * sy) / n;
  if (vx <= 0 || vy <= 0) return null;
  return cov / Math.sqrt(vx * vy);
}

// Item DIFFICULTY: per keyed item, how hard it is (mean score; lower = harder). Suppressed below minN.
export function itemDifficulty(records, minN = ITEM_MIN_N) {
  const byItem = {};
  for (const r of _clean(records)) { (byItem[r.item] || (byItem[r.item] = { domain: r.domain, scores: [] })).scores.push(r.score); }
  return Object.keys(byItem).map((item) => {
    const g = byItem[item], n = g.scores.length;
    return { item, domain: g.domain, n, meanScore: Math.round(_avg(g.scores)), suppressed: n < minN };
  }).sort((a, b) => a.meanScore - b.meanScore);
}

// Item DISCRIMINATION: corrected item-total correlation within the item's domain — does doing well on
// THIS item track doing well on the domain's OTHER items? Per person, pair their item score with the
// mean of their other items in that domain; Pearson across persons. Suppressed below minN persons.
export function itemDiscrimination(records, minN = ITEM_MIN_N) {
  const recs = _clean(records);
  const P = {}, itemDom = {};
  for (const r of recs) {
    const dom = ((P[r.installId] || (P[r.installId] = {}))[r.domain] || (P[r.installId][r.domain] = {}));
    (dom[r.item] || (dom[r.item] = [])).push(r.score);
    itemDom[r.item] = r.domain;
  }
  return Object.keys(itemDom).map((item) => {
    const domain = itemDom[item];
    const xs = [], ys = [];
    for (const inst of Object.keys(P)) {
      const dom = P[inst][domain];
      if (!dom || dom[item] == null) continue;
      const others = Object.keys(dom).filter((it) => it !== item);
      if (!others.length) continue;
      xs.push(_avg(dom[item]));
      ys.push(_avg(others.map((it) => _avg(dom[it]))));
    }
    const n = xs.length;
    return { item, domain, n, discrimination: n >= minN ? _round2(_pearson(xs, ys)) : null, suppressed: n < minN };
  }).sort((a, b) => (b.discrimination == null ? -2 : b.discrimination) - (a.discrimination == null ? -2 : a.discrimination));
}

// TEST-RETEST: per domain, stability of a person's EARLIEST vs LATEST score; Pearson across persons
// with >=2 timepoints. Suppressed below minPairs. Pass GENERATED-task records (n-back/flanker/span/etc.)
// for a clean retest — keyed banks are confounded by exhaustion, so they must not be pooled in here.
export function testRetest(records, minPairs = RETEST_MIN_PAIRS) {
  const P = {};
  for (const r of _clean(records).filter((r) => r.day)) {
    ((P[r.installId] || (P[r.installId] = {}))[r.domain] || (P[r.installId][r.domain] = [])).push({ day: r.day, score: r.score });
  }
  const domains = {};
  for (const inst of Object.keys(P)) {
    for (const domain of Object.keys(P[inst])) {
      const seq = P[inst][domain].slice().sort((a, b) => (a.day < b.day ? -1 : (a.day > b.day ? 1 : 0)));
      if (seq.length < 2) continue;
      const d = (domains[domain] || (domains[domain] = { xs: [], ys: [] }));
      d.xs.push(seq[0].score); d.ys.push(seq[seq.length - 1].score);
    }
  }
  return Object.keys(domains).map((domain) => {
    const d = domains[domain], nPairs = d.xs.length;
    return { domain, nPairs, retest: nPairs >= minPairs ? _round2(_pearson(d.xs, d.ys)) : null, suppressed: nPairs < minPairs };
  });
}

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
