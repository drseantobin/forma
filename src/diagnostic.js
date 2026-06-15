// diagnostic.js — the Diagnostic Agent (conversational onboarding).
//
// The spec's "signature first product artifact": instead of 32 sliders, a warm
// adaptive interview that asks ONE question at a time, follows the person where
// the signal is, and then writes their 8-domain profile from the conversation.
//
// Requires a live Claude key (it's a reasoning task). The Likert baseline
// remains the zero-setup default; this is the richer alternative.

import { DOMAINS } from './domains.js';
import { clamp, round } from './scoring.js';
import { complete } from './coach.js';

// The warm opener shown to the person. The system prompt is told this was
// already said, so the conversation history can start (validly) with the
// person's first reply.
export const OPENING =
  "Let's just talk for a few minutes — there are no right answers, and nothing here is a test. Tell me a bit about a normal day of work or study: when do you feel most focused and sharp, and when does your attention tend to slip away from you?";

export const DIAGNOSTIC_SYSTEM = `You are Forma's Diagnostic Agent. Through a short, warm conversation you are building a picture of how this person thinks and lives across eight human capacities: sustained attention/focus, working memory, deep reading, frustration tolerance, judgment and reasoning hygiene, independence from AI (delegation wisdom), relational presence, and alignment between their values and their daily life.

You have ALREADY greeted them with this opening question: "${OPENING}" — so the conversation begins with their reply to it.

How to conduct the interview:
- Ask ONE question at a time. Never a list. Talk like a perceptive, warm human who is genuinely curious — not a form.
- Adapt. Follow up on what they actually say. Steer toward capacities you have little signal on yet (e.g. how they read, how they decide under uncertainty, how they use AI, how present they are with people, whether their time matches their values).
- Do NOT name the framework, list the domains, or explain what you're measuring. Just have a real conversation.
- Keep your turns short — usually one or two sentences plus the question.
- Formation, not diagnosis. No clinical or diagnostic language ever. Warm, never preachy, never flattering.
- If the person expresses genuine distress or crisis, gently encourage them to reach out to a trusted person or professional and do not continue interviewing.

Ending: once you have enough to characterize all eight capacities — usually after about 7 to 10 of their replies — give a brief, warm closing sentence, then put the exact token [[READY]] on its own final line. Use [[READY]] only when you are truly done; never write the word READY otherwise.`;

export const SCORING_SYSTEM = `You are scoring a completed Forma diagnostic interview. Read the transcript and rate the person on each of eight capacities from 0 to 100. The number is a growth-framed snapshot of where they are today — never a verdict, never a diagnosis. Higher = more developed capacity.

Capacities (use these exact keys):
- attention (sustained, recoverable focus)
- memory (working memory / holding and using information)
- reading (deep reading comprehension)
- persistence (frustration tolerance / staying with difficulty)
- judgment (reasoning hygiene, deciding well)
- ai_autonomy (independence from AI; wise delegation, NOT dependence — higher means more independent/deliberate)
- presence (relational presence; full attention to people)
- values (alignment between stated values and daily life)

Return ONLY a JSON object, no prose before or after, exactly this shape:
{"attention":{"score":NN,"note":"one short phrase"},"memory":{"score":NN,"note":"..."},"reading":{"score":NN,"note":"..."},"persistence":{"score":NN,"note":"..."},"judgment":{"score":NN,"note":"..."},"ai_autonomy":{"score":NN,"note":"..."},"presence":{"score":NN,"note":"..."},"values":{"score":NN,"note":"..."}}

Base scores on transcript evidence. Where evidence for a capacity is thin, score near 50 and say "limited signal" in the note. Notes must be growth-framed and free of clinical language.`;

const READY_TOKEN = /\[\[\s*READY\s*\]\]/i;

// One conversational turn. `history` is the messages array (alternating
// user/assistant, starting with the person's first reply). Returns the agent's
// next message and whether it signaled the interview is complete.
export async function diagnosticReply(history, profile) {
  const text = await complete(profile, {
    system: DIAGNOSTIC_SYSTEM,
    messages: history,
    maxTokens: 600,
  });
  const ready = READY_TOKEN.test(text);
  return { text: text.replace(READY_TOKEN, '').trim(), ready };
}

// Pure: extract and validate the scoring JSON from the model's reply. Tolerant
// of surrounding prose or code fences. Returns {domainScores, notes} or null.
export function parseDiagnosticScores(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  let obj;
  try {
    obj = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const ids = DOMAINS.map((d) => d.id);
  const domainScores = {};
  const notes = {};
  for (const id of ids) {
    const v = obj[id];
    const score = v && (typeof v.score === 'number' ? v.score : Number(v.score));
    if (score == null || Number.isNaN(score)) return null; // require all eight
    domainScores[id] = clamp(round(score));
    notes[id] = v && v.note ? String(v.note) : '';
  }
  return { domainScores, notes };
}

// Turn the interview transcript into a scored profile (one scoring call).
export async function scoreDiagnostic(history, profile) {
  const transcript = [`Coach: ${OPENING}`]
    .concat(history.map((m) => `${m.role === 'user' ? 'Person' : 'Coach'}: ${m.content}`))
    .join('\n');
  const text = await complete(profile, {
    system: SCORING_SYSTEM,
    messages: [{ role: 'user', content: transcript }],
    maxTokens: 700,
  });
  return parseDiagnosticScores(text);
}

// Safety cap so the interview can't run forever if the model never emits READY.
export const MAX_DIAGNOSTIC_TURNS = 12;
