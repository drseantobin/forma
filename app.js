// app.js — Forma UI controller. Vanilla JS SPA, no build step.
// Renders views into #app and persists everything locally via profile.js.

import { DOMAINS, getDomain, bandFor, activeDomainIds, BANDS } from './src/domains.js';
import { LIKERT_SCALE, LIKERT_POINTS, baselineByDomain, BASELINE_ITEMS, ALL_ITEMS } from './src/assessments.js';
import { pickExercise, nextMathProblem, shuffledIndices, exerciseMode } from './src/exercises.js';
import { domainScoresFromBaseline, scoreExercise, formationIndex } from './src/scoring.js';
import {
  todayStr, streakAlive, domainTrend, sparklinePath, radarGeometry, daysBetween, startRoute, indexTrend, isLapsedReturn,
} from './src/progress.js';
import { recommendFocus, weeklyPatterns, dailyInsight as ruleDailyInsight, interpretBaseline as ruleInterpretBaseline } from './src/insights.js';
import * as Profile from './src/profile.js';
import * as Coach from './src/coach.js';
import * as Diagnostic from './src/diagnostic.js';
import * as Proof from './src/proof.js';
import * as Planner from './src/planner.js';
import { bandAscension, ascensionLine, streakMilestone, nextStreakMark } from './src/milestones.js';
import { confidenceTag, confidence, milestoneEligible, indexConfidence } from './src/reliability.js';
import { basisFor } from './src/methods.js';
import { buildSnapshot, snapshotText } from './src/snapshot.js';
import * as Orchestrator from './src/orchestrator.js';
import * as Research from './src/research.js';
import * as Contact from './src/contact.js';
import { PROVIDERS, providerFor, defaultModelFor } from './src/llm.js';
import { speechSupported, createRecognizer } from './src/speech.js';
import { createTones } from './src/audio.js';
import * as Team from './src/team.js';

const DOMAIN_ORDER = DOMAINS.map((d) => d.id);
// The domains to display for the current user (adds Interior Life when the
// opt-in faith track is on).
function domainOrder() {
  return activeDomainIds(state.profile && state.profile.settings && state.profile.settings.faithTrack);
}
const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');

const state = {
  profile: Profile.loadProfile(),
  route: 'home',
  // transient view state
  onboard: { step: 0, responses: {}, mode: null, showKey: false, faithTrack: false },
  diag: { messages: [], ready: false, busy: false, error: '' },
  session: null, // active exercise flow
};

// Reflect a previously-saved faith-track preference in the onboarding toggle.
if (state.profile && state.profile.settings && state.profile.settings.faithTrack) {
  state.onboard.faithTrack = true;
}

