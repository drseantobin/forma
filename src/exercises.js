// exercises.js — the daily formation exercise library.
//
// The daily loop draws one exercise, calibrated to the user's current growth
// focus. Several exercise families map across the capacities; the originals:
//
//   reading   → Deep Reading (objective: comprehension questions)
//   memory    → Working Memory (objective: sequence recall)
//   decision  → Judgment (objective: best-reasoning scenario)
//   reflection→ the reflective domains (persistence, ai_autonomy, presence,
//               values) — a writing prompt + an honest self-rating. We do NOT
//               fake an objective test for relational presence or values.
//
// Everything is short by design: the whole loop is meant to take 3–5 minutes.

// ----- READING: short passages with comprehension checks -----
export const READING = [
  {
    id: 'read-attention-economy',
    type: 'reading',
    domain: 'reading',
    title: 'The Attention Economy',
    passage:
      'For most of history, information was scarce and attention was abundant. A person might wait weeks for a letter and read it many times. Today the ratio has inverted: information is effectively infinite, and attention is the scarce resource everyone competes for. Platforms do not sell you content; they sell your attention to advertisers, which means their real product is your continued distraction. The danger is not any single notification but the slow reshaping of what your mind expects — a baseline of constant interruption that makes sustained thought feel unnatural.',
    questions: [
      {
        q: 'According to the passage, what is the platforms’ real product?',
        options: ['The content they show you', 'Your attention, sold to advertisers', 'Faster information delivery', 'Better letters'],
        answer: 1,
      },
      {
        q: 'What historical inversion does the author describe?',
        options: [
          'Attention became infinite; information became scarce',
          'Both attention and information became scarce',
          'Information became infinite; attention became scarce',
          'Neither changed',
        ],
        answer: 2,
      },
      {
        q: 'The author says the real danger is:',
        options: [
          'A single notification',
          'Slow grocery delivery',
          'The reshaping of what your mind expects',
          'The cost of advertising',
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'read-cognitive-offloading',
    type: 'reading',
    domain: 'reading',
    title: 'Use It or Lose It',
    passage:
      'Cognitive effort behaves much like physical effort: it is use-it-or-lose-it. When you stop walking, your legs weaken; when you stop calculating, recalling, and reasoning, those capacities quietly decline. This is not an argument against tools. Calculators did not destroy mathematics. The difference now is scale. AI can absorb an entire domain of effort at once — drafting, summarizing, deciding, remembering — and when friction is removed everywhere without any deliberate substitution, the underlying capacity has nowhere left to train. The skill is not avoiding the tool. It is choosing, on purpose, where to keep the effort.',
    questions: [
      {
        q: 'The central analogy compares cognitive effort to:',
        options: ['Physical effort', 'Financial saving', 'Sleep', 'Reading speed'],
        answer: 0,
      },
      {
        q: 'Why does the author say AI is different from a calculator?',
        options: [
          'It is more accurate',
          'It can absorb an entire domain of effort at once',
          'It is harder to use',
          'It costs more',
        ],
        answer: 1,
      },
      {
        q: 'The author’s recommended skill is to:',
        options: [
          'Avoid all tools',
          'Use AI for everything',
          'Choose on purpose where to keep the effort',
          'Calculate by hand only',
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'read-deep-work',
    type: 'reading',
    domain: 'reading',
    title: 'The Shallows and the Deep',
    passage:
      'Two kinds of work fill a day. Shallow work is logistical and reactive — email, messages, small tasks done in a fog of interruption. Deep work is cognitively demanding and done without distraction, and it is where the things that matter most are produced. The trouble is that shallow work feels productive in the moment because it offers constant small completions, while deep work feels uncomfortable because progress is slow and uncertain. A life can fill entirely with the shallow and never notice the deep going missing. Protecting the deep requires defending unbroken blocks of attention against a world designed to break them.',
    questions: [
      {
        q: 'What makes shallow work feel productive?',
        options: [
          'It is more important',
          'It offers constant small completions',
          'It takes longer',
          'It requires more focus',
        ],
        answer: 1,
      },
      {
        q: 'Deep work is characterized as:',
        options: [
          'Logistical and reactive',
          'Easy and comfortable',
          'Cognitively demanding and done without distraction',
          'Done mostly over email',
        ],
        answer: 2,
      },
      {
        q: 'According to the passage, protecting deep work requires:',
        options: [
          'More notifications',
          'Defending unbroken blocks of attention',
          'Doing more shallow work first',
          'Working faster',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'read-silence',
    type: 'reading',
    domain: 'reading',
    title: 'The Discipline of Silence',
    passage:
      'Contemplative traditions across centuries converged on a strange discovery: that silence is not empty but generative. Sitting still without input — no music, no screen, no task — is initially unbearable, because the mind, accustomed to stimulation, rebels. But past that resistance lies a different mode of thought: associative, integrative, the place where scattered experiences are quietly woven into understanding. Modern life has nearly eliminated this condition. Every gap is filled, every pause is fed a screen. We have not decided that reflection is worthless; we have simply removed the silence in which it used to happen.',
    questions: [
      {
        q: 'The passage claims silence is:',
        options: ['Empty and wasteful', 'Generative, not empty', 'Only for monks', 'Easy to sustain'],
        answer: 1,
      },
      {
        q: 'What lies past the initial resistance to silence?',
        options: [
          'Boredom only',
          'An associative, integrative mode of thought',
          'Sleep',
          'More distraction',
        ],
        answer: 1,
      },
      {
        q: 'How has modern life affected reflection, per the author?',
        options: [
          'Decided it is worthless',
          'Made it easier',
          'Removed the silence it used to happen in',
          'Replaced it with reading',
        ],
        answer: 2,
      },
    ],
  },
  {
    id: 'read-judgment-machines',
    type: 'reading',
    domain: 'reading',
    title: 'Confidence Is Not Accuracy',
    passage:
      'A fluent, confident answer feels true. This is a quirk of human cognition: we mistake the ease of processing a statement for evidence of its correctness. Language models are unusually good at producing fluent, confident answers — including when they are wrong. That makes them a stress test for judgment. The person who can pause on a smooth answer and ask "how would I know if this were false?" retains something the model cannot supply: the discipline of verification. As fluent text becomes infinite and nearly free, that discipline becomes the scarce and valuable skill.',
    questions: [
      {
        q: 'The "quirk of cognition" the passage names is:',
        options: [
          'We mistake fluency for correctness',
          'We trust slow answers',
          'We dislike confident people',
          'We prefer written answers',
        ],
        answer: 0,
      },
      {
        q: 'Why are language models a "stress test for judgment"?',
        options: [
          'They are always wrong',
          'They produce fluent, confident answers even when wrong',
          'They refuse to answer',
          'They are slow',
        ],
        answer: 1,
      },
      {
        q: 'The scarce, valuable skill named is:',
        options: ['Typing speed', 'The discipline of verification', 'Memorizing facts', 'Reading quickly'],
        answer: 1,
      },
    ],
  },
  {
    id: 'read-presence',
    type: 'reading',
    domain: 'reading',
    title: 'The Cost of Staying',
    passage:
      'To be present to another person’s suffering asks something specific: the ability to remain when there is nothing useful to say. Most of us, faced with someone’s pain, reach to fix it, reframe it, or change the subject — not out of cruelty but out of our own discomfort with helplessness. Genuine accompaniment requires tolerating that helplessness without fleeing into action. It is the same capacity required to sit in silence, or to hold attention on a hard text: the willingness to stay. A culture that has lost the habit of staying will always prefer a companion that never asks it to.',
    questions: [
      {
        q: 'Genuine accompaniment, the author says, requires:',
        options: [
          'Quickly fixing the problem',
          'Tolerating helplessness without fleeing into action',
          'Changing the subject',
          'Giving advice',
        ],
        answer: 1,
      },
      {
        q: 'Why do people reach to fix another’s pain?',
        options: [
          'Out of cruelty',
          'Out of their own discomfort with helplessness',
          'Because it always helps',
          'To perform',
        ],
        answer: 1,
      },
      {
        q: 'The author links presence to which other capacity?',
        options: [
          'Typing',
          'The willingness to stay (as in silence or hard reading)',
          'Speaking quickly',
          'Multitasking',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'read-memory-extended',
    type: 'reading',
    domain: 'reading',
    title: 'The Extended Mind',
    passage:
      'Philosophers once argued that the mind does not stop at the skull — that a notebook, in the right relationship to its user, is genuinely part of their cognition. The idea was meant to dignify our tools. But there is a hidden condition the argument assumes: that the person can still do the work internally when they must, and chooses the tool deliberately. A notebook extends a mind that is already capable. The danger of effortless external memory is subtler: not that we use it, but that we stop being able to do without it, until the "extension" has quietly become a replacement. The question to ask of any tool is simple. Could I still do this myself if I had to? While the answer stays yes, the tool extends you. When it turns to no, the tool has begun to stand in for you.',
    questions: [
      {
        q: 'The "hidden condition" behind the extended-mind argument is that the person:',
        options: ['Owns expensive tools', 'Can still do the work internally when they must', 'Writes quickly', 'Avoids notebooks'],
        answer: 1,
      },
      {
        q: 'The subtle danger the author names is:',
        options: [
          'Using tools at all',
          'Buying too many notebooks',
          'Losing the ability to do without the tool until it replaces you',
          'Writing too much down',
        ],
        answer: 2,
      },
      {
        q: 'The author’s test for any tool is:',
        options: [
          'Is it expensive?',
          'Could I still do this myself if I had to?',
          'Is it popular?',
          'Is it fast?',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'read-boredom',
    type: 'reading',
    domain: 'reading',
    title: 'In Defense of Boredom',
    passage:
      'Boredom has a bad reputation it does not deserve. We treat it as a void to be filled at the first opportunity, and the modern phone exists in large part to fill it instantly. But boredom is not empty time; it is the mind signaling that it is between stimulations and ready to generate its own. Children who are never bored rarely learn to play from the inside; adults who never tolerate boredom rarely think an original thought, because original thought tends to arrive precisely in the unfilled gap. To eliminate boredom completely is to eliminate the conditions under which the mind turns inward and makes something. The capacity to be bored without immediately escaping it is, strangely, a creative discipline.',
    questions: [
      {
        q: 'The author reframes boredom as:',
        options: [
          'A void to be filled',
          'The mind signaling it is ready to generate its own stimulation',
          'A waste of time',
          'A medical problem',
        ],
        answer: 1,
      },
      {
        q: 'According to the passage, original thought tends to arrive:',
        options: ['On a schedule', 'When stimulated constantly', 'In the unfilled gap', 'Only in childhood'],
        answer: 2,
      },
      {
        q: 'The "creative discipline" the author names is:',
        options: [
          'Filling every moment',
          'Being bored without immediately escaping it',
          'Avoiding silence',
          'Reading faster',
        ],
        answer: 1,
      },
    ],
  },
  {
    id: 'read-effort-paradox',
    type: 'reading',
    domain: 'reading',
    title: 'The Effort Paradox',
    passage:
      'We are built to conserve effort, and also to find meaning in it. This is the effort paradox: people consistently choose the easier path in the moment, yet report their proudest, most meaningful experiences as the ones that demanded the most of them. A tool that removes effort therefore offers a real gift and a real cost at once. It hands us the outcome while quietly removing the very struggle that would have made the outcome ours. The resolution is not to manufacture pointless difficulty — suffering for its own sake is not virtue. It is to notice which efforts are load-bearing: the ones that, if outsourced, leave you with the result but not the growth. Those are the efforts worth protecting from your own desire to be rid of them.',
    questions: [
      {
        q: 'The "effort paradox" is that people:',
        options: [
          'Always enjoy hard work',
          'Choose ease in the moment but find meaning in effort',
          'Never work hard',
          'Dislike all outcomes',
        ],
        answer: 1,
      },
      {
        q: 'A tool that removes effort hands us the outcome while removing:',
        options: ['The cost', 'The struggle that would have made the outcome ours', 'The tool', 'The boredom'],
        answer: 1,
      },
      {
        q: 'The author says the resolution is to:',
        options: [
          'Manufacture pointless difficulty',
          'Outsource everything',
          'Notice which efforts are load-bearing and protect them',
          'Avoid all tools',
        ],
        answer: 2,
      },
    ],
  },
];

// Deep reading sustains attention, so every reading session also credits the
// Attention scale (at a gentler weight — see profile.applySession).
READING.forEach((e) => { e.secondaryDomain = 'attention'; });

// The synthesizing question in each passage (the "what's the real point / danger /
// skill" one) requires bridging inference, not literal recall — and inference
// items predict comprehension better, so the scorer weights them 1.5× (scoring.js).
// Tagging activates that weighting. Index 2 is consistently the inference question.
READING.forEach((e) => { if (e.questions[2]) e.questions[2].kind = 'inference'; });

// ----- MAZE: cloze reading-comprehension test (Deep Reading) -----
// CBM-Maze paradigm (validated): every so often a word is replaced by a choice
// of three; only the meaning-correct word fits. Picking it requires actually
// constructing the sense of the text. Score = proportion correct.
export const MAZE = [
  {
    id: 'maze-attention', type: 'maze', domain: 'reading', secondaryDomain: 'attention', title: 'Read for the Sense',
    parts: [
      { text: 'For most of history, information was ' },
      { blank: { options: ['scarce', 'loud', 'digital'], answer: 0 } },
      { text: ' and attention was abundant. Today the ratio has ' },
      { blank: { options: ['inverted', 'improved', 'paused'], answer: 0 } },
      { text: ': information is effectively infinite, and attention is the resource everyone ' },
      { blank: { options: ['competes', 'sleeps', 'forgets'], answer: 0 } },
      { text: ' for. Platforms do not sell you content; they sell your ' },
      { blank: { options: ['attention', 'furniture', 'silence'], answer: 0 } },
      { text: ' to advertisers. The danger is not any single notification but the slow ' },
      { blank: { options: ['reshaping', 'cleaning', 'lowering'], answer: 0 } },
      { text: ' of what your mind expects.' },
    ],
  },
  {
    id: 'maze-effort', type: 'maze', domain: 'reading', secondaryDomain: 'attention', title: 'Read for the Sense',
    parts: [
      { text: 'Cognitive effort behaves much like physical effort: it is ' },
      { blank: { options: ['use-it-or-lose-it', 'free', 'permanent'], answer: 0 } },
      { text: '. When you stop calculating, recalling, and reasoning, those capacities quietly ' },
      { blank: { options: ['decline', 'multiply', 'wait'], answer: 0 } },
      { text: '. This is not an argument against tools — calculators did not ' },
      { blank: { options: ['destroy', 'invent', 'replace'], answer: 0 } },
      { text: ' mathematics. The difference now is ' },
      { blank: { options: ['scale', 'color', 'price'], answer: 0 } },
      { text: ': AI can absorb an entire domain of effort at once, so the skill is choosing, on purpose, where to keep the ' },
      { blank: { options: ['effort', 'money', 'silence'], answer: 0 } },
      { text: '.' },
    ],
  },
  {
    id: 'maze-judgment', type: 'maze', domain: 'reading', secondaryDomain: 'judgment', title: 'Read for the Sense',
    parts: [
      { text: 'When an AI hands you an answer, the easy move is to ' },
      { blank: { options: ['accept', 'frame', 'lose'], answer: 0 } },
      { text: ' it whole. But a model can be ' },
      { blank: { options: ['confidently', 'rarely', 'quietly'], answer: 0 } },
      { text: ' wrong — fluent text that sounds ' },
      { blank: { options: ['plausible', 'boring', 'random'], answer: 0 } },
      { text: ' yet is false. What protects you is not knowing every fact, but keeping enough ' },
      { blank: { options: ['judgment', 'silence', 'money'], answer: 0 } },
      { text: ' to notice when an answer does not ' },
      { blank: { options: ['add', 'slow', 'speed'], answer: 0 } },
      { text: ' up.' },
    ],
  },
  {
    id: 'maze-focus', type: 'maze', domain: 'reading', secondaryDomain: 'attention', title: 'Read for the Sense',
    parts: [
      { text: 'Deep work is the ability to focus without ' },
      { blank: { options: ['distraction', 'effort', 'reward'], answer: 0 } },
      { text: ' on a demanding task. It is becoming ' },
      { blank: { options: ['rare', 'common', 'loud'], answer: 0 } },
      { text: ' precisely as it becomes more ' },
      { blank: { options: ['valuable', 'cheap', 'simple'], answer: 0 } },
      { text: ', because the same tools that fragment attention also reward the few who can ' },
      { blank: { options: ['resist', 'enjoy', 'follow'], answer: 0 } },
      { text: ' them. Like a muscle, the capacity is built through ' },
      { blank: { options: ['deliberate', 'random', 'brief'], answer: 0 } },
      { text: ', repeated practice.' },
    ],
  },
];


// ----- MEMORY: sequence recall (objective) -----
const WORD_POOL = [
  'river', 'candle', 'iron', 'meadow', 'anchor', 'lantern', 'thistle', 'harbor',
  'cobalt', 'willow', 'ember', 'marble', 'falcon', 'cedar', 'quartz', 'velvet',
  'pewter', 'saffron', 'bramble', 'compass', 'orchard', 'beacon', 'cipher', 'tundra',
];

// Deterministic shuffle helper so tests can pass a seeded rng.
function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A shuffled list of the indices [0..n-1]. The UI uses this to randomize the
// ORDER options are shown in, so a fixed authored position (Matrix/Maze always
// store the correct choice first) can't be gamed by "always pick the first."
// Display order is shuffled; the stored value stays the original index, so
// scoring is unaffected.
export function shuffledIndices(n, rng = Math.random) {
  return shuffle(Array.from({ length: n }, (_, i) => i), rng);
}

// level 1..5 → sequence length 4..8. Returns an exercise object.
export function makeMemoryExercise(level = 1, rng = Math.random) {
  const len = Math.max(4, Math.min(8, 3 + Math.round(level)));
  const shuffled = shuffle(WORD_POOL, rng);
  const sequence = shuffled.slice(0, len);
  // The recall pool MUST contain every sequence word (or the task is
  // unsolvable), plus a few distractors. Build it from the sequence itself.
  const distractors = shuffled.slice(len, len + 4);
  const pool = shuffle(sequence.concat(distractors), rng);
  return {
    id: `mem-${Date.now()}-${len}`,
    type: 'memory',
    domain: 'memory',
    title: 'Hold the Sequence',
    instructions:
      'A list of words will appear for a few seconds. Read them in order, then they vanish — and you reassemble them from memory.',
    sequence,
    showMs: 1200 + len * 600,
    pool,
  };
}

// ----- DECISION: best-reasoning scenarios (objective on reasoning quality) -----
export const DECISIONS = [
  {
    id: 'dec-anomaly',
    type: 'decision',
    domain: 'judgment',
    title: 'The Surprising Result',
    scenario:
      'An AI analysis tells you a marketing change caused a 40% jump in sales last week. Your boss is thrilled and wants to roll it out everywhere on Monday.',
    prompt: 'What is the soundest next move?',
    options: [
      { id: 'a', text: 'Roll it out everywhere — the data is clear and the boss agrees.', score: 15, rationale: 'Confidence and authority are not evidence. A single week with no comparison can be coincidence (a holiday, a viral post, a pricing change elsewhere).' },
      { id: 'b', text: 'Check what else changed that week and whether the jump holds up against a baseline before scaling.', score: 100, rationale: 'This is reasoning hygiene: look for confounds and a comparison point before acting on a surprising result. Exactly right.' },
      { id: 'c', text: 'Reject the finding — AI analyses can’t be trusted.', score: 30, rationale: 'Reflexive dismissal is the mirror image of reflexive acceptance. The move is to verify, not to disbelieve on principle.' },
      { id: 'd', text: 'Ask the AI to re-run the analysis and trust whatever it says the second time.', score: 25, rationale: 'Re-running the same method on the same data won’t reveal a confound. You need an independent check, not a repeat.' },
    ],
  },
  {
    id: 'dec-disagree',
    type: 'decision',
    domain: 'judgment',
    title: 'The Expert Who Disagrees',
    scenario:
      'You hold a confident opinion on a complex topic. A thoughtful person whose intelligence you respect argues the opposite, with reasons you hadn’t considered.',
    prompt: 'What does good judgment look like here?',
    options: [
      { id: 'a', text: 'Restate your position more forcefully — you’ve already thought it through.', score: 15, rationale: 'Forcefulness is not accuracy. New reasons you hadn’t considered are exactly the signal that you should update, not dig in.' },
      { id: 'b', text: 'Try to genuinely steelman their view and notice whether your confidence should drop.', score: 100, rationale: 'Steelmanning and being willing to lower your confidence is the core of reasoning hygiene. You can hold your view AND let it be moved.' },
      { id: 'c', text: 'Defer to them completely — they’re smart, so they must be right.', score: 35, rationale: 'Swapping your judgment for someone else’s authority isn’t judgment. Weigh the reasons, not the credentials.' },
      { id: 'd', text: 'Avoid the topic so you don’t have to feel uncertain.', score: 20, rationale: 'Avoiding the discomfort of uncertainty is how poor judgment protects itself. The discomfort is where the thinking happens.' },
    ],
  },
  {
    id: 'dec-shortcut',
    type: 'decision',
    domain: 'judgment',
    title: 'The Tempting Shortcut',
    scenario:
      'You have to write something that matters and that you’ll be judged on. You could draft it yourself over two hours, or have AI produce a solid version in two minutes.',
    prompt: 'Which choice best protects your long-term judgment?',
    options: [
      { id: 'a', text: 'Always use the AI draft — output is what counts, not how you got it.', score: 25, rationale: 'For low-stakes work this is fine. But "always" removes all the effort that forms the underlying skill — and this one matters and will be judged.' },
      { id: 'b', text: 'Draft the core thinking yourself, then use AI to pressure-test and refine it.', score: 100, rationale: 'You keep the formative effort (the thinking) and use the tool where it adds value (refinement). This is wise delegation, not dependence.' },
      { id: 'c', text: 'Refuse to use AI at all, on principle.', score: 60, rationale: 'Honorable, and it preserves the effort — but a blanket refusal also forfeits genuine help. Independence is choosing, not abstaining by rule.' },
      { id: 'd', text: 'Have AI write it, then change a few words so it feels like yours.', score: 15, rationale: 'This keeps neither the effort nor the integrity. You lose the formation and gain a false sense of authorship.' },
    ],
  },
  {
    id: 'dec-source',
    type: 'decision',
    domain: 'judgment',
    title: 'The Striking Statistic',
    scenario:
      'You read a striking statistic that perfectly confirms something you already believe. It’s getting shared widely and it would strengthen your argument.',
    prompt: 'Before you repeat it, the most disciplined move is to:',
    options: [
      { id: 'a', text: 'Share it — it’s being widely repeated, so it’s probably solid.', score: 15, rationale: 'Wide repetition measures virality, not truth. Statistics that confirm what we already believe get the least scrutiny — which is exactly backward.' },
      { id: 'b', text: 'Trace it to its original source and check how the number was actually derived.', score: 100, rationale: 'Tracing a claim to its source — especially one you WANT to be true — is reasoning hygiene at its best. Confirmation bias is strongest on the claims we like.' },
      { id: 'c', text: 'Trust it because it matches your experience.', score: 30, rationale: 'Your experience is one data point and a biased one here. Fit with prior belief is the warning sign, not the green light.' },
      { id: 'd', text: 'Soften it to "studies show" so you don’t have to cite it.', score: 20, rationale: 'Vagueness hides the problem instead of solving it. If you can’t stand behind the source, you can’t stand behind the claim.' },
    ],
  },
  {
    id: 'dec-quit',
    type: 'decision',
    domain: 'judgment',
    title: 'Stuck on a Hard Problem',
    scenario:
      'You’ve been working on a genuinely difficult problem for 20 minutes and you’re frustrated and stuck. An AI could probably hand you the answer instantly.',
    prompt: 'Which response best balances getting unstuck and staying capable?',
    options: [
      { id: 'a', text: 'Immediately ask AI for the full answer and move on.', score: 25, rationale: 'Efficient, but if you do this every time the stuck-and-frustrated phase is gone — and that phase is where problem-solving capacity is actually built.' },
      { id: 'b', text: 'Stay with it a bit longer, try one more angle, then ask AI for a hint rather than the answer.', score: 100, rationale: 'You honor the difficulty (where growth lives) and use the tool to keep moving without surrendering the whole problem. Frustration tolerance plus wise delegation.' },
      { id: 'c', text: 'Push on alone for hours no matter what, refusing any help.', score: 60, rationale: 'Persistence is good, but rigid refusal of help can be its own trap. Knowing when a hint serves you is part of judgment.' },
      { id: 'd', text: 'Abandon the problem entirely — it’s too hard right now.', score: 20, rationale: 'Quitting at the point of frustration trains the habit of quitting at frustration. The wall is usually just before the breakthrough.' },
    ],
  },
  {
    id: 'dec-delegate-judgment',
    type: 'decision',
    domain: 'judgment',
    title: 'The Decision You Outsourced',
    scenario:
      'You ask an AI to make a moderately important judgment call for you — which of two job offers to take — and it gives a clear, confident recommendation with good reasons.',
    prompt: 'What is the wisest way to use that output?',
    options: [
      { id: 'a', text: 'Follow the recommendation — it reasoned it out better than you could.', score: 20, rationale: 'A values-laden life decision isn’t a task you can fully delegate. The model doesn’t know what it’s like to be you, and outsourcing the choice also outsources ownership of the consequences.' },
      { id: 'b', text: 'Treat it as one well-argued input, then feel out which option you’d actually want to live.', score: 100, rationale: 'Exactly. Use the analysis to sharpen your thinking, but keep the decision — especially a values-laden one — yours. That’s the line between a tool and a substitute.' },
      { id: 'c', text: 'Ignore it entirely — only you can decide your life.', score: 60, rationale: 'The instinct to own the decision is right, but discarding a genuinely good analysis is wasteful. Independence means weighing the input, not refusing it.' },
      { id: 'd', text: 'Ask it three more times and go with the majority answer.', score: 20, rationale: 'Repeating the same query isn’t deliberation; it’s laundering a single source into false consensus. The work is yours to do, not to re-roll.' },
    ],
  },
  {
    id: 'dec-base-rate',
    type: 'decision',
    domain: 'judgment',
    title: 'The Vivid Story',
    scenario:
      'A friend tells you a vivid, alarming story about something that went wrong, and urges you to change a sensible plan because of it. The story is gripping and emotionally convincing.',
    prompt: 'The most sound reasoning move is to:',
    options: [
      { id: 'a', text: 'Change the plan — the story makes the risk feel real.', score: 20, rationale: 'A single vivid anecdote feels like strong evidence but usually isn’t. Vividness drives availability bias; it tells you what’s easy to imagine, not what’s likely.' },
      { id: 'b', text: 'Ask how often that outcome actually happens before reacting to one vivid case.', score: 100, rationale: 'Right — reach for the base rate. One memorable story is a sample size of one. Good judgment weighs frequency, not just emotional vividness.' },
      { id: 'c', text: 'Dismiss the friend — anecdotes are worthless.', score: 60, rationale: 'Anecdotes aren’t worthless; they can flag a risk worth checking. The error is letting one stand in for the rate. Check, don’t dismiss.' },
      { id: 'd', text: 'Split the difference and change half the plan.', score: 30, rationale: 'Compromising between a number you haven’t checked and a story you can’t verify isn’t reasoning — it’s splitting the difference between two unknowns.' },
    ],
  },
  {
    id: 'dec-verify-cost',
    type: 'decision',
    domain: 'judgment',
    title: 'When Verifying Costs More',
    scenario:
      'An AI gives you an answer you’ll act on. Verifying it properly would take 15 minutes; the answer looks plausible and being wrong would be mildly embarrassing but not catastrophic.',
    prompt: 'What does proportionate judgment look like here?',
    options: [
      { id: 'a', text: 'Always verify everything fully, no matter the stakes.', score: 45, rationale: 'Admirable rigor, but verifying everything to the same depth ignores stakes — and burns the time and attention you’d want for the decisions that truly matter.' },
      { id: 'b', text: 'Do a quick sanity check proportionate to the low stakes, and verify hard only when stakes are high.', score: 100, rationale: 'Yes — calibrate scrutiny to stakes. Reasoning hygiene isn’t maximal doubt everywhere; it’s spending your skepticism where being wrong actually costs something.' },
      { id: 'c', text: 'Skip checking — it looks plausible and the stakes are low.', score: 35, rationale: 'Plausibility is exactly the trap; fluent-but-wrong answers look plausible too. Even low stakes deserve a quick gut-check, not a blind pass.' },
      { id: 'd', text: 'Trust it more because the AI is usually right.', score: 25, rationale: '"Usually right" is how the occasional confident error slips through unexamined. Calibrate to the stakes of THIS decision, not the tool’s batting average.' },
    ],
  },
];

// ----- REFLECTION: writing prompt + honest self-rating (reflective domains) -----
export const REFLECTIONS = [
  {
    id: 'ref-persist-1',
    type: 'reflection',
    domain: 'persistence',
    title: 'Where You Reached for the Exit',
    prompt:
      'Think of one moment today when something got hard and you felt the pull to switch to something easier. What was it — and what did you do?',
    selfRatingLabel: 'How well did you stay with difficulty today?',
  },
  {
    id: 'ref-persist-2',
    type: 'reflection',
    domain: 'persistence',
    title: 'The Hard Thing You Stayed With',
    prompt:
      'Name something you stayed with even though it was uncomfortable. What made it possible to not bail?',
    selfRatingLabel: 'How well did you stay with discomfort today?',
  },
  {
    id: 'ref-ai-1',
    type: 'reflection',
    domain: 'ai_autonomy',
    title: 'What You Delegated',
    prompt:
      'Name one thing you handed to AI today that you could have done yourself. Was that a wise choice or a reflex? No wrong answer — just notice.',
    selfRatingLabel: 'How deliberate were your choices to use (or not use) AI today?',
  },
  {
    id: 'ref-ai-2',
    type: 'reflection',
    domain: 'ai_autonomy',
    title: 'Effort You Kept',
    prompt:
      'Name something you chose to do yourself today, on purpose, even though AI could have done it. Why did you keep that one?',
    selfRatingLabel: 'How in-command of your own effort did you feel today?',
  },
  {
    id: 'ref-presence-1',
    type: 'reflection',
    domain: 'presence',
    title: 'Fully With Someone',
    prompt:
      'Recall a conversation today. Were you fully there — phone away, not rehearsing your reply? Describe one moment of real presence, or one you missed.',
    selfRatingLabel: 'How present were you with people today?',
  },
  {
    id: 'ref-presence-2',
    type: 'reflection',
    domain: 'presence',
    title: 'Staying Without Fixing',
    prompt:
      'Was there a moment someone needed you to simply listen, and you felt the urge to fix or change the subject? What happened?',
    selfRatingLabel: 'How well did you stay present without rushing to fix?',
  },
  {
    id: 'ref-values-1',
    type: 'reflection',
    domain: 'values',
    title: 'Where the Day Actually Went',
    prompt:
      'If you traced your attention today honestly, where did most of it go? Did that match what you say matters most to you?',
    selfRatingLabel: 'How well did today match what you actually value?',
  },
  {
    id: 'ref-values-2',
    type: 'reflection',
    domain: 'values',
    title: 'A Choice That Was Yours',
    prompt:
      'Name one choice today that was genuinely yours — not a default handed to you by an app, a feed, or a habit. What made it yours?',
    selfRatingLabel: 'How much was today authored by you rather than by defaults?',
  },
  {
    id: 'ref-persist-3',
    type: 'reflection',
    domain: 'persistence',
    title: 'The Wall',
    prompt:
      'Think of a moment recently when you hit a wall — the point where it stopped being fun and started being work. Did you push through, go around, or stop? What was on the other side if you stayed?',
    selfRatingLabel: 'How willing were you to stay at the wall today?',
  },
  {
    id: 'ref-ai-3',
    type: 'reflection',
    domain: 'ai_autonomy',
    title: 'The First Reflex',
    prompt:
      'When you got stuck today, what was your first reflex — open an AI, or try yourself first? Notice the instinct without judging it. What would it cost you to try yourself first more often?',
    selfRatingLabel: 'How often did you try yourself before reaching for AI today?',
  },
  {
    id: 'ref-presence-3',
    type: 'reflection',
    domain: 'presence',
    title: 'The Phone on the Table',
    prompt:
      'Recall the last real conversation you had. Where was your phone — in your hand, on the table face-up, or away? What did its position do to how present you were?',
    selfRatingLabel: 'How undivided was your attention to people today?',
  },
  {
    id: 'ref-values-3',
    type: 'reflection',
    domain: 'values',
    title: 'The One Thing',
    prompt:
      'If a stranger watched only your last 24 hours — not your words, just your actions — what would they guess you value most? Is that the thing you’d want them to guess?',
    selfRatingLabel: 'How closely did your actions match your real priorities today?',
  },
  {
    id: 'ref-comm-1', type: 'reflection', domain: 'communication', title: 'What They Actually Felt',
    prompt: 'Recall a conversation today where the other person had a feeling under their words. What were they actually feeling — and did your response meet that, or just the surface?',
    selfRatingLabel: 'How well did you read and meet what others were feeling today?',
  },
  {
    id: 'ref-comm-2', type: 'reflection', domain: 'communication', title: 'Before the Fix',
    prompt: 'Was there a moment someone needed to feel understood before they needed a solution? Did you let them feel heard first, or did you jump to fixing?',
    selfRatingLabel: 'How well did you make people feel heard before responding today?',
  },
  {
    id: 'ref-reg-1', type: 'reflection', domain: 'emotion_regulation', title: 'The Wave',
    prompt: 'Name a moment a strong feeling rose up today. Did it run you, or could you notice it and choose your response? What helped, or what didn’t?',
    selfRatingLabel: 'How steady were you under strong feeling today?',
  },
  {
    id: 'ref-reg-2', type: 'reflection', domain: 'emotion_regulation', title: 'Metabolize, Not Outsource',
    prompt: 'When you felt bad today, what did you do with it — sit with it, talk to a person, or reach for a screen to numb it? What would it have cost to stay with it a little longer?',
    selfRatingLabel: 'How well did you process your own emotions today, rather than numb them?',
  },
];

// ----- THE LURE: cognitive-reflection items (Judgment) -----
// Original CRT-style items (the famous three are over-exposed). Each has a fluent
// INTUITIVE-but-wrong answer (kind:'intuitive') and the REFLECTIVE correct one
// (kind:'reflective'). Overriding the lure is the rep. See docs/measurement-architecture.md.
export const CRT = [
  {
    id: 'crt-notebook',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'A notebook and a pen cost $5.50 in total. The notebook costs $5.00 more than the pen. How much does the pen cost?',
    options: [
      { id: 'a', text: '50¢', kind: 'intuitive' },
      { id: 'b', text: '25¢', kind: 'reflective' },
      { id: 'c', text: '55¢', kind: 'other' },
      { id: 'd', text: '5¢', kind: 'other' },
    ],
    explanation: 'The pull is 50¢ — but if the pen were 50¢, the notebook would be $5.00, only a $4.50 gap, not the required $5.00. The pen is 25¢: notebook $5.25, pen $0.25, gap exactly $5.00, total $5.50. The intuitive answer forgets the difference must stay $5.00.',
  },
  {
    id: 'crt-printers',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'If 4 printers take 4 minutes to print 4 flyers, how long would 100 printers take to print 100 flyers?',
    options: [
      { id: 'a', text: '100 minutes', kind: 'intuitive' },
      { id: 'b', text: '4 minutes', kind: 'reflective' },
      { id: 'c', text: '25 minutes', kind: 'other' },
      { id: 'd', text: '1 minute', kind: 'other' },
    ],
    explanation: 'Each printer prints one flyer in 4 minutes. 100 printers print 100 flyers in parallel — still 4 minutes. The lure (100) comes from pattern-matching the numbers instead of the rate.',
  },
  {
    id: 'crt-algae',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'A patch of algae doubles in size every day. It covers the whole pond on day 48. On which day did it cover a quarter of the pond?',
    options: [
      { id: 'a', text: 'Day 12', kind: 'intuitive' },
      { id: 'b', text: 'Day 46', kind: 'reflective' },
      { id: 'c', text: 'Day 24', kind: 'other' },
      { id: 'd', text: 'Day 47', kind: 'other' },
    ],
    explanation: 'It doubles daily, so it was half on day 47 and a quarter on day 46. The lure (a quarter of 48 = 12) applies linear thinking to an exponential process.',
  },
  {
    id: 'crt-race',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'You are running a race. You just overtook the person in 2nd place. What place are you in now?',
    options: [
      { id: 'a', text: '1st', kind: 'intuitive' },
      { id: 'b', text: '2nd', kind: 'reflective' },
      { id: 'c', text: '3rd', kind: 'other' },
      { id: 'd', text: 'Can’t tell', kind: 'other' },
    ],
    explanation: 'Overtaking 2nd place puts you *into* 2nd — you took their spot, not 1st. The lure equates "passed someone" with "winning."',
  },
  {
    id: 'crt-sheep',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'A farmer has 17 sheep. All but 9 run away. How many sheep does the farmer have left?',
    options: [
      { id: 'a', text: '8', kind: 'intuitive' },
      { id: 'b', text: '9', kind: 'reflective' },
      { id: 'c', text: '17', kind: 'other' },
      { id: 'd', text: '0', kind: 'other' },
    ],
    explanation: '"All but 9 run away" means 9 stay. The lure (17 − 9 = 8) subtracts on autopilot instead of reading "all but 9 remain."',
  },
  {
    id: 'crt-lake',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'A loaf and a knife cost $9.20 together. The loaf costs $9.00 more than the knife. What does the knife cost?',
    options: [
      { id: 'a', text: '20¢', kind: 'intuitive' },
      { id: 'b', text: '10¢', kind: 'reflective' },
      { id: 'c', text: '92¢', kind: 'other' },
      { id: 'd', text: '$1.00', kind: 'other' },
    ],
    explanation: 'Knife 10¢, loaf $9.10 — a $9.00 gap, $9.20 total. The lure (20¢) again forgets the difference must stay $9.00.',
  },
];

// ----- N-BACK: working-memory updating drill (Working Memory) -----
const NBACK_LETTERS = ['T', 'L', 'R', 'S', 'K', 'N', 'P', 'H', 'C', 'M', 'D', 'F'];

// level → n: 1 → 1-back, 2 → 2-back, 3+ → 3-back.
export function makeNBackExercise(level = 1, rng = Math.random) {
  const n = Math.max(1, Math.min(3, level <= 1 ? 1 : level <= 3 ? 2 : 3));
  const len = 12 + n * 2;
  const seq = [];
  for (let i = 0; i < len; i++) {
    seq.push(NBACK_LETTERS[Math.floor(rng() * NBACK_LETTERS.length)]);
  }
  // Force roughly 1/3 of judgeable positions to be matches, for a usable signal.
  const matchCount = Math.max(2, Math.round((len - n) / 3));
  for (let m = 0; m < matchCount; m++) {
    const i = n + Math.floor(rng() * (len - n));
    seq[i] = seq[i - n];
  }
  const targets = [];
  for (let i = n; i < len; i++) if (seq[i] === seq[i - n]) targets.push(i);
  return {
    id: `nback-${Date.now()}-${n}`,
    type: 'nback',
    domain: 'memory',
    title: `${n}-Back`,
    n,
    sequence: seq,
    targets,
    stepMs: 2200,
  };
}

// ----- INTERIOR LIFE: spiritual-formation reflections + contemplation (opt-in) -----
// DSES-lineage daily-experience prompts. Type 'reflection' so they reuse the
// reflection UI; domain 'interior'.
export const INTERIOR_REFLECTIONS = [
  {
    id: 'int-presence', type: 'reflection', domain: 'interior', title: 'Where You Sensed Him',
    prompt: 'Where today did you sense God’s presence — even faintly — in an ordinary moment? If you didn’t, where might you have, had you been paying attention?',
    selfRatingLabel: 'How attentive were you to God’s presence today?',
  },
  {
    id: 'int-gratitude', type: 'reflection', domain: 'interior', title: 'Lifted Out of Yourself',
    prompt: 'Name one thing today that drew gratitude or awe out of you — something that briefly lifted you beyond your own concerns.',
    selfRatingLabel: 'How much gratitude or awe did you experience today?',
  },
  {
    id: 'int-desire', type: 'reflection', domain: 'interior', title: 'The Desire Itself',
    prompt: 'Did you feel any desire to be closer to God today? What did you do with it — follow it, or let it pass?',
    selfRatingLabel: 'How much did you act on your desire for God today?',
  },
  {
    id: 'int-mercy', type: 'reflection', domain: 'interior', title: 'Given and Received',
    prompt: 'Was there a moment today you needed to forgive, or to receive forgiveness? What happened in you?',
    selfRatingLabel: 'How freely did mercy move through you today?',
  },
];

// Contemplative-silence practice — sit without input. Both a formation practice
// and a behavioral signal that bridges to Attention.
export function makeContemplation(level = 1) {
  const seconds = level <= 1 ? 60 : level <= 3 ? 90 : 120;
  return {
    id: `contemplation-${seconds}`,
    type: 'contemplation',
    domain: 'interior',
    title: 'A Minute of Silence',
    prompt: 'Sit still, put the screen down, and simply be present — to God, to your own breath, to the quiet. No goal but to stay. The timer will tell you when.',
    targetSeconds: seconds,
  };
}

// ----- THE STREAM: SART go/no-go sustained-attention drill (Attention) -----
const STREAM_LETTERS = ['A', 'E', 'O', 'U', 'M', 'R', 'S', 'T', 'L', 'N'];
export function makeStreamExercise(level = 1, rng = Math.random) {
  const len = 18 + Math.min(6, level * 2);
  const target = STREAM_LETTERS[Math.floor(rng() * STREAM_LETTERS.length)];
  const others = STREAM_LETTERS.filter((l) => l !== target);
  const items = [];
  for (let i = 0; i < len; i++) {
    // ~18% no-go (the rare target you must withhold on).
    if (rng() < 0.18) items.push({ symbol: target, nogo: true });
    else items.push({ symbol: others[Math.floor(rng() * others.length)], nogo: false });
  }
  // Guarantee at least 2 no-go trials.
  if (items.filter((it) => it.nogo).length < 2) {
    items[3] = { symbol: target, nogo: true };
    items[len - 4] = { symbol: target, nogo: true };
  }
  return {
    id: `stream-${Date.now()}`,
    type: 'stream',
    domain: 'attention',
    title: 'The Stream',
    targetSymbol: target,
    items,
    stepMs: Math.max(900, 1400 - level * 80),
  };
}

// ----- MENTAL MATH: timed arithmetic fluency (Working Memory) -----
// A 60-second sprint: solve as many problems as you can in your head. Throughput
// = working memory + processing speed under time pressure. Problems generated
// live by level; the exercise object just carries config.
export function makeMathFluency(level = 1) {
  return {
    id: `math-${Date.now()}`,
    type: 'mathfluency',
    domain: 'memory',
    title: 'Mental Math',
    durationSec: 60,
    level: Math.max(1, Math.min(4, Math.round(level))),
    target: 14, // correct answers in the window for a top score
  };
}

// Generate one problem appropriate to the level. Returns {text, answer}.
export function nextMathProblem(level = 1, rng = Math.random) {
  const r = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  let a; let b; let op; let answer;
  if (level <= 1) {
    a = r(2, 19); b = r(2, 19);
    if (rng() < 0.5) { op = '+'; answer = a + b; }
    else { if (b > a) { const t = a; a = b; b = t; } op = '−'; answer = a - b; }
  } else if (level === 2) {
    if (rng() < 0.6) { a = r(2, 9); b = r(2, 9); op = '×'; answer = a * b; }
    else { a = r(10, 49); b = r(10, 49); op = '+'; answer = a + b; }
  } else {
    const k = rng();
    if (k < 0.4) { a = r(3, 12); b = r(3, 12); op = '×'; answer = a * b; }
    else if (k < 0.7) { a = r(20, 99); b = r(20, 99); op = '+'; answer = a + b; }
    else { answer = r(3, 12); b = r(2, 9); a = answer * b; op = '÷'; } // integer division
  }
  return { text: `${a} ${op} ${b}`, answer };
}

// ----- DIGIT SPAN BACKWARD: working-memory manipulation (WAIS lineage) -----
// See digits, then recall them in REVERSE order — holding AND manipulating, the
// harder/more valid span. Scored by position-correct recall of the reversed list.
export function makeDigitSpan(level = 1, rng = Math.random) {
  const len = Math.max(4, Math.min(7, 3 + Math.round(level)));
  const digits = [];
  for (let i = 0; i < len; i++) digits.push(String(Math.floor(rng() * 10)));
  return {
    id: `digit-${Date.now()}-${len}`,
    type: 'digitspan',
    domain: 'memory',
    title: 'Digit Span — Backward',
    digits,
    showMs: 900 + len * 650,
  };
}

// ----- CATCH THE SIGNAL: live vigilance test (Attention) -----
// Psychomotor Vigilance Task lineage: a faint dot appears at unpredictable
// intervals; press the instant you see it. Real-time reaction + lapses +
// false-starts = a genuine sustained-attention measure, not self-report.
export function makeVigilanceExercise(level = 1) {
  const trials = Math.min(12, 7 + level);
  const faint = Math.max(0.32, 0.62 - level * 0.06); // higher level → fainter dot
  return {
    id: `vigilance-${Date.now()}`,
    type: 'vigilance',
    domain: 'attention',
    title: 'Catch the Signal',
    trials,
    faint,
    isiMin: 1500, // ms — minimum wait before the dot appears
    isiMax: 4500, // ms — maximum wait (the unpredictability is the point)
  };
}

// ----- FOLLOW THE DOT: visuomotor pursuit tracking (Attention) -----
// Validated visuomotor sustained-attention paradigm: keep your finger/cursor on
// a moving target. Score = proportion of time on target (see scoring.scorePursuit).
export function makePursuitExercise(level = 1) {
  const lv = Math.max(1, Math.min(4, Math.round(level)));
  return {
    id: `pursuit-${Date.now()}`,
    type: 'pursuit',
    domain: 'attention',
    title: 'Follow the Dot',
    durationSec: 24,
    speed: 0.55 + lv * 0.18, // higher level → faster, less predictable path
    radiusPx: Math.max(32, 58 - lv * 7), // on-target threshold shrinks with level
  };
}

// ----- STAY: behavioral persistence drill (Frustration Tolerance) -----
export const STAY = [
  {
    id: 'stay-sequence', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Work out the next number, in your head, before you decide anything: 2, 6, 12, 20, 30, …  What comes next?',
    answer: '42',
    explanation: 'The gaps grow by 2 each time (4, 6, 8, 10 → next gap 12), so 30 + 12 = 42. The point wasn’t the answer — it was whether you stayed in the discomfort of not-yet-knowing instead of bailing.',
  },
  {
    id: 'stay-riddle', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Stay with this before you move on: a man pushes his car to a hotel and realizes he is bankrupt. What happened?',
    answer: 'He’s playing Monopoly.',
    explanation: 'It only resolves if you let go of the literal frame and keep turning it over. Frustration tolerance is exactly this willingness to stay past the first wave of “I don’t know.”',
  },
  {
    id: 'stay-count', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Without writing anything down, hold this: how many times does the digit 7 appear in the numbers 1 to 100? Work it through.',
    answer: '20',
    explanation: 'Ten 7s in the ones place (7, 17, … 97) and ten in the tens place (70–79) = 20. The discipline is doing the count internally instead of reaching for a tool.',
  },
  {
    id: 'stay-lookandsay', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Stay with this before moving on: 1, 11, 21, 1211, 111221, …  What comes next?',
    answer: '312211',
    explanation: 'It’s the “look-and-say” sequence — each line describes the one before it out loud. 111221 reads as “three 1s, two 2s, one 1” → 312211. It only clicks if you resist looking it up and keep turning it over.',
  },
  {
    id: 'stay-photographer', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Stay past the first reading: a woman shoots her husband, then holds him underwater for five minutes, then hangs him. Five minutes later they sit down to a pleasant dinner together. How?',
    answer: 'She’s a photographer.',
    explanation: 'She shot his photo, developed it underwater, and hung it up to dry. It only resolves once you drop the violent literal frame — frustration tolerance is staying past the interpretation that traps you.',
  },
  {
    id: 'stay-paintedcube', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Hold this in your mind, no paper: a cube is painted red on every face, then cut into 27 equal small cubes (3×3×3). How many of the small cubes have paint on exactly two faces?',
    answer: '12',
    explanation: 'The two-face cubes are the edge pieces — not the 8 corners (three faces), not the 6 face-centres (one face), not the 1 hidden middle (none). A cube has 12 edges, one small cube each = 12. The work is keeping the cube assembled in your head.',
  },
  {
    id: 'stay-chessboard', type: 'stay', domain: 'persistence', title: 'Stay With It',
    prompt: 'Without writing it down: how many squares are on a standard 8×8 chessboard when you count every size, from 1×1 all the way up to 8×8?',
    answer: '204',
    explanation: 'There are 8² of the 1×1, 7² of the 2×2, and so on down to 1² of the 8×8 — that’s 64+49+36+25+16+9+4+1 = 204. The discipline is grinding the sum out in your head rather than bailing for a calculator.',
  },
];

// ----- MATRIX REASONING: non-verbal fluid reasoning (Judgment) -----
// Raven's-lineage: a 2×2 grid follows a rule across rows and columns; pick the
// option that completes it. Cells are {shape, n, fill}. Answer keys verified.
export const MATRICES = [
  {
    id: 'mat-count-shape', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'circle', n: 1, fill: 0 }, { shape: 'circle', n: 2, fill: 0 }, { shape: 'square', n: 1, fill: 0 }],
    options: [{ shape: 'square', n: 2, fill: 0 }, { shape: 'square', n: 1, fill: 0 }, { shape: 'circle', n: 2, fill: 0 }, { shape: 'square', n: 3, fill: 0 }],
    answer: 0,
    explanation: 'Across each row the count goes up by one; down each column the shape changes (circle → square). So the missing cell is two squares.',
  },
  {
    id: 'mat-fill', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'circle', n: 2, fill: 0 }, { shape: 'circle', n: 2, fill: 1 }, { shape: 'triangle', n: 2, fill: 0 }],
    options: [{ shape: 'triangle', n: 2, fill: 1 }, { shape: 'triangle', n: 2, fill: 0 }, { shape: 'circle', n: 2, fill: 1 }, { shape: 'triangle', n: 3, fill: 1 }],
    answer: 0,
    explanation: 'Across each row the shapes go from outline to filled; the shape and count stay constant down each column. So the missing cell is two filled triangles.',
  },
  {
    id: 'mat-count2', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'triangle', n: 1, fill: 1 }, { shape: 'triangle', n: 3, fill: 1 }, { shape: 'square', n: 1, fill: 1 }],
    options: [{ shape: 'square', n: 3, fill: 1 }, { shape: 'square', n: 1, fill: 1 }, { shape: 'triangle', n: 3, fill: 1 }, { shape: 'square', n: 2, fill: 1 }],
    answer: 0,
    explanation: 'Across each row the count jumps from one to three; down each column the shape changes. So the missing cell is three filled squares.',
  },
  {
    id: 'mat-shape-count', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'circle', n: 3, fill: 0 }, { shape: 'square', n: 3, fill: 0 }, { shape: 'circle', n: 1, fill: 0 }],
    options: [{ shape: 'square', n: 1, fill: 0 }, { shape: 'circle', n: 1, fill: 0 }, { shape: 'square', n: 3, fill: 0 }, { shape: 'square', n: 2, fill: 0 }],
    answer: 0,
    explanation: 'Across each row the shape changes (circle → square); down each column the count drops from three to one. So the missing cell is one square.',
  },
  {
    id: 'mat-fill-row', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'triangle', n: 2, fill: 0 }, { shape: 'triangle', n: 2, fill: 1 }, { shape: 'circle', n: 2, fill: 0 }],
    options: [{ shape: 'circle', n: 2, fill: 1 }, { shape: 'circle', n: 2, fill: 0 }, { shape: 'triangle', n: 2, fill: 1 }, { shape: 'circle', n: 3, fill: 1 }],
    answer: 0,
    explanation: 'Across each row the shapes go from outline to filled; down each column the shape changes and the count stays the same. So the missing cell is two filled circles.',
  },
  {
    id: 'mat-count-up2', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'square', n: 1, fill: 1 }, { shape: 'square', n: 3, fill: 1 }, { shape: 'triangle', n: 1, fill: 1 }],
    options: [{ shape: 'triangle', n: 3, fill: 1 }, { shape: 'triangle', n: 1, fill: 1 }, { shape: 'square', n: 3, fill: 1 }, { shape: 'triangle', n: 2, fill: 1 }],
    answer: 0,
    explanation: 'Across each row the count rises by two; down each column the shape changes (square → triangle). So the missing cell is three filled triangles.',
  },
  {
    id: 'mat-shape-swap', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'circle', n: 1, fill: 0 }, { shape: 'square', n: 1, fill: 0 }, { shape: 'circle', n: 2, fill: 0 }],
    options: [{ shape: 'square', n: 2, fill: 0 }, { shape: 'square', n: 1, fill: 0 }, { shape: 'circle', n: 2, fill: 0 }, { shape: 'square', n: 3, fill: 0 }],
    answer: 0,
    explanation: 'Across each row the shape changes (circle → square); down each column the count goes up by one. So the missing cell is two outlined squares.',
  },
  {
    id: 'mat-fill-down', type: 'matrix', domain: 'judgment', title: 'Complete the Pattern',
    grid: [{ shape: 'triangle', n: 1, fill: 0 }, { shape: 'triangle', n: 2, fill: 0 }, { shape: 'triangle', n: 1, fill: 1 }],
    options: [{ shape: 'triangle', n: 2, fill: 1 }, { shape: 'triangle', n: 2, fill: 0 }, { shape: 'triangle', n: 1, fill: 1 }, { shape: 'triangle', n: 3, fill: 1 }],
    answer: 0,
    explanation: 'Across each row the count goes up by one; down each column the shapes go from outline to filled. So the missing cell is two filled triangles.',
  },
];

// ----- SENTENCE COMPLETION: AI-scored self-knowledge (Values Alignment) -----
// Rotter RISB lineage: finish open stems; Claude scores honesty/self-awareness/
// coherence formatively (see coach.scoreSentences). Requires a live key.
export const SENTENCES = [
  {
    id: 'sent-self', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['When I am most myself, I', 'The thing I keep avoiding is', 'What I want more than I usually admit is', 'When I am overwhelmed, I tend to', 'A year from now, I hope I have'],
  },
  {
    id: 'sent-values', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['What matters most to me is', 'I lose myself when I', 'The person I want to become', 'I feel most alive when', 'If I am honest, I spend too much of my attention on'],
  },
  {
    id: 'sent-interior', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['I feel free when', 'The thing I am quietly proud of is', 'What I am afraid to lose is', 'I know I am off-track when', 'What I most need to forgive is'],
  },
];

// ----- THE TRADE: automation/atrophy tradeoff scenarios (AI Independence) -----
// Near-future scenarios where AI could take over a whole human capacity. The
// person chooses what they'd trade and at what cost. Scored by ENGAGEMENT
// QUALITY, not by how little they use AI: deliberate heavy use that keeps the
// load-bearing effort scores HIGHEST; reflexive total surrender scores low;
// knee-jerk total refusal is middling; using-everything-while-vaguely-guilty is
// low (guilt isn't a choice). The rationale teaches the atrophy tradeoff.
export const TRADEOFFS = [
  {
    id: 'trade-navigation', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'Soon you could let AI handle all wayfinding — turn-by-turn for everything, forever. You’d never again need to know where you are or how you got there.',
    prompt: 'What’s the wise trade?',
    options: [
      { id: 'a', text: 'Take it fully — never think about directions again.', score: 25, rationale: 'The convenience is real, but spatial memory is use-it-or-lose-it. Hand it over entirely and the felt sense of where you are quietly atrophies — you’ve traded a capacity for a crutch without deciding to.' },
      { id: 'b', text: 'Use it freely for new or complex trips, but keep finding your own way in places you know.', score: 100, rationale: 'This is the move. You take the tool’s full value AND keep the muscle alive. Independence isn’t using AI less — it’s staying awake to which efforts you choose to keep.' },
      { id: 'c', text: 'Refuse it on principle and navigate everything yourself.', score: 55, rationale: 'Honorable, and it preserves the skill — but it forfeits genuine value and usually isn’t sustainable. Independence is conscious choosing, not blanket abstaining.' },
      { id: 'd', text: 'Use it for everything, but feel a little guilty about it.', score: 30, rationale: 'Guilt without a decision changes nothing — the capacity erodes either way. Awareness only protects you when it turns into an actual choice.' },
    ],
  },
  {
    id: 'trade-writing', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'AI can now draft everything you write — emails, reports, even the notes where you figure out what you think. It’s faster and often better than your first draft.',
    prompt: 'Where’s the line worth holding?',
    options: [
      { id: 'a', text: 'Let it write everything — output is what matters.', score: 25, rationale: 'For low-stakes text, fine. But writing is also how you think; outsource all of it and you slowly lose the ability to work an idea out for yourself. The cost is invisible until you need it.' },
      { id: 'b', text: 'Use it heavily to polish and pressure-test, but draft the thinking that matters yourself first.', score: 100, rationale: 'Exactly — keep the formative effort (working the idea out), delegate the finishing. You can use it constantly and still stay the one who actually thinks.' },
      { id: 'c', text: 'Don’t use it for writing at all.', score: 55, rationale: 'Preserves the skill but leaves real leverage on the table. The goal isn’t purity; it’s knowing which effort is load-bearing and keeping that.' },
      { id: 'd', text: 'Let it write everything but tell yourself you could do it if you had to.', score: 30, rationale: 'A story you tell yourself isn’t practice. The capacity is maintained by using it, not by believing you still have it.' },
    ],
  },
  {
    id: 'trade-decisions', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'An AI that knows you well could make most of your daily decisions — what to eat, buy, read, prioritize — and on average get better outcomes than you do.',
    prompt: 'How much of deciding do you hand over?',
    options: [
      { id: 'a', text: 'All of it — better outcomes are better outcomes.', score: 25, rationale: 'Deciding is a muscle and an identity. Optimize away every small choice and you may get better outcomes while slowly becoming a person who can no longer choose — and who no longer knows what they actually want.' },
      { id: 'b', text: 'Let it handle trivial logistics, but keep making the choices that express who you are.', score: 100, rationale: 'Right line. Offload the decisions that don’t form you; guard the ones that do. Heavy use of the tool, full ownership of the self.' },
      { id: 'c', text: 'Make every decision yourself, ignore its suggestions.', score: 55, rationale: 'Keeps your agency intact but wastes genuine help and attention you’d want for what matters. Independence is choosing where to delegate, not refusing to.' },
      { id: 'd', text: 'Follow its suggestions but pretend they’re your own ideas.', score: 30, rationale: 'Borrowed agency dressed as your own is the most seductive trade — you feel autonomous while quietly handing it over. Naming it is the only thing that protects it.' },
    ],
  },
  {
    id: 'trade-memory', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'You’ll soon never need to remember anything — every fact, name, and detail instantly retrievable. Why hold anything in your own head?',
    prompt: 'What’s worth still knowing by heart?',
    options: [
      { id: 'a', text: 'Nothing — offload all of it, that’s what the tools are for.', score: 25, rationale: 'Retained knowledge is what lets you notice when an answer is wrong, connect ideas, and think in the moment. With nothing in your head, you can only ever look things up — never actually reason across them.' },
      { id: 'b', text: 'Look up what’s lookup-able, but deliberately keep building deep knowledge in what matters to you.', score: 100, rationale: 'Yes. Externalize the trivia; internalize the things you want to think WITH. You can use retrieval constantly and still cultivate a furnished mind.' },
      { id: 'c', text: 'Refuse to rely on it; memorize everything the old way.', score: 55, rationale: 'Admirable discipline, but not all knowledge is worth the shelf space. The skill is choosing what to hold, not holding everything.' },
      { id: 'd', text: 'Offload everything, but feel uneasy that you’re forgetting how to think.', score: 30, rationale: 'The unease is accurate — and useless until it becomes a decision about what you’ll keep building yourself.' },
    ],
  },
];

// ----- VIGNETTES: AI-scored communication / emotional-intelligence exercise -----
// A charged interpersonal moment. The person responds OUT LOUD (or types), and
// Claude scores the transcript on a relational-presence rubric (see coach.js
// scoreVignette). Measures communication & EI from real language — the thing no
// self-report or static test can do. Requires a live key.
export const VIGNETTES = [
  {
    id: 'vig-diagnosis', type: 'vignette', domain: 'communication', title: 'The Hard News',
    scenario: 'A close friend tells you, voice shaking, that they were just diagnosed with something serious. They go quiet and look at you, waiting.',
    prompt: 'What do you say to them? Say it out loud, as if they’re right in front of you.',
  },
  {
    id: 'vig-teen', type: 'vignette', domain: 'communication', title: '“You Don’t Get It”',
    scenario: 'Someone you love — a teenager, a younger sibling — snaps "you don’t get it, you never have," and turns to walk out of the room.',
    prompt: 'What do you say in that moment? Speak it the way you actually would.',
  },
  {
    id: 'vig-credit', type: 'vignette', domain: 'communication', title: 'Credit Taken',
    scenario: 'In a meeting, a colleague presents an idea that was yours as if it were theirs, and people nod along. They glance at you.',
    prompt: 'What do you say — to them, or to the room? Say it out loud.',
  },
  {
    id: 'vig-spiral', type: 'vignette', domain: 'communication', title: 'The Small Thing That Isn’t',
    scenario: 'A friend is spiraling, near tears, over something that seems small to you. You can feel the urge to tell them it’ll be fine.',
    prompt: 'What do you actually say to them? Speak it.',
  },
  {
    id: 'vig-doubt', type: 'vignette', domain: 'communication', title: 'The Confession',
    scenario: 'Over coffee, someone you care about admits quietly that they’ve stopped believing — stopped praying — and they’re watching your face to see how you react.',
    prompt: 'What do you say? Say it the way you would if it were real.',
  },
];

// ----- STEM: Situational Test of Emotion Management -----
// Lineage: MacCann & Roberts' Situational Test of Emotion Management (2008) — a
// validated performance measure of emotional intelligence. You read an emotional
// situation and choose the MOST effective way to manage the feeling. Options are
// scored by how adaptive the strategy is (reappraisal, problem-solving, acceptance,
// adaptive support-seeking score high; suppression, rumination, avoidance, hostile
// reframing score low). This is the emotion_regulation domain's first genuine
// performance measure — everything before it there was self-report. Growth-framing,
// never diagnosis: every option's rationale teaches the strategy, so a "wrong"
// pick is a lesson, not a verdict. Exactly one best option per item scores >=80 so
// the reveal coloring (shared with decision/tradeoff) marks the adaptive move.
export const STEM = [
  {
    id: 'stem-credit', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'In a meeting, a colleague presents Alex’s idea as their own. Alex feels a hot flash of anger rise.',
    prompt: 'What’s the most effective way for Alex to manage that anger?',
    options: [
      { id: 'a', text: 'Let the heat pass in the moment, then raise it privately afterward — naming what happened and how it landed.', score: 100, rationale: 'This manages the feeling and the situation together: you give the spike room to settle, then address the real problem from a steady place. The most effective regulation rarely means acting at peak intensity.' },
      { id: 'b', text: 'Call it out sharply right there in the meeting.', score: 45, rationale: 'Honest, but acting on anger at its peak usually costs more than it recovers — the legitimate point gets lost in the heat, and others remember the tone, not the substance.' },
      { id: 'c', text: 'Push the anger down and act as if nothing happened.', score: 30, rationale: 'Suppression doesn’t lower the feeling — it just hides it, where it tends to leak out later and leaves the real issue unresolved. Managed emotion isn’t silenced emotion.' },
      { id: 'd', text: 'Replay the slight on a loop for the rest of the day.', score: 15, rationale: 'Rumination keeps the body in alarm and changes nothing about the situation. Of all the options, dwelling is the one most reliably linked to feeling worse.' },
    ],
  },
  {
    id: 'stem-presentation', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'Sam has a high-stakes presentation tomorrow. Tonight the anxiety is building — tight chest, racing thoughts.',
    prompt: 'What’s the most effective thing Sam can do with that anxiety?',
    options: [
      { id: 'a', text: 'Do one solid prep pass, then deliberately set it down for the night — treating the nerves as readiness, not a warning.', score: 100, rationale: 'This pairs problem-focused action (prepare once, well) with reappraisal (arousal as fuel, not threat). Naming anxiety as readiness measurably improves performance — you manage the feeling by reframing what it means.' },
      { id: 'b', text: 'Distract completely and refuse to think about it at all.', score: 55, rationale: 'Avoidance buys a quiet evening, but the dread returns — and you arrive less prepared. Short-term relief, long-term cost.' },
      { id: 'c', text: 'Keep rehearsing late into the night until every line feels perfect.', score: 40, rationale: 'Past a point, more rehearsal feeds the anxiety instead of easing it — and the lost sleep hurts you more tomorrow than one imperfect transition would.' },
      { id: 'd', text: 'Find a reason to get out of presenting.', score: 15, rationale: 'Escape erases the anxiety and the opportunity at once, and quietly teaches you that the way to handle pressure is to flee it — which makes the next time harder.' },
    ],
  },
  {
    id: 'stem-disappointment', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'Maria didn’t get a role she’d genuinely hoped for. A heavy disappointment settles in.',
    prompt: 'What’s the most effective way for her to handle the disappointment?',
    options: [
      { id: 'a', text: 'Let herself actually feel it, and talk it through with someone she trusts.', score: 100, rationale: 'Acceptance plus adaptive support: she neither denies the feeling nor drowns in it, and naming it to a trusted person is one of the best-supported ways to metabolize a loss.' },
      { id: 'b', text: 'Pour herself into constant busyness so she never has to sit with it.', score: 45, rationale: 'Distraction can take the edge off, but an unfelt disappointment waits. Staying busy isn’t the same as moving through it.' },
      { id: 'c', text: 'Tell herself it didn’t matter and she never really wanted it.', score: 35, rationale: 'Minimizing protects you for an hour but invalidates a real desire — and it blocks the honest reflection that would help her aim at the next one.' },
      { id: 'd', text: 'Decide this means she isn’t good enough and probably won’t get the next one either.', score: 15, rationale: 'Turning one outcome into a verdict about yourself is overgeneralizing — it amplifies the pain and distorts the odds. One “no” is data about one decision, not about you.' },
    ],
  },
  {
    id: 'stem-envy', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'A friend posts about landing exactly the thing Jordan has been quietly wanting. Jordan feels a sting of envy.',
    prompt: 'What’s the most effective response to that envy?',
    options: [
      { id: 'a', text: 'Read the envy as a signal of what he values, congratulate his friend honestly, and name one small step toward his own version.', score: 100, rationale: 'This uses the emotion as information rather than letting it run the show — envy points at what matters to you. Acting on it with a value-aligned step turns a corrosive feeling into direction.' },
      { id: 'b', text: 'Mute or unfollow the friend so the posts stop showing up.', score: 45, rationale: 'Removing the trigger gives relief and is sometimes wise — but here it avoids the longing rather than addressing it, and can quietly shrink a real friendship.' },
      { id: 'c', text: 'Tell himself his friend probably got lucky or isn’t really that happy.', score: 25, rationale: 'Hostile reframing soothes the ego for a moment while corroding both honesty and the relationship. It manages the sting by distorting reality.' },
      { id: 'd', text: 'Spend the evening comparing his life to his friend’s, point by point.', score: 15, rationale: 'Comparison rumination is the most reliable way to feel worse — it inflames the envy and produces nothing you can act on.' },
    ],
  },
  {
    id: 'stem-guilt', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'Priya snapped at her partner over something small and instantly feels a wave of guilt.',
    prompt: 'What’s the most effective way for her to manage the guilt?',
    options: [
      { id: 'a', text: 'Acknowledge it directly, apologize for the tone, and name what was really going on underneath for her.', score: 100, rationale: 'Guilt is a repair signal — the effective move is to act on it: a clean apology plus honest disclosure mends the rupture and addresses the cause. Once repaired, the guilt has done its job.' },
      { id: 'b', text: 'Wait and quietly hope it blows over without mentioning it.', score: 40, rationale: 'Avoidance leaves the small rupture unrepaired, where it can accumulate. Guilt that isn’t acted on tends to linger rather than resolve.' },
      { id: 'c', text: 'Over-apologize again and again and berate herself about it all day.', score: 30, rationale: 'One sincere repair helps; looping in self-punishment past that point is guilt rumination — it burdens her partner with reassuring her and fixes nothing further.' },
      { id: 'd', text: 'Decide her partner was being too sensitive anyway.', score: 20, rationale: 'A defensive reframe dodges the guilt by dodging responsibility — it protects the ego at the cost of the relationship and the chance to repair.' },
    ],
  },
];

// ----- COMM: Communication situational-judgment measure (keyless) -----
// A validated-paradigm SJT of interpersonal communication competence. The rich
// AI-scored vignette is key-gated, so without it the communication pillar of
// AI-Readiness was self-report only — a hole, since communication is one of the
// four capacities employers most care about in the AI transition. This gives
// EVERY user a real performance measure: read a charged interpersonal moment and
// choose the most effective response. Scored by communication effectiveness —
// clear + respectful + perspective-taking scores high; aggressive, passive,
// defensive, or vague scores low. Growth-framed rationales; exactly one best
// option (>=80) per item so the shared reveal coloring marks the effective move.
export const COMM = [
  {
    id: 'comm-feedback', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'A teammate, Dana, hands you work that misses the brief in a few important ways. You have to tell her.',
    prompt: 'What’s the most effective way to give the feedback?',
    options: [
      { id: 'a', text: 'Name what’s working, then be specific about what missed and why it matters — and ask how you can help get it there.', score: 100, rationale: 'Specific, respectful, and collaborative: she can act on it and the relationship stays intact. Effective feedback is clear about the gap AND keeps the person on your side.' },
      { id: 'b', text: 'Soften it so far (“maybe just a couple tiny tweaks?”) that the real problems never land.', score: 45, rationale: 'Kindness without clarity isn’t kind — she’ll polish the wrong things and the gap persists. Vagueness protects your comfort, not her growth.' },
      { id: 'c', text: 'List everything wrong, bluntly, so there’s no doubt about the standard.', score: 30, rationale: 'Accurate but harsh: she hears an attack, gets defensive, and the useful signal drowns in the tone. Being right isn’t the same as being effective.' },
      { id: 'd', text: 'Quietly fix it yourself and say nothing, to avoid the awkwardness.', score: 25, rationale: 'Avoids the moment and robs her of the feedback — the same gap returns next time, and now you own her work too.' },
    ],
  },
  {
    id: 'comm-listen', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'A close friend is venting about a hard week — not asking for anything, just clearly upset.',
    prompt: 'What’s the most effective way to respond?',
    options: [
      { id: 'a', text: 'Reflect back what you’re hearing and ask what would help, before offering any advice.', score: 100, rationale: 'Attuned: you meet them where they are and let them set the agenda. Most venting wants to be understood first — solutions only land after that.' },
      { id: 'b', text: 'Jump in with the solution you can already see.', score: 45, rationale: 'Well-meant but premature — unsolicited fixing can feel like being managed rather than heard, and they stop opening up.' },
      { id: 'c', text: 'Top their story with a worse one of your own to show you relate.', score: 30, rationale: '“Relating” by redirecting to yourself takes the floor away. They came to be heard, not to hear about you.' },
      { id: 'd', text: 'Reassure them it’s “not that bad” so they feel better.', score: 35, rationale: 'Minimizing the feeling, however kindly, tells them the feeling is wrong — it closes the conversation instead of opening it.' },
    ],
  },
  {
    id: 'comm-dissent', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'In a meeting, your manager proposes a plan you think has a real flaw.',
    prompt: 'What’s the most effective way to handle it?',
    options: [
      { id: 'a', text: 'Acknowledge the goal, raise the specific concern as a question, and offer an alternative.', score: 100, rationale: 'Respectful and substantive: you stay on the same team while surfacing the risk, which makes it safe for them to actually weigh it.' },
      { id: 'b', text: 'Stay quiet now and share your doubts with colleagues afterward.', score: 35, rationale: 'The concern never reaches the person who can act on it, and side-channel venting erodes trust. Silence in the room isn’t tact.' },
      { id: 'c', text: 'Flatly say the plan won’t work.', score: 30, rationale: 'May be true, but a verdict with no path forward triggers defensiveness and shuts down the exchange.' },
      { id: 'd', text: 'Go along with it fully to keep the peace, despite the flaw.', score: 25, rationale: 'Harmony bought by withholding what you see costs the team the very thing you were there to add.' },
    ],
  },
  {
    id: 'comm-repair', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'A message you sent landed wrong, and the other person is clearly hurt — though that wasn’t your intent.',
    prompt: 'What’s the most effective way to respond?',
    options: [
      { id: 'a', text: 'Acknowledge the impact, clarify what you meant without arguing it, and check how they’re taking it now.', score: 100, rationale: 'Leads with their experience, not your intent: impact gets repaired first, meaning clarified second. That’s what restores trust.' },
      { id: 'b', text: 'Explain at length that they misread you and you did nothing wrong.', score: 30, rationale: 'Defending your intent over their impact tells them their hurt is invalid — it deepens the rupture even when you’re technically right.' },
      { id: 'c', text: 'Apologize over and over, then go quiet for days.', score: 40, rationale: 'Over-apology plus withdrawal makes them manage your guilt and leaves the actual misunderstanding uncleared.' },
      { id: 'd', text: 'Pretend you didn’t notice and hope it passes.', score: 25, rationale: 'Ignoring a visible hurt reads as not caring; the misunderstanding hardens into distance.' },
    ],
  },
  {
    id: 'comm-no', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'A colleague asks you to take on yet another task you genuinely don’t have capacity for.',
    prompt: 'What’s the most effective way to respond?',
    options: [
      { id: 'a', text: 'Decline clearly and warmly, name the reason briefly, and offer what you CAN do.', score: 100, rationale: 'Assertive without aggression: honest about your limit, respectful of their need, still helpful. A clean no protects both the work and the relationship.' },
      { id: 'b', text: 'Say yes to avoid friction, then resent it or quietly drop the ball.', score: 35, rationale: 'A yes you can’t honor costs more later — for them and for your credibility. Dodging the small no creates a bigger problem.' },
      { id: 'c', text: 'Snap that you’re swamped and they should ask someone else.', score: 30, rationale: 'The boundary is right but the delivery makes it a rebuff — they hear hostility, not a limit.' },
      { id: 'd', text: 'Give a vague “maybe, we’ll see” and hope they forget.', score: 40, rationale: 'Ambiguity leaves them planning around a no you never actually said. Clarity is kinder than false hope.' },
    ],
  },
];

// ----- PRESENCE: relational-presence situational measure -----
// The presence domain ("being fully with another person — listening without
// managing, staying without fixing") had only self-report reflection. This gives
// it a structured measure, completing coverage so every capacity is measured by
// more than a Likert. Distinct from COMM (communication EFFECTIVENESS) and STEM
// (managing YOUR OWN emotion): this is pure relational ATTENTION — the inner move
// of staying with a person rather than managing the moment. Grounded in
// person-centred listening and the "righting reflex" of Motivational Interviewing
// (the urge to fix that pulls us out of presence). Exactly one best option (>=80).
export const PRESENCE_SCENES = [
  {
    id: 'presence-diagnosis', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'A friend tells you they’ve just been diagnosed with something serious. They’re scared, and they’re looking at you.',
    prompt: 'What does being truly present look like here?',
    options: [
      { id: 'a', text: 'Put down what you’re doing, turn toward them, and let them say as much or as little as they want — “I’m here.”', score: 100, rationale: 'Presence is attention without agenda. They need to be met, not managed — and your steady staying is the actual gift, more than any plan.' },
      { id: 'b', text: 'Immediately start researching treatments and specialists for them.', score: 45, rationale: 'Well-meant, but jumping to fixing can leave the person alone with the feeling while you go manage the problem. The research can wait an hour; this moment can’t.' },
      { id: 'c', text: 'Reassure them quickly that it’ll be fine and they’re strong.', score: 35, rationale: 'Reassurance often soothes the comforter’s discomfort more than the person’s fear — and it can quietly close down what they most need to say.' },
      { id: 'd', text: 'Feel so uncomfortable that you steer toward something lighter.', score: 15, rationale: 'Understandable, but it leaves them alone in the hardest moment. Presence means tolerating your own discomfort so they don’t have to carry theirs alone.' },
    ],
  },
  {
    id: 'presence-withdrawn', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'Your partner comes home quiet and withdrawn after what was clearly a hard day.',
    prompt: 'What’s the most present response?',
    options: [
      { id: 'a', text: 'Make unhurried space — sit near, let them know you’re there, and let them come to it in their own time.', score: 100, rationale: 'Attuned, non-demanding presence: available without pressure. You meet them where they are, not where you wish they were.' },
      { id: 'b', text: 'Press them with questions until they tell you what’s wrong.', score: 40, rationale: 'Interrogation usually serves your need to know and fix; to someone depleted it can feel like one more demand rather than care.' },
      { id: 'c', text: 'Give them total space and stay on your phone in the other room.', score: 45, rationale: 'Space can be respect — but here it can read as absence. Presence is being available, not merely out of the way.' },
      { id: 'd', text: 'Try to cheer them up with jokes and distraction.', score: 30, rationale: 'Deflecting the mood meets them where you’d prefer them to be. Sometimes the kindest thing is to let the heaviness simply be witnessed.' },
    ],
  },
  {
    id: 'presence-crying', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'Mid-conversation, a friend starts to cry.',
    prompt: 'What’s the most present thing to do?',
    options: [
      { id: 'a', text: 'Stay near, let them cry, and offer quiet steadiness — no rush to stop it.', score: 100, rationale: 'Allowing the feeling is presence. Tears that are received rather than hurried tend to move through; your calm staying says “you’re not too much.”' },
      { id: 'b', text: 'Hurry to make it stop — tissues, “don’t cry, it’s okay.”', score: 40, rationale: 'Stopping the tears often soothes the witness more than the weeper. Letting it move through, with you there, is the deeper comfort.' },
      { id: 'c', text: 'Fill the silence with a time you went through something similar.', score: 30, rationale: 'Turning toward your own story, even to relate, quietly takes the moment away from them. Presence keeps the floor theirs.' },
      { id: 'd', text: 'Get visibly awkward and find a reason to step away.', score: 15, rationale: 'It leaves them alone in the exposed moment. Staying — even without words — is the whole thing.' },
    ],
  },
  {
    id: 'presence-repeat', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'An older relative starts telling you a long story you’ve heard several times before.',
    prompt: 'What’s the most present response?',
    options: [
      { id: 'a', text: 'Listen as if it’s the first time — what they need is to be received, not informed.', score: 100, rationale: 'Presence as generosity of attention. They’re telling it to connect, not to convey news; meeting that is a small, real act of love.' },
      { id: 'b', text: 'Gently remind them they’ve already told you this one.', score: 45, rationale: 'Accurate, but it misses why they’re telling it. The facts aren’t the point — the contact is.' },
      { id: 'c', text: 'Nod along while scrolling your phone.', score: 25, rationale: 'Split attention is the body language of absence, and people feel it even when the words keep coming.' },
      { id: 'd', text: 'Cut in to move them along to the point.', score: 30, rationale: 'Efficiency over connection. For this kind of story, hurrying to the point misses that there isn’t one beyond being together.' },
    ],
  },
  {
    id: 'presence-child', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'A child runs up, bursting to show you something that seems trivial to you.',
    prompt: 'What’s the most present response?',
    options: [
      { id: 'a', text: 'Get down to their level and meet their delight on its own terms.', score: 100, rationale: 'Attuning to their world — joining, not condescending. To be genuinely met in their excitement is how a child learns they matter.' },
      { id: 'b', text: 'Give a distracted “mhm, nice” and keep doing what you were doing.', score: 30, rationale: 'The half-attention children feel acutely. It’s not unkind, but it teaches them their world is an interruption.' },
      { id: 'c', text: 'Redirect them to something you find more worthwhile.', score: 35, rationale: 'Overriding their world with yours. Presence starts by entering what matters to them, not correcting it.' },
      { id: 'd', text: 'Praise it quickly so they’ll move along.', score: 45, rationale: 'Warm, but transactional — it moves them off rather than being with them. A few real seconds of joining is worth more than fast praise.' },
    ],
  },
];

// ----- STEU: Situational Test of Emotional Understanding -----
// Lineage: MacCann & Roberts' STEU (2008), the companion to STEM. Where STEM
// measures how you MANAGE a feeling, STEU measures whether you can correctly
// READ which emotion a situation evokes — emotional understanding, grounded in
// appraisal theory (each emotion follows a characteristic appraisal of events).
// Gives emotion_regulation a second, distinct structured measure. Unlike the
// effectiveness-rated SJTs, here there is a consensus-correct emotion (scored
// 100) with graded near-misses, so the reveal still marks exactly one best and
// the rationale teaches the appraisal that distinguishes the emotions.
export const STEU_ITEMS = [
  {
    id: 'steu-gift', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'Clara receives a gift she had wanted for a long time, from someone she loves.',
    prompt: 'What is she most likely to feel?',
    options: [
      { id: 'a', text: 'Gratitude', score: 100, rationale: 'Receiving something desired from someone who cares is the defining appraisal for gratitude (and joy). The emotion points at the giver, not just the gift.' },
      { id: 'b', text: 'Pride', score: 50, rationale: 'Pride usually follows your OWN achievement. A gift received isn’t something she accomplished, so pride fits less cleanly.' },
      { id: 'c', text: 'Relief', score: 30, rationale: 'Relief follows a threat that didn’t materialise. Nothing feared was avoided here — this is a wished-for good arriving.' },
      { id: 'd', text: 'Hope', score: 20, rationale: 'Hope is oriented toward an uncertain future good. The good has already arrived, so hope has passed.' },
    ],
  },
  {
    id: 'steu-obstacle', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'Sam has been working steadily toward a goal when an unexpected obstacle makes it much harder to reach — though not impossible.',
    prompt: 'What is Sam most likely to feel?',
    options: [
      { id: 'a', text: 'Frustration', score: 100, rationale: 'A goal that is blocked or obstructed — but still alive — is the textbook appraisal for frustration.' },
      { id: 'b', text: 'Sadness', score: 50, rationale: 'Sadness follows genuine loss. The goal isn’t lost, only harder, so sadness overshoots — though it can creep in if hope fades.' },
      { id: 'c', text: 'Guilt', score: 20, rationale: 'Guilt requires a sense of having done something wrong. An external obstacle isn’t Sam’s fault, so guilt doesn’t fit.' },
      { id: 'd', text: 'Boredom', score: 15, rationale: 'Boredom is under-stimulation. A thwarted goal is the opposite of disengagement.' },
    ],
  },
  {
    id: 'steu-award', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'A colleague Maria quietly competes with receives a major award that Maria had wanted for herself.',
    prompt: 'What is Maria most likely to feel?',
    options: [
      { id: 'a', text: 'Envy', score: 100, rationale: 'Wanting what a similar other has obtained is the precise appraisal for envy — sharpened when the person is a rival of comparable standing.' },
      { id: 'b', text: 'Anger', score: 50, rationale: 'Anger can come too, but it needs a sense of unfairness or blame. Absent wrongdoing, the cleaner read is envy.' },
      { id: 'c', text: 'Pride', score: 15, rationale: 'Pride follows one’s own success or that of one’s group — not a rival’s win.' },
      { id: 'd', text: 'Gratitude', score: 15, rationale: 'Gratitude needs a benefit received. Nothing was given to Maria here.' },
    ],
  },
  {
    id: 'steu-dreaded', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'After weeks of dreading a difficult conversation, Tom finally has it — and it goes fine.',
    prompt: 'As he walks away, what is he most likely to feel?',
    options: [
      { id: 'a', text: 'Relief', score: 100, rationale: 'A feared outcome that fails to materialise is the defining appraisal for relief — the dread lifts.' },
      { id: 'b', text: 'Pride', score: 45, rationale: 'Pride may follow if he values having faced it, but it’s secondary to the dread simply lifting.' },
      { id: 'c', text: 'Joy', score: 50, rationale: 'Joy is close, but relief is more precise: the feeling is defined by a threat removed, not a good gained.' },
      { id: 'd', text: 'Surprise', score: 25, rationale: 'Surprise needs an unexpected event; a conversation going fine isn’t startling enough to be the main feeling.' },
    ],
  },
  {
    id: 'steu-harm', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'Priya did something that hurt a friend, and she knows it was her own doing — and against the kind of person she wants to be.',
    prompt: 'What is she most likely to feel?',
    options: [
      { id: 'a', text: 'Guilt', score: 100, rationale: 'Harm one caused, judged against one’s own standards, is the appraisal for guilt — focused on the act ("I did a bad thing").' },
      { id: 'b', text: 'Shame', score: 60, rationale: 'Very close — but shame is about the SELF being bad ("I am bad"), while guilt is about the deed. For a specific act she regrets, guilt is the sharper fit.' },
      { id: 'c', text: 'Anger', score: 20, rationale: 'Anger points outward at someone else’s wrongdoing; here the wrongdoing is her own.' },
      { id: 'd', text: 'Fear', score: 15, rationale: 'Fear needs an anticipated threat. The harm has already happened; the feeling is about responsibility, not danger.' },
    ],
  },
  {
    id: 'steu-loss', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'An outcome Jordan was genuinely counting on is now lost, with no way left to recover it.',
    prompt: 'What is Jordan most likely to feel?',
    options: [
      { id: 'a', text: 'Sadness', score: 100, rationale: 'Irrevocable loss is the defining appraisal for sadness and grief — the goal is gone, not merely delayed.' },
      { id: 'b', text: 'Frustration', score: 50, rationale: 'Frustration fits a goal that’s blocked but still reachable. Once it’s truly lost, the feeling shifts toward sadness.' },
      { id: 'c', text: 'Hope', score: 15, rationale: 'Hope requires a possible future good. "No way left to recover it" closes that door.' },
      { id: 'd', text: 'Relief', score: 15, rationale: 'Relief follows an avoided threat — the opposite of losing something wanted.' },
    ],
  },
];

// Pick an exercise for a given target domain. Objective domains get their
// matching family; reflective domains get a reflection prompt. `seen` lets the
// caller rotate variety (avoid repeating the last exercise).
export function pickExercise(targetDomain, opts = {}) {
  const { level = 1, seenIds = [], rng = Math.random } = opts;
  const notSeen = (list) => {
    const fresh = list.filter((e) => !seenIds.includes(e.id));
    const pool = fresh.length ? fresh : list;
    return pool[Math.floor(rng() * pool.length)];
  };

  switch (targetDomain) {
    case 'memory':
      return makeMemoryExercise(level, rng);
    case 'reading':
    case 'attention':
      // Reading exercises also exercise sustained attention.
      return notSeen(READING);
    case 'judgment':
      return notSeen(DECISIONS);
    case 'emotion_regulation':
      // Two structured measures — STEM (managing a feeling) and STEU (reading
      // which feeling a situation evokes) — then reflection.
      return notSeen(STEM.concat(STEU_ITEMS, REFLECTIONS.filter((r) => r.domain === targetDomain)));
    case 'communication':
      // Keyless communication SJT first (so the AI-Readiness communication pillar
      // isn't self-report only), then reflection.
      return notSeen(COMM.concat(REFLECTIONS.filter((r) => r.domain === targetDomain)));
    case 'presence':
      // Relational-presence situational measure first, then reflection.
      return notSeen(PRESENCE_SCENES.concat(REFLECTIONS.filter((r) => r.domain === targetDomain)));
    case 'persistence':
    case 'ai_autonomy':
    case 'values':
      return notSeen(REFLECTIONS.filter((r) => r.domain === targetDomain));
    case 'interior':
      return notSeen(INTERIOR_REFLECTIONS);
    default:
      return notSeen(READING);
  }
}
