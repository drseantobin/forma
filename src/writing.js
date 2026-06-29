// writing.js — lightweight, dependency-free text-style features used to keep AI-judged reflection
// scores from rewarding VERBAL FLUENCY / eloquent abstraction over concrete lived evidence. This is the
// unanimous weakest link the external panel (ChatGPT/Gemini/Grok/GLM-5.2) AND Codex flagged: an
// articulate person can write a "Thriving" answer while being detached in real life. PURE, no DOM, no
// deps — auditable dictionaries. The AI judge + the strengthened prompt do the main work; the cap here
// is an honesty backstop so abstraction-without-evidence can't reach the top bands on its own.
// English-only heuristic (flagged in styleNote when the text looks non-English).

// Abstract / "therapy-speak" terms that often substitute for concrete evidence of a capacity.
const ABSTRACT_WORDS = [
  'growth', 'journey', 'authentic', 'holistic', 'mindful', 'intentional', 'awareness', 'self-aware',
  'consciousness', 'alignment', 'resonate', 'vulnerability', 'boundaries', 'honor', 'embrace',
  'lean into', 'show up', 'grounded', 'centered', 'balance', 'transform', 'empower', 'intention',
  'gratitude', 'abundance', 'manifest', 'healing', 'triggered', 'validate', 'hold space', 'sit with',
  'navigate', 'unpack', 'integrate', 'attunement', 'regulate', 'nervous system', 'presence', 'spectrum',
];
// Markers of concrete, real-life specifics: a time, a person, a named action/verb, a causal "because",
// or (for produced vignette responses) a direct "I would say/ask" move. Broadened per Codex review so
// the cap doesn't false-positive on plain, evidenced answers.
const CONCRETE_MARKERS = /\b(yesterday|today|this morning|tonight|last night|last week|because|so i|then i|i said|i told|i asked|i wrote|i called|i texted|i sat|i walked|i drove|i listened|i waited|i paused|i apologi[sz]ed|i noticed|i felt|i chose|i stayed|i put|i stopped|i named|i let|i would (say|ask|tell|respond|acknowledge)|i'?d (say|ask|tell)|my (boss|wife|husband|son|daughter|mom|dad|mother|father|friend|kid|brother|sister|team|coworker|client|car|phone|email|desk|meeting))\b/gi;
const TIME_NUM = /\b(\d+\s?(min|mins|minutes|hour|hours|am|pm|times)|at \d)\b/gi;

function words(text) { return (String(text || '').match(/[A-Za-z'’-]+/g) || []); }
function sentences(text) { return String(text || '').split(/[.!?]+/).map((s) => s.trim()).filter(Boolean); }

export function writingFeatures(text) {
  const t = String(text || '');
  const lower = t.toLowerCase();
  const ws = words(t);
  const ss = sentences(t);
  const wc = ws.length;
  const abstractHits = ABSTRACT_WORDS.reduce((n, w) => n + (lower.split(w).length - 1), 0);
  const concreteHits = (t.match(CONCRETE_MARKERS) || []).length + (t.match(TIME_NUM) || []).length;
  const firstPerson = (lower.match(/\b(i|i'm|i've|i'll|my|me|myself)\b/g) || []).length;
  const charCount = ws.join('').length;
  // English-only heuristic flag: meaningful non-ASCII share → the dictionaries don't apply, so the
  // cap is suppressed and styleNote tells the judge not to read low counts as absence of evidence.
  const nonAscii = t.length > 0 && (t.match(/[^\x00-\x7F]/g) || []).length > Math.max(3, t.length * 0.1);
  return {
    wordCount: wc,
    sentenceCount: ss.length,
    avgSentenceLen: ss.length ? Math.round((wc / ss.length) * 10) / 10 : 0,
    avgWordLen: wc ? Math.round((charCount / wc) * 10) / 10 : 0,
    abstractHits,
    concreteHits,
    firstPerson,
    abstractDensity: wc ? Math.round((abstractHits / wc) * 1000) / 10 : 0, // abstract words per 100 words
    nonAscii,
  };
}

// Max score a response may earn given its style (never raises a score). High abstraction with no/near-no
// concrete lived evidence = talking ABOUT a capacity, not evidencing it → can't reach the top bands on
// eloquence alone. Conservative + LENGTH-GATED (per Codex) so a short, plain, concrete answer is never
// penalised — the second rule only fires on longer texts with heavy abstraction and thin evidence.
// Suppressed entirely for non-English text (heuristic doesn't apply). Returns 100 = no cap.
export function fluencyCap(features) {
  const f = features;
  if (!f || !f.wordCount || f.nonAscii) return 100;
  if (f.abstractHits >= 3 && f.concreteHits === 0) return 59;                         // pure abstraction, zero evidence
  if (f.wordCount >= 30 && f.abstractHits >= 4 && f.concreteHits <= 1) return 69;     // long + heavy abstraction, thin evidence
  return 100;
}

// A compact style line for the AI judge prompt — tells the model what the response actually contains,
// so it grounds its placement in evidence rather than polish.
export function styleNote(features) {
  const f = features || {};
  const caveat = f.nonAscii ? ' (English-only heuristic — do NOT treat low counts as absence of evidence here.)' : '';
  return `Style profile: ${f.wordCount || 0} words, ${f.concreteHits || 0} concrete real-life detail(s) (a time, person, named action, or "because"), ${f.abstractHits || 0} abstract/therapy term(s).${caveat} Ground the score in concrete lived evidence — elevated vocabulary or abstraction must NOT stand in for it.`;
}
