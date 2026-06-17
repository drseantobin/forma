// assessments.js — the baseline diagnostic.
//
// A short self-report battery (4 items per domain) that builds the opening
// profile. Each item is rated 1–5 (Strongly disagree → Strongly agree).
// `reverse: true` items are worded so that AGREEMENT indicates LOWER capacity,
// and are reverse-scored. Reverse items guard against acquiescence bias.
//
// These are formation prompts, not a clinical instrument. They are written to
// be honest with yourself, in plain language, the way a thoughtful coach would
// ask — never to label or diagnose.

// 7-point scale for the baseline — finer gradation ("slightly…") gives more
// sensitivity to change, which matters for a longitudinal measurement instrument.
export const LIKERT_SCALE = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Slightly disagree' },
  { value: 4, label: 'Neutral' },
  { value: 5, label: 'Slightly agree' },
  { value: 6, label: 'Agree' },
  { value: 7, label: 'Strongly agree' },
];
export const LIKERT_POINTS = LIKERT_SCALE.length;

export const BASELINE_ITEMS = [
  // Attention & Focus
  { id: 'att1', domain: 'attention', reverse: false, text: 'I can stay focused on one task for 30 minutes without reaching for my phone.' },
  { id: 'att2', domain: 'attention', reverse: true, text: 'I often open my phone without remembering why I picked it up.' },
  { id: 'att3', domain: 'attention', reverse: false, text: 'When my mind wanders, I notice it and bring it back fairly quickly.' },
  { id: 'att4', domain: 'attention', reverse: true, text: 'I usually have several tabs or apps open and switch between them constantly.' },

  // Working Memory
  { id: 'mem1', domain: 'memory', reverse: false, text: 'I can hold a phone number or a short list in my head long enough to use it.' },
  { id: 'mem2', domain: 'memory', reverse: true, text: 'I walk into rooms and forget what I came for more than I would like.' },
  { id: 'mem3', domain: 'memory', reverse: false, text: 'I can follow a multi-step explanation without writing every step down.' },
  { id: 'mem4', domain: 'memory', reverse: true, text: 'I rely on search or AI to recall things I used to simply know.' },

  // Deep Reading
  { id: 'read1', domain: 'reading', reverse: false, text: 'I read long-form articles or books to the end, not just the summary.' },
  { id: 'read2', domain: 'reading', reverse: true, text: 'I tend to skim and skip ahead rather than read carefully.' },
  { id: 'read3', domain: 'reading', reverse: false, text: 'I can follow a complex argument across several pages and hold the thread.' },
  { id: 'read4', domain: 'reading', reverse: true, text: 'I find it hard to sit with a difficult text without getting restless.' },

  // Frustration Tolerance
  { id: 'per1', domain: 'persistence', reverse: false, text: 'When something is hard, I stay with it rather than looking for the easy way out.' },
  { id: 'per2', domain: 'persistence', reverse: true, text: 'I abandon tasks quickly when they stop being enjoyable.' },
  { id: 'per3', domain: 'persistence', reverse: false, text: 'I can tolerate not knowing the answer while I work toward it.' },
  { id: 'per4', domain: 'persistence', reverse: true, text: 'Friction or difficulty makes me want to switch to something easier.' },

  // Judgment
  { id: 'jud1', domain: 'judgment', reverse: false, text: 'Before deciding, I look for evidence that I might be wrong.' },
  { id: 'jud2', domain: 'judgment', reverse: true, text: 'I tend to trust my first impression and move on.' },
  { id: 'jud3', domain: 'judgment', reverse: false, text: 'I can tell the difference between a confident claim and a well-supported one.' },
  { id: 'jud4', domain: 'judgment', reverse: true, text: 'I accept answers that sound right without checking the reasoning.' },

  // AI Independence
  { id: 'ai1', domain: 'ai_autonomy', reverse: false, text: 'I choose deliberately when to use AI and when to do the thinking myself.' },
  { id: 'ai2', domain: 'ai_autonomy', reverse: true, text: 'I reach for AI for tasks I could easily do on my own.' },
  { id: 'ai3', domain: 'ai_autonomy', reverse: false, text: 'I can complete meaningful work without AI assistance when I want to.' },
  { id: 'ai4', domain: 'ai_autonomy', reverse: true, text: 'I feel uneasy or stuck starting hard work without an AI to help.' },

  // Relational Presence
  { id: 'pre1', domain: 'presence', reverse: false, text: 'In conversation I give people my full attention, phone away.' },
  { id: 'pre2', domain: 'presence', reverse: true, text: 'I check my phone during meals or conversations with people I care about.' },
  { id: 'pre3', domain: 'presence', reverse: false, text: 'I can stay with someone’s difficulty without rushing to fix or change the subject.' },
  { id: 'pre4', domain: 'presence', reverse: true, text: 'I am often physically present but mentally elsewhere.' },

  // Communication & Emotional Intelligence
  { id: 'com1', domain: 'communication', reverse: false, text: 'I can usually tell what someone is feeling even when they don’t say it directly.' },
  { id: 'com2', domain: 'communication', reverse: true, text: 'In hard conversations I tend to jump to solutions before the other person feels heard.' },
  { id: 'com3', domain: 'communication', reverse: false, text: 'I can name an emotion accurately — mine or someone else’s — rather than just "good" or "bad."' },
  { id: 'com4', domain: 'communication', reverse: true, text: 'When someone is upset with me, I get defensive before I understand them.' },

  // Emotional Regulation
  { id: 'reg1', domain: 'emotion_regulation', reverse: false, text: 'When a strong feeling hits, I can notice it without being run by it.' },
  { id: 'reg2', domain: 'emotion_regulation', reverse: true, text: 'I react in the heat of the moment and regret how I came across.' },
  { id: 'reg3', domain: 'emotion_regulation', reverse: false, text: 'I can sit with an uncomfortable emotion long enough to understand it.' },
  { id: 'reg4', domain: 'emotion_regulation', reverse: true, text: 'When I feel bad, my first move is to reach for a screen to make it go away.' },

  // Values Alignment
  { id: 'val1', domain: 'values', reverse: false, text: 'I know what matters most to me and could name it clearly.' },
  { id: 'val2', domain: 'values', reverse: true, text: 'How I spend my days does not really match what I say I value.' },
  { id: 'val3', domain: 'values', reverse: false, text: 'My daily choices are mostly mine, not just defaults handed to me by apps.' },
  { id: 'val4', domain: 'values', reverse: true, text: 'I often end the day unsure where my time and attention actually went.' },
];

// Optional Interior Life / Spiritual Formation baseline (DSES-derived; opt-in).
// Frequency-of-experience items, phrased on the same agree scale. Not reverse-
// scored. Only used when the user has enabled the faith track.
export const INTERIOR_ITEMS = [
  { id: 'int1', domain: 'interior', reverse: false, text: 'I sense God’s presence in the ordinary moments of my day.' },
  { id: 'int2', domain: 'interior', reverse: false, text: 'I experience gratitude or awe that lifts me out of myself.' },
  { id: 'int3', domain: 'interior', reverse: false, text: 'I make time for prayer, silence, or worship even when life is busy.' },
  { id: 'int4', domain: 'interior', reverse: false, text: 'I feel a desire to be closer to God, and I act on it.' },
];

export const ALL_ITEMS = BASELINE_ITEMS.concat(INTERIOR_ITEMS);

// Grouped by domain, in the given order — drives the lesson-style flow (one
// short screen per domain). Pulls from the combined pool so the interior track
// works when included in the order.
export function baselineByDomain(domainOrder) {
  return domainOrder.map((id) => ({
    domain: id,
    items: ALL_ITEMS.filter((i) => i.domain === id),
  }));
}
