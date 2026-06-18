// methods.js — the scientific basis behind each capacity's measures.
//
// The whole premise of Forma is rigorous measurement, yet the paradigms the
// exercises draw on lived only in code comments — invisible to the employer or
// thoughtful person deciding whether to trust a score. This makes that rigor
// legible. Framing guardrail: Forma ADAPTS established cognitive/psychological
// paradigms for FORMATION (growth over time), it does not administer them as
// clinical or diagnostic instruments. Every entry is written in that spirit.
//
// Keyed by domain id (see domains.js). Pure data + lookups, fully testable.

export const MEASURE_BASIS = {
  attention: {
    paradigm: 'Psychomotor Vigilance Task, SART, pursuit tracking',
    detail: 'Sustained-attention paradigms from cognitive psychology: reaction-time vigilance (the PVT lineage), go/no-go inhibition (SART), and visuomotor target tracking. We read how steadily you hold attention, not how clever you are.',
  },
  memory: {
    paradigm: 'n-back, Digit Span backward (WAIS lineage), serial recall',
    detail: 'Working-memory tasks: holding and updating information (n-back), and holding while manipulating it (digits recalled in reverse, as in the Wechsler scales). These index the mental workbench you think on.',
  },
  reading: {
    paradigm: 'Maze/cloze comprehension, inference-weighted passages',
    detail: 'Comprehension is measured by filling the right word from context (the validated Maze procedure) and by passage questions that weight inference over recall — because drawing an unstated conclusion predicts understanding better than remembering a fact.',
  },
  judgment: {
    paradigm: 'Cognitive Reflection Test, matrix reasoning (Raven’s lineage), decision scenarios',
    detail: 'Reasoning under a pull toward the wrong answer (CRT), pattern completion with no instructions (fluid reasoning, the Raven’s tradition), and structured decision scenarios scored on the quality of the reasoning, not just the choice.',
  },
  ai_autonomy: {
    paradigm: 'Automation-engagement trade-off scenarios',
    detail: 'Rather than measuring how much you use AI, these scenarios probe how deliberately you choose WHICH efforts to keep — the documented risk being skill atrophy when cognitive work is handed over by default rather than by decision.',
  },
  presence: {
    paradigm: 'Situational judgment of relational attention + reflection',
    detail: 'The capacity to attend to a person without managing or fixing. Measured by situational items — the most present response to someone’s grief, withdrawal, or excitement — drawing on person-centred listening and the "righting reflex" from Motivational Interviewing, alongside guided reflection. Formation, not a personality test.',
  },
  communication: {
    paradigm: 'Situational judgment + AI-scored open response',
    detail: 'Effective interpersonal response is measured two ways: a situational-judgment test (the most effective reply among realistic options) and, when enabled, an open written response scored by a rubric — closer to how communication actually works than a self-report scale.',
  },
  emotion_regulation: {
    paradigm: 'Situational Tests of Emotion Management & Understanding (STEM / STEU)',
    detail: 'Two performance measures of emotional intelligence: STEM — given an emotional situation, the most effective way to MANAGE the feeling (adaptive strategy over suppression or rumination); and STEU — reading which emotion a situation evokes, scored against appraisal theory. Understanding and managing, not self-report.',
  },
  values: {
    paradigm: 'Sentence completion (Rotter RISB lineage)',
    detail: 'What you complete a sentence stem with — before you have time to curate it — reveals orientation that a Likert scale can’t. Adapted from the Rotter Incomplete Sentences Blank tradition, scored for self-knowledge, never for labels.',
  },
  persistence: {
    paradigm: 'Behavioral persistence + self-report',
    detail: 'Frustration tolerance is measured behaviorally — whether you stay with a hard task past the urge to quit — combined with an honest self-rating, since the felt experience matters as much as the outcome.',
  },
  interior: {
    paradigm: 'Contemplative practice + DSES-informed self-report',
    detail: 'The optional Interior Life track pairs a timed contemplative-silence practice with self-report informed by the Daily Spiritual Experience Scale. Entirely opt-in, never shown to employers, and held as formation rather than assessment.',
  },
};

// Lookup with a safe default, so a new domain never renders a blank.
export function basisFor(domainId) {
  return MEASURE_BASIS[domainId] || null;
}

// Standalone self-knowledge INSTRUMENTS (they live in Settings, not tied to one capacity domain).
// Same ADAPTS-not-administers framing. Each names its validated paradigm + a citation so a thoughtful
// person can see the basis of what they just did — Forma's whole credibility premise. Order = display order.
export const INSTRUMENT_BASIS = [
  {
    id: 'epistemiccheck', name: 'Epistemic check', icon: '🪞',
    paradigm: 'Over-Claiming Technique (Paulhus, Harms, Bruce & Lysy, 2003)',
    detail: 'You rate familiarity with terms where about a quarter are invented. Claiming the made-up ones is scored by signal detection as self-enhancement — a faking-resistant mirror for the habit of recognizing what we don’t actually know.',
  },
  {
    id: 'calibration', name: 'Calibration', icon: '🎯',
    paradigm: 'Confidence–accuracy calibration; over/under-confidence index (Lichtenstein & Fischhoff lineage; Brier, 1950)',
    detail: 'You answer questions and say how sure you are; the gap between your confidence and your accuracy is your calibration. It asks whether your self-assessment is honest — the skill of knowing when you actually know versus should check.',
  },
  {
    id: 'breathcount', name: 'Breath counting', icon: '🫧',
    paradigm: 'Breath-Counting Task (Levinson, Stoll, Kindy, Merry & Davidson, 2014)',
    detail: 'An objective measure of meta-awareness: counting accuracy reflects sustained attention, and catching yourself when you lose count reflects noticing a wandering mind — the very muscle the practice builds.',
  },
  {
    id: 'deepreading', name: 'Deep reading', icon: '📖',
    paradigm: 'Sentence Verification Technique (Royer, Hastings & Hook, 1979)',
    detail: 'After reading a passage, you tell true restatements from reworded contradictions and plausible additions. Scored by signal detection (d′), it captures comprehension fidelity — how accurately you took in what the text actually said.',
  },
];
