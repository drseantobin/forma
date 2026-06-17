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

// Derive the capacity list from DOMAINS so the coach's mental model can never
// drift out of sync with the measures the app actually offers (it used to list
// only eight, silently omitting Communication and Emotional Regulation).
const CAPACITIES = DOMAINS.map((d) => d.name).join(', ');

export const FORMA_SYSTEM = `You are the Forma Coach — the formation guide inside Forma, an app that helps people strengthen the human capacities that matter most in an age of abundant AI: ${CAPACITIES}.

Your stance: a wise, warm, honest coach. Think of the best spiritual director or formation mentor — someone who sees the person clearly, names what's true without flattery, and always points toward growth. You are perceptive and a little prophetic, but never cold and never preachy.

Hard rules you never break:
1. FORMATION, NOT DIAGNOSIS. You never diagnose, label, or use clinical/medical language ("disorder," "deficit," "ADHD," "depression," etc.). You speak about capacities, habits, and trajectories. If a person's message suggests real distress, self-harm, or crisis, you gently and directly encourage them to reach out to a trusted person or a professional, and you do not try to be their therapist.
2. GROWTH FRAMING ONLY. Even a low score is a starting line, never a deficiency. You surface strengths and trajectories, never shame.
3. GROUND EVERYTHING IN THEIR DATA. You are given the person's actual scores, trends, and recent sessions. Refer to specifics. The whole value is that you see THEM, not a generic user.
4. BE BRIEF AND CONCRETE. Coaches don't lecture. Two to five short paragraphs at most, usually less. End with one concrete, doable next step when it fits — never a bulleted list of platitudes.
5. NEVER pretend to certainty you don't have. One session is noise; patterns are signal. Say so.
6. ROLL WITH RESISTANCE; DON'T PUSH. If they doubt, dismiss, or decline a suggestion ("I've tried that," "that won't work," "I don't want to"), do NOT defend it or pile on another — reflect what they're telling you, get curious about it, and let them lead. Their reasons are data, not obstacles. And when they ask you a direct question ("what should I do?", "am I making progress?"), give an honest, grounded answer FIRST, then open it back up. Never deflect every question back with another question; that frustrates more than it helps.

Your method is SOLUTION-FOCUSED (in the tradition of solution-focused brief therapy):
- Start from what already WORKS. Before suggesting anything, look for exceptions and existing resources — times the person has done well at this, what helped, what they were already doing right. Ask about those first.
- Build on strengths, not deficits. You amplify what's working and help them do more of it, rather than fixing what's broken.
- Tailor to THIS person's real ability and life — never a generic prescription. Meet them where they are.
- When it fits, offer ONE small, concrete practice they can do ON THEIR OWN, outside the app, in the next day or two — specific, doable, and drawn from what's already worked for them. (e.g. "Tomorrow, before you open your phone, name the one thing you most want your attention on." Not "be more mindful.")
- Ask good questions more than you give answers. A solution-focused coach is curious: "When has this gone better? What was different then? What would one small step look like?"
- Use SCALING to make change concrete and owned. When it fits, invite them onto a 0-10 scale ("where are you with this today?"), then ask what one point higher would look like and what's already getting them as high as they are. Their score in the data is a starting anchor for this — translate it into their own felt sense of where they stand, never hand it back as a verdict.

Voice: plain, vivid, unhurried. No corporate wellness-speak. No "journey," "lean into," "sit with," "powerful," "transformative." Talk like a real person who has thought hard about this.`;

// The coach's empty-state greeting when the Coach tab is opened directly. Unlike
// a generic "hi, I've read your scales", it proves it sees THEM by naming a real
// signal from their own data — a capacity that's climbing, a streak, or their
// biggest opening — then invites a solution-focused conversation. Pure + tested.
export function coachGreeting(profile) {
  const name = profile && profile.settings && profile.settings.name;
  const hi = name ? `Hi ${name}.` : 'Hi.';
  const scores = (profile && profile.domainScores) || {};
  const ids = Object.keys(scores);

  // Strongest upward mover since the start.
  let best = null;
  for (const id of ids) {
    const t = domainTrend((profile && profile.history) || [], id);
    if (t.first != null && t.delta > (best ? best.delta : 2)) best = { id, delta: t.delta };
  }
  const streak = profile && profile.streak && profile.streak.current;

  let signal;
  if (best) signal = `Your ${domainName(best.id)} is up ${best.delta} since you started — that's real, not noise.`;
  else if (streak && streak >= 3) signal = `That's ${streak} days in a row now. The showing-up is the formation.`;
  else if (ids.length) {
    const low = ids.slice().sort((a, b) => scores[a] - scores[b])[0];
    signal = `I've read your scales — ${domainName(low)} looks like your biggest opening right now.`;
  } else signal = `I've read your baseline.`;

  const close = hasKey(profile)
    ? `What's on your mind — a day that didn't go how you wanted, or where to put your effort next?`
    : `What's on your mind today? (Offline for now — I'll read your own data back to you; add a Claude key in Settings for the full conversation.)`;
  return `${hi} ${signal} ${close}`;
}

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
  // Connect to the exact session they just left, when we know what it was.
  const justDid = ctx.exerciseLabel ? `You just did ${ctx.exerciseLabel.toLowerCase()}. ` : '';
  return `${hi}${justDid}let's stay with that for a second — when has your ${d} gone *well* for you, even a little? What was different about that time, or what were you already doing that helped? I'd rather build from there than hand you a plan.`;
}

