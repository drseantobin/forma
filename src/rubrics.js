// rubrics.js — anchored developmental markers ("what health looks like") per capacity, by band.
//
// This is the SCALE an AI judge places a person's written reflection on, so a rating is PRINCIPLED
// (anchored to real construct definitions) rather than a vibe. Each capacity's markers + judge note
// are GROUNDED in cited instruments (see `source`); the band content describes more-vs-less of a
// measured construct, dressed as developmental levels.
//
// HONEST BOUNDS (forma-researcher + forma-validity, v323): every source instrument was validated as a
// continuous score, NOT as a discrete 4-stage ladder. So the 0–39/40–59/60–79/80–100 band cut points
// are a FORMA PRESENTATION CONVENTION, not a validated stage taxonomy. `ordered:true` flags the
// capacities whose source scale IS a genuinely ordered model (SDT continuum / Carkhuff levels);
// `ordered:false` flags the ones where the bands are a quantity presented as levels (say so, don't
// overclaim). The honest public claim is RUBRIC_CLAIM below — "rates the quality of a written
// reflection against research-derived markers," never "measures the trait."
//
// Markers are growth-framed (every band a real place on a path, never a deficit label). Only the
// written/qualitative capacities need markers; objective performance measures are scored from the task.

export const BAND_KEYS = ['emerging', 'developing', 'strong', 'thriving'];
export const BAND_LABELS = { emerging: 'Emerging', developing: 'Developing', strong: 'Strong', thriving: 'Thriving' };

// The one honest claim Forma may make about an AI-rubric-judged reflection score.
export const RUBRIC_CLAIM = 'Rates the developmental quality of your written reflection against research-derived markers of this capacity — it does not diagnose, norm, or measure the trait itself.';

