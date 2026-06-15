// app.js — Forma UI controller. Vanilla JS SPA, no build step.
// Renders views into #app and persists everything locally via profile.js.

import { DOMAINS, getDomain, bandFor, activeDomainIds } from './src/domains.js';
import { LIKERT_SCALE, LIKERT_POINTS, baselineByDomain, BASELINE_ITEMS, ALL_ITEMS } from './src/assessments.js';
import { pickExercise } from './src/exercises.js';
import { domainScoresFromBaseline, scoreExercise, formationIndex } from './src/scoring.js';
import {
  todayStr, streakAlive, domainTrend, sparklinePath, radarGeometry, daysBetween,
} from './src/progress.js';
import { recommendFocus, weeklyPatterns } from './src/insights.js';
import * as Profile from './src/profile.js';
import * as Coach from './src/coach.js';
import * as Diagnostic from './src/diagnostic.js';
import * as Proof from './src/proof.js';
import * as Planner from './src/planner.js';
import * as Orchestrator from './src/orchestrator.js';

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

// ---------------- router ----------------
function go(route) {
  // Leaving an active session: stop any running countdown so it can't fire
  // against a stale view.
  if (route !== 'session' && state.session && state.session._timer) {
    clearInterval(state.session._timer);
    state.session._timer = null;
  }
  state.route = route;
  render();
  window.scrollTo(0, 0);
}

function ensurePlan() {
  const p = state.profile;
  if (!p || !p.baseline) return;
  if (Planner.planIsStale(p.plan, todayStr())) {
    p.plan = Planner.generatePlan(p);
    save();
  }
}

