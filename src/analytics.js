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