// The live, task-connected opener: when a key is present, Claude writes the
// coach's FIRST message tied to the session the person just finished and the
// insight they were shown — so the conversation starts inside the moment
// instead of with a template. Falls back to the rule-based opener offline.
export async function sessionOpener(profile, ctx = {}) {
  if (!hasKey(profile)) return { text: solutionFocusedOpener(profile, ctx), live: false };
  const d = ctx.domain ? domainName(ctx.domain) : 'this capacity';
  const parts = [];
  parts.push('The person just finished a Forma session and tapped "talk this through" to process it with you. They are looking at this screen right now — so connect immediately and specifically to what they just did. Do NOT open with a generic question.');
  parts.push(`Session: ${d}${ctx.exerciseLabel ? ` — "${ctx.exerciseLabel}"` : ''}${ctx.score != null ? `, they scored ${ctx.score}/100` : ''}.`);
  if (ctx.kind === 'baseline') parts.push(`This is their opening baseline across all ${DOMAINS.length} capacities.`);
  if (ctx.insight) parts.push(`The insight they were just shown:\n"${ctx.insight}"`);
  parts.push(`Their fuller picture:\n${profileSummary(profile)}`);
  parts.push('Write your FIRST message to them: 2-4 short sentences. Reflect back something specific and true about what just happened for them, connect it to them as a person, and end with one open, inviting question that helps them process it. Solution-focused in spirit — curious about what worked, where this lives in their real life — but grounded in THIS exact moment, not a formula. No preamble, no "great job," no recap of the numbers.');
  try {
    const text = await callClaude({
      apiKey: profile.settings.apiKey,
      model: model(profile),
      system: FORMA_SYSTEM,
      maxTokens: 350,
      messages: [{ role: 'user', content: parts.join('\n\n') }],
    });
    return { text: text || solutionFocusedOpener(profile, ctx), live: !!text };
  } catch (e) {
    return { text: solutionFocusedOpener(profile, ctx), live: false, error: e.message };
  }
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
    // Privacy invariant: the Interior Life (faith) track NEVER enters any context
    // assembled for the API. The interior screens promise it "stays on your
    // device / never shown to anyone but you," and this summary feeds every live
    // call (coach chat, baseline interpretation, daily insight). Mirrors the same
    // exclusion snapshot.js enforces for the shareable credential.
    if (d.id === 'interior') continue;
    const s = scores[d.id];
    if (s == null) continue;
    const t = domainTrend(profile.history || [], d.id);
    const trend = t.first != null && t.delta !== 0 ? ` (${t.delta > 0 ? '+' : ''}${t.delta} since start)` : '';
    lines.push(`  - ${d.name}: ${s} [${bandFor(s).label}]${trend}`);
  }
  const recent = (profile.sessions || []).filter((s) => s.domain !== 'interior').slice(-5);
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
  // Privacy invariant: an Interior Life (faith) session is never sent to the API
  // — not even its name/score. The rule-based insight is generated on-device so
  // the spiritual track keeps its "stays on your device" promise in fact. (The
  // shared profileSummary already omits interior; this guards the session line
  // dailyInsight emits directly.)
  if (session.domain === 'interior') return { text: offline, live: false };
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
// Crisis-language detector. Deliberately tuned to over-detect rather than miss:
// on a safety guardrail a false negative (missing a real crisis) is the costly
// error, while a false positive only surfaces a gentle, compassionate pointer to
// real human help. Still kept precise enough that ordinary frustration ("this is
// killing me", "I give up on this puzzle") does NOT trip it.
const CRISIS_PATTERN = /\b(kill(ing)? myself|suicid|end (my|it) (life|all)|tak(e|ing) my (own )?life|want to die|wanna die|want (it|this) (all )?to end|don'?t want to (live|be here|exist|wake up|go on)|wish I (was|were|wasn'?t) (dead|here|alive)|wish I (wouldn'?t|didn'?t) wake up|(hurt|harm)(ing)? myself|self[-\s]?harm(ing|ed)?|cutting again|cut(ting)? (myself|my (wrist|arm|thigh|leg|skin)s?)|slit (my )?wrists?|no reason to live|nothing (left )?to live for|better off (dead|without me)|no point (in )?(living|going on|being here)|give up on life|can'?t go on)\b/i;

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
    // Surface the plain-language reason (not the raw body) so the person can
    // actually fix it — e.g. the API-billing-vs-Max case.
    return {
      text: `Live coaching couldn't reach Claude: ${friendlyApiError(e.message)}\n\nIn the meantime, here's what Forma sees in your own data:\n\n${offlineCoachReply(userText, profile)}`,
      live: false,
      error: e.message,
    };
  }
}

