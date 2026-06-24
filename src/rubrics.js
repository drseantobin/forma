// rubrics.js — anchored developmental markers ("what health looks like") per capacity, by band.
//
// This is the SCALE the AI judges a person's qualitative responses against, so a rating is
// PRINCIPLED — placed against named, observable markers — rather than a vibe. Growth-framed:
// every band names a real place on a path, never a deficit label. The bands line up with the
// app's existing score bands (Emerging 0–39, Developing 40–59, Strong 60–79, Thriving 80–100),
// so the AI's placement and the numeric score are the same act, not two opinions.
//
// DRAFT CONTENT (v322): Sean (psychologist) owns the clinical language — these markers are a
// first pass to refine. The mechanism reads whatever is here; edit the strings freely. Only the
// capacities with a written/qualitative response (the reflection domains) need markers; objective
// performance measures (attention, memory, reading, judgment) are scored from the task itself.

export const BAND_KEYS = ['emerging', 'developing', 'strong', 'thriving'];
export const BAND_LABELS = { emerging: 'Emerging', developing: 'Developing', strong: 'Strong', thriving: 'Thriving' };

export const CAPACITY_RUBRICS = {
  ai_autonomy: {
    label: 'Agency',
    markers: {
      emerging: 'Reaches for AI first and tends to take its output as the answer; an own view forms late, if at all.',
      developing: 'Forms an initial view but lets it go when the AI sounds confident; verifies only sometimes.',
      strong: 'Commits to an own answer first and uses AI as a check — usually catching a confident error.',
      thriving: 'Stays the author throughout: engages AI deliberately, verifies against their own reasoning, and can name when not to use it at all.',
    },
  },
  persistence: {
    label: 'Frustration tolerance',
    markers: {
      emerging: 'Leaves when it gets hard; discomfort reads as a signal to stop.',
      developing: 'Stays briefly but bails near the first real wall; relief outweighs the work.',
      strong: 'Sits in the not-knowing for a real stretch and can name what made it hard and stay anyway.',
      thriving: 'Treats difficulty as the work itself — stays without strain, and returns and recovers after a setback.',
    },
  },
  presence: {
    label: 'Relational presence',
    markers: {
      emerging: 'Listens in order to reply; jumps to fixing or to their own experience.',
      developing: 'Notices the urge to fix and sometimes holds it, but attention drifts.',
      strong: 'Stays with the other person’s reality before responding, and reflects back what they heard.',
      thriving: 'Fully present without rushing to fix — the other person feels met, not managed.',
    },
  },
  values: {
    label: 'Values alignment',
    markers: {
      emerging: 'Days run on default and others’ expectations; little sense of a chosen direction.',
      developing: 'Can name a value, but it rarely shapes the day’s actual choices.',
      strong: 'Names what matters and takes a concrete step toward it, even a small one.',
      thriving: 'Daily choices are visibly authored by their values, and they adjust course when life pulls them off-line.',
    },
  },
};

export function rubricFor(domainId) {
  return CAPACITY_RUBRICS[domainId] || null;
}

// Render the markers as a compact text scale for an AI judging prompt.
export function rubricScaleText(markers) {
  if (!markers) return '';
  return BAND_KEYS
    .filter((b) => markers[b])
    .map((b) => `- ${BAND_LABELS[b]}: ${markers[b]}`)
    .join('\n');
}
