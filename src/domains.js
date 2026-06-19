// domains.js — the core formation domains Forma measures and trains (ten, plus
// an optional Spiritual Life track).
//
// These are the capacities named in the Forma working document: the distinctly
// human faculties that become MORE valuable as AI does more of the cognitive
// work, and most at risk of quiet atrophy when we stop exercising them.
//
// Guardrail (non-negotiable): everything here is framed as FORMATION, not
// diagnosis. We describe capacities, trajectories, and strengths — never
// deficits, disorders, or shame. "Never diagnose. Always develop."

export const DOMAINS = [
  {
    id: 'attention',
    name: 'Attention & Focus',
    short: 'Sustained, recoverable attention',
    icon: '🎯',
    color: '#4C5FD5',
    blurb:
      'The ability to hold your mind on one thing — and to come back when it wanders, instead of being carried off.',
    aiRationale:
      'When every device is engineered to fragment your attention, the capacity to sustain it becomes a form of freedom. AI can summarize anything; it cannot pay attention for you.',
  },
  {
    id: 'memory',
    name: 'Working Memory',
    short: 'Holding and using what you know',
    icon: '🧠',
    color: '#5B8DEF',
    blurb:
      'Keeping several things in mind at once and working with them — the internal workbench where thinking actually happens.',
    aiRationale:
      'Offloading every fact to a model is fine until you need to reason across them in the moment. Retained knowledge is what lets you notice when an answer is wrong.',
  },
  {
    id: 'reading',
    name: 'Deep Reading',
    short: 'Comprehension with depth',
    icon: '📖',
    color: '#3AA99F',
    blurb:
      'Reading slowly enough to understand, to follow an argument, and to hold a long thought without skimming to the end.',
    aiRationale:
      'Comprehension is a muscle. A culture that reads only summaries loses the ability to stay inside a difficult text long enough to follow it — and to think a difficult idea all the way through.',
  },
  {
    id: 'persistence',
    name: 'Frustration Tolerance',
    short: 'Staying with the hard thing',
    icon: '🪨',
    color: '#E8A13A',
    blurb:
      'The willingness to stay with difficulty instead of reaching for the easy exit — the patience that real work requires.',
    aiRationale:
      'When friction can always be removed with one prompt, tolerance for difficulty narrows. But the hard part is usually where the growth is.',
  },
  {
    id: 'judgment',
    name: 'Judgment',
    short: 'Reasoning hygiene & decisions',
    icon: '⚖️',
    color: '#B56AC4',
    blurb:
      'Weighing evidence, noticing your own biases, and deciding well — especially when the answer is not obvious.',
    aiRationale:
      'Models produce confident output; only developed judgment can evaluate it. The skill that survives automation is knowing when the answer is good enough to trust.',
  },
  {
    id: 'ai_autonomy',
    name: 'Agency',
    short: 'Stay the author, even with the tools',
    icon: '🧭',
    color: '#6E8B3D',
    blurb:
      'Remaining the intentional author of your work while you engage tools deeply — leaning on AI when it genuinely helps, holding your own judgment when it’s wrong, and shaping what it gives you rather than just accepting it.',
    aiRationale:
      'The goal is not to use AI less but to stay the one deciding. Agency is calibrated reliance — taking good help, resisting confident-but-wrong help, and keeping authorship of the result.',
  },
  {
    id: 'presence',
    name: 'Relational Presence',
    short: 'Attention given to people',
    icon: '🤝',
    color: '#D2706B',
    blurb:
      'Being fully with another person — listening without managing, staying without fixing, attending without performing.',
    aiRationale:
      'The same muscle that holds attention on a text holds attention on a person. As simulated companionship spreads, the capacity for real presence becomes rare and precious.',
  },
  {
    id: 'communication',
    name: 'Communication & EI',
    short: 'Reading and responding to emotion',
    icon: '🗣️',
    color: '#C2608A',
    blurb:
      'Sensing what another person is actually feeling — and responding in a way that meets them there, not just your own idea of what they need.',
    aiRationale:
      'AI can draft the words; it cannot feel the room. As more of our communication is mediated and auto-generated, the ability to attune to a real person in real time becomes rare and unmistakable.',
  },
  {
    id: 'emotion_regulation',
    name: 'Emotional Regulation',
    short: 'Steadying your own inner weather',
    icon: '🌊',
    color: '#3E8FA8',
    blurb:
      'Noticing a strong feeling without being run by it — staying steady under pressure, and metabolizing your own emotions rather than outsourcing them.',
    aiRationale:
      'When something is always there to absorb every feeling on demand, the muscle that processes emotion from the inside can quietly waste. Regulation is what keeps you the author of your reactions.',
  },
  {
    id: 'values',
    name: 'Values Alignment',
    short: 'Coherence between belief & life',
    icon: '🌿',
    color: '#3D8B6E',
    blurb:
      'Knowing what you actually care about and living in a way that matches it — the quiet integrity of a coherent life.',
    aiRationale:
      'In a world optimized to capture you, knowing your own goals is what keeps you author of your life rather than a product of its defaults.',
  },
];

// The optional, opt-in Spiritual Life / Spiritual Formation domain. Kept OUT of
// the core DOMAINS array so that, with the faith track off, every iteration over
// the core set is unchanged. Grounded in the DSES / Fetzer BMMRS lineage
// (see docs/measurement-architecture.md). Never shown to employers.
export const INTERIOR_DOMAIN = {
  id: 'interior',
  name: 'Spiritual Life',
  short: 'Attentiveness to the spiritual',
  icon: '🕊️',
  color: '#8E7CC3',
  blurb:
    'The lived frequency of spiritual experience — gratitude, awe, a sense of connection and desire for closeness to God — and the practices that deepen it.',
  aiRationale:
    'The same attention that resists the feed is the attention contemplative life requires. As simulated meaning spreads, a real spiritual life becomes both rarer and more grounding.',
  optional: true,
};

