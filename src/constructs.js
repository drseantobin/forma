// src/constructs.js — Forma's CONSTRUCT MODEL: the science-grounded refactor of 11 loose domains
// into a small set of higher-order capacities AI erodes, each a profile of established sub-facets.
// (Grounded by a 4-agent review, 2026-06-18 — see research/construct-model-validity.md: CHC theory,
// Posner attention networks, Baddeley WM, Simple View of Reading, Mayer-Salovey ability-EI,
// Risko & Gilbert offloading, SDT.)
//
// HONESTY CONTRACT (load-bearing): this is a NAVIGATION + PROFILE layer, not a validated scoring
// model. Each construct is shown as the PROFILE of its member facets — never yet a single validated
// "construct score." `scoredValidated` is false everywhere until a confirmatory factor analysis on
// pooled data (N>=300) beats a one-factor g model. The AI-atrophy story drives WHICH capacities we
// chose; it must never enter the score itself. Pure data + lookups, no DOM.

// track: 'cognitive' = objective performance; 'relational' = ability-EI (objective); 'self-regulation'
// = behavioral; 'self-report' = subjective, NEVER on the cognitive scale, NEVER shown to employers.
export const CONSTRUCTS = [
  {
    id: 'attention', name: 'Attention', track: 'cognitive', scoredValidated: false,
    definition: 'Directing and sustaining focus on what you choose, against the pull of distraction.',
    atrophy: 'AI-saturated environments hold our attention for us; deep concentration is the first casualty (Carr).',
    facets: [
      { name: 'Sustained / executive', domains: ['attention'] },
      { name: 'Noticing & returning', instruments: ['breathcount'] },
    ],
  },
  {
    id: 'reasoning', name: 'Reasoning', track: 'cognitive', scoredValidated: false,
    definition: 'Independent fluid reasoning and the reflective override of a tempting wrong answer.',
    atrophy: 'We let AI conclude and decide for us; the muscle of working a problem through atrophies.',
    facets: [
      { name: 'Fluid reasoning & reflection', domains: ['judgment'] },
    ],
  },
  {
    id: 'memory', name: 'Memory', track: 'cognitive', scoredValidated: false,
    definition: 'Holding and updating information in mind — the mental workbench you think on.',
    atrophy: 'The Google effect: we remember where to find things, not the things themselves (Sparrow).',
    facets: [
      { name: 'Working memory', domains: ['memory'] },
    ],
  },
  {
    id: 'reading', name: 'Reading', track: 'cognitive', scoredValidated: false,
    definition: 'Taking in and accurately representing what a text actually says — comprehension fidelity.',
    atrophy: 'We skim and offload; the deep-reading circuit that builds understanding weakens (Wolf).',
    facets: [
      { name: 'Comprehension & inference', domains: ['reading'], instruments: ['deepreading'] },
    ],
  },
  {
    id: 'relating', name: 'Relating', track: 'relational', scoredValidated: false,
    definition: 'Perceiving, understanding, and managing emotion — in yourself and with others (ability-EI).',
    atrophy: 'AI drafts, mediates, and simulates our relating; emotional and relational skill goes unused.',
    facets: [
      { name: 'Emotion understanding & management', domains: ['emotion_regulation'] },
      { name: 'Communication', domains: ['communication'] },
      { name: 'Relational presence', domains: ['presence'] },
    ],
  },
  {
    id: 'metacognition', name: 'Metacognition', track: 'cognitive', scoredValidated: false,
    definition: 'Knowing when you actually know — honest self-assessment of your own knowledge and judgment.',
    atrophy: 'The keystone AI risk: offloading is driven by — and then degrades — our metacognition (Risko & Gilbert; Gerlich).',
    facets: [
      { name: 'Calibration', instruments: ['calibration'] },
      { name: 'Epistemic humility', instruments: ['epistemiccheck'] },
      { name: 'Deliberate AI engagement', domains: ['ai_autonomy'] },
    ],
  },
  // Distress tolerance is self-regulation, NOT emotional intelligence — its own behavioral construct.
  // (Pending Sean's frustration A/B measure redesign.)
  {
    id: 'self_regulation', name: 'Self-regulation', track: 'self-regulation', scoredValidated: false,
    definition: 'Staying with a hard, frustrating task past the urge to quit — behavioral distress tolerance.',
    atrophy: 'When friction can always be offloaded to a machine, tolerance for productive struggle erodes.',
    facets: [
      { name: 'Frustration tolerance', domains: ['persistence'] },
    ],
  },
  // Purpose is a SEPARATE self-report formation track. No performance task exists for meaning; it must
  // never sit on the cognitive scale or be shown to an employer.
  {
    id: 'purpose', name: 'Purpose', track: 'self-report', scoredValidated: false,
    definition: 'Knowing what you are for — values, meaning, and acting from them rather than outsourcing them.',
    atrophy: 'We let algorithms tell us what to want and do; the inner compass goes quiet.',
    facets: [
      { name: 'Values & meaning', domains: ['values'] },
      { name: 'Interior life (optional)', domains: ['interior'] },
    ],
  },
];

// domainId -> construct id (every active domain maps to exactly one construct).
export const CONSTRUCT_FOR_DOMAIN = (() => {
  const m = {};
  for (const c of CONSTRUCTS) for (const f of c.facets) for (const d of (f.domains || [])) m[d] = c.id;
  return m;
})();

export function constructForDomain(domainId) {
  return CONSTRUCT_FOR_DOMAIN[domainId] || null;
}

export function getConstruct(id) {
  return CONSTRUCTS.find((c) => c.id === id) || null;
}

// Build the PROFILE view: group available per-domain scores under their construct and report the
// member facets + a provisional mean. The mean is explicitly NOT a validated construct score — it is
// a profile average shown with humility until the factor model earns a real roll-up. Returns only
// constructs that have at least one scored member (so cold-start surfaces nothing fake).
export function constructProfile(domainScores = {}) {
  const out = [];
  for (const c of CONSTRUCTS) {
    const members = [];
    for (const f of c.facets) {
      for (const d of (f.domains || [])) {
        if (typeof domainScores[d] === 'number') members.push({ facet: f.name, domain: d, score: domainScores[d] });
      }
    }
    if (!members.length) continue;
    const mean = Math.round(members.reduce((a, b) => a + b.score, 0) / members.length);
    out.push({ id: c.id, name: c.name, track: c.track, members, provisionalMean: mean, scoredValidated: c.scoredValidated });
  }
  return out;
}
