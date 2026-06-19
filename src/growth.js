// growth.js — the TEACH / DIRECT layer of the formation loop. After Forma MEASURES and
// TRAINS a capacity, this is how it TEACHES a person to grow it in everyday life: a few
// concrete, evidence-based habits per capacity, so a result becomes direction.
//
// Honesty contract: these are general FORMATION guidance grounded in the research
// literature (forma-researcher-vetted; sources in the project memory v-note), NOT a
// clinical prescription and NOT a promise of a trait jump. They build the capacity/habit
// over time. Items that are sensible best-practice rather than a hard finding are written
// plainly without overclaiming. Memory items deliberately target USING memory well (the
// honest ceiling: working-memory drills don't far-transfer), never "this raises your IQ".
//
// Keyed by domain id (see domains.js). Each value: array of {title, how, why}. Pure data.

export const GROWTH_GUIDE = {
  attention: [
    { title: 'Single-task in time blocks', how: 'Work one task for a set block (e.g. 25 min) with your phone out of sight; let notifications wait.', why: 'Removing interruption cues protects sustained attention; task-switching carries real resumption costs.' },
    { title: 'Daily focused-breath sits', how: 'Spend 10 minutes resting attention on the breath, gently returning each time the mind wanders.', why: 'Focused-attention meditation improves sustained attention and control in randomized trials.' },
    { title: 'Take a restorative walk', how: 'Step outside for a short walk in green or natural surroundings between demanding work bouts.', why: 'Attention Restoration Theory: time in nature lets directed attention recover.' },
  ],
  memory: [
    { title: 'Retrieve before you reread', how: 'After reading or a meeting, close the source and recall the key points from memory first.', why: 'The testing effect: retrieval beats rereading for durable retention (Roediger & Karpicke).' },
    { title: 'Space your repetitions', how: 'Revisit what you want to keep at expanding intervals — next day, a few days, a week — not in one cram.', why: 'Spacing forces effortful retrieval and yields more durable learning than massed practice.' },
    { title: 'Chunk and externalize', how: 'Group long strings into meaningful units, and offload reference details to notes.', why: 'Chunking expands effective span; offloading frees the workbench to manipulate, not just hold (general guidance).' },
  ],
  reading: [
    { title: 'Explain it back', how: 'Pause after a section and put its meaning in your own words before moving on.', why: 'Self-explanation deepens comprehension and integration (Dunlosky review).' },
    { title: "Ask why it's true", how: 'Interrogate each claim: why would this be the case, and how does it fit what I already know?', why: 'Elaborative interrogation links new facts to prior knowledge, aiding comprehension.' },
    { title: 'Read on paper, undistracted', how: 'For demanding texts, read a physical or single-window copy with notifications off.', why: 'Deeper processing supports comprehension; skimming and interruption undercut it (general guidance).' },
  ],
  persistence: [
    { title: 'Stay one minute longer', how: 'When you feel the urge to quit a hard task, commit to one more small bout before stopping.', why: 'Graded exposure to discomfort builds distress tolerance, as in frustration-tolerance protocols.' },
    { title: "Name the urge, don't obey it", how: "Notice 'I want to quit' as a passing feeling, label it, and keep your hand on the task.", why: 'Acceptance reduces avoidance; the urge is treated as tolerable, not a command.' },
    { title: 'Shrink the next step', how: 'Break the wall into the smallest doable action, and do only that.', why: 'Lowering the action threshold sustains engagement past the quit point (general guidance).' },
  ],
  judgment: [
    { title: 'Consider the opposite', how: 'Before deciding, deliberately ask why your first judgment could be wrong, and list reasons against it.', why: "'Consider the opposite' reliably reduces overconfidence and anchoring (Larrick)." },
    { title: 'Pause on the gut answer', how: 'When an answer feels obvious, stop and check whether the intuitive pull is leading you astray.', why: 'Reflection overrides fast-but-wrong intuitions — the core of the Cognitive Reflection Test.' },
    { title: 'Pre-state your confidence', how: 'Before checking, say how sure you are; later compare it to how often you were right.', why: 'Calibration feedback narrows the confidence–accuracy gap over time.' },
  ],
  ai_autonomy: [
    { title: 'Attempt before you ask', how: 'Draft your own answer first, then use AI to check, extend, or critique it.', why: 'The bet: doing the effort yourself is what keeps the capability yours — a formation frame, not a measured trait.' },
    { title: 'Delegate by decision', how: 'Choose which efforts to keep doing yourself and which to hand off — on purpose, not by default.', why: 'Heavy default offloading correlates with weaker critical thinking (correlational, not proven causal); choosing deliberately is the formation bet.' },
    { title: 'Prompt for reasoning, not answers', how: 'Ask AI to show steps, alternatives, and counterarguments — then judge them yourself.', why: 'Prompting for reasoning keeps you reflecting rather than just consuming answers (general guidance).' },
  ],
  presence: [
    { title: 'Listen without fixing', how: 'When someone shares a struggle, reflect what you hear before offering any solution.', why: "Resisting the 'righting reflex' deepens rapport (Motivational Interviewing)." },
    { title: 'Celebrate their good news', how: 'When someone shares something good, respond with active, genuine interest and questions — not a flat "nice."', why: 'Active-constructive responding predicts higher intimacy and satisfaction (Gable).' },
    { title: 'One conversation, no phone', how: 'Put the phone away and give a person your undivided attention for the length of one talk.', why: 'A visible phone alone lowers perceived closeness and conversation quality (general guidance).' },
  ],
  communication: [
    { title: 'Name the feeling first', how: 'Before responding, label the emotion the other person seems to be expressing.', why: 'Reading emotion accurately is trainable and underpins an attuned response.' },
    { title: 'Take their perspective', how: "Briefly imagine the situation from the other person's point of view before you reply.", why: 'Perspective-taking engages emotion-relevant processing and supports attunement.' },
    { title: 'Reflect, then respond', how: "Paraphrase what you heard ('so you're saying…') before adding your own point.", why: 'Reflective listening confirms understanding and de-escalates (general guidance).' },
  ],
  emotion_regulation: [
    { title: 'Reframe before reacting', how: 'When emotion spikes, ask what other way there is to see the situation before you respond.', why: 'Cognitive reappraisal tends to lower distress more adaptively than suppressing it (Gross).' },
    { title: 'Label what you feel', how: "Put the emotion into specific words ('I feel anxious and rushed') rather than just feeling it.", why: "Affect labeling dampens reactivity — 'name it to tame it' (Lieberman)." },
    { title: 'Slow the breath down', how: 'Lengthen your exhale and breathe slowly for a minute or two when activated.', why: 'Slow-paced breathing raises parasympathetic tone and reduces arousal (general guidance).' },
  ],
  values: [
    { title: 'Name your top values', how: "Clarify a few values that matter most, then ask whether this week's actions actually reflect them.", why: 'Values clarification guides committed action toward a meaningful life (ACT).' },
    { title: 'One values-based act daily', how: 'Each day pick one small action that expresses a chosen value, and do it.', why: 'Consistent values-aligned behavior builds coherence and purpose over time (ACT).' },
    { title: 'Review for coherence', how: "At week's end, reflect briefly on where life and stated beliefs lined up — or drifted apart.", why: 'Noticing belief–behavior gaps motivates realignment (general guidance).' },
  ],
  interior: [
    { title: 'Keep a daily silence', how: 'Hold a few minutes of intentional contemplative silence or prayer at a set time each day.', why: 'Regular contemplative practice supports attention and well-being; consistency matters more than length.' },
    { title: 'Note three good things', how: 'Each night, write three things that went well and why they mattered.', why: "'Three Good Things' produces durable well-being gains in trials (Seligman)." },
    { title: 'Take an awe walk', how: 'Walk somewhere vast or beautiful and deliberately attend to what inspires wonder.', why: 'Awe walks raised gratitude and compassion and lowered distress in a trial with older adults (Sturm, 2020).' },
  ],
};

// The TEACH layer for a capacity, or null if none. Keyed by domain id.
export function growthFor(id) {
  const g = GROWTH_GUIDE[id];
  return Array.isArray(g) && g.length ? g : null;
}