// Inline-SVG stroke icons (24px grid, single 1.6 weight, round joins, currentColor)
// for each domain — one coherent geometric set replacing the emoji, so the glyphs are
// crisp, consistent, and theme/state aware (they inherit the surrounding text color and
// flip in dark mode for free). Inner markup only; domainIconSvg() wraps it.
export const DOMAIN_ICON_PATHS = {
  attention: '<circle cx="12" cy="12" r="7.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/><circle cx="12" cy="12" r="1.6"/>',
  memory: '<path d="M12 4 4 8l8 4 8-4-8-4Z"/><path d="M4 12l8 4 8-4"/><path d="M4 16l8 4 8-4"/>',
  reading: '<path d="M12 6.5C9.5 5 6.5 5 4 5.6V18c2.5-.6 5.5-.6 8 1 2.5-1.6 5.5-1.6 8-1V5.6C17.5 5 14.5 5 12 6.5Z"/><path d="M12 6.5V19"/>',
  persistence: '<path d="M3 18.5 9 7l3.5 6 2-3.2 6.5 8.7Z"/>',
  judgment: '<path d="M12 4v16"/><path d="M6.5 20h11"/><path d="M4.5 8h15"/><path d="M4.5 8 2.5 13a2.5 2.5 0 0 0 4 0Z"/><path d="M19.5 8l-2 5a2.5 2.5 0 0 0 4 0Z"/>',
  ai_autonomy: '<circle cx="12" cy="12" r="9"/><path d="M15.6 8.4 13 13l-4.6 2.6L11 11Z"/>',
  presence: '<circle cx="9" cy="8.5" r="2.6"/><circle cx="16.5" cy="9.5" r="2"/><path d="M4 18c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><path d="M14.5 15.5c.6-1.3 2-2 3.5-2 2 0 3.5 1.3 3.5 3.2"/>',
  communication: '<path d="M4 6h13a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H9l-3.5 3V7a1 1 0 0 1 1-1Z"/><circle cx="9" cy="10" r=".7"/><circle cx="12.5" cy="10" r=".7"/><circle cx="16" cy="10" r=".7"/>',
  emotion_regulation: '<path d="M3 9.5c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 6 0"/><path d="M3 14.5c2-2.2 4-2.2 6 0s4 2.2 6 0 4-2.2 6 0"/>',
  values: '<path d="M12 21v-7"/><path d="M12 14c0-3.5 2.2-6 6-6.5-.3 4-2.6 6.3-6 6.5Z"/><path d="M12 14c0-2.8-1.8-4.8-5-5.3.4 3.3 2.2 5 5 5.3Z"/>',
  interior: '<path d="M12 3c2.5 3 4 4.8 4 8a4 4 0 0 1-8 0c0-2.2 1-3.5 2.2-4.4.3 1.3 1 2 2 2.4-.2-2.4-1-4.2-.2-6Z"/>',
};

// Wrap a domain's icon paths in an inline SVG. Default class 'dico' (sized in em by CSS,
// so existing font-size overrides still scale it). Used everywhere a domain glyph renders.
export function domainIconSvg(id, opts = {}) {
  const paths = DOMAIN_ICON_PATHS[id];
  if (!paths) return '';
  const cls = opts.class || 'dico';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

// Swap each domain's render glyph from emoji to its SVG — one consistent set, no emoji.
[...DOMAINS, INTERIOR_DOMAIN].forEach((d) => { if (DOMAIN_ICON_PATHS[d.id]) d.icon = domainIconSvg(d.id); });

// Domains that have an objective in-app measure vs. those formed through
// reflection (the "soft" capacities Forma is careful NOT to fake-test).
export const OBJECTIVE_DOMAINS = ['attention', 'memory', 'reading', 'judgment'];
export const REFLECTIVE_DOMAINS = ['persistence', 'ai_autonomy', 'presence', 'communication', 'emotion_regulation', 'values'];

const DOMAIN_BY_ID = Object.fromEntries([...DOMAINS, INTERIOR_DOMAIN].map((d) => [d.id, d]));

// The domains active for a given user. The Spiritual Life track is opt-in.
export function activeDomainIds(faithTrack) {
  const core = DOMAINS.map((d) => d.id);
  return faithTrack ? [...core, INTERIOR_DOMAIN.id] : core;
}

export function getDomain(id) {
  return DOMAIN_BY_ID[id];
}

export function domainName(id) {
  const d = DOMAIN_BY_ID[id];
  return d ? d.name : id;
}

// Growth-framed bands. Note the labels: every one points UP. Even the lowest
// band is "Emerging," never "deficient." This is a deliberate guardrail.
export const BANDS = [
  {
    key: 'emerging',
    label: 'Emerging',
    min: 0,
    max: 39,
    color: '#C98A3A',
    note: 'A real place to grow from. The first sessions move this the most.',
  },
  {
    key: 'developing',
    label: 'Developing',
    min: 40,
    max: 59,
    color: '#D9B441',
    note: 'Taking shape. Consistency is what turns this into strength.',
  },
  {
    key: 'strong',
    label: 'Strong',
    min: 60,
    max: 79,
    color: '#5B9E6F',
    note: 'A genuine strength. Worth protecting and deepening.',
  },
  {
    key: 'thriving',
    label: 'Thriving',
    min: 80,
    max: 100,
    color: '#3D8B6E',
    note: 'Well formed. Keep it sharp; help others find it.',
  },
];

export function bandFor(score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  return BANDS.find((b) => s >= b.min && s <= b.max) || BANDS[0];
}
