// src/validity.js — response-quality / careless-responding guard (the "validity layer").
//
// Pure, no DOM. The data-hygiene foundation under every self-report measure: it flags a
// likely careless / random / straightlined response set so an invalid run doesn't quietly
// masquerade as signal. CONSERVATIVE BY DESIGN — in a formation app (not a high-stakes test),
// a false alarm on a careful, honest user is the worst outcome, so the bar to call a run
// "suspect" is deliberately high. (Meade & Craig 2012; Niessen et al. 2016; Huang et al. 2012.)
//
// ACTION CONTRACT (decided with the validity reviewer): keep-but-flag, NEVER silently discard
// or down-weight. A suspect run still seeds the scale and still counts as showing up; the only
// coupling (wired in a later increment) is that confidence() caps at 'provisional' while a
// suspect flag rides on the evidence — surfaced honestly, like scaleFreshness, never hidden.

export const LONGSTRING_FLAG = 10; // longest identical RAW run over the full battery (see note)

// LONG-STRING on the RAW button presses (NOT reverse-scored values). Raw is the correct input
// precisely because the battery is MIXED-KEYED: a genuine, careful responder answers forward
// items high and reverse items low, so their raw run breaks at every reverse item — their
// longest raw run stays short (~2-4, e.g. the handful of contiguous forward interior items).
// Only a same-button straightliner ("7 for everything") sustains a long raw run. Running this
// on reverse-SCORED values would INVERT the detection (the careful, consistent user would look
// uniform and get flagged; the straightliner would look alternating and pass) — so the caller
// must pass raw responses. A threshold of 10 over ~44 items is one only a straightliner reaches.
export function longStringIndex(responses) {
  const a = Array.isArray(responses) ? responses : [];
  let best = 0, run = 0, prev;
  for (let i = 0; i < a.length; i++) {
    if (i > 0 && a[i] === prev) run += 1; else run = 1;
    if (run > best) best = run;
    prev = a[i];
  }
  return best;
}

// INFREQUENCY / bogus items: impossible statements almost everyone disagrees with. A SINGLE
// miss is a fat-finger and must NOT flag; only BOTH missed counts (it is its own 2-event signal).
// Phrase them as truly impossible, not merely unusual, so a quirky-but-honest user can't endorse one.
export const INFREQUENCY_ITEMS = [
  { id: 'val_inf_1', prompt: 'I was born on February 30th.' },
  { id: 'val_inf_2', prompt: 'I have never used a phone or a computer in my life.' },
];

// On a 1..7 agree scale, endorsing an impossible item (>= agreeThreshold) is a miss; neutral (4) is not.
export function infrequencyMisses(answers = {}, agreeThreshold = 5) {
  return INFREQUENCY_ITEMS.filter((it) => {
    const v = answers && answers[it.id];
    return typeof v === 'number' && v >= agreeThreshold;
  }).length;
}

// Aggregate verdict over a FULL self-report battery (not a 4-item screen — far too short to judge).
// Conservative combiner: a run is "suspect" only when >= 2 independent signals fire, with one
// carve-out — both bogus items missed is already a 2-event signal and suffices alone. Long-string
// ALONE never suspects (a single straightline signal is weak); it must be corroborated.
//
// TOO-FAST and INSTRUCTED-RESPONSE are intentionally absent for now: Forma captures no per-item
// timing and seeds no instructed item yet, so writing them would be dead code — they land once the
// baseline flow records per-screen timestamps (see research/build-spec-objective-measures.md).
export function responseQuality({ responses = [], answers = {}, longStringFlag = LONGSTRING_FLAG } = {}) {
  const list = Array.isArray(responses) ? responses : [];
  const longString = longStringIndex(list);
  const infMiss = infrequencyMisses(answers);
  const signals = [];
  if (list.length >= longStringFlag && longString >= longStringFlag) signals.push('straightlined');
  if (infMiss >= 2) signals.push('infrequency');
  // both-bogus is a 2-event signal → suspect alone; otherwise require >= 2 distinct signals.
  const suspect = signals.includes('infrequency') || signals.length >= 2;
  return { longString, infrequencyMisses: infMiss, signals, suspect };
}
