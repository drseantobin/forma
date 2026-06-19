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
// Genuine inference questions — each asks the reader to APPLY or PREDICT an
// unstated conclusion the passage supports, not to recall a stated phrase. These
// replace the earlier positional shortcut (tag questions[2]), which mis-weighted
// verbatim-recall items at 1.5x and corrupted the Reading scale.
const READING_INFERENCE = {
  'read-attention-economy': {
    q: 'A platform that genuinely helped you focus and then leave quickly would, by the passage’s logic, be:',
    options: ['Its most profitable design', 'Working against its own business model', 'No different from any other platform', 'Impossible to build'],
    answer: 1,
  },
  'read-cognitive-offloading': {
    q: 'Which use of AI best fits the author’s "use it or lose it" principle?',
    options: ['Letting it handle every calculation you ever face', 'Using it for a one-off task while still practicing the skills you want to keep', 'Refusing to use it for anything', 'Using it only when you are tired'],
    answer: 1,
  },
  'read-deep-work': {
    q: 'Someone who ends each day feeling busy yet produces little that matters has most likely:',
    options: ['Done too much deep work', 'Filled the day with shallow work and lost the deep', 'Simply worked too slowly', 'Not answered enough email'],
    answer: 1,
  },
  'read-silence': {
    q: 'The passage implies that a person who fills every quiet gap with a screen will most likely:',
    options: ['Think more clearly', 'Lose the integrative thinking that happens in silence', 'Become more reflective', 'Feel more rested'],
    answer: 1,
  },
  'read-judgment-machines': {
    q: 'A person who accepts an answer mainly because it "sounds confident and clear" is:',
    options: ['Practicing careful verification', 'Falling for the very mistake the passage warns about', 'Thinking slowly and well', 'Wisely distrusting the model'],
    answer: 1,
  },
  'read-presence': {
    q: 'Which response to a grieving friend best reflects "genuine accompaniment" as the author defines it?',
    options: ['Offering several solutions to try', 'Steering the conversation somewhere lighter', 'Staying with them even when there is nothing useful to say', 'Reminding them it could be worse'],
    answer: 2,
  },
  'read-memory-extended': {
    q: 'A student who can no longer do basic arithmetic without a calculator has, by the author’s test:',
    options: ['Wisely extended their mind', 'Let the tool become a replacement rather than an extension', 'Saved time with no cost', 'Done nothing unusual'],
    answer: 1,
  },
  'read-boredom': {
    q: 'The passage implies that someone who reaches for their phone the instant they feel bored is most likely to:',
    options: ['Have more original ideas', 'Lose the very conditions under which original thought arrives', 'Become calmer over time', 'Think more deeply'],
    answer: 1,
  },
  'read-effort-paradox': {
    q: 'By the passage’s logic, which effort is most worth protecting from outsourcing?',
    options: ['Formatting a document', 'A tedious, repetitive chore', 'The thinking that works out what you actually believe', 'Filing routine paperwork'],
    answer: 2,
  },
};
READING.forEach((e) => {
  const inf = READING_INFERENCE[e.id];
  if (inf) e.questions.push({ ...inf, kind: 'inference' });
});

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
  {
    id: 'maze-memory', type: 'maze', domain: 'reading', secondaryDomain: 'memory', title: 'Read for the Sense',
    parts: [
      { text: 'Before writing existed, whole cultures carried their epics in ' },
      { blank: { options: ['memory', 'luggage', 'silence'], answer: 0 } },
      { text: '. A mind that trusts it can always look something up quietly stops ' },
      { blank: { options: ['holding', 'paying', 'selling'], answer: 0 } },
      { text: ' it — and knowledge that lives only on a screen is knowledge you cannot ' },
      { blank: { options: ['reason', 'sleep', 'travel'], answer: 0 } },
      { text: ' with mid-conversation. Offloading memory is not a ' },
      { blank: { options: ['failure', 'color', 'sound'], answer: 0 } },
      { text: '; it is how civilization scales. But a mind with nothing of its own to draw on has outsourced more than it ' },
      { blank: { options: ['meant', 'sang', 'bought'], answer: 0 } },
      { text: ' to.' },
    ],
  },
  {
    id: 'maze-summary', type: 'maze', domain: 'reading', secondaryDomain: 'judgment', title: 'Read for the Sense',
    parts: [
      { text: 'A good summary hands you a conclusion without the ' },
      { blank: { options: ['reasoning', 'weather', 'furniture'], answer: 0 } },
      { text: ' that earned it. That is useful when you only need the ' },
      { blank: { options: ['gist', 'silence', 'color'], answer: 0 } },
      { text: ', and corrosive when you mistake it for ' },
      { blank: { options: ['understanding', 'breakfast', 'distance'], answer: 0 } },
      { text: '. Following a long argument in full trains a mind that can ' },
      { blank: { options: ['hold', 'spill', 'sell'], answer: 0 } },
      { text: ' complexity; living on summaries trains one that ' },
      { blank: { options: ['skims', 'sleeps', 'sings'], answer: 0 } },
      { text: ' and moves on.' },
    ],
  },
  {
    id: 'maze-presence', type: 'maze', domain: 'reading', secondaryDomain: 'presence', title: 'Read for the Sense',
    parts: [
      { text: 'Attention is the most basic form of ' },
      { blank: { options: ['regard', 'currency', 'weather'], answer: 0 } },
      { text: ' we offer another person. A glance at a phone mid-sentence tells them, without a word, where they ' },
      { blank: { options: ['rank', 'sleep', 'travel'], answer: 0 } },
      { text: '. Presence cannot be ' },
      { blank: { options: ['faked', 'bought', 'folded'], answer: 0 } },
      { text: ' for long; the other person feels the difference between being heard and being ' },
      { blank: { options: ['processed', 'fed', 'painted'], answer: 0 } },
      { text: '. To stay, fully, is itself a kind of ' },
      { blank: { options: ['gift', 'debt', 'noise'], answer: 0 } },
      { text: '.' },
    ],
  },
  {
    id: 'maze-autonomy', type: 'maze', domain: 'reading', secondaryDomain: 'ai_autonomy', title: 'Read for the Sense',
    parts: [
      { text: 'Letting a tool decide for you is convenient, and convenience has a ' },
      { blank: { options: ['cost', 'color', 'melody'], answer: 0 } },
      { text: ' that arrives too slowly to notice. Each small surrender of judgment feels ' },
      { blank: { options: ['trivial', 'loud', 'heavy'], answer: 0 } },
      { text: ', but they ' },
      { blank: { options: ['accumulate', 'vanish', 'rhyme'], answer: 0 } },
      { text: ' into a dependence you never quite ' },
      { blank: { options: ['chose', 'bought', 'sang'], answer: 0 } },
      { text: '. Independence is not refusing help; it is keeping the ' },
      { blank: { options: ['capacity', 'receipt', 'silence'], answer: 0 } },
      { text: ' to do the thing yourself.' },
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
      'A list of words will appear for a few seconds. Hold them in mind — then they vanish, and you put them back in the same order from memory. Order is the test, not just the words.',
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
  {
    id: 'dec-sunkcost',
    type: 'decision',
    domain: 'judgment',
    title: 'Counting What’s Already Spent',
    scenario:
      'You’ve spent three months and most of the budget on an approach the latest data clearly shows isn’t working. Starting fresh would mean admitting those months are lost.',
    prompt: 'What’s the sounder call?',
    options: [
      { id: 'a', text: 'Decide on what’s likely to work from here — the time and money already spent can’t come back and shouldn’t drive the choice.', score: 100, rationale: 'The spent resources are gone whatever you choose; sound judgment weighs only the future return. Letting unrecoverable losses steer the decision is how good effort gets thrown after bad.' },
      { id: 'b', text: 'Hedge: keep the failing approach running but quietly start the new one alongside it.', score: 55, rationale: 'Partly right — it does start the better path — but it keeps burning resources on an approach the data already calls dead, often to avoid the hard admission rather than as real strategy.' },
      { id: 'c', text: 'Push through — you’re too far in to stop now; quitting would waste everything.', score: 40, rationale: '"Too far in" is the sunk-cost trap stated outright: it treats spent resources as a reason to spend more. The months are lost either way; the only question is what happens next.' },
      { id: 'd', text: 'Stick with it and hope the data turns around.', score: 20, rationale: 'Hope isn’t a plan, and the data is the signal. Waiting for a failing approach to reverse with no reason to expect it is the most passive form of the same trap.' },
    ],
  },
  {
    id: 'dec-automate',
    type: 'decision',
    domain: 'judgment',
    title: 'When Not to Automate',
    scenario:
      'A routine part of your work could now be fully automated by AI. It’s also the task through which you’ve kept a hard-won skill sharp — and often caught problems early.',
    prompt: 'What’s the wisest approach?',
    options: [
      { id: 'a', text: 'Automate the genuinely rote parts, but keep doing by hand the piece that keeps the skill — and the early warning — alive.', score: 100, rationale: 'Discernment, not purity: offload the drudgery, but protect the practice that preserves a real capacity and your feel for when something’s off. Efficiency that quietly erodes judgment isn’t a bargain.' },
      { id: 'b', text: 'Refuse to automate any of it, to be safe.', score: 50, rationale: 'Over-rigid — keeping rote drudgery by hand on principle wastes the very attention you’d want for the part that matters. The skill is choosing what to keep, not refusing all help. (At least the capacity stays intact.)' },
      { id: 'c', text: 'Automate all of it — if a machine can do it, doing it by hand is just nostalgia.', score: 35, rationale: '"A machine can do it" isn’t the same as "you should stop being able to." This trades away the skill and the early-warning signal for time saved on a task you may have undervalued.' },
      { id: 'd', text: 'Automate it now and plan to relearn the skill later if you ever need it.', score: 20, rationale: 'Skills decay quietly and "relearn later" rarely happens under pressure. By the time you need it, the instinct it gave you for catching problems is already gone.' },
    ],
  },
  {
    id: 'dec-uncertainty',
    type: 'decision',
    domain: 'judgment',
    title: 'Deciding Without Enough to Go On',
    scenario:
      'You have to choose a direction now, but the information you’d need to feel confident genuinely isn’t available yet — and may not be for weeks.',
    prompt: 'What’s the soundest way to act under real uncertainty?',
    options: [
      { id: 'a', text: 'Make the smallest reversible move that buys information, and stay ready to change course as you learn.', score: 100, rationale: 'Under genuine uncertainty the win is a cheap, reversible step that turns waiting into learning — neither a confident bet nor paralysis. Decide in a way that keeps your options open.' },
      { id: 'b', text: 'Wait until you have enough information to be confident.', score: 45, rationale: 'Sometimes right — but here the information may never come, and "wait for certainty" can quietly become indefinite paralysis while the situation decides for you.' },
      { id: 'c', text: 'Pick the boldest option and commit fully — decisiveness wins.', score: 40, rationale: 'Confidence isn’t the same as being right. Committing hard on irreducibly thin information is how one wrong read becomes expensive and hard to undo.' },
      { id: 'd', text: 'Pick whatever feels right and stop thinking about it.', score: 20, rationale: 'Closing the question to escape the discomfort of not-knowing is premature closure — it swaps an honest uncertainty for a false certainty you’ll then defend even as the evidence arrives.' },
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
  {
    id: 'crt-hole',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'How many cubic feet of dirt are in a hole that is 3 feet long, 3 feet wide, and 3 feet deep?',
    options: [
      { id: 'a', text: '27', kind: 'intuitive' },
      { id: 'b', text: 'None — a hole has no dirt in it', kind: 'reflective' },
      { id: 'c', text: '9', kind: 'other' },
      { id: 'd', text: '6', kind: 'other' },
    ],
    explanation: 'The pull is to multiply 3×3×3 = 27. But a hole is empty by definition — the dirt is what was removed to make it. The reflective move is to question what is actually being asked before computing.',
  },
  {
    id: 'crt-months',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'How many months of the year have 28 days?',
    options: [
      { id: 'a', text: 'Just one — February', kind: 'intuitive' },
      { id: 'b', text: 'All twelve', kind: 'reflective' },
      { id: 'c', text: 'Four', kind: 'other' },
      { id: 'd', text: 'Seven', kind: 'other' },
    ],
    explanation: 'February is the only month with EXACTLY 28 — but every month has a 28th day, so all twelve have (at least) 28. The lure is the word "exactly" your mind quietly inserts.',
  },
  {
    id: 'crt-discount',
    type: 'crt',
    domain: 'judgment',
    title: 'The Lure',
    prompt: 'A $20 shirt is marked 50% off. At the register you get another 50% off the already-reduced price. What do you pay?',
    options: [
      { id: 'a', text: 'Nothing — it’s free', kind: 'intuitive' },
      { id: 'b', text: '$5', kind: 'reflective' },
      { id: 'c', text: '$10', kind: 'other' },
      { id: 'd', text: '$2.50', kind: 'other' },
    ],
    explanation: 'The pull is 50% + 50% = 100% off, free. But the second 50% comes off the already-halved $10, not the original: $20 → $10 → $5. Percentages of different bases do not add.',
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
// MEASURE (a scored test of a capacity) vs PRACTICE (a formation/training rep that
// isn't graded right or wrong). Sean: be explicit about which a given exercise is —
// "today's session isn't a practice, they're tests." The contemplative/reflective
// reps are practices; everything scored against a key or performance is a measure.
const PRACTICE_TYPES = new Set(['contemplation', 'reflection']);
export function exerciseMode(type) {
  return PRACTICE_TYPES.has(type) ? 'practice' : 'measure';
}

export function makeContemplation(level = 1) {
  // A ladder you climb: start at 90s and extend by increments as stillness gets
  // easier. The intro lets the practitioner pick/extend; level sets the default.
  const ladder = [90, 120, 180, 240];
  const seconds = ladder[Math.min(ladder.length - 1, Math.max(0, (level || 1) - 1))];
  return {
    id: `contemplation-${seconds}`,
    type: 'contemplation',
    domain: 'interior',
    title: 'Stillness',
    prompt: 'Sit still, put the screen down, and simply be present — to God, to your own breath, to the quiet. No goal but to stay.',
    targetSeconds: seconds,
    durations: ladder,
  };
}

// ----- GUIDED PRACTICE: short, ACT-based micro-practices -----
// An "advanced mode" the person chooses on demand. Each module adapts an
// established Acceptance & Commitment Therapy technique into a ~2-minute guided
// practice with a breathing visualization. Grounded, never clinical: this is a
// PRACTICE in psychological flexibility, NOT a treatment or a measure. So a
// guided practice is logged (it counts as showing up, for the streak) but is
// UNSCORED — scoreExercise returns null for type 'guided', so it never moves a
// measurement scale. Selection is on-device; nothing here is sent to any API.
//
// Scripts adapted faithfully from the ACT literature (Hayes/Strosahl/Wilson 1999;
// Harris, ACT Made Simple). Design rules baked in, from the evidence:
//   • Acceptance breath makes ROOM for a feeling — never "to get rid of it."
//   • Defusion changes a thought's FUNCTION (it becomes just words) — it does not
//     suppress, dispute, or disprove the thought.
//   • Present-moment (Dropping Anchor) is deliberately EYES-OPEN and outward.
//   • Values ends in one small, concrete next step (committed action).
//   • Invite "something weighing on you," never the worst memory; always close
//     re-grounded and forward — no raw open affect, no over-claiming.
export const ACT_MODULES = [
  {
    id: 'defusion',
    process: 'Cognitive defusion',
    name: 'Unhooking from a thought',
    lead: 'For when a thought keeps gripping you. You’ll loosen its hold — without arguing with it or pushing it away.',
    basis: 'Adapts the “I’m having the thought that…” and word-repetition defusion techniques (Hayes et al., 1999; Masuda et al., 2004), which reduce a thought’s grip without disputing it.',
    breath: { inhale: 4, hold: 0, exhale: 5 },
    eyesOpen: false,
    before: 'Bring to mind a thought that’s been weighing on you — put it in just a few words.',
    scale: { label: 'How much does that thought grip you right now?', lo: 'Barely', hi: 'Completely', better: 'down' },
    steps: [
      { text: 'Let the thought come fully to mind, in just a few words. Let it be here.', sec: 16 },
      { text: 'Now silently put four words in front of it: “I’m having the thought that…” — and say the whole thing, slowly.', sec: 20 },
      { text: 'Notice it’s a thought — something your mind is offering you — not an order you have to obey.', sec: 18 },
      { text: 'Take the few sharpest words of it, and repeat just those — quietly, quickly — for a little while.', sec: 20, freezeBreath: true },
      { text: 'Hear how the words start to become just sounds, losing some of their sting.', sec: 16 },
      { text: 'The thought can stay. You don’t have to believe it or push it away. Let it be — and let it pass.', sec: 18 },
    ],
    after: 'Bring the thought to mind once more. How much does it grip you now?',
  },
  {
    id: 'acceptance',
    process: 'Acceptance / making room',
    name: 'Making room for a hard feeling',
    lead: 'For when a feeling is hard to sit with. You’ll make room for it rather than fight it — which, oddly, is what loosens it.',
    basis: 'Adapts Harris’s “expansion / making room” and the acceptance rationale tested by Levitt et al. (2004), where allowing a feeling — not suppressing it — increased willingness and tolerance.',
    breath: { inhale: 4, hold: 0, exhale: 6 },
    eyesOpen: false,
    before: 'Notice the feeling that’s hardest right now. You don’t have to name it perfectly — just let it be here.',
    scale: { label: 'How much are you struggling against this feeling?', lo: 'Not at all', hi: 'Hard', better: 'down' },
    steps: [
      { text: 'Find where the feeling sits in your body — chest, throat, stomach. Just locate it.', sec: 18 },
      { text: 'Rest your attention right on that spot, with curiosity — the way you’d notice the weather.', sec: 18 },
      { text: 'Notice its edges. Is it heavy, tight, warm? You don’t have to change it. Just observe.', sec: 18 },
      { text: 'Breathe slowly, and let the breath open a little space around the feeling — not to push it out, just to give it room.', sec: 20 },
      { text: 'Let it be there. You don’t have to like it or want it — only allow it the room it needs.', sec: 18 },
      { text: 'It’s a feeling, and feelings move. Keep breathing, and let it be exactly as it is.', sec: 16 },
    ],
    after: 'Come back to the feeling. How much are you struggling against it now?',
  },
  {
    id: 'present',
    process: 'Contact with the present moment',
    name: 'Dropping anchor',
    lead: 'For when your mind is racing or scattered. You’ll come back to the present and steady yourself — eyes open, here.',
    basis: 'Adapts Russ Harris’s “Dropping Anchor” (ACE: Acknowledge · Come back to the body · Engage) — a structured, eyes-open grounding skill for when attention is pulled in every direction.',
    breath: { inhale: 4, hold: 0, exhale: 4 },
    eyesOpen: true,
    before: 'Keep your eyes open for this one. Just notice that you’re here, about to steady yourself.',
    scale: { label: 'How present and grounded do you feel?', lo: 'Scattered', hi: 'Grounded', better: 'up' },
    steps: [
      { text: 'Quietly name what’s showing up inside you. “Here is worry.” “Here is tightness.” Just name it.', sec: 16 },
      { text: 'Now come back into your body. Press your feet into the floor and feel it hold you up.', sec: 16 },
      { text: 'Straighten your back. Slowly stretch your arms or shoulders. Feel yourself, here, in your own body.', sec: 16 },
      { text: 'Widen your attention. Look around and silently name five things you can see.', sec: 22 },
      { text: 'Now two sounds you can hear — near, or far.', sec: 16 },
      { text: 'You’re here, in this moment. The thoughts and feelings can come along — and you get to choose what’s next.', sec: 16 },
    ],
    after: 'And now? How present and grounded do you feel?',
  },
  {
    id: 'values',
    process: 'Contact with values',
    name: 'What you want to stand for',
    lead: 'For when things feel pointless or adrift. You’ll reconnect with what matters — and pick one small step toward it.',
    basis: 'Adapts ACT values-clarification and self-affirmation work (Hayes et al., 1999; Cohen & Sherman, 2014). Naming a value and one concrete next step is what links it to action.',
    breath: { inhale: 4, hold: 0, exhale: 6 },
    eyesOpen: false,
    before: 'Set the hard moment down for one breath. We’re going to turn toward what matters to you.',
    // Values uses written capture (the writing is the active ingredient), not a 0-10 scale.
    capture: { value: 'In a word or short phrase: what do you most want to stand for?', action: 'One small thing you could do in the next hour that moves you that way:' },
    steps: [
      { text: 'Ask yourself: in the life I want to live, what do I most want to stand for?', sec: 18 },
      { text: 'Let one word or short phrase come — kindness, courage, being there for the people I love.', sec: 16 },
      { text: 'Picture one time you lived that out, even in a small way. Notice how it felt to be that person.', sec: 18 },
      { text: 'Bring that quality into right now. Even with this difficulty here, you can act from it.', sec: 16 },
      { text: 'Name one small thing you could do in the next hour that moves you that way.', sec: 18 },
      { text: 'That’s the direction. The feelings can come too — you can carry them and still walk it.', sec: 14 },
    ],
    after: 'Hold onto that.',
  },
  {
    id: 'woop',
    process: 'Mental contrasting (WOOP)',
    name: 'Turn a wish into a plan',
    lead: 'For when you want to follow through on something but keep slipping. You’ll picture what you want — and the obstacle in the way — then turn it into one concrete if-then plan.',
    basis: 'Adapts Oettingen’s WOOP / mental-contrasting-with-implementation-intentions (Oettingen, 2014; Gollwitzer & Sheeran, 2006) — among the few self-regulation methods with replicated behaviour-change effects in randomized trials.',
    breath: { inhale: 4, hold: 0, exhale: 6 },
    eyesOpen: false,
    before: 'Bring to mind one thing you genuinely want to follow through on — small and doable, today or this week.',
    // Written capture (the contrasting + the plan are the active ingredients), not a 0-10 scale.
    // value = the obstacle (named honestly); action = the if-then plan (saved as a committed step).
    capture: { value: 'The obstacle: the thing in you most likely to get in the way — a feeling, a habit, a thought. Name it honestly.', action: 'Your plan — finish this: “If [that obstacle] shows up, then I will ___.”' },
    steps: [
      { text: 'Name the WISH — one thing you want to follow through on. Hold it in mind.', sec: 16 },
      { text: 'Picture the best OUTCOME — what it would feel like to actually do it. Let yourself really see it.', sec: 20 },
      { text: 'Now the OBSTACLE — what in you tends to get in the way? The urge, the mood, the excuse. Picture it honestly.', sec: 20 },
      { text: 'Hold both at once: the outcome you want, and the obstacle that’s real. That contrast is the point.', sec: 16 },
      { text: 'Make the PLAN: “If [the obstacle] happens, then I will [what you’ll do instead].” Decide it now, in advance.', sec: 20 },
      { text: 'You don’t have to feel ready. You have a plan for the moment it’s hard — that’s what carries you.', sec: 14 },
    ],
    after: 'Hold onto the plan.',
  },
  {
    id: 'examen',
    domain: 'interior',
    process: 'The Daily Examen (Ignatian)',
    name: 'The Examen',
    lead: 'A short, prayerful look back over your day, in the Ignatian tradition — noticing where you met grace, and what tomorrow asks. Private to you, never scored.',
    basis: 'The Ignatian Daily Examen (St. Ignatius of Loyola), opening in the awareness of God’s presence drawn from Brother Lawrence (The Practice of the Presence of God), with the noticing of consolation and desolation from Ignatian discernment of spirits. Grounded in the standard modern formulation (IgnatianSpirituality.com / the Jesuit Conference) and the warmth of contemporary guides like Hallow.',
    breath: { inhale: 4, hold: 0, exhale: 6 },
    eyesOpen: false,
    before: 'A few quiet minutes to look back over your day with God — not to judge it, but to see it.',
    // Written capture (the prayer is the practice): value = a grace noticed; action = tomorrow's
    // small resolve (saved as a gentle, private interior intention via completeGuided). No 0-10 scale.
    capture: { value: 'Where did you most sense grace today? (a word or a line, just for you)', action: 'One small way you want to show up tomorrow:' },
    steps: [
      { text: 'Take a breath, and settle. God is already here, closer than your own breath. Rest in that for a moment.', sec: 18 },
      { text: 'Look back over today and let one good thing rise — a face, a moment, a small mercy. Give thanks for it.', sec: 20 },
      { text: 'Walk gently back through your day. Where did you feel most alive, drawn toward the good? Where did you feel pulled away — drained, or closed off?', sec: 22 },
      { text: 'Choose one moment that stands out. Speak to God about it honestly — gratitude, sorrow, or a need. Ask for what you need.', sec: 20 },
      { text: 'Look toward tomorrow. Name one small way you want to show up, and ask for the grace to live it.', sec: 18 },
    ],
    after: 'Close however you like — many end with the Our Father.',
  },
];

export const ACT_MODULE_BY_ID = Object.fromEntries(ACT_MODULES.map((m) => [m.id, m]));

// Theme keywords → which ACT process fits what the person has been naming. Pure
// keyword match over the text they've already shared (coach chat + practice
// notes). Deliberately on-device and conservative.
const ACT_THEME_KEYWORDS = {
  defusion: ['can’t stop thinking', 'cant stop thinking', 'keep thinking', 'stuck in my head', 'overthink', 'spiral', 'ruminat', 'i always', 'i never', 'not good enough', 'i’m such', 'im such', 'failure', 'my fault', 'beating myself', 'self-critic', 'self critic'],
  acceptance: ['anxious', 'anxiety', 'afraid', 'scared', 'angry', 'furious', 'frustrat', 'overwhelm', 'panic', 'stress', 'can’t stand', 'cant stand', 'hate feeling', 'dread', 'nervous', 'tense', 'grief', 'sad', 'hurts'],
  present: ['distract', 'scattered', 'can’t focus', 'cant focus', 'racing', 'restless', 'too much going', 'all over', 'can’t settle', 'cant settle', 'frazzled', 'wired', 'spinning'],
  values: ['pointless', 'what’s the point', 'whats the point', 'no point', 'don’t care', 'dont care', 'feel lost', 'no motivation', 'why bother', 'going through the motions', 'empty', 'meaningless', 'adrift', 'aimless', 'numb'],
  woop: ['procrastinat', 'keep putting off', 'putting it off', 'can’t follow through', 'cant follow through', 'never follow through', 'never finish', 'don’t finish', 'dont finish', 'keep slipping', 'no willpower', 'no self-control', 'won’t stick', 'wont stick', 'can’t stick to', 'cant stick to', 'keep failing to', 'keep meaning to', 'avoid doing'],
};

// Choose the ACT module that best fits this person right now — on-device, from
// what they've already told the coach and written in recent practices, with a
// gentle fall-back to their lowest-scoring relevant capacity, and finally to
// "dropping anchor" (the safest, most general grounding practice).
export function chooseActModule(profile = {}) {
  const texts = [];
  for (const m of (profile.coachLog || []).slice(-12)) {
    if (m && m.role === 'user' && m.content) texts.push(String(m.content));
  }
  for (const s of (profile.sessions || []).slice(-8)) {
    const note = s && s.response && s.response.note;
    if (note) texts.push(String(note));
  }
  const hay = texts.join(' \n ').toLowerCase();
  let best = null;
  for (const id of Object.keys(ACT_THEME_KEYWORDS)) {
    const hits = ACT_THEME_KEYWORDS[id].reduce((n, kw) => n + (hay.includes(kw) ? 1 : 0), 0);
    if (hits > 0 && (!best || hits > best.hits)) best = { id, hits };
  }
  if (best) return ACT_MODULE_BY_ID[best.id];

  // No textual signal: lean on the lowest of the capacities each process serves.
  const scores = profile.domainScores || {};
  const byDomain = [
    { id: 'present', score: scores.attention },
    { id: 'acceptance', score: scores.emotion_regulation },
    { id: 'woop', score: scores.persistence },
    { id: 'values', score: scores.values },
  ].filter((x) => typeof x.score === 'number');
  if (byDomain.length) {
    byDomain.sort((a, b) => a.score - b.score);
    return ACT_MODULE_BY_ID[byDomain[0].id];
  }
  return ACT_MODULE_BY_ID.present;
}

// Build a guided-practice "exercise". Domain emotion_regulation so it lives with
// the inner-weather capacity, but flagged practice:true and UNSCORED (see
// scoring.js) so it never inflates that measure. The chosen module rides along
// on the exercise so the renderer needs no extra lookup.
export function makeGuided(profile = {}, moduleId = null) {
  const m = (moduleId && ACT_MODULE_BY_ID[moduleId]) || chooseActModule(profile);
  const totalSeconds = m.steps.reduce((n, s) => n + (s.sec || 0), 0);
  return {
    id: `guided-${m.id}`,
    type: 'guided',
    domain: m.domain || 'emotion_regulation', // most ACT modules live with inner-weather; the Examen is 'interior' (private track)
    title: m.name,
    practice: true,
    moduleId: m.id,
    module: m,
    totalSeconds,
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
  // Psychomotor Vigilance Task (PVT; Dinges & Powell, 1985) — the validated standard
  // for sustained attention. A clearly-visible target appears after a random wait and
  // you respond as fast as you can; the measure is reaction time + lapses (RT>500ms) +
  // false starts. NOT detecting a faint dot — that confounds visual sensitivity with
  // vigilance (and made a fast responder score mid). Trial count is extendable so a
  // longer run probes sustained attention over time.
  const ladder = [10, 20, 30];
  const trials = ladder[Math.min(ladder.length - 1, Math.max(0, (level || 1) - 1))];
  return {
    id: `vigilance-${Date.now()}`,
    type: 'vigilance',
    domain: 'attention',
    title: 'Reaction & Vigilance',
    trials,
    trialLadder: ladder,
    isiMin: 1500, // ms — minimum random wait before the target appears
    isiMax: 6000, // ms — maximum wait; the unpredictability is what makes it a vigilance demand
  };
}

// ----- SYMMETRY SPAN: visuospatial working-memory capacity (Foster/Engle shortened) -----
// The construct-valid WMC headline (replacing n-back). Each trial alternates a symmetry JUDGMENT
// (is this 8×8 pattern left-right symmetric?) with a to-remember red CELL in a 4×4 grid, for `setSize`
// items, then serial recall by tapping the grid. Shortened battery: set sizes 2-5, two trials each
// (8 trials / 28 items, ~4-5 min — Foster 2014 shows shortened spans retain validity). scoreSpan reads
// the screen's per-trial { sequence, recalled, symAcc }; the symmetry judgments gate the run at >=85%.
function _symMatrix(makeSymmetric) {
  const g = new Array(64).fill(0);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 4; c++) { const v = Math.random() < 0.5 ? 1 : 0; g[r * 8 + c] = v; g[r * 8 + (7 - c)] = v; }
  if (!makeSymmetric) { const r = Math.floor(Math.random() * 8), c = Math.floor(Math.random() * 4); g[r * 8 + (7 - c)] = g[r * 8 + (7 - c)] ? 0 : 1; } // flip one mirror cell → guaranteed asymmetric
  return g;
}
export function makeSymmetrySpanExercise() {
  const sizes = [2, 2, 3, 3, 4, 4, 5, 5];
  for (let i = sizes.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = sizes[i]; sizes[i] = sizes[j]; sizes[j] = t; }
  const sets = sizes.map((setSize) => {
    const pool = Array.from({ length: 16 }, (_, k) => k);
    const cells = [];
    for (let k = 0; k < setSize; k++) { const idx = Math.floor(Math.random() * pool.length); cells.push(pool.splice(idx, 1)[0]); }
    const items = cells.map((cell) => { const symmetric = Math.random() < 0.5; return { grid: _symMatrix(symmetric), symmetric, cell }; });
    return { setSize, items, sequence: cells };
  });
  return { id: `span-${Date.now()}`, type: 'span', domain: 'memory', title: 'Symmetry Span', sets, symTimeCapMs: 6000, procGate: 0.85 };
}

// ----- LETTER-NUMBER SERIES: fluid reasoning (Gf), ICAR-style (Condon & Revelle 2014) -----
// GENERATED from explicit rules so the correct answer is computed (no mis-key, fresh items, no bank
// exhaustion). 5 shown terms → "what comes next", 6-option MC. Distractors are procedural error-types
// (off-by-step, wrong-op continuation, repeat-last, adjacent). A uniqueness/sanity guard rejects any
// sequence whose shown terms a competing simple rule would also fit with a DIFFERENT next term — the
// correctness check series items live or die on (Simon & Kotovsky). Diversifies the Reasoning facet.
const _LN_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
function _seriesCandidate(level) {
  const ri = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const easy = ['arith', 'sub', 'geom', 'letter'];
  const med = ['accel', 'fib'];
  const fam = pick(level >= 3 ? med.concat(easy) : (level >= 2 ? easy.concat(med) : easy));
  let terms = [], kind = 'number', why = '';
  if (fam === 'arith') { const a = ri(1, 9), k = ri(2, 6); for (let i = 0; i < 6; i++) terms.push(a + k * i); why = `add ${k} each step`; }
  else if (fam === 'sub') { const k = ri(2, 6), a = 40 + ri(0, 9); for (let i = 0; i < 6; i++) terms.push(a - k * i); why = `subtract ${k} each step`; }
  else if (fam === 'geom') { const r = ri(2, 3), a = ri(1, 3); for (let i = 0; i < 6; i++) terms.push(a * Math.pow(r, i)); why = `multiply by ${r} each step`; }
  else if (fam === 'accel') { let v = ri(1, 4), step = ri(1, 3); terms.push(v); for (let i = 1; i < 6; i++) { v += step; terms.push(v); step += 1; } why = 'the gap grows by one each step'; }
  else if (fam === 'fib') { const a = ri(1, 3), b = ri(2, 4); terms = [a, b]; for (let i = 2; i < 6; i++) terms.push(terms[i - 1] + terms[i - 2]); why = 'each term is the sum of the two before it'; }
  else { kind = 'letter'; const skip = ri(2, 4), start = ri(0, 6); const idx = []; for (let i = 0; i < 6; i++) idx.push(start + skip * i); if (idx[5] > 25) return null; terms = idx.map((x) => _LN_LETTERS[x]); why = `skip ${skip} letters each step`; }
  return { shown: terms.slice(0, 5), answer: terms[5], kind, fam, why };
}

export function makeSeriesExercise(level = 1) {
  for (let attempt = 0; attempt < 60; attempt++) {
    const c = _seriesCandidate(level);
    if (!c) continue;
    const { shown, answer, kind, fam, why } = c;
    if (kind === 'number' && (!Number.isInteger(answer) || answer < -50 || answer > 9999 || shown.some((x) => !Number.isInteger(x)))) continue;
    let pool;
    if (kind === 'number') {
      const d = shown[4] - shown[3];
      pool = [answer + 1, answer - 1, shown[4], shown[4] + d, answer + d, answer + 2, answer - 2];
    } else {
      const ai = _LN_LETTERS.indexOf(answer);
      pool = [ai + 1, ai - 1, ai + 2, ai - 2, _LN_LETTERS.indexOf(shown[4])].filter((x) => x >= 0 && x <= 25).map((x) => _LN_LETTERS[x]);
    }
    const seen = new Set([answer]); const distractors = [];
    for (const x of pool) { if (x == null || seen.has(x)) continue; seen.add(x); distractors.push(x); if (distractors.length === 5) break; }
    if (distractors.length < 5) continue;
    // Uniqueness sanity: a non-arithmetic family must NOT have constant differences (which would make a
    // plain arithmetic continuation an equally-defensible — and different — answer).
    if (kind === 'number') {
      const diffs = shown.slice(1).map((v, i) => v - shown[i]);
      if (diffs.every((x) => x === diffs[0]) && fam !== 'arith' && fam !== 'sub') continue;
    }
    const opts = [answer, ...distractors];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = opts[i]; opts[i] = opts[j]; opts[j] = t; }
    return { id: `series-${Date.now()}`, type: 'series', domain: 'judgment', title: 'What Comes Next', terms: shown, options: opts, answer: opts.indexOf(answer), rule: fam, difficulty: (fam === 'accel' || fam === 'fib') ? 'medium' : 'easy', explanation: `The rule: ${why}.` };
  }
  return null;
}

// ----- FLANKER: executive attention / inhibitory control (Eriksen; NIH Toolbox arrows) -----
// Respond to the CENTER arrow's direction while flanking arrows pull congruently or incongruently.
// 8 practice + 64 scored (32 congruent / 32 incongruent), direction-balanced and lightly de-runned.
// Each trial: { congruent, dir:'L'|'R', iti } — the screen renders the 5-arrow row and records
// { correct, rt } per trial; scoreFlanker reads those. Higher-reliability executive-attention measure
// than the PVT/pursuit blob (which index sustained/psychomotor vigilance — a different facet).
export function makeFlankerExercise() {
  const jitterIti = () => 500 + Math.floor(Math.random() * 10) * 50; // 500..950 ms, 50 ms steps
  const build = (perCell) => {
    const cells = [];
    for (const congruent of [true, false]) for (const dir of ['L', 'R']) for (let i = 0; i < perCell; i++) cells.push({ congruent, dir, iti: jitterIti() });
    const noLongRun = (arr) => {
      let cc = 1, dc = 1;
      for (let i = 1; i < arr.length; i++) {
        cc = arr[i].congruent === arr[i - 1].congruent ? cc + 1 : 1;
        dc = arr[i].dir === arr[i - 1].dir ? dc + 1 : 1;
        if (cc > 3 || dc > 3) return false;
      }
      return true;
    };
    let out = cells;
    for (let attempt = 0; attempt < 40; attempt++) {
      for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }
      if (noLongRun(out)) break;
    }
    return out;
  };
  return { id: `flanker-${Date.now()}`, type: 'flanker', domain: 'attention', title: 'Filter the Noise', practice: build(2), trials: build(16) };
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
// Meaning in Life Questionnaire — Presence-of-Meaning subscale (Steger, Frazier, Oishi & Kaler 2006).
// The validated SELF-REPORT headline for the Purpose track, replacing the projective sentence-completion
// (RISB can't be validly app-scored). Verbatim items (item 9 reverse-keyed); 7-pt anchors. Self-report,
// never a performance score, never shown to employers. Cite Steger 2006; confirm commercial use w/ author.
export const MLQ_PRESENCE = {
  id: 'mlq-presence', type: 'meaning', domain: 'values', title: 'Meaning in Life',
  instrument: 'Meaning in Life Questionnaire — Presence subscale (Steger et al., 2006)',
  anchors: ['Absolutely untrue', 'Mostly untrue', 'Somewhat untrue', 'Can’t say true or false', 'Somewhat true', 'Mostly true', 'Absolutely true'],
  items: [
    { text: 'I understand my life’s meaning.', reverse: false },
    { text: 'My life has a clear sense of purpose.', reverse: false },
    { text: 'I have a good sense of what makes my life meaningful.', reverse: false },
    { text: 'I have discovered a satisfying life purpose.', reverse: false },
    { text: 'My life has no clear purpose.', reverse: true },
  ],
};

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
  {
    id: 'sent-relationships', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['The people closest to me would say I', 'I hold back from others when', 'What I need but rarely ask for is', 'I am at my best with people when', 'The relationship I most want to tend is'],
  },
  {
    id: 'sent-work', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['The work that feels most like mine is', 'I put off', 'I feel I am wasting myself when', 'Success, to me, actually means', 'The effort I am most tempted to hand to a machine is'],
  },
  {
    id: 'sent-time', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['When I have an unplanned hour, I', 'I lose whole evenings to', 'The habit I keep meaning to start is', 'My attention goes, without my permission, to', 'If I had my time back, I would spend more of it'],
  },
  {
    id: 'sent-fear', type: 'sentence', domain: 'values', title: 'Finish the Thought',
    stems: ['What I am most reluctant to look at is', 'I tell myself I will deal with it later when', 'The story I keep telling about myself is', 'I would change, if I were not afraid to', 'Underneath the busyness, I am really'],
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
  {
    id: 'trade-calculation', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'AI can handle every calculation and quantitative judgment you’ll ever face — budgets, estimates, probabilities — faster and more accurately than you.',
    prompt: 'What’s the wise trade?',
    options: [
      { id: 'a', text: 'Hand it all over — never do mental math again.', score: 25, rationale: 'The accuracy is real, but a felt sense of number is how you catch a figure that’s obviously off. Offload it entirely and you can’t even smell an error — you can only ever trust the output.' },
      { id: 'b', text: 'Let it crunch the heavy problems, but keep doing quick estimates yourself so you stay numerate.', score: 100, rationale: 'The move: take the tool’s power on the hard problems, keep the everyday estimation that keeps your number sense alive. You stay able to sanity-check what the machine hands you.' },
      { id: 'c', text: 'Refuse it and do all your own arithmetic on principle.', score: 55, rationale: 'Keeps the skill sharp but forfeits real leverage on the genuinely hard problems. Independence is choosing where to delegate, not refusing to.' },
      { id: 'd', text: 'Let it do everything, while assuming you could still estimate if you had to.', score: 30, rationale: 'Number sense fades without use; believing you’ve kept it isn’t keeping it. The check only protects you if you still actually run it sometimes.' },
    ],
  },
  {
    id: 'trade-relationships', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'AI can draft your hard personal messages, remember everyone’s details, and suggest exactly what to say to the people you love — smoothing every interaction.',
    prompt: 'Where’s the line worth holding?',
    options: [
      { id: 'a', text: 'Let it handle your personal communication — the relationships run smoother.', score: 25, rationale: 'Smoother, but the friction you’re removing is partly the relationship itself — finding your own words is how care gets expressed. Outsource it and people start relating to the model, not to you.' },
      { id: 'b', text: 'Use it to prepare for genuinely hard conversations, but say the words that matter in your own voice.', score: 100, rationale: 'Right line: let it help you think and steady your nerves, then show up as yourself. The bonding part — being truly present in your own words — stays yours.' },
      { id: 'c', text: 'Never let it near anything personal.', score: 55, rationale: 'Protects authenticity but turns down real help with the conversations that scare us. The goal isn’t purity; it’s guarding what’s load-bearing.' },
      { id: 'd', text: 'Let it write your messages but sign them as if they’re yours.', score: 20, rationale: 'The most seductive trade: it feels like connection while quietly hollowing it. The people you love deserve the actual you, even when you’re clumsy.' },
    ],
  },
  {
    id: 'trade-learning', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'Any fact, explanation, or how-to is instantly available from AI. Why hold knowledge in your own head at all when retrieval is free?',
    prompt: 'What’s worth still learning yourself?',
    options: [
      { id: 'a', text: 'Stop learning — just look everything up when you need it.', score: 25, rationale: 'Retrieved knowledge isn’t understanding. With nothing in your head you can’t connect ideas, spot what’s wrong, or think in the moment — you can only ever fetch.' },
      { id: 'b', text: 'Look up the trivial, but genuinely learn the things you want to think WITH.', score: 100, rationale: 'Exactly: offload reference facts, but build real understanding in the areas you actually reason in. Internalized knowledge is what lets you judge the answers you fetch.' },
      { id: 'c', text: 'Refuse to look anything up — memorize it all the old way.', score: 55, rationale: 'Honorable, but it wastes a real tool and the attention you’d want for deeper learning. Wisdom is knowing which knowledge to own and which to retrieve.' },
      { id: 'd', text: 'Look everything up, but feel you basically “know” it because you can find it.', score: 30, rationale: 'Access isn’t understanding. Mistaking the search bar for your own mind is how the capacity quietly disappears.' },
    ],
  },
  {
    id: 'trade-creativity', type: 'tradeoff', domain: 'ai_autonomy', title: 'The Trade',
    scenario: 'AI can generate ideas, drafts, designs, and solutions on demand — often more polished than your own first attempts.',
    prompt: 'What’s the wise trade?',
    options: [
      { id: 'a', text: 'Let it generate everything — the output is better and faster.', score: 25, rationale: 'For throwaway work, fine. But making things is how you develop taste and a voice; hand over all of it and you become an editor of the machine’s ideas, not a source of your own.' },
      { id: 'b', text: 'Use it to explore and pressure-test, but originate the ideas that matter to you yourself.', score: 100, rationale: 'The balance: let it widen your options and sharpen drafts while you keep doing the generative work that forms your taste. Heavy use of the tool, ownership of the voice.' },
      { id: 'c', text: 'Refuse to use it for any creative work.', score: 55, rationale: 'Keeps your voice unmixed but forfeits a genuine collaborator. The point isn’t avoiding the tool; it’s staying the source.' },
      { id: 'd', text: 'Let it create everything, then tweak the output so it feels like yours.', score: 30, rationale: 'Polishing someone else’s ideas isn’t having your own. The muscle of originating atrophies, dressed up as authorship.' },
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
  {
    id: 'vig-apology', type: 'vignette', domain: 'communication', title: 'The Repair',
    scenario: 'You said something careless that clearly wounded someone you love — you can see it in how they’ve gone distant. You finally sit down across from them.',
    prompt: 'What do you say to begin to make it right? Say it out loud.',
  },
  {
    id: 'vig-grief', type: 'vignette', domain: 'communication', title: 'No Right Words',
    scenario: 'A coworker just lost a parent and is back at their desk, hollow-eyed. You stop by. There are no right words, and you both know it.',
    prompt: 'What do you say to them? Speak it as you actually would.',
  },
  {
    id: 'vig-boundary', type: 'vignette', domain: 'communication', title: 'Letting It Slide',
    scenario: 'A friend keeps showing up late, cancelling last-minute, leaning on you — and you’ve let it slide for months. Today it happened again, and they’re acting like it’s nothing.',
    prompt: 'What do you say to them about it? Say it the way you really would.',
  },
  {
    id: 'vig-elder', type: 'vignette', domain: 'communication', title: 'The Keys',
    scenario: 'Your aging father insists he’s still fine to drive, though everyone can see he isn’t. He’s proud, and the keys are his last bit of independence. He looks at you, daring you to argue.',
    prompt: 'What do you say to him? Speak it out loud.',
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
    // STEM (MacCann & Roberts 2008): self-emotion; keyed to consensus effectiveness — going to the
    // fixable source > reframing > distraction-avoidance > suppression (forma-researcher-vetted v182).
    id: 'stem-friend-distance', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'A close friend has been short with you and slow to reply for a couple of weeks, and you have no idea why. You feel hurt and a little anxious.',
    prompt: 'What’s the most effective way to handle what you’re feeling?',
    options: [
      { id: 'a', text: 'Gently ask the friend directly whether something is wrong between you.', score: 100, rationale: 'The cause is unclear but fixable, so going to the source can resolve both the feeling and the actual problem — the most effective move here.' },
      { id: 'b', text: 'Remind yourself there may be an innocent explanation you can’t see yet, and stay open.', score: 70, rationale: 'Reframing eases the hurt and keeps you steady, but it leaves the real question unanswered — solid rather than complete.' },
      { id: 'c', text: 'Give them space and throw yourself into other things until it blows over.', score: 40, rationale: 'Distraction lowers the sting short-term, but avoiding it lets the worry and the rift quietly grow.' },
      { id: 'd', text: 'Act normal and bury the hurt so it doesn’t show.', score: 15, rationale: 'Pushing the feeling down (suppression) tends to keep it around and adds strain, without touching the cause.' },
    ],
  },
  {
    // STEM: frustration after a self-caused, still-controllable setback → re-engage control (reappraisal/
    // learning) > acceptance > venting > rumination (forma-researcher-vetted v182).
    id: 'stem-mistake-replay', type: 'stem', domain: 'emotion_regulation', title: 'Managing the Moment',
    scenario: 'You sent an important message with an obvious error after rushing it, and now you keep replaying the moment. You feel frustrated with yourself.',
    prompt: 'What’s the most effective way to handle the frustration?',
    options: [
      { id: 'a', text: 'Note the one thing that would prevent it next time, then turn back to what you can still do now.', score: 100, rationale: 'Turning the slip into a concrete lesson restores your sense of control — which is what frustration is really asking for.' },
      { id: 'b', text: 'Remind yourself everyone makes mistakes, and let it be without forcing it away.', score: 65, rationale: 'Accepting the feeling calms it and stops the spiral, though it doesn’t yet convert the error into anything useful.' },
      { id: 'c', text: 'Text a friend to vent about how annoyed you are at yourself.', score: 35, rationale: 'Venting feels like release but usually keeps the irritation warm rather than settling it.' },
      { id: 'd', text: 'Keep going over exactly how you let it happen until it stops bothering you.', score: 10, rationale: 'Replaying it (rumination) reliably deepens and prolongs the bad feeling instead of resolving it.' },
    ],
  },
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
      { id: 'b', text: 'Pour herself into constant busyness so she never has to sit with it.', score: 35, rationale: 'Sustained busyness built to avoid the feeling is experiential avoidance — the disappointment waits, unmetabolized, and the strategy itself keeps her from ever moving through it.' },
      { id: 'c', text: 'Tell herself it didn’t matter and she never really wanted it.', score: 40, rationale: 'Minimizing protects you for an hour and invalidates a real desire — but a single dismissive thought is more recoverable than a whole life arranged to never feel the loss.' },
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
    // Communication (Gottman validation / soft-start-up evidence): validating the feeling FIRST > advice
    // > minimizing > defending-the-other-side (which predicts escalation). forma-researcher-vetted v182.
    id: 'comm-overwhelmed', type: 'comm', domain: 'communication', title: 'The Effective Word',
    scenario: 'Your partner comes home and unloads about a stressful, unfair day at work. They’re tense and clearly wound up.',
    prompt: 'What’s the most effective thing to say first?',
    options: [
      { id: 'a', text: '“That sounds genuinely draining — no wonder you’re wound up.”', score: 100, rationale: 'Naming and validating what they feel signals you actually heard them, which calms tension before anything else can land.' },
      { id: 'b', text: '“Here’s what I’d do about your boss…”', score: 45, rationale: 'Jumping to advice can help later, but offered first it skips the part they came home for: being understood.' },
      { id: 'c', text: '“At least it’s over now — try not to let it get to you.”', score: 20, rationale: 'Looking on the bright side this early reads as minimizing, and tends to make a person feel unheard.' },
      { id: 'd', text: '“It probably wasn’t as unfair as it felt.”', score: 10, rationale: 'Correcting their read of the day while they’re still upset feels like taking the other side, and usually escalates things.' },
    ],
  },
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
      { id: 'c', text: 'Give them total space and stay on your phone in the other room.', score: 25, rationale: 'Space can be respect — but here it reads as absence. Presence is being available, not merely out of the way; withdrawing to a screen is further from it than an engaged-but-clumsy miss.' },
      { id: 'd', text: 'Try to cheer them up with jokes and distraction.', score: 35, rationale: 'Deflecting the mood meets them where you’d prefer them to be — a clumsy miss, but still engaged and turned toward them. Sometimes the kindest thing is to let the heaviness simply be witnessed.' },
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
  {
    // Adds a RESTRAINT register the bank lacked: here unhurried, undemanding space
    // IS the keyed-best presence, not a distractor — so being-present can't be gamed
    // as "always draw the feeling out."
    id: 'presence-grief-silence', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'At a wake, you sit beside someone whose parent has just died. They say almost nothing and don’t seem to want to talk.',
    prompt: 'What’s the most present response?',
    options: [
      { id: 'a', text: 'Stay beside them in the quiet, matching their pace, present without needing them to speak.', score: 100, rationale: 'Presence isn’t conversation — it’s company. Sitting with someone in silence, asking nothing of them, is often the fullest form of being-with; the steady, undemanding company is the gift.' },
      { id: 'b', text: 'Gently invite them to talk about their parent so they don’t hold it in.', score: 45, rationale: 'Kindly meant, and sometimes right — but here it sets your agenda for the grief. Drawing them out can serve your wish to help more than their need to simply be accompanied.' },
      { id: 'c', text: 'Fill the silence with warm memories and stories so it doesn’t feel heavy.', score: 30, rationale: 'Talking to ease the quiet manages your own discomfort with it. The heaviness doesn’t need to be covered — it needs to be shared, and silence shared is not empty.' },
      { id: 'd', text: 'Quietly excuse yourself so as not to intrude on a private moment.', score: 25, rationale: 'Framed as respect, but it leaves them alone at the hardest point. Presence means tolerating the awkwardness of staying rather than relieving it by leaving.' },
    ],
  },
  {
    // Adds a GROUP / divided-attention context absent from the bank (all others are
    // dyadic): presence as choosing one person over the ambient buzz.
    id: 'presence-group-aside', type: 'attend', domain: 'presence', title: 'Fully Here',
    scenario: 'At a lively gathering, one guest quietly mentions to you that they’ve been struggling lately — while the conversation around you keeps going.',
    prompt: 'What’s the most present response?',
    options: [
      { id: 'a', text: 'Turn fully toward them, lower your voice, and let the room carry on without you for a moment.', score: 100, rationale: 'Presence is choosing one person over the buzz. Visibly giving them your whole attention — even briefly — tells them what they said landed and mattered, more than any words.' },
      { id: 'b', text: 'Say you really want to hear it and suggest you find a better time to talk properly.', score: 50, rationale: 'Not wrong — protecting the conversation for later can be caring. But deferring in the moment they reached out can read as a postponement of them; a brief real turn now usually matters more than a perfect setting later.' },
      { id: 'c', text: 'Acknowledge it warmly but keep one ear on the group so no one feels left out.', score: 45, rationale: 'Considerate of the room, but divided attention is felt. In the moment someone risks opening up, half-presence quietly signals they’re not quite worth the full turn.' },
      { id: 'd', text: 'Lighten it with a quick reassurance and fold them back into the group fun.', score: 25, rationale: 'Steering them back to the party erases what they just trusted you with. It meets them where you’d prefer them to be, not where they are.' },
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
    // STEU (Roseman appraisal theory): a feared outcome that resolves favorably and was NOT self-caused
    // yields RELIEF — distinct from pride (self-caused success) and gratitude (other-caused benefit).
    // forma-researcher-vetted v182.
    id: 'steu-relief', type: 'steu', domain: 'emotion_regulation', title: 'Name the Feeling',
    scenario: 'A coworker was braced for bad news about a review they were sure had gone poorly. Word comes back that it actually passed fine. They let out a long breath and go quiet.',
    prompt: 'What are they most likely feeling?',
    options: [
      { id: 'a', text: 'Relief', score: 100, rationale: 'A dreaded outcome that turned out okay produces relief — the long breath and the quiet are its classic signs.' },
      { id: 'b', text: 'Happiness', score: 55, rationale: 'They’re glad, yes, but plain happiness misses the specific weight-lifting-off quality of escaping a feared result.' },
      { id: 'c', text: 'Pride', score: 45, rationale: 'Pride fits a success they credit to themselves; here the good news landed despite their fear, so relief comes first.' },
      { id: 'd', text: 'Gratitude', score: 25, rationale: 'Gratitude needs someone to thank; nothing here points to another person rescuing them, so it fits least.' },
    ],
  },
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
    scenario: 'Priya did something that hurt a friend, and she knows it was her own doing — she crossed a line she believes in.',
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