function save() { Profile.saveProfile(state.profile); }
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function prefersReducedMotion() {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
// Animate an element's text from 0 to target (skips under reduced-motion).
function countUp(el, target, ms = 650) {
  if (!el) return;
  if (prefersReducedMotion()) { el.textContent = target; return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min(1, (now - start) / ms);
    el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
    if (t < 1) requestAnimationFrame(step); else el.textContent = target;
  };
  requestAnimationFrame(step);
}
// Resolve to `fallback` if `promise` doesn't settle within `ms` (stalled API).
function raceTimeout(promise, ms, fallback) {
  return Promise.race([promise, new Promise((res) => setTimeout(() => res(fallback), ms))]);
}
// Seed a solution-focused coach opener tied to an interpretation, then open the
// Coach — so coaching is embedded right where the person sees their result.
async function talkThrough(ctx) {
  state.profile = state.profile || Profile.createProfile();
  const p = state.profile;
  p.coachLog = p.coachLog || [];
  // Drop the rule-based opener in immediately so the Coach is never blank...
  const opener = { role: 'assistant', content: Coach.solutionFocusedOpener(p, ctx), ts: Date.now(), opener: true };
  p.coachLog.push(opener);
  save();
  go('coach');
  // ...then, with a key, replace it with a live opener tied to this exact
  // session + insight — but only if the person hasn't already started talking.
  if (Coach.hasKey(p)) {
    const live = await raceTimeout(Coach.sessionOpener(p, ctx), 9000, null);
    const last = p.coachLog[p.coachLog.length - 1];
    if (live && live.live && live.text && state.route === 'coach' && last === opener) {
      opener.content = live.text;
      opener.live = true;
      save();
      renderCoach();
    }
  }
}

// ---------------- router ----------------
function go(route) {
  // Leaving an active session: stop any running countdown so it can't fire
  // against a stale view.
  if (route !== 'session' && state.session && state.session._timer) {
    clearInterval(state.session._timer);
    state.session._timer = null;
  }
  // Leaving a contemplation mid-silence: release the audio context too.
  if (route !== 'session' && state.session && state.session._tones) {
    state.session._tones.close();
    state.session._tones = null;
  }
  if (route !== 'session' && state.session && state.session._raf) {
    cancelAnimationFrame(state.session._raf);
    state.session._raf = null;
  }
  // Leaving the Focus Check: clear its pending timer so a stale closure can't
  // log a bogus reaction time.
  if (route !== 'focuscheck' && state._focus && state._focus._t) {
    clearTimeout(state._focus._t);
    state._focus = null;
  }
  // Leaving a vignette mid-recording: stop the mic.
  if (route !== 'session' && state.session && state.session.recognizer) {
    try { state.session.recognizer.stop(); } catch (e) { /* noop */ }
    state.session.recognizer = null;
  }
  state.route = route;
  render();
  window.scrollTo(0, 0);
  focusViewHeading();
}

// Accessibility: after a navigation, move keyboard/screen-reader focus into the
// new view's heading (otherwise focus is stranded on the tapped tab and SR users
// don't hear the new content). If the view already focused something meaningful
// inside the content (e.g. the coach's text input), leave that alone.
function focusViewHeading() {
  const ae = document.activeElement;
  if (ae && ae !== app && app.contains(ae)) return; // view set its own focus
  const h = app.querySelector('h1, h2');
  const target = h || app;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
}

function ensurePlan() {
  const p = state.profile;
  if (!p || !p.baseline) return;
  if (Planner.planIsStale(p.plan, todayStr())) {
    p.plan = Planner.generatePlan(p);
    save();
  }
}

// The dictation recognizer from the most recent attachMicButton, tracked so a
// re-render (navigating away, or any in-view update) can stop it — otherwise the
// orphaned recognizer keeps the mic listening after its button is gone (privacy).
let _activeMic = null;
function stopActiveMic() {
  if (_activeMic) { try { _activeMic.stop(); } catch (e) { /* noop */ } _activeMic = null; }
}

function render() {
  // Any pending re-render destroys the current DOM (incl. mic buttons) — stop a
  // live dictation mic first so it can never be left listening.
  stopActiveMic();
  // A profile always exists in memory so Coach/Settings work before the
  // baseline is done (and so nothing reads a null profile).
  state.profile = state.profile || Profile.createProfile();
  const onboarded = !!state.profile.baseline;

  // Tabs are always visible; highlight the active one.
  tabbar.hidden = false;
  [...tabbar.querySelectorAll('.tab')].forEach((t) => {
    const on = t.dataset.route === state.route;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });

  if (!onboarded) {
    // Before the baseline exists: Coach and Settings are usable; every other
    // tab brings you into the short setup (which is "home" until it's done).
    if (state.route === 'coach') return renderCoach();
    if (state.route === 'settings') return renderSettings();
    return renderOnboarding();
  }
  ensurePlan();

  switch (state.route) {
    case 'home': return renderHome();
    case 'session': return renderSession();
    case 'progress': return renderProgress();
    case 'plan': return renderPlan();
    case 'team': return renderTeam();
    case 'methods': return renderMethods();
    case 'snapshot': return renderSnapshot();
    case 'proof': return renderProof();
    case 'focuscheck': return renderFocusCheck();
    case 'coach': return renderCoach();
    case 'settings': return renderSettings();
    default: return renderHome();
  }
}

tabbar.addEventListener('click', (e) => {
  const t = e.target.closest('.tab');
  if (t) go(t.dataset.route);
});

// ---------------- onboarding ----------------
function renderOnboarding() {
  // Single source of truth for the faith track is the saved setting (the
  // Settings tab can now toggle it mid-setup).
  state.onboard.faithTrack = !!(state.profile && state.profile.settings && state.profile.settings.faithTrack);
  if (state.onboard.mode === 'conversation') { renderConversationalOnboarding(); return; }

  const groups = baselineByDomain(activeDomainIds(state.onboard.faithTrack));
  const step = state.onboard.step;
  // Persist quick-check progress so an interruption resumes here, not at step 0.
  Profile.saveOnboard({ step, responses: state.onboard.responses });

  if (step === 0) {
    const needKey = state.onboard.showKey && !Coach.hasKey(state.profile);
    app.innerHTML = `
      <div class="fade-in">
        <div class="hero">
          <div class="glyph">✦</div>
          <h1>Forma</h1>
          <p class="lede">AI keeps getting better at the work. The quieter question is who you become while it does.</p>
          <p class="muted small" style="max-width:32rem; margin:12px auto 0; line-height:1.5;">Forma measures and trains the human capacities that grow more valuable as the machines take the rest — attention, judgment, deep reading, presence, the patience to stay with what's hard. A few minutes a day.</p>
        </div>
        <div class="pillrow">
          ${DOMAINS.map((d) => `<span class="pill" title="${esc(d.short)}">${d.icon} ${esc(d.name)}</span>`).join('')}
        </div>
        <div class="card">
          <div class="eyebrow">How it works</div>
          <ol class="howitworks">
            <li>A short read on where you stand today — your profile across every capacity.</li>
            <li>One small, targeted practice a day, chosen for where you'll grow most.</li>
            <li>Watch the scales move over weeks — your own auditable record, never a diagnosis.</li>
          </ol>
        </div>
        <div class="card">
          <p><strong>First, a read on where you are today.</strong> Either way builds the same profile, then today's practice from it — pick how you'd like to begin.</p>
        </div>
        <div class="stack">
          <button class="btn amber" id="start">Quick check · ~${Math.max(3, Math.round(BASELINE_ITEMS.length * 7 / 60))} min →</button>
          <button class="btn ghost" id="talk">Talk it through with the coach →</button>
        </div>
        <p class="muted small center" style="margin-top:12px;">The quick check is ${BASELINE_ITEMS.length} honest ratings across your capacities — a short self-assessment that works offline. The conversation is an adaptive interview that writes your profile — it uses your own Claude key, so it stays yours.</p>
        <div class="card" style="margin-top:12px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.3rem;">🕊️</span>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:.95rem;">Interior Life track <span class="muted small">· optional</span></div>
            <div class="muted small">Bring prayer, silence, and the interior life into your formation — tended alongside the rest, kept private, and never shown to anyone but you.</div>
          </div>
          <button class="opt ${state.onboard.faithTrack ? 'selected' : ''}" id="faithtoggle" style="width:auto; padding:8px 14px; font-weight:700;">${state.onboard.faithTrack ? 'On' : 'Off'}</button>
        </div>
        ${needKey ? `
          <div class="card" style="margin-top:12px;">
            <p class="small"><strong>The conversation needs your Claude key.</strong> Paste it to talk it through, or just use the quick check above. Your key stays on this device.</p>
            <div class="field"><input id="inlinekey" type="password" placeholder="sk-ant-…" /></div>
            <button class="btn sm" id="savekeyinline">Save key & start the conversation</button>
          </div>` : ''}
        <div class="card" style="margin-top:12px; background:var(--green-soft); border-color:transparent;">
          <div class="eyebrow" style="color:var(--green);">🔒 Private by design</div>
          <p class="muted small" style="margin-top:4px;">Everything Forma learns about you stays on this device. Nothing is uploaded unless you choose to — by sharing anonymous results to improve Forma, or bringing your own key for the coach.</p>
        </div>
      </div>`;
    document.getElementById('faithtoggle').onclick = () => {
      state.onboard.faithTrack = !state.onboard.faithTrack;
      // Persist the choice immediately so it survives a reload, even before
      // the baseline is finished.
      state.profile = state.profile || Profile.createProfile();
      state.profile.settings.faithTrack = state.onboard.faithTrack;
      save();
      render();
    };
    document.getElementById('start').onclick = () => { state.onboard.step = 1; render(); };
    document.getElementById('talk').onclick = () => {
      if (Coach.hasKey(state.profile)) startConversation();
      else { state.onboard.showKey = true; render(); }
    };
    const skb = document.getElementById('savekeyinline');
    if (skb) skb.onclick = () => {
      const v = document.getElementById('inlinekey').value.trim();
      if (!v) return;
      state.profile = state.profile || Profile.createProfile();
      state.profile.settings.apiKey = v;
      save();
      startConversation();
    };
    return;
  }

  // Domain assessment screens (1..groups.length)
  const gi = step - 1;
  const group = groups[gi];
  const d = getDomain(group.domain);
  const answered = group.items.filter((i) => state.onboard.responses[i.id] != null).length;
  // Tie both the bar and the counter to OVERALL progress: the bar fills as you
  // answer within a page and jumps as you advance pages; the counter shows the
  // page you're on out of the total.
  const pct = Math.round(((gi + answered / group.items.length) / groups.length) * 100);

  app.innerHTML = `
    <div class="fade-in">
      <div class="progress-top"><div style="width:${pct}%"></div></div>
      <div class="lesson-domain">
        <span class="ico">${d.icon}</span>
        <span class="dname">${esc(d.name)}</span>
        <span class="dcount">${gi + 1} of ${groups.length} · ${groups.length - gi - 1} left</span>
      </div>
      <p class="muted small">${esc(d.blurb)}</p>
      <div class="stack" id="items">
        ${group.items.map((item) => itemHtml(item)).join('')}
      </div>
      <div class="row" style="margin-top:18px;">
        ${gi > 0 ? '<button class="btn ghost sm" id="back">← Back</button>' : '<span></span>'}
        <span class="spacer"></span>
        <button class="btn sm" id="next" ${answered < group.items.length ? 'disabled' : ''}>
          ${gi === groups.length - 1 ? 'See my profile' : 'Next →'}
        </button>
      </div>
    </div>`;

  app.querySelectorAll('.opt').forEach((b) => {
    b.onclick = () => {
      const { item, value } = b.dataset;
      state.onboard.responses[item] = Number(value);
      render();
    };
  });
  const back = document.getElementById('back');
  if (back) back.onclick = () => { state.onboard.step--; render(); };
  document.getElementById('next').onclick = () => {
    if (gi === groups.length - 1) finishBaseline();
    else { state.onboard.step++; render(); }
  };
}

function itemHtml(item) {
  const cur = state.onboard.responses[item.id];
  return `
    <div class="card" style="padding:16px;">
      <div class="likert-q" style="font-size:1rem;">${esc(item.text)}</div>
      <div class="likert-opts">
        ${LIKERT_SCALE.map((o) => `
          <button class="opt ${cur === o.value ? 'selected' : ''}" data-item="${item.id}" data-value="${o.value}" aria-pressed="${cur === o.value}">
            ${esc(o.label)}
          </button>`).join('')}
      </div>
    </div>`;
}

async function finishBaseline() {
  // Only score items for active domains — so interior answers don't leak in if
  // the faith track was toggled off mid-setup.
  const faith = !!state.onboard.faithTrack;
  const items = faith ? ALL_ITEMS : BASELINE_ITEMS;
  const scores = domainScoresFromBaseline(items, state.onboard.responses, LIKERT_POINTS);
  state.profile = state.profile || Profile.createProfile();
  state.profile.settings.faithTrack = faith;
  state.profile = Profile.applyBaseline(state.profile, scores, state.onboard.responses);
  save();
  Profile.clearOnboard(); // baseline committed — no resume state to keep
  renderBaselineResult();
}

async function renderBaselineResult() {
  const p = state.profile;
  app.innerHTML = `
    <div class="fade-in">
      <div class="brandmark"><div class="logo">F</div><div class="name">Forma</div><div class="tag">Your starting line</div></div>
      ${radarCard(p.domainScores)}
      <div class="card" id="interp">
        <div class="row"><span class="spinner"></span> <span class="muted">Reading your profile…</span></div>
      </div>
      <button class="btn ghost" id="talkbaseline" style="margin-bottom:10px;">💬 Talk through my profile with the coach →</button>
      <div class="card" id="researchconsent-card" style="text-align:left;">
        <div class="eyebrow" style="color:var(--green);">Help improve Forma — optional</div>
        <p class="muted small" style="margin-top:4px;">Share your <strong>anonymous</strong> results so we can learn what actually helps people grow. It changes nothing about your experience — and never includes your name, anything you write, or your Interior Life. Just anonymous scores.</p>
        <label class="consent-row" for="researchconsent">
          <input type="checkbox" id="researchconsent" />
          <span>Share my anonymous results to help improve Forma</span>
        </label>
        <div id="research-demo" hidden style="margin-top:12px;">
          <p class="muted small" style="margin-bottom:6px;">A few optional, anonymous details help us see what builds these capacities for different people. Leave any blank — every one is optional, and coarse on purpose so it can't identify you.</p>
          <div class="demo-grid">
            <label class="demo-field">Age<select id="demo-ageBand">
              <option value="" selected>Prefer not to say</option>
              <option value="18-24">18–24</option><option value="25-34">25–34</option>
              <option value="35-44">35–44</option><option value="45-54">45–54</option>
              <option value="55-64">55–64</option><option value="65+">65+</option>
            </select></label>
            <label class="demo-field">Sex<select id="demo-sex">
              <option value="" selected>Prefer not to say</option>
              <option value="female">Female</option><option value="male">Male</option><option value="other">Other</option>
            </select></label>
            <label class="demo-field">Region<select id="demo-region">
              <option value="" selected>Prefer not to say</option>
              <option value="North America">North America</option><option value="Latin America">Latin America</option>
              <option value="Europe">Europe</option><option value="Africa">Africa</option>
              <option value="Middle East">Middle East</option><option value="Asia-Pacific">Asia-Pacific</option>
            </select></label>
            <label class="demo-field">Work<select id="demo-role">
              <option value="" selected>Prefer not to say</option>
              <option value="knowledge">Knowledge / desk work</option><option value="leadership">Leadership / management</option>
              <option value="caring">Caring / people-facing</option><option value="skilled">Skilled / manual</option>
              <option value="student">Student</option><option value="other">Other</option>
            </select></label>
            <label class="demo-field">AI use<select id="demo-aiExposure">
              <option value="" selected>Prefer not to say</option>
              <option value="daily">Daily</option><option value="weekly">Weekly</option>
              <option value="rarely">Rarely</option><option value="never">Never</option>
            </select></label>
            <label class="demo-field">Education<select id="demo-education">
              <option value="" selected>Prefer not to say</option>
              <option value="secondary">Secondary</option><option value="undergraduate">Undergraduate</option>
              <option value="postgraduate">Postgraduate</option>
            </select></label>
          </div>
        </div>
      </div>
      <button class="btn amber" id="go">Start my first session →</button>
    </div>`;
  // Research consent is OPT-IN and optional: it commits ONLY on this explicit tap,
  // and the app proceeds identically whether it's on or off. Declining leaves
  // research.consent at its false default (capture stays inert). The de-identified
  // demographics form is revealed ONLY when the box is checked (progressive
  // disclosure) and every field is blank-first, so a silent Start stores nothing.
  const consentBox = document.getElementById('researchconsent');
  const demoBlock = document.getElementById('research-demo');
  if (consentBox && demoBlock) consentBox.onchange = () => { demoBlock.hidden = !consentBox.checked; };
  document.getElementById('go').onclick = () => {
    if (consentBox && consentBox.checked) {
      const pick = (id) => ((document.getElementById(id) || {}).value || '');
      Research.setConsent(state.profile, true, {
        ageBand: pick('demo-ageBand'), sex: pick('demo-sex'), region: pick('demo-region'),
        role: pick('demo-role'), aiExposure: pick('demo-aiExposure'), education: pick('demo-education'),
      });
      save();
    }
    go('session');
  };
  const strongest = Object.keys(p.domainScores).sort((a, b) => p.domainScores[b] - p.domainScores[a])[0];
  document.getElementById('talkbaseline').onclick = () => talkThrough({ kind: 'baseline', strongest });
  wireDomainLinks();

  const fallback = { text: ruleInterpretBaseline(p.baseline.domainScores, p.settings.name), live: false };
  const { text, live } = await raceTimeout(Coach.interpretBaseline(p), 10000, fallback);
  const el = document.getElementById('interp');
  if (el) el.innerHTML = `
    <div class="insight fade-in ${live ? 'live' : ''}" style="border:none; padding:0;">
      <div class="k">Interpretation</div>
      <div style="white-space:pre-wrap; margin-top:8px;">${esc(text)}</div>
    </div>`;
}

// ---------------- conversational onboarding (Diagnostic Agent) ----------------
function startConversation() {
  state.profile = state.profile || Profile.createProfile();
  state.onboard.mode = 'conversation';
  state.diag = { messages: [], ready: false, busy: false, error: '' };
  render();
}

function renderConversationalOnboarding() {
  const d = state.diag;
  // Persist the interview so an interruption resumes it (parity with the
  // quick-check resume); only the transcript + ready flag, not transient busy.
  Profile.saveOnboard({ mode: 'conversation', diag: { messages: d.messages, ready: d.ready } });
  const turns = d.messages.filter((m) => m.role === 'user').length;
  const canBuild = d.ready || turns >= Diagnostic.MAX_DIAGNOSTIC_TURNS;
  app.innerHTML = `
    <div class="fade-in">
      <div class="brandmark"><div class="logo">F</div><div class="name">Forma</div><div class="tag">Getting to know you</div></div>
      <div class="chat" id="dchat">
        <div class="bubble coach">${esc(Diagnostic.OPENING)}</div>
        ${d.messages.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'coach'}">${esc(m.content)}</div>`).join('')}
        ${d.busy ? '<div class="bubble coach typing">…</div>' : ''}
      </div>
      ${d.error ? `<p class="muted small" style="color:var(--red)">${esc(d.error)}</p>` : ''}
      ${canBuild
        ? `<button class="btn amber" id="build" ${d.busy ? 'disabled' : ''}>Build my profile →</button>
           <p class="muted small center" style="margin-top:8px;">Or keep talking — the more you share, the truer the read.</p>`
        : ''}
      <div class="composer" style="bottom:12px;">
        <input id="dci" placeholder="Type your reply…" autocomplete="off" ${d.busy ? 'disabled' : ''} />
        <button class="btn" id="dsend" ${d.busy ? 'disabled' : ''}>Send</button>
      </div>
      <p class="muted small center" style="margin-top:6px;">
        <button class="btn ghost sm" id="bail" style="width:auto;">Use the quick check instead</button>
      </p>
    </div>`;

  const dci = document.getElementById('dci');
  const sendTurn = async () => {
    const text = dci.value.trim();
    if (!text || d.busy) return;
    // Safety + privacy first — route genuine distress to a real human,
    // deterministically, even mid-onboarding and even with no key. CRITICAL:
    // d.messages IS the payload that diagnosticReply/scoreDiagnostic later send to
    // the API, so the raw crisis text must NOT be stored in it — that would break
    // coach.js's invariant ("a distress disclosure is never routed to the API") on
    // the very first interaction. Show the escalation as a standalone caring reply
    // and step out of the interview; don't echo or transmit what they typed.
    if (Coach.looksLikeDistress(text)) {
      d.messages.push({ role: 'assistant', content: Coach.ESCALATION_MESSAGE });
      render();
      dci.value = '';
      return;
    }
    d.messages.push({ role: 'user', content: text });
    d.busy = true;
    d.error = '';
    render();
    try {
      const reply = await Diagnostic.diagnosticReply(d.messages, state.profile);
      d.messages.push({ role: 'assistant', content: reply.text });
      if (reply.ready) d.ready = true;
    } catch (e) {
      d.messages.pop(); // let them retry the last reply
      d.error = "Couldn't reach the coach just now — check your key in the quick-check screen, or try again.";
    }
    d.busy = false;
    render();
  };
  if (dci) dci.onkeydown = (e) => { if (e.key === 'Enter') sendTurn(); };
  const ds = document.getElementById('dsend');
  if (ds) ds.onclick = sendTurn;
  const build = document.getElementById('build');
  if (build) build.onclick = finishConversation;
  document.getElementById('bail').onclick = () => {
    state.onboard.mode = null;
    state.onboard.step = 1;
    render();
  };
}

async function finishConversation() {
  const d = state.diag;
  d.busy = true;
  d.error = '';
  app.innerHTML = `
    <div class="fade-in center" style="padding-top:60px;">
      <div class="spinner" style="width:28px;height:28px;"></div>
      <p class="muted" style="margin-top:16px;">Reading our conversation and writing your profile…</p>
    </div>`;
  let scored = null;
  try {
    scored = await Diagnostic.scoreDiagnostic(d.messages, state.profile);
  } catch (e) {
    scored = null;
  }
  if (!scored) {
    d.busy = false;
    d.error = "I had trouble turning that into a profile. Let's try the quick check — it builds the same profile, just a different way.";
    state.onboard.mode = null;
    state.onboard.step = 1;
    render();
    return;
  }
  state.profile = Profile.applyBaseline(state.profile, scored.domainScores, {});
  state.profile.baseline.method = 'conversation';
  state.profile.baseline.notes = scored.notes;
  if (state.onboard.faithTrack) {
    state.profile.settings.faithTrack = true;
    if (state.profile.domainScores.interior == null) state.profile.domainScores.interior = 50;
    // Seed the baseline too, so 90-day deltas for interior line up with the others.
    if (state.profile.baseline.domainScores.interior == null) state.profile.baseline.domainScores.interior = 50;
  }
  state.onboard.mode = null;
  Profile.clearOnboard(); // interview committed — no resume state to keep
  save();
  renderBaselineResult();
}

// A warm re-entry for someone returning after a lapse: re-anchors on progress
// already banked (days in, any positive index gain) instead of letting the cold
// "relight it" candle lead with guilt. Honest — shows a number only when the
// gain is genuinely positive; otherwise just the warm return line. Returns ''
// for everyone else (active users, first-timers).
function welcomeBackCard(p) {
  if (!isLapsedReturn(p)) return '';
  const days = Proof.daysSinceBaseline(p);
  const t = indexTrend(p.indexHistory);
  const banked = t.delta > 0
    ? `Since you began${days ? ` ${days} day${days === 1 ? '' : 's'} ago` : ''}, your Formation Index is up ${t.delta} — and that's banked. A gap doesn't undo it.`
    : `What you've built so far is still yours — a gap doesn't undo it.`;
  return `
      <div class="card welcomeback" style="border-left:4px solid var(--accent);">
        <div class="k">Welcome back</div>
        <p class="muted small" style="margin:6px 0 0;">${banked} The return is the rep — more than any streak. Pick up where you are.</p>
      </div>`;
}

// ---------------- home ----------------
function renderHome() {
  const p = state.profile;
  const fi = formationIndex(p.domainScores);
  const alive = streakAlive(p.streak);
  // A brand-new user (baseline done, no session yet) has never started a streak.
  // "Relight it" presupposes a flame they never lit — invite instead of scolding.
  const neverStarted = !(p.streak && p.streak.lastDate);
  const focus = Planner.focusForToday(p) || recommendFocus(p);
  const fd = getDomain(focus);
  const doneToday = (p.sessions || []).some((s) => s.date === todayStr());
  const lastInsight = p._lastInsight;

  app.innerHTML = `
    <div class="fade-in">
      <div class="brandmark"><div class="logo">F</div><div class="name">Forma</div>
        <div class="tag">${greeting()}${p.settings.name ? ', ' + esc(p.settings.name) : ''}</div></div>

      <div class="card index-hero">
        <div class="index-num kbig">${fi}</div>
        <div class="index-label">Formation Index${(() => {
          const t = indexTrend(p.indexHistory);
          return t.delta !== 0
            ? ` <span class="trendpill ${t.direction}">${t.delta > 0 ? '+' : ''}${t.delta} since you began</span>`
            : '';
        })()}</div>
        ${(() => {
          // Honest headline: when the composite rests on thin evidence (few
          // capacities measured, mostly provisional), say so — don't show an
          // early, noisy number as authoritatively as a settled one.
          const ic = indexConfidence(p);
          return ic.thin ? `<div class="muted small" style="margin-top:4px;">${esc(ic.note)}</div>` : '';
        })()}
        <div class="streakchip ${alive ? '' : neverStarted ? 'fresh' : 'cold'}">${alive ? '🔥' : neverStarted ? '✨' : '🕯️'} ${neverStarted ? 'Your first session starts your streak' : `${p.streak.current || 0}-day streak${alive ? (() => {
          // Honest forward-pull: the true number of days to the next real mark.
          // Only when the streak is alive (don't compete with the warmer "relight
          // it" copy) and a mark is still ahead (silent past 365). No fake urgency.
          const nm = nextStreakMark(p.streak.current || 0);
          if (!nm) return '';
          const left = nm - (p.streak.current || 0);
          return ` · ${left} ${left === 1 ? 'day' : 'days'} to ${nm}`;
        })() : ' — relight it'}`}</div>
      </div>

      ${welcomeBackCard(p)}

      ${backupNudgeCard(p)}

      ${lastInsight ? `<div class="card"><div class="insight ${lastInsight.live ? 'live' : ''}" style="border:none;padding:0;">
        <div class="k">Today's insight</div>
        <div style="margin-top:6px; white-space:pre-wrap;">${esc(lastInsight.text)}</div></div></div>` : ''}

      <div class="card">
        <div class="row" style="margin-bottom:10px;">
          <strong>${doneToday ? "Today's session complete" : "Today's focus"}</strong>
          <span class="spacer"></span>
          ${doneToday ? '<span class="trendpill up">done ✓</span>' : ''}
        </div>
        <div class="domain-row" style="margin-bottom:14px;">
          <span class="ico">${fd.icon}</span>
          <div class="meta"><div class="dn">${esc(fd.name)}</div>
            <div class="muted small">${esc(fd.short)}</div></div>
        </div>
        <button class="btn amber" id="startsession">${doneToday ? 'Practice again →' : 'Go to today’s session →'}</button>
      </div>

      ${weekStripCard(p)}

      ${commitmentsCard(p)}

      ${radarCard(p.domainScores)}
    </div>`;

  document.getElementById('startsession').onclick = () => go('session');
  const wp = document.getElementById('toplan');
  if (wp) wp.onclick = () => go('plan');
  const nb = document.getElementById('nudgebackup');
  if (nb) nb.onclick = () => { downloadBackup(); render(); };
  const nl = document.getElementById('nudgelater');
  if (nl) nl.onclick = () => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    p.settings.backupSnoozeUntil = d.toISOString().slice(0, 10);
    save(); render();
  };
  wireDomainLinks();
  wireCommitments();
}

// A gentle, dismissible reminder to keep a backup — Forma is local-first, so a
// cleared browser is the real data-loss risk. Shows only once there's meaningful
// data (>=5 sessions) AND no recent export, and stays quiet for 14 days if snoozed.
function backupNudgeCard(p) {
  if ((p.sessions || []).length < 5) return '';
  const now = todayStr();
  const snooze = p.settings && p.settings.backupSnoozeUntil;
  if (snooze && snooze >= now) return '';
  const last = p.settings && p.settings.lastExportAt;
  const daysSince = last ? daysBetween(String(last).slice(0, 10), now) : Infinity;
  if (daysSince < 30) return '';
  return `<div class="card" id="backupnudge" style="border-left:4px solid var(--amber);">
    <div class="row"><span style="font-size:1.2rem;">💾</span>
      <div style="flex:1;"><strong>Keep a backup of your data</strong>
        <p class="muted small" style="margin:2px 0 0;">${last ? 'It’s been a while since your last backup.' : 'Your formation lives on this device — a quick export means a cleared browser can’t erase it.'}</p></div></div>
    <div class="row" style="gap:8px; margin-top:10px;">
      <button class="btn sm" id="nudgebackup">Back up now</button>
      <button class="btn ghost sm" id="nudgelater">Later</button>
    </div>
  </div>`;
}

// Download the full local profile as a JSON backup, and stamp lastExportAt so the
// nudge can tell when a backup was last taken. Shared by Home and Settings.
function downloadBackup() {
  const p = state.profile;
  const blob = new Blob([Profile.exportProfile(p)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `forma-data-${todayStr()}.json`;
  a.click();
  p.settings.lastExportAt = new Date().toISOString();
  save();
}

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function weekStripCard(p) {
  if (!p.plan) return '';
  const today = todayStr();
  const days = Planner.planWithProgress(p.plan, p);
  const cells = days.map((d) => {
    const isToday = d.date === today;
    const dow = DOW[new Date(d.date + 'T00:00:00').getDay()];
    const bg = d.done ? 'var(--green-soft)' : isToday ? 'var(--accent-soft)' : '#fff';
    const ring = isToday ? 'box-shadow:0 0 0 2px var(--accent);' : '';
    return `
      <div style="flex:1; text-align:center;">
        <div class="muted small" style="font-size:.65rem;">${dow}</div>
        <div style="margin-top:4px; height:38px; border-radius:10px; border:1px solid var(--line); ${ring} background:${bg}; display:grid; place-items:center; font-size:1.1rem;">
          ${d.done ? '✓' : getDomain(d.domain).icon}
        </div>
      </div>`;
  }).join('');
  return `
    <div class="card">
      <div class="row" style="margin-bottom:10px;">
        <strong>This week</strong>
        <span class="spacer"></span>
        <span class="muted small">focus: ${esc(getDomain(p.plan.theme).name)}</span>
      </div>
      <div class="row" style="gap:6px;">${cells}</div>
      <button class="btn ghost sm" id="toplan" style="margin-top:12px;">See this week's plan →</button>
    </div>`;
}

function radarCard(scores) {
  const order = domainOrder();
  const size = 300, cx = size / 2, cy = size / 2 + 6, r = 96;
  const geo = radarGeometry(scores, order, cx, cy, r);
  const rings = [25, 50, 75, 100].map((pct) => {
    const g = radarGeometry(Object.fromEntries(order.map((id) => [id, pct])), order, cx, cy, r);
    return `<polygon points="${g.points}" fill="none" stroke="var(--line)" stroke-width="1" />`;
  }).join('');
  const axes = geo.axes.map((a) => `<line x1="${cx}" y1="${cy}" x2="${a.axisX}" y2="${a.axisY}" stroke="var(--line)" stroke-width="1"/>`).join('');
  const labels = geo.axes.map((a) => {
    const d = getDomain(a.id);
    const anchor = a.labelX < cx - 6 ? 'end' : a.labelX > cx + 6 ? 'start' : 'middle';
    return `<text x="${a.labelX}" y="${a.labelY + 4}" font-size="13" text-anchor="${anchor}" fill="var(--ink-faint)">${d.icon}</text>`;
  }).join('');

  const ariaSummary = order.map((id) => `${getDomain(id).name} ${scores[id] ?? 0}`).join(', ');
  return `
    <div class="card">
      <h2 style="font-size:1.05rem;">Your formation profile</h2>
      <div class="radarwrap">
        <svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:320px;" role="img" aria-label="Your formation profile, out of 100: ${esc(ariaSummary)}">
          ${rings}${axes}
          <polygon points="${geo.points}" fill="rgba(76,95,213,.18)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
          ${geo.axes.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="3" fill="var(--accent)"/>`).join('')}
          ${labels}
        </svg>
      </div>
      <div class="domain-list">
        ${order.map((id) => domainRow(id, scores[id])).join('')}
      </div>
      <p class="muted small center" style="margin-top:10px;">Tap any capacity to train it directly.</p>
    </div>`;
}

function domainRow(id, score) {
  const d = getDomain(id);
  if (score == null) return '';
  const band = bandFor(score);
  return `
    <div class="domain-row tappable" data-domain="${id}" role="button" tabindex="0" aria-label="Train ${esc(d.name)}">
      <span class="ico">${d.icon}</span>
      <div class="meta">
        <div class="dn">${esc(d.name)} <span class="muted" style="font-weight:500; font-size:.82rem;">· ${esc(band.label)}</span></div>
        <div class="bar"><div style="width:${score}%; background:${band.color}"></div></div>
      </div>
      <span class="sc">${score}</span>
      <span class="chev" aria-hidden="true">›</span>
    </div>`;
}

// ---------------- daily session ----------------
// The Orchestrator picks the focus domain (via the weekly plan) AND the
// exercise modality for it; we only create the session when the user hits Begin.
function initialPhase(ex) {
  return ex.type === 'memory' ? 'memo-show'
    : ex.type === 'digitspan' ? 'digit-show'
    : ex.type === 'nback' ? 'nback-intro'
    : ex.type === 'stream' ? 'stream-intro'
    : ex.type === 'vigilance' ? 'vigilance-intro'
    : ex.type === 'mathfluency' ? 'math-intro'
    : ex.type === 'pursuit' ? 'pursuit-intro'
    : ex.type === 'contemplation' ? 'contempl-intro'
    : 'play';
}

function startTodaysSession() {
  const ex = Orchestrator.chooseExercise(state.profile);
  state.session = { exercise: ex, phase: initialPhase(ex), response: {}, started: Date.now() };
  render();
}

// Start a session aimed at a specific capacity (tapped from the radar/scales).
function startDomainSession(domain) {
  const ex = Orchestrator.chooseExercise(state.profile, { focus: domain });
  state.session = { exercise: ex, phase: initialPhase(ex), response: {}, started: Date.now() };
  state.route = 'session';
  render();
  window.scrollTo(0, 0);
}

