// snapshot.js — the shareable Capacity Snapshot (the "credential" artifact).
//
// Forma's B2B thesis is a capacity credential a person could show an employer.
// This assembles the individual's own formation profile into one consolidated,
// honest summary they can print, save as PDF, or copy as text. It is generated
// BY the person, FROM their own local data — Forma never holds or transmits it.
//
// Privacy guardrail: the optional Interior Life track is ALWAYS excluded here —
// a shareable/employer-facing credential must never expose someone's spiritual
// data, regardless of whether they enabled that track for their own use.
//
// Pure functions, no DOM — fully testable.

import { activeDomainIds, getDomain, bandFor } from './domains.js';
import { formationIndex } from './scoring.js';
import { aiReadinessOf } from './team.js';
import { confidence } from './reliability.js';
import { domainTrend, daysBetween, todayStr } from './progress.js';

export function buildSnapshot(profile, today = todayStr()) {
  const scores = profile.domainScores || {};
  const faith = !!(profile.settings && profile.settings.faithTrack);
  // Active domains EXCEPT interior (never shareable), with a real score.
  const ids = activeDomainIds(faith).filter((id) => id !== 'interior' && scores[id] != null);
  const baseScores = (profile.baseline && profile.baseline.domainScores) || {};
  const domains = ids.map((id) => {
    const t = domainTrend(profile.history || [], id);
    // Anchor "since start" on the BASELINE score, not the first daily session —
    // history doesn't include the baseline point (applyBaseline seeds only
    // indexHistory), so domainTrend.delta would silently drop the baseline→
    // session-1 movement and show "±0 since start" on an improved score. Mirrors
    // proof.js's baseline anchor.
    const base = baseScores[id] != null ? baseScores[id] : (t.first != null ? t.first : null);
    return {
      id,
      name: getDomain(id).name,
      score: scores[id],
      band: bandFor(scores[id]).label,
      confidence: confidence(profile, id).label,
      delta: base != null ? scores[id] - base : 0,
    };
  }).sort((a, b) => b.score - a.score);

  const since = profile.baseline ? profile.baseline.date : null;
  // AI-Readiness / Formation Index over the shareable (non-interior) scores only.
  const shareScores = {};
  ids.forEach((id) => { shareScores[id] = scores[id]; });

  // Evidence humility for the COMPOSITE headline — parity with Home/Progress
  // (indexConfidence, v112/v113), but computed over the SHAREABLE (non-interior)
  // universe, since the credential's Formation Index is over shareScores. (Reusing
  // indexConfidence here would miscount: it includes interior in its total.)
  const shareTotal = activeDomainIds(faith).filter((id) => id !== 'interior').length;
  const provisional = ids.filter((id) => confidence(profile, id).level === 'provisional').length;
  const thinComposite = ids.length < 2 || ids.length < shareTotal / 2 || provisional > ids.length / 2;
  const coverage = {
    covered: ids.length,
    total: shareTotal,
    thin: thinComposite,
    note: thinComposite ? `Provisional · ${ids.length} of ${shareTotal} capacities measured` : '',
  };

  return {
    name: (profile.settings && profile.settings.name) || null,
    since,
    generated: today, // when this credential was produced — so a stale copy isn't passed off as current
    days: since ? daysBetween(since, today) : 0,
    sessionCount: (profile.sessions || []).length,
    formationIndex: formationIndex(shareScores),
    aiReadiness: aiReadinessOf(shareScores),
    coverage,
    domains,
    strengths: domains.slice(0, 2).map((d) => d.name),
    growthEdges: domains.slice().reverse().slice(0, 2).map((d) => d.name),
  };
}

// A plain-text rendering of the snapshot — for the "copy" affordance, so it can
// be pasted into an email or application. Honest, compact, self-generated.
export function snapshotText(snap) {
  const lines = [];
  lines.push(`FORMA — Capacity Snapshot${snap.name ? ' · ' + snap.name : ''}`);
  if (snap.since) lines.push(`${snap.sessionCount} session${snap.sessionCount === 1 ? '' : 's'} over ${snap.days} day${snap.days === 1 ? '' : 's'}`);
  if (snap.generated) lines.push(`Generated ${snap.generated}`);
  lines.push('');
  lines.push(`Formation Index: ${snap.formationIndex}`);
  if (snap.aiReadiness != null) lines.push(`AI-Readiness: ${snap.aiReadiness}`);
  if (snap.coverage && snap.coverage.thin) lines.push(`(${snap.coverage.note} — still early; these will settle as more capacities are practiced.)`);
  lines.push('');
  lines.push('Capacities (with how much evidence backs each):');
  snap.domains.forEach((d) => {
    const dl = d.delta > 0 ? ` (+${d.delta} since start)` : d.delta < 0 ? ` (${d.delta} since start)` : '';
    // Carry the per-capacity confidence — the same signal the visual card shows —
    // so the EMAILED artifact distinguishes a score from 1 session vs. 20. Without
    // it the credential's best defensibility cue vanishes in the channel that matters.
    lines.push(`  - ${d.name}: ${d.score} (${d.band}, ${d.confidence})${dl}`);
  });
  lines.push('');
  lines.push('Measurement for formation, not diagnosis. Self-generated by the individual from their own device data; confidence reflects how many sessions back each score.');
  if (snap.aiReadiness != null) lines.push('AI-Readiness is a development signal, not a predictor of job performance or a basis for hiring or selection.');
  return lines.join('\n');
}
