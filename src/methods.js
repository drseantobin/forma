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
    paradigm: 'Relational-attention reflection',
    detail: 'The capacity to attend to a person without managing or fixing. Measured through guided reflection on real relational moments — a formation practice, framed for growth, not a personality test.',
  },
  communication: {
    paradigm: 'Situational judgment + AI-scored open response',
    detail: 'Effective interpersonal response is measured two ways: a situational-judgment test (the most effective reply among realistic options) and, when enabled, an open written response scored by a rubric — closer to how communication actually works than a self-report scale.',
  },
  emotion_regulation: {
    paradigm: 'Situational Test of Emotion Management (STEM lineage)',
    detail: 'A performance measure of emotional intelligence: given an emotional situation, choose the most effective way to manage the feeling. Options are scored by how adaptive the strategy is (reappraisal and problem-solving over suppression and rumination).',
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