// Commitments — solution-focused, self-chosen next steps. Closes a real loop:
// the coach already reads "Active goals" into its context, but until now there
// was no way for a person to set one. Tiny, concrete, theirs.
function commitmentsCard(p) {
  const goals = p.goals || [];
  const ids = activeDomainIds(p.settings && p.settings.faithTrack);
  const today = todayStr();
  const editing = state._editGoal;
  const keptToday = goals.filter((g) => (g.checkins || []).includes(today)).length;
  const row = (g) => {
    const d = getDomain(g.domain);
    // Inline edit mode (the pencil): the row becomes an input + save/cancel.
    if (editing === g.id) {
      return `<div class="goalrow editing">
        <input class="goaledit-input" id="goaledit-${esc(g.id)}" type="text" maxlength="120" value="${esc(g.text)}" aria-label="Edit commitment" />
        <button class="btn sm" data-goalsave="${esc(g.id)}" style="width:auto;">Save</button>
        <button class="btn ghost sm" data-goalcancel="1" style="width:auto;">Cancel</button>
      </div>`;
    }
    const checkins = Array.isArray(g.checkins) ? g.checkins : [];
    const done = checkins.includes(today);
    const n = checkins.length;
    return `<div class="goalrow">
      <button class="goalcheck ${done ? 'on' : ''}" data-track="${esc(g.id)}" aria-pressed="${done}" aria-label="${done ? 'Kept today — tap to undo' : 'Mark kept today'}: “${esc(g.text)}”">${done ? '✓' : '○'}</button>
      <span class="ico" aria-hidden="true">${d ? d.icon : '•'}</span>
      <span class="goaltext">${esc(g.text)}${n ? ` <span class="goalkept muted small">· kept ${n}×</span>` : ''}</span>
      <button class="goalicon" data-edit="${esc(g.id)}" aria-label="Edit “${esc(g.text)}”">✏️</button>
      <button class="goalicon" data-del="${esc(g.id)}" aria-label="Delete “${esc(g.text)}”">🗑️</button>
    </div>`;
  };
  return `
    <div class="card">
      <div class="row"><strong>Your commitments</strong><span class="spacer"></span>
        ${goals.length ? `<span class="muted small">${keptToday}/${goals.length} kept today</span>` : ''}</div>
      <p class="muted small" style="margin-top:2px;">Small steps you’re choosing — keep tracking them day to day. They stay until you remove them; the coach can help you find the next one.</p>
      ${goals.length ? `<div class="stack" style="margin-top:10px;">${goals.map(row).join('')}</div>`
        : `<p class="muted small" style="margin-top:10px;">No commitment yet — name one small thing you’ll keep.</p>`}
      <details class="goaladd" style="margin-top:12px;">
        <summary class="btn ghost sm" style="display:inline-block; width:auto;">+ Add a commitment</summary>
        <div class="goaladd-body" style="margin-top:10px;">
          <input id="goaltext" type="text" maxlength="120" placeholder="e.g. Read 10 minutes before I open my phone" />
          <div class="row" style="gap:8px; margin-top:8px;">
            <select id="goaldomain" aria-label="Which capacity">
              ${ids.map((id) => `<option value="${id}">${esc(getDomain(id).name)}</option>`).join('')}
            </select>
            <button class="btn sm" id="goaladd" style="width:auto;">Add</button>
          </div>
        </div>
      </details>
    </div>`;
}

function wireCommitments() {
  const add = document.getElementById('goaladd');
  if (add) add.onclick = () => {
    const text = (document.getElementById('goaltext').value || '').trim();
    const domain = document.getElementById('goaldomain').value;
    if (!text) { document.getElementById('goaltext').focus(); return; }
    state.profile = Profile.addGoal(state.profile, domain, text);
    save();
    render();
  };
  // Track (recurring): toggle today's check-in; the commitment stays.
  app.querySelectorAll('[data-track]').forEach((b) => {
    b.onclick = () => { state.profile = Profile.trackGoal(state.profile, b.dataset.track, todayStr()); save(); render(); };
  });
  // Edit (pencil): enter inline edit mode for that row.
  app.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => { state._editGoal = b.dataset.edit; render(); };
  });
  app.querySelectorAll('[data-goalcancel]').forEach((b) => {
    b.onclick = () => { state._editGoal = null; render(); };
  });
  app.querySelectorAll('[data-goalsave]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.goalsave;
      const el = document.getElementById('goaledit-' + id);
      state.profile = Profile.editGoal(state.profile, id, el ? el.value : '');
      state._editGoal = null;
      save();
      render();
    };
  });
  // Delete (trash).
  app.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = () => {
      if (state._editGoal === b.dataset.del) state._editGoal = null;
      state.profile = Profile.removeGoal(state.profile, b.dataset.del);
      save();
      render();
    };
  });
}

// Make every [data-domain] row a link into a tailored session.
function wireDomainLinks() {
  app.querySelectorAll('[data-domain]').forEach((el) => {
    const fire = () => startDomainSession(el.dataset.domain);
    el.onclick = fire;
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } };
  });
}

// The "Today" landing — a calm runway before the session, not a cold start.
function renderTodayLanding() {
  const p = state.profile;
  const focus = Orchestrator.nextFocus(p);
  const fd = getDomain(focus);
  const doneToday = (p.sessions || []).some((s) => s.date === todayStr());
  const planDay = p.plan && p.plan.days.find((d) => d.date === todayStr());
  const alive = streakAlive(p.streak);
  const neverStarted = !(p.streak && p.streak.lastDate); // brand-new: never lit a streak
  const last = p._lastInsight;

  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><h1 style="margin:0;">Today</h1><span class="spacer"></span>
        <span class="streakchip ${alive ? '' : neverStarted ? 'fresh' : 'cold'}" style="margin:0;">${alive ? '🔥' : neverStarted ? '✨' : '🕯️'} ${neverStarted ? 'Day 1 awaits' : (p.streak.current || 0)}</span></div>

      ${doneToday ? `
        <div class="card" style="text-align:center;">
          <div style="font-size:2.4rem;">✓</div>
          <h2 style="font-size:1.1rem; margin-top:6px;">Today's session is done</h2>
          <p class="muted small">Formation compounds in the returning, not the cramming. Come back tomorrow.</p>
        </div>
        ${last ? `<div class="card"><div class="insight ${last.live ? 'live' : ''}" style="border:none;padding:0;">
          <div class="k">Today's insight</div><div style="margin-top:6px; white-space:pre-wrap;">${esc(last.text)}</div></div></div>` : ''}
        <button class="btn ghost" id="begin">Do another session →</button>
      ` : `
        <div class="card">
          <div class="k" style="font-size:.72rem; text-transform:uppercase; letter-spacing:.1em; color:var(--ink-faint); font-weight:700;">Today's focus</div>
          <div class="row" style="margin-top:8px;">
            <span class="ico" style="font-size:1.7rem;">${fd.icon}</span>
            <div class="meta"><div class="dn" style="font-size:1.05rem;">${esc(fd.name)}</div>
              <div class="muted small">${esc(fd.short)}</div></div>
          </div>
          ${planDay ? `<p class="muted small" style="margin-top:10px;">Part of this week's plan — focus capacity: <strong>${esc(getDomain(p.plan.theme).name)}</strong>.</p>` : ''}
          <p class="muted small" style="margin-top:6px;">About 3 minutes. One short exercise, calibrated to where you are.</p>
        </div>
        <button class="btn amber" id="begin">Begin today's session →</button>
        <p class="muted small center" style="margin-top:10px;">${esc(fd.aiRationale)}</p>
      `}
    </div>`;
  document.getElementById('begin').onclick = startTodaysSession;
}

function renderSession() {
  if (!state.session) { return renderTodayLanding(); }
  const s = state.session;
  switch (s.exercise.type) {
    case 'reading': return renderReading();
    case 'memory': return renderMemory();
    case 'digitspan': return renderDigitSpan();
    case 'decision': return renderDecision();
    case 'tradeoff': return renderDecision();
    case 'stem': return renderDecision();
    case 'comm': return renderDecision();
    case 'attend': return renderDecision();
    case 'steu': return renderDecision();
    case 'matrix': return renderMatrix();
    case 'crt': return renderCRT();
    case 'nback': return renderNBack();
    case 'stream': return renderStream();
    case 'vigilance': return renderVigilance();
    case 'mathfluency': return renderMathFluency();
    case 'maze': return renderMaze();
    case 'pursuit': return renderPursuit();
    case 'vignette': return renderVignette();
    case 'sentence': return renderSentence();
    case 'stay': return renderStay();
    case 'contemplation': return renderContemplation();
    case 'reflection': return renderReflection();
  }
}

function sessionHeader(ex) {
  const d = getDomain(ex.domain);
  const typeLabel = { reading: 'Deep Reading', memory: 'Working Memory', decision: 'Judgment', tradeoff: 'AI Independence', matrix: 'Reasoning', crt: 'Reflection Test', nback: 'Working Memory', mathfluency: 'Working Memory', digitspan: 'Working Memory', maze: 'Deep Reading', stream: 'Sustained Attention', vigilance: 'Live Attention', pursuit: 'Sustained Attention', vignette: 'Communication', sentence: 'Self-Knowledge', stay: 'Frustration Tolerance', contemplation: 'Interior Life', stem: 'Emotion Management', steu: 'Emotional Understanding', comm: 'Communication', attend: 'Relational Presence', reflection: 'Reflection' }[ex.type] || ex.type;
  const mode = exerciseMode(ex.type);
  const modeTitle = mode === 'practice'
    ? 'A practice — a formation rep, not graded right or wrong.'
    : 'A measure — it scores this capacity.';
  return `<div class="exercise-head"><span class="tagchip">${esc(typeLabel)}</span>
    <span class="modechip ${mode}" title="${esc(modeTitle)}">${mode === 'practice' ? 'Practice' : 'Measure'}</span>
    <span class="muted small">${d.icon} ${esc(d.name)}</span></div>
    <h2>${esc(ex.title)}</h2>`;
}

function renderReading() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'play') {
    s.response.answers = s.response.answers || [];
    const qi = s.response.answers.filter((a) => a != null).length;
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="passage">${esc(ex.passage)}</div>
        <p class="muted small">Read it once, carefully. Then answer from what you understood.</p>
        <button class="btn" id="toq">I've read it — show questions →</button>
      </div>`;
    document.getElementById('toq').onclick = () => { s.phase = 'questions'; s.qi = 0; render(); };
    return;
  }
  // review phase — before the score, let the reader SEE what they got right/wrong
  // (this is a TEST with keyed answers; seeing the correct answer is where the
  // learning is). Read-only marks reuse the same ✓/✕ + sr-only pattern as the
  // exercise reveals; reading questions carry no rationale, so we just show the key.
  if (s.phase === 'reading-review') {
    const ans = s.response.answers || [];
    const correct = ex.questions.filter((q, i) => ans[i] === q.answer).length;
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <p class="likert-q" style="font-size:1.05rem;">You got <strong>${correct} of ${ex.questions.length}</strong> right. Here's the breakdown:</p>
        ${ex.questions.map((q, qi) => {
          const a = ans[qi];
          return `<div class="card" style="padding:14px;">
            <div class="likert-q" style="font-size:.98rem;">${esc(q.q)}</div>
            <div class="likert-opts" style="margin-top:8px;">
              ${q.options.map((o, i) => {
                const isKey = i === q.answer;
                const isYours = i === a;
                const cls = isKey ? 'correct' : (isYours ? 'wrong' : '');
                const mark = isKey ? ' <span class="mark correct" aria-hidden="true">✓</span><span class="sr-only"> (correct answer)</span>'
                  : (isYours ? ' <span class="mark wrong" aria-hidden="true">✕</span><span class="sr-only"> (your answer — not correct)</span>' : '');
                return `<div class="opt ${cls}" style="cursor:default;">${esc(o)}${mark}</div>`;
              }).join('')}
            </div>
          </div>`;
        }).join('')}
        <button class="btn amber" id="rdone" style="margin-top:8px;">Continue →</button>
      </div>`;
    document.getElementById('rdone').onclick = completeSession;
    return;
  }
  // questions phase, one at a time
  const qi = s.qi || 0;
  const q = ex.questions[qi];
  const chosen = s.response.answers?.[qi];
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <div class="progress-top"><div style="width:${Math.round((qi / ex.questions.length) * 100)}%"></div></div>
      <div class="likert-q">${esc(q.q)}</div>
      <div class="likert-opts">
        ${q.options.map((o, i) => `<button class="opt ${chosen === i ? 'selected' : ''}" data-i="${i}">${esc(o)}</button>`).join('')}
      </div>
      <button class="btn" id="qnext" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">
        ${qi === ex.questions.length - 1 ? 'Finish' : 'Next →'}</button>
    </div>`;
  app.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
    s.response.answers = s.response.answers || [];
    s.response.answers[qi] = Number(b.dataset.i);
    render();
  });
  document.getElementById('qnext').onclick = () => {
    if (qi === ex.questions.length - 1) { s.phase = 'reading-review'; render(); }
    else { s.qi = qi + 1; render(); }
  };
}

function renderMemory() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'memo-show') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <p class="muted small">${esc(ex.instructions)}</p>
        <div class="memo-words">${ex.sequence.map((w) => `<span class="memo-word">${esc(w)}</span>`).join('')}</div>
        <div class="memo-countdown" id="cd">${Math.ceil(ex.showMs / 1000)}</div>
      </div>`;
    let left = Math.ceil(ex.showMs / 1000);
    const cd = document.getElementById('cd');
    if (s._timer) clearInterval(s._timer); // never stack timers
    const t = setInterval(() => {
      // Bail if the user moved on (different session or left the session view).
      if (state.session !== s || state.route !== 'session') { clearInterval(t); return; }
      left--;
      if (cd) cd.textContent = left;
      if (left <= 0) { clearInterval(t); s._timer = null; s.phase = 'memo-recall'; s.response.recalled = []; render(); }
    }, 1000);
    s._timer = t;
    return;
  }
  // recall phase: tap words in order from a shuffled pool
  const recalled = s.response.recalled || [];
  const pool = ex.pool;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Rebuild the list <strong>in order</strong>. Tap to add; tap a slot to remove.</p>
      <div class="slot-row" id="slots">
        ${recalled.length ? recalled.map((w, i) => `<button type="button" class="slot" data-rm="${i}" aria-label="Remove ${esc(w)}">${esc(w)} ✕</button>`).join('') : '<span class="muted small">your sequence…</span>'}
      </div>
      <div class="chiprow">
        ${pool.map((w) => `<button class="chip ${recalled.includes(w) ? 'used' : ''}" data-w="${esc(w)}" ${recalled.includes(w) ? 'disabled' : ''}>${esc(w)}</button>`).join('')}
      </div>
      <button class="btn" id="done" ${recalled.length === 0 ? 'disabled' : ''} style="margin-top:18px;">Check my memory</button>
    </div>`;
  app.querySelectorAll('.chip').forEach((b) => b.onclick = () => {
    if (b.disabled) return;
    s.response.recalled = [...(s.response.recalled || []), b.dataset.w];
    render();
  });
  app.querySelectorAll('.slot[data-rm]').forEach((el) => el.onclick = () => {
    const i = Number(el.dataset.rm);
    s.response.recalled.splice(i, 1);
    render();
  });
  document.getElementById('done').onclick = completeSession;
}

// Speak a one-off message to assistive tech via the persistent #live region (which
// lives OUTSIDE #app, so it survives the innerHTML re-render every view swap does).
// Clearing first, then setting on a later tick, forces a screen reader to re-announce
// even when the new text repeats a prior message.
function announce(msg) {
  const el = document.getElementById('live');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { const e = document.getElementById('live'); if (e) e.textContent = msg; }, 30);
}

// A non-color correctness marker for a revealed answer option — a glyph (hidden from
// AT, which gets the text twin) plus an .sr-only phrase. Correctness was conveyed by
// red/green background ALONE: invisible to screen readers and to red-green color
// blindness. The class string already encodes the state ('correct' / 'wrong').
function revealMark(cls) {
  if (/\bcorrect\b/.test(cls)) return ` <span class="mark correct" aria-hidden="true">✓</span><span class="sr-only"> (strong answer)</span>`;
  if (/\bwrong\b/.test(cls)) return ` <span class="mark wrong" aria-hidden="true">✕</span><span class="sr-only"> (your answer — not the strongest)</span>`;
  return '';
}

function renderDecision() {
  const s = state.session;
  const ex = s.exercise;
  const chosen = s.response.optionId;
  const revealed = s.revealed;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <div class="passage">${esc(ex.scenario)}</div>
      <p class="likert-q" style="font-size:1.05rem;">${esc(ex.prompt)}</p>
      <div class="likert-opts">
        ${ex.options.map((o) => {
          let cls = '';
          if (revealed) {
            if (o.id === chosen) cls = o.score >= 80 ? 'correct' : 'wrong';
            else if (o.score >= 80) cls = 'correct reveal';
            else cls = 'reveal';
          } else if (o.id === chosen) cls = 'selected';
          return `<button class="opt ${cls}" data-id="${o.id}" aria-pressed="${!revealed && o.id === chosen}" ${revealed ? 'disabled' : ''}>${esc(o.text)}${revealed ? revealMark(cls) : ''}
            ${revealed ? `<div class="rationale">${esc(o.rationale)}</div>` : ''}</button>`;
        }).join('')}
      </div>
      ${revealed
        ? `<button class="btn" id="fin" style="margin-top:16px;">Continue →</button>`
        : `<button class="btn" id="reveal" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">Lock in my answer</button>`}
    </div>`;
  if (!revealed) {
    app.querySelectorAll('.opt').forEach((b) => b.onclick = () => { s.response.optionId = b.dataset.id; render(); });
    document.getElementById('reveal').onclick = () => {
      s.revealed = true;
      // Announce the outcome so an AT user hears it regardless of where focus lands
      // after re-render. Decision items have no single "right" answer — strong vs.
      // weaker — so frame it as such, not pass/fail.
      const picked = ex.options.find((o) => o.id === s.response.optionId);
      const best = ex.options.find((o) => o.score >= 80);
      announce(picked && picked.score >= 80
        ? `Strong choice. ${picked.rationale || ''}`
        : `A workable choice, but not the strongest. ${best ? 'The strongest option was: ' + best.text : ''}`);
      render();
    };
  } else {
    document.getElementById('fin').onclick = completeSession;
  }
}

// "The Lure" — cognitive-reflection item. Answer, then see whether you overrode
// the intuitive pull, with the bias named.
function renderCRT() {
  const s = state.session;
  const ex = s.exercise;
  const chosen = s.response.optionId;
  const revealed = s.revealed;
  const chosenOpt = ex.options.find((o) => o.id === chosen);
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Read it once. Trust your reasoning, not your reflex.</p>
      <p class="likert-q" style="font-size:1.1rem; margin-top:6px;">${esc(ex.prompt)}</p>
      <div class="likert-opts">
        ${ex.options.map((o) => {
          let cls = '';
          if (revealed) {
            if (o.kind === 'reflective') cls = 'correct';
            else if (o.id === chosen) cls = 'wrong';
            else cls = 'reveal';
          } else if (o.id === chosen) cls = 'selected';
          return `<button class="opt ${cls}" data-id="${o.id}" aria-pressed="${!revealed && o.id === chosen}" ${revealed ? 'disabled' : ''}>${esc(o.text)}${revealed ? revealMark(cls) : ''}</button>`;
        }).join('')}
      </div>
      ${revealed ? `
        <div class="rationale" style="margin-top:14px;">
          <strong>${chosenOpt && chosenOpt.kind === 'reflective' ? 'You overrode the lure.' : chosenOpt && chosenOpt.kind === 'intuitive' ? 'That was the intuitive lure.' : 'Not quite.'}</strong><br/>
          ${esc(ex.explanation)}
        </div>
        <button class="btn" id="fin" style="margin-top:14px;">Continue →</button>`
        : `<button class="btn" id="reveal" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">Lock in my answer</button>`}
    </div>`;
  if (!revealed) {
    app.querySelectorAll('.opt').forEach((b) => b.onclick = () => { s.response.optionId = b.dataset.id; render(); });
    document.getElementById('reveal').onclick = () => {
      s.revealed = true;
      const picked = ex.options.find((o) => o.id === s.response.optionId);
      announce(picked && picked.kind === 'reflective'
        ? `You overrode the lure. ${ex.explanation}`
        : `That was the intuitive lure. ${ex.explanation}`);
      render();
    };
  } else {
    document.getElementById('fin').onclick = completeSession;
  }
}

// N-Back — the working-memory updating drill. Letters stream by; flag each that
// matches the one N steps back.
function renderNBack() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'nback-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>Letters will appear one at a time. Tap <strong>Match</strong> whenever the current letter is the same as the one <strong>${ex.n} step${ex.n === 1 ? '' : 's'} back</strong>.</p>
          <p class="muted small">Example (${ex.n}-back): in “T … ${ex.n === 1 ? 'T' : 'K … T'}”, the second T matches because it equals the letter ${ex.n} back. Don’t tap otherwise.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.phase = 'nback-run'; s.idx = -1; s.response.flagged = []; s.flaggedThis = false; render(); };
    return;
  }
  // running
  const idx = s.idx;
  const letter = idx >= 0 ? ex.sequence[idx] : '';
  app.innerHTML = `
    <div class="fade-in">
      <p class="muted small center">${ex.title} · ${Math.max(0, idx + 1)}/${ex.sequence.length}</p>
      <div style="height:200px; display:grid; place-items:center;">
        <div style="font-size:5rem; font-weight:800; letter-spacing:2px; color:var(--accent);">${esc(letter || '·')}</div>
      </div>
      <button class="btn ${s.flaggedThis ? 'green' : 'amber'}" id="match">${s.flaggedThis ? 'Marked ✓' : `Match (${ex.n} back)`}</button>
      <p class="muted small center" style="margin-top:10px;">Tap only when it matches ${ex.n} back.</p>
    </div>`;
  const matchBtn = document.getElementById('match');
  if (matchBtn) matchBtn.onclick = () => {
    // Use the index displayed at render time (not the live s.idx, which the
    // interval may have already advanced), bounds-check, and de-dupe.
    if (idx >= ex.n && idx < ex.sequence.length && !s.response.flagged.includes(idx)) {
      s.response.flagged.push(idx);
      s.flaggedThis = true;
      matchBtn.classList.remove('amber'); matchBtn.classList.add('green');
      matchBtn.textContent = 'Marked ✓';
    }
  };

  // Drive the stream once (on first paint of the run phase).
  if (!s._timer) {
    const advance = () => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      s.idx++;
      s.flaggedThis = false;
      if (s.idx >= ex.sequence.length) {
        clearInterval(s._timer); s._timer = null;
        completeSession();
        return;
      }
      render();
    };
    s._timer = setInterval(advance, ex.stepMs);
    advance(); // show the first letter immediately
  }
}

// The Stream — SART go/no-go. Tap GO for every symbol except the rare target.
function renderStream() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'stream-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>Symbols will flash by, about one per second. Tap <strong>GO</strong> for every one — <em>except</em> when you see <strong>${esc(ex.targetSymbol)}</strong>. For ${esc(ex.targetSymbol)}, do nothing.</p>
          <p class="muted small">It sounds easy. The rhythm lulls you — catching yourself before you tap on ${esc(ex.targetSymbol)} is the whole test.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.phase = 'stream-run'; s.idx = -1; s.response.tapped = []; render(); };
    return;
  }
  const idx = s.idx;
  const item = idx >= 0 ? ex.items[idx] : null;
  const tappedThis = s.response.tapped && s.response.tapped.includes(idx);
  app.innerHTML = `
    <div class="fade-in">
      <p class="muted small center">${ex.title} · ${Math.max(0, idx + 1)}/${ex.items.length} · withhold on “${esc(ex.targetSymbol)}”</p>
      <div style="height:200px; display:grid; place-items:center;">
        <div style="font-size:5.5rem; font-weight:800; color:var(--ink);">${esc(item ? item.symbol : '·')}</div>
      </div>
      <button class="btn ${tappedThis ? 'green' : 'amber'}" id="go">${tappedThis ? 'GO ✓' : 'GO'}</button>
    </div>`;
  const goBtn = document.getElementById('go');
  if (goBtn) goBtn.onclick = () => {
    // Use the index shown at render time (not the live s.idx the interval may
    // have advanced) so a tap can't be logged against the next, unseen symbol.
    if (idx >= 0 && !s.response.tapped.includes(idx)) {
      s.response.tapped.push(idx);
      goBtn.classList.remove('amber'); goBtn.classList.add('green'); goBtn.textContent = 'GO ✓';
    }
  };
  if (!s._timer) {
    const advance = () => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      s.idx++;
      if (s.idx >= ex.items.length) { clearInterval(s._timer); s._timer = null; completeSession(); return; }
      render();
    };
    s._timer = setInterval(advance, ex.stepMs);
    advance();
  }
}

// Catch the Signal — live Psychomotor Vigilance Task. A faint dot appears at
// unpredictable moments; press the instant you see it. We measure reaction time,
// lapses, misses, and false starts in real time.
function renderVigilance() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'vigilance-intro') {
    const ladder = ex.trialLadder || [ex.trials];
    const chosen = s.chosenTrials || ex.trials;
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>A bright dot will appear at random moments, in random spots — tap the panel (or press Space) the <strong>instant</strong> you see it. Don’t tap before it appears.</p>
          <p class="muted small">This is a <strong>measure, not a drill</strong> — a reaction-time vigilance test (the Psychomotor Vigilance Task, the standard used in attention and fatigue research). It reads your speed, your consistency, and the lapses you don’t notice.</p>
          <p class="muted small" style="margin-top:10px;">How many signals? A longer run is a truer read on <em>sustained</em> attention — build up over time.</p>
          <div class="row" style="gap:8px; flex-wrap:wrap;">
            ${ladder.map((n) => `<button class="chip${chosen === n ? ' sel' : ''}" data-trials="${n}" aria-pressed="${chosen === n}">${n} signals</button>`).join('')}
          </div>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    app.querySelectorAll('[data-trials]').forEach((b) => b.onclick = () => { s.chosenTrials = Number(b.dataset.trials); render(); });
    document.getElementById('begin').onclick = () => {
      ex.trials = s.chosenTrials || ex.trials; // honor the chosen length for this run
      s.phase = 'vigilance-run'; s.response.trials = []; s.trialIndex = 0; s._started = false; render();
    };
    return;
  }
  // run — build the stage once; the trial loop manipulates the DOM directly so
  // re-renders don't restart it. The target is CLEARLY visible (no faintness
  // confound); difficulty is the unpredictable wait + the duration, and it appears
  // at a random position and size each trial so it can't be anticipated spatially.
  app.innerHTML = `
    <div class="fade-in">
      <p class="muted small center" id="vcount">Signal 1 of ${ex.trials}</p>
      <div id="vstage" tabindex="0" role="button" aria-label="Respond the moment the dot appears — tap or press Space" style="position:relative; height:320px; border-radius:18px; background:#0e1018; cursor:pointer; user-select:none; -webkit-tap-highlight-color:transparent; overflow:hidden;">
        <div id="vmsg" style="position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); color:#3a4055; font-size:1.5rem;">+</div>
        <div id="vdot" style="display:none; position:absolute; width:48px; height:48px; border-radius:50%; background:#ffffff; box-shadow:0 0 26px rgba(255,255,255,.65);"></div>
      </div>
      <p class="muted small center" style="margin-top:10px;">Tap — or press Space — the moment the dot appears, not before.</p>
    </div>`;
  const stage = document.getElementById('vstage');
  const dot = document.getElementById('vdot');
  const msg = document.getElementById('vmsg');
  const count = document.getElementById('vcount');

  const aborted = () => state.session !== s || state.route !== 'session';
  const clearT = () => { if (s._timer) { clearTimeout(s._timer); s._timer = null; } };

  const nextTrial = () => {
    if (aborted()) { clearT(); return; }
    if (s.trialIndex >= ex.trials) { clearT(); completeSession(); return; }
    count.textContent = `Signal ${s.trialIndex + 1} of ${ex.trials}`;
    s.stage = 'waiting';
    dot.style.display = 'none';
    msg.style.display = 'block'; // a neutral fixation '+', not the word "watch"
    msg.textContent = '+';
    const isi = ex.isiMin + Math.random() * (ex.isiMax - ex.isiMin);
    s._timer = setTimeout(() => {
      if (aborted()) { clearT(); return; }
      s.stage = 'signal';
      s.signalAt = performance.now();
      msg.style.display = 'none';
      // Random size + position each trial (clearly visible — opacity is full).
      const size = 34 + Math.round(Math.random() * 42); // 34–76px
      const w = stage.clientWidth || 320; const h = stage.clientHeight || 320;
      const left = Math.round(Math.random() * Math.max(0, w - size));
      const top = Math.round(Math.random() * Math.max(0, h - size));
      dot.style.width = dot.style.height = size + 'px';
      dot.style.left = left + 'px';
      dot.style.top = top + 'px';
      dot.style.display = 'block';
      s._timer = setTimeout(() => { // no response in time → miss
        if (aborted()) { clearT(); return; }
        s.response.trials.push({ rt: null, miss: true });
        s.trialIndex++;
        nextTrial();
      }, 2800);
    }, isi);
  };

  stage.onclick = () => {
    if (s.stage === 'waiting') {
      clearT();
      s.response.trials.push({ falseStart: true });
      s.trialIndex++;
      s.stage = 'idle';
      msg.textContent = 'too soon — wait for it…';
      s._timer = setTimeout(() => { if (!aborted()) nextTrial(); }, 700);
    } else if (s.stage === 'signal') {
      clearT();
      s.response.trials.push({ rt: performance.now() - s.signalAt });
      s.trialIndex++;
      s.stage = 'idle';
      dot.style.display = 'none';
      msg.style.display = 'block';
      msg.textContent = '✓';
      s._timer = setTimeout(() => { if (!aborted()) nextTrial(); }, 450);
    }
  };
  // Keyboard parity: this is a reaction-time measure, so a keyboard-only user
  // must be able to respond with a key — without it the whole Vigilance measure
  // is unperformable (every trial logs a miss). Space/Enter fire the same handler.
  stage.onkeydown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); stage.onclick(); }
  };
  stage.focus(); // so a keyboard user is ready without hunting for the target

  if (!s._started) { s._started = true; nextTrial(); }
}

// Mental Math — a 60-second timed arithmetic sprint. Answers auto-advance the
// instant they're correct. Built once; the loop updates DOM directly so the
// input keeps focus on mobile.
function renderMathFluency() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'math-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>Solve as many as you can in <strong>${ex.durationSec} seconds</strong> — in your head. Type each answer; it advances the instant you're right.</p>
          <p class="muted small">No calculator. Speed and accuracy both count. Skip any that stump you.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('begin').onclick = () => {
      s.phase = 'math-run';
      s.response.correct = 0;
      s.timeLeft = ex.durationSec;
      s.problem = nextMathProblem(ex.level);
      s._started = false;
      render();
    };
    return;
  }
  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><span class="muted small">${esc(ex.title)}</span><span class="spacer"></span>
        <span class="muted small">✓ <span id="mcorrect">${s.response.correct || 0}</span></span>
        <span class="trendpill flat" id="mtime" style="margin-left:10px;">${s.timeLeft}s</span></div>
      <div style="height:130px; display:grid; place-items:center;">
        <div id="mproblem" style="font-size:2.6rem; font-weight:800; color:var(--ink);">${esc(s.problem.text)} =</div>
      </div>
      <input id="manswer" inputmode="numeric" autocomplete="off" class="reflect-area" style="min-height:auto; height:auto; text-align:center; font-size:1.7rem; font-weight:700; padding:14px;" placeholder="?" />
      <button class="btn ghost" id="mskip" style="margin-top:10px;">Skip →</button>
    </div>`;
  const input = document.getElementById('manswer');
  const probEl = document.getElementById('mproblem');
  const correctEl = document.getElementById('mcorrect');
  const timeEl = document.getElementById('mtime');
  const nextProblem = () => {
    s.problem = nextMathProblem(ex.level);
    probEl.textContent = s.problem.text + ' =';
    input.value = '';
    input.focus();
  };
  input.oninput = () => {
    const v = input.value.trim();
    if (v === '' || v === '-') return;
    if (Number(v) === s.problem.answer) { s.response.correct = (s.response.correct || 0) + 1; correctEl.textContent = s.response.correct; nextProblem(); }
  };
  document.getElementById('mskip').onclick = nextProblem;
  input.focus();
  if (!s._started) {
    s._started = true;
    s._timer = setInterval(() => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      s.timeLeft--;
      if (timeEl) timeEl.textContent = s.timeLeft + 's';
      if (s.timeLeft <= 0) { clearInterval(s._timer); s._timer = null; completeSession(); }
    }, 1000);
  }
}

