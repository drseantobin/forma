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

// GENERATED tasks make fresh content every serve, so a repeat genuinely re-measures the capacity.
// KEYED banks deplete: a re-answer after seeing the rationale measures RECALL, and a rising-but-stable
// keyed score would masquerade as high reliability. So only generated records may be pooled into a
// retest coefficient by default (mirrors profile.js RECALL_PRONE / the generated set in applySession).
// A record's `type` (carried on every research event by research.js buildEvent) is the bucket signal.
export const GENERATED_TYPES = new Set(['nback', 'series', 'span', 'mathfluency', 'vigilance', 'pursuit', 'flanker', 'memory', 'digitspan', 'stream']);
export const KEYED_TYPES = new Set(['crt', 'decision', 'tradeoff', 'stem', 'comm', 'attend', 'steu', 'matrix', 'reading', 'maze', 'reliance']);
export function isGeneratedRecord(r) { return !!(r && GENERATED_TYPES.has(r.type)); }

// FIXED-ITEM types: those whose `item` id RECURS across people, so classical item analysis (difficulty,
// discrimination) is meaningful — the keyed banks plus the fixed-prompt AI-judged banks (each prompt has a
// stable id served to many people). Item analysis is allow-listed to these (Codex review: an allowlist, not
// "anything not generated", so an unknown/malformed type can't slip in as an n=1 ghost). Ambiguous types
// (stay/meaning) are conservatively left out — losing an unwired builder stat is harmless; a false item isn't.
export const FIXED_ITEM_TYPES = new Set([...KEYED_TYPES, 'vignette', 'sentence', 'reflection']);
export function isFixedItemRecord(r) { return !!(r && FIXED_ITEM_TYPES.has(r.type)); }
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

// Item DIFFICULTY: per fixed item, how hard it is (mean score; lower = harder). Suppressed below minN.
// Item analysis is a FIXED-item method; generated tasks carry a fresh per-serve exerciseId (each serve a
// unique n=1 ghost) and so are routed out via the FIXED_ITEM_TYPES allowlist (v334 family, forma-validity).
// Each row carries its `type` so a future dashboard can separate keyed-task hardness from how the AI judge
// tends to rate a given prompt (vignette/sentence/reflection) — they're different senses of "difficulty".
export function itemDifficulty(records, minN = ITEM_MIN_N) {
  const byItem = {};
  for (const r of _clean(records).filter(isFixedItemRecord)) { (byItem[r.item] || (byItem[r.item] = { domain: r.domain, type: r.type, scores: [] })).scores.push(r.score); }
  return Object.keys(byItem).map((item) => {
    const g = byItem[item], n = g.scores.length;
    return { item, domain: g.domain, type: g.type, n, meanScore: Math.round(_avg(g.scores)), suppressed: n < minN };
  }).sort((a, b) => a.meanScore - b.meanScore);
}

// Item DISCRIMINATION: corrected item-total correlation within the item's domain — does doing well on
// THIS item track doing well on the domain's OTHER items? Per person, pair their item score with the
// mean of their other items in that domain; Pearson across persons. Suppressed below minN persons.
export function itemDiscrimination(records, minN = ITEM_MIN_N) {
  const recs = _clean(records).filter(isFixedItemRecord); // fixed-item method — generated singletons can't discriminate (v334 family, allowlisted)
  const P = {}, itemDom = {}, itemType = {};
  for (const r of recs) {
    const dom = ((P[r.installId] || (P[r.installId] = {}))[r.domain] || (P[r.installId][r.domain] = {}));
    (dom[r.item] || (dom[r.item] = [])).push(r.score);
    itemDom[r.item] = r.domain; itemType[r.item] = r.type;
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
    return { item, domain, type: itemType[item], n, discrimination: n >= minN ? _round2(_pearson(xs, ys)) : null, suppressed: n < minN };
  }).sort((a, b) => (b.discrimination == null ? -2 : b.discrimination) - (a.discrimination == null ? -2 : a.discrimination));
}

// TEST-RETEST: per domain, stability of a person's EARLIEST vs LATEST score; Pearson across persons
// with >=2 timepoints. Suppressed below minPairs. Keyed banks are confounded by exhaustion, so they
// must not be pooled in here — this function now ENFORCES that itself (v334, forma-validity: the rule
// lived only in this docstring; nothing filtered, so a recall-confounded keyed score could be laundered
// into a reliability coefficient). Default = generated tasks only; opts.includeKeyed runs a DELIBERATE,
// labeled keyed analysis. A record's `type` is the bucket signal (carried by research.js buildEvent).
export function testRetest(records, minPairs = RETEST_MIN_PAIRS, opts = {}) {
  const P = {};
  // Default: generated only. includeKeyed adds the KEYED banks too (a deliberate, labeled analysis) —
  // NOT a blanket "include everything": unknown/AI-judged/self-report types still stay out (Codex review).
  for (const r of _clean(records).filter((r) => r.day && (isGeneratedRecord(r) || (opts.includeKeyed && KEYED_TYPES.has(r.type))))) {
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
