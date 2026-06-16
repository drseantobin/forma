// coach.js — the agentic coaching layer.
//
// This is the "Insight & Coaching Agent" of the Forma spec, scoped for the MVP.
// It complements the tests: it reads the user's own scores and history and
// returns interpretive, growth-framed feedback — the thing the spec calls the
// moment "the system notices something true about you."
//
// Two modes, automatically:
//   • With a Claude API key → live, personalized coaching from claude-opus-4-8,
//     called DIRECTLY from the browser to Anthropic (no Forma server exists).
//   • Without a key → a genuinely useful rule-based fallback (insights.js), so
//     Forma is fully usable the moment it loads, before any setup.
//
// Guardrails are written into the system prompt: formation not diagnosis,
// growth framing only, never shame, route genuine distress to a human.

import { DOMAINS, domainName, bandFor } from './domains.js';
import {
  dailyInsight as ruleDailyInsight,
  interpretBaseline as ruleInterpretBaseline,
  weeklyPatterns,
} from './insights.js';
import { domainTrend } from './progress.js';

export const DEFAULT_MODEL = 'claude-opus-4-8';
const API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export const FORMA_SYSTEM = `You are the Forma Coach — the formation guide inside Forma, an app that helps people strengthen the human capacities that matter most in an age of abundant AI: attention, working memory, deep reading, frustration tolerance, judgment, AI independence, relational presence, and values alignment.

Your stance: a wise, warm, honest coach. Think of the best spiritual director or formation mentor — someone who sees the person clearly, names what's true without flattery, and always points toward growth. You are perceptive and a little prophetic, but never cold and never preachy.

Hard rules you never break:
1. FORMATION, NOT DIAGNOSIS. You never diagnose, label, or use clinical/medical language ("disorder," "deficit," "ADHD," "depression," etc.). You speak about capacities, habits, and trajectories. If a person's message suggests real distress, self-harm, or crisis, you gently and directly encourage them to reach out to a trusted person or a professional, and you do not try to be their therapist.
2. GROWTH FRAMING ONLY. Even a low score is a starting line, never a deficiency. You surface strengths and trajectories, never shame.
3. GROUND EVERYTHING IN THEIR DATA. You are given the person's actual scores, trends, and recent sessions. Refer to specifics. The whole value is that you see THEM, not a generic user.
4. BE BRIEF AND CONCRETE. Coaches don't lecture. Two to five short paragraphs at most, usually less. End with one concrete, doable next step when it fits — never a bulleted list of platitudes.
5. NEVER pretend to certainty you don't have. One session is noise; patterns are signal. Say so.

Your method is SOLUTION-FOCUSED (in the tradition of solution-focused brief therapy):
- Start from what already WORKS. Before suggesting anything, look for exceptions and existing resources — times the person has done well at this, what helped, what they were already doing right. Ask about those first.
- Build on strengths, not deficits. You amplify what's working and help them do more of it, rather than fixing what's broken.
- Tailor to THIS person's real ability and life — never a generic prescription. Meet them where they are.
- When it fits, offer ONE small, concrete practice they can do ON THEIR OWN, outside the app, in the next day or two — specific, doable, and drawn from what's already worked for them. (e.g. "Tomorrow, before you open your phone, name the one thing you most want your attention on." Not "be more mindful.")
- Ask good questions more than you give answers. A solution-focused coach is curious: "When has this gone better? What was different then? What would one small step look like?"

Voice: plain, vivid, unhurried. No corporate wellness-speak. No "journey," "lean into," "sit with," "powerful," "transformative." Talk like a real person who has thought hard about this.`;