// Maze — cloze reading comprehension. Pick the word that fits the meaning.
function renderMaze() {
  const s = state.session;
  const ex = s.exercise;
  let bi = -1;
  // Shuffle each blank's option order once per session (the correct word is
  // authored first). The <option> value stays the ORIGINAL index, so scoring
  // against blank.answer is unaffected — only the visible order changes.
  s.mazeOrder = s.mazeOrder || {};
  const body = ex.parts.map((p) => {
    if (p.text != null) return esc(p.text);
    bi += 1;
    const idx = bi;
    if (!s.mazeOrder[idx]) s.mazeOrder[idx] = shuffledIndices(p.blank.options.length);
    return `<select class="mazesel" data-bi="${idx}" aria-label="choose the word that fits">
      <option value="-1" selected disabled>—</option>
      ${s.mazeOrder[idx].map((i) => `<option value="${i}">${esc(p.blank.options[i])}</option>`).join('')}
    </select>`;
  }).join('');
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Pick the word that fits the meaning of each gap. Read for the sense.</p>
      <div class="passage" style="line-height:2.4;">${body}</div>
      <button class="btn amber" id="mazedone">Check my reading</button>
    </div>`;
  document.getElementById('mazedone').onclick = () => {
    s.response.answers = [...app.querySelectorAll('.mazesel')].map((el) => Number(el.value));
    completeSession();
  };
}

// Matrix reasoning — SVG shapes; pick the option completing the pattern.
function matrixShape(shape, fill) {
  const f = fill ? 'var(--accent)' : 'none';
  const st = 'var(--accent)';
  if (shape === 'circle') return `<svg width="20" height="20" viewBox="0 0 22 22"><circle cx="11" cy="11" r="8" fill="${f}" stroke="${st}" stroke-width="2.5"/></svg>`;
  if (shape === 'square') return `<svg width="20" height="20" viewBox="0 0 22 22"><rect x="3" y="3" width="16" height="16" rx="2" fill="${f}" stroke="${st}" stroke-width="2.5"/></svg>`;
  return `<svg width="20" height="20" viewBox="0 0 22 22"><polygon points="11,3 19,19 3,19" fill="${f}" stroke="${st}" stroke-width="2.5" stroke-linejoin="round"/></svg>`;
}
function matrixCell(spec) {
  if (!spec) return '<span style="font-size:1.6rem; color:var(--ink-faint); font-weight:800;">?</span>';
  let out = '';
  for (let i = 0; i < spec.n; i++) out += matrixShape(spec.shape, spec.fill);
  return `<span style="display:inline-flex; gap:3px; align-items:center;">${out}</span>`;
}
function renderMatrix() {
  const s = state.session;
  const ex = s.exercise;
  const chosen = s.response.optionId;
  const revealed = s.revealed;
  const cells = [ex.grid[0], ex.grid[1], ex.grid[2], null];
  // Shuffle the option ORDER once per session (correct answer is authored first,
  // so an unshuffled list would be gameable). data-i keeps the ORIGINAL index,
  // so selection + scoring are unchanged.
  if (!s.optOrder) s.optOrder = shuffledIndices(ex.options.length);
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Which option completes the pattern?</p>
      <div class="matgrid">${cells.map((c) => `<div class="matcell">${matrixCell(c)}</div>`).join('')}</div>
      <p class="muted small" style="margin-top:14px;">Choose:</p>
      <div class="matopts">
        ${s.optOrder.map((i) => {
          const o = ex.options[i];
          let cls = 'matopt';
          if (revealed) { if (i === ex.answer) cls += ' correct'; else if (i === chosen) cls += ' wrong'; }
          else if (i === chosen) cls += ' selected';
          // Correctness twin: matrix buttons carry an aria-label (it overrides the
          // SVG content for AT), so the right/wrong state must ride ON that label,
          // and a glyph carries it for color-blind sighted users — the matopt
          // background color was the only signal before.
          const mark = revealed ? (i === ex.answer ? ', correct answer' : i === chosen ? ', your answer, not correct' : '') : '';
          const glyph = revealed ? (i === ex.answer ? '<span class="mark correct" aria-hidden="true">✓</span>' : i === chosen ? '<span class="mark wrong" aria-hidden="true">✕</span>' : '') : '';
          return `<button class="${cls}" data-i="${i}" aria-pressed="${!revealed && i === chosen}" aria-label="Pattern option ${o.n} ${o.fill ? 'filled' : 'outline'} ${o.shape}${o.n === 1 ? '' : 's'}${mark}" ${revealed ? 'disabled' : ''}>${matrixCell(o)}${glyph}</button>`;
        }).join('')}
      </div>
      ${revealed
        ? `<div class="rationale" style="margin-top:14px;">${esc(ex.explanation)}</div><button class="btn" id="fin" style="margin-top:12px;">Continue →</button>`
        : `<button class="btn" id="reveal" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">Lock in my answer</button>`}
    </div>`;
  if (!revealed) {
    app.querySelectorAll('.matopt').forEach((b) => b.onclick = () => { s.response.optionId = Number(b.dataset.i); render(); });
    document.getElementById('reveal').onclick = () => {
      s.revealed = true;
      announce(chosen === ex.answer ? `Correct. ${ex.explanation}` : `Not quite. ${ex.explanation}`);
      render();
    };
  } else {
    document.getElementById('fin').onclick = completeSession;
  }
}

// Digit Span Backward — memorize digits, recall them in reverse.
function renderDigitSpan() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'digit-show') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <p class="muted small">Memorize these digits — then you'll enter them <strong>backward</strong>.</p>
        <div class="memo-words" style="gap:16px;">${ex.digits.map((d) => `<span class="memo-word" style="font-size:2rem;">${d}</span>`).join('')}</div>
        <div class="memo-countdown" id="cd">${Math.ceil(ex.showMs / 1000)}</div>
      </div>`;
    let left = Math.ceil(ex.showMs / 1000);
    const cd = document.getElementById('cd');
    if (s._timer) clearInterval(s._timer);
    s._timer = setInterval(() => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      left -= 1;
      if (cd) cd.textContent = left;
      if (left <= 0) { clearInterval(s._timer); s._timer = null; s.phase = 'digit-recall'; s.response.recalled = []; render(); }
    }, 1000);
    return;
  }
  const recalled = s.response.recalled || [];
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Enter the digits <strong>in reverse order</strong> — the last one first.</p>
      <div class="slot-row" id="slots">${recalled.length ? recalled.map((d, i) => `<button type="button" class="slot" data-rm="${i}" aria-label="Remove ${esc(d)}">${esc(d)} ✕</button>`).join('') : '<span class="muted small">backward…</span>'}</div>
      <div class="chiprow" style="justify-content:center; gap:8px;">${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => `<button class="chip" data-d="${n}" style="min-width:54px; font-size:1.25rem; font-weight:700;">${n}</button>`).join('')}</div>
      <button class="btn" id="done" ${recalled.length === 0 ? 'disabled' : ''} style="margin-top:16px;">Check</button>
    </div>`;
  app.querySelectorAll('.chip[data-d]').forEach((b) => b.onclick = () => { s.response.recalled = [...(s.response.recalled || []), b.dataset.d]; render(); });
  app.querySelectorAll('.slot[data-rm]').forEach((el) => el.onclick = () => { s.response.recalled.splice(Number(el.dataset.rm), 1); render(); });
  document.getElementById('done').onclick = completeSession;
}

// Sentence Completion — finish open stems; Claude scores self-awareness.
function renderSentence() {
  const s = state.session;
  const ex = s.exercise;
  s.response.completions = s.response.completions || ex.stems.map(() => '');
  if (s.phase === 'sentence-scoring') {
    app.innerHTML = `
      <div class="fade-in center" style="padding-top:60px;">
        <div class="spinner" style="width:28px;height:28px;"></div>
        <p class="muted" style="margin-top:16px;">Reading what you wrote…</p>
      </div>`;
    return;
  }
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Finish each sentence honestly — the first true thing, not the polished one. No wrong answers.</p>
      ${ex.stems.map((st, i) => `
        <div class="card" style="padding:14px;">
          <div class="likert-q" style="font-size:1rem;">${esc(st)} …</div>
          <div class="microw">
            <input class="reflect-area sentinput" data-i="${i}" style="min-height:auto; height:auto; padding:10px; font-size:1rem;" value="${esc(s.response.completions[i])}" placeholder="…" />
            <button class="btn ghost mic-inline amber" data-mic="${i}" aria-label="Dictate this answer by voice">🎤</button>
          </div>
        </div>`).join('')}
      ${micPrivacyNote()}
      <button class="btn amber" id="sentdone">Done →</button>
      <p class="muted small center" id="senthint" style="margin-top:8px;"></p>
    </div>`;
  app.querySelectorAll('.sentinput').forEach((el) => {
    el.oninput = () => { s.response.completions[Number(el.dataset.i)] = el.value; };
    attachMicButton(app.querySelector(`[data-mic="${el.dataset.i}"]`), el);
  });
  document.getElementById('sentdone').onclick = async () => {
    const done = s.response.completions.filter((c) => c.trim()).length;
    if (done < Math.ceil(ex.stems.length / 2)) {
      const h = document.getElementById('senthint');
      if (h) { h.style.color = 'var(--ink-faint)'; h.textContent = 'Finish at least half before you send.'; }
      return;
    }
    s.phase = 'sentence-scoring';
    render();
    const result = await Coach.scoreSentences(ex.stems, s.response.completions, state.profile);
    // Never fabricate a score: null = "not measured" (no key / API fail / bad parse).
    s.response.aiScore = (result && result.score != null) ? result.score : null;
    s.response.feedback = (result && result.feedback) ? result.feedback
      : 'Saved — this reflection needs the live coach to read it. Add a Claude key in Settings and it’ll be scored next time. Either way, finishing it honestly counts.';
    completeSession();
  };
}

