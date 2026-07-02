// src/overclaiming.js — the Over-Claiming Technique (Paulhus, Harms, Bruce & Lysy 2003).
//
// A SELF-MASKING measure: the person rates how familiar they are with a list of items;
// some are REAL and ~25% are plausible-sounding FOILS that do not exist. Claiming the
// foils is self-enhancement — and because the rater can't tell reals from foils, answering
// "I know everything" directly self-incriminates by inflating false alarms. The bias index
// holds even when people are warned about foils or told to fake good, which is what makes it
// uniquely faking-resistant and a fitting fit for Forma's obscured-measurement directive.
//
// Fully LOCAL, no pooled data (the foils are known by construction). Pure, no DOM.
// Reported as: bias-c (the robust self-enhancement / epistemic-humility signal — more
// negative = more readily claims familiarity) and d′ (a WEAK ability proxy, hedged: with a
// small bank, accuracy is noisy and confounded with genuine domain knowledge).
//
// Item bank vetted by the forma-researcher agent (2026-06-17): every foil was web-checked to
// confirm it has no real referent. AI buzzword-style foils are risky (compositional phrases
// usually map onto a real paper) — re-verify before adding any.

export const OVERCLAIM_BANK = {
  ai: {
    label: 'AI literacy',
    real: [
      'Retrieval-augmented generation', 'Transformer', 'RLHF', 'Vector database',
      'Mixture of experts', 'Chain-of-thought prompting', 'Constitutional AI',
      'Diffusion model', 'Fine-tuning', 'Token',
    ],
    foil: ['Halcyon prompting', 'Meridian embeddings', 'Cascade-2 transformer', 'Anchored latent distillation'],
  },
  thinkers: {
    label: 'Thinkers & frameworks',
    real: [
      'Daniel Kahneman', 'Stoicism', 'Deliberate practice', 'Cognitive behavioral therapy',
      'Growth mindset', 'Flow', 'Marcus Aurelius', "Aristotle's virtue ethics",
    ],
    foil: ["Renshaw's theory of attention", 'The Calloway Inventory', 'Deliberative attunement'],
  },
};

// Inverse standard-normal CDF (probit) — Acklam's rational approximation, |abs error| < 1.15e-9.
// Needed for the signal-detection z-transform; jsc has no native erfinv.
export function probit(p) {
  if (!(p > 0)) return -Infinity;
  if (!(p < 1)) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const plow = 0.02425, phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  if (p <= phigh) {
    q = p - 0.5; r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}

// Signal detection with the loglinear correction (Hautus 1995): +0.5 to each cell, +1 to each
// denominator BEFORE the z-transform — handles 0/1 rates and is preferable to the edge-only
// correction with the small foil counts Forma has. d′ = z(hit) − z(fa); c = −0.5·(z(hit)+z(fa)).
export function signalDetection(claimedReal, totalReal, claimedFoil, totalFoil) {
  const hitRate = (claimedReal + 0.5) / (totalReal + 1);
  const faRate = (claimedFoil + 0.5) / (totalFoil + 1);
  const zh = probit(hitRate), zf = probit(faRate);
  return { hitRate, faRate, dPrime: zh - zf, biasC: -0.5 * (zh + zf) };
}

// Normalize "what did they claim familiarity with" into a Set of item strings.
// Accepts: a Set, an array of claimed strings, or an object { item: truthy }.
function claimsToSet(claims) {
  if (claims instanceof Set) return claims;
  if (Array.isArray(claims)) return new Set(claims);
  if (claims && typeof claims === 'object') return new Set(Object.keys(claims).filter((k) => claims[k]));
  return new Set();
}

export function overclaimScore(claims, bank) {
  const claimed = claimsToSet(claims);
  const real = (bank && bank.real) || [];
  const foil = (bank && bank.foil) || [];
  const cR = real.filter((x) => claimed.has(x)).length;
  const cF = foil.filter((x) => claimed.has(x)).length;
  return { ...signalDetection(cR, real.length, cF, foil.length), claimedReal: cR, totalReal: real.length, claimedFoil: cF, totalFoil: foil.length };
}

// POOL across categories before computing c — with only ~3-4 foils per category the false-alarm
// rate is coarse (each foil moves it a lot), so the pooled estimate is the one to trust/report.
export function overclaimPooled(claims, banks = OVERCLAIM_BANK) {
  const claimed = claimsToSet(claims);
  let cR = 0, tR = 0, cF = 0, tF = 0;
  Object.keys(banks).forEach((k) => {
    const b = banks[k], real = b.real || [], foil = b.foil || [];
    cR += real.filter((x) => claimed.has(x)).length; tR += real.length;
    cF += foil.filter((x) => claimed.has(x)).length; tF += foil.length;
  });
  return { ...signalDetection(cR, tR, cF, tF), claimedReal: cR, totalReal: tR, claimedFoil: cF, totalFoil: tF };
}

// Honest, growth-framed, DIRECTIONAL reading of the bias index (never a verdict). More negative
// c = more readily claims familiarity (incl. with things that don't exist). Not a deficit — a
// gentle mirror toward intellectual humility, Forma's "engagement over performance" ethos.
// VALIDITY (v339, found by running the tool): biasC alone conflates "claims few things overall"
// with "claims carefully" — someone who ticks only five items but includes a FOIL still computes
// a conservative c, and was being told they were "careful about what they claimed to know" while
// having claimed something that doesn't exist. The reading now takes claimedFoil so the cautious
// note can't assert a falsehood; the tone stays gentle (the foil is a noticing, not a fault).
export function selfEnhancementReading(biasC, claimedFoil = 0) {
  if (typeof biasC !== 'number' || !isFinite(biasC)) return { level: 'unknown', note: 'Not enough to read yet.' };
  if (biasC <= -0.6) return { level: 'claims-broadly', note: 'You leaned toward claiming familiarity widely — including with a few things that were made up. Worth noticing where you actually know vs. recognize.' };
  if (biasC >= 0.4) {
    if (claimedFoil > 0) return { level: 'cautious-with-slip', note: `You claimed sparingly — and still, ${claimedFoil === 1 ? 'one of the made-up ones' : 'a few of the made-up ones'} slipped in. That mix is the interesting part: careful in volume, yet nodding at something that doesn’t exist. Worth noticing which familiarity was real.` };
    return { level: 'cautious', note: 'You were careful about what you claimed to know — a sign of intellectual humility.' };
  }
  return { level: 'balanced', note: 'Your familiarity claims tracked what is real reasonably well.' };
}