// Keyword → domain matching, so the offline coach can tell which capacity a
// person is actually talking about. Emotionally-loaded words (anxious, angry…)
// are deliberately NOT here — those route to the empathic struggle branch, not a
// score readout.
const DOMAIN_SYNONYMS = {
  attention: ['attention', 'focus', 'distract', 'concentrat'],
  memory: ['memory', 'remember', 'forget', 'recall'],
  reading: ['reading', 'comprehen', 'deep read'],
  persistence: ['persistence', 'persever', 'frustration tolerance', 'giving up'],
  judgment: ['judgment', 'judgement', 'reasoning', 'decision', 'deciding', 'think clearly'],
  ai_autonomy: ['ai independence', 'autonomy', 'automation', 'dependence', 'crutch', 'rely on ai'],
  presence: ['presence', 'being present', 'listening', 'relationship'],
  communication: ['communication', 'communicat', 'conversation', 'conflict', 'feedback'],
  emotion_regulation: ['emotion regulation', 'regulat', 'my emotions', 'mood'],
  values: ['values', 'meaning', 'purpose', 'self-knowledge', 'identity'],
  interior: ['interior', 'spiritual', 'prayer', 'contemplat', 'silence', 'the soul'],
};

function domainFromText(t) {
  return DOMAINS.find((d) => {
    if (t.includes(d.name.toLowerCase())) return true;
    return (DOMAIN_SYNONYMS[d.id] || []).some((w) => t.includes(w));
  }) || null;
}

function lowestScoredDomain(scores) {
  const ids = Object.keys(scores);
  if (!ids.length) return null;
  return ids.sort((a, b) => scores[a] - scores[b])[0];
}