// Follow the Dot — visuomotor pursuit tracking. Keep your finger/cursor on the
// moving target; we measure the proportion of time you stay on it.
function renderPursuit() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'pursuit-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>A dot will drift around the panel for ${ex.durationSec} seconds. Keep your <strong>finger (or cursor) right on it</strong> the whole time.</p>
          <p class="muted small">It measures how steadily you can hold and track attention. Don’t lift off — just follow.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.phase = 'pursuit-run'; s.response.onFrames = 0; s.response.totalFrames = 0; s._started = false; render(); };
    return;
  }
  const W = 320; const H = 320;
  app.innerHTML = `
    <div class="fade-in">
      <p class="muted small center" id="ptime">${ex.durationSec}s</p>
      <svg id="pstage" viewBox="0 0 ${W} ${H}" width="100%" style="max-width:340px; display:block; margin:0 auto; background:#0e1018; border-radius:18px; touch-action:none;">
        <circle id="ptarget" cx="${W / 2}" cy="${H / 2}" r="15" fill="var(--accent)"/>
        <circle id="pcursor" cx="${W / 2}" cy="${H / 2}" r="6" fill="#fff" opacity="0.9"/>
      </svg>
      <p class="muted small center" style="margin-top:8px;">On target: <span id="ponpct">—</span></p>
    </div>`;
  const stage = document.getElementById('pstage');
  const target = document.getElementById('ptarget');
  const cursor = document.getElementById('pcursor');
  const timeEl = document.getElementById('ptime');
  const pctEl = document.getElementById('ponpct');
  let px = W / 2; let py = H / 2;
  const toSvg = (clientX, clientY) => {
    const rect = stage.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * W, y: ((clientY - rect.top) / rect.height) * H };
  };
  stage.onpointermove = (e) => { const q = toSvg(e.clientX, e.clientY); px = q.x; py = q.y; cursor.setAttribute('cx', px); cursor.setAttribute('cy', py); };
  if (!s._started) {
    s._started = true;
    s.startT = performance.now();
    const dur = ex.durationSec * 1000;
    const loop = () => {
      if (state.session !== s || state.route !== 'session') { s._raf = null; return; }
      const t = performance.now() - s.startT;
      const cx = W / 2 + (W / 2 - 28) * Math.sin((ex.speed * t) / 1000);
      const cy = H / 2 + (H / 2 - 28) * Math.sin((ex.speed * t) / 1000 * 1.4 + 1);
      target.setAttribute('cx', cx); target.setAttribute('cy', cy);
      s.response.totalFrames += 1;
      if (Math.hypot(px - cx, py - cy) <= ex.radiusPx) s.response.onFrames += 1;
      if (timeEl) timeEl.textContent = Math.max(0, Math.ceil((dur - t) / 1000)) + 's';
      if (pctEl && s.response.totalFrames % 6 === 0) pctEl.textContent = Math.round((s.response.onFrames / s.response.totalFrames) * 100) + '%';
      if (t >= dur) { s._raf = null; completeSession(); return; }
      s._raf = requestAnimationFrame(loop);
    };
    s._raf = requestAnimationFrame(loop);
  }
}

function stopMic(s) {
  if (s && s.recognizer) { try { s.recognizer.stop(); } catch (e) { /* noop */ } s.recognizer = null; }
}

// Wire a mic button to a textarea/input for on-device dictation. Generic so the
// coach composer, the contemplation reflection, and the reflection screen all
// Honest disclosure at the point of egress: the Web Speech API is NOT on-device
// in every browser (Chrome streams mic audio to Google to transcribe). A privacy-
// first app must say so where the mic is offered, and point to typing as the
// fully-on-device path. Shown only when dictation is actually available.
function micPrivacyNote() {
  return speechSupported()
    ? '<p class="muted small" style="margin-top:6px;">Voice uses your browser’s dictation — in some browsers (e.g. Chrome) the audio is sent to its speech service to transcribe. Type instead to keep it fully on your device.</p>'
    : '';
}

// share it. Deliberately light: it writes straight into the field and toggles
// the button without re-rendering, so the surrounding view (e.g. the chat log)
// never rebuilds mid-dictation. Hides itself where speech isn't supported.
function attachMicButton(btn, input) {
  if (!btn || !input) return;
  if (!speechSupported()) { btn.style.display = 'none'; return; }
  let rec = null;
  let recording = false;
  let committed = input.value; // text fixed before/between phrases
  // Accessible name: the button's content is only an emoji that toggles to '■'
  // mid-recording, so a screen reader would otherwise announce nothing usable.
  // Respect any idle label already on the button (e.g. "Dictate your message"
  // on the coach mic); default for the rest. Keep it stable through the toggle.
  const idleLabel = btn.getAttribute('aria-label') || 'Dictate by voice';
  // Keep `committed` current when the person types by hand (but not while the
  // recognizer is the one writing — that path manages `committed` itself).
  input.addEventListener('input', () => { if (!recording) committed = input.value; });
  const setUI = (on) => {
    recording = on;
    btn.textContent = on ? '■' : '🎤';
    btn.setAttribute('aria-label', on ? 'Stop dictation' : idleLabel);
    btn.classList.toggle('green', on);
    btn.classList.toggle('amber', !on);
  };
  const write = (extra) => {
    input.value = (committed + (committed && extra ? ' ' : '') + extra).trim();
    input.dispatchEvent(new Event('input')); // let callers persist via their oninput
  };
  const release = () => { if (_activeMic === rec) _activeMic = null; };
  btn.onclick = () => {
    if (recording) { try { rec && rec.stop(); } catch (e) { /* noop */ } release(); committed = input.value; setUI(false); return; }
    committed = input.value;
    rec = createRecognizer({
      onInterim: (t) => write(t),
      onFinal: (t) => { committed = (committed + (committed ? ' ' : '') + t).trim(); write(''); },
      onError: () => { try { rec && rec.stop(); } catch (e) { /* noop */ } release(); committed = input.value; setUI(false); },
      onEnd: () => { release(); if (recording) { committed = input.value; setUI(false); } },
    });
    if (!rec) { btn.style.display = 'none'; return; }
    // Stop any other live mic before claiming the singleton slot.
    stopActiveMic();
    try { rec.start(); _activeMic = rec; setUI(true); } catch (e) { setUI(false); }
  };
}

// Vignette — the AI-scored communication exercise. Respond out loud (voice-first,
// on-device transcription) or type; Claude scores it and gives formative feedback.
function renderVignette() {
  const s = state.session;
  const ex = s.exercise;
  s.response.transcript = s.response.transcript || '';
  if (s.phase === 'vignette-scoring') {
    app.innerHTML = `
      <div class="fade-in center" style="padding-top:60px;">
        <div class="spinner" style="width:28px;height:28px;"></div>
        <p class="muted" style="margin-top:16px;">Reading your response…</p>
      </div>`;
    return;
  }
  const supported = speechSupported();
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <div class="passage">${esc(ex.scenario)}</div>
      <p class="likert-q" style="font-size:1.05rem;">${esc(ex.prompt)}</p>
      <p class="muted small">${supported ? 'Speak your answer or type it — either way your words land in the box, and you can edit before sending. Voice uses your browser’s dictation, so in some browsers (e.g. Chrome) the audio is sent to its speech service; type to keep it fully on your device.' : 'Type your response below.'}</p>
      ${supported ? `
        <div class="center" style="margin:8px 0 2px;">
          <button class="btn ${s.recording ? 'green' : 'amber'}" id="mic" style="width:auto;">${s.recording ? '■ Stop recording' : '🎤 Speak'}</button>
        </div>
        ${s.recording ? '<p class="muted small center">Listening… speak naturally, then tap Stop.</p>' : ''}
      ` : ''}
      <textarea class="reflect-area" id="vresp" placeholder="${supported ? 'Speak or type your response…' : 'Type your response…'}">${esc(s.response.transcript)}</textarea>
      <button class="btn amber" id="vsubmit" style="margin-top:14px;">Send my response →</button>
    </div>`;

  const ta = document.getElementById('vresp');
  ta.oninput = () => { s.response.transcript = ta.value; };

  const mic = document.getElementById('mic');
  if (mic) mic.onclick = () => {
    if (s.recording) { stopMic(s); s.recording = false; render(); return; }
    s.recognizer = createRecognizer({
      onInterim: (t) => { const el = document.getElementById('vresp'); if (el) el.value = (s.response.transcript + ' ' + t).trim(); },
      onFinal: (t) => {
        s.response.transcript = (s.response.transcript + ' ' + t).trim();
        const el = document.getElementById('vresp'); if (el) el.value = s.response.transcript;
      },
      onError: () => { s.recording = false; stopMic(s); render(); },
      onEnd: () => {
        // iOS often auto-ends; reflect that in the button without nuking text.
        if (s.recording) { s.recording = false; const m = document.getElementById('mic'); if (m) { m.classList.remove('green'); m.classList.add('amber'); m.textContent = '🎤 Speak'; } }
      },
    });
    // If the recognizer can't start, the text box is already there to type into.
    if (!s.recognizer) { return; }
    try { s.recognizer.start(); s.recording = true; render(); }
    catch (e) { s.recording = false; }
  };

  document.getElementById('vsubmit').onclick = async () => {
    const text = (s.response.transcript || '').trim();
    if (!text) return;
    stopMic(s); s.recording = false;
    s.phase = 'vignette-scoring';
    render();
    const result = await Coach.scoreVignette(ex, text, state.profile);
    // Never fabricate a score: null = "not measured" (no key / API fail / bad parse).
    s.response.aiScore = (result && result.score != null) ? result.score : null;
    s.response.feedback = (result && result.feedback) ? result.feedback
      : 'Saved — this one needs the live coach to read it. Add a Claude key in Settings and it’ll be scored next time. Either way, working through a hard conversation counts.';
    s.response.transcript = text;
    completeSession();
  };
}

// Stay — behavioral persistence. Staying with the hard item is the signal.
function renderStay() {
  const s = state.session;
  const ex = s.exercise;
  const phase = s.stayPhase || 'puzzle';
  if (phase === 'puzzle') {
    // Stamp when the puzzle first appears, so we can measure how long they
    // actually sat with it (dwell) — the behavioral half of frustration tolerance.
    if (s._stayShownAt == null) s._stayShownAt = Date.now();
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="passage">${esc(ex.prompt)}</div>
        <p class="muted small">No tools, no searching. Work it in your head. The point isn’t getting it — it’s staying in the not-knowing.</p>
        <div class="stack" style="margin-top:8px;">
          <button class="btn amber" id="stayed">I stuck with it →</button>
          <button class="btn ghost" id="skipped">This is too hard — skip</button>
        </div>
      </div>`;
    document.getElementById('stayed').onclick = () => {
      s.response.dwellMs = Date.now() - (s._stayShownAt || Date.now());
      s.response.stayed = true; s.stayPhase = 'rate'; render();
    };
    document.getElementById('skipped').onclick = () => {
      s.response.dwellMs = Date.now() - (s._stayShownAt || Date.now());
      s.response.stayed = false; s.stayPhase = 'rate'; render();
    };
    return;
  }
  // rate + reveal
  const rating = s.response.selfRating;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <div class="rationale"><strong>The answer:</strong> ${esc(ex.answer)}<br/>${esc(ex.explanation)}</div>
      <p class="muted small" style="margin-top:14px;">Honestly — how well did you tolerate the difficulty just now?</p>
      <div class="rating">
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${rating === n ? 'on' : ''}" data-n="${n}" aria-pressed="${rating === n}" aria-label="Rate ${n} of 5">${n}</button>`).join('')}
      </div>
      <button class="btn" id="fin" ${rating == null ? 'disabled' : ''}>Complete session</button>
    </div>`;
  app.querySelectorAll('.rating button').forEach((b) => b.onclick = () => { s.response.selfRating = Number(b.dataset.n); render(); });
  document.getElementById('fin').onclick = completeSession;
}

// Contemplation — a timed silence practice (Interior Life).
function renderContemplation() {
  const s = state.session;
  const ex = s.exercise;
  if (s.phase === 'contempl-intro') {
    const soundLine = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
      ? 'A soft chime sounds at the halfway point and again at the end — so you can close your eyes and let your ears keep time.'
      : '';
    const durations = ex.durations || [ex.targetSeconds];
    const chosen = s.chosenSeconds || ex.targetSeconds;
    const fmt = (d) => (d < 120 ? `${d}s` : `${d / 60} min`);
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card"><p>${esc(ex.prompt)}</p>
        <p class="muted small">If your mind wanders, just come back. Coming back <em>is</em> the practice.</p>
        ${soundLine ? `<p class="muted small">${soundLine}</p>` : ''}
        <p class="muted small" style="margin-top:10px;">How long? You can extend as stillness gets easier.</p>
        <div class="row" style="gap:8px; flex-wrap:wrap;">
          ${durations.map((d) => `<button class="chip${chosen === d ? ' sel' : ''}" data-dur="${d}" aria-pressed="${chosen === d}">${fmt(d)}</button>`).join('')}
        </div></div>
        <button class="btn amber" id="begin">Begin the silence</button>
      </div>`;
    app.querySelectorAll('[data-dur]').forEach((b) => b.onclick = () => { s.chosenSeconds = Number(b.dataset.dur); render(); });
    document.getElementById('begin').onclick = () => {
      // Create + unlock audio inside the tap — iOS only allows it here.
      s._tones = createTones();
      if (s._tones) { s._tones.unlock(); s._tones.start(); }
      s.targetSeconds = s.chosenSeconds || ex.targetSeconds;
      s.phase = 'contempl-run';
      s.remaining = s.targetSeconds;
      s.response.seconds = 0;
      render();
    };
    return;
  }

  // ----- reflection after the silence -----
  if (s.phase === 'contempl-reflect') return renderContemplationReflect();

  // ----- the silence itself -----
  // No numeric countdown on purpose: a ticking number pulls you out and contradicts
  // "close your eyes." A calm breathing dot is the only focal point, and the ears
  // keep time — one chime at the halfway mark, one at the end.
  const target = s.targetSeconds || ex.targetSeconds;
  const half = Math.max(1, Math.floor(target / 2));
  app.innerHTML = `
    <div class="fade-in center">
      <p class="muted small" style="margin-top:20px;">${esc(getDomain('interior').icon)} Be still.</p>
      <div class="stillness-dot" aria-hidden="true"></div>
      <p class="muted small" style="margin-top:30px;">Put the phone down. Close your eyes if you like. Breathe — a chime will mark the halfway point and the end.</p>
      <button class="btn ghost sm" id="endearly" style="width:auto; margin-top:24px;">End early</button>
    </div>`;
  const toReflect = () => {
    if (s._timer) { clearInterval(s._timer); s._timer = null; }
    // Detach now, but let any closing chime finish ringing before we tear the
    // audio context down.
    if (s._tones) { const t = s._tones; s._tones = null; setTimeout(() => t.close(), 2500); }
    s.phase = 'contempl-reflect';
    render();
  };
  document.getElementById('endearly').onclick = () => {
    s.response.seconds = target - s.remaining;
    toReflect();
  };
  if (!s._timer) {
    s._timer = setInterval(() => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      s.remaining--;
      const elapsed = target - s.remaining;
      if (s.remaining <= 0) {
        s.response.seconds = target;
        if (s._tones) s._tones.done();
        toReflect();
      } else if (elapsed === half) {
        // Single halfway chime (no every-30s marker, no final-10 ticks).
        if (s._tones) s._tones.interval();
        announce('Halfway.');
      }
    }, 1000);
  }
}