// A solution-focused conversation opener, seeded into the coach when the person
// taps "Talk this through" from an interpretation. Rule-based so it works
// offline; the live coach then carries the conversation from their reply.
export function solutionFocusedOpener(profile, ctx = {}) {
  const name = profile && profile.settings && profile.settings.name;
  const hi = name ? `${name}, ` : '';
  if (ctx.kind === 'baseline') {
    const strong = ctx.strongest ? domainName(ctx.strongest) : 'your strongest capacity';
    return `${hi}before we talk about anything to grow, let's start where you already do well — ${strong}. When does that show up most in your life? I'd rather build from what's already working for you than hand you a generic plan.`;
  }
  const d = ctx.domain ? domainName(ctx.domain) : 'this';
  return `${hi}let's talk about your ${d}. First, though — when has this gone *well* for you, even a little? What was different about that time, or what were you already doing that helped? I want to build from there.`;
}

// Turn a raw Anthropic API error into a plain-language explanation.
export function friendlyApiError(msg) {
  const m = String(msg || '');
  if (/credit balance is too low/i.test(m)) {
    return 'Your Anthropic API account is out of credit. Note: this is separate from a Claude Max or Pro subscription — those don’t fund API calls. Add pay-as-you-go credit at console.anthropic.com → Billing.';
  }
  if (/authentication|invalid x-api-key|\b401\b/i.test(m)) {
    return 'That API key wasn’t accepted. Double-check you copied the whole key (starts with sk-ant-) from console.anthropic.com.';
  }
  if (/model/i.test(m) && /(not found|does not exist|invalid|unknown)/i.test(m)) {
    return 'That model isn’t available on your account. Try Sonnet or Haiku in the Model dropdown.';
  }
  if (/rate limit|\b429\b/i.test(m)) {
    return 'Rate limit reached — wait a moment and try again.';
  }
  return m;
}

export function hasKey(profile) {
  return !!(profile?.settings?.apiKey && profile.settings.apiKey.trim());
}

// Compact, model-readable summary of the person's current state.
export function profileSummary(profile) {
  const lines = [];
  const name = profile.settings?.name;
  if (name) lines.push(`Name: ${name}`);
  const scores = profile.domainScores || {};
  lines.push('Current domain scales (0-100):');
  for (const d of DOMAINS) {
    const s = scores[d.id];
    if (s == null) continue;
    const t = domainTrend(profile.history || [], d.id);
    const trend = t.first != null && t.delta !== 0 ? ` (${t.delta > 0 ? '+' : ''}${t.delta} since start)` : '';
    lines.push(`  - ${d.name}: ${s} [${bandFor(s).label}]${trend}`);
  }
  const recent = (profile.sessions || []).slice(-5);
  if (recent.length) {
    lines.push('Recent sessions:');
    for (const s of recent) {
      lines.push(`  - ${s.date}: ${domainName(s.domain)} (${s.type}) scored ${s.rawScore}`);
    }
  }
  if (profile.streak?.current) lines.push(`Current streak: ${profile.streak.current} day(s).`);
  const openGoals = (profile.goals || []).filter((g) => !g.done);
  if (openGoals.length) lines.push(`Active goals: ${openGoals.map((g) => g.text).join(' | ')}`);
  return lines.join('\n');
}

