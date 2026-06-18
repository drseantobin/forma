// src/svt.js — Sentence Verification Technique (Royer, Hastings & Hook 1979): a DEEP-READING
// comprehension measure scored by signal detection. Read a short passage; it's removed; then judge
// test sentences one at a time as "means the same as something I read" (YES) or not (NO). Four item
// types per passage: ORIGINAL + PARAPHRASE are same-meaning (correct = YES); MEANING-CHANGE +
// DISTRACTOR are changed-meaning (correct = NO). d′ isolates meaning-discrimination from the bias to
// just say YES (criterion c). Pure, no DOM. Reuses signalDetection from overclaiming.js (same SDT math).
//
// Improvement over Forma's current reading (Maze/cloze + inference MCQ): those conflate comprehension
// with test strategy / word prediction and never separate sensitivity from response bias. SVT does.

import { signalDetection } from './overclaiming.js';

// Per-class floor for a defensible POOLED d′ (~16 same AND ~16 changed ≈ 4 passages). Below it,
// d′ is "accumulating" and we report proportion-correct, which is stable from one or two passages.
export const SVT_DPRIME_MIN_PER_CLASS = 16;
export const SVT_MIN_ITEMS = 6; // floor to report anything at all

// Bank — forma-researcher-vetted (2026-06-17): every classification checked. same = ORIGINAL|PARAPHRASE.
export const SVT_BANK = [
  {
    id: 'desert',
    title: 'How a desert gains and loses heat',
    text: "Deserts are known for extreme temperatures, but the most striking feature is how sharply the heat changes between day and night. During the day, the dry air and bare ground absorb sunlight quickly, and the surface can grow hotter than soil in wetter regions. Because there is little moisture in the air, almost no heat is trapped near the ground. After sunset, that stored heat escapes rapidly into the open sky, and the temperature can fall by more than thirty degrees within a few hours. Plants and animals living in deserts must cope with this swing. Many animals stay underground during the day and become active only at night, when the surface has cooled. Some plants store water in thick stems, allowing them to survive long stretches without rain. These adaptations let life persist in a place of constant temperature change.",
    items: [
      { text: "After sunset, that stored heat escapes rapidly into the open sky.", type: 'original', same: true },
      { text: "Some plants store water in thick stems, allowing them to survive long stretches without rain.", type: 'original', same: true },
      { text: "Many desert animals shelter below the surface in the daytime and come out to forage after dark.", type: 'paraphrase', same: true },
      { text: "Because the air holds so little moisture, hardly any heat is retained close to the surface.", type: 'paraphrase', same: true },
      { text: "Because the desert air is full of moisture, most of the day's heat stays trapped near the ground.", type: 'meaning-change', same: false },
      { text: "After sunset the temperature can fall by less than three degrees over several hours.", type: 'meaning-change', same: false },
      { text: "Desert sand often contains valuable minerals that miners search for.", type: 'distractor', same: false },
      { text: "Most deserts receive their small amount of rainfall during the winter months.", type: 'distractor', same: false },
    ],
  },
  {
    id: 'paper',
    title: 'How paper is made from wood',
    text: "Most paper begins as wood, which is made largely of tiny fibers held together by a natural glue called lignin. To turn wood into paper, the wood is first cut into small chips. These chips are then cooked with chemicals that dissolve the lignin and free the individual fibers. What remains is a wet, soupy mixture of loose fibers and water known as pulp. The pulp is spread in a thin layer onto a moving screen, which lets the water drain away while the fibers settle and begin to link together. The damp sheet is then pressed and passed over heated rollers that dry it completely. As the fibers bond, they form a flat, continuous surface. Manufacturers can add fine clays or dyes to the pulp to make the paper smoother, brighter, or coloured before it is dried.",
    items: [
      { text: "These chips are then cooked with chemicals that dissolve the lignin and free the individual fibers.", type: 'original', same: true },
      { text: "The pulp is spread in a thin layer onto a moving screen, which lets the water drain away.", type: 'original', same: true },
      { text: "Wood is mostly built from small fibers bound together by a natural adhesive known as lignin.", type: 'paraphrase', same: true },
      { text: "To finish the sheet, it is squeezed and then run across hot rollers until it is fully dry.", type: 'paraphrase', same: true },
      { text: "The chips are cooked with chemicals that strengthen the lignin so the fibers stay tightly bound.", type: 'meaning-change', same: false },
      { text: "The pulp is laid onto a screen that holds in the water while the fibers float apart.", type: 'meaning-change', same: false },
      { text: "Recycled paper is collected and reused to reduce the number of trees that are cut down.", type: 'distractor', same: false },
      { text: "The first paper was invented in ancient China about two thousand years ago.", type: 'distractor', same: false },
    ],
  },
];

// trials: [{ same:boolean (is it a same-meaning item), yes:boolean (did the user say "same") }].
// HIT = YES to a same-meaning item; FALSE ALARM = YES to a changed-meaning item.
export function svtScore(trials) {
  const list = (Array.isArray(trials) ? trials : []).filter((t) => t && typeof t.same === 'boolean' && typeof t.yes === 'boolean');
  const total = list.length;
  let hits = 0, fa = 0, nSame = 0, nChanged = 0, correct = 0;
  for (const t of list) {
    if (t.same) { nSame += 1; if (t.yes) { hits += 1; correct += 1; } }
    else { nChanged += 1; if (t.yes) fa += 1; else correct += 1; }
  }
  if (total < SVT_MIN_ITEMS) return { total, nSame, nChanged, hits, fa, correct, ready: false };
  const sd = signalDetection(hits, nSame, fa, nChanged); // loglinear-corrected d′ + bias-c
  return {
    total, nSame, nChanged, hits, fa, correct, ready: true,
    proportionCorrect: correct / total,
    dPrime: sd.dPrime,
    criterion: sd.biasC,
    dPrimeReady: nSame >= SVT_DPRIME_MIN_PER_CLASS && nChanged >= SVT_DPRIME_MIN_PER_CLASS,
  };
}

export const SVT_CAVEATS = [
  'This measures comprehension fidelity — whether you took in what the text actually said, and can reject reworded contradictions and plausible things it never stated.',
  'It deliberately does not measure higher-order inference (reading “deeply” in the interpretive sense). A high score means you read accurately, not that you read between the lines.',
  'Scores can rise partly from getting used to the task — that is practice, not only growth.',
];

// Directional reading on proportion-correct (stable from one or two passages); d′ is surfaced as
// "accumulating" until the pooled per-class floor is met. Criterion is a gentle bias note, not a score.
export function svtReading(score) {
  if (!score || !score.ready) return { level: 'not-ready', note: 'A few more sentences and there’s enough to read — fewer is too little to be honest about.' };
  const pc = Math.round(score.proportionCorrect * 100);
  let biasNote = '';
  if (score.criterion <= -0.5) biasNote = ' You leaned toward saying “yes” — worth checking a sentence truly matches before agreeing.';
  else if (score.criterion >= 0.5) biasNote = ' You were cautious about agreeing — a careful reader’s stance.';
  const dLine = score.dPrimeReady ? '' : ' Your meaning-discrimination score (d′) keeps sharpening as you read more passages.';
  const level = pc >= 80 ? 'sharp' : (pc >= 60 ? 'solid' : 'building');
  return { level, note: `You read with ${pc}% accuracy — telling true restatements from reworded contradictions and plausible additions.${biasNote}${dLine}` };
}