// After the silence: a short, optional reflection so the rep isn't just "time
// elapsed." Captures where the mind went (voice or type), eyes, how the time
// FELT, and an honest 1–7 presence rating that feeds the score.
function renderContemplationReflect() {
  const s = state.session;
  const ex = s.exercise;
  const r = s.response;
  const eyesOpts = [['closed', 'Closed'], ['open', 'Open'], ['both', 'Some of each']];
  const timeOpts = [['short', 'Shorter than it was'], ['right', 'About right'], ['long', 'Longer than it was']];
  const presence = r.presence;
  const distraction = r.distraction;
  const sat = r.seconds != null ? r.seconds : (s.targetSeconds || ex.targetSeconds); // 0 is a real value — don't fall back
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">You stayed for ${sat} second${sat === 1 ? '' : 's'}. Before the score, stay a moment with what it was like — this is the part that forms you.</p>

      <p class="likert-q" style="font-size:1.05rem; margin-top:14px;">Where did your mind go? What was it like — and did anything pull you out?</p>
      <div class="row" style="gap:8px; align-items:flex-start;">
        <textarea class="reflect-area" id="cnote" placeholder="A few honest words. Type or speak.">${esc(r.note || '')}</textarea>
        <button class="btn amber" id="cnotemic" aria-label="Dictate your reflection" style="width:auto; padding:12px 14px; align-self:flex-start;">🎤</button>
      </div>
      ${micPrivacyNote()}

      <p class="muted small" style="margin-top:16px;">Your eyes were…</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        ${eyesOpts.map(([v, lbl]) => `<button class="chip${r.eyes === v ? ' sel' : ''}" data-eyes="${v}" aria-pressed="${r.eyes === v}">${lbl}</button>`).join('')}
      </div>

      <p class="muted small" style="margin-top:16px;">The time felt…</p>
      <div class="row" style="gap:8px; flex-wrap:wrap;">
        ${timeOpts.map(([v, lbl]) => `<button class="chip${r.timeFelt === v ? ' sel' : ''}" data-time="${v}" aria-pressed="${r.timeFelt === v}">${lbl}</button>`).join('')}
      </div>

      <p class="muted small" style="margin-top:18px;">Honestly — how present were you? <span style="opacity:.7;">(1 scattered · 7 fully here)</span></p>
      <div class="rating">
        ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button class="${presence === n ? 'on' : ''}" data-n="${n}" aria-pressed="${presence === n}" aria-label="${n} of 7, ${n === 1 ? 'scattered' : n === 7 ? 'fully present' : ''}">${n}</button>`).join('')}
      </div>

      <p class="muted small" style="margin-top:18px;">How stirred up or distracted were you? <span style="opacity:.7;">(1 calm &amp; settled · 7 very stirred)</span></p>
      <div class="rating">
        ${[1, 2, 3, 4, 5, 6, 7].map((n) => `<button class="${distraction === n ? 'on' : ''}" data-d="${n}" aria-pressed="${distraction === n}" aria-label="${n} of 7, ${n === 1 ? 'calm and settled' : n === 7 ? 'very stirred' : ''}">${n}</button>`).join('')}
      </div>

      <button class="btn" id="cfin" ${presence == null ? 'disabled' : ''}>Complete session</button>
    </div>`;

  const note = document.getElementById('cnote');
  note.oninput = () => { r.note = note.value; };
  attachMicButton(document.getElementById('cnotemic'), note);

  app.querySelectorAll('[data-eyes]').forEach((b) => b.onclick = () => { r.eyes = b.dataset.eyes; render(); });
  app.querySelectorAll('[data-time]').forEach((b) => b.onclick = () => { r.timeFelt = b.dataset.time; render(); });
  // Scope each Likert by its own data attribute so the two scales never cross-wire.
  app.querySelectorAll('[data-n]').forEach((b) => b.onclick = () => { r.presence = Number(b.dataset.n); render(); });
  app.querySelectorAll('[data-d]').forEach((b) => b.onclick = () => { r.distraction = Number(b.dataset.d); render(); });
  document.getElementById('cfin').onclick = completeSession;
}

function renderReflection() {
  const s = state.session;
  const ex = s.exercise;
  const rating = s.response.selfRating;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="likert-q" style="font-size:1.05rem;">${esc(ex.prompt)}</p>
      <div class="row" style="gap:8px; align-items:flex-start;">
        <textarea class="reflect-area" id="ref" placeholder="Write or speak a few honest sentences.">${esc(s.response.text || '')}</textarea>
        <button class="btn amber" id="refmic" aria-label="Dictate your reflection" style="width:auto; padding:12px 14px; align-self:flex-start;">🎤</button>
      </div>
      ${micPrivacyNote()}
      <p class="muted small" style="margin-top:14px;">${esc(ex.selfRatingLabel)}</p>
      <div class="rating">
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${rating === n ? 'on' : ''}" data-n="${n}" aria-pressed="${rating === n}" aria-label="Rate ${n} of 5">${n}</button>`).join('')}
      </div>
      <button class="btn" id="fin" ${rating == null ? 'disabled' : ''}>Complete session</button>
    </div>`;
  const ref = document.getElementById('ref');
  ref.oninput = (e) => { s.response.text = e.target.value; };
  attachMicButton(document.getElementById('refmic'), ref);
  app.querySelectorAll('.rating button').forEach((b) => b.onclick = () => {
    s.response.selfRating = Number(b.dataset.n);
    render();
  });
  document.getElementById('fin').onclick = completeSession;
}

async function completeSession() {
  const s = state.session;
  if (!s || s._completed) return; // one-shot: neutralizes every double-fire path
  s._completed = true;
  if (s._timer) { clearInterval(s._timer); s._timer = null; }
  const rawScore = scoreExercise(s.exercise, s.response);
  const { profile, session } = Profile.applySession(state.profile, s.exercise, s.response);
  state.profile = profile;
  // De-identified, consent-gated research capture (no-op until the user opts in).
  // Passes the RAW response so item analysis can keep the short keyed option id;
  // research.buildEvent reads only that, never any free text or interior content.
  Research.recordSession(state.profile, session, s.response);
  save();

  // Earned milestones: a domain scale crossing into a higher band is the real
  // reward (genuine measured growth, not points). A streak mark backs it up.
  // Only celebrate a band crossing once the domain has enough evidence that it
  // reflects real growth, not one lucky session swinging the EMA over a boundary.
  const ascension = milestoneEligible(profile, session.domain)
    ? bandAscension(session.prevDomainScore, session.newDomainScore, session.domain, session.priorBandPeak)
    : null;
  const streakMark = streakMilestone(profile.streak && profile.streak.current);
  const graced = !!(profile.streak && profile.streak.graced);
  const milestoneBanner = ascension
    ? `<div class="milestone" role="status" style="--mile:${ascension.band.color}">
         <div class="mile-rule">↑ Milestone</div>
         <div class="mile-head">${esc(ascensionLine(ascension))}</div>
         <div class="mile-note">${esc(ascension.band.note)}</div>
       </div>`
    : (streakMark
      ? `<div class="milestone" role="status" style="--mile:var(--amber)">
           <div class="mile-rule">🔥 Streak</div>
           <div class="mile-head">${streakMark}-day streak</div>
           <div class="mile-note">Showing up is the formation. Keep the chain alive.</div>
         </div>`
      : (graced
        ? `<div class="milestone" role="status" style="--mile:var(--amber)">
             <div class="mile-rule">🛟 Grace day</div>
             <div class="mile-head">Your ${profile.streak.current}-day streak held</div>
             <div class="mile-note">You missed a day and came back — that's the harder rep. The streak doesn't count the gap, but it didn't break either. Grace is spent now; show up tomorrow and it's restored.</div>
           </div>`
        : ''));

  // A gentle forward-pull: what tomorrow's plan points at, so finishing today
  // ends with a concrete reason to come back.
  const _tf = Planner.tomorrowFocus(profile) || recommendFocus(profile);
  const _td = _tf ? getDomain(_tf) : null;
  const tomorrowNudge = _td
    ? `<p class="muted small center" style="margin:2px 0 12px;">Tomorrow: <strong>${_td.icon} ${esc(_td.name)}</strong> — ${esc(_td.short.toLowerCase())}.</p>`
    : '';

  // Reveal score (count-up), then fetch the one insight. An unscored AI session
  // (rawScore null) shows no number/band — we never display a fabricated score —
  // just a "reflection saved" line and the coach's feedback.
  const unscored = rawScore == null;
  const band = unscored ? null : bandFor(rawScore);
  app.innerHTML = `
    <div class="fade-in">
      <div class="score-reveal">
        <div id="srscore" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
        ${unscored
          ? `<div class="lbl" style="margin-top:6px;">${esc(getDomain(s.exercise.domain).name)} · reflection saved</div>`
          : `<div class="big score-pop" id="bigscore" aria-hidden="true" style="color:${band.color}">0</div>
        <div class="lbl">${esc(getDomain(s.exercise.domain).name)} · ${band.label}</div>`}
      </div>
      ${milestoneBanner}
      <div class="card" id="insight" aria-live="polite">
        <div class="row"><span class="spinner"></span> <span class="muted">Your coach is reading the session…</span></div>
      </div>
      <button class="btn ghost" id="talkthrough" style="margin-bottom:10px;">💬 Talk this through with the coach →</button>
      ${tomorrowNudge}
      <button class="btn amber" id="home">Done →</button>
    </div>`;
  document.getElementById('home').onclick = () => { state.session = null; go('home'); };
  document.getElementById('talkthrough').onclick = () => {
    const ctx = {
      kind: 'session',
      domain: s.exercise.domain,
      exerciseLabel: s.exercise.title || s.exercise.type,
      score: rawScore,
      insight: state.profile._lastInsight && state.profile._lastInsight.text,
    };
    state.session = null;
    talkThrough(ctx);
  };
  if (!unscored) countUp(document.getElementById('bigscore'), rawScore);
  // Announce the result to screen readers: the count-up number is aria-hidden
  // (its 0→N churn shouldn't be spoken) and a live region rendered EMPTY is only
  // announced when JS changes it — so set the settled phrase here, post-render,
  // as one atomic update. Without this an SR user never hears their score.
  const srScore = document.getElementById('srscore');
  if (srScore) {
    srScore.textContent = unscored
      ? `${getDomain(s.exercise.domain).name} reflection saved.`
      : `${getDomain(s.exercise.domain).name}: ${rawScore} out of 100, ${band.label}.`;
  }

  // The vignette already produced Claude's rubric feedback — use it as the
  // insight rather than asking for a generic one.
  let insight;
  if ((s.exercise.type === 'vignette' || s.exercise.type === 'sentence') && s.response.feedback) {
    insight = { text: s.response.feedback, live: true };
  } else {
    // Soft timeout: if a live key stalls, fall back to the rule-based insight
    // rather than spinning forever during the payoff moment.
    const fallback = { text: ruleDailyInsight(session, state.profile), live: false };
    insight = await raceTimeout(Coach.dailyInsight(session, state.profile), 9000, fallback);
  }
  state.profile._lastInsight = insight; // shown on home too
  const el = document.getElementById('insight');
  if (el) el.innerHTML = `
    <div class="insight fade-in ${insight.live ? 'live' : ''}" style="border:none;padding:0;">
      <div class="k">One insight</div>
      <div style="margin-top:8px; white-space:pre-wrap;">${esc(insight.text)}</div>
    </div>`;
}

// The individual's own AI-Readiness — the headline metric of the whole thesis,
// previously visible only in the employer/cohort view. Composite of the four
// AI-transition capacities, with each contributor and an honest "incomplete"
// note when a feeding capacity hasn't been measured yet.
function aiReadinessCard(p) {
  const air = Team.aiReadinessOf(p.domainScores);
  const contributors = Team.AI_READINESS_DOMAINS
    .filter((id) => p.domainScores[id] != null)
    .map((id) => ({ id, name: getDomain(id).name, score: p.domainScores[id], band: bandFor(p.domainScores[id]), conf: confidence(p, id).level }));
  const missing = Team.AI_READINESS_DOMAINS
    .filter((id) => p.domainScores[id] == null)
    .map((id) => getDomain(id).name);
  const anyProvisional = contributors.some((c) => c.conf === 'provisional');
  return `
    <div class="card airead" style="border-left:4px solid var(--accent);">
      <div class="row"><strong>AI-Readiness</strong>
        <span class="spacer"></span>
        <span class="kbig" style="font-size:1.7rem; color:var(--accent);">${air == null ? '—' : air}</span></div>
      <p class="muted small" style="margin-top:2px;">The capacities that keep you irreplaceable as AI does more of the cognitive work — judgment over its output, independence from it, deep reading, and clear communication.</p>
      <div class="airgrid">
        ${contributors.map((c) => `
          <div class="airchip" title="${esc(c.name)}: ${esc(c.band.label)}">
            <span class="airdot" style="background:${c.band.color};"></span>
            <span class="airnm">${esc(c.name)}</span>
            <span class="airsc">${c.score}</span>
          </div>`).join('')}
      </div>
      ${missing.length
        ? `<p class="muted small" style="margin-top:8px;">Train ${esc(missing.join(' & '))} to complete this score.</p>`
        : (anyProvisional ? `<p class="muted small" style="margin-top:8px;">Firms up as you keep training these four.</p>` : '')}
    </div>`;
}

// ---------------- progress ----------------
function renderProgress() {
  const p = state.profile;
  const fi = formationIndex(p.domainScores);
  const idxPts = (p.indexHistory || []).map((x) => x.formationIndex);
  app.innerHTML = `
    <div class="fade-in">
      <h1>Progress</h1>
      <div class="card">
        <div class="row"><strong>Formation Index</strong><span class="spacer"></span><span class="kbig" style="font-size:1.6rem;">${fi}</span></div>
        ${(() => {
          // Same headline-honesty treatment as Home (v112): on thin evidence the
          // Index is provisional. Progress is where users study the number, so the
          // humility must be here too — not a confident integer on one screen and
          // "provisional" on another for the SAME value.
          const ic = indexConfidence(p);
          return ic.thin ? `<p class="muted small" style="margin:4px 0 0;">${esc(ic.note)}</p>` : '';
        })()}
        <svg viewBox="0 0 320 60" width="100%" style="margin-top:8px;">
          <path d="${sparklinePath(idxPts.length ? idxPts : [fi], 320, 60, 6)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted small">${idxPts.length < 2 ? 'Your trend line builds as you complete sessions.' : `${idxPts.length} data points since you began.`}</p>
      </div>

      ${aiReadinessCard(p)}

      <h2 style="margin-top:6px;">Your scales</h2>
      <div class="card">
        <div class="domain-list">
          ${domainOrder().map((id) => progressRow(id)).join('')}
        </div>
      </div>

      <div class="card" style="background:linear-gradient(180deg,#fff,#fbfaf7); border-left:4px solid var(--green);">
        <div class="row"><strong>Your 90-day proof</strong><span class="spacer"></span><span class="trendpill up">auditable</span></div>
        <p class="muted small" style="margin-top:6px;">Forma stakes itself on three measurable claims over 90 days. See the receipts — your own numbers, moving.</p>
        <button class="btn ghost sm" id="toproof">Open my 90-day proof →</button>
      </div>

      <div class="card">
        <div class="row"><span style="font-size:1.3rem;">📄</span>
          <div style="flex:1;"><strong>Capacity Snapshot</strong>
            <p class="muted small" style="margin:2px 0 0;">One clean page of your profile — print, save as PDF, or copy to share with a coach or employer.</p></div>
          <button class="btn ghost sm" id="tosnapshot" style="width:auto;">Open →</button>
        </div>
      </div>

      <h2>What Forma is noticing</h2>
      <div class="card">
        <ul class="noticing">${weeklyPatterns(p).map((line) => `<li>${esc(line)}</li>`).join('')}</ul>
      </div>

      ${Profile.recentSessions(p).length ? `
      <h2>Recent sessions</h2>
      <div class="card">
        <p class="muted small" style="margin:0 0 8px;">Every score you've earned, newest first — your own auditable record.</p>
        <div class="domain-list">
          ${Profile.recentSessions(p).map((sx) => {
            const d = getDomain(sx.domain); const band = bandFor(sx.rawScore);
            const dt = new Date(sx.date + 'T00:00:00');
            return `<div class="domain-row" style="align-items:center;">
              <span class="ico" aria-hidden="true">${d ? d.icon : '•'}</span>
              <div class="meta"><div class="dn">${d ? esc(d.name) : esc(sx.domain)}</div>
                <div class="muted small">${dt.getMonth() + 1}/${dt.getDate()}</div></div>
              <span class="sc" style="color:${band.color};">${sx.rawScore}</span>
            </div>`;
          }).join('')}
        </div>
      </div>` : ''}
    </div>`;
  document.getElementById('toproof').onclick = () => go('proof');
  document.getElementById('tosnapshot').onclick = () => go('snapshot');
  wireDomainLinks();
}

// ---------------- weekly formation plan ----------------
const DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
function renderPlan() {
  const p = state.profile;
  const plan = p.plan;
  const today = todayStr();
  const days = Planner.planWithProgress(plan, p);

  const rows = days.map((d) => {
    const dt = new Date(d.date + 'T00:00:00');
    const label = `${DOW_FULL[dt.getDay()]} ${dt.getMonth() + 1}/${dt.getDate()}`;
    const isToday = d.date === today;
    const dots = '●'.repeat(d.intensity) + '○'.repeat(5 - d.intensity);
    return `
      <div class="card" style="padding:14px; ${isToday ? 'border-color:var(--accent);' : ''} ${d.done ? 'opacity:.7;' : ''}">
        <div class="row">
          <span class="ico" style="font-size:1.3rem;">${getDomain(d.domain).icon}</span>
          <div class="meta" style="flex:1;">
            <div class="row"><span class="dn">${esc(d.title)}</span>
              <span class="spacer"></span>
              <span class="muted small">${label}${isToday ? ' · today' : ''}</span></div>
            <div class="muted small">${esc(Planner.typeLabel(d.type))} · <span title="intensity" style="letter-spacing:1px;">${dots}</span></div>
          </div>
          ${d.done ? '<span class="trendpill up">done ✓</span>' : (isToday ? '<button class="btn sm" data-start="1" style="width:auto;">Start →</button>' : '')}
        </div>
        <p class="muted small" style="margin:8px 0 0;">${esc(d.rationale)}</p>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><h1 style="margin:0;">This Week</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Home</button></div>
      <div class="card" style="border-left:4px solid ${getDomain(plan.theme).color};">
        <div class="k" style="font-size:.72rem; text-transform:uppercase; letter-spacing:.1em; color:var(--ink-faint); font-weight:700;">Focus capacity</div>
        <div class="row" style="margin-top:4px;"><span class="ico" style="font-size:1.4rem;">${getDomain(plan.theme).icon}</span>
          <strong style="font-size:1.1rem;">${esc(getDomain(plan.theme).name)}</strong></div>
        <div id="plannote" class="muted" style="margin-top:8px;"><span class="spinner" style="width:14px;height:14px;"></span> <span class="small">writing your week…</span></div>
      </div>
      ${rows}
      <button class="btn ghost sm" id="regen" style="margin-top:6px;">Regenerate this week's plan</button>
      <p class="muted small center" style="margin-top:8px;">Your plan refreshes automatically each week, adapting to how your scales have moved.</p>
    </div>`;

  document.getElementById('back').onclick = () => go('home');
  document.getElementById('regen').onclick = () => { p.plan = Planner.generatePlan(p); save(); render(); };
  const startBtn = app.querySelector('[data-start]');
  if (startBtn) startBtn.onclick = () => go('session');

  Planner.planNarrative(p, plan).then(({ text, live }) => {
    const el = document.getElementById('plannote');
    if (el) el.innerHTML = `<div class="${live ? 'insight live' : ''}" style="border:none;padding:0;white-space:pre-wrap;">${esc(text)}</div>`;
  });
}

// ---------------- employer / team dashboard (preview) ----------------
// Capacity Snapshot — the shareable credential. Consolidated, print/PDF-friendly,
// copyable. Generated by the person from their own data; excludes the interior track.
function renderSnapshot() {
  const snap = buildSnapshot(state.profile);
  // Gate the shareable credential until there's real evidence beyond the baseline.
  // domains.length is satisfied by the baseline alone, so a 0-session user would
  // otherwise get a full credential reading "0 sessions over 0 days" with confident
  // scores and ±0 deltas — a hollow artifact on the one page built to be shown to a
  // coach/employer. The empty-state copy already says "complete a few sessions".
  if (!snap.domains.length || snap.sessionCount < 1) {
    app.innerHTML = `<div class="fade-in"><div class="row"><h1 style="margin:0;">Capacity Snapshot</h1>
      <span class="spacer"></span><button class="btn ghost sm no-print" id="back" style="width:auto;">← Progress</button></div>
      <div class="card"><p class="muted small">Complete your baseline and a few sessions, and your shareable snapshot will appear here.</p></div></div>`;
    document.getElementById('back').onclick = () => go('progress');
    return;
  }
  const band = (n) => bandFor(n).color;
  const deltaTag = (d) => d > 0 ? `<span class="trendpill up">+${d}</span>` : d < 0 ? `<span class="trendpill down">${d}</span>` : '<span class="trendpill">±0</span>';
  app.innerHTML = `
    <div class="fade-in snapshot">
      <div class="row no-print"><h1 style="margin:0;">Capacity Snapshot</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Progress</button></div>

      <div class="card snapsheet">
        <div class="snaphead">
          <div class="logo" aria-hidden="true">F</div>
          <div>
            <div class="snaptitle">Forma · Capacity Snapshot</div>
            <div class="muted small">${snap.name ? esc(snap.name) + ' · ' : ''}${snap.sessionCount} session${snap.sessionCount === 1 ? '' : 's'}${snap.since ? ` over ${snap.days} days` : ''}${snap.generated ? ` · generated ${esc(snap.generated)}` : ''}</div>
          </div>
        </div>
        <div class="snaphero">
          <div><div class="kbig" style="font-size:2rem;">${snap.formationIndex}</div><div class="muted small">Formation Index</div></div>
          ${snap.aiReadiness != null ? `<div><div class="kbig" style="font-size:2rem; color:var(--accent);">${snap.aiReadiness}</div><div class="muted small">AI-Readiness</div>${snap.aiReadinessCoverage && snap.aiReadinessCoverage.thin ? `<div class="muted small">${snap.aiReadinessCoverage.covered} of ${snap.aiReadinessCoverage.total} capacities</div>` : ''}</div>` : ''}
        </div>
        ${snap.coverage && snap.coverage.thin ? `<p class="muted small center" style="margin:2px 0 0;">${esc(snap.coverage.note)} — still early; the composite settles as more capacities are practiced.</p>` : ''}
        <table class="snaptable">
          <tbody>
          ${snap.domains.map((d) => `<tr>
            <td><span class="snapdot" style="background:${band(d.score)};"></span>${esc(d.name)}</td>
            <td class="snapconf muted small">${esc(d.confidence)}</td>
            <td style="text-align:right;">${d.frozen ? '<span class="muted small">items used up</span>' : deltaTag(d.delta)}</td>
            <td class="snapsc">${d.score}</td>
          </tr>`).join('')}
          </tbody>
        </table>
        <p class="muted small" style="margin-top:12px;">Strengths: <strong>${snap.strengths.map(esc).join(', ')}</strong>. Growth edges: <strong>${snap.growthEdges.map(esc).join(', ')}</strong>.</p>
        <p class="muted small snapfoot">Measurement for formation, not diagnosis. Generated by the individual from their own device data; the optional Interior Life track is kept private and excluded here.</p>
      </div>

      <div class="row no-print" style="gap:8px;">
        <button class="btn sm" id="print" style="width:auto;">Print / Save as PDF</button>
        <button class="btn ghost sm" id="copy" style="width:auto;">Copy as text</button>
        <span id="copied" class="trendpill up" style="display:none;">copied ✓</span>
      </div>
    </div>`;
  document.getElementById('back').onclick = () => go('progress');
  document.getElementById('print').onclick = () => window.print();
  document.getElementById('copy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(snapshotText(snap));
      const c = document.getElementById('copied'); c.style.display = 'inline-block';
      setTimeout(() => { c.style.display = 'none'; }, 1500);
    } catch (e) { /* clipboard blocked — no-op */ }
  };
}

// "The science behind your measures" — makes the rigor legible. Lists each
// active capacity with the research-backed paradigm its exercises adapt, framed
// honestly as adaptation-for-formation, not a validated/clinical instrument.
function renderMethods() {
  const ids = activeDomainIds(state.profile && state.profile.settings && state.profile.settings.faithTrack);
  const rows = ids.map((id) => {
    const d = getDomain(id); const b = basisFor(id);
    if (!d || !b) return '';
    return `<div class="card" style="margin-bottom:10px;">
      <div class="row"><span class="ico" aria-hidden="true">${d.icon}</span>
        <strong style="margin-left:8px;">${esc(d.name)}</strong></div>
      <div class="eyebrow" style="margin-top:8px;">${esc(b.paradigm)}</div>
      <p class="muted small" style="margin-top:6px;">${esc(b.detail)}</p>
    </div>`;
  }).join('');
  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><h1 style="margin:0;">The science behind your measures</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Settings</button></div>
      <div class="card" style="background:linear-gradient(180deg,#fff,#fbfaf7); border-left:4px solid var(--accent);">
        <p class="muted small" style="margin:0;">Forma’s exercises adapt established cognitive and psychological paradigms — the same families of task used in research on attention, memory, reasoning, and emotional skill. They’re tuned to track <strong>growth over time</strong>, as formation, not to diagnose or label. The point is a measurement you can trust because you can see what it rests on.</p>
      </div>
      ${rows}
      <p class="muted small center" style="margin-top:6px;">Measurement for formation — never a clinical diagnosis.</p>
    </div>`;
  document.getElementById('back').onclick = () => go('settings');
}

