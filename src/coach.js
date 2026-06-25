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
import { providerFor } from './llm.js';
import { GROWTH_GUIDE, growthFor } from './growth.js';
import { rubricScaleText, rubricFor } from './rubrics.js';

export const DEFAULT_MODEL = 'claude-opus-4-8';

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
6. ROLL WITH RESISTANCE; DON'T PUSH. If they doubt, dismiss, or decline a suggestion ("I've tried that," "that won't work," "I don't want to"), do NOT defend it or pile on another — reflect what they're telling you, get curious about it, and let them lead. Their reasons are data, not obstacles. And if their frustration is with YOU or the app itself ("this is pointless," "you're not helping," "you don't get it"), that's discord, not resistance: name it plainly, take it as fair information, do NOT defend the app or problem-solve, and ask what would actually be useful right now. And when they ask you a direct question ("what should I do?", "am I making progress?"), give an honest, grounded answer FIRST, then open it back up. Never deflect every question back with another question; that frustrates more than it helps.
7. WITNESS BEFORE SOLVING. Some messages ask for help; others just need to be heard. When someone is venting or naming a hard feeling and has NOT asked for help, reflect and stay with them first — do not reach for an exception question, a scale, or a next step in the same breath. Premature problem-solving reads as "you're not listening." Acknowledge fully, then earn the pivot: ask if they want to look at it, or simply what would help right now.
8. A GUIDE, NOT A SUBSTITUTE. You are a mirror and a guide — never a replacement for real relationships or for the person's own inner life. The whole point is to return them to their actual life more present, not more dependent on you. Point them outward and onward: toward real people, their own agency, the practice itself. When a conversation could happen with a trusted friend, mentor, or in their own prayer and reflection, gently say so and send them there. Never cultivate reliance on the app or on talking to you. You are doing this well when they need you a little less each time.

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
  // Honest about a rise: delta>2 clears the measurement-noise floor, but NOT task-familiarity /
  // practice effects — so name the rise warmly without claiming proven growth (mirrors v238/v239).
  if (best) signal = `Your ${domainName(best.id)} is up ${best.delta} since you started. Some of that's the task getting familiar — keep the habit and we'll see if it holds.`;
  else if (streak && streak >= 3) signal = `That's ${streak} days in a row now. The showing-up is the formation.`;
  else if (ids.length) {
    const low = ids.slice().sort((a, b) => scores[a] - scores[b])[0];
    signal = `I've read your scales — ${domainName(low)} looks like your biggest opening right now.`;
  } else signal = '';
  // No signal yet (e.g. the coach opened BEFORE the quick check) → just a warm open, no
  // claim to have "read your baseline" when there isn't one.

  const close = hasKey(profile)
    ? `What's on your mind — a day that didn't go how you wanted, or where to put your effort next?`
    : `What's on your mind today? (Offline for now — I'll read your own data back to you; add your own API key (any provider) in Settings for the full conversation.)`;
  return [hi, signal, close].filter(Boolean).join(' ');
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
  // Privacy invariant (mirrors dailyInsight, v78): an Spiritual Life (faith) session
  // is NEVER sent to the API — not its domain name, score, or reflection insight.
  // ctx carries those straight from the score-reveal screen, bypassing the scrubbed
  // profileSummary, so this is the sibling path that must be guarded too. Keep the
  // on-device rule-based opener for interior, regardless of whether a key is set.
  if (ctx.domain === 'interior') return { text: solutionFocusedOpener(profile, ctx), live: false };
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
    const text = await callLLM(profile, {
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
  if (/credit balance is too low|insufficient_quota|exceeded your current quota|billing/i.test(m)) {
    return 'Your API account is out of credit/quota. (For Claude, note that’s separate from a Pro/Max subscription — those don’t fund API calls.) Add pay-as-you-go credit in your provider’s billing console.';
  }
  if (/authentication|invalid x-api-key|invalid api key|\b401\b|\b403\b/i.test(m)) {
    return 'That API key wasn’t accepted. Double-check you copied the whole key from your provider’s console, and that it matches the provider selected in Settings.';
  }
  if (/model/i.test(m) && /(not found|does not exist|invalid|unknown|unsupported)/i.test(m)) {
    return 'That model isn’t available on your account for the selected provider. Pick a different model in Settings.';
  }
  if (/rate limit|\b429\b/i.test(m)) {
    return 'Rate limit reached — wait a moment and try again.';
  }
  return m;
}

export function hasKey(profile) {
  return !!(profile?.settings?.apiKey && profile.settings.apiKey.trim());
}

// Short display name of the coach's active provider (Claude / GPT / Gemini /
// OpenRouter) — so the UI reflects whatever key the person actually brought,
// not a hardcoded one. Defaults to the Anthropic adapter when unset.
export function providerName(profile) {
  return providerFor(profile?.settings?.provider).short;
}

// A gentle, ON-DEVICE "is this what you mean?" nudge for a commitment a person is
// writing — helps it land as something concrete and doable WITHOUT a corporate
// S-M-A-R-T checklist or a nag. Pure + rule-based (no LLM): works for everyone, is
// instant, never blocks the save, and keeps the commitment text on the device. Returns
// ONE short director's question, or null when the commitment is already concrete
// (silence is the reward for a clear one). Formation, not productivity-hustle.
export function sharpenCommitment(text) {
  const t = String(text || '').trim();
  if (t.length < 3) return null;
  const hasSize = /\b\d+\s?(min|minute|page|rep|time|sec|second|hour|day|word|breath|chapter|verse)/i.test(t);
  const hasCue = /\b(before|after|when|every|each|morning|night|noon|lunch|wake|woke|bed|first thing|then|on (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekdays?))\b/i.test(t);
  if (hasSize && hasCue) return null; // already concrete — say nothing
  const words = t.split(/\s+/).length;
  const vague = /\b(more|less|better|try to|be more|improve|focus|stop|start|work on|be a better)\b/i.test(t);
  if (vague && words <= 6) return 'What would this look like on an ordinary Tuesday? A small, concrete version is easier to actually keep.';
  if (!hasCue) return 'When will you do this? Tying it to something you already do — “after I pour my coffee,” “before I open my phone” — makes it stick more than willpower.';
  if (!hasSize) return 'How much, or for how long? Even “10 minutes” or “one page” gives you a clear way to know you kept it.';
  return null;
}

// Compact, model-readable summary of the person's current state.
// Recent WRITTEN reflections (the value named, action chosen, note/text written), the SHARED
// source for both the live coach context and the offline coach's recall. Two hard guardrails,
// enforced here so they can't drift: interior/faith content is NEVER included (the Examen etc.
// stay on-device), and any field that reads as distress is dropped (the crisis path handles that,
// not the coach). Returns the most recent `limit` entries that have any surviving content.
export function recentReflections(profile, limit = 6) {
  const out = [];
  const pick = (v) => (v && String(v).trim() && !looksLikeDistress(v)) ? String(v).trim() : '';
  for (const s of ((profile && profile.sessions) || []).filter((x) => x.domain !== 'interior')) {
    const r = s.response || {};
    const entry = { date: s.date, domain: s.domain, value: pick(r.value), action: pick(r.action), note: pick(r.note), text: pick(r.text) };
    if (entry.value || entry.action || entry.note || entry.text) out.push(entry);
  }
  return out.slice(-limit);
}

// A compact digest of the OTHER coach conversations — every per-domain thread + archived history
// (live + past days) — so the GENERAL/main chat "has access to them all" and can refer to what was
// said about a capacity in a separate chat. Capped to stay lean; interior is never included.
export function coachThreadsDigest(profile) {
  const clip = (s) => { const x = String(s || '').trim().replace(/\s+/g, ' '); return x.length > 140 ? x.slice(0, 137) + '…' : x; };
  const ct = (profile && profile.coachThreads) || {};
  const ch = (profile && profile.coachHistory) || {};
  const out = [];
  const domainKeys = [...new Set([...Object.keys(ct), ...Object.keys(ch)])]
    .filter((k) => k !== 'general' && k !== 'interior' && DOMAINS.some((d) => d.id === k));
  for (const k of domainKeys) {
    const msgs = (ch[k] || []).concat(ct[k] || []).slice(-6);
    if (!msgs.length) continue;
    out.push(`• ${domainName(k)} chat:\n  ${msgs.map((m) => `${m.role === 'user' ? 'Them' : 'You'}: ${clip(m.content)}`).join('\n  ')}`);
  }
  const genHist = (ch.general || []).slice(-6);
  if (genHist.length) out.push(`• Earlier general chats:\n  ${genHist.map((m) => `${m.role === 'user' ? 'Them' : 'You'}: ${clip(m.content)}`).join('\n  ')}`);
  return out.join('\n');
}

export function profileSummary(profile, focusDomain = null) {
  const lines = [];
  const name = profile.settings?.name;
  if (name) lines.push(`Name: ${name}`);
  const scores = profile.domainScores || {};
  lines.push('Current domain scales (0-100):');
  for (const d of DOMAINS) {
    // Privacy invariant: the Spiritual Life (faith) track NEVER enters any context
    // assembled for the API. The interior screens promise it "stays on your
    // device / never shown to anyone but you," and this summary feeds every live
    // call (coach chat, baseline interpretation, daily insight). Mirrors the same
    // exclusion snapshot.js enforces for the shareable credential.
    if (d.id === 'interior') continue;
    const s = scores[d.id];
    if (s == null) continue;
    const t = domainTrend(profile.history || [], d.id);
    // Only surface a trend the engine considers real (direction up/down past ±2) — never a
    // within-noise ±1 wobble, so the coach isn't handed noise to call "improvement".
    const trend = t.first != null && t.direction !== 'flat' ? ` (${t.delta > 0 ? '+' : ''}${t.delta} since start)` : '';
    lines.push(`  - ${d.name}: ${s} [${bandFor(s).label}]${trend}`);
  }
  // Anti-overclaim guardrail for the live coach: score movements are the person's own
  // readings, not validated proof, and an early rise on a repeated task can be growing
  // task-familiarity. The coach may encourage the habit; it must NOT claim the capacity is
  // proven to be improving (mirrors scoredValidated=false + the no-fake-trend rule).
  lines.push('(Score movements are this person’s own readings over weeks — NOT validated proof training works; an early rise on a repeated task can be task-familiarity. Encourage the habit; never claim the capacity is proven to be improving.)');
  const recent = (profile.sessions || []).filter((s) => s.domain !== 'interior').slice(-5);
  if (recent.length) {
    lines.push('Recent sessions:');
    for (const s of recent) {
      lines.push(`  - ${s.date}: ${domainName(s.domain)} (${s.type}) scored ${s.rawScore}`);
    }
  }
  // Recent WRITTEN reflections — what the person actually SAID in their practices, so the coach
  // can refer back to it instead of "I don't have that." Guardrails (interior excluded, distress
  // excluded) live in recentReflections(), the single shared source for this + the offline recall.
  const clip = (str) => { const x = String(str).trim(); return x.length > 200 ? x.slice(0, 197) + '…' : x; };
  const refl = recentReflections(profile, 6);
  if (refl.length) {
    lines.push('Recent reflections in their own words (refer back to these naturally when relevant):');
    for (const r of refl) {
      const bits = [];
      if (r.value) bits.push(`named “${clip(r.value)}”`);
      if (r.action) bits.push(`chose to: ${clip(r.action)}`);
      if (r.note) bits.push(`noted: ${clip(r.note)}`);
      if (r.text) bits.push(`reflected: ${clip(r.text)}`);
      if (bits.length) lines.push(`  - ${r.date} (${domainName(r.domain)}): ${bits.join('; ')}`);
    }
  }
  // Per-capacity TRAJECTORY — the actual measurements over time, so the coach has their overall
  // record and can speak to growth or a dip in a specific area, not just the latest number.
  // (Interior + secondary-credit rows excluded, same walls as everything else.)
  const trajById = {};
  for (const h of (profile.history || [])) {
    if (h.domain === 'interior' || String(h.exerciseType || '').endsWith('-secondary') || h.rawScore == null) continue;
    (trajById[h.domain] || (trajById[h.domain] = [])).push(h.rawScore);
  }
  const trajIds = Object.keys(trajById).filter((id) => trajById[id].length >= 2);
  if (trajIds.length) {
    lines.push('Measurement trajectory by capacity (their own scores, oldest → newest):');
    for (const id of trajIds) lines.push(`  - ${domainName(id)}: ${trajById[id].slice(-6).join(' → ')}`);
  }
  // FOCUSED deep-dive: a per-domain coach thread is ABOUT one capacity — give the coach that
  // capacity's fuller record so it can track and grow it over time. (focusDomain is never interior.)
  if (focusDomain && focusDomain !== 'interior') {
    const dn = domainName(focusDomain);
    const fl = [`--- THIS CONVERSATION IS ABOUT: ${dn.toUpperCase()} ---`];
    if (scores[focusDomain] != null) fl.push(`Current ${dn}: ${scores[focusDomain]} [${bandFor(scores[focusDomain]).label}].`);
    if (trajById[focusDomain]) fl.push(`${dn} over time: ${trajById[focusDomain].join(' → ')}.`);
    const dRefl = recentReflections(profile, 50).filter((r) => r.domain === focusDomain).slice(-6);
    for (const r of dRefl) {
      const bits = [];
      if (r.value) bits.push(`named “${clip(r.value)}”`);
      if (r.action) bits.push(`chose to: ${clip(r.action)}`);
      if (r.note) bits.push(`wrote: “${clip(r.note)}”`);
      if (r.text) bits.push(`reflected: “${clip(r.text)}”`);
      if (bits.length) fl.push(`  - ${r.date}: ${bits.join('; ')}`);
    }
    fl.push(`Stay with ${dn}: refer to this trajectory and their own words, help them notice what's working, and grow it over time. This thread is the running record of that.`);
    lines.push(fl.join('\n'));
  }
  if (profile.streak?.current) lines.push(`Current streak: ${profile.streak.current} day(s).`);
  const openGoals = (profile.goals || []).filter((g) => !g.done);
  if (openGoals.length) lines.push(`Active goals: ${openGoals.map((g) => g.coping ? `${g.text} (if-then plan: if ${g.coping.when}, I’ll ${g.coping.then})` : g.text).join(' | ')}`);
  lines.push('');
  lines.push(growthReference());
  return lines.join('\n');
}

// A compact, evidence-based growth-levers reference so the coach can DIRECT growth with
// concrete grounded options on whatever capacity the person raises — offered as honest
// habits that build the capacity over time, NEVER as a fix or a prescription. Interior is
// excluded (the faith track never enters any API context). Titles only, to stay tight.
function growthReference() {
  const lines = ['Evidence-based growth levers you may OFFER as concrete options (habits that build the capacity over time — never a quick fix; the person chooses what is theirs):'];
  for (const d of DOMAINS) {
    if (d.id === 'interior') continue;
    const g = GROWTH_GUIDE[d.id];
    if (g && g.length) lines.push(`  - ${d.name}: ${g.map((x) => x.title).join('; ')}`);
  }
  return lines.join('\n');
}

// The single network call for ALL live coaching — directly from the browser, with
// the user's own key, to whichever provider they chose (Claude by default). This is
// the ONLY place provider differences live: it resolves provider/key/model from the
// profile, then hands PRIMITIVES to a pure adapter (llm.js) for request-shaping and
// response-parsing. Everything above it — the system prompt, the interior/faith
// scrub (profileSummary), the crisis gate — stays provider-agnostic, so no provider
// can bypass a guardrail. Adapters never receive the profile.
async function callLLM(profile, { system, messages, maxTokens = 1024 }) {
  const p = providerFor(profile.settings?.provider);
  const key = (profile.settings?.apiKey || '').trim();
  const mdl = profile.settings?.model || p.defaultModel;
  const res = await fetch(p.endpoint(mdl, key), {
    method: 'POST',
    headers: p.headers(key),
    body: JSON.stringify(p.buildBody({ model: mdl, system, messages, maxTokens })),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${p.label} API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  return p.parseResponse(data);
}

// --- Interpretive feedback on the baseline (onboarding) ---
export async function interpretBaseline(profile) {
  const offline = ruleInterpretBaseline(profile.baseline.domainScores, profile.settings?.name);
  if (!hasKey(profile)) return { text: offline, live: false };
  try {
    const text = await callLLM(profile, {
      system: FORMA_SYSTEM,
      maxTokens: 900,
      messages: [
        {
          role: 'user',
          content: `This person just completed their baseline Forma assessment. Here is their data:\n\n${profileSummary(profile)}\n\nWrite their opening interpretation: warm, honest, specific to these numbers. Name their clearest strength and their biggest growth opening, and frame the whole thing as a starting line. 3-4 short paragraphs.\n\nIMPORTANT — honesty about what this is: the baseline is SELF-REPORT only. They rated themselves on a few statements; nothing has been performance-measured yet. So name the strength and the opening as how they SEE themselves right now, not as measured findings, and say plainly that the sessions are where Forma actually measures — and where these self-ratings will be tested or refined. Do not present a self-rating as a verdict.`,
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
  // Privacy invariant: an Spiritual Life (faith) session is never sent to the API
  // — not even its name/score. The rule-based insight is generated on-device so
  // the spiritual track keeps its "stays on your device" promise in fact. (The
  // shared profileSummary already omits interior; this guards the session line
  // dailyInsight emits directly.)
  if (session.domain === 'interior') return { text: offline, live: false };
  try {
    const text = await callLLM(profile, {
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
// NOTE: stems that continue into longer words (suicid→suicide/suicidal, overdos→overdose/
// overdosing) MUST sit OUTSIDE the trailing \b — a \b right after "suicid" demands a boundary
// before the next letter, which never exists, so "suicide"/"suicidal" silently slipped through
// (the single highest-stakes false negative; fixed v258). They get a leading-only boundary.
const CRISIS_PATTERN = /\b(suicid|overdos)|\b(kill(ing)? myself|hang myself|end(ing)? (my|it) (life|all)|tak(e|ing) my (own )?life|tak(e|ing) all my pills|want to die|wanna die|just want to die|wish I (could )?(just )?die|want (it|this|things) (all )?to end|want it (all )?to be over|don'?t want to (live|be here|be alive|exist|wake up|go on)|not want to (live|be alive|wake up)|wish I (was|were|wasn'?t) (dead|here|alive)|wish I (could )?(just )?disappear|wish I (wouldn'?t|didn'?t) wake up|wish I (was|were)n'?t born|wish I was never born|(hurt|harm)(ing)? myself|self[-\s]?harm(ing|ed)?|cutting again|cut(ting)? (myself|my (wrist|arm|thigh|leg|skin)s?)|slit (my )?wrists?|no reason to live|nothing (left )?to live for|(isn'?t|not|aren'?t) worth living|better off (dead|without me)|would be better off (if I (was|were) )?(gone|dead)|no point (in )?(living|going on|being here)|give up on life|can'?t go on)\b/i;

export function looksLikeDistress(text) {
  return CRISIS_PATTERN.test(text || '');
}

export const ESCALATION_MESSAGE =
  "I'm really glad you said that to me — and I want to be honest: what you're describing is heavier than a formation app should carry, and you deserve a real person for it, not an algorithm.\n\n" +
  'Please reach out right now to someone you trust, or to a trained human who can help. In the US you can call or text 988 (the Suicide & Crisis Lifeline), any time, day or night. Anywhere else, your local emergency number or a crisis line in your country can connect you with someone immediately. If you are in immediate danger, please call emergency services.\n\n' +
  "I'll be here for the formation work whenever you're ready — but let a real person be with you in this first.";

// Proactive support resources — the SAME help the reactive ESCALATION_MESSAGE points to,
// surfaced as a calm, always-available list so a person never has to disclose distress to
// find help. Structured (not prose) so the UI renders it consistently and it lives in ONE
// place. Internationally aware: no assumption the user is in the US.
export const SUPPORT_RESOURCES = [
  { label: 'Someone you trust', detail: 'A friend, a family member, someone close. Telling one real person is often the first and most important step.' },
  { label: 'Call or text 988 (US)', detail: 'The Suicide & Crisis Lifeline — free, confidential, any time, day or night.', href: 'tel:988' },
  { label: 'Outside the US', detail: 'findahelpline.com lists free, confidential crisis lines in your own country.', href: 'https://findahelpline.com' },
  { label: 'If anyone is in immediate danger', detail: 'Call your local emergency number right away.' },
];

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

export async function coachReply(userText, profile, opts = {}) {
  // Safety first, before anything else — and before any network call.
  if (looksLikeDistress(userText)) {
    return { text: ESCALATION_MESSAGE, live: false, escalated: true };
  }
  // opts.log = the active THREAD's messages (general = coachLog, or a per-domain thread);
  // opts.focusDomain = the capacity this thread is about, so the context is focused on it.
  // Interior is NEVER a valid coach focus (the faith track is walled from the API).
  const log = opts.log || profile.coachLog;
  const focusDomain = (opts.focusDomain && opts.focusDomain !== 'interior') ? opts.focusDomain : null;

  if (!hasKey(profile)) {
    return {
      text: offlineCoachReply(userText, profile, { log, focusDomain }),
      live: false,
    };
  }
  try {
    const messages = buildCoachMessages(log, userText);
    // The GENERAL/main chat can see every other conversation (domain chats + archived history)
    // as context, so it stays the informed hub. A focused domain thread keeps to its own area.
    const digest = !focusDomain ? coachThreadsDigest(profile) : '';
    const system = `${FORMA_SYSTEM}\n\n--- THE PERSON YOU ARE COACHING ---\n${profileSummary(profile, focusDomain)}`
      + (digest ? `\n\n--- THEIR OTHER COACH CONVERSATIONS (refer to these naturally when relevant) ---\n${digest}` : '');
    const text = await callLLM(profile, {
      system,
      maxTokens: 1024,
      messages,
    });
    return { text: text || offlineCoachReply(userText, profile, { log, focusDomain }), live: !!text };
  } catch (e) {
    // Surface the plain-language reason (not the raw body) so the person can
    // actually fix it — e.g. the API-billing-vs-Max case.
    return {
      text: `Live coaching couldn't reach your AI provider: ${friendlyApiError(e.message)}\n\nIn the meantime, here's what Forma sees in your own data:\n\n${offlineCoachReply(userText, profile, { log, focusDomain })}`,
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
export function offlineCoachReply(userText, profile, opts = {}) {
  const t = (userText || '').toLowerCase();
  const scores = (profile && profile.domainScores) || {};
  // In a per-domain coach thread, opts.focusDomain biases the open-ended fallback toward that
  // capacity; opts.log is the active thread (so mid-conversation detection reads the right history).
  const focusDomain = (opts.focusDomain && opts.focusDomain !== 'interior') ? opts.focusDomain : null;
  const threadLog = opts.log || (profile && profile.coachLog) || [];

  // 0) RECALL — "what did I say/write/name about X", "remind me what I said". Even offline, the
  // coach should be able to read back the person's OWN recorded reflections (the value they named,
  // the step they chose), so it doesn't answer "I don't have that" when the data is on-device.
  if (/\b(what (did|do) i (say|said|write|wrote|name|named|put|mean)|did i (say|write|mention|name)|remind me what i (said|wrote|named|chose)|what i (said|wrote|named)|earlier i (said|wrote|named)|what did i.*(stand for|live for|value))\b/.test(t)) {
    const refs = recentReflections(profile, 12);
    if (refs.length) {
      const STOP = new Set(['what', 'about', 'earlier', 'said', 'say', 'write', 'wrote', 'name', 'named', 'mean', 'that', 'this', 'with', 'from', 'your', 'mine', 'have', 'just', 'like', 'really', 'think', 'thing', 'stuff', 'remind', 'tell', 'again', 'before', 'when', 'where', 'which', 'were', 'would', 'could', 'there']);
      const words = t.split(/[^a-z0-9’']+/).filter((w) => w.length >= 4 && !STOP.has(w));
      const matches = (r) => {
        const hay = `${r.value} ${r.action} ${r.note} ${r.text}`.toLowerCase();
        return words.some((w) => hay.includes(w));
      };
      const hit = refs.slice().reverse().find(matches) || refs[refs.length - 1];
      const bits = [];
      if (hit.value) bits.push(`you named **${hit.value}**`);
      if (hit.action) bits.push(`you chose to: ${hit.action}`);
      if (hit.note) bits.push(`you wrote: “${hit.note}”`);
      if (hit.text) bits.push(`you reflected: “${hit.text}”`);
      if (bits.length) {
        return `Looking back at your practices — on ${hit.date}, in ${domainName(hit.domain)}, ${bits.join('; ')}. `
          + `Does that match what you were reaching for? And is it still true for you now, or has it shifted?`;
      }
    }
    return `I can only see what you've recorded in your practices, and I don't have a written note that matches that yet — so I won't guess. `
      + `If you tell me what it was, we can pick it back up: what were you trying to get back to?`;
  }

  // 1) They named a capacity → open solution-focused, NOT with the number. Leading
  // with "X is sitting at 34 — emerging" hands the score back as a verdict, which
  // FORMA_SYSTEM's scaling rule (v80) forbids and which coachGreeting/sessionOpener
  // already avoid; a low band pinned to a low number on first mention reads as a
  // grade, not a starting line. Start from the exception, where growth is built.
  const named = domainFromText(t);
  if (named && scores[named.id] != null) {
    const low = named.name.toLowerCase();
    const g = named.id !== 'interior' ? growthFor(named.id) : null;
    const lever = g ? `\n\nAnd when you want a concrete place to start, one evidence-based way to grow it: **${g[0].title}** — ${g[0].how}` : '';
    return `Let's start with your ${low}. Forget the number for a second — `
      + `when has it gone *better* than usual, even a little? `
      + `What was different about that day — what were you already doing that helped? We build from that, not from willpower.${lever}`;
  }

  // 2) "What should I work on?" → the most room to grow, but their choice leads.
  if (/\b(work on|where (do|should) i (start|begin)|where to start|focus on|what next|what should i)\b/.test(t)) {
    const lowest = lowestScoredDomain(scores);
    if (lowest) {
      const g = lowest !== 'interior' ? growthFor(lowest) : null;
      const lever = g ? ` If you want a concrete, evidence-based option for it: **${g[0].title}** — ${g[0].how}` : '';
      return `On the numbers, ${domainName(lowest)} has the most room right now. But the better question is which one you actually *want* to grow — formation sticks when it's yours to choose, not assigned.${lever} Which one pulls at you, and what's one small step you could take this week?`;
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

  // 2d) Discord — frustration aimed at the COACH or the app itself, not at a
  // suggestion (2c handles that). In MI terms this is a rupture in the alliance,
  // and it's the highest-stakes moment in the always-available offline mode: a
  // skeptical user testing whether this is a real coach or just keyword-matching.
  // Don't defend, don't problem-solve, don't mine it as a half-formed answer —
  // name the rupture, take it as fair information, and hand control back. Must
  // precede the struggle branch (3) and the short continuation default (4b), or a
  // brief "this is dumb" mid-chat gets swallowed and answered as if it were content.
  if (
    /this is (stupid|dumb|pointless|useless|a waste|ridiculous|garbage|nonsense)/.test(t)
    || /this (is ?n['’]?t|isnt|is not|ai ?n['’]?t) (helping|working)/.test(t)
    || /waste of (my )?time/.test(t)
    || /(you ?['’]?re|youre|you are) (useless|wrong|a robot|not helping|no help|the worst|pointless)/.test(t)
    || /(that|it)( ?['’]?s| is) (really |just )?not helping/.test(t)
    || /you (do ?n['’]?t|don['’]?t) (get|understand)/.test(t)
    || /\b(hate (this|you|it)|leave me alone)\b/.test(t)
    || /why am i (even )?(doing|talking|here|bothering)/.test(t)
  ) {
    return `That's fair — and I'd rather hear it than have you go quiet on me. `
      + `I'm not going to talk you out of it: if this isn't landing, that's real information, not something to argue with. `
      + `What would actually be useful right now — a different question, something off your chest, or nothing for a minute?`;
  }

  // 3) Struggle / hard feelings → WITNESS first, then offer to explore (SFBT/MI:
  // don't fire an exception question at someone who only said they hurt — premature
  // problem-solving reads as "you're not listening." Acknowledge, then let them
  // choose to be heard or to look at it.)
  if (/\b(struggl|stuck|hard|can'?t|cannot|difficult|frustrat|overwhelm|tired|exhaust|fail|behind|stress|anx|angry|anger|\bsad\b|lonely|afraid|scared|worried|hopeless)\w*/.test(t)) {
    return `That sounds genuinely hard, and I'm glad you said it plainly. We don't have to fix anything right now — naming it honestly is already something. `
      + `Do you want to stay with it for a moment, or look at it together and find one small place to start?`;
  }

  // 4) A win → amplify it and ask how to repeat it.
  if (/\b(better|good|great|proud|did it|progress|improv|won|breakthrough|easier|clicked|finally)\w*/.test(t)) {
    return `That's worth pausing on — name it before it slips past. What made it possible? `
      + `If you wanted one more day like that this week, what's the smallest thing you'd repeat on purpose?`;
  }

  // 4b) A short, generic CONTINUATION of an ongoing conversation. The offline coach
  // is otherwise stateless, so a bare "yes" / "ok" / "not really" would fall to the
  // default below and RE-ASK — reading as "not listening." Only fires when we're
  // genuinely mid-conversation (a prior coach turn exists in coachLog) and the reply
  // matched none of the richer branches above (named-domain, work-on, I-don't-know,
  // pushback, struggle, win). Carry the thread forward; no API, no echoing prior text.
  const lastCoach = threadLog.slice().reverse().find((m) => m && m.role === 'assistant');
  if (lastCoach && t.length <= 24) {
    if (/^(yes|yeah|yep|sure|ok|okay|i think so|kind of|sort of|exactly|right|true|it did|i did)\b/.test(t)) {
      return `Good — stay with that. What did it look like, concretely, the last time it happened?`;
    }
    if (/^(no|nope|not really|don'?t think so|it didn'?t|i didn'?t)\b/.test(t)) {
      return `Fair enough. What would have to be different for it to feel even a little possible?`;
    }
    return `Say a bit more — even a rough, half-formed answer is the useful part. What's underneath it?`;
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

  // 6) Default → reflect, ask one solution-focused question, ground in real data. In a per-domain
  // thread, anchor on THAT capacity so the conversation stays about the area they came to discuss.
  const patterns = weeklyPatterns(profile);
  const one = patterns && patterns.length ? patterns[0] : null;
  if (focusDomain) {
    const fd = DOMAINS.find((d) => d.id === focusDomain);
    const fname = fd ? fd.name.toLowerCase() : 'this';
    const g = growthFor(focusDomain);
    const lever = g ? ` If you want one concrete place to start: **${g[0].title}** — ${g[0].how}` : '';
    return `Let's stay with your ${fname}. Forget the number for a second — when has it gone even a little better than usual lately, and what was different that day? We build from that.${lever}`
      + (one ? `\n\nOne thing Forma already notices: ${one}` : '')
      + `\n\n(Add your own API key (any provider) in Settings and I can talk this through live — reading your full record for this capacity.)`;
  }
  return `I'm here — tell me a bit more about what's on your mind. `
    + `And a solution-focused place to begin: when did this last go even slightly the way you'd want it to?`
    + (one ? `\n\nOne thing Forma already notices in your data: ${one}` : '')
    + `\n\n(Add your own API key (any provider) in Settings and I can talk this through live — reading your full history.)`;
}

// --- Vignette scoring (the AI-scored communication/EI exercise) ---
// A person spoke (or typed) how they'd respond to a charged interpersonal
// scenario; Claude scores the transcript on a relational-presence rubric and
// returns one piece of formative feedback. Growth-framed, never clinical.
const VIGNETTE_SYSTEM = `You are scoring a Forma communication exercise. You are NOT diagnosing anyone and you never use clinical language. A person was given a charged interpersonal scenario and said how they would respond. Rate that response 0–100 on how well it embodies real relational presence and emotional intelligence: did they attune to the other person's emotional reality before fixing, advising, or defending? Perspective-taking, warmth, clarity, non-defensiveness and repair. Reward genuine listening over clever solutions. A clumsy but warm, present response should outscore a polished but defensive or fix-it-first one.

If a DEVELOPMENTAL SCALE is given, PLACE the response on it and let that anchor your score: Emerging → 0–39, Developing → 40–59, Strong → 60–79, Thriving → 80–100. A response too thin to show real evidence cannot score above Developing. In your feedback, name where they are on the path and what the next level up looks like — a direction, never a verdict.

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
  // Safety guardrail (v259): a free-text answer can carry a crisis disclosure. Escalate BEFORE any
  // API call or scoring — never transmit distress to the model, never score a disclosure (mirrors
  // coachReply + the diagnostic onboarding). Checked before the key gate, so it protects keyless users too.
  if (looksLikeDistress(transcript)) return { score: null, feedback: ESCALATION_MESSAGE, escalated: true };
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
      messages: [{ role: 'user', content: `Scenario: ${vignette.scenario}\n\nThe prompt they answered: ${vignette.prompt}${scaleBlockFor('communication')}\n\nTheir response: "${transcript}"\n\nScore it.` }],
    });
    return parseVignette(text) || soft;
  } catch {
    return soft;
  }
}

// --- Sentence-completion scoring (Rotter RISB lineage, formative not clinical) ---
const SENTENCES_SYSTEM = `You are scoring a Forma self-reflection exercise: a person finished several incomplete sentences. You are NOT diagnosing — never use clinical or pathologizing language. Rate 0–100 how much honest self-awareness and coherence the completions show: candor over deflection, emotional specificity (a real feeling named, not "fine"), and the sense of someone who actually knows themselves. Reward honesty over polish; a raw, true completion outscores a guarded, clever one. Blank or evasive answers score lower, but gently.

If a DEVELOPMENTAL SCALE is given, PLACE the completions on it and let that anchor your score: Emerging → 0–39, Developing → 40–59, Strong → 60–79, Thriving → 80–100. Completions too thin to show real evidence cannot score above Developing. In your feedback, name where they are on the path and what the next level up looks like — a direction, never a verdict.

Return ONLY a JSON object: {"score": <0-100>, "feedback": "<2-3 sentences, second person, warm and plain: one thing their answers quietly reveal that's worth seeing, and one gentle invitation to look further. No clinical language, no scores in the prose, no preamble.>"}`;

export async function scoreSentences(stems, completions, profile) {
  // Safety guardrail (v259): sentence-completion is a projective exercise designed to surface honest
  // inner feelings — a completion can be a crisis disclosure. Escalate BEFORE any API call or scoring,
  // and before the key gate (protects keyless users too) — never transmit/score a disclosure.
  if (looksLikeDistress((completions || []).join('\n'))) return { score: null, feedback: ESCALATION_MESSAGE, escalated: true };
  if (!hasKey(profile)) return null;
  // Validity guard: feedback but NO score (null) on failure — see scoreVignette.
  const soft = { score: null, feedback: "Even half-finishing these honestly is worth something — self-knowledge starts with the willingness to look. Next time, try the first true thing that comes, before you tidy it up." };
  try {
    const pairs = stems.map((st, i) => `"${st} …" → "${(completions[i] || '').trim()}"`).join('\n');
    const text = await complete(profile, {
      system: SENTENCES_SYSTEM,
      maxTokens: 500,
      messages: [{ role: 'user', content: `Their sentence completions:\n${pairs}${scaleBlockFor('self_knowledge')}\n\nScore them.` }],
    });
    return parseVignette(text) || soft;
  } catch {
    return soft;
  }
}

// --- Reflection scoring (v320): the reflection exercises (persistence, agency, presence, values)
// collect honest written sentences but used to score ONLY by the 1–5 self-rating — "how did you
// think you did?" giving yourself the grade. This judges the WRITTEN CONTENT instead: AI reads
// the reflection and scores the actual evidence of the capacity, with the self-rating kept only
// as a keyless fallback (scoreExercise). Same guardrails as scoreVignette: distress-escalation
// before any API call, key-gated, and NULL (never a fabricated number) when it can't truly judge.
const REFLECTION_SYSTEM = `You are scoring a Forma formation reflection. You are NOT diagnosing — never use clinical or pathologizing language. A person wrote a few honest sentences reflecting on a human capacity they are forming. Rate 0–100 how much the reflection shows GENUINE evidence of that capacity at work: honest self-awareness, concrete specifics from real life (a real situation, choice, tension, or feeling named — not platitudes), and ownership over deflection. Reward candor and concreteness over polish or length; a short but specific, honest reflection outscores a long generic one. Judge the SUBSTANCE, never the writing quality. Blank, vague, or evasive answers score lower — but gently.

If a DEVELOPMENTAL SCALE is given, PLACE the reflection on it and let that anchor your score: Emerging → 0–39, Developing → 40–59, Strong → 60–79, Thriving → 80–100. A reflection too short or thin to show real evidence cannot score above Developing — there is not enough there to judge Strong or Thriving. In your feedback, name in plain words where they are on that path now and what the next level up would actually look like in real life — a direction, never a verdict.

Return ONLY a JSON object: {"score": <0-100>, "feedback": "<2-3 sentences, second person, warm and plain: where they are on the path and what the next step up looks like, grounded in something specific they wrote. No clinical language, no scores or band names in the prose, no preamble.>"}`;

// Build the developmental-scale + judge-note block for a capacity rubric, by capacity id. Used by the
// vignette (communication) and sentence (self_knowledge) judges; scoreReflection gets its markers via
// the caller's context (looked up by domain there).
function scaleBlockFor(rubricId) {
  const rub = rubricFor(rubricId);
  if (!rub) return '';
  const scale = rubricScaleText(rub.markers);
  if (!scale) return '';
  const note = rub.judgeNote ? `\n\nCapacity-specific scoring guidance: ${rub.judgeNote}` : '';
  return `\n\nDevelopmental scale for this capacity (place them on it):\n${scale}${note}`;
}

export async function scoreReflection(context, text, profile) {
  // Safety guardrail: a reflection can carry a crisis disclosure. Escalate BEFORE any API call or
  // scoring, and before the key gate (protects keyless users too) — never transmit/score distress.
  if (looksLikeDistress(text)) return { score: null, feedback: ESCALATION_MESSAGE, escalated: true };
  if (!hasKey(profile)) return null; // keyless → caller falls back to the self-rating
  const soft = { score: null, feedback: "Saved — adding an API key in Settings lets the coach read what you wrote and reflect it back. Either way, the honest looking is the rep." };
  try {
    const scale = (context && context.markers) ? rubricScaleText(context.markers) : '';
    const scaleBlock = scale ? `\n\nDevelopmental scale for this capacity (place them on it):\n${scale}` : '';
    // Capacity-specific judge guidance grounded in the source instrument — e.g. Values requires a
    // named concrete action; Self-knowledge caps over-certainty (confident self-narration ≠ insight).
    const noteBlock = (context && context.judgeNote) ? `\n\nCapacity-specific scoring guidance: ${context.judgeNote}` : '';
    const out = await complete(profile, {
      system: REFLECTION_SYSTEM,
      maxTokens: 500,
      messages: [{ role: 'user', content: `Capacity being formed: ${(context && context.capacity) || 'this capacity'}\n\nThe reflection prompt: ${(context && context.prompt) || ''}${scaleBlock}${noteBlock}\n\nWhat they wrote: "${text}"\n\nScore it.` }],
    });
    return parseVignette(out) || soft; // reuses the shared {score,feedback} JSON parser
  } catch {
    return soft;
  }
}

// Generic completion helper so other modules (e.g. the Diagnostic Agent) can
// reuse the same browser-direct Claude plumbing and the user's key/model.
export async function complete(profile, { system, messages, maxTokens = 1024 }) {
  return callLLM(profile, { system, messages, maxTokens });
}

export { weeklyPatterns };