// A useful-but-honest fallback when there's no API key. Unlike a canned dump, it
// actually RESPONDS to what the person said — reflecting, then asking the kind of
// question a solution-focused coach would, anchored in their own data. It never
// pretends to be the live AI; a key deepens it, but this still earns the chat.
export function offlineCoachReply(userText, profile) {
  const t = (userText || '').toLowerCase();
  const scores = (profile && profile.domainScores) || {};

  // 1) They named a capacity → their real standing + a solution-focused opener.
  const named = domainFromText(t);
  if (named && scores[named.id] != null) {
    const band = bandFor(scores[named.id]);
    const low = named.name.toLowerCase();
    return `${named.name} is sitting at ${scores[named.id]} right now — ${band.label.toLowerCase()}. `
      + `Here's the more useful question than the number: when has your ${low} gone *better* than usual, even a little? `
      + `What was different about that day — what were you already doing that helped? We build from that, not from willpower.`;
  }

  // 2) "What should I work on?" → the most room to grow, but their choice leads.
  if (/\b(work on|where (do|should) i (start|begin)|where to start|focus on|what next|what should i)\b/.test(t)) {
    const lowest = lowestScoredDomain(scores);
    if (lowest) {
      return `On the numbers, ${domainName(lowest)} has the most room right now. But the better question is which one you actually *want* to grow — formation sticks when it's yours to choose, not assigned. Which one pulls at you, and what's one small step you could take this week?`;
    }
  }

  // 2b) "I don't know" / can't-think — the #1 stall in solution-focused work.
  // Must be caught BEFORE the struggle branch (which would re-ask an exception
  // question — the very thing they just couldn't answer — reading as not
  // listening) and before open-goals/default. Shrink the scale to something they
  // CAN answer rather than re-asking the unanswerable.
  if (/\b(i (do ?n['’]?t|do not) know|dunno|not sure|no idea|idk|can['’]?t think|hard to say|beats me)\b/.test(t)) {
    return `That's a fair answer — "I don't know" usually means the question's too big, not that there's nothing there. `
      + `So let's shrink it: think of the single least-bad hour you've had with this lately. What were you doing in that hour — even something small or ordinary? `
      + `That's the thread we pull on, not willpower.`;
  }

  // 2c) Pushback on a suggestion (MI: roll with resistance, don't argue or pile
  // on another). Must precede the struggle branch — otherwise "that won't work"
  // re-asks an exception question, reading as not listening. Reflect, get curious
  // about THEIR reason, let them lead; don't defend or re-pitch.
  if (/(tried that|already tried|i['’]?ve tried|won['’]?t work|does ?n['’]?t work|did ?n['’]?t work|do not work|don['’]?t want to|do not want to|easier said than done|not realistic|that won['’]?t)/.test(t)) {
    return `Fair enough — if it didn't work or doesn't fit you, that's worth taking seriously, not arguing with. `
      + `I'd rather understand it than re-pitch it: what was it about that approach that missed for you? `
      + `Often the useful thing is hiding in why a suggestion doesn't land — what would have to be different for something to actually be worth your time?`;
  }

  // 3) Struggle / hard feelings → validate, then an exception question (SFBT).
  if (/\b(struggl|stuck|hard|can'?t|cannot|difficult|frustrat|overwhelm|tired|exhaust|fail|behind|stress|anx|angry|anger|\bsad\b|lonely|afraid|scared|worried|hopeless)\w*/.test(t)) {
    return `That sounds genuinely hard, and I'm glad you said it plainly. A solution-focused place to start: think of a recent day this was even a little easier — even 10%. `
      + `What were you doing differently then, or what was different around you? That small exception is more useful to build on than any amount of pushing harder.`;
  }

  // 4) A win → amplify it and ask how to repeat it.
  if (/\b(better|good|great|proud|did it|progress|improv|won|breakthrough|easier|clicked|finally)\w*/.test(t)) {
    return `That's worth pausing on — name it before it slips past. What made it possible? `
      + `If you wanted one more day like that this week, what's the smallest thing you'd repeat on purpose?`;
  }

  // 5) Open commitment? Follow up on it — solution-focused work is built on the
  // small next steps a person chose for themselves, so a check-in beats a generic
  // prompt. (Ties the commitments a person sets on Home back into the coaching.)
  const openGoals = (profile.goals || []).filter((g) => !g.done);
  if (openGoals.length) {
    const g = openGoals[0];
    return `Before we go wider — you set a commitment for yourself: “${g.text}”. How has that been going? `
      + `Think of a moment this week it went even a little the way you wanted — what was different then? We build from that, not from pressure.`;
  }

  // 6) Default → reflect, ask one solution-focused question, ground in real data.
  const patterns = weeklyPatterns(profile);
  const one = patterns && patterns.length ? patterns[0] : null;
  return `I'm here — tell me a bit more about what's on your mind. `
    + `And a solution-focused place to begin: when did this last go even slightly the way you'd want it to?`
    + (one ? `\n\nOne thing Forma already notices in your data: ${one}` : '')
    + `\n\n(Add your own Claude API key in Settings and I can talk this through live — reading your full history.)`;
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
  // Validity guard: when the model is unavailable or unparseable we return
  // feedback but NO score (null) — a fabricated constant would inject fake data
  // onto the longitudinal scale and wrongly raise confidence. Callers treat a
  // null score as "not measured" and leave the domain scale untouched.
  const soft = { score: null, feedback: "I couldn't fully read that one this time — but showing up to a hard conversation is the rep. Next time, try naming what the other person might be feeling before you respond to it." };
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

// --- Sentence-completion scoring (Rotter RISB lineage, formative not clinical) ---
const SENTENCES_SYSTEM = `You are scoring a Forma self-reflection exercise: a person finished several incomplete sentences. You are NOT diagnosing — never use clinical or pathologizing language. Rate 0–100 how much honest self-awareness and coherence the completions show: candor over deflection, emotional specificity (a real feeling named, not "fine"), and the sense of someone who actually knows themselves. Reward honesty over polish; a raw, true completion outscores a guarded, clever one. Blank or evasive answers score lower, but gently.

Return ONLY a JSON object: {"score": <0-100>, "feedback": "<2-3 sentences, second person, warm and plain: one thing their answers quietly reveal that's worth seeing, and one gentle invitation to look further. No clinical language, no scores in the prose, no preamble.>"}`;

export async function scoreSentences(stems, completions, profile) {
  if (!hasKey(profile)) return null;
  // Validity guard: feedback but NO score (null) on failure — see scoreVignette.
  const soft = { score: null, feedback: "Even half-finishing these honestly is worth something — self-knowledge starts with the willingness to look. Next time, try the first true thing that comes, before you tidy it up." };
  try {
    const pairs = stems.map((st, i) => `"${st} …" → "${(completions[i] || '').trim()}"`).join('\n');
    const text = await complete(profile, {
      system: SENTENCES_SYSTEM,
      maxTokens: 500,
      messages: [{ role: 'user', content: `Their sentence completions:\n${pairs}\n\nScore them.` }],
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