function renderTeam() {
  const cohort = Team.sampleCohort(8);
  const agg = Team.aggregate(cohort);
  const hi = Team.teamHighlights(agg.perDomain, 3);
  const tag = (e) => `<span class="airchip" style="margin:0;"><span class="airdot" style="background:${bandFor(e.score).color};"></span><span class="airnm">${esc(getDomain(e.id).name)}</span><span class="airsc">${e.score}</span></span>`;
  // Small-cohort suppression (team.js MIN_COHORT): below the threshold an
  // "aggregate" would expose an individual, so we show the protective notice
  // instead of any numbers, strengths, or band spread.
  const signalCards = agg.suppressed ? `
      <div class="card" style="border-left:4px solid var(--accent);">
        <h2 style="font-size:1.05rem; margin-top:0;">Not enough members to show signals</h2>
        <p class="muted small" style="margin:0;">Forma shows team signals only at <strong>${Team.MIN_COHORT} or more members</strong>. With fewer, an aggregate would reveal an individual — so nothing is shown. This protects people, and it's exactly the property an employer should expect from a tool that measures development, not performance.</p>
      </div>` : `
      <div class="card index-hero">
        <div class="index-num kbig">${agg.avgIndex}</div>
        <div class="index-label">Team Formation Index</div>
        <div class="streakchip" style="margin-top:8px;">⚡ AI-readiness ${agg.aiReadiness}</div>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem; margin-top:0;">Strengths & development priorities</h2>
        <div class="eyebrow" style="margin-top:8px;">Team strengths</div>
        <div class="airgrid">${hi.strengths.map(tag).join('')}</div>
        <div class="eyebrow" style="margin-top:12px;">Where to invest</div>
        <div class="airgrid">${hi.priorities.map(tag).join('')}</div>
        <p class="muted small" style="margin-top:10px;">A development signal for where coaching and practice would move the team most — never a ranking of people.</p>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem; margin-top:0;">Capacity spread</h2>
        <p class="muted small">An average hides the spread. Each bar shows how the ${agg.n} sit across the bands — so you can see strength that's shared versus strength that's concentrated.</p>
        <div class="domain-list" style="margin-top:8px;">
          ${DOMAIN_ORDER.map((id) => {
            const sc = agg.perDomain[id]; const d = getDomain(id);
            const dist = Team.bandDistribution(cohort, id);
            const segs = BANDS.map((b) => dist[b.key]
              ? `<span class="distseg" title="${dist[b.key]} ${b.label}" style="flex:${dist[b.key]}; background:${b.color};"></span>` : '').join('');
            return `<div class="domain-row"><span class="ico">${d.icon}</span>
              <div class="meta"><div class="dn">${esc(d.name)}</div>
              <div class="distbar">${segs}</div></div>
              <span class="sc">${sc}</span></div>`;
          }).join('')}
        </div>
        <div class="distlegend">
          ${BANDS.map((b) => `<span class="distkey"><span class="airdot" style="background:${b.color};"></span>${esc(b.label)}</span>`).join('')}
        </div>
      </div>`;
  app.innerHTML = `
    <div class="fade-in snapshot">
      <div class="row"><h1 style="margin:0;">Team</h1><span class="spacer"></span>
        <button class="btn ghost sm no-print" id="back" style="width:auto;">← Settings</button></div>
      <p class="muted small">Preview · a sample cohort of ${agg.n}${agg.generated ? `, generated ${esc(agg.generated)}` : ''}. In production, an employer would see only <strong>aggregated development signals</strong> across a team — never an individual's raw data, scores, or reflections, and never the Interior Life track. Signals appear only at <strong>${Team.MIN_COHORT} or more members</strong>, so no one can be identified from an aggregate.</p>

      ${signalCards}

      <div class="card">
        <div class="eyebrow">What "AI-readiness" means</div>
        <p class="muted small" style="margin-top:6px;">A blend of Judgment, AI Independence, Deep Reading, and Communication — the capacities most associated with using AI as a tool of judgment rather than dependence. It's a development signal for growth, <strong>not a predictor of job performance and not a basis for hiring, ranking, or selection</strong> — and it isn't normed against a population.</p>
      </div>

      <div class="row no-print" style="gap:8px;">
        <button class="btn sm" id="teamprint" style="width:auto;">Print / Save as PDF</button>
        <button class="btn ghost sm" id="teamcopy" style="width:auto;">Copy report</button>
        <span id="teamcopied" class="trendpill up" style="display:none;">copied ✓</span>
      </div>
    </div>`;
  document.getElementById('back').onclick = () => go('settings');
  document.getElementById('teamprint').onclick = () => window.print();
  document.getElementById('teamcopy').onclick = async () => {
    try {
      await navigator.clipboard.writeText(Team.teamReportText(agg, hi));
      const c = document.getElementById('teamcopied'); c.style.display = 'inline-block';
      setTimeout(() => { c.style.display = 'none'; }, 1500);
    } catch (e) { /* clipboard blocked — no-op */ }
  };
}

// ---------------- 90-day proof ----------------
function renderProof() {
  const p = state.profile;
  const m = Proof.proofMetrics(p);
  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><h1 style="margin:0;">90-Day Proof</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Progress</button></div>
      <p class="muted small">Day ${m.daysElapsed} of 90. These are the claims Forma is willing to be measured on — checked against your own data, not our marketing.</p>

      ${proofClaimCard('① Deeper reading comprehension', 'Sustained reading-comprehension retention should rise.', m.reading, m.daysElapsed, 'reading')}
      ${proofClaimCard('② More independence from AI', 'You should reach for AI less for work you could do yourself.', m.aiIndependence, m.daysElapsed, 'ai_autonomy')}
      ${proofFocusCard(m.focus, m.daysElapsed)}

      <p class="muted small center" style="margin-top:8px;">Projections are naive straight-line estimates from your current pace — shown to set a direction, not to promise a number.</p>
    </div>`;
  document.getElementById('back').onclick = () => go('progress');
  const fc = document.getElementById('startfocus');
  if (fc) fc.onclick = () => go('focuscheck');
}

function proofClaimCard(title, claim, metric, daysElapsed, domainId) {
  const has = metric.samples > 0 && metric.baseline != null;
  const proj = Proof.project90(metric.delta, daysElapsed, metric.baseline);
  const sign = metric.delta > 0 ? '+' : '';
  const color = metric.delta > 0 ? 'var(--green)' : metric.delta < 0 ? 'var(--red)' : 'var(--ink-faint)';
  return `
    <div class="card">
      <strong>${title}</strong>
      <p class="muted small" style="margin:4px 0 10px;">${claim}</p>
      ${has ? `
        <div class="row" style="align-items:baseline;">
          <span class="muted small">Baseline ${metric.baseline}</span>
          <span class="spacer"></span>
          <span class="kbig" style="font-size:1.8rem; color:${color}">${metric.current}</span>
          <span class="trendpill ${metric.delta > 0 ? 'up' : metric.delta < 0 ? 'down' : 'flat'}" style="margin-left:8px;">${metric.delta === 0 ? '±0' : sign + metric.delta}</span>
        </div>
        <svg viewBox="0 0 320 44" width="100%" style="margin-top:6px;">
          <path d="${sparklinePath((metric.series && metric.series.length) ? metric.series : [metric.current], 320, 44, 5)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${proj != null ? `<p class="muted small">At this pace, ~${metric.baseline + proj} by day 90 (projected).</p>` : `<p class="muted small">A few more days of data and Forma will project your 90-day trajectory.</p>`}
      ` : `<p class="muted small">No data yet — complete a few ${domainId === 'reading' ? 'reading' : 'sessions'} and this fills in.</p>`}
    </div>`;
}

function proofFocusCard(focus, daysElapsed) {
  const has = focus.samples > 0;
  const proj = Proof.project90(focus.delta, daysElapsed);
  const sign = focus.delta > 0 ? '+' : '';
  const color = focus.delta > 0 ? 'var(--green)' : focus.delta < 0 ? 'var(--red)' : 'var(--ink-faint)';
  return `
    <div class="card">
      <strong>③ Faster recovery from distraction</strong>
      <p class="muted small" style="margin:4px 0 10px;">A 20-second daily Focus Check measures how quickly and steadily you respond.</p>
      ${has ? `
        <div class="row" style="align-items:baseline;">
          <span class="muted small">Start ${focus.baseline}</span>
          <span class="spacer"></span>
          <span class="kbig" style="font-size:1.8rem; color:${color}">${focus.current}</span>
          <span class="trendpill ${focus.delta > 0 ? 'up' : focus.delta < 0 ? 'down' : 'flat'}" style="margin-left:8px;">${focus.delta === 0 ? '±0' : sign + focus.delta}</span>
        </div>
        <svg viewBox="0 0 320 44" width="100%" style="margin-top:6px;">
          <path d="${sparklinePath(focus.points.length ? focus.points : [focus.current], 320, 44, 5)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted small">${focus.bestMs ? `Best median reaction: ${focus.bestMs}ms. ` : ''}${focus.samples} check${focus.samples === 1 ? '' : 's'} logged.</p>
      ` : '<p class="muted small">You haven’t taken a Focus Check yet.</p>'}
      <button class="btn sm" id="startfocus" style="margin-top:6px;">${has ? 'Take today’s Focus Check' : 'Take your first Focus Check →'}</button>
    </div>`;
}

// ---------------- focus check (distraction-recovery micro-test) ----------------
function renderFocusCheck() {
  const TRIALS = 5;
  const fcState = state._focus || (state._focus = { phase: 'intro', rts: [], waiting: false, tooSoon: false });

  if (fcState.phase === 'intro') {
    app.innerHTML = `
      <div class="fade-in">
        <div class="row"><h1 style="margin:0;">Focus Check</h1><span class="spacer"></span>
          <button class="btn ghost sm" id="back" style="width:auto;">← Back</button></div>
        <div class="card">
          <p>${TRIALS} quick rounds. Each round the panel will say <strong>Wait…</strong>, then turn <strong>green</strong> after a moment. Tap the panel the instant it turns green — not before.</p>
          <p class="muted small">It measures how quickly and steadily you respond. Faster, steadier taps = a higher focus score.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('back').onclick = () => { state._focus = null; go('proof'); };
    document.getElementById('begin').onclick = () => { fcState.phase = 'run'; fcState.rts = []; render(); };
    return;
  }

  if (fcState.phase === 'run') {
    const round = fcState.rts.length + 1;
    app.innerHTML = `
      <div class="fade-in">
        <p class="muted small center">Round ${round} of ${TRIALS}</p>
        <div id="panel" style="height:240px; border-radius:18px; display:grid; place-items:center; cursor:pointer; user-select:none; font-size:1.4rem; font-weight:800; color:#fff; background:var(--ink-soft); transition:background .05s;">
          ${fcState.tooSoon ? 'Too soon — wait for green' : 'Wait…'}
        </div>
        <p class="muted small center" style="margin-top:10px;">Tap the panel the moment it turns green.</p>
      </div>`;
    const panel = document.getElementById('panel');
    let greenAt = 0;
    let armed = false;
    fcState.tooSoon = false;
    const delay = 1200 + Math.floor(Math.random() * 2600);
    const timer = setTimeout(() => {
      if (state.route !== 'focuscheck') return;
      armed = true;
      fcState._t = null;
      greenAt = performance.now();
      panel.style.background = 'var(--green)';
      panel.textContent = 'TAP!';
    }, delay);
    fcState._t = timer;
    panel.onclick = () => {
      if (!armed) {
        // tapped too early — restart this round
        clearTimeout(timer);
        fcState._t = null;
        fcState.tooSoon = true;
        render();
        return;
      }
      const rt = performance.now() - greenAt;
      if (!Proof.isValidReaction(rt)) {
        // Anticipation (tapped impossibly fast) — not a genuine reaction. Discard
        // and redo this round so it can't inflate the score.
        fcState.tooSoon = true;
        render();
        return;
      }
      fcState.rts.push(rt);
      if (fcState.rts.length >= TRIALS) { fcState.phase = 'done'; }
      render();
    };
    return;
  }

  // done
  const medianMs = Proof.median(fcState.rts);
  const score = Proof.scoreFocusCheck(medianMs);
  state.profile = Profile.applyFocusCheck(state.profile, { medianMs, score, trials: fcState.rts.length });
  save();
  const band = bandFor(score);
  app.innerHTML = `
    <div class="fade-in">
      <div class="score-reveal">
        <div class="big" style="color:${band.color}">${score}</div>
        <div class="lbl">Focus score · ${Math.round(medianMs)}ms median · ${band.label}</div>
      </div>
      <div class="card"><p class="muted small">Logged to your 90-day proof. Come back tomorrow — recovery speed is most meaningful as a trend, not a single number.</p></div>
      <button class="btn amber" id="doneproof">Back to proof →</button>
    </div>`;
  state._focus = null;
  document.getElementById('doneproof').onclick = () => go('proof');
}

