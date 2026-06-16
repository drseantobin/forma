// exercises.js — the daily formation exercise library.
//
// The daily loop draws one exercise, calibrated to the user's current growth
// focus. Four exercise families map to the eight domains:
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
    case 'persistence':
    case 'ai_autonomy':
    case 'presence':
    case 'communication':
    case 'emotion_regulation':
    case 'values':
      return notSeen(REFLECTIONS.filter((r) => r.domain === targetDomain));
    case 'interior':
      return notSeen(INTERIOR_REFLECTIONS);
    default:
      return notSeen(READING);
  }
}