export const CAPACITY_RUBRICS = {
  ai_autonomy: {
    label: 'Agency',
    ordered: true, // SDT autonomy/regulation continuum is a genuinely ordered model
    source: 'Appropriate reliance (Schemmer et al. 2023) + Self-Determination Theory autonomy continuum (Ryan & Deci 2000; Sheldon & Elliot 1999)',
    markers: {
      emerging: 'Reaches for the tool first and adopts its output as the answer — authorship sits outside the self.',
      developing: 'Forms an initial view but abandons it when the tool sounds confident (over-reliance).',
      strong: 'Commits to an own answer first and uses the tool as a check — catches and rejects confident errors, and accepts good help when it is genuinely better.',
      thriving: 'Stays the author throughout — calibrates trust to the task, verifies claims, and knows when not to use the tool at all.',
    },
    judgeNote: 'A reflection can rate STANCE toward reliance, not whether reliance was actually appropriate (that needs ground-truth correctness, which only the behavioral reliance task has). Do not over-credit a stated independence without a concrete instance; the behavioral task stays the primary Agency signal.',
  },
  persistence: {
    label: 'Frustration tolerance',
    ordered: false, // a trait quantity presented as bands — the DTS has no validated stages
    source: 'Distress Tolerance Scale facets — Tolerance/Absorption/Appraisal/Regulation (Simons & Gaher 2005); behavioral latency-to-quit (PASAT-C; Mirror-Tracing, Lejuez et al.)',
    markers: {
      emerging: 'Treats difficulty as intolerable and exits quickly to relieve the discomfort.',
      developing: 'Stays briefly, but distress dominates attention and they bail at the first real wall.',
      strong: 'Sits in the not-knowing, names what is hard rather than escaping it, and stays with the task.',
      thriving: 'Treats difficulty as the work itself — returns and recovers after a setback rather than avoiding it.',
    },
    judgeNote: 'Self-reported staying and actual behavioral persistence correlate only weakly — a reflection cannot certify persistence. Credit a concrete instance of staying, not a general claim of being tough; the behavioral dwell-time on the Stay task stays the primary signal.',
  },
  presence: {
    label: 'Relational presence',
    ordered: true, // Carkhuff's empathy scale is literally an ordered 5-level rating
    source: 'Therapeutic Presence + TPI (Geller & Greenberg 2002; Geller et al. 2010) + Carkhuff (1969) 5-level empathy scale',
    markers: {
      emerging: 'Listens in order to reply — jumps to fixing or advising before the other is understood.',
      developing: 'Notices the urge to fix and sometimes holds it, but attention drifts and reflections stay surface-level.',
      strong: 'Stays with the other person’s reality before responding and reflects it back accurately — the response matches what was actually said and felt.',
      thriving: 'Fully present without rushing to fix; adds depth the other hadn’t quite named, and they feel met.',
    },
    judgeNote: 'This rates the quality of the user’s reflective ACCOUNT of presence, not presence observed in the moment. Credit receptivity and accuracy, not eloquence.',
  },
  values: {
    label: 'Values alignment',
    ordered: true, // SDT regulation continuum (external→intrinsic) is ordered
    source: 'Self-concordance / SDT continuum (Sheldon & Elliot 1999) + Valued Living Questionnaire importance-vs-consistency (Wilson et al. 2010)',
    markers: {
      emerging: 'Days run on default routines and others’ expectations — choices governed by external pressure.',
      developing: 'Can name a value, but it rarely shapes choices; acting on it feels like “should,” not “want.”',
      strong: 'Names what matters and takes a concrete step that reflects it.',
      thriving: 'Choices are visibly authored by values, and the person adjusts course to stay aligned.',
    },
    judgeNote: 'Require a NAMED CONCRETE ACTION taken (not just a stated value) to reach Strong or Thriving — this mirrors the importance-vs-consistency distinction the Valued Living literature insists on.',
  },
  // Used by the vignette (communication) AI judge once wired — ready for the extension.
  communication: {
    label: 'Communication & empathy',
    ordered: true, // Carkhuff responding levels are ordered
    source: 'Interpersonal Reactivity Index — Perspective Taking & Empathic Concern (Davis 1980/1983) + Carkhuff (1969) responding levels',
    markers: {
      emerging: 'Responds from their own frame — misreads or overrides the other’s state; little perspective-taking.',
      developing: 'Registers the other’s feeling but the response is generic or premature; perspective-taking is partial.',
      strong: 'Accurately takes the other’s perspective and responds with fitting concern — the reply lands as understanding.',
      thriving: 'Attunes to what’s unspoken and responds in a way that deepens contact; the other feels accurately understood.',
    },
    judgeNote: 'Rates attuned responding as narrated/produced, not trait empathy. Credit accurate perspective-taking + fitting concern, not cleverness.',
  },
  // Self-knowledge (sentence-completion judge). NOTE: shares the 'values' DOMAIN, so it is looked up
  // by EXERCISE intent, not domain id (wired in the v324 extension). Kept here so the grounding lives
  // in one place. CRITICAL judge nuance below — this is the one capacity where "more is NOT better."
  self_knowledge: {
    label: 'Self-knowledge',
    ordered: false, // RFQ: the adaptive zone is the MIDDLE (humble accuracy), not the maximum
    source: 'Reflective functioning / mentalization — RFQ-8 (Fonagy et al. 2016) + Self-Reflection & Insight Scale (Grant et al. 2002)',
    markers: {
      emerging: 'Little examination, or treats own states as obvious and unquestioned.',
      developing: 'Reflects but stays in the question without arriving at clarity — or over-explains with false certainty.',
      strong: 'Names own states and motives with reasonable accuracy and holds them provisionally — owns a pattern without over-claiming.',
      thriving: 'Accurate, humble self-understanding — sees a pattern, holds the limits of self-knowledge, and uses the insight.',
    },
    judgeNote: 'CRITICAL: do NOT reward fluency or confident self-narration. Rigid certainty about one’s own motives (hypermentalizing) is an impairment, not insight — CAP the score when a reflection shows over-certainty. The healthy zone is moderate certainty held with humility (RFQ). Self-reported insight ≠ actual self-knowledge, which Forma cannot verify.',
  },
};

export function rubricFor(domainId) {
  return CAPACITY_RUBRICS[domainId] || null;
}

// Render the band markers as a compact scale for an AI judging prompt.
export function rubricScaleText(markers) {
  if (!markers) return '';
  return BAND_KEYS
    .filter((b) => markers[b])
    .map((b) => `- ${BAND_LABELS[b]}: ${markers[b]}`)
    .join('\n');
}