function progressRow(id) {
  const p = state.profile;
  const score = p.domainScores[id];
  if (score == null) return '';
  const d = getDomain(id);
  const t = domainTrend(p.history, id);
  const series = t.points.length ? t.points : [score];
  const dir = t.direction;
  const sign = t.delta > 0 ? '+' : '';
  const conf = confidenceTag(p, id);
  return `
    <div class="domain-row tappable" data-domain="${id}" role="button" tabindex="0" aria-label="Train ${esc(d.name)}" style="align-items:center;">
      <span class="ico">${d.icon}</span>
      <div class="meta">
        <div class="row"><span class="dn">${esc(d.name)}</span>
          ${conf ? `<span class="conftag" title="How much evidence stands behind this score. It firms up as you complete more sessions in this capacity.">${esc(conf)}</span>` : ''}
          <span class="spacer"></span>
          <span class="trendpill ${dir}">${dir === 'flat' ? '±0' : sign + t.delta}</span></div>
        <svg class="spark" viewBox="0 0 80 24" style="width:100%; height:26px; margin-top:4px;">
          <path d="${sparklinePath(series, 80, 24, 3)}" fill="none" stroke="${bandFor(score).color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="sc">${score}</span>
      <span class="chev" aria-hidden="true">›</span>
    </div>`;
}

// ---------------- coach ----------------
function renderCoach() {
  const p = state.profile;
  const live = Coach.hasKey(p);
  const log = p.coachLog || [];
  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><h1 style="margin:0;">Coach</h1><span class="spacer"></span>
        <span class="trendpill ${live ? 'up' : 'flat'}">${live ? 'live · Claude' : 'offline mode'}</span></div>
      ${!live ? `<p class="muted small">Add your Claude API key in <button id="tosettings" class="inlinelink">Settings</button> for live, personalized coaching. Until then, the coach reads from your own data.</p>` : ''}
      <div class="chat" id="chat" role="log" aria-live="polite">
        ${log.length ? log.map(bubble).join('') : `<div class="bubble coach">${esc(Coach.coachGreeting(p))}</div>`}
      </div>
      <div class="composer">
        <button class="btn amber" id="cmic" aria-label="Dictate your message" style="padding:12px 14px;">🎤</button>
        <input id="ci" placeholder="Ask your coach…" autocomplete="off" aria-label="Message your coach" />
        <button class="btn" id="send">Send</button>
      </div>
      ${micPrivacyNote()}
    </div>`;
  const tos = document.getElementById('tosettings');
  if (tos) tos.onclick = () => go('settings');
  const ci = document.getElementById('ci');
  const sendBtn = document.getElementById('send');
  attachMicButton(document.getElementById('cmic'), ci);
  let busy = false;
  const send = async () => {
    const text = ci.value.trim();
    if (!text || busy) return;
    busy = true;
    ci.value = '';
    ci.disabled = true; sendBtn.disabled = true;
    p.coachLog = p.coachLog || [];
    appendBubble({ role: 'user', content: text });
    const typing = appendBubble({ role: 'assistant', content: '…', typing: true });
    let reply;
    try {
      reply = await Coach.coachReply(text, p);
    } finally {
      busy = false;
    }
    if (typing) typing.remove();
    ci.disabled = false; sendBtn.disabled = false;
    if (state.profile !== p) return; // profile was reset/replaced mid-flight
    // Record the exchange only now — so coachReply saw clean prior history.
    p.coachLog.push({ role: 'user', content: text, ts: Date.now() });
    p.coachLog.push({ role: 'assistant', content: reply.text, ts: Date.now() });
    save();
    appendBubble({ role: 'assistant', content: reply.text, assertive: !!reply.escalated });
    if (document.getElementById('ci')) document.getElementById('ci').focus();
  };
  sendBtn.onclick = send;
  ci.onkeydown = (e) => { if (e.key === 'Enter') send(); };
}

function bubble(m) {
  return `<div class="bubble ${m.role === 'user' ? 'me' : 'coach'}">${esc(m.content)}</div>`;
}
function appendBubble({ role, content, typing, assertive }) {
  const chat = document.getElementById('chat');
  if (!chat) return null; // user navigated away while a reply was in flight
  const div = document.createElement('div');
  div.className = `bubble ${role === 'user' ? 'me' : 'coach'}${typing ? ' typing' : ''}`;
  // A crisis escalation is the most time-critical message in the app. The chat
  // log is aria-live="polite", which QUEUES the 988/emergency pointer behind
  // whatever a screen reader is already reading. role="alert" (assertive) makes
  // it interrupt and be spoken first — for a user in genuine distress.
  if (assertive) { div.setAttribute('role', 'alert'); div.setAttribute('aria-live', 'assertive'); }
  div.textContent = content;
  chat.appendChild(div);
  // An explicit behavior:'smooth' overrides the CSS reduced-motion block (which
  // only governs the scroll-behavior property), so honor the preference in JS.
  // This fires on every chat message — including the crisis escalation directly
  // above — exactly where a vestibular-sensitive user can least tolerate motion.
  div.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'end' });
  return div;
}

// ---------------- settings ----------------
function renderSettings() {
  const p = state.profile;
  const prov = providerFor(p.settings.provider);
  const keyHint = { anthropic: 'sk-ant-…', openai: 'sk-…', gemini: 'AIza…', openrouter: 'sk-or-…' }[prov.id] || 'your API key';
  app.innerHTML = `
    <div class="fade-in">
      <h1>Settings</h1>

      <div class="card">
        <h2 style="font-size:1.05rem;">Your name</h2>
        <div class="field">
          <input id="name" value="${esc(p.settings.name || '')}" placeholder="What should the coach call you?" />
        </div>
      </div>

      <div class="card">
        <div class="row">
          <span style="font-size:1.3rem;">🕊️</span>
          <div style="flex:1;">
            <h2 style="font-size:1.05rem; margin:0;">Interior Life track</h2>
            <p class="muted small" style="margin:2px 0 0;">Optional, faith-based. Adds a spiritual-formation scale, daily reflections, and a contemplative-silence practice. Kept private — never shown to any employer view.</p>
          </div>
          <button class="opt ${p.settings.faithTrack ? 'selected' : ''}" id="faith" style="width:auto; padding:8px 16px; font-weight:700;">${p.settings.faithTrack ? 'On' : 'Off'}</button>
        </div>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem;">Live AI coaching</h2>
        <p class="muted small">Optional. Bring your own API key from any supported provider to turn on live, personalized coaching. Your key is stored only in this browser and is sent only to the provider you pick — never to a Forma server (there isn't one), and never with your Interior Life content.</p>
        <div class="field">
          <label>Provider</label>
          <select id="provider">
            ${Object.values(PROVIDERS).map((pv) => `<option value="${esc(pv.id)}" ${prov.id === pv.id ? 'selected' : ''}>${esc(pv.label)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>${esc(prov.label)} API key</label>
          <input id="key" type="password" value="${esc(p.settings.apiKey || '')}" placeholder="${esc(keyHint)}" />
        </div>
        <div class="field">
          <label>Model</label>
          <select id="model">
            ${prov.models.map((m) => `<option value="${esc(m)}" ${p.settings.model === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <button class="btn sm" id="savekey">Save</button>
          <button class="btn ghost sm" id="testkey">Test connection</button>
          <button class="btn ghost sm" id="howkey" style="width:auto;">How to get a key →</button>
          <span id="saved" class="trendpill up" style="display:none;">saved ✓</span>
        </div>
        <div id="howkeybox" hidden style="margin-top:10px; background:var(--accent-soft); border-radius:12px; padding:12px;">
          <ol class="muted small" style="margin:0 0 8px; padding-left:18px;">
            ${prov.howTo.steps.map((st) => `<li>${esc(st)}</li>`).join('')}
          </ol>
          <a class="btn ghost sm" href="${esc(prov.howTo.url)}" target="_blank" rel="noopener noreferrer" style="width:auto; display:inline-block;">Open the ${esc(prov.label)} console →</a>
        </div>
        <p id="testresult" class="small" style="margin-top:10px;"></p>
      </div>

      <div class="card">
        <div class="row"><span style="font-size:1.3rem;">🔬</span>
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">The science behind your measures</h2>
            <p class="muted small" style="margin:2px 0 0;">The research-backed paradigm each capacity’s exercises adapt — measurement you can see the basis of.</p></div>
          <button class="btn ghost sm" id="tomethods" style="width:auto;">View →</button>
        </div>
      </div>

      <div class="card">
        <div class="row"><span style="font-size:1.3rem;">🏢</span>
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">For employers</h2>
            <p class="muted small" style="margin:2px 0 0;">A preview of the team dashboard — aggregated development signals, never individual raw data.</p></div>
          <button class="btn ghost sm" id="toteam" style="width:auto;">Preview →</button>
        </div>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem;">Your data</h2>
        <p class="muted small">Everything Forma stores about you lives on this device — no server, no account, nothing uploaded. You own it: back it up, and restore it on any device. (Clearing your browser data erases it, so keep an export.)</p>
        <p class="muted small" style="margin-top:8px;">Two things do leave the device, only when you choose them: the live coach sends your message to Anthropic using your own key (never your Interior Life track), and voice dictation uses your browser’s speech service — in some browsers (e.g. Chrome) that sends the audio to a vendor to transcribe. Type, and stay offline, to keep everything fully on-device.</p>
        <div class="stack">
          <button class="btn ghost sm" id="export">Export my data (JSON)</button>
          <p class="muted small" style="margin:2px 0 0;">The export is plain-text JSON that includes your written reflections and coach conversations (but never your API key). Keep the file somewhere private.</p>
          <button class="btn ghost sm" id="import">Import / restore from a backup</button>
          <input type="file" id="importfile" accept="application/json,.json" style="display:none;">
          <span class="muted small" id="importmsg" style="display:none;"></span>
          ${(p.coachLog || []).length ? `<button class="btn ghost sm" id="clearcoach">Clear coach conversations</button>` : ''}
          <button class="btn danger sm" id="reset">Erase everything & start over</button>
        </div>
      </div>

      <div class="card">
        <div class="row"><span style="font-size:1.3rem;">✉️</span>
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Reminders &amp; encouragement</h2>
            <p class="muted small" style="margin:2px 0 0;">Optional. Reminders aren’t built yet — opt in now and your email is stored <strong>only on this device</strong> (it’s never sent anywhere), so Forma can reach you once they ship, and only for that. This is separate from the anonymous research data and is never linked to it. Remove it anytime.</p>
          </div>
        </div>
        <div class="field" style="margin-top:10px;">
          <label>Email</label>
          <input id="contactemail" type="email" value="${esc((p.contact && p.contact.email) || '')}" placeholder="you@example.com" />
        </div>
        <div class="row" style="gap:8px;">
          <button class="btn sm" id="savecontact">${p.contact && p.contact.consent ? 'Update' : 'Opt in'}</button>
          ${p.contact && p.contact.consent ? `<button class="btn ghost sm" id="withdrawcontact">Remove my email</button>` : ''}
          <span id="contactsaved" class="trendpill up" style="display:none;">saved ✓</span>
        </div>
        <p id="contacterr" class="small" style="margin-top:8px; color:var(--red); display:none;"></p>
      </div>

      <p class="muted small center">Forma · the capacities a machine can’t keep for you.</p>
    </div>`;

  document.getElementById('name').onchange = (e) => { p.settings.name = e.target.value.trim(); save(); };
  const tt = document.getElementById('toteam'); if (tt) tt.onclick = () => go('team');
  const tm = document.getElementById('tomethods'); if (tm) tm.onclick = () => go('methods');
  document.getElementById('faith').onclick = () => {
    state.profile = p.settings.faithTrack ? Profile.disableFaithTrack(p) : Profile.enableFaithTrack(p);
    // Regenerate the plan so the change takes effect immediately.
    state.profile.plan = Planner.generatePlan(state.profile);
    save();
    render();
  };
  // Switching provider MUST reset the model to that provider's default BEFORE the
  // re-render — otherwise a stale Claude model id would ride into an OpenAI/Gemini
  // call and 4xx. Stash the half-typed key first so toggling never wipes it.
  document.getElementById('provider').onchange = (e) => {
    p.settings.apiKey = document.getElementById('key').value;
    p.settings.provider = e.target.value;
    p.settings.model = defaultModelFor(e.target.value);
    save();
    render();
  };
  // Track the model selection immediately so the persisted state never diverges
  // from what's shown.
  document.getElementById('model').onchange = (e) => { p.settings.model = e.target.value; save(); };
  document.getElementById('howkey').onclick = () => {
    const box = document.getElementById('howkeybox');
    if (box) box.hidden = !box.hidden;
  };
  document.getElementById('savekey').onclick = () => {
    p.settings.apiKey = document.getElementById('key').value.trim();
    p.settings.model = document.getElementById('model').value;
    save();
    const s = document.getElementById('saved'); s.style.display = 'inline-block';
    setTimeout(() => { s.style.display = 'none'; }, 1500);
  };
  document.getElementById('testkey').onclick = async () => {
    // Saves the current key/model, then makes a tiny real call and shows the
    // actual result — so a failure reveals WHY (bad key, model, CORS, credits).
    p.settings.apiKey = document.getElementById('key').value.trim();
    p.settings.model = document.getElementById('model').value;
    save();
    const r = document.getElementById('testresult');
    if (!p.settings.apiKey) { r.style.color = 'var(--red)'; r.textContent = 'Add a key first.'; return; }
    r.style.color = 'var(--ink-faint)';
    r.textContent = 'Testing…';
    try {
      const txt = await Coach.complete(p, { system: 'Reply with exactly: ok', messages: [{ role: 'user', content: 'ping' }], maxTokens: 8 });
      r.style.color = 'var(--green)';
      r.textContent = txt ? `✓ Connected — live coaching is on (model: ${p.settings.model}).` : '✓ Connected.';
    } catch (e) {
      r.style.color = 'var(--red)';
      r.textContent = `✗ ${Coach.friendlyApiError(e.message)}`;
    }
  };
  document.getElementById('savecontact').onclick = () => {
    const err = document.getElementById('contacterr');
    err.style.display = 'none';
    try {
      // Contact.setContact touches ONLY profile.contact — never research / installId.
      state.profile = Contact.setContact(p, document.getElementById('contactemail').value);
      save();
      const s = document.getElementById('contactsaved'); s.style.display = 'inline-block';
      setTimeout(() => { if (state.route === 'settings') render(); }, 1100);
    } catch (e) {
      err.textContent = e.message; err.style.display = 'block';
    }
  };
  const withdrawC = document.getElementById('withdrawcontact');
  if (withdrawC) withdrawC.onclick = () => { state.profile = Contact.clearContact(p); save(); render(); };
  document.getElementById('export').onclick = () => { downloadBackup(); };
  document.getElementById('import').onclick = () => document.getElementById('importfile').click();
  document.getElementById('importfile').onchange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const msg = document.getElementById('importmsg');
    const reader = new FileReader();
    reader.onload = () => {
      let imported;
      try {
        imported = Profile.importProfile(String(reader.result));
      } catch (err) {
        msg.style.display = 'block'; msg.style.color = 'var(--red)';
        msg.textContent = `✗ ${err.message}`;
        e.target.value = '';
        return;
      }
      const n = (imported.sessions || []).length;
      if (!confirm(`Restore this backup? It replaces the data on this device with ${n} saved session${n === 1 ? '' : 's'}. This can’t be undone.`)) {
        e.target.value = '';
        return;
      }
      // Keep the key currently entered on this device — exports never include it.
      imported.settings = imported.settings || {};
      imported.settings.apiKey = p.settings.apiKey || '';
      state.profile = imported;
      save();
      go('home');
    };
    reader.onerror = () => {
      msg.style.display = 'block'; msg.style.color = 'var(--red)';
      msg.textContent = '✗ Couldn’t read that file.';
    };
    reader.readAsText(file);
  };
  const clearCoach = document.getElementById('clearcoach');
  if (clearCoach) clearCoach.onclick = () => {
    if (confirm('Clear your coach conversation history? Your scores, sessions, and goals are kept — only the chat is erased. This can’t be undone.')) {
      state.profile = Profile.clearCoachLog(p);
      save();
      render();
    }
  };
  document.getElementById('reset').onclick = () => {
    if (confirm('Erase all Forma data on this device and start over? This cannot be undone.')) {
      localStorage.removeItem(Profile.STORAGE_KEY);
      Profile.clearOnboard();
      state.profile = null;
      state.onboard = { step: 0, responses: {}, mode: null, showKey: false, faithTrack: false };
      go('home');
    }
  };
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

// ---------------- boot ----------------
// Resume an interrupted baseline: if the person hasn't finished onboarding, pull
// back any saved quick-check progress so they continue where they left off.
// Once onboarded, drop any stale copy.
if (state.profile && state.profile.baseline) {
  Profile.clearOnboard();
} else {
  const _saved = Profile.loadOnboard();
  if (_saved) {
    if (_saved.mode === 'conversation' && _saved.diag) {
      // Resume the AI-interview onboarding where it left off.
      state.onboard.mode = 'conversation';
      state.diag = { messages: _saved.diag.messages || [], ready: !!_saved.diag.ready, busy: false, error: '' };
    } else {
      if (_saved.responses) state.onboard.responses = _saved.responses;
      if (typeof _saved.step === 'number') state.onboard.step = _saved.step;
    }
  }
}

// Honor a PWA app-shortcut / deep link (?go=session, etc.). render() already
// redirects a not-yet-onboarded user into setup, so an early route is safe.
const _deep = startRoute(typeof location !== 'undefined' ? location.search : '');
if (_deep) state.route = _deep;
render();

// Local data-safety: ask the browser to PERSIST our storage so it won't silently
// evict the profile under disk pressure. Best-effort, non-blocking, guarded for
// environments without the API. The cheapest real protection for a local-first app,
// alongside the export/restore backup. Only requests if not already persisted.
(function requestPersistentStorage() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      navigator.storage.persisted().then((already) => { if (!already) navigator.storage.persist().catch(() => {}); }).catch(() => {});
    }
  } catch (e) { /* noop */ }
})();