function render() {
  const onboarded = state.profile && state.profile.baseline;
  tabbar.hidden = !onboarded;
  if (!onboarded) { renderOnboarding(); return; }
  ensurePlan();

  [...tabbar.querySelectorAll('.tab')].forEach((t) =>
    t.classList.toggle('active', t.dataset.route === state.route));

  switch (state.route) {
    case 'home': return renderHome();
    case 'session': return renderSession();
    case 'progress': return renderProgress();
    case 'plan': return renderPlan();
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
  if (state.onboard.mode === 'conversation') { renderConversationalOnboarding(); return; }

  const groups = baselineByDomain(activeDomainIds(state.onboard.faithTrack));
  const step = state.onboard.step;

  if (step === 0) {
    const needKey = state.onboard.showKey && !Coach.hasKey(state.profile);
    app.innerHTML = `
      <div class="fade-in">
        <div class="hero">
          <div class="glyph">✦</div>
          <h1>Forma</h1>
          <p class="lede">Train the human capacities that grow more valuable as AI does more of the work.</p>
        </div>
        <div class="pillrow">
          ${DOMAINS.map((d) => `<span class="pill">${d.icon} ${esc(d.name)}</span>`).join('')}
        </div>
        <div class="card">
          <p><strong>First, a read on where you are today.</strong> Choose how you'd like to begin — both build the same eight-capacity profile.</p>
        </div>
        <div class="stack">
          <button class="btn amber" id="start">Quick check · ~3 min →</button>
          <button class="btn ghost" id="talk">Talk it through with the coach →</button>
        </div>
        <p class="muted small center" style="margin-top:12px;">The quick check is a short self-assessment and works offline. The conversation is an adaptive interview that writes your profile — it uses your own Claude key.</p>
        <div class="card" style="margin-top:12px; display:flex; align-items:center; gap:12px;">
          <span style="font-size:1.3rem;">🕊️</span>
          <div style="flex:1;">
            <div style="font-weight:600; font-size:.95rem;">Add the Interior Life track</div>
            <div class="muted small">Optional, faith-based: measure and tend your spiritual life alongside the rest. You can change this anytime.</div>
          </div>
          <button class="opt ${state.onboard.faithTrack ? 'selected' : ''}" id="faithtoggle" style="width:auto; padding:8px 14px; font-weight:700;">${state.onboard.faithTrack ? 'On' : 'Off'}</button>
        </div>
        ${needKey ? `
          <div class="card" style="margin-top:12px;">
            <p class="small"><strong>The conversation needs your Claude key.</strong> Paste it to talk it through, or just use the quick check above. Your key stays on this device.</p>
            <div class="field"><input id="inlinekey" type="password" placeholder="sk-ant-…" /></div>
            <button class="btn sm" id="savekeyinline">Save key & start the conversation</button>
          </div>` : ''}
        <p class="muted small center" style="margin-top:14px;">Everything stays on this device. Nothing is uploaded except your own optional Claude calls.</p>
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
  const pct = Math.round(((gi) / groups.length) * 100);

  app.innerHTML = `
    <div class="fade-in">
      <div class="progress-top"><div style="width:${pct}%"></div></div>
      <div class="lesson-domain">
        <span class="ico">${d.icon}</span>
        <span class="dname">${esc(d.name)}</span>
        <span class="dcount">${answered}/${group.items.length}</span>
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
          <button class="opt ${cur === o.value ? 'selected' : ''}" data-item="${item.id}" data-value="${o.value}">
            ${esc(o.label)}
          </button>`).join('')}
      </div>
    </div>`;
}

async function finishBaseline() {
  const scores = domainScoresFromBaseline(ALL_ITEMS, state.onboard.responses, LIKERT_POINTS);
  state.profile = state.profile || Profile.createProfile();
  state.profile.settings.faithTrack = !!state.onboard.faithTrack;
  state.profile = Profile.applyBaseline(state.profile, scores, state.onboard.responses);
  save();
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
      <button class="btn amber" id="go">Start my first session →</button>
    </div>`;
  document.getElementById('go').onclick = () => go('session');

  const { text, live } = await Coach.interpretBaseline(p);
  const el = document.getElementById('interp');
  if (el) el.innerHTML = `
    <div class="insight ${live ? 'live' : ''}" style="border:none; padding:0;">
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
    d.error = "I had trouble turning that into a profile. Let's try the quick check — it'll get you the same eight scales.";
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
  }
  state.onboard.mode = null;
  save();
  renderBaselineResult();
}

// ---------------- home ----------------
function renderHome() {
  const p = state.profile;
  const fi = formationIndex(p.domainScores);
  const alive = streakAlive(p.streak);
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
        <div class="index-label">Formation Index</div>
        <div class="streakchip ${alive ? '' : 'cold'}">${alive ? '🔥' : '🕯️'} ${p.streak.current || 0}-day streak${alive ? '' : ' — pick it back up'}</div>
      </div>

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
        <button class="btn amber" id="startsession">${doneToday ? 'Do another session' : 'Start 3-minute session →'}</button>
      </div>

      ${weekStripCard(p)}

      ${radarCard(p.domainScores)}
    </div>`;

  document.getElementById('startsession').onclick = () => go('session');
  const wp = document.getElementById('toplan');
  if (wp) wp.onclick = () => go('plan');
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

  return `
    <div class="card">
      <h2 style="font-size:1.05rem;">Your formation profile</h2>
      <div class="radarwrap">
        <svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:320px;">
          ${rings}${axes}
          <polygon points="${geo.points}" fill="rgba(76,95,213,.18)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
          ${geo.axes.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="3" fill="var(--accent)"/>`).join('')}
          ${labels}
        </svg>
      </div>
      <div class="domain-list">
        ${order.map((id) => domainRow(id, scores[id])).join('')}
      </div>
    </div>`;
}

function domainRow(id, score) {
  const d = getDomain(id);
  if (score == null) return '';
  const band = bandFor(score);
  return `
    <div class="domain-row">
      <span class="ico">${d.icon}</span>
      <div class="meta">
        <div class="dn">${esc(d.name)}</div>
        <div class="bar"><div style="width:${score}%; background:${band.color}"></div></div>
      </div>
      <span class="sc">${score}</span>
    </div>`;
}

// ---------------- daily session ----------------
function renderSession() {
  if (!state.session) {
    // The Orchestrator picks the focus domain (via the weekly plan) AND the
    // exercise modality for it (e.g. n-back vs recall, CRT vs decision scenario).
    const ex = Orchestrator.chooseExercise(state.profile);
    const initPhase = ex.type === 'memory' ? 'memo-show'
      : ex.type === 'nback' ? 'nback-intro'
      : ex.type === 'stream' ? 'stream-intro'
      : ex.type === 'contemplation' ? 'contempl-intro'
      : 'play';
    state.session = { exercise: ex, phase: initPhase, response: {}, started: Date.now() };
  }
  const s = state.session;
  switch (s.exercise.type) {
    case 'reading': return renderReading();
    case 'memory': return renderMemory();
    case 'decision': return renderDecision();
    case 'crt': return renderCRT();
    case 'nback': return renderNBack();
    case 'stream': return renderStream();
    case 'stay': return renderStay();
    case 'contemplation': return renderContemplation();
    case 'reflection': return renderReflection();
  }
}

function sessionHeader(ex) {
  const d = getDomain(ex.domain);
  const typeLabel = { reading: 'Deep Reading', memory: 'Working Memory', decision: 'Judgment', crt: 'Reflection Test', nback: 'Working Memory', stream: 'Sustained Attention', stay: 'Frustration Tolerance', contemplation: 'Interior Life', reflection: 'Reflection' }[ex.type] || ex.type;
  return `<div class="exercise-head"><span class="tagchip">${esc(typeLabel)}</span>
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
    if (qi === ex.questions.length - 1) completeSession();
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
        ${recalled.length ? recalled.map((w, i) => `<span class="slot" data-rm="${i}">${esc(w)} ✕</span>`).join('') : '<span class="muted small">your sequence…</span>'}
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
          return `<button class="opt ${cls}" data-id="${o.id}" ${revealed ? 'disabled' : ''}>${esc(o.text)}
            ${revealed ? `<div class="rationale">${esc(o.rationale)}</div>` : ''}</button>`;
        }).join('')}
      </div>
      ${revealed
        ? `<button class="btn" id="fin" style="margin-top:16px;">Continue →</button>`
        : `<button class="btn" id="reveal" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">Lock in my answer</button>`}
    </div>`;
  if (!revealed) {
    app.querySelectorAll('.opt').forEach((b) => b.onclick = () => { s.response.optionId = b.dataset.id; render(); });
    document.getElementById('reveal').onclick = () => { s.revealed = true; render(); };
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
          return `<button class="opt ${cls}" data-id="${o.id}" ${revealed ? 'disabled' : ''}>${esc(o.text)}</button>`;
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
    document.getElementById('reveal').onclick = () => { s.revealed = true; render(); };
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
    if (s.idx >= ex.n && !s.flaggedThis) {
      s.response.flagged.push(s.idx);
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
        <div style="font-size:5.5rem; font-weight:800; color:${item && item.nogo ? 'var(--red)' : 'var(--accent)'};">${esc(item ? item.symbol : '·')}</div>
      </div>
      <button class="btn ${tappedThis ? 'green' : 'amber'}" id="go">${tappedThis ? 'GO ✓' : 'GO'}</button>
    </div>`;
  const goBtn = document.getElementById('go');
  if (goBtn) goBtn.onclick = () => {
    if (s.idx >= 0 && !s.response.tapped.includes(s.idx)) {
      s.response.tapped.push(s.idx);
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

// Stay — behavioral persistence. Staying with the hard item is the signal.
function renderStay() {
  const s = state.session;
  const ex = s.exercise;
  const phase = s.stayPhase || 'puzzle';
  if (phase === 'puzzle') {
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
    document.getElementById('stayed').onclick = () => { s.response.stayed = true; s.stayPhase = 'rate'; render(); };
    document.getElementById('skipped').onclick = () => { s.response.stayed = false; s.stayPhase = 'rate'; render(); };
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
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${rating === n ? 'on' : ''}" data-n="${n}">${n}</button>`).join('')}
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
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card"><p>${esc(ex.prompt)}</p>
        <p class="muted small">${ex.targetSeconds} seconds. If your mind wanders, just come back. Coming back <em>is</em> the practice.</p></div>
        <button class="btn amber" id="begin">Begin the silence</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.phase = 'contempl-run'; s.remaining = ex.targetSeconds; s.response.seconds = 0; render(); };
    return;
  }
  app.innerHTML = `
    <div class="fade-in center">
      <p class="muted small" style="margin-top:20px;">${esc(getDomain('interior').icon)} Be still.</p>
      <div class="memo-countdown" id="cd" style="font-size:3.4rem; margin-top:30px;">${s.remaining}</div>
      <p class="muted small" style="margin-top:30px;">Put the phone down. Look up. Breathe.</p>
      <button class="btn ghost sm" id="endearly" style="width:auto; margin-top:24px;">End early</button>
    </div>`;
  const finish = () => {
    if (s._timer) { clearInterval(s._timer); s._timer = null; }
    s.response.seconds = ex.targetSeconds - s.remaining;
    completeSession();
  };
  document.getElementById('endearly').onclick = finish;
  if (!s._timer) {
    s._timer = setInterval(() => {
      if (state.session !== s || state.route !== 'session') { clearInterval(s._timer); s._timer = null; return; }
      s.remaining--;
      const cd = document.getElementById('cd');
      if (cd) cd.textContent = s.remaining;
      if (s.remaining <= 0) { s.response.seconds = ex.targetSeconds; clearInterval(s._timer); s._timer = null; completeSession(); }
    }, 1000);
  }
}

function renderReflection() {
  const s = state.session;
  const ex = s.exercise;
  const rating = s.response.selfRating;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="likert-q" style="font-size:1.05rem;">${esc(ex.prompt)}</p>
      <textarea class="reflect-area" id="ref" placeholder="Write a few honest sentences. This stays on your device.">${esc(s.response.text || '')}</textarea>
      <p class="muted small" style="margin-top:14px;">${esc(ex.selfRatingLabel)}</p>
      <div class="rating">
        ${[1, 2, 3, 4, 5].map((n) => `<button class="${rating === n ? 'on' : ''}" data-n="${n}">${n}</button>`).join('')}
      </div>
      <button class="btn" id="fin" ${rating == null ? 'disabled' : ''}>Complete session</button>
    </div>`;
  document.getElementById('ref').oninput = (e) => { s.response.text = e.target.value; };
  app.querySelectorAll('.rating button').forEach((b) => b.onclick = () => {
    s.response.selfRating = Number(b.dataset.n);
    render();
  });
  document.getElementById('fin').onclick = completeSession;
}

async function completeSession() {
  const s = state.session;
  if (s._timer) clearInterval(s._timer);
  const rawScore = scoreExercise(s.exercise, s.response);
  const { profile, session } = Profile.applySession(state.profile, s.exercise, s.response);
  state.profile = profile;
  save();

  // Reveal score, then fetch the one insight.
  const band = bandFor(rawScore);
  app.innerHTML = `
    <div class="fade-in">
      <div class="score-reveal">
        <div class="big" style="color:${band.color}">${rawScore}</div>
        <div class="lbl">${esc(getDomain(s.exercise.domain).name)} · ${band.label}</div>
      </div>
      <div class="card" id="insight">
        <div class="row"><span class="spinner"></span> <span class="muted">Your coach is reading the session…</span></div>
      </div>
      <button class="btn amber" id="home">Done →</button>
    </div>`;
  document.getElementById('home').onclick = () => { state.session = null; go('home'); };

  const insight = await Coach.dailyInsight(session, state.profile);
  state.profile._lastInsight = insight; // shown on home too
  const el = document.getElementById('insight');
  if (el) el.innerHTML = `
    <div class="insight ${insight.live ? 'live' : ''}" style="border:none;padding:0;">
      <div class="k">One insight</div>
      <div style="margin-top:8px; white-space:pre-wrap;">${esc(insight.text)}</div>
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
        <svg viewBox="0 0 320 60" width="100%" style="margin-top:8px;">
          <path d="${sparklinePath(idxPts.length ? idxPts : [fi], 320, 60, 6)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted small">${idxPts.length < 2 ? 'Your trend line builds as you complete sessions.' : `${idxPts.length} data points since you began.`}</p>
      </div>

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

      <h2>What Forma is noticing</h2>
      <div class="card">
        ${weeklyPatterns(p).map((line) => `<p>• ${esc(line)}</p>`).join('')}
      </div>
    </div>`;
  document.getElementById('toproof').onclick = () => go('proof');
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
  const proj = Proof.project90(metric.delta, daysElapsed);
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
          <path d="${sparklinePath(metric.points.length ? metric.points : [metric.current], 320, 44, 5)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
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
      greenAt = performance.now();
      panel.style.background = 'var(--green)';
      panel.textContent = 'TAP!';
    }, delay);
    panel.onclick = () => {
      if (!armed) {
        // tapped too early — restart this round
        clearTimeout(timer);
        fcState.tooSoon = true;
        render();
        return;
      }
      const rt = performance.now() - greenAt;
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
  return `
    <div class="domain-row" style="align-items:center;">
      <span class="ico">${d.icon}</span>
      <div class="meta">
        <div class="row"><span class="dn">${esc(d.name)}</span>
          <span class="spacer"></span>
          <span class="trendpill ${dir}">${dir === 'flat' ? '±0' : sign + t.delta}</span></div>
        <svg class="spark" viewBox="0 0 80 24" style="width:100%; height:26px; margin-top:4px;">
          <path d="${sparklinePath(series, 80, 24, 3)}" fill="none" stroke="${bandFor(score).color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span class="sc">${score}</span>
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
      ${!live ? `<p class="muted small">Add your Claude API key in Settings for live, personalized coaching. Until then, the coach answers from your own data.</p>` : ''}
      <div class="chat" id="chat">
        ${log.length ? log.map(bubble).join('') : `<div class="bubble coach">Hi${p.settings.name ? ' ' + esc(p.settings.name) : ''}. I'm your Forma coach. Ask me anything about your formation — your scores, what to work on, why a domain matters, or how a hard day went. ${live ? '' : '(Right now I’m in offline mode — I’ll read your data back to you.)'}</div>`}
      </div>
      <div class="composer">
        <input id="ci" placeholder="Ask your coach…" autocomplete="off" />
        <button class="btn" id="send">Send</button>
      </div>
    </div>`;
  const ci = document.getElementById('ci');
  const sendBtn = document.getElementById('send');
  const send = async () => {
    const text = ci.value.trim();
    if (!text) return;
    ci.value = '';
    p.coachLog = p.coachLog || [];
    appendBubble({ role: 'user', content: text });
    const typing = appendBubble({ role: 'assistant', content: '…', typing: true });
    const reply = await Coach.coachReply(text, p);
    if (typing) typing.remove();
    // Record the exchange only now — so coachReply saw clean prior history and
    // didn't double-count this message.
    p.coachLog.push({ role: 'user', content: text, ts: Date.now() });
    p.coachLog.push({ role: 'assistant', content: reply.text, ts: Date.now() });
    save();
    appendBubble({ role: 'assistant', content: reply.text });
  };
  sendBtn.onclick = send;
  ci.onkeydown = (e) => { if (e.key === 'Enter') send(); };
}

function bubble(m) {
  return `<div class="bubble ${m.role === 'user' ? 'me' : 'coach'}">${esc(m.content)}</div>`;
}
function appendBubble({ role, content, typing }) {
  const chat = document.getElementById('chat');
  if (!chat) return null; // user navigated away while a reply was in flight
  const div = document.createElement('div');
  div.className = `bubble ${role === 'user' ? 'me' : 'coach'}${typing ? ' typing' : ''}`;
  div.textContent = content;
  chat.appendChild(div);
  div.scrollIntoView({ behavior: 'smooth', block: 'end' });
  return div;
}

// ---------------- settings ----------------
function renderSettings() {
  const p = state.profile;
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
        <p class="muted small">Optional. Paste your own Anthropic (Claude) API key to turn on live, personalized coaching. Your key is stored only in this browser and is sent only to Anthropic — never to any Forma server (there isn't one).</p>
        <div class="field">
          <label>Claude API key</label>
          <input id="key" type="password" value="${esc(p.settings.apiKey || '')}" placeholder="sk-ant-…" />
        </div>
        <div class="field">
          <label>Model</label>
          <select id="model">
            <option value="claude-opus-4-8" ${p.settings.model === 'claude-opus-4-8' ? 'selected' : ''}>Claude Opus 4.8 (best)</option>
            <option value="claude-sonnet-4-6" ${p.settings.model === 'claude-sonnet-4-6' ? 'selected' : ''}>Claude Sonnet 4.6 (faster/cheaper)</option>
            <option value="claude-haiku-4-5-20251001" ${p.settings.model === 'claude-haiku-4-5-20251001' ? 'selected' : ''}>Claude Haiku 4.5 (fastest)</option>
          </select>
        </div>
        <button class="btn sm" id="savekey">Save</button>
        <span id="saved" class="trendpill up" style="display:none; margin-left:8px;">saved ✓</span>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem;">Your data</h2>
        <p class="muted small">Everything Forma knows about you lives on this device. You own it.</p>
        <div class="stack">
          <button class="btn ghost sm" id="export">Export my data (JSON)</button>
          <button class="btn danger sm" id="reset">Erase everything & start over</button>
        </div>
      </div>

      <p class="muted small center">Forma · as AI gets stronger, we help you stay capable.</p>
    </div>`;

  document.getElementById('name').onchange = (e) => { p.settings.name = e.target.value.trim(); save(); };
  document.getElementById('faith').onclick = () => {
    state.profile = p.settings.faithTrack ? Profile.disableFaithTrack(p) : Profile.enableFaithTrack(p);
    // Regenerate the plan so the change takes effect immediately.
    state.profile.plan = Planner.generatePlan(state.profile);
    save();
    render();
  };
  document.getElementById('savekey').onclick = () => {
    p.settings.apiKey = document.getElementById('key').value.trim();
    p.settings.model = document.getElementById('model').value;
    save();
    const s = document.getElementById('saved'); s.style.display = 'inline-block';
    setTimeout(() => { s.style.display = 'none'; }, 1500);
  };
  document.getElementById('export').onclick = () => {
    const blob = new Blob([Profile.exportProfile(p)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `forma-data-${todayStr()}.json`;
    a.click();
  };
  document.getElementById('reset').onclick = () => {
    if (confirm('Erase all Forma data on this device and start over? This cannot be undone.')) {
      localStorage.removeItem(Profile.STORAGE_KEY);
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
render();