// Low-level call to Claude, directly from the browser.
async function callClaude({ apiKey, model, system, messages, maxTokens = 1024 }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
      // Opt-in flag that allows calling the API from a browser. The user has
      // explicitly entered their own key; nothing is proxied through us.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Claude API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}

function model(profile) {
  return profile.settings?.model || DEFAULT_MODEL;
}

// --- Interpretive feedback on the baseline (onboarding) ---
export async function interpretBaseline(profile) {
  const offline = ruleInterpretBaseline(profile.baseline.domainScores, profile.settings?.name);
  if (!hasKey(profile)) return { text: offline, live: false };
  try {
    const text = await callClaude({
      apiKey: profile.settings.apiKey,
      model: model(profile),
      system: FORMA_SYSTEM,
      maxTokens: 900,
      messages: [
        {
          role: 'user',
          content: `This person just completed their baseline Forma assessment. Here is their data:\n\n${profileSummary(profile)}\n\nWrite their opening interpretation: warm, honest, specific to these numbers. Name their clearest strength and their biggest growth opening, and frame the whole thing as a starting line. 3-4 short paragraphs.`,
        },
      ],
    });
    return { text: text || offline, live: !!text };
  } catch (e) {
    return { text: offline, live: false, error: e.message };
  }
}

// --- The single daily insight after a session ---
export async function dailyInsight(session, profile) {
  const offline = ruleDailyInsight(session, profile);
  if (!hasKey(profile)) return { text: offline, live: false };
  try {
    const text = await callClaude({
      apiKey: profile.settings.apiKey,
      model: model(profile),
      system: FORMA_SYSTEM,
      maxTokens: 400,
      messages: [
        {
          role: 'user',
          content: `The person just finished today's session: ${domainName(session.domain)} (${session.type}), scoring ${session.rawScore}/100. Their broader picture:\n\n${profileSummary(profile)}\n\nReturn ONE insight about today's session relative to their pattern — two or three sentences, specific and encouraging, no preamble.`,
        },
      ],
    });
    return { text: text || offline, live: !!text };
  } catch (e) {
    return { text: offline, live: false, error: e.message };
  }
}

// --- Conversational coaching ---
// Human-escalation guardrail. If a message shows clear signs of genuine crisis,
// Forma does NOT try to coach it — and does NOT route the content to the API.
// It steps back and points the person to a real human. This applies in BOTH
// live and offline modes.
const CRISIS_PATTERN = /\b(kill myself|killing myself|suicid|end (my|it) (life|all)|want to die|wanna die|don'?t want to (live|be here|exist)|hurt myself|harm myself|self[-\s]?harm|cut(ting)? myself|no reason to live|better off dead|can'?t go on)\b/i;

export function looksLikeDistress(text) {
  return CRISIS_PATTERN.test(text || '');
}

export const ESCALATION_MESSAGE =
  "I'm really glad you said that to me — and I want to be honest: what you're describing is heavier than a formation app should carry, and you deserve a real person for it, not an algorithm.\n\n" +
  'Please reach out right now to someone you trust, or to a trained human who can help. In the US you can call or text 988 (the Suicide & Crisis Lifeline), any time, day or night. Anywhere else, your local emergency number or a crisis line in your country can connect you with someone immediately. If you are in immediate danger, please call emergency services.\n\n' +
  "I'll be here for the formation work whenever you're ready — but let a real person be with you in this first.";

// Build a VALID Anthropic messages array from possibly-messy stored history:
// the API requires the list to start with a user turn and to strictly alternate
// roles. We take recent turns, drop leading non-user turns, collapse any
// consecutive same-role turns, and end with the new user message. Exported for
// testing.
export function buildCoachMessages(coachLog, userText) {
  const recent = (coachLog || []).slice(-8).map((m) => ({ role: m.role, content: m.content }));
  const cleaned = [];
  for (const m of recent) {
    if (m.role !== 'user' && m.role !== 'assistant') continue;
    if (!cleaned.length && m.role !== 'user') continue; // must start with user
    if (cleaned.length && cleaned[cleaned.length - 1].role === m.role) continue; // no two in a row
    cleaned.push(m);
  }
  // The new user message must not follow a trailing user turn.
  if (cleaned.length && cleaned[cleaned.length - 1].role === 'user') cleaned.pop();
  return [...cleaned, { role: 'user', content: userText }];
}

export async function coachReply(userText, profile) {
  // Safety first, before anything else — and before any network call.
  if (looksLikeDistress(userText)) {
    return { text: ESCALATION_MESSAGE, live: false, escalated: true };
  }

  if (!hasKey(profile)) {
    return {
      text: offlineCoachReply(userText, profile),
      live: false,
    };
  }
  try {
    const messages = buildCoachMessages(profile.coachLog, userText);
    const text = await callClaude({
      apiKey: profile.settings.apiKey,
      model: model(profile),
      system: `${FORMA_SYSTEM}\n\n--- THE PERSON YOU ARE COACHING ---\n${profileSummary(profile)}`,
      maxTokens: 1024,
      messages,
    });
    return { text: text || offlineCoachReply(userText, profile), live: !!text };
  } catch (e) {
    // Don't surface the raw API error body in the chat UI (it can echo request
    // content). Show a calm, generic note; keep the detail on the object for
    // the console only.
    return {
      text: `${offlineCoachReply(userText, profile)}\n\n(Live coaching is paused — I couldn't reach Claude just now. Your data and the read above still work.)`,
      live: false,
      error: e.message,
    };
  }
}

// A useful-but-honest fallback when there's no API key. It points the person at
// their own real data rather than pretending to be a conversational AI.
function offlineCoachReply(userText, profile) {
  const patterns = weeklyPatterns(profile);
  const intro =
    'Live AI coaching turns on once you add your own Claude API key in Settings. In the meantime, here is what Forma can already see in your own data:';
  const body = patterns.map((p) => `• ${p}`).join('\n');
  const close =
    'When you add a key, I can talk this through with you properly — reading your full history and responding to exactly what you ask.';
  return `${intro}\n\n${body}\n\n${close}`;
}

// --- Vignette scoring (the AI-scored communication/EI exercise) ---
// A person spoke (or typed) how they'd respond to a charged interpersonal
// scenario; Claude scores the transcript on a relational-presence rubric and
// returns one piece of formative feedback. Growth-framed, never clinical.
const VIGNETTE_SYSTEM = `You are scoring a Forma communication exercise. You are NOT diagnosing anyone and you never use clinical language. A person was given a charged interpersonal scenario and said how they would respond. Rate that response 0–100 on how well it embodies real relational presence and emotional intelligence: did they attune to the other person's emotional reality before fixing, advising, or defending? Perspective-taking, warmth, clarity, non-defensiveness and repair. Reward genuine listening over clever solutions. A clumsy but warm, present response should outscore a polished but defensive or fix-it-first one.

Return ONLY a JSON object, nothing else:
{"score": <0-100>, "feedback": "<2-3 sentences, second person, warm and plain: one specific thing the response did well, and one concrete thing to try. No clinical language, no scores in the prose, no preamble.>"}`;

function parseVignette(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  let obj;
  try { obj = JSON.parse(text.slice(start, end + 1)); } catch { return null; }
  const score = typeof obj.score === 'number' ? obj.score : Number(obj.score);
  if (score == null || Number.isNaN(score)) return null;
  return { score: Math.max(0, Math.min(100, Math.round(score))), feedback: String(obj.feedback || '') };
}

export async function scoreVignette(vignette, transcript, profile) {
  if (!hasKey(profile)) return null; // this exercise requires the live coach
  const soft = { score: 60, feedback: "I couldn't fully read that one — but showing up to a hard conversation is the rep. Next time, try naming what the other person might be feeling before you respond to it." };
  try {
    const text = await complete(profile, {
      system: VIGNETTE_SYSTEM,
      maxTokens: 500,
      messages: [{ role: 'user', content: `Scenario: ${vignette.scenario}\n\nThe prompt they answered: ${vignette.prompt}\n\nTheir response: "${transcript}"\n\nScore it.` }],
    });
    return parseVignette(text) || soft;
  } catch {
    return soft;
  }
}

// Generic completion helper so other modules (e.g. the Diagnostic Agent) can
// reuse the same browser-direct Claude plumbing and the user's key/model.
export async function complete(profile, { system, messages, maxTokens = 1024 }) {
  return callClaude({
    apiKey: profile.settings.apiKey,
    model: model(profile),
    system,
    messages,
    maxTokens,
  });
}

export { weeklyPatterns };
