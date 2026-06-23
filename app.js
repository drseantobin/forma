// app.js — Forma UI controller. Vanilla JS SPA, no build step.
// Renders views into #app and persists everything locally via profile.js.

import { DOMAINS, getDomain, bandFor, activeDomainIds, BANDS, DOMAIN_ICON_PATHS } from './src/domains.js';
import { LIKERT_SCALE, LIKERT_POINTS, baselineByDomain, BASELINE_ITEMS, ALL_ITEMS } from './src/assessments.js';
import { pickExercise, nextMathProblem, shuffledIndices, exerciseMode, makeGuided } from './src/exercises.js';
import { domainScoresFromBaseline, scoreExercise, formationIndex } from './src/scoring.js';
import {
  todayStr, streakAlive, domainTrend, sparklinePath, radarGeometry, daysBetween, startRoute, indexTrend, isLapsedReturn,
} from './src/progress.js';
import { recommendFocus, weeklyPatterns, dailyInsight as ruleDailyInsight, interpretBaseline as ruleInterpretBaseline, currentRead } from './src/insights.js';
import * as Profile from './src/profile.js';
import * as Coach from './src/coach.js';
import * as Diagnostic from './src/diagnostic.js';
import * as Proof from './src/proof.js';
import * as Planner from './src/planner.js';
import { bandAscension, ascensionLine, streakMilestone, nextStreakMark } from './src/milestones.js';
import { confidenceTag, confidence, milestoneEligible, indexConfidence, scaleFreshness } from './src/reliability.js';
import { basisFor, INSTRUMENT_BASIS } from './src/methods.js';
// constructs.js (the higher-order "families" model) is intentionally NOT imported here anymore:
// the families were demoted to a single sentence on the science page (they duplicated the 10
// capacities + carried a premature provisional score). The module stays for the eventual
// data-backed construct view after the cohort proves the facets cohere.
import { growthFor } from './src/growth.js';
import { practiceFor } from './src/practice.js';
import { buildSnapshot, snapshotText } from './src/snapshot.js';
import * as Orchestrator from './src/orchestrator.js';
import * as Research from './src/research.js';
import * as Contact from './src/contact.js';
import * as Release from './src/release.js';
import { PROVIDERS, providerFor, defaultModelFor } from './src/llm.js';
import { summarizeResearch, domainStability } from './src/analytics.js';
import { OVERCLAIM_BANK, overclaimPooled, selfEnhancementReading } from './src/overclaiming.js';
import { CALIBRATION_ITEMS, calibrationScore, calibrationReading, CALIBRATION_CAVEATS } from './src/calibration.js';
import { breathCountScore, breathCountReading, BREATHCOUNT_CAVEATS } from './src/breathcount.js';
import { SVT_BANK, svtScore, svtReading, SVT_CAVEATS } from './src/svt.js';
import { speechSupported, createRecognizer } from './src/speech.js';
import { createTones } from './src/audio.js';
import * as Team from './src/team.js';
import { buildDemoProfile, SPEC as DEMO_SPEC } from './src/demo.js';
import { buildReminderIcs, reminderSummary } from './src/reminder.js';

const DOMAIN_ORDER = DOMAINS.map((d) => d.id);
// The domains to display for the current user (adds Spiritual Life when the
// opt-in faith track is on).
function domainOrder() {
  return activeDomainIds(state.profile && state.profile.settings && state.profile.settings.faithTrack);
}
const app = document.getElementById('app');
const tabbar = document.getElementById('tabbar');
const demobanner = document.getElementById('demobanner');

const state = {
  profile: Profile.loadProfile(),
  route: 'home',
  demo: false, // true while the sample profile is showing (see enterDemo/save)
  // transient view state
  onboard: { step: 0, responses: {}, mode: null, showKey: false, faithTrack: false },
  diag: { messages: [], ready: false, busy: false, error: '' },
  session: null, // active exercise flow
};

// Reflect a previously-saved faith-track preference in the onboarding toggle.
if (state.profile && state.profile.settings && state.profile.settings.faithTrack) {
  state.onboard.faithTrack = true;
}

// The single persistence chokepoint. CRITICAL for Demo Mode: while the sample
// profile is showing, save() is a no-op — nothing the visitor does (navigating,
// chatting with the coach, "completing" an exercise) ever reaches the real
// profile in localStorage. The sample lives only in memory.
function save() { if (state.demo) return; Profile.saveProfile(state.profile); }

// ---- Demo Mode ---------------------------------------------------------------
// A populated SAMPLE profile so investors / prospective users can tour the whole
// app without doing the baseline. Non-destructive (see save() above): the real
// profile is stashed in memory and restored on exit; reloading the page also
// drops the sample and returns to the real profile (it was never saved).
let _realProfile = null;
function enterDemo() {
  if (state.demo) return;
  _realProfile = state.profile; // stash the real one in memory (not touched on disk)
  state.profile = buildDemoProfile();
  state.demo = true;
  state.route = 'home';
  render();
  window.scrollTo(0, 0);
  // Auto-offer the guided walkthrough the first time a visitor opens the sample (it's a
  // non-blocking bottom card with a clear Skip; the banner's "Take the tour" relaunches it).
  if (!_tourShown) { _tourShown = true; startDemoTour(); }
}
function exitDemo() {
  if (!state.demo) return;
  state.demo = false;
  state.profile = _realProfile || Profile.loadProfile();
  _realProfile = null;
  // Land somewhere sensible: a returning real user goes Home; a brand-new
  // visitor (no baseline) falls back to onboarding via render()'s own guard.
  state.route = 'home';
  render();
  window.scrollTo(0, 0);
  announce(DEMO_SPEC.exitToast);
}

// In demo mode, real-data management is meaningless — and the destructive ones
// would hit the REAL profile (reset calls localStorage.removeItem directly,
// bypassing save()'s no-op; export/import would move SAMPLE data through a real
// backup path). Refuse them and point the visitor to exit the sample first.
function blockedInDemo(verb) {
  if (!state.demo) return false;
  announce('Exit the sample first to ' + verb + ' your own data.');
  return true;
}

// Paint/hide the persistent "sample data" banner. Called from render() so it's
// correct on every view, including the snapshot/credential surface (the highest-
// risk place to mistake sample for real — never suppressed there).
function updateDemoBanner() {
  if (!demobanner) return;
  document.body.classList.toggle('has-demobanner', !!state.demo);
  if (!state.demo) {
    demobanner.hidden = true;
    if (demobanner.dataset.on) { demobanner.innerHTML = ''; delete demobanner.dataset.on; }
    return;
  }
  demobanner.hidden = false;
  // Build ONCE on entry — not every render. The element is a role="status" live
  // region, so re-setting innerHTML on each navigation would re-announce it to
  // screen readers every time. It's persistent chrome; announce on entry only.
  if (demobanner.dataset.on) return;
  demobanner.dataset.on = '1';
  demobanner.setAttribute('aria-label', DEMO_SPEC.bannerText + ' ' + DEMO_SPEC.honestyNote);
  demobanner.innerHTML = `<div class="demo-banner-in">
      <span class="demo-banner-txt">${esc(DEMO_SPEC.bannerText)}</span>
      <span class="demo-banner-actions">
        <button type="button" class="demo-banner-tour" id="demotourbtn">Take the tour</button>
        <button type="button" class="demo-banner-exit" id="exitdemo">${esc(DEMO_SPEC.exitCta)}</button>
      </span>
    </div>`;
  const x = document.getElementById('exitdemo');
  if (x) x.onclick = exitDemo;
  const tb = document.getElementById('demotourbtn');
  if (tb) tb.onclick = startDemoTour;
}
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

// Shared view header for primary tabs: an eyebrow + title (+ optional lede and a
// right-aligned slot for a back/secondary control). One authored rhythm everywhere,
// replacing bare hand-rolled <h1> rows. rightHtml is trusted markup (caller-built).
function viewHead(eyebrow, title, lede, rightHtml) {
  return `<header class="viewhead"><div class="row"><div>
      <span class="eyebrow">${esc(eyebrow)}</span>
      <h1>${esc(title)}</h1></div><span class="spacer"></span>${rightHtml || ''}</div>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</header>`;
}

// Appearance theme: 'system' (follow the OS), 'light', or 'dark'. Persisted in
// localStorage and applied to <html data-theme> — read by a tiny <head> script before
// first paint (no flash). The CSS already covers all three: [data-theme] forces a theme;
// absent → @media prefers-color-scheme. Stored OUTSIDE the profile so it works pre-boot.
const THEME_KEY = 'forma_theme';
function currentTheme() { try { return localStorage.getItem(THEME_KEY) || 'system'; } catch (e) { return 'system'; } }
function setTheme(pref) {
  try {
    if (pref === 'light' || pref === 'dark') { localStorage.setItem(THEME_KEY, pref); document.documentElement.setAttribute('data-theme', pref); }
    else { localStorage.removeItem(THEME_KEY); document.documentElement.removeAttribute('data-theme'); }
  } catch (e) { /* noop */ }
}

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
  // Fold the prior day FIRST so the opener we seed below survives renderCoach's new-day fold
  // (which would otherwise archive the freshly-seeded opener on the first coach-touch of a new day).
  if (state.profile.coachDay !== todayStr()) {
    state.profile = Profile.foldCoachHistory(state.profile, todayStr());
    save();
  }
  const p = state.profile;
  // Route to the per-domain thread when this is about a specific (non-interior) capacity, so the
  // conversation lands in that area's running chat; baseline / multi-domain contexts go to General.
  const dkey = (ctx && ctx.domain && getDomain(ctx.domain) && ctx.domain !== 'interior') ? ctx.domain : 'general';
  state.coachThread = dkey;
  const log = coachThreadLog(p, dkey);
  // Drop the rule-based opener in immediately so the Coach is never blank...
  const opener = { role: 'assistant', content: Coach.solutionFocusedOpener(p, ctx), ts: Date.now(), opener: true };
  log.push(opener);
  save();
  go('coach');
  // ...then, with a key, replace it with a live opener tied to this exact
  // session + insight — but only if the person hasn't already started talking.
  if (Coach.hasKey(p)) {
    const live = await raceTimeout(Coach.sessionOpener(p, ctx), 9000, null);
    const last = log[log.length - 1];
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
    clearTimeout(state.session._timer); // guided uses a setTimeout step clock
    state.session._timer = null;
  }
  // Leaving a guided practice mid-run: stop the breathing controller (and any spoken guidance).
  if (route !== 'session' && state.session && state.session._breathStop) {
    state.session._breathStop();
    state.session._breathStop = null;
    stopSpeak();
  }
  // Leaving a contemplation/guided practice: release the audio context too.
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
  // Leaving the Breath-Counting run: stop its tick and release the audio context.
  if (route !== 'breathcount' && state.bct) {
    if (state.bct._timer) { clearInterval(state.bct._timer); state.bct._timer = null; }
    if (state.bct._tones) { state.bct._tones.close(); state.bct._tones = null; }
    state.bct = null;
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
    // A genuine weekly ROLLOVER (an existing plan aged out) with open commitments is the natural
    // once-a-week moment to close the loop — flag a calm, dismissible Weekly Review. NOT on first
    // plan creation (nothing to review yet), and only when there's actually a commitment to weigh.
    const rollover = !!p.plan;
    const hasCommitments = (p.goals || []).some((g) => !g.done);
    p.plan = Planner.generatePlan(p);
    if (rollover && hasCommitments) p._reviewDue = true;
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

// --- Spoken guidance (TTS): a calm voice reads the practice steps, for the "voice" sound
// mode. Uses the browser's on-device SpeechSynthesis; prefers a calm female English voice.
// Separate from the Web-Audio breath waves. getVoices() can load async, so we prime + relisten.
let _calmVoice = null, _voicesPrimed = false;
function pickCalmVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const vs = window.speechSynthesis.getVoices() || [];
  if (!vs.length) return null;
  const pref = ['Samantha', 'Google UK English Female', 'Microsoft Zira', 'Microsoft Aria', 'Karen', 'Moira', 'Tessa', 'Fiona', 'Victoria', 'Serena'];
  for (const name of pref) { const v = vs.find((x) => x.name === name); if (v) return v; }
  const fem = vs.find((v) => /^en/i.test(v.lang) && /female|woman|samantha|zira|aria|karen|moira|tessa|fiona|victoria|serena/i.test(v.name));
  return fem || vs.find((v) => /^en/i.test(v.lang)) || vs[0] || null;
}
function primeVoices() {
  if (_voicesPrimed || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  _voicesPrimed = true;
  _calmVoice = pickCalmVoice();
  try { window.speechSynthesis.onvoiceschanged = () => { _calmVoice = pickCalmVoice(); }; } catch (e) { /* noop */ }
}
function speakText(text) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = _calmVoice || (_calmVoice = pickCalmVoice());
    if (v) u.voice = v;
    u.rate = 0.82; u.pitch = 1.0; u.volume = 0.95; // calm, unhurried
    synth.speak(u);
  } catch (e) { /* noop */ }
}
function stopSpeak() {
  try { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) { /* noop */ }
}

function render() {
  // Any pending re-render destroys the current DOM (incl. mic buttons) — stop a
  // live dictation mic first so it can never be left listening.
  stopActiveMic();
  // A profile always exists in memory so Coach/Settings work before the
  // baseline is done (and so nothing reads a null profile).
  state.profile = state.profile || Profile.createProfile();
  const onboarded = !!state.profile.baseline;
  updateDemoBanner();

  // Tabs are always visible; highlight the active one.
  tabbar.hidden = false;
  [...tabbar.querySelectorAll('.tab')].forEach((t) => {
    const on = t.dataset.route === state.route;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  });

  if (!onboarded) {
    // Before the baseline exists, these routes are safe AND useful — info pages and the
    // standalone Tools practices that don't need a profile. So a new person can read the
    // science or try a tool instead of being bounced into setup (the "blank science page"
    // bug: tapping View → from Settings used to land on onboarding). Everything else → setup.
    const PRE_OK = ['coach', 'settings', 'tools', 'methods', 'team', 'domain', 'epistemiccheck', 'calibration', 'breathcount', 'svt'];
    // The Today and Progress tabs would otherwise fall through to renderOnboarding and just
    // repeat the Home/welcome screen for a brand-new visitor. Give each its OWN first-time
    // invitation instead (Today → the quick check; Progress → a skill to track).
    if (state.route === 'session') renderTodayIntro();
    else if (state.route === 'progress') renderProgressIntro();
    else if (PRE_OK.includes(state.route)) renderRoute();
    else renderOnboarding();
    drawRing(); mountSupportFooter(); return;
  }
  ensurePlan();
  renderRoute();
  // Animate any ring this route mounted (home/team Index) from empty → value.
  drawRing();
  mountSupportFooter();
}

// A calm, always-available support affordance (#8). The reactive crisis path (Coach.looksLikeDistress
// → ESCALATION_MESSAGE) only fires once a person DISCLOSES distress; this makes the same human help
// reachable WITHOUT a disclosure. A quiet footer link on every screen opens a gentle resource sheet.
// Deliberately not red/alarming — honesty made quiet, like the demo banner.
function mountSupportFooter() {
  // The Coach screen has its own bottom-anchored composer (and its own reactive escalation),
  // so a trailing link there would crowd the input. Skip it; the link is on every other screen.
  if (state.route === 'coach') return;
  if (document.getElementById('supportfoot')) return; // app.innerHTML reset clears it; guard re-entry
  const foot = document.createElement('div');
  foot.className = 'support-foot';
  foot.innerHTML = `<button id="supportfoot" type="button">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 22l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
    In a hard moment</button>`;
  app.appendChild(foot);
  foot.querySelector('#supportfoot').onclick = openSupport;
}

// The support sheet itself — a modal mirroring the promo overlay's focus/ESC/backdrop handling,
// rendering Coach.SUPPORT_RESOURCES (the single source of truth shared with the escalation message).
function openSupport() {
  if (document.querySelector('.support-overlay')) return;
  const items = (Coach.SUPPORT_RESOURCES || []).map((r) => {
    const body = r.href
      ? `<a href="${esc(r.href)}"${/^https?:/.test(r.href) ? ' target="_blank" rel="noopener"' : ''}>${esc(r.detail)}</a>`
      : esc(r.detail);
    return `<li><span class="support-label">${esc(r.label)}</span><span class="support-detail">${body}</span></li>`;
  }).join('');
  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay support-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Support in a hard moment');
  overlay.innerHTML = `
    <div class="promo-card support-card">
      <button class="promo-close" id="supportClose" aria-label="Close">×</button>
      <h2>If you're going through something hard</h2>
      <p class="muted small" style="margin:0; line-height:1.55;">Forma is for formation, not crisis care — what matters most right now is a real person. Any of these can help, any time:</p>
      <ul class="support-list">${items}</ul>
      <p class="muted small" style="margin:14px 0 0; line-height:1.5;">There's no shame in reaching out. Forma will be here for the formation work whenever you're ready.</p>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => { document.removeEventListener('keydown', onKey, true); overlay.remove(); try { app.focus(); } catch (e) {} };
  const onKey = (e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  overlay.querySelector('#supportClose').onclick = close;
  try { overlay.querySelector('#supportClose').focus(); } catch (e) { /* noop */ }
}

// ---- Guided demo tour (#6) ----
// A short, skippable walkthrough of the SAMPLE profile so a first-time visitor (or a
// focus-group facilitator) understands what each surface means. Each step navigates to a
// REAL screen via render() and pins a calm explanation card above the tabbar — the live
// screen shows behind it. Demo-only: the tour explains the sample and never runs on real data.
let _tourShown = false; // auto-offer once per demo session (the banner button relaunches)
const DEMO_TOUR = [
  { route: 'home', title: 'The Formation Index', body: 'One calm number for how the ten capacities are trending together. The ring only mirrors the score — there are no points, levels, or streaks to chase here.' },
  { route: 'progress', title: 'How you’re doing', body: 'A plain-language read of where this person is strong and where they’re growing — plus each capacity measured over weeks. A picture, never a verdict.' },
  { route: 'domain', focus: 'emotion_regulation', title: 'Inside a capacity', body: 'Every capacity opens to show how it’s measured, the research it adapts, and a way to practice it. This one is trending gently down — Forma names that plainly, without alarm.' },
  { route: 'methods', title: 'Where the ten come from', body: 'The science page explains why these ten capacities, and the established paradigm each measure adapts — honest about what’s validated and what isn’t yet.' },
];
function _onTourKey(e) { if (e.key === 'Escape') { e.stopPropagation(); endDemoTour(); } }
function endDemoTour() {
  const el = document.getElementById('demotour');
  if (el) el.remove();
  document.removeEventListener('keydown', _onTourKey, true);
}
function showTourStep(i) {
  if (!state.demo) { endDemoTour(); return; }            // meaningless off the sample
  if (i < 0 || i >= DEMO_TOUR.length) { endDemoTour(); return; }
  const step = DEMO_TOUR[i];
  if (step.focus) state.focusDomain = step.focus;
  state.route = step.route;
  render();                                              // rebuilds #app; the tour card lives in <body> and survives
  window.scrollTo(0, 0);
  let el = document.getElementById('demotour');
  if (!el) { el = document.createElement('div'); el.id = 'demotour'; el.className = 'demo-tour'; document.body.appendChild(el); }
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-label', 'Sample tour: ' + step.title);
  const last = i === DEMO_TOUR.length - 1;
  el.innerHTML = `
    <div class="demo-tour-card">
      <div class="demo-tour-step">Tour · ${i + 1} of ${DEMO_TOUR.length}</div>
      <h3>${esc(step.title)}</h3>
      <p>${esc(step.body)}</p>
      <div class="demo-tour-foot">
        <button class="demo-tour-skip" id="tourskip" type="button">Skip tour</button>
        <span class="spacer"></span>
        ${i > 0 ? '<button class="btn ghost sm" id="tourback" type="button">Back</button>' : ''}
        <button class="btn sm" id="tournext" type="button">${last ? 'Done' : 'Next →'}</button>
      </div>
    </div>`;
  document.removeEventListener('keydown', _onTourKey, true);
  document.addEventListener('keydown', _onTourKey, true);
  el.querySelector('#tourskip').onclick = endDemoTour;
  const back = el.querySelector('#tourback'); if (back) back.onclick = () => showTourStep(i - 1);
  el.querySelector('#tournext').onclick = () => (last ? endDemoTour() : showTourStep(i + 1));
}
function startDemoTour() { if (state.demo) showTourStep(0); }

function renderRoute() {
  switch (state.route) {
    case 'home': return renderHome();
    case 'session': return renderSession();
    case 'progress': return renderProgress();
    case 'plan': return renderPlan();
    case 'review': return renderReview();
    case 'lens': return renderInteriorLens();
    case 'team': return renderTeam();
    case 'methods': return renderMethods();
    case 'snapshot': return renderSnapshot();
    case 'proof': return renderProof();
    case 'focuscheck': return renderFocusCheck();
    case 'epistemiccheck': return renderEpistemicCheck();
    case 'calibration': return renderCalibration();
    case 'breathcount': return renderBreathCount();
    case 'svt': return renderSvt();
    case 'domain': return renderDomainDetail();
    case 'tools': return renderTools();
    case 'coach': return renderCoach();
    case 'settings': return renderSettings();
    default: return renderHome();
  }
}

tabbar.addEventListener('click', (e) => {
  const t = e.target.closest('.tab');
  if (!t) return;
  // Tapping the Coach TAB is the OPEN/general space (a per-domain thread is entered from a
  // capacity's "talk about it", not from the tab).
  if (t.dataset.route === 'coach') state.coachThread = 'general';
  go(t.dataset.route);
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
      <div class="welcome-stagger">
        <div class="hero">
          <div class="glyph fmarkglyph">${formaMark}</div>
          <h1>Forma</h1>
          <p class="lede">AI keeps getting better at the work. The quieter question is who you become while it does.</p>
          <p class="muted small" style="max-width:32rem; margin:12px auto 0; line-height:1.5;">Forma measures and trains the human capacities that grow more valuable as the machines take the rest — like attention, deep reading, judgment, relational presence, and the agency to keep your thinking your own. A few minutes a day.</p>
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
          <button class="btn ghost" id="seedemo">${esc(DEMO_SPEC.welcomeButton)} →</button>
        </div>
        <p class="muted small center" style="margin-top:12px;">${BASELINE_ITEMS.length} honest self-ratings across your capacities — a short check that works offline, no account or key. Not sure yet? The sample profile shows the whole app, already populated — nothing saved.</p>
        <p class="muted small center" style="margin-top:10px;">Prefer to talk it through? <button class="inlinelink" id="talk">Start a coach conversation</button> <span class="muted">· advanced — uses your own AI key</span></p>
        <div class="card" style="margin-top:12px; display:flex; align-items:center; gap:12px;">
          ${uiIcon('dove')}
          <div style="flex:1;">
            <div style="font-weight:600; font-size:.95rem;">Spiritual Life track <span class="muted small">· optional</span></div>
            <div class="muted small">Bring prayer, silence, and the spiritual life into your formation — tended alongside the rest, kept private, and never shown to anyone but you.</div>
          </div>
          <button class="opt ${state.onboard.faithTrack ? 'selected' : ''}" id="faithtoggle" aria-pressed="${!!state.onboard.faithTrack}" aria-label="Spiritual Life track" style="width:auto; padding:8px 14px; font-weight:700;">${state.onboard.faithTrack ? 'On' : 'Off'}</button>
        </div>
        ${needKey ? `
          <div class="card" style="margin-top:12px;">
            <p class="small"><strong>The conversation needs an API key.</strong> Bring your own from any provider — Claude, GPT, Gemini, OpenRouter. Pick yours below and paste the key to talk it through, or just use the quick check above. Your key stays on this device.</p>
            <div class="field"><label for="inlineprovider">Provider</label><select id="inlineprovider">${Object.values(PROVIDERS).map((pv) => `<option value="${esc(pv.id)}" ${(state.profile?.settings?.provider || 'anthropic') === pv.id ? 'selected' : ''}>${esc(pv.label)}</option>`).join('')}</select></div>
            <div class="field"><input id="inlinekey" type="password" placeholder="Paste your API key" /></div>
            <button class="btn sm" id="savekeyinline">Save key & start the conversation</button>
          </div>` : ''}
        <div class="card" style="margin-top:12px; background:var(--green-soft); border-color:transparent;">
          <div class="eyebrow" style="color:var(--green);">${uiIcon('lock','binline')} Private by design</div>
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
    const sd = document.getElementById('seedemo');
    if (sd) sd.onclick = enterDemo;
    document.getElementById('talk').onclick = () => {
      if (Coach.hasKey(state.profile)) startConversation();
      else { state.onboard.showKey = true; render(); }
    };
    const skb = document.getElementById('savekeyinline');
    if (skb) skb.onclick = () => {
      const v = document.getElementById('inlinekey').value.trim();
      if (!v) return;
      state.profile = state.profile || Profile.createProfile();
      // Set provider + model to match the chosen provider — otherwise a GPT/Gemini key rides the
      // default Anthropic adapter (with a leftover claude model id) and the first turn errors.
      const pv = document.getElementById('inlineprovider').value;
      state.profile.settings.provider = pv;
      state.profile.settings.model = defaultModelFor(pv);
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
  const fi = formationIndex(p.domainScores);
  app.innerHTML = `
    <div class="fade-in">
      <div class="brandmark"><div class="logo">${formaMark}</div><div class="name">Forma</div><div class="tag">Your starting line</div></div>
      <div class="card index-hero">
        ${indexRing(fi, { numId: 'baselineidx', start: 0 })}
        <div class="index-label">Formation Index — your starting line</div>
        ${(() => { const ic = indexConfidence(p); return ic.thin ? `<div class="muted small" style="margin-top:4px;">${esc(ic.note)}</div>` : ''; })()}
        <p class="muted small" style="margin-top:6px;">One read across all your capacities — from how you described yourself today. Not a grade — the line you move from.</p>
      </div>
      ${radarCard(p.domainScores)}
      <div class="card" id="interp">
        <div class="row"><span class="spinner"></span> <span class="muted">Reading your profile…</span></div>
      </div>
      <button class="btn ghost" id="talkbaseline" style="margin-bottom:10px;">${coachGlyph} Talk through my profile with the coach →</button>
      <div class="card" id="researchconsent-card" style="text-align:left;">
        <div class="eyebrow" style="color:var(--green);">Help improve Forma — optional</div>
        <p class="muted small" style="margin-top:4px;">Share your <strong>anonymous</strong> results so we can learn what actually helps people grow. It changes nothing about your experience — and never includes your name, anything you write, or your Spiritual Life. Just anonymous scores.</p>
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
  // Animate the headline number in — the FIRST score a new person sees should land as a calm
  // instrument settling to a reading (the same reveal as a session score), not a static digit.
  countUp(document.getElementById('baselineidx'), fi, 900);
  drawRing();
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
      <div class="brandmark"><div class="logo">${formaMark}</div><div class="name">Forma</div><div class="tag">Getting to know you</div></div>
      <div class="chat" id="dchat" role="log">
        <div class="bubble coach">${esc(Diagnostic.OPENING)}</div>
        ${d.messages.map((m) => `<div class="bubble ${m.role === 'user' ? 'me' : 'coach'}">${esc(m.content)}</div>`).join('')}
        ${d.busy ? '<div class="bubble coach typing"><span class="typing-dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><span class="sr-only">Coach is composing a reply</span></div>' : ''}
      </div>
      ${d.error ? `<p class="muted small" style="color:var(--red)">${esc(d.error)}</p>` : ''}
      ${canBuild
        ? `<button class="btn amber" id="build" ${d.busy ? 'disabled' : ''}>Build my profile →</button>
           <p class="muted small center" style="margin-top:8px;">Or keep talking — the more you share, the truer the read.</p>`
        : ''}
      <div class="composer" style="bottom:12px;">
        <input id="dci" aria-label="Type your reply" placeholder="Type your reply…" autocomplete="off" ${d.busy ? 'disabled' : ''} />
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
      announce(Coach.ESCALATION_MESSAGE);
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
      announce(reply.text);
      if (reply.ready) d.ready = true;
    } catch (e) {
      d.messages.pop(); // let them retry the last reply
      d.error = "Couldn't reach the coach just now — check your key in the quick-check screen, or try again.";
    }
    d.busy = false;
    render();
    const el = document.getElementById('dci'); if (el) el.focus(); // the re-render destroyed the input; return focus to it
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

// Inline chat glyph for the "talk to the coach" buttons — same stroke system (24px grid,
// 1.6 weight, currentColor) as the tab + domain icons, so the coach flow carries no stray
// emoji either. Sized in em (.binline) so it tracks the button text.
const coachGlyph = '<svg class="binline" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3.5V7a1 1 0 0 1 1-1Z"/></svg>';

// Forma's brandmark — a bold "F" with a green leaf forming its left edge (growth /
// formation). Adapted from Sean's logo to Forma's palette: the F is var(--ink) so it
// flips with the theme (dark navy in light mode, light in dark), and the leaf is
// var(--green), readable in both. Shown directly (no tile) — the wordmark "Forma" sits
// beside it. Used everywhere the brand glyph renders.
const formaMark = '<img src="./brandmark.png" class="logo-img" alt="" aria-hidden="true">';

// Dictation glyphs — same inline-SVG stroke system as the rest. micGlyph = a mic;
// stopGlyph = a filled stop square (mid-recording). They replace the last mic/stop emoji in
// the app's interaction surfaces. aria-hidden — every mic button carries its own aria-label.
const micGlyph = '<svg class="micico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/></svg>';
const stopGlyph = '<svg class="micico" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5"/></svg>';

// Section / feature-card icons (Settings + Progress) — the same inline-SVG stroke system,
// replacing the last hardcoded chrome emoji (document, flask, building, mirror, target,
// breath, book, people, lock). Default accent-tinted; aria-hidden (each card has a heading).
const UI_ICON = {
  doc: '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v4h4"/><path d="M9 12.5h6M9 16h6"/>',
  science: '<path d="M9.5 3h5"/><path d="M10.5 3v6l-5 8.5A1 1 0 0 0 6.4 19h11.2a1 1 0 0 0 .9-1.5L13.5 9V3"/><path d="M7.7 14h8.6"/>',
  building: '<rect x="5" y="3" width="14" height="18" rx="1.2"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2"/><path d="M10 21v-3.5h4V21"/>',
  mirror: '<ellipse cx="12" cy="9" rx="5.5" ry="6.5"/><path d="M12 15.5V21M9.5 21h5"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  breath: '<circle cx="9.5" cy="13" r="5"/><circle cx="16.5" cy="8" r="2.6"/>',
  book: '<path d="M12 6.5C9.5 5 6.5 5 4 5.6V18c2.5-.6 5.5-.6 8 1 2.5-1.6 5.5-1.6 8-1V5.6C17.5 5 14.5 5 12 6.5Z"/><path d="M12 6.5V19"/>',
  people: '<circle cx="9" cy="8.5" r="2.6"/><circle cx="16.5" cy="9.5" r="2"/><path d="M4 18c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5"/><path d="M14.5 15.5c.6-1.3 2-2 3.5-2 2 0 3.5 1.3 3.5 3.2"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  // Streak / status glyphs — calm stroke OUTLINES (not filled, glossy emoji), so the gamification
  // mark reads quiet, inherits the chip's color + dark mode, and matches the rest of the icon set.
  flame: '<path d="M12 3c.6 2.6 2.1 3.9 3.3 5.4A5 5 0 1 1 7 11.6c0-1 .4-2 1-2.8.4.8 1 1.3 1.9 1.4C9.5 7.7 10.4 5.4 12 3Z"/>',
  spark: '<path d="M12 4l1.7 4.6L18 10l-4.3 1.4L12 16l-1.7-4.6L6 10l4.3-1.4Z"/>',
  ember: '<path d="M12 8c.5 1.7 1.5 2.6 2.2 3.6a3.4 3.4 0 1 1-5.6 1.2c.3.5.8.8 1.4.9C9.6 11.9 10.4 10.2 12 8Z"/>',
  bolt: '<path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z"/>',
  // Remaining chrome glyphs, brought into the one stroke set (dove=faith, save=backup,
  // mail=contact, buoy=grace day, check=done, pencil/trash=goal actions).
  dove: '<path d="M21 7c-2 0-3.6 1-4.7 2.6C15 12 12.6 13 9.6 13 7 13 5 12 3.5 10c.3 4.4 3.7 7.6 8.1 7.6 3.9 0 6.8-2.4 7.9-5.5.8-.2 1.4-.8 1.7-1.7.3-1 .2-2.2-.7-3.4Z"/><path d="M9.6 13 8 17.4"/>',
  save: '<path d="M5 5h11l3 3v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z"/><path d="M8 5v4h6V5"/><rect x="8" y="13" width="8" height="6"/>',
  mail: '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M4 7.5l8 5.5 8-5.5"/>',
  buoy: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.4"/><path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  pencil: '<path d="M4 20h4L18 10l-4-4L4 16v4Z"/><path d="M13.5 6.5l4 4"/>',
  trash: '<path d="M5 7h14M10 7V5h4v2M6.5 7l1 12.5h9L17.5 7"/>',
};
function uiIcon(name, cls) {
  const p = UI_ICON[name];
  if (!p) return '';
  return `<svg class="${cls || 'secico'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}

// ---------------- home ----------------
// A thin progress ring around the Formation Index — gives the one number the whole
// app exists to deliver real visual gravity (an instrument readout, à la Oura/WHOOP)
// WITHOUT gamification: the arc simply mirrors the 0–100 composite, single calm hue,
// rounded cap, no fill, no spin. SVG so it stays crisp and theme-aware (dark mode too).
function indexRing(value, opts = {}) {
  const v = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
  const C = 339.292; // circumference = 2·π·54
  const off = (C * (1 - v / 100)).toFixed(2); // final offset: full arc at 0, closed at 100
  const label = opts.label || 'Formation Index';
  // The arc MOUNTS EMPTY (offset = full circumference) and carries its target in
  // data-arc-to; drawRing() applies the target on the next frame so the CSS transition
  // fires and the arc draws IN — the instrument "settling to a reading" (synced with the
  // count-up). opts.color tints the arc (e.g. the band color on a scored reveal);
  // opts.numId + opts.start let a caller count the numeral up from a start value.
  const arcStroke = opts.color ? ` style="stroke:${opts.color}"` : '';
  const numId = opts.numId ? ` id="${opts.numId}"` : '';
  const shown = opts.start != null ? opts.start : v;
  return `<div class="index-ring" role="img" aria-label="${esc(label)}: ${v} out of 100">
      <svg class="index-ring-svg" viewBox="0 0 120 120" aria-hidden="true">
        <circle class="ring-track" cx="60" cy="60" r="54"></circle>
        <circle class="ring-arc" cx="60" cy="60" r="54"${arcStroke} stroke-dasharray="${C.toFixed(2)}" stroke-dashoffset="${C.toFixed(2)}" data-arc-to="${off}"></circle>
      </svg>
      <div class="index-num kbig"${numId} aria-hidden="true">${shown}</div>
    </div>`;
}

// Drive every freshly-mounted ring arc from empty → its target offset, so the CSS
// transition animates the draw-in. Double-rAF guarantees the browser paints the empty
// state first; reduced-motion jumps straight to the target. Idempotent + safe to call
// after any render (only acts on arcs still carrying data-arc-to).
function drawRing(root) {
  const scope = root || document;
  scope.querySelectorAll('.ring-arc[data-arc-to]').forEach((arc) => {
    const to = arc.getAttribute('data-arc-to');
    arc.removeAttribute('data-arc-to');
    if (prefersReducedMotion()) { arc.style.strokeDashoffset = to; return; }
    requestAnimationFrame(() => requestAnimationFrame(() => { arc.style.strokeDashoffset = to; }));
  });
}

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
  // Once today's session is done, "keep going" points to the NEXT most useful capacity —
  // the lowest-scoring one not just practiced (recommendFocus), NOT today's already-finished
  // plan focus (which would just repeat the same domain). Surfaces the tailored loop for a
  // motivated user; framed as optional below, never pressured.
  const keepFocus = doneToday ? recommendFocus(p) : focus;
  const kfd = getDomain(keepFocus);
  const lastInsight = p._lastInsight;

  app.innerHTML = `
    <div class="fade-in">
      <div class="brandmark"><div class="logo">${formaMark}</div><div class="name">Forma</div>
        <div class="tag">${greeting()}${p.settings.name ? ', ' + esc(p.settings.name) : ''}</div></div>

      <div class="card index-hero">
        ${indexRing(fi, { numId: 'homeidx', start: 0 })}
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
        <div class="streakchip ${alive ? '' : neverStarted ? 'fresh' : 'cold'}">${uiIcon(alive ? 'flame' : neverStarted ? 'spark' : 'ember', 'chipico')} ${
          // Calm presence count — no countdown-to-a-mark, no "relight it" nudge (v309: streaks
          // are not a pressure mechanic). Just the honest number of days, framed as formation.
          neverStarted ? 'Your formation starts today'
            : (p.streak.current || 0) >= 1 ? `${p.streak.current} ${p.streak.current === 1 ? 'day' : 'days'} of formation`
              : 'Welcome back'}</div>
      </div>

      ${radarCard(p.domainScores)}

      ${welcomeBackCard(p)}

      ${backupNudgeCard(p)}

      ${lastInsight ? `<div class="card"><div class="insight ${lastInsight.live ? 'live' : ''}" style="border:none;padding:0;">
        <div class="k">Today's insight</div>
        <div style="margin-top:6px; white-space:pre-wrap;">${esc(lastInsight.text)}</div></div></div>` : ''}

      <h2 class="section-head">Today</h2>

      <div class="card">
        <div class="row" style="margin-bottom:10px;">
          <strong>${doneToday ? "Today's session complete" : "Today's focus"}</strong>
          <span class="spacer"></span>
          ${doneToday ? `<span class="trendpill up">done ${uiIcon('check', 'tpico')}</span>` : ''}
        </div>
        ${doneToday ? `<p class="muted small" style="margin:-2px 0 12px;">That’s today’s — genuinely enough. But if you’re in a groove, here’s where the next few minutes go furthest:</p>` : ''}
        <div class="domain-row tappable" data-domain="${keepFocus}" role="button" tabindex="0" aria-label="${esc(kfd.name)} — how to grow it" style="margin-bottom:14px;">
          <span class="ico">${kfd.icon}</span>
          <div class="meta"><div class="dn">${esc(kfd.name)}</div>
            <div class="muted small">${esc(kfd.short)}</div></div>
          <span class="chev" aria-hidden="true">›</span>
        </div>
        <button class="btn ${doneToday ? 'ghost' : 'amber'}" id="startsession">${doneToday ? `Keep going → ${esc(kfd.name)}` : 'Go to today’s session →'}</button>
        <p class="muted small center" style="margin:10px 0 0;">Tap the capacity above to learn how to grow it.</p>
      </div>

      ${todaysPracticeCard(p)}

      <div class="card">
        <div class="row" style="margin-bottom:6px;">
          <span class="ico" style="font-size:1.3rem;">${getDomain('emotion_regulation').icon}</span>
          <strong>Guided practice</strong>
          <span class="spacer"></span>
          <span class="muted small">~2 min</span>
        </div>
        <p class="muted small" style="margin:0 0 12px;">A short, breath-guided practice to settle and steady — chosen for what you’ve been carrying lately. Optional, anytime, and never scored.</p>
        <button class="btn ghost" id="startguided">Begin a guided practice →</button>
      </div>

      ${weekStripCard(p)}

      ${commitmentsCard(p)}
    </div>`;

  // When today's done, "Keep going" starts a session aimed at the tailored next capacity
  // (lowest, not-just-done); otherwise it's today's planned focus.
  document.getElementById('startsession').onclick = () => { if (doneToday) startDomainSession(keepFocus); else go('session'); };
  const sg = document.getElementById('startguided');
  if (sg) sg.onclick = () => startGuidedSession();
  const wp = document.getElementById('toplan');
  if (wp) wp.onclick = () => go('plan');
  const tr = document.getElementById('toreview');
  if (tr) tr.onclick = () => go('review');
  const nb = document.getElementById('nudgebackup');
  if (nb) nb.onclick = () => { downloadBackup(); render(); };
  const nl = document.getElementById('nudgelater');
  if (nl) nl.onclick = () => {
    const d = new Date(); d.setDate(d.getDate() + 14);
    p.settings.backupSnoozeUntil = d.toISOString().slice(0, 10);
    save(); render();
  };
  // Let the headline number arrive as a calm instrument settling to a reading — synced
  // with the ring's draw-in (drawRing() fires after render), the same reveal already used
  // at the baseline, domain, and session screens. countUp() is reduced-motion-safe.
  countUp(document.getElementById('homeidx'), fi, 900);
  wireDomainLinks();
  wireCommitments();
  wireTodaysPractice();
}

// A gentle, dismissible reminder to keep a backup — Forma is local-first, so a
// cleared browser is the real data-loss risk. Shows only once there's meaningful
// data (>=5 sessions) AND no recent export, and stays quiet for 14 days if snoozed.
function backupNudgeCard(p) {
  if (state.demo) return ''; // backing up a SAMPLE is meaningless — never nudge it
  if ((p.sessions || []).length < 5) return '';
  const now = todayStr();
  const snooze = p.settings && p.settings.backupSnoozeUntil;
  if (snooze && snooze >= now) return '';
  const last = p.settings && p.settings.lastExportAt;
  const daysSince = last ? daysBetween(String(last).slice(0, 10), now) : Infinity;
  if (daysSince < 30) return '';
  return `<div class="card" id="backupnudge" style="border-left:4px solid var(--amber);">
    <div class="row">${uiIcon('save')}
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
  // The single export chokepoint — guarding HERE protects every caller (Home nudge +
  // Settings) so a sample can never leave through the backup path.
  if (blockedInDemo('export')) return;
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
    const bg = d.done ? 'var(--green-soft)' : isToday ? 'var(--accent-soft)' : 'var(--card)';
    const ring = isToday ? 'box-shadow:0 0 0 2px var(--accent);' : '';
    return `
      <div style="flex:1; text-align:center;">
        <div class="muted small" style="font-size:.65rem;">${dow}</div>
        <div style="margin-top:4px; height:38px; border-radius:10px; border:1px solid var(--line); ${ring} background:${bg}; display:grid; place-items:center; font-size:1.1rem;">
          ${d.done ? uiIcon('check', 'dico') : getDomain(d.domain).icon}
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
      ${p._reviewDue ? `<div style="margin-top:12px; padding-top:12px; border-top:1px solid var(--line);">
        <p class="small" style="margin:0 0 8px;">A new week's plan is ready. Take a moment to review last week's commitments — keep, adjust, or retire each.</p>
        <button class="btn sm" id="toreview" style="width:auto;">Review commitments →</button>
      </div>` : ''}
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
    // Nest the domain icon (an SVG, not a glyph) centered on the axis label point.
    const sz = 19;
    return `<svg x="${(a.labelX - sz / 2).toFixed(1)}" y="${(a.labelY - sz / 2 + 1).toFixed(1)}" width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="var(--ink-faint)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${DOMAIN_ICON_PATHS[a.id] || ''}</svg>`;
  }).join('');

  const ariaSummary = order.map((id) => `${getDomain(id).name} ${scores[id] ?? 0}, ${bandFor(scores[id] ?? 0).label}`).join('; ');
  return `
    <div class="card">
      <h2 style="font-size:1.05rem;">Your formation profile</h2>
      <div class="radarwrap">
        <svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:320px;" role="img" aria-label="Your formation profile, out of 100: ${esc(ariaSummary)}">
          ${rings}${axes}
          <polygon points="${geo.points}" fill="rgba(76,95,213,.14)" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
          ${geo.axes.map((a) => `<circle cx="${a.x}" cy="${a.y}" r="4.5" fill="${bandFor(scores[a.id] ?? 0).color}" stroke="var(--card)" stroke-width="1.5"/>`).join('')}
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
    <div class="domain-row tappable" data-domain="${id}" role="button" tabindex="0" aria-label="${esc(d.name)}, ${score} out of 100, ${esc(band.label)} — how to grow it">
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
    : ex.type === 'flanker' ? 'flanker-intro'
    : ex.type === 'span' ? 'span-intro'
    : ex.type === 'mathfluency' ? 'math-intro'
    : ex.type === 'pursuit' ? 'pursuit-intro'
    : ex.type === 'contemplation' ? 'contempl-intro'
    : ex.type === 'guided' ? 'guided-intro'
    : ex.type === 'reliance' ? 'reliance-intro'
    : 'play';
}

// Start an on-demand guided ACT practice. Unlike the daily session it's not
// chosen by the measurement rotation — the person reaches for it when they want
// it, and the module is picked on-device from what they've been naming.
function startGuidedSession(moduleId = null) {
  const ex = makeGuided(state.profile, moduleId);
  state.session = { exercise: ex, phase: 'guided-intro', response: { moduleId: ex.moduleId }, started: Date.now() };
  state.route = 'session';
  render();
  window.scrollTo(0, 0);
}

// The TEACH/DIRECT card — a few evidence-based ways to grow this capacity in daily life,
// shown after a session (test → train → TEACH) so a result becomes direction. Honest:
// general formation guidance, framed as habits that build the capacity over time.
function growthCard(domainId, opts = {}) {
  const items = growthFor(domainId);
  if (!items) return '';
  const d = getDomain(domainId);
  if (opts.compact) {
    // Phone reveal: show ONE growth habit (a taste) instead of all three, so the
    // post-session screen stays short. The full set lives on the capacity page,
    // reachable from the "See your …" link just below on the reveal.
    const g = items[0];
    return `<div class="card growcard">
      <div class="eyebrow">Grow this in daily life</div>
      <div class="growitem">
        <div class="growitem-head">
          <div class="growtitle">${esc(g.title)}</div>
          <button class="btn ghost growcommit" data-gd="${esc(domainId)}" data-gt="${esc(g.title)}" aria-label="Make “${esc(g.title)}” a commitment">+ Commitment</button>
        </div>
        <div class="muted small" style="margin-top:2px;">${esc(g.how)}</div>
        <div class="growwhy">${esc(g.why)}</div>
      </div>
    </div>`;
  }
  return `<div class="card growcard${opts.nested ? ' nested' : ''}">
      ${opts.nested ? '' : `<div class="eyebrow">Grow this in daily life</div>`}
      ${opts.hideName || opts.nested ? '' : `<div class="row" style="margin:2px 0;"><strong>${esc(d ? d.name : 'this capacity')}</strong></div>`}
      ${opts.nested ? '' : `<p class="muted small" style="margin:${opts.hideName ? '6px' : '0'} 0 10px;">Small, evidence-based habits that build this over time — formation, not a quick fix.</p>`}
      ${items.map((g) => `<div class="growitem">
        <div class="growitem-head">
          <div class="growtitle">${esc(g.title)}</div>
          <button class="btn ghost growcommit" data-gd="${esc(domainId)}" data-gt="${esc(g.title)}" aria-label="Make “${esc(g.title)}” a commitment">+ Commitment</button>
        </div>
        <div class="muted small" style="margin-top:2px;">${esc(g.how)}</div>
        <div class="growwhy">${esc(g.why)}</div>
      </div>`).join('')}
    </div>`;
}

// Turn a growth habit into a self-chosen, tracked Commitment (the DIRECT step: teaching
// becomes action the coach reads + you check off on Home). Idempotent; reflects existing.
function wireGrowthCommit() {
  app.querySelectorAll('.growcommit').forEach((b) => {
    const dom = b.getAttribute('data-gd');
    const title = b.getAttribute('data-gt');
    const settle = (label) => { b.textContent = label; b.setAttribute('aria-label', `“${title}” — ${label.replace(' ✓', '')}`); b.setAttribute('aria-disabled', 'true'); b.onclick = null; b.classList.add('committed'); };
    // Already committed — match the bare title OR a plan composed from it (see composeCommitment).
    const has = (state.profile.goals || []).some((g) => !g.done && commitmentMatches(g.text, title));
    if (has) { settle('Committed ✓'); return; }
    b.onclick = () => openCommitPlan(b, dom, title, settle);
  });
}

// An optional implementation-intention scaffold for a commitment (Gollwitzer & Sheeran 2006,
// d≈.65): a plan tied to a concrete cue ("when X, I'll Y") tends to be acted on more than a
// vague intention. OPTIONAL by design — forcing a plan onto a low-commitment goal just adds
// friction for no gain (Gollwitzer & Oettingen 2019). The response clause stays the existing
// POSITIVE habit title, which structurally avoids the "if-then-NOT" backfire (Adriaanse 2011).
// General behavior-change guidance, never a guarantee — the copy claims ONLY that cued plans
// "tend to stick better", no effect size, no streak pressure.
const PLAN_SUFFIX = (title) => `I’ll: ${title}.`;
function commitmentMatches(goalText, title) {
  return goalText === title || (typeof goalText === 'string' && goalText.endsWith(PLAN_SUFFIX(title)));
}
function composeCommitment(cue, title) {
  const c = (cue || '').trim().replace(/[\s.,;]+$/, '');
  if (!c) return title; // skipped/empty → bare intention, exactly as before (no regression)
  const lead = /^(after|before|when|whenever|once|each|every)\b/i.test(c)
    ? c.charAt(0).toUpperCase() + c.slice(1)
    : `When ${c}`;
  return `${lead}, ${PLAN_SUFFIX(title)}`;
}
// Inline cue capture: tapping "+ Make it a commitment" opens ONE optional "when will you do
// this?" field (Save plan / Skip — just track it), then stores the composed plan via addGoal.
function openCommitPlan(btn, dom, title, settle) {
  // The button now lives in a flex header row (top-right of the habit), so the cue form
  // is appended to the END of the habit item rather than right after the button.
  const item = btn.closest('.growitem') || btn.parentElement;
  if (item.querySelector('.commit-plan-form')) return;
  btn.style.display = 'none';
  const form = document.createElement('div');
  form.className = 'commit-plan-form';
  form.innerHTML = `
    <label class="commit-plan">
      <span class="muted small">When will you do this? <span class="commit-opt">(optional)</span></span>
      <input class="cue-input" type="text" maxlength="60" placeholder="after I pour my morning coffee…" aria-label="When will you do this? Optional." />
    </label>
    <p class="commit-help muted small">Plans tied to a moment you already have tend to stick better than vague intentions.</p>
    <div class="row commit-actions">
      <button class="btn sm cue-save" type="button">Save plan</button>
      <button class="btn ghost sm cue-skip" type="button">Skip — just track it</button>
    </div>`;
  item.appendChild(form);
  const input = form.querySelector('.cue-input');
  if (input.focus) input.focus();
  const finish = (text) => {
    state.profile = Profile.addGoal(state.profile, dom, text);
    save();
    form.remove();
    btn.style.display = '';
    settle('Committed ✓');
    announce('Added to your commitments.'); // SR feedback — committing was silent before (a11y standard)
    if (btn.focus) btn.focus();             // the form (with the activated button) was removed; return
                                            // focus to the now-committed button instead of dropping to <body>
  };
  form.querySelector('.cue-save').onclick = () => finish(composeCommitment(input.value, title));
  form.querySelector('.cue-skip').onclick = () => finish(title);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish(composeCommitment(input.value, title)); } });
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

// "Today's Practice" — the TRAIN side made daily + interactive. Surfaces today's focus capacity's
// real-life practice. HYBRID: if there's an open commitment for that capacity, IT is today's
// practice (one-tap check-in). If not, an adaptable fill-in-the-blank template — cadence-framed
// (daily "Today I'll…" vs situational "Next time…") + an optional WOOP obstacle line — which the
// person edits and adopts → becomes a commitment (reuses composeCommitment + addGoal + setCoping).
// Honest: real-life practice, never "raises your score"; a situational no-trigger day isn't a miss.
function todaysPracticeCard(p) {
  const focus = Planner.focusForToday(p) || recommendFocus(p);
  const d = getDomain(focus);
  const practice = practiceFor(focus);
  if (!d || !practice) return '';
  const today = todayStr();
  const commit = (p.goals || []).find((g) => g && !g.done && g.domain === focus);
  if (commit) {
    const checkins = Array.isArray(commit.checkins) ? commit.checkins : [];
    const done = checkins.includes(today);
    const n = checkins.length;
    const c = commit.coping;
    const note = done
      ? 'Done today — that’s the rep.'
      : (practice.cadence === 'situational' ? 'It stays armed — a day without the moment isn’t a miss.' : 'A small real-life rep, your way.');
    return `
      <div class="card practice-card">
        <div class="k">Today’s practice · ${esc(d.name)}</div>
        <div class="practice-commit">
          <button class="goalcheck ${done ? 'on' : ''}" data-practicecheck="${esc(commit.id)}" aria-pressed="${done}" aria-label="${done ? 'Done today — tap to undo' : 'Mark done today'}: “${esc(commit.text)}”">${done ? uiIcon('check', 'goalcheckico') : ''}</button>
          <div class="practice-commit-body">
            <div class="practice-commit-text">${esc(commit.text)}</div>
            ${c ? `<p class="muted small" style="margin:4px 0 0;">If ${esc(c.when)}, I’ll ${esc(c.then)}.</p>` : ''}
            ${n ? `<p class="muted small" style="margin:4px 0 0;">Kept ${n}×.</p>` : ''}
          </div>
        </div>
        <p class="muted small" style="margin:10px 0 0;">${note}</p>
      </div>`;
  }
  const daily = practice.cadence === 'daily';
  const lede = daily
    ? 'One small real-life rep today — make it yours.'
    : 'Arm a plan for next time it comes up. A day without the moment isn’t a miss.';
  const fields = daily
    ? `<label class="practice-field"><span class="muted small">Today I’ll</span>
           <input class="practice-action" type="text" maxlength="90" value="${esc(practice.action)}" aria-label="Today I will" /></label>
         <label class="practice-field"><span class="muted small">When / where</span>
           <input class="practice-cue" type="text" maxlength="70" value="${esc(practice.cue)}" placeholder="e.g. after my morning coffee" aria-label="When or where" /></label>`
    : `<label class="practice-field"><span class="muted small">Next time</span>
           <input class="practice-cue" type="text" maxlength="70" value="${esc(practice.cue)}" aria-label="Next time — the trigger" /></label>
         <label class="practice-field"><span class="muted small">I’ll</span>
           <input class="practice-action" type="text" maxlength="90" value="${esc(practice.action)}" aria-label="I will" /></label>`;
  return `
    <div class="card practice-card">
      <div class="k">Today’s practice · ${esc(d.name)}</div>
      <p class="muted small" style="margin:6px 0 10px;">${lede}</p>
      <div class="practice-form">
        ${fields}
        <details class="practice-woop">
          <summary class="muted small">Plan for a snag (optional)</summary>
          <div class="practice-woop-body">
            <label class="practice-field"><span class="muted small">If</span>
              <input class="practice-obstacle" type="text" maxlength="70" placeholder="the thing most likely in my way" aria-label="If — the obstacle" /></label>
            <label class="practice-field"><span class="muted small">I’ll</span>
              <input class="practice-recovery" type="text" maxlength="70" placeholder="my recovery move" aria-label="Then I will — the recovery" /></label>
          </div>
        </details>
        <p class="practice-why muted small">${esc(practice.why)}</p>
        <button class="btn" id="practiceadopt" data-domain="${esc(focus)}">Make it today’s practice</button>
      </div>
    </div>`;
}

function wireTodaysPractice() {
  const chk = app.querySelector('[data-practicecheck]');
  if (chk) chk.onclick = () => {
    const id = chk.dataset.practicecheck;
    const g = (state.profile.goals || []).find((x) => x.id === id);
    const had = g && (g.checkins || []).includes(todayStr());
    state.profile = Profile.trackGoal(state.profile, id, todayStr());
    save(); render();
    announce(had ? 'Unmarked for today.' : 'Done today — that’s the rep.');
    const again = app.querySelector(`[data-practicecheck="${id}"]`); if (again) again.focus(); else focusViewHeading();
  };
  const adopt = document.getElementById('practiceadopt');
  if (adopt) adopt.onclick = () => {
    const focus = adopt.dataset.domain;
    const card = adopt.closest('.practice-card');
    if (!card) return;
    const val = (sel) => { const el = card.querySelector(sel); return el ? el.value.trim() : ''; };
    const action = val('.practice-action');
    if (!action) { const a = card.querySelector('.practice-action'); if (a && a.focus) a.focus(); return; }
    state.profile = Profile.addGoal(state.profile, focus, composeCommitment(val('.practice-cue'), action));
    const obstacle = val('.practice-obstacle');
    const recovery = val('.practice-recovery');
    if (obstacle && recovery) {
      const g = state.profile.goals[state.profile.goals.length - 1];
      if (g) state.profile = Profile.setCoping(state.profile, g.id, obstacle, recovery);
    }
    save(); render();
    announce('Set as today’s practice — it’s in your commitments.');
    const c = app.querySelector('[data-practicecheck]'); if (c) c.focus(); else focusViewHeading();
  };
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
      </div>
      <p class="muted small goaledit-hint" id="goaledit-hint-${esc(g.id)}" aria-live="polite" style="margin:2px 0 8px;"></p>`;
    }
    const checkins = Array.isArray(g.checkins) ? g.checkins : [];
    const done = checkins.includes(today);
    const n = checkins.length;
    const c = g.coping;
    return `<div class="goalitem">
      <div class="goalrow">
        <button class="goalcheck ${done ? 'on' : ''}" data-track="${esc(g.id)}" aria-pressed="${done}" aria-label="${done ? 'Kept today — tap to undo' : 'Mark kept today'}: “${esc(g.text)}”">${done ? uiIcon('check', 'goalcheckico') : ''}</button>
        <span class="ico" aria-hidden="true">${d ? d.icon : '•'}</span>
        <span class="goaltext">${esc(g.text)}${n ? ` <span class="goalkept muted small">· kept ${n}×</span>` : ''}</span>
        <button class="goalicon" data-edit="${esc(g.id)}" aria-label="Edit “${esc(g.text)}”">${uiIcon('pencil', 'miniico')}</button>
        <button class="goalicon" data-del="${esc(g.id)}" aria-label="Delete “${esc(g.text)}”">${uiIcon('trash', 'miniico')}</button>
      </div>
      <div class="goalcoping">
        ${c ? `<p class="copingread muted small">If ${esc(c.when)}, I’ll ${esc(c.then)}.</p>` : ''}
        <details class="coping">
          <summary class="muted small">${c ? 'Edit your hard-day plan' : 'Plan for a hard day (optional)'}</summary>
          <div class="coping-body">
            <label class="coping-field"><span class="muted small">What usually gets in the way?</span>
              <input id="coping-when-${esc(g.id)}" type="text" maxlength="120" value="${c ? esc(c.when) : ''}" placeholder="e.g. a packed afternoon, low energy after lunch…" aria-label="What usually gets in the way?" /></label>
            <label class="coping-field"><span class="muted small">If that happens, I’ll:</span>
              <input id="coping-then-${esc(g.id)}" type="text" maxlength="120" value="${c ? esc(c.then) : ''}" placeholder="e.g. do a 2-minute version instead" aria-label="If that happens, I will" /></label>
            <p class="muted small coping-help">Naming the recovery move ahead of time tends to help you get back on track — not because a hard day is a failure, just because the plan’s already made.</p>
            <div class="row coping-actions">
              <button class="btn sm" data-coping-save="${esc(g.id)}" style="width:auto;">Save plan</button>
              <button class="btn ghost sm" data-coping-skip="${esc(g.id)}" style="width:auto;">${c ? 'Cancel' : 'Skip'}</button>
            </div>
          </div>
        </details>
      </div>
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
          <p class="muted small" id="commit-hint" aria-live="polite" style="margin:6px 0 0;"></p>
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
  // These handlers re-render #app directly (not via go()), which destroys the
  // control the user just activated and drops keyboard/SR focus to <body> with no
  // feedback — on the daily-loop's busiest screen. So after each render() we announce
  // the outcome and RESTORE focus to a stable surviving element (the rebuilt control,
  // or the view heading as a fallback).
  const refocus = (sel) => { const el = sel && app.querySelector(sel); if (el) el.focus(); else focusViewHeading(); };
  // Track (recurring): toggle today's check-in; the commitment stays.
  app.querySelectorAll('[data-track]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.track;
      const g = (state.profile.goals || []).find((x) => x.id === id);
      const wasDone = g && (g.checkins || []).includes(todayStr());
      state.profile = Profile.trackGoal(state.profile, id, todayStr());
      save(); render();
      announce(wasDone ? 'Unmarked for today.' : 'Kept today.');
      refocus(`[data-track="${id}"]`);
    };
  });
  // Edit (pencil): enter inline edit mode for that row, focus straight into the input.
  app.querySelectorAll('[data-edit]').forEach((b) => {
    b.onclick = () => { state._editGoal = b.dataset.edit; render(); refocus('#goaledit-' + b.dataset.edit); };
  });
  app.querySelectorAll('[data-goalcancel]').forEach((b) => {
    b.onclick = () => { const id = state._editGoal; state._editGoal = null; render(); refocus(`[data-edit="${id}"]`); };
  });
  app.querySelectorAll('[data-goalsave]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.goalsave;
      const el = document.getElementById('goaledit-' + id);
      state.profile = Profile.editGoal(state.profile, id, el ? el.value : '');
      state._editGoal = null;
      save(); render();
      announce('Commitment saved.');
      refocus(`[data-edit="${id}"]`);
    };
  });
  // Delete (trash).
  app.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = () => {
      if (state._editGoal === b.dataset.del) state._editGoal = null;
      state.profile = Profile.removeGoal(state.profile, b.dataset.del);
      save(); render();
      announce('Commitment deleted.');
      focusViewHeading(); // the row is gone — return to a stable place in context
    };
  });
  // Coping plan (the opt-in "plan for a hard day"): save sets an if-then recovery plan on the
  // commitment; skip/cancel just closes the panel. NEVER triggered by a miss — only this tap.
  app.querySelectorAll('[data-coping-save]').forEach((b) => {
    b.onclick = () => {
      const id = b.dataset.copingSave;
      const w = (document.getElementById('coping-when-' + id) || {}).value || '';
      const t = (document.getElementById('coping-then-' + id) || {}).value || '';
      const kept = w.trim() && t.trim();
      state.profile = Profile.setCoping(state.profile, id, w, t);
      save(); render();
      announce(kept ? 'Hard-day plan saved.' : 'Hard-day plan cleared.');
      refocus(`[data-track="${id}"]`); // the panel re-collapses on render; return to a stable, visible control
    };
  });
  app.querySelectorAll('[data-coping-skip]').forEach((b) => {
    b.onclick = () => { const det = b.closest('details'); if (det) det.open = false; };
  });
  // Gentle, on-device "is this what you mean?" nudge — DISPLAY ONLY (never blocks the
  // save, never touches state, no network). Debounced so it doesn't flicker per key.
  const wireHint = (input, hint) => {
    if (!input || !hint) return;
    let t;
    const upd = () => { hint.textContent = Coach.sharpenCommitment(input.value) || ''; };
    input.addEventListener('input', () => { clearTimeout(t); t = setTimeout(upd, 400); });
    upd(); // initial (e.g. when editing an existing commitment)
  };
  wireHint(document.getElementById('goaltext'), document.getElementById('commit-hint'));
  app.querySelectorAll('.goaledit-input').forEach((inp) => {
    wireHint(inp, document.getElementById('goaledit-hint-' + inp.id.replace('goaledit-', '')));
  });
}

// Make every [data-domain] row open the capacity's detail view — TEACH (why it matters +
// how to grow it) and DIRECT (Train it now), rather than jumping straight into a session.
function wireDomainLinks() {
  app.querySelectorAll('[data-domain]').forEach((el) => {
    const fire = () => { state.focusDomainFrom = state.route; state.focusDomain = el.dataset.domain; go('domain'); };
    el.onclick = fire;
    el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } };
  });
}

// Capacity detail — the TEACH/DIRECT screen for one domain: where you stand, why it
// matters (the atrophy frame), how to grow it in daily life, and a Train-it-now CTA.
// A single DIRECTIVE next-step for this capacity, personalized to the person's own data
// (not generic). Growth-framed: a dip is "worth returning to", never a deficit. Honest:
// built only from their measured scores; points to the habits below + the Train CTA.
function nextStepFor(score, t, commits = []) {
  if (score == null) return 'Train it to see where you stand — then we’ll know where to grow.';
  const n = (t.points && t.points.length) || 0;
  const committed = commits.length > 0;
  const ref = !committed ? '' : (commits.length === 1 ? `“${commits[0]}”` : `${commits.length} habits`);
  // COMMITMENT-AWARE directive: if the person is already building this capacity in real life, the
  // next step is to keep that going (and weigh it in the weekly review) — not to "pick one below"
  // as if they hadn't. Honesty (forma-validity v245): hedge the CAUSE, not just the score — a
  // commitment/habit must NEVER sit next to a score change as the only un-hedged candidate cause
  // (post-hoc-ergo-propter-hoc by adjacency). Judgment is routed to the weekly review, where the
  // "a commitment is never proven to cause a change" framing already lives. The task-familiarity
  // hedge on any "up" branch is non-negotiable (domainTrend can't separate recall from growth).
  if (committed) {
    if (n >= 3 && t.direction === 'up') return `You’re already building this — ${ref}. Separately, your scores have trended up (+${t.delta}) — could be real growth, could be task-familiarity; one habit can’t be credited for it. Keep it because it’s worth keeping, and weigh the whole picture in your weekly review.`;
    if (t.direction === 'down') return `You’re already building this — ${ref}. It’s dipped lately — not a verdict, and not a sign the habit failed; scores move for many reasons. This is a good moment to keep it and weigh it in your weekly review.`;
    return `You’re already building this — ${ref}. Keep checking it off because it’s worth doing — not to chase the number; whether the score moves has many causes. You’ll weigh it in your weekly review.`;
  }
  if (n < 2) return 'You’ve measured it once. Practice it again to start a trajectory you can watch.';
  if (n >= 3 && t.direction === 'up') return `Your scores have trended up since you began (+${t.delta}) — that can be real growth or growing task-familiarity; there’s no way to credit a single cause. If you want to build deliberately here, pick one habit below to commit to.`;
  if (t.direction === 'down') return 'It’s dipped lately — worth returning to, not a verdict. Choose one habit below and commit to it this week.';
  return 'Holding steady. One small habit below, kept consistently, is a deliberate way to work on this — pick one to commit to.';
}

function renderDomainDetail() {
  const id = state.focusDomain;
  const d = getDomain(id);
  if (!d) { state.route = 'progress'; return renderProgress(); }
  const p = state.profile;
  const score = p.domainScores ? p.domainScores[id] : null;
  const band = score != null ? bandFor(score) : null;
  const basis = basisFor(id);
  // Return to wherever the person opened this from (Home or Progress) — not always Progress.
  const from = state.focusDomainFrom === 'home' ? 'home' : 'progress';
  const fromLabel = from === 'home' ? 'Home' : 'Progress';
  // Honest per-capacity trajectory: the person's OWN measured scores over time (not a
  // validated trait line). Only shown once there are ≥2 points; framed "never a verdict".
  const t = domainTrend(p.history || [], id);
  // Open commitments the person already set FOR this capacity — makes the next-step directive
  // acknowledge what they're building, rather than telling them to "pick one" as if they hadn't.
  const myCommits = (p.goals || []).filter((g) => g && !g.done && g.domain === id).map((g) => g.text);
  const traj = (score != null && t.points && t.points.length >= 2) ? `
      <div class="card">
        <div class="eyebrow">Your trajectory</div>
        <svg viewBox="0 0 320 52" width="100%" style="margin-top:8px; max-width:440px;" role="img" aria-label="Your ${esc(d.name)} scores over time">
          <path d="${sparklinePath(t.points, 320, 52, 6)}" fill="none" stroke="${band.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted small" style="margin:6px 0 0;">${t.points.length} measurements${t.direction !== 'flat' ? ` · ${t.delta > 0 ? '+' : ''}${t.delta} since you began` : ''} — your own scores over time, measured over weeks. Never a verdict; consistency can also reflect growing task-familiarity.</p>
      </div>` : '';
  // TRAIN-side connector: for the two reflective capacities whose ACT guided practice maps
  // cleanly, offer that existing deliberate practice right from the capacity — distinct from
  // "Train it now" (the measure). The guided practice is UNSCORED (scoreExercise→null for
  // 'guided'), so it can never move this scale. forma-validity vetted the mapping + framing
  // (v240): only emotion_regulation + values (no adjacent objective score to misread), an
  // explicit moduleId so a capacity-labeled button always opens its matching module, and the
  // "unscored, never part of your measure" clause so it never reads as score-moving.
  const GUIDED_FOR_DOMAIN = {
    emotion_regulation: { module: 'acceptance', caption: 'A short, breath-guided practice for working <em>with</em> a hard feeling — making room for it rather than fighting it. A way to practice this in the moment. Optional, unscored, and never part of your measure.' },
    values: { module: 'values', caption: 'A short, breath-guided practice for reconnecting with what you want to stand for — ending in one small step. A way to practice this in the moment. Optional, unscored, and never part of your measure.' },
    interior: { module: 'examen', caption: 'The Daily Examen — a short, prayerful look back over your day, in the Ignatian tradition (with Brother Lawrence’s awareness of presence). Private to you, unscored, and never part of your measure.' },
  };
  const guidedOpt = GUIDED_FOR_DOMAIN[id];
  const practiceCard = guidedOpt ? `
      <div class="card">
        <div class="eyebrow">Practice it now</div>
        <p class="muted small" style="margin:6px 0 10px; line-height:1.5;">${guidedOpt.caption}</p>
        <button class="btn ghost" id="guidedpractice">Try a guided practice →</button>
      </div>` : '';
  // Spiritual Life only: a private, non-scored reflective lens (a mirror, not a grade).
  const lensEntry = id === 'interior' ? `
      <div class="card">
        <div class="eyebrow">Where you are</div>
        <p class="muted small" style="margin:6px 0 10px; line-height:1.5;">A private, unranked reflection on your faith across belief, practice, and belonging — a mirror, not a grade. Forma doesn’t stage your soul.</p>
        <button class="btn ghost" id="tolens">Reflect: where you are →</button>
      </div>` : '';
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Capacity', d.name, d.short, `<button class="btn ghost sm" id="back" style="width:auto;">← ${fromLabel}</button>`)}

      <div class="card index-hero">
        ${score != null
          ? `${indexRing(score, { label: d.name, numId: 'domainidx', start: 0 })}<div class="index-label">${esc(band.label)}</div>`
          : '<p class="muted" style="margin:8px 0;">Not measured yet — train it to see where you stand.</p>'}
      </div>

      ${traj}

      ${id === 'interior' ? practiceCard + lensEntry : ''}

      <div class="card" style="border-left:4px solid ${band ? band.color : 'var(--accent)'};">
        <div class="eyebrow">Your next step</div>
        <p style="margin:6px 0 0; line-height:1.5;">${esc(nextStepFor(score, t, myCommits))}</p>
        ${growthCard(id, { hideName: true, nested: true })}
      </div>

      <details class="card disclosure">
        <summary class="eyebrow">About this capacity</summary>
        <p style="margin:8px 0 0; line-height:1.55;">${esc(d.blurb)}</p>
        <p style="margin:10px 0 0; line-height:1.55;"><strong>Why it matters now.</strong> ${esc(d.aiRationale)}</p>
      </details>

      ${basis ? `<details class="card disclosure">
        <summary class="eyebrow">How Forma measures it</summary>
        <p class="muted small" style="margin:8px 0 0;">${esc(basis.detail)}</p></details>` : ''}

      ${id === 'interior' ? '' : practiceCard}

      ${id === 'interior' ? '' : `<button class="btn ghost" id="tocoachdomain" style="margin-bottom:10px;">Talk about your ${esc(d.name.toLowerCase())} with the coach →</button>`}
      <button class="btn amber" id="train">Train it now →</button>
      <p class="muted small center" style="margin-top:10px;">A few minutes. Formation, measured over weeks — never a verdict.</p>
    </div>`;
  document.getElementById('back').onclick = () => go(from);
  document.getElementById('train').onclick = () => startDomainSession(id);
  if (score != null) countUp(document.getElementById('domainidx'), score, 800); // ring already draws via render()'s drawRing()
  const tcd = document.getElementById('tocoachdomain');
  if (tcd) tcd.onclick = () => { state.coachThread = id; go('coach'); };
  const gp = document.getElementById('guidedpractice');
  if (gp && guidedOpt) gp.onclick = () => startGuidedSession(guidedOpt.module);
  const tl = document.getElementById('tolens');
  if (tl) tl.onclick = () => go('lens');
  wireGrowthCommit();
}

// Begin the Likert quick check (baseline) from anywhere — used by the first-time Today/Progress
// invitations below. Mirrors the welcome screen's #start handler (onboard.step → 1), but first
// returns the route to home so render() reaches renderOnboarding (session/progress have their own
// first-time intros and would otherwise re-render the intro instead of the check).
function startQuickCheck() {
  state.route = 'home';
  state.onboard.step = 1;
  render();
}

// First-time "Today" tab. A brand-new visitor hasn't done the quick check, so the daily session
// can't run yet — but Today shouldn't just echo the welcome screen. Give it its own door: this is
// where the daily practice lives, and it opens with the quick check.
function renderTodayIntro() {
  const mins = Math.max(3, Math.round(BASELINE_ITEMS.length * 7 / 60));
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Today', 'Your daily practice', 'A few focused minutes a day — the rep that builds what AI can’t keep for you.')}
      <div class="card" style="border-left:4px solid var(--accent);">
        <p style="margin:0 0 10px; line-height:1.55;">This is where your day in Forma happens: one short, guided practice, chosen for where you are. It hasn’t started yet — Forma first needs a sense of your starting point.</p>
        <p class="muted small" style="margin:0;">That’s the quick check — a few honest self-ratings across the capacities. No right answers, never a diagnosis; just a baseline so you can watch yourself move.</p>
      </div>
      <button class="btn amber" id="beginqc">Start the quick check · ~${mins} min →</button>
      <button class="btn ghost" id="trytool" style="margin-top:10px;">Or just try a practice now →</button>
      <p class="muted small center" style="margin-top:10px;">Explore freely first — the quick check is what unlocks your daily session.</p>
    </div>`;
  document.getElementById('beginqc').onclick = startQuickCheck;
  document.getElementById('trytool').onclick = () => go('tools');
}

// First-time "Progress" tab. No baseline yet → no trajectory to chart. Rather than repeat Home,
// show WHAT can be tracked (the capacities) as a tappable preview, and point to the quick check
// that starts the measuring. (Sean: invite them to "a skill to track.")
function renderProgressIntro() {
  const ids = activeDomainIds(state.onboard.faithTrack);
  const rows = ids.map((id) => {
    const d = getDomain(id);
    if (!d) return '';
    return `
      <div class="domain-row tappable" data-domain="${id}" role="button" tabindex="0" aria-label="${esc(d.name)} — what it is and how to grow it">
        <span class="ico">${d.icon}</span>
        <div class="meta">
          <div class="dn">${esc(d.name)}</div>
          <div class="muted small">${esc(d.short)}</div>
        </div>
        <span class="chev" aria-hidden="true">›</span>
      </div>`;
  }).join('');
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Progress', 'What you’ll track', 'Over weeks this becomes the picture of how you’re changing — capacity by capacity.')}
      <div class="card" style="border-left:4px solid var(--accent);">
        <p style="margin:0 0 6px; line-height:1.55;">There’s nothing to chart yet — your trajectory starts the moment you do. These are the capacities Forma can help you track. Tap one to see what it is and why it matters.</p>
        <p class="muted small" style="margin:0;">Pick the one that pulls at you, or start with the quick check and let Forma find your edge.</p>
      </div>
      <div class="card" style="padding:6px;">${rows}</div>
      <button class="btn amber" id="beginqc">Start the quick check →</button>
      <p class="muted small center" style="margin-top:10px;">The quick check sets your baseline — then every session moves these scales.</p>
    </div>`;
  document.getElementById('beginqc').onclick = startQuickCheck;
  wireDomainLinks();
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
        <span class="streakchip ${alive ? '' : neverStarted ? 'fresh' : 'cold'}" style="margin:0;">${uiIcon(alive ? 'flame' : neverStarted ? 'spark' : 'ember', 'chipico')} ${neverStarted ? 'Day 1 awaits' : (p.streak.current || 0)}</span></div>

      ${doneToday ? `
        <div class="card" style="text-align:center;">
          <div style="color:var(--green);">${uiIcon('check', 'bigcheck')}</div>
          <h2 style="font-size:1.1rem; margin-top:6px;">Today's session is done</h2>
          <p class="muted small">Formation compounds in the returning, not the cramming. Come back tomorrow.</p>
        </div>
        ${last ? `<div class="card"><div class="insight ${last.live ? 'live' : ''}" style="border:none;padding:0;">
          <div class="k">Today's insight</div><div style="margin-top:6px; white-space:pre-wrap;">${esc(last.text)}</div></div></div>` : ''}
        <button class="btn ghost" id="begin">Do another session →</button>
      ` : `
        <div class="card">
          <div class="k">Today's focus</div>
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
    case 'reliance': return renderReliance();
    case 'stem': return renderDecision();
    case 'comm': return renderDecision();
    case 'attend': return renderDecision();
    case 'steu': return renderDecision();
    case 'matrix': return renderMatrix();
    case 'series': return renderSeries();
    case 'crt': return renderCRT();
    case 'nback': return renderNBack();
    case 'stream': return renderStream();
    case 'vigilance': return renderVigilance();
    case 'flanker': return renderFlanker();
    case 'span': return renderSpan();
    case 'meaning': return renderMeaning();
    case 'mathfluency': return renderMathFluency();
    case 'maze': return renderMaze();
    case 'pursuit': return renderPursuit();
    case 'vignette': return renderVignette();
    case 'sentence': return renderSentence();
    case 'stay': return renderStay();
    case 'contemplation': return renderContemplation();
    case 'guided': return renderGuided();
    case 'reflection': return renderReflection();
  }
}

function sessionHeader(ex) {
  const d = getDomain(ex.domain);
  const typeLabel = { reading: 'Deep Reading', memory: 'Working Memory', decision: 'Judgment', tradeoff: 'Agency', reliance: 'Agency', matrix: 'Reasoning', series: 'Reasoning', crt: 'Reflection Test', nback: 'Working Memory', span: 'Working Memory', mathfluency: 'Working Memory', digitspan: 'Working Memory', maze: 'Deep Reading', stream: 'Sustained Attention', vigilance: 'Live Attention', pursuit: 'Sustained Attention', flanker: 'Executive Attention', vignette: 'Communication', sentence: 'Self-Knowledge', meaning: 'Purpose', stay: 'Frustration Tolerance', contemplation: 'Spiritual Life', guided: 'Guided Practice', stem: 'Emotion Management', steu: 'Emotional Understanding', comm: 'Communication', attend: 'Relational Presence', reflection: 'Reflection' }[ex.type] || ex.type;
  const mode = exerciseMode(ex.type);
  const modeTitle = mode === 'practice'
    ? 'A practice — a formation rep, not graded right or wrong.'
    : 'A measure — it scores this capacity.';
  return `<div class="exercise-head"><span class="tagchip">${esc(typeLabel)}</span>
    <span class="modechip ${mode}" title="${esc(modeTitle)}">${mode === 'practice' ? 'Practice' : 'Measure'}</span>
    <span class="muted small">${d.icon} ${esc(d.name)}</span></div>
    <h2>${esc(ex.title)}</h2>
    <p class="muted small" style="margin:2px 0 10px;">${mode === 'practice' ? 'Building' : 'Measuring'} <strong>${esc(d.name)}</strong>${d.short ? ` — ${esc(d.short.toLowerCase())}` : ''}.</p>`;
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

// Agency — the behavioral appropriate-reliance task. For each problem: commit your
// OWN answer, then an AI assistant weighs in (sometimes right, sometimes confidently
// wrong), and you commit a final answer. Measures whether you stay the author —
// taking good help, holding your ground against bad help (scoreReliance).
function renderReliance() {
  const s = state.session;
  const ex = s.exercise;
  const trials = ex.trials || [];

  if (s.phase === 'reliance-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card"><p style="margin:0; line-height:1.55;">${esc(ex.intro)}</p></div>
        <button class="btn amber" id="begin">Begin →</button>
      </div>`;
    document.getElementById('begin').onclick = () => {
      s.response = s.response || {};
      s.response.trials = trials.map(() => ({ initial: null, final: null }));
      s.phase = 'reliance-run'; s.rIdx = 0; s.rStage = 'initial';
      render();
    };
    return;
  }

  if (s.phase === 'reliance-review') {
    // One teaching screen: per problem, was the assistant right or wrong, what did you
    // do, and the one-line why. This is where the agency lesson lands.
    const rows = trials.map((t, i) => {
      const r = s.response.trials[i] || {};
      const finalCorrect = r.final === t.answer;
      const overRel = !finalCorrect && t.ai && t.ai.correct === false && r.final === t.ai.suggestId;
      const aiLabel = t.ai && t.ai.correct ? 'The assistant was right' : 'The assistant was wrong';
      const verdict = finalCorrect
        ? (t.ai && !t.ai.correct ? 'You held your own — good.' : 'You landed it.')
        : (overRel ? 'You went with the assistant, and it was off.' : 'Not quite.');
      const cls = finalCorrect ? 'correct' : 'wrong';
      return `<div class="opt ${cls}" style="cursor:default; text-align:left;">
        <div style="font-weight:600;">${esc(t.prompt)}</div>
        <div class="muted small" style="margin-top:4px;">${esc(aiLabel)} · ${esc(verdict)}</div>
        <div class="rationale">${esc(t.explain)}</div></div>`;
    }).join('');
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <p class="likert-q" style="font-size:1.05rem;">How the reliance went</p>
        <div class="likert-opts">${rows}</div>
        <button class="btn" id="fin" style="margin-top:16px;">Continue →</button>
      </div>`;
    document.getElementById('fin').onclick = completeSession;
    return;
  }

  // run phase — one problem, two stages: 'initial' (your answer) then 'ai' (decide)
  const i = s.rIdx;
  const t = trials[i];
  const r = s.response.trials[i];
  const stage = s.rStage;
  const chosen = stage === 'initial' ? r.initial : r.final;
  const aiOpt = t.options.find((o) => o.id === t.ai.suggestId);
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">Problem ${i + 1} of ${trials.length}${stage === 'ai' ? ' · the assistant has weighed in' : ''}</p>
      <p class="likert-q" style="font-size:1.05rem;">${esc(t.prompt)}</p>
      ${stage === 'ai' ? `<div class="ai-suggest"><span class="ai-badge">AI assistant</span> suggests <strong>${esc(aiOpt ? aiOpt.text : '')}</strong></div>` : ''}
      <div class="likert-opts">
        ${t.options.map((o) => {
          const sel = o.id === chosen;
          const isAi = stage === 'ai' && o.id === t.ai.suggestId;
          return `<button class="opt ${sel ? 'selected' : ''}${isAi ? ' ai-pick' : ''}" data-id="${o.id}" aria-pressed="${sel}">${esc(o.text)}</button>`;
        }).join('')}
      </div>
      <button class="btn" id="lock" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">${stage === 'initial' ? 'Lock in my answer' : 'Lock in my final answer'}</button>
      <p class="muted small center" style="margin-top:8px;">${stage === 'initial' ? 'Commit your own answer first — the assistant weighs in after.' : 'Keep your answer or change it. Your call.'}</p>
    </div>`;
  app.querySelectorAll('.opt').forEach((b) => b.onclick = () => {
    if (stage === 'initial') r.initial = b.dataset.id; else r.final = b.dataset.id;
    render();
  });
  document.getElementById('lock').onclick = () => {
    if (stage === 'initial') {
      if (r.final == null) r.final = r.initial; // pre-fill final with your own answer, so "keep it" needs no re-tap
      s.rStage = 'ai';
    } else if (i < trials.length - 1) {
      s.rIdx = i + 1; s.rStage = 'initial';
    } else {
      s.phase = 'reliance-review';
    }
    render();
  };
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

// Flanker (executive attention / inhibitory control). Respond to the MIDDLE arrow's direction while
// flankers pull with or against it. Practice (gated ~6/8) → 64 scored trials. RT via performance.now();
// scoreFlanker uses the NIH accuracy+speed score (the conflict cost is informational only). The count
// is never shown mid-stimulus; built once, the loop drives the DOM so re-renders can't restart it.
function renderFlanker() {
  const s = state.session;
  const ex = s.exercise;
  const ARROW = { L: '◀', R: '▶' };
  const rowFor = (t) => {
    const c = ARROW[t.dir];
    const f = ARROW[t.congruent ? t.dir : (t.dir === 'L' ? 'R' : 'L')];
    return `${f} ${f} ${c} ${f} ${f}`;
  };

  if (s.phase === 'flanker-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>A row of arrows will flash. Tap <strong>the direction the MIDDLE arrow points</strong> — ignore the ones around it. Be as fast as you can <em>while staying accurate</em>.</p>
          <p class="muted small">A short practice first, then the real run. This is the flanker task (executive attention / resisting distraction) — one slice of focus, not your whole “attention span.”</p>
        </div>
        <button class="btn amber" id="begin">Start practice</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.phase = 'flanker-practice'; s.practice = []; s.fi = 0; s._started = false; s._practiceReplayed = s._practiceReplayed || false; render(); };
    return;
  }

  const practice = s.phase === 'flanker-practice';
  const trials = practice ? ex.practice : ex.trials;
  app.innerHTML = `
    <div class="fade-in center">
      <p class="muted small" id="fcount">${practice ? 'Practice' : 'Trial 1 of ' + ex.trials.length}</p>
      <div id="fstage" tabindex="0" role="group" aria-label="Tap the direction the middle arrow points — or press the left or right arrow key" style="position:relative; height:200px; display:flex; align-items:center; justify-content:center; user-select:none; outline:none;">
        <div id="ffix" style="color:var(--ink-faint); font-size:2rem;">+</div>
        <div id="farrows" style="display:none; font-size:3rem; letter-spacing:.18em; color:var(--ink);"></div>
        <div id="ffeed" style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); font-size:1rem;"></div>
      </div>
      <div class="row" style="gap:10px;">
        <button class="btn" id="fL" aria-label="Middle arrow points left" style="font-size:1.6rem; padding:18px 0;">◀</button>
        <button class="btn" id="fR" aria-label="Middle arrow points right" style="font-size:1.6rem; padding:18px 0;">▶</button>
      </div>
      <p class="muted small" style="margin-top:8px;">Tap the side the MIDDLE arrow points — or use ← →.</p>
    </div>`;
  const fix = document.getElementById('ffix');
  const arrows = document.getElementById('farrows');
  const feed = document.getElementById('ffeed');
  const count = document.getElementById('fcount');
  const stage = document.getElementById('fstage');
  const aborted = () => state.session !== s || state.route !== 'session';
  const clearT = () => { if (s._timer) { clearTimeout(s._timer); s._timer = null; } };
  const sink = practice ? s.practice : (s.response.trials = s.response.trials || []);

  const finishPhase = () => {
    clearT();
    if (practice) {
      const correct = s.practice.filter((t) => t.correct).length;
      if (correct < 6 && !s._practiceReplayed) { s._practiceReplayed = true; s.practice = []; s.fi = 0; s._started = false; render(); return; }
      s.phase = 'flanker-run'; s.response.trials = []; s.fi = 0; s._started = false; render(); return;
    }
    completeSession();
  };

  const nextTrial = () => {
    if (aborted()) { clearT(); return; }
    if (s.fi >= trials.length) { finishPhase(); return; }
    const t = trials[s.fi];
    if (!practice) count.textContent = `Trial ${s.fi + 1} of ${trials.length}`;
    s.awaiting = false;
    feed.textContent = '';
    arrows.style.display = 'none';
    fix.style.display = 'block';
    s._timer = setTimeout(() => {
      if (aborted()) { clearT(); return; }
      fix.style.display = 'none';
      arrows.textContent = rowFor(t);
      arrows.style.display = 'block';
      s.shownAt = performance.now();
      s.awaiting = true;
      s._timer = setTimeout(() => { // no response in 2s → miss
        if (aborted() || !s.awaiting) { return; }
        s.awaiting = false;
        sink.push({ congruent: t.congruent, correct: false, rt: null });
        s.fi++; arrows.style.display = 'none'; nextTrial();
      }, 2000);
    }, t.iti);
  };

  const respond = (side) => {
    if (!s.awaiting) return;
    clearT();
    s.awaiting = false;
    const t = trials[s.fi];
    const rt = performance.now() - s.shownAt;
    const correct = side === t.dir;
    sink.push({ congruent: t.congruent, correct, rt });
    s.fi++;
    arrows.style.display = 'none';
    if (practice) { feed.textContent = correct ? '✓' : '✗'; feed.style.color = correct ? 'var(--green)' : 'var(--red)'; }
    s._timer = setTimeout(() => { if (!aborted()) nextTrial(); }, practice ? 500 : 250);
  };

  document.getElementById('fL').onclick = () => respond('L');
  document.getElementById('fR').onclick = () => respond('R');
  stage.onkeydown = (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); respond('L'); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); respond('R'); }
  };
  stage.focus();
  if (!s._started) { s._started = true; nextTrial(); }
}

// Symmetry Span (working-memory capacity). A sub-phase machine: for each set, alternate a symmetry
// judgment (8×8, Yes/No, 6s cap) with a flashed red cell in a 4×4 grid; after the set, recall the cells
// in order by tapping. Per-set { sequence, recalled, symAcc } feeds scoreSpan (PCU + the 85% gate).
function renderSpan() {
  const s = state.session;
  const ex = s.exercise;
  const aborted = () => state.session !== s || state.route !== 'session';
  const clearT = () => { if (s._timer) { clearTimeout(s._timer); s._timer = null; } };

  if (s.phase === 'span-intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <p>Two things at once. First, decide if a pattern is <strong>symmetric</strong> — a mirror image, left to right — and tap Yes or No, quickly. Then a <strong>red square</strong> flashes in a grid: remember <em>where</em>, and in what order.</p>
          <p class="muted small">After a few of each, you’ll tap the squares back in order. Answer the symmetry honestly and fast — dawdling there to rehearse defeats the measure. This is the Symmetry Span, a standard working-memory test.</p>
        </div>
        <button class="btn amber" id="begin">Begin</button>
      </div>`;
    document.getElementById('begin').onclick = () => { s.response.sets = []; s.span = { setIdx: 0, itemIdx: 0, sub: 'sym', symCorrect: 0, recalled: [] }; render(); };
    return;
  }

  const sp = s.span;
  const set = ex.sets[sp.setIdx];
  const item = set.items[sp.itemIdx];
  const grid8 = (g) => `<div style="display:grid; grid-template-columns:repeat(8,1fr); gap:2px; width:208px; margin:10px auto;">${g.map((v) => `<div style="aspect-ratio:1; background:${v ? 'var(--ink)' : 'var(--line)'}; border-radius:2px;"></div>`).join('')}</div>`;
  const grid4 = (opts) => {
    const cells = [];
    for (let i = 0; i < 16; i++) {
      const hl = opts.highlight === i;
      const pos = opts.tapped ? opts.tapped.indexOf(i) : -1;
      const bg = hl ? 'var(--red)' : (pos >= 0 ? 'var(--accent-soft)' : 'var(--card)');
      const num = (opts.tapped && pos >= 0) ? (pos + 1) : '';
      const tap = opts.tappable ? `data-cell="${i}" role="button" tabindex="0" aria-label="Grid cell ${i + 1}"` : '';
      cells.push(`<div ${tap} style="aspect-ratio:1; background:${bg}; border:1px solid var(--line); border-radius:6px; display:flex; align-items:center; justify-content:center; font-weight:600; ${opts.tappable ? 'cursor:pointer;' : ''}">${num}</div>`);
    }
    return `<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:8px; width:236px; margin:10px auto;">${cells.join('')}</div>`;
  };

  if (sp.sub === 'sym') {
    app.innerHTML = `
      <div class="fade-in center">
        <p class="muted small">Set ${sp.setIdx + 1} of ${ex.sets.length} · is this pattern symmetric?</p>
        ${grid8(item.grid)}
        <div class="row" style="gap:10px; margin-top:14px;">
          <button class="btn" id="symY" style="font-size:1.05rem;">Symmetric</button>
          <button class="btn ghost" id="symN" style="font-size:1.05rem;">Not symmetric</button>
        </div>
      </div>`;
    const answer = (yes) => { clearT(); if (yes === item.symmetric) sp.symCorrect++; sp.sub = 'cell'; render(); };
    document.getElementById('symY').onclick = () => answer(true);
    document.getElementById('symN').onclick = () => answer(false);
    s._timer = setTimeout(() => { if (aborted()) { clearT(); return; } sp.sub = 'cell'; render(); }, ex.symTimeCapMs || 6000); // timeout = processing miss
    return;
  }

  if (sp.sub === 'cell') {
    app.innerHTML = `<div class="fade-in center"><p class="muted small">Remember this square…</p>${grid4({ highlight: item.cell })}</div>`;
    s._timer = setTimeout(() => {
      if (aborted()) { clearT(); return; }
      sp.itemIdx++;
      sp.sub = sp.itemIdx < set.setSize ? 'sym' : 'recall';
      render();
    }, 900);
    return;
  }

  // recall
  const finalizeSet = () => {
    s.response.sets.push({ sequence: set.sequence, recalled: sp.recalled.slice(), symAcc: set.setSize ? sp.symCorrect / set.setSize : 0 });
    sp.setIdx++; sp.itemIdx = 0; sp.symCorrect = 0; sp.recalled = [];
    if (sp.setIdx >= ex.sets.length) completeSession(); else { sp.sub = 'sym'; render(); }
  };
  app.innerHTML = `
    <div class="fade-in center">
      <p class="muted small">Tap the squares in the order they appeared — ${sp.recalled.length} of ${set.setSize}.</p>
      ${grid4({ tappable: true, tapped: sp.recalled })}
      <button class="btn ghost sm" id="blank" style="width:auto; margin-top:6px;">I don’t remember this one</button>
    </div>`;
  const add = (cell) => { if (sp.recalled.length >= set.setSize) return; sp.recalled.push(cell); if (sp.recalled.length >= set.setSize) finalizeSet(); else render(); };
  app.querySelectorAll('[data-cell]').forEach((b) => { b.onclick = () => add(Number(b.dataset.cell)); b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(Number(b.dataset.cell)); } }; });
  document.getElementById('blank').onclick = () => add(null);
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
      <p class="muted small">${esc(ex.instructions)}</p>
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

// Meaning in Life (MLQ Presence subscale) — a 5-item self-report on a 7-point scale. Self-report, not
// a performance score; the private Purpose track, never shown to employers. Single-screen questionnaire.
function renderMeaning() {
  const s = state.session;
  const ex = s.exercise;
  if (!s.response.ratings) s.response.ratings = new Array(ex.items.length).fill(null);
  const r = s.response.ratings;
  const done = r.every((v) => v != null);
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">How true is each statement for you, right now? There’s no right answer — this is your own honest read.</p>
      ${ex.items.map((it, i) => `
        <div class="card" style="margin-bottom:10px;">
          <p style="margin:0 0 8px;">${esc(it.text)}</p>
          <div class="row" style="gap:6px; flex-wrap:wrap;">
            ${[1, 2, 3, 4, 5, 6, 7].map((v) => `<button class="chip${r[i] === v ? ' sel' : ''}" data-i="${i}" data-v="${v}" aria-pressed="${r[i] === v}" aria-label="${esc(ex.anchors[v - 1])}" style="min-width:36px;">${v}</button>`).join('')}
          </div>
          <div class="row" style="justify-content:space-between; margin-top:4px;"><span class="muted small">1 · ${esc(ex.anchors[0])}</span><span class="muted small">7 · ${esc(ex.anchors[6])}</span></div>
        </div>`).join('')}
      <p class="muted small">${esc(ex.instrument)}. A self-report reading, not a performance score — your private Purpose track, never shown to employers. Seeking meaning is a normal part of growth, never a deficit.</p>
      <button class="btn" id="fin" ${done ? '' : 'disabled'}>Done →</button>
    </div>`;
  app.querySelectorAll('.chip[data-i]').forEach((b) => { b.onclick = () => { r[Number(b.dataset.i)] = Number(b.dataset.v); render(); }; });
  document.getElementById('fin').onclick = () => { if (r.every((v) => v != null)) completeSession(); };
}

// Letter-Number Series (fluid reasoning). A simple "what comes next" MC item; mirrors the matrix
// reveal flow. The series is generated, so the answer index is computed and the rule is shown on reveal.
function renderSeries() {
  const s = state.session;
  const ex = s.exercise;
  const chosen = s.response.optionId;
  const revealed = s.revealed;
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">What comes next in the series?</p>
      <div class="card" style="text-align:center; font-family:var(--font-num); font-size:1.7rem; letter-spacing:.08em;">
        ${ex.terms.map((t) => esc(String(t))).join('&nbsp;&nbsp;')}&nbsp;&nbsp;<span style="color:var(--ink-faint);">?</span>
      </div>
      <p class="muted small" style="margin-top:8px;">Choose:</p>
      <div class="row" style="flex-wrap:wrap; gap:8px;">
        ${ex.options.map((o, i) => {
          let cls = 'opt';
          if (revealed) { if (i === ex.answer) cls += ' correct'; else if (i === chosen) cls += ' wrong'; }
          else if (i === chosen) cls += ' selected';
          const mark = revealed ? (i === ex.answer ? revealMark('correct') : (i === chosen ? revealMark('wrong') : '')) : '';
          const lbl = revealed && i === ex.answer ? ', correct answer' : (revealed && i === chosen ? ', your answer, not correct' : '');
          return `<button class="${cls}" data-i="${i}" aria-pressed="${!revealed && i === chosen}" aria-label="Option ${esc(String(o))}${lbl}" ${revealed ? 'disabled' : ''} style="flex:0 0 auto; min-width:66px; text-align:center; font-family:var(--font-num); font-size:1.2rem;">${esc(String(o))}${mark}</button>`;
        }).join('')}
      </div>
      ${revealed
        ? `<div class="rationale" style="margin-top:14px;">${esc(ex.explanation)}</div><button class="btn" id="fin" style="margin-top:12px;">Continue →</button>`
        : `<button class="btn" id="reveal" ${chosen == null ? 'disabled' : ''} style="margin-top:16px;">Lock in my answer</button>`}
    </div>`;
  if (!revealed) {
    app.querySelectorAll('.opt[data-i]').forEach((b) => { b.onclick = () => { s.response.optionId = Number(b.dataset.i); render(); }; });
    document.getElementById('reveal').onclick = () => { s.revealed = true; announce(chosen === ex.answer ? `Correct. ${ex.explanation}` : `Not quite. ${ex.explanation}`); render(); };
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
            <button class="btn ghost mic-inline amber" data-mic="${i}" aria-label="Dictate this answer by voice">${micGlyph}</button>
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
      : 'Saved — this reflection needs the live coach to read it. Add an API key in Settings and it’ll be scored next time. Either way, finishing it honestly counts.';
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
  // Accessible name: the button's content is only an icon that toggles to a stop glyph
  // mid-recording, so a screen reader would otherwise announce nothing usable.
  // Respect any idle label already on the button (e.g. "Dictate your message"
  // on the coach mic); default for the rest. Keep it stable through the toggle.
  const idleLabel = btn.getAttribute('aria-label') || 'Dictate by voice';
  // Keep `committed` current when the person types by hand (but not while the
  // recognizer is the one writing — that path manages `committed` itself).
  input.addEventListener('input', () => { if (!recording) committed = input.value; });
  const setUI = (on) => {
    recording = on;
    btn.innerHTML = on ? stopGlyph : micGlyph;
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
          <button class="btn ${s.recording ? 'green' : 'amber'}" id="mic" style="width:auto;">${s.recording ? stopGlyph + ' Stop recording' : micGlyph + ' Speak'}</button>
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
        if (s.recording) { s.recording = false; const m = document.getElementById('mic'); if (m) { m.classList.remove('green'); m.classList.add('amber'); m.innerHTML = micGlyph + ' Speak'; } }
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
      : 'Saved — this one needs the live coach to read it. Add an API key in Settings and it’ll be scored next time. Either way, working through a hard conversation counts.';
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

// Contemplation — a timed silence practice (Spiritual Life).
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
      <p class="muted small" style="margin-top:20px;">${getDomain('interior').icon} Be still.</p>
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
        <button class="btn amber" id="cnotemic" aria-label="Dictate your reflection" style="width:auto; padding:12px 14px; align-self:flex-start;">${micGlyph}</button>
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

// ---------------- guided ACT practice (advanced mode) ----------------
// Three phases: intro (frame + an optional 0–10 "before") → run (breathing orb
// + stepped script, chimes) → reflect (the "after" + note, and for the values
// module a small committed-action capture). It's a PRACTICE: unscored, logged
// for the streak only, and its personal text never leaves the device.
function stopGuidedTimers(s) {
  if (!s) return;
  if (s._timer) { clearInterval(s._timer); clearTimeout(s._timer); s._timer = null; }
  if (s._breathStop) { s._breathStop(); s._breathStop = null; }
}

function renderGuided() {
  const s = state.session;
  const ex = s.exercise;
  const m = ex.module;
  const r = s.response;

  // ----- intro -----
  if (s.phase === 'guided-intro') {
    const hasAudio = (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext));
    app.innerHTML = `
      <div class="fade-in">
        ${sessionHeader(ex)}
        <div class="card">
          <div class="k">${esc(m.process)}</div>
          <h2 style="font-size:1.15rem; margin:6px 0 8px;">${esc(m.name)}</h2>
          <p>${esc(m.lead)}</p>
          <p class="muted small" style="margin-top:8px;">${esc(m.before)}</p>
          ${m.eyesOpen ? '<p class="muted small">Keep your eyes open for this one — it’s about coming back to where you are.</p>' : '<p class="muted small">You can close your eyes; the sound will guide you.</p>'}
        </div>
        ${(() => {
          const mode = (state.profile.settings && state.profile.settings.practiceSound) || 'waves';
          const opt = (id, label) => `<button class="chip${mode === id ? ' sel' : ''}" data-sound="${id}" aria-pressed="${mode === id}">${label}</button>`;
          return `<div class="card soundsel">
          <div class="eyebrow">Sound</div>
          <div class="chip-row" role="group" aria-label="Sound" style="margin:8px 0 6px;">${opt('off', 'Silent')}${opt('waves', 'Breath waves')}${opt('voice', 'Spoken guidance')}</div>
          <p class="muted small" style="margin:0;">Breath waves rise and fall and move gently left ↔ right — <strong>best with headphones</strong>. Spoken guidance reads each step aloud in a calm voice.</p>
        </div>`;
        })()}
        ${m.scale ? `
          <p class="muted small" style="margin-top:4px;">${esc(m.scale.label)}</p>
          <div class="slider-row">
            <span class="muted small">${esc(m.scale.lo)}</span>
            <input type="range" id="gbefore" min="0" max="10" value="${r.before != null ? r.before : 5}" aria-label="${esc(m.scale.label)}" aria-valuetext="${r.before != null ? r.before : 5} out of 10, ${esc(m.scale.lo)} to ${esc(m.scale.hi)}" />
            <span class="muted small">${esc(m.scale.hi)}</span>
          </div>
          <div class="center muted small" id="gbeforeval">${r.before != null ? r.before : 5}/10</div>
        ` : ''}
        <button class="btn amber" id="gbegin" style="margin-top:14px;">Begin</button>
        <p class="muted small" style="margin-top:12px; opacity:.85;">${esc(m.basis)} A brief practice in psychological flexibility — not therapy, and never a diagnosis.</p>
      </div>`;
    const slider = document.getElementById('gbefore');
    if (slider) {
      r.before = Number(slider.value);
      const setBeforeVt = () => slider.setAttribute('aria-valuetext', `${slider.value} out of 10, ${m.scale.lo} to ${m.scale.hi}`);
      setBeforeVt();
      slider.oninput = () => { r.before = Number(slider.value); const v = document.getElementById('gbeforeval'); if (v) v.textContent = `${slider.value}/10`; setBeforeVt(); };
    }
    app.querySelectorAll('[data-sound]').forEach((b) => b.onclick = () => {
      state.profile.settings.practiceSound = b.dataset.sound;
      save();
      render(); // re-render the intro to reflect the new selection (slider value persists on r)
    });
    document.getElementById('gbegin').onclick = () => {
      const mode = (state.profile.settings && state.profile.settings.practiceSound) || 'waves';
      s.soundMode = mode;
      if (mode !== 'off') {
        s._tones = createTones();
        if (s._tones) { s._tones.unlock(); s._tones.start(); }
      }
      if (mode === 'voice') primeVoices();
      s.stepIdx = 0;
      s.phase = 'guided-run';
      render();
    };
    return;
  }

  // ----- reflect -----
  if (s.phase === 'guided-reflect') return renderGuidedReflect();

  // ----- run: breathing orb + stepped script -----
  const eyesLine = m.eyesOpen ? 'Eyes open, soft gaze.' : 'Settle in. Let the breath lead.';
  app.innerHTML = `
    <div class="fade-in center">
      <p class="muted small" style="margin-top:14px;">${esc(eyesLine)}</p>
      <div class="breath-wrap">
        <div class="breath-orb" id="orb"></div>
        <div class="breath-label" id="breathlbl" aria-live="polite" aria-atomic="true"></div>
      </div>
      <p class="guide-step" id="gstep">${esc(m.steps[0].text)}</p>
      <button class="btn ghost sm" id="gend" style="width:auto; margin-top:18px;">End early</button>
    </div>`;

  const orb = document.getElementById('orb');
  const breathLbl = document.getElementById('breathlbl');

  // Breathing controller: a chained-timeout cycle (inhale → hold → exhale) that
  // drives the orb's scale and the in/out label, with a soft chime per breath.
  const breath = m.breath || { inhale: 4, hold: 0, exhale: 6 };
  let breathStopped = false;
  let breathTimer = null;
  const setOrb = (scale, durSec) => { if (orb) { orb.style.transitionDuration = `${durSec}s`; orb.style.transform = `scale(${scale})`; } };
  const inhale = () => {
    if (breathStopped) return;
    if (breathLbl) breathLbl.textContent = 'Breathe in';
    // A rising wave washing LEFT on the inhale (bilateral); the wave IS the breath cue now.
    if (s._tones && s.soundMode !== 'off') s._tones.breathWave('in', breath.inhale);
    setOrb(1, breath.inhale);
    breathTimer = setTimeout(breath.hold > 0 ? hold : exhale, breath.inhale * 1000);
  };
  const hold = () => {
    if (breathStopped) return;
    if (breathLbl) breathLbl.textContent = 'Hold';
    breathTimer = setTimeout(exhale, breath.hold * 1000);
  };
  const exhale = () => {
    if (breathStopped) return;
    if (breathLbl) breathLbl.textContent = 'Breathe out';
    // A falling wave washing RIGHT on the exhale (bilateral).
    if (s._tones && s.soundMode !== 'off') s._tones.breathWave('out', breath.exhale);
    setOrb(0.55, breath.exhale);
    breathTimer = setTimeout(inhale, breath.exhale * 1000);
  };
  const stopBreath = () => { breathStopped = true; if (breathTimer) clearTimeout(breathTimer); };
  s._breathStop = stopBreath;
  inhale();

  // Step progression: advance the guiding line on each step's own timer, chiming
  // softly on the change. A "freezeBreath" step (defusion's word-repetition) holds
  // the orb steady instead of pacing breath against the repetition.
  const stepEl = document.getElementById('gstep');
  const runStep = (i) => {
    if (state.session !== s || state.route !== 'session') return;
    if (i >= m.steps.length) { toGuidedReflect(true); return; }
    s.stepIdx = i;
    const step = m.steps[i];
    if (stepEl) stepEl.textContent = step.text;
    // Voice mode: a calm voice reads the step aloud. Otherwise (waves), the breath wash
    // carries it with no beep; on a step change in waves mode, a single soft marker.
    if (s.soundMode === 'voice') speakText(step.text);
    else if (i > 0 && s._tones && s.soundMode !== 'off') s._tones.interval();
    if (step.freezeBreath) {
      stopBreath();
      if (orb) orb.classList.add('held');
      if (breathLbl) breathLbl.textContent = '';
    } else if (orb && orb.classList.contains('held')) {
      // (resume not needed in current scripts — repeat step is last-but-one — but
      // keep it correct if scripts change.)
      orb.classList.remove('held');
    }
    s._timer = setTimeout(() => runStep(i + 1), (step.sec || 16) * 1000);
  };
  const toGuidedReflect = (completed) => {
    stopGuidedTimers(s);
    stopSpeak();
    if (s._tones) { s._tones.done(); const t = s._tones; s._tones = null; setTimeout(() => t.close(), 2500); }
    r.completed = !!completed;
    s.phase = 'guided-reflect';
    render();
  };
  document.getElementById('gend').onclick = () => toGuidedReflect(false);

  // Kick off step 0's dwell (text already shown). Guard against double-start on
  // re-render: only schedule if no step timer is pending.
  if (!s._timer) s._timer = setTimeout(() => runStep((s.stepIdx || 0) + 1), (m.steps[0].sec || 16) * 1000);
}

function renderGuidedReflect() {
  const s = state.session;
  const ex = s.exercise;
  const m = ex.module;
  const r = s.response;

  // For scale modules the "after" defaults to the slider's starting value, so the
  // practice can always be finished; values modules require a value word first.
  // (The honest before→after shift is shown on the close screen, not live here —
  // re-rendering on every slider tick would fight the user's drag.)
  const canFinish = m.scale ? true : (!!(r.value && r.value.trim()));
  app.innerHTML = `
    <div class="fade-in">
      ${sessionHeader(ex)}
      <p class="muted small">${r.completed ? 'You stayed with the whole practice.' : 'You stepped out early — that’s fine. Even a few breaths count.'}</p>
      ${m.scale ? `
        <p class="likert-q" style="font-size:1.05rem; margin-top:12px;">${esc(m.after)}</p>
        <div class="slider-row">
          <span class="muted small">${esc(m.scale.lo)}</span>
          <input type="range" id="gafter" min="0" max="10" value="${r.after != null ? r.after : (r.before != null ? r.before : 5)}" aria-label="${esc(m.after)}" aria-valuetext="${r.after != null ? r.after : (r.before != null ? r.before : 5)} out of 10, ${esc(m.scale.lo)} to ${esc(m.scale.hi)}" />
          <span class="muted small">${esc(m.scale.hi)}</span>
        </div>
        <div class="center muted small" id="gafterval">${r.after != null ? r.after : (r.before != null ? r.before : 5)}/10</div>
      ` : ''}
      ${m.capture ? `
        <p class="likert-q" style="font-size:1.05rem; margin-top:12px;">${esc(m.capture.value)}</p>
        <div class="row" style="gap:8px; align-items:flex-start;">
          <textarea class="reflect-area" id="gvalue" style="min-height:60px;" placeholder="A word or short phrase…">${esc(r.value || '')}</textarea>
          <button class="btn amber" id="gvaluemic" aria-label="Dictate your answer" style="width:auto; padding:12px 14px;">${micGlyph}</button>
        </div>
        <p class="likert-q" style="font-size:1.05rem; margin-top:12px;">${esc(m.capture.action)}</p>
        <div class="row" style="gap:8px; align-items:flex-start;">
          <textarea class="reflect-area" id="gaction" style="min-height:60px;" placeholder="One small, doable step…">${esc(r.action || '')}</textarea>
          <button class="btn amber" id="gactionmic" aria-label="Dictate your step" style="width:auto; padding:12px 14px;">${micGlyph}</button>
        </div>
      ` : ''}
      <p class="muted small" style="margin-top:14px;">Anything you want to note? (optional)</p>
      <div class="row" style="gap:8px; align-items:flex-start;">
        <textarea class="reflect-area" id="gnote" style="min-height:60px;" placeholder="Write or speak a few words. Stays on your device.">${esc(r.note || '')}</textarea>
        <button class="btn amber" id="gnotemic" aria-label="Dictate your note" style="width:auto; padding:12px 14px;">${micGlyph}</button>
      </div>
      <button class="btn" id="gfin" ${canFinish ? '' : 'disabled'} style="margin-top:14px;">Finish practice</button>
    </div>`;

  const after = document.getElementById('gafter');
  if (after) {
    r.after = Number(after.value); // default = starting value, so Finish is always available
    const setAfterVt = () => after.setAttribute('aria-valuetext', `${after.value} out of 10, ${m.scale.lo} to ${m.scale.hi}`);
    setAfterVt();
    after.oninput = () => { r.after = Number(after.value); const v = document.getElementById('gafterval'); if (v) v.textContent = `${after.value}/10`; setAfterVt(); };
  }
  const val = document.getElementById('gvalue');
  if (val) { val.oninput = () => { r.value = val.value; const b = document.getElementById('gfin'); if (b) b.disabled = !(r.value && r.value.trim()); }; attachMicButton(document.getElementById('gvaluemic'), val); }
  const act = document.getElementById('gaction');
  if (act) { act.oninput = () => { r.action = act.value; }; attachMicButton(document.getElementById('gactionmic'), act); }
  const note = document.getElementById('gnote');
  note.oninput = () => { r.note = note.value; };
  attachMicButton(document.getElementById('gnotemic'), note);
  document.getElementById('gfin').onclick = () => completeGuided();
}

// Finish a guided practice: log it (unscored — streak only), then a calm close.
// No score reveal (it isn't a measure), and for the values module, an offer to
// keep the committed action as a real commitment.
function completeGuided() {
  const s = state.session;
  if (!s || s._completed) return;
  s._completed = true;
  stopGuidedTimers(s);
  const ex = s.exercise;
  const m = ex.module;
  const r = s.response;
  const { profile } = Profile.applySession(state.profile, ex, r);
  state.profile = profile;
  save();

  const savedAction = (m.capture && r.action && r.action.trim()) ? r.action.trim() : '';
  app.innerHTML = `
    <div class="fade-in">
      <div class="center" style="padding-top:24px;">
        <div style="font-size:2.2rem;">${getDomain('emotion_regulation').icon}</div>
        <h2 style="font-size:1.15rem; margin-top:8px;">Practice complete</h2>
        <p class="muted small" style="max-width:32ch; margin:8px auto 0;">${esc(closingLineFor(m, r))}</p>
      </div>
      ${savedAction ? `
        <div class="card" style="margin-top:18px;">
          <div class="k">Your next step</div>
          <p style="margin:6px 0 10px;">“${esc(savedAction)}”</p>
          <button class="btn sm" id="gcommit">Keep this as a commitment</button>
          <span id="gcommitted" class="trendpill up" style="display:none;">saved ${uiIcon('check', 'tpico')}</span>
        </div>` : ''}
      <button class="btn ghost" id="gtalk" style="margin-top:16px;">${coachGlyph} Talk this through with the coach →</button>
      <button class="btn amber" id="gdone" style="margin-top:10px;">Done →</button>
    </div>`;

  const commit = document.getElementById('gcommit');
  if (commit) commit.onclick = () => {
    // Use addGoal so the commitment is well-formed (id + domain + checkins[]) — a raw push
    // left those undefined, breaking the check-in/edit/delete buttons keyed by g.id.
    state.profile = Profile.addGoal(state.profile, ex.domain || 'emotion_regulation', savedAction);
    save();
    commit.style.display = 'none';
    const tag = document.getElementById('gcommitted'); if (tag) tag.style.display = '';
  };
  document.getElementById('gdone').onclick = () => { state.session = null; go('home'); };
  document.getElementById('gtalk').onclick = () => {
    // Derive the coach domain from the actual practice — NOT a constant. The Examen's ex.domain is
    // 'interior' (set in buildGuided), so this routes it through coach.js's interior privacy gate
    // (sessionOpener returns live:false for domain==='interior'). Hardcoding 'emotion_regulation'
    // here let a faith/Spiritual-Life reflection reach the live API — a privacy breach (v265 fix).
    const ctx = { kind: 'session', domain: ex.domain || 'emotion_regulation', exerciseLabel: `the “${m.name}” practice` };
    state.session = null;
    talkThrough(ctx);
  };
}

// A gentle, on-device closing line — tuned to the module, never over-claiming.
function closingLineFor(m, r) {
  if (m.id === 'values' && r.value && r.value.trim()) {
    return `You named ${r.value.trim()} — and a way to live it today. That’s the whole move: a direction, then one step.`;
  }
  if (m.scale && r.before != null && r.after != null) {
    const better = m.scale.better === 'up' ? r.after > r.before : r.after < r.before;
    if (better) return 'Something loosened, even a little. That’s the muscle — and it strengthens with the returning.';
    return 'Nothing has to have shifted yet. Showing up to the practice is the rep; the change comes in the repeating.';
  }
  return 'You made a little room. That’s the practice — and it grows in the returning, not the result.';
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
        <button class="btn amber" id="refmic" aria-label="Dictate your reflection" style="width:auto; padding:12px 14px; align-self:flex-start;">${micGlyph}</button>
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
           <div class="mile-rule">${uiIcon('flame', 'binline')} Streak</div>
           <div class="mile-head">${streakMark}-day streak</div>
           <div class="mile-note">Showing up is the formation — and the person who returns this many days is already becoming someone different.</div>
         </div>`
      : (graced
        ? `<div class="milestone" role="status" style="--mile:var(--amber)">
             <div class="mile-rule">${uiIcon('buoy', 'binline')} Grace day</div>
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
  // Honesty at the moment of peak salience: the reveal is the most-seen, most-screenshot-prone
  // screen, yet it was the ONE place that showed a band ("Thriving") with no evidence qualifier —
  // a single keyed item read as a settled, norm-referenced measurement. Carry the SAME confidence
  // tag the Progress rows and the snapshot already show ('' once the scale is established, so a
  // mature number still stands on its own). Validity review, v296.
  const conftag = unscored ? '' : confidenceTag(state.profile, s.exercise.domain);
  // The tailored "keep going" target: the lowest-scoring capacity not just practiced
  // (recommendFocus excludes recent domains), so a motivated person continues into where it
  // helps most — not "more of the same." Calm + optional; "Done" stays the amber default below.
  const nextFocusId = recommendFocus(state.profile);
  const nfx = getDomain(nextFocusId);
  app.innerHTML = `
    <div class="fade-in">
      <div class="score-reveal">
        <div id="srscore" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
        ${unscored
          ? `<div class="lbl" style="margin-top:6px;">${esc(getDomain(s.exercise.domain).name)} · reflection saved</div>`
          : `${indexRing(rawScore, { label: getDomain(s.exercise.domain).name, color: band.color, numId: 'bigscore', start: 0 })}
        <div class="lbl">${esc(getDomain(s.exercise.domain).name)} · ${band.label}</div>
        ${conftag ? `<div class="muted small" style="margin-top:4px;">${esc(conftag)}</div>` : ''}`}
      </div>
      ${milestoneBanner}
      <div class="card" id="insight" aria-live="polite">
        <div class="row"><span class="spinner"></span> <span class="muted">Your coach is reading the session…</span></div>
      </div>
      ${growthCard(s.exercise.domain, { compact: true })}
      ${nfx ? `<p class="muted small" style="margin:4px 0 6px;">That’s today’s — genuinely enough. If you’re in a groove, the most useful next is <strong>${esc(nfx.name)}</strong> — ${esc(nfx.short.toLowerCase())}.</p>
      <button class="btn ghost" id="keepgoing" style="margin-bottom:10px;">Keep going → ${esc(nfx.name)}</button>` : ''}
      <div style="text-align:center; margin:6px 0 12px;">
        <button class="inlinelink" id="seedomain">See your ${esc(getDomain(s.exercise.domain).name)} →</button>
        <span class="muted small" style="margin:0 10px;">·</span>
        <button class="inlinelink" id="talkthrough">Talk it through with the coach →</button>
      </div>
      ${tomorrowNudge}
      <button class="btn amber" id="home">Done →</button>
    </div>`;
  document.getElementById('home').onclick = () => { state.session = null; go('home'); };
  const kg = document.getElementById('keepgoing');
  if (kg) kg.onclick = () => startDomainSession(nextFocusId); // straight into the tailored next capacity
  document.getElementById('seedomain').onclick = () => {
    // Into the full per-capacity view, where the just-updated trajectory + next-step live.
    state.focusDomain = s.exercise.domain; state.focusDomainFrom = 'home'; state.session = null; go('domain');
  };
  wireGrowthCommit();
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
  if (!unscored) countUp(document.getElementById('bigscore'), rawScore, 900);
  drawRing(); // draw the reveal arc in, synced with the count-up
  // Announce the result to screen readers: the count-up number is aria-hidden
  // (its 0→N churn shouldn't be spoken) and a live region rendered EMPTY is only
  // announced when JS changes it — so set the settled phrase here, post-render,
  // as one atomic update. Without this an SR user never hears their score.
  const srScore = document.getElementById('srscore');
  if (srScore) {
    srScore.textContent = unscored
      ? `${getDomain(s.exercise.domain).name} reflection saved.`
      : `${getDomain(s.exercise.domain).name}: ${rawScore} out of 100, ${band.label}${conftag ? `. ${conftag}` : ''}.`;
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
        <span class="kbig" style="color:var(--accent);">${air == null ? '—' : `${air}<span class="snapof"> / 100</span>`}</span></div>
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
// A calm, purpose-built empty state for cold-start surfaces (before data accrues) —
// reinforces the formation ethos (it takes time; nothing to catch up on) instead of a
// broken-looking empty chart. Inline SVG, no asset, deliberately NOT gamified.
function emptyState(line) {
  return `<div class="emptystate">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="var(--ink-faint)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" style="flex:none;">
      <path d="M3 16c3-4 5.5-4 8 0s5 4 8-2"/><circle cx="18.5" cy="6.5" r="2.3"/>
    </svg>
    <p class="muted small" style="margin:0;">${esc(line)}</p>
  </div>`;
}

// Cold-start placeholder for the Formation Index trajectory: instead of a bare dashed
// pill, show the SHAPE of the instrument that's coming — a faint baseline axis + a soft
// dashed ghost line in the SAME 320×60 frame as the real sparkline. The ghost is
// directionally NEUTRAL (gently undulating, not rising) so it promises a line, not a
// guaranteed gain (honesty contract). aria-hidden; the copy carries the meaning.
function trajectoryPlaceholder(line) {
  return `<div class="trajempty">
    <svg viewBox="0 0 320 60" width="100%" class="trajghost" aria-hidden="true">
      <line x1="0" y1="52" x2="320" y2="52" stroke="var(--line)" stroke-width="1.5"/>
      <path d="M0 38 C 60 30, 110 44, 160 36 S 262 28, 320 33" fill="none" stroke="var(--ink-faint)" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 7" opacity=".5"/>
    </svg>
    <p class="muted small" style="margin:6px 0 0;">${esc(line)}</p>
  </div>`;
}

function renderProgress() {
  const p = state.profile;
  const fi = formationIndex(p.domainScores);
  const idxPts = (p.indexHistory || []).map((x) => x.formationIndex);
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Your formation over time', 'Progress', '')}
      ${(() => {
        // A plain-language read of how they're doing, regenerated from current scores so it's
        // ALWAYS here — the interpretive feedback the baseline screen showed once is now revisitable
        // (real first-user feedback: liked the read, couldn't get back to it). Words before numbers.
        const read = currentRead(p, p.settings && p.settings.name);
        return read ? `<div class="card">
        <div class="k">How you’re doing</div>
        <p style="margin:6px 0 0; line-height:1.55;">${esc(read)}</p>
      </div>` : '';
      })()}
      <div class="card">
        <div class="row"><strong>Formation Index</strong><span class="spacer"></span><span class="kbig">${fi}<span class="snapof"> / 100</span></span></div>
        ${(() => {
          // Same headline-honesty treatment as Home (v112): on thin evidence the
          // Index is provisional. Progress is where users study the number, so the
          // humility must be here too — not a confident integer on one screen and
          // "provisional" on another for the SAME value.
          const ic = indexConfidence(p);
          return ic.thin ? `<p class="muted small" style="margin:4px 0 0;">${esc(ic.note)}</p>` : '';
        })()}
        ${idxPts.length < 2
          ? trajectoryPlaceholder('Your trajectory appears here after a few sessions. Formation is measured over weeks, not in a day — there’s nothing to catch up on.')
          : `<svg viewBox="0 0 320 60" width="100%" style="margin-top:8px;">
          <path d="${sparklinePath(idxPts, 320, 60, 6)}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <p class="muted small">${idxPts.length} data points since you began.</p>`}
      </div>

      ${aiReadinessCard(p)}

      <h2 class="section-head">Your scales</h2>
      <div class="card">
        <div class="domain-list">
          ${domainOrder().map((id) => progressRow(id)).join('')}
        </div>
      </div>

      <div class="card" style="background:linear-gradient(180deg,var(--card),var(--bg)); border-left:4px solid var(--green);">
        <div class="row"><strong>Your 90-day proof</strong><span class="spacer"></span><span class="trendpill up">auditable</span></div>
        <p class="muted small" style="margin-top:6px;">Forma stakes itself on three measurable claims over 90 days. See the receipts — your own numbers, moving.</p>
        <button class="btn ghost sm" id="toproof">Open my 90-day proof →</button>
      </div>

      <div class="card">
        <div class="row">${uiIcon('doc')}
          <div style="flex:1;"><strong>Capacity Snapshot</strong>
            <p class="muted small" style="margin:2px 0 0;">One clean page of your profile — print, save as PDF, or copy to share with a coach or employer.</p></div>
          <button class="btn ghost sm" id="tosnapshot" style="width:auto;">Open →</button>
        </div>
      </div>

      <h2 class="section-head">What Forma is noticing</h2>
      <div class="card">
        ${(() => {
          const lines = weeklyPatterns(p);
          if (lines.length === 1 && /Not enough history yet/.test(lines[0])) {
            return emptyState('Once you’ve done a few sessions, Forma will start noticing patterns that are genuinely true about you — never sooner, so it’s not making things up.');
          }
          return `<ul class="noticing">${lines.map((line) => `<li>${esc(line)}</li>`).join('')}</ul>`;
        })()}
      </div>

      ${Profile.recentSessions(p).length ? `
      <h2 class="section-head">Recent sessions</h2>
      <div class="card">
        <p class="muted small" style="margin:0 0 8px;">Every score you've earned, newest first — your own auditable record.</p>
        <div class="domain-list">
          ${Profile.recentSessions(p).map((sx) => {
            const d = getDomain(sx.domain); const band = bandFor(sx.rawScore);
            const dt = new Date(sx.date + 'T00:00:00');
            return `<div class="domain-row" style="align-items:center;">
              <span class="ico" aria-hidden="true">${d ? d.icon : '•'}</span>
              <div class="meta"><div class="dn">${d ? esc(d.name) : esc(sx.domain)}</div>
                <div class="muted small">${dt.getMonth() + 1}/${dt.getDate()}</div>
                <div class="bar"><div style="width:${sx.rawScore}%; background:${band.color}"></div></div></div>
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
          ${d.done ? `<span class="trendpill up">done ${uiIcon('check', 'tpico')}</span>` : (isToday ? '<button class="btn sm" data-start="1" style="width:auto;">Start →</button>' : '')}
        </div>
        <p class="muted small" style="margin:8px 0 0;">${esc(d.rationale)}</p>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('This week', 'This Week', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Home</button>')}
      <div class="card" style="border-left:4px solid ${getDomain(plan.theme).color};">
        <div class="k">Focus capacity</div>
        <div class="row" style="margin-top:4px;"><span class="ico" style="font-size:1.4rem;">${getDomain(plan.theme).icon}</span>
          <strong style="font-size:1.1rem;">${esc(getDomain(plan.theme).name)}</strong></div>
        <div id="plannote" class="muted" style="margin-top:8px;"><span class="spinner" style="width:14px;height:14px;"></span> <span class="small">writing your week…</span></div>
      </div>
      ${growthCard(plan.theme, { hideName: true })}
      ${rows}
      <button class="btn ghost sm" id="regen" style="margin-top:6px;">Regenerate this week's plan</button>
      <p class="muted small center" style="margin-top:8px;">Your plan refreshes automatically each week, adapting to how your scales have moved.</p>
    </div>`;

  document.getElementById('back').onclick = () => go('home');
  document.getElementById('regen').onclick = () => { p.plan = Planner.generatePlan(p); save(); render(); };
  const startBtn = app.querySelector('[data-start]');
  if (startBtn) startBtn.onclick = () => go('session');
  wireGrowthCommit();

  Planner.planNarrative(p, plan).then(({ text, live }) => {
    const el = document.getElementById('plannote');
    if (el) el.innerHTML = `<div class="${live ? 'insight live' : ''}" style="border:none;padding:0;white-space:pre-wrap;">${esc(text)}</div>`;
  });
}

// The FAR end of the formation loop: a calm, once-a-week review that brings each commitment back
// for a deliberate KEEP / ADJUST / RETIRE decision, paired with — but never attributed to — the
// capacity's own trajectory. Surfaced only at a weekly plan rollover (ensurePlan) and only when
// there are commitments. Dismissible, never a daily nag, never a grade. Closes the loop and
// bridges the two islands (the weekly plan ↔ the real-life commitments).
function renderReview() {
  const p = state.profile;
  p._reviewDue = false; // entering the review satisfies the prompt (seen = done); it won't nag again this week.
  save();                // NB: the flag lives on the PROFILE (set at ensurePlan, read in weekStripCard) and
                         // save() only persists state.profile — clearing state._reviewDue here was a no-op
                         // that left the banner nagging all week (fixed v254).
  const today = todayStr();
  const last7 = Array.from({ length: 7 }, (_, i) => Planner.addDays(today, -i));
  const open = (p.goals || []).filter((g) => !g.done);

  // Honest trajectory context — names the direction, explicitly NEVER claims the commitment caused it.
  const trajLine = (domain) => {
    const t = domainTrend(p.history || [], domain);
    const name = getDomain(domain) ? getDomain(domain).name : 'this capacity';
    if (!t || t.first == null || t.direction === 'flat') return `Your ${esc(name)} scale has held about steady.`;
    if (t.direction === 'up') return `Your ${esc(name)} scale has edged up lately — worth keeping the habit to see if it holds.`;
    return `Your ${esc(name)} scale has dipped lately — a gentle reason to stay with it, not a verdict.`;
  };

  const rows = open.map((g) => {
    const d = getDomain(g.domain);
    const checkins = Array.isArray(g.checkins) ? g.checkins : [];
    const kept = checkins.filter((c) => last7.includes(c)).length;
    const keptLine = kept > 0
      ? `Kept ${kept}× in the last 7 days.`
      : `Not marked kept this week — no problem. Adjust the cue, or retire it without guilt.`;
    return `
      <div class="card reviewrow" data-rev="${esc(g.id)}">
        <div class="row" style="align-items:flex-start;">
          <span class="ico" aria-hidden="true" style="font-size:1.2rem;">${d ? d.icon : '•'}</span>
          <div style="flex:1;">
            <div class="goaltext"><strong>${esc(g.text)}</strong></div>
            <p class="muted small" style="margin:4px 0 0;">${keptLine}</p>
            <p class="muted small" style="margin:4px 0 0;">${trajLine(g.domain)}</p>
          </div>
        </div>
        <div class="row reviewacts" style="gap:8px; margin-top:10px;">
          <button class="btn ghost sm" data-rev-keep="${esc(g.id)}" style="width:auto;">Keep it</button>
          <button class="btn ghost sm" data-rev-adjust="${esc(g.id)}" style="width:auto;">Adjust it</button>
          <button class="btn ghost sm" data-rev-retire="${esc(g.id)}" style="width:auto;">Retire it</button>
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('This week', 'Weekly review', 'A calm, once-a-week look at the commitments you set. Keep, adjust, or retire each — your call.', `<button class="btn ghost sm" id="back" style="width:auto;">← Home</button>`)}
      <div class="card" style="border-left:4px solid var(--accent);">
        <p class="small" style="margin:0;">Scores move for many reasons — a commitment is never proven to cause a change. This is a moment to choose what to carry into the week, not a grade.</p>
      </div>
      ${open.length ? rows : `<div class="card"><p class="muted small" style="margin:0;">No open commitments to review right now — you can set one anytime from Home.</p></div>`}
      <button class="btn" id="reviewdone" style="margin-top:6px;">Done — start the week →</button>
    </div>`;

  document.getElementById('back').onclick = () => go('home');
  document.getElementById('reviewdone').onclick = () => go('home');
  // Keep = the null action, made deliberate: settle the row, change nothing (the commitment stays).
  // Announce + keep focus on the confirmation in place (the activated button is replaced), so
  // screen-reader/keyboard users get feedback and don't drop to <body> — the app's a11y standard.
  app.querySelectorAll('[data-rev-keep]').forEach((b) => {
    b.onclick = () => {
      const row = b.closest('.reviewrow');
      const acts = row && row.querySelector('.reviewacts');
      if (acts) {
        acts.innerHTML = '<span class="muted small" tabindex="-1">Keeping this — carried into the week ✓</span>';
        const span = acts.querySelector('span'); if (span && span.focus) span.focus();
      }
      announce('Keeping this commitment — carried into the week.');
    };
  });
  // Adjust = edit it in place on Home (reuses the existing inline goal-edit; no duplicate UI).
  app.querySelectorAll('[data-rev-adjust]').forEach((b) => {
    b.onclick = () => { state._editGoal = b.dataset.revAdjust; go('home'); };
  });
  // Retire = remove it (reuses Profile.removeGoal); re-render the review without it. The row is
  // gone, so restore focus to a stable place — matching the commitments delete pattern (no body-drop).
  app.querySelectorAll('[data-rev-retire]').forEach((b) => {
    b.onclick = () => {
      state.profile = Profile.removeGoal(state.profile, b.dataset.revRetire);
      save(); render();
      announce('Commitment retired.');
      focusViewHeading();
    };
  });
}

// The Spiritual-identity LENS (v265) — a PRIVATE, non-scored reflective map of where a person
// notices themselves across three faith components, each by a NON-RANKED status. Grounded in
// Marcia's identity-status-by-component framing (Halevy 2025), deliberately NOT a stage/altitude
// ladder. The load-bearing honesty move: it is a MIRROR, never a grade — "Forma does not stage
// your soul." Faith-gated, walled (never an API/coach/snapshot/employer surface). Rooted in the
// person's own reflection, not in any single tradition's stage scheme.
const LENS_UI = [
  { id: 'belief', name: 'Belief', desc: 'What you hold — your convictions about God, faith, meaning.' },
  { id: 'practice', name: 'Practice', desc: 'How you practice — prayer, worship, the rhythms you keep.' },
  { id: 'belonging', name: 'Belonging', desc: 'Where you belong — your place in a community of faith.' },
];
const LENS_STATUS_UI = [
  { id: 'settled', label: 'Settled', note: 'I’ve found my footing here.' },
  { id: 'exploring', label: 'Exploring', note: 'Actively questioning or searching.' },
  { id: 'inherited', label: 'Received', note: 'Carried from where I come from — lived more than examined.' },
  { id: 'drifting', label: 'Drifting', note: 'Distant or disengaged lately.' },
];
function renderInteriorLens() {
  const p = state.profile;
  // Faith-gated: only meaningful on the Spiritual Life track. Direct nav without it → home.
  if (!(p.settings && p.settings.faithTrack)) { state.route = 'home'; return renderHome(); }
  const lens = (p.interiorLens && typeof p.interiorLens === 'object') ? p.interiorLens : {};
  const rows = LENS_UI.map((c) => `
      <div class="card">
        <div class="row" style="margin-bottom:2px;"><strong>${esc(c.name)}</strong></div>
        <p class="muted small" style="margin:0 0 10px;">${esc(c.desc)}</p>
        <div class="lens-opts">
          ${LENS_STATUS_UI.map((s) => `<button class="lens-opt ${lens[c.id] === s.id ? 'sel' : ''}" data-lens="${c.id}" data-status="${s.id}" aria-pressed="${lens[c.id] === s.id}"><span class="lens-label">${esc(s.label)}</span> <span class="muted small">${esc(s.note)}</span></button>`).join('')}
        </div>
      </div>`).join('');
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Spiritual Life', 'Where you are', 'A mirror for your own reflection — not a measurement.', `<button class="btn ghost sm" id="back" style="width:auto;">← Spiritual Life</button>`)}
      <div class="card" style="border-left:4px solid ${getDomain('interior') ? getDomain('interior').color : 'var(--accent)'};">
        <p style="margin:0; line-height:1.55;">This is a mirror for your reflection, not a measurement of where you stand with God. Forma doesn’t stage your soul — it just helps you notice. These statuses aren’t ranked; there’s no “further along.” Where you are will shift, and that’s the life.</p>
      </div>
      ${rows}
      <p class="muted small center" style="margin-top:12px;">Private to you. Never scored, never shared, never part of your measure.</p>
    </div>`;
  document.getElementById('back').onclick = () => { state.focusDomain = 'interior'; go('domain'); };
  app.querySelectorAll('.lens-opt').forEach((b) => {
    b.onclick = () => {
      const c = b.dataset.lens; const status = b.dataset.status;
      const cur = (state.profile.interiorLens || {})[c];
      const next = cur === status ? null : status; // tap the current one again to clear it
      state.profile = Profile.setInteriorLens(state.profile, c, next);
      save(); render();
      announce(next ? `${c}: ${status}` : `${c}: cleared`);
      const again = app.querySelector(`.lens-opt[data-lens="${c}"][data-status="${status}"]`);
      if (again) again.focus(); else focusViewHeading();
    };
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
  const deltaTag = (d) => d > 0 ? `<span class="trendpill up">+${d}</span>` : d < 0 ? `<span class="trendpill down">${d}</span>` : '<span class="trendpill flat">±0</span>';
  // A short, deterministic, NON-identifying reference for the credential — derived only
  // from the snapshot's own public figures (index/sessions/days), so the same snapshot
  // always shows the same code, and it carries no personal data. It's a self-generated
  // reference, NOT a third-party verification seal (the footer says so).
  const refCode = ('000' + ((((snap.formationIndex || 0) * 131) + ((snap.sessionCount || 0) * 17) + ((snap.days || 0) * 7)) % 46656).toString(36).toUpperCase()).slice(-3);
  app.innerHTML = `
    <div class="fade-in snapshot">
      <div class="row no-print"><h1 style="margin:0;">Capacity Snapshot</h1><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Progress</button></div>

      <div class="card snapsheet">
        ${state.demo ? `<div class="snapsample">Sample — illustrative only. “${esc(DEMO_SPEC.persona.name)}” is fictional; not a real measurement.</div>` : ''}
        <div class="snaphead">
          <div class="logo" aria-hidden="true">${formaMark}</div>
          <div>
            <div class="snaptitle">Forma · Capacity Snapshot</div>
            <div class="muted small">${snap.name ? esc(snap.name) + ' · ' : ''}${snap.sessionCount} session${snap.sessionCount === 1 ? '' : 's'}${snap.since ? ` over ${snap.days} days` : ''}${snap.generated ? ` · generated ${esc(snap.generated)}` : ''}</div>
          </div>
        </div>
        <div class="snaphero">
          <div class="snapmetric">
            <div class="eyebrow">Formation Index</div>
            <div class="kbig m2">${snap.formationIndex}<span class="snapof"> / 100</span></div>
          </div>
          ${snap.aiReadiness != null ? `<div class="snapmetric">
            <div class="eyebrow">AI-Readiness</div>
            <div class="kbig m2" style="color:var(--accent);">${snap.aiReadiness}<span class="snapof"> / 100</span></div>
            ${snap.aiReadinessCoverage && snap.aiReadinessCoverage.thin ? `<div class="muted small">${snap.aiReadinessCoverage.covered} of ${snap.aiReadinessCoverage.total} capacities</div>` : ''}</div>` : ''}
        </div>
        ${snap.coverage && snap.coverage.thin ? `<p class="muted small center" style="margin:2px 0 0;">${esc(snap.coverage.note)} — still early; the composite settles as more capacities are practiced.</p>` : ''}
        <table class="snaptable">
          <caption class="sr-only">Your formation snapshot: capacity, confidence, change since last, and score out of 100</caption>
          <thead><tr>
            <th scope="col" class="sr-only">Capacity</th>
            <th scope="col" class="sr-only">Confidence</th>
            <th scope="col" class="sr-only">Change</th>
            <th scope="col" class="sr-only">Score</th>
          </tr></thead>
          <tbody>
          ${snap.domains.map((d) => `<tr>
            <td><span class="snapdot" style="background:${band(d.score)};"></span>${esc(d.name)}</td>
            <td class="snapconf muted small">${esc(d.confidence)}</td>
            <td style="text-align:right;">${d.frozen ? '<span class="muted small">items used up</span>' : deltaTag(d.delta)}</td>
            <td class="snapsc">${d.score}</td>
          </tr>`).join('')}
          </tbody>
        </table>
        ${snap.strengths.length && snap.growthEdges.length
          ? `<p class="muted small" style="margin-top:12px;">Strengths: <strong>${snap.strengths.map(esc).join(', ')}</strong>. Growth edges: <strong>${snap.growthEdges.map(esc).join(', ')}</strong>.</p>`
          : `<p class="muted small" style="margin-top:12px;">Strengths and growth edges appear once a few more capacities are measured — too few so far to rank honestly.</p>`}
        <div class="snapref">Reference FM-${refCode}${snap.generated ? ` · ${esc(snap.generated)}` : ''} · self-generated on device</div>
        <p class="muted small snapfoot">Measurement for formation, not diagnosis. Generated by the individual from their own device data; the optional Spiritual Life track is kept private and excluded here.</p>
      </div>

      <div class="row no-print" style="gap:8px;">
        <button class="btn sm" id="print" style="width:auto;">Print / Save as PDF</button>
        <button class="btn ghost sm" id="copy" style="width:auto;">Copy as text</button>
        <span id="copied" class="trendpill up" style="display:none;">copied ${uiIcon('check', 'tpico')}</span>
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
      ${viewHead('Settings', 'The science behind your measures', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Settings</button>')}
      <div class="card" style="background:linear-gradient(180deg,var(--card),var(--bg)); border-left:4px solid var(--accent);">
        <p class="muted small" style="margin:0;">Forma’s exercises adapt established cognitive and psychological paradigms — the same families of task used in research on attention, memory, reasoning, and emotional skill. They’re tuned to track <strong>growth over time</strong>, as formation, not to diagnose or label. The point is a measurement you can trust because you can see what it rests on.</p>
      </div>

      <div class="card" style="border-left:4px solid var(--green);">
        <div class="eyebrow" style="color:var(--green);">What Forma is — and isn't</div>
        <p class="muted small" style="margin:8px 0 0; line-height:1.55;"><strong>It is</strong> a formation instrument: established research paradigms, adapted to help you measure and strengthen human capacities over time, with the basis of every measure shown to you.</p>
        <p class="muted small" style="margin:8px 0 0; line-height:1.55;"><strong>It isn't</strong> a clinical or diagnostic tool, a hiring or ranking instrument, or normed against a population — your bands are within-person growth, never a percentile. The measures are honest <em>adaptations</em> tuned for formation, not validated clinical tests; their reliability and validity are things Forma is built to <em>earn</em> with real use, not to claim up front.</p>
      </div>

      <div class="card">
        <div class="eyebrow">Where these ten come from</div>
        <p class="muted small" style="margin:8px 0 0; line-height:1.55;">They aren’t a clinical diagnosis or a received list — they’re a considered framework, chosen against one question: <strong>which human capacities grow more valuable as AI does more of the thinking?</strong> Each one is (a) something AI is making rarer, and (b) measurable through established paradigms from cognitive and psychological science — working memory, cognitive reflection, sustained attention, emotional skill, and so on (you can see each capacity’s basis below).</p>
        <p class="muted small" style="margin:8px 0 0; line-height:1.55;">What Forma adds is the <em>selection and the framing</em> for this moment, not the underlying science. Honest limit: whether these are exactly the right ten, and whether they hold together as higher-order factors, is a claim real data will test — not something we’re asserting as settled.</p>
      </div>

      <h2 class="section-head">The capacities Forma measures</h2>
      <p class="muted small" style="margin:0 0 8px;">The same capacities you saw at the start — each adapted from a specific, established research paradigm (the family of task used to study it in the literature), so a score always rests on something you can check, not on our say-so.</p>
      <p class="muted small" style="margin:0 0 10px;">These come in a few kinds: <strong>live performance tasks</strong> (scored on what you actually did), <strong>situational judgment</strong> (how you’d respond to a realistic scenario), and — for the more relational or interior capacities — <strong>honest self-report</strong>, because faking a test of presence or meaning would be less true, not more. Each capacity is matched to the method that fits what it really is.</p>
      ${rows}

      <p class="muted small" style="margin:14px 0 0;">Underneath, these capacities cluster into a few broader human faculties — the kinds of thinking, relating, and self-governance AI quietly erodes when we let it do the work for us. Forma measures each capacity on its own; whether they roll up into validated higher-order scores is exactly what real data will tell us.</p>

      <h2 class="section-head">Self-knowledge instruments</h2>
      <p class="muted small" style="margin:0 0 10px;">Optional checks in the Tools tab, each adapted from an established research paradigm — the same honesty: a mirror you can see the basis of, never a verdict.</p>
      ${INSTRUMENT_BASIS.map((b) => `<div class="card" style="margin-bottom:10px;">
        <div class="row"><span class="ico" aria-hidden="true">${b.icon}</span>
          <strong style="margin-left:8px;">${esc(b.name)}</strong></div>
        <div class="eyebrow" style="margin-top:8px;">${esc(b.paradigm)}</div>
        <p class="muted small" style="margin-top:6px;">${esc(b.detail)}</p>
      </div>`).join('')}

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
        ${indexRing(agg.avgIndex, { label: 'Team Formation Index' })}
        <div class="index-label">Team Formation Index</div>
        <div class="streakchip" style="margin-top:8px;">${uiIcon('bolt', 'chipico')} AI-readiness ${agg.aiReadiness}<span class="snapof"> / 100</span></div>
        <p class="muted small" style="margin-top:10px;">A development signal — self-generated, not normed against a population. Not a predictor of job performance; never a basis for hiring, ranking, or selection.</p>
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
            const spread = BANDS.filter((b) => dist[b.key]).map((b) => `${dist[b.key]} ${b.label.toLowerCase()}`).join(', ');
            return `<div class="domain-row"><span class="ico">${d.icon}</span>
              <div class="meta"><div class="dn">${esc(d.name)}</div>
              <div class="distbar" role="img" aria-label="${esc(d.name)} spread across bands: ${esc(spread)}">${segs}</div></div>
              <span class="sc">${sc}</span></div>`;
          }).join('')}
        </div>
        <div class="distlegend">
          ${BANDS.map((b) => `<span class="distkey"><span class="airdot" style="background:${b.color};"></span>${esc(b.label)}</span>`).join('')}
        </div>
      </div>`;
  app.innerHTML = `
    <div class="fade-in snapshot">
      ${viewHead('For employers · preview', 'Team', '', '<button class="btn ghost sm no-print" id="back" style="width:auto;">← Settings</button>')}
      <p class="muted small">Preview · a sample cohort of ${agg.n}${agg.generated ? `, generated ${esc(agg.generated)}` : ''}. In production, an employer would see only <strong>aggregated development signals</strong> across a team — never an individual's raw data, scores, or reflections, and never the Spiritual Life track. Signals appear only at <strong>${Team.MIN_COHORT} or more members</strong>, so no one can be identified from an aggregate.</p>

      ${signalCards}

      <div class="card">
        <div class="eyebrow">What "AI-readiness" means</div>
        <p class="muted small" style="margin-top:6px;">A blend of Judgment, Agency, Deep Reading, and Communication — the capacities most associated with using AI as a tool of judgment rather than dependence. It's a development signal for growth, <strong>not a predictor of job performance and not a basis for hiring, ranking, or selection</strong> — and it isn't normed against a population.</p>
      </div>

      <div class="row no-print" style="gap:8px;">
        <button class="btn sm" id="teamprint" style="width:auto;">Print / Save as PDF</button>
        <button class="btn ghost sm" id="teamcopy" style="width:auto;">Copy report</button>
        <span id="teamcopied" class="trendpill up" style="display:none;">copied ${uiIcon('check', 'tpico')}</span>
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
      ${viewHead('Progress', '90-Day Proof', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Progress</button>')}
      <p class="muted small">Day ${m.daysElapsed} of 90. These are the claims Forma is willing to be measured on — checked against your own data, not our marketing.</p>

      ${proofClaimCard('① Deeper reading comprehension', 'Sustained reading-comprehension retention should rise.', m.reading, m.daysElapsed, 'reading')}
      ${proofClaimCard('② More agency with AI', 'You should stay more the author of your work — taking good help, holding your own judgment when the tool is wrong.', m.aiIndependence, m.daysElapsed, 'ai_autonomy')}
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
          <span class="kbig" style="color:${color}">${metric.current}</span>
          <span class="trendpill ${metric.delta > 0 ? 'up' : metric.delta < 0 ? 'down' : 'flat'}" style="margin-left:8px;">${metric.delta === 0 ? '±0' : sign + metric.delta}</span>
        </div>
        <svg viewBox="0 0 320 44" width="100%" style="margin-top:6px;">
          <path d="${sparklinePath((metric.series && metric.series.length) ? metric.series : [metric.current], 320, 44, 5)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        ${proj != null ? `<p class="muted small">If this early pace held, that points toward ~${metric.baseline + proj} by day 90 — a rough trajectory to watch, not a forecast.</p>` : `<p class="muted small">A few more days of data and Forma will sketch your 90-day trajectory.</p>`}
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
          <span class="kbig" style="color:${color}">${focus.current}</span>
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
// Sentence Verification (src/svt.js) — deep-reading comprehension. Read a passage; it is REMOVED
// (verifying from memory IS the paradigm — re-reading would void it); then judge sentences one at a
// time as same-meaning or not. No per-answer feedback (that would make it a scored quiz); the reveal
// gives proportion-correct + a gentle say-yes-bias note, never a leaderboard. (v181)
function renderSvt() {
  if (!state.svt) {
    const passages = SVT_BANK.slice();
    for (let i = passages.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = passages[i]; passages[i] = passages[j]; passages[j] = t; }
    state.svt = { passages, pi: 0, phase: 'read', items: null, ii: 0, trials: [] };
  }
  const s = state.svt;
  const total = s.passages.reduce((n, p) => n + p.items.length, 0);

  if (s.phase === 'reveal') {
    const r = svtReading(svtScore(s.trials));
    app.innerHTML = `
    <div class="fade-in">
      <h1 tabindex="-1" id="svthead">Deep reading</h1>
      <p class="eyebrow" style="margin-top:14px;">A gentle read — not a verdict</p>
      <div class="insight">${esc(r.note)}</div>
      <div class="card" style="margin-top:14px;">
        ${SVT_CAVEATS.map((c) => `<p class="muted small" style="margin:0 0 6px;">${esc(c)}</p>`).join('')}
      </div>
      <button class="btn ghost" id="svtdone" style="margin-top:8px;">Done</button>
    </div>`;
    const h = document.getElementById('svthead'); if (h) h.focus();
    announce('Here is your deep-reading read.');
    document.getElementById('svtdone').onclick = () => go('tools');
    return;
  }

  const p = s.passages[s.pi];

  if (s.phase === 'read') {
    app.innerHTML = `
    <div class="fade-in">
      <div class="row"><p class="eyebrow" style="margin:0;">Passage ${s.pi + 1} of ${s.passages.length} · read once, unhurried</p><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Leave</button></div>
      <div class="passage" style="line-height:1.8; max-width:62ch; font-size:1.08rem; margin-top:10px;">${esc(p.text)}</div>
      <p class="muted small">Take the time you need. When you continue, the passage is put away and you’ll answer from memory.</p>
      <button class="btn" id="svtread">I’ve read it — put it away →</button>
    </div>`;
    document.getElementById('back').onclick = () => go('tools');
    document.getElementById('svtread').onclick = () => {
      const items = p.items.slice();
      for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = items[i]; items[i] = items[j]; items[j] = t; }
      s.items = items; s.ii = 0; s.phase = 'judge'; render();
      announce('The passage is now hidden. Answer the sentences from memory.');
    };
    return;
  }

  // Judge phase — one sentence at a time, no per-answer right/wrong feedback (would make it a quiz).
  const item = s.items[s.ii];
  const done = s.trials.length;
  app.innerHTML = `
    <div class="fade-in">
      <div class="row"><span class="muted small">Sentence ${done + 1} of ${total}</span><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Leave</button></div>
      <div class="progress-top"><div style="width:${Math.round(done / total * 100)}%"></div></div>
      <p class="eyebrow">The passage is now hidden — answer from memory</p>
      <p class="likert-q" style="margin-top:8px;">${esc(item.text)}</p>
      <div class="likert-opts">
        <button class="opt" data-yes="1">This means the same as something I read</button>
        <button class="opt" data-yes="0">This is different, or wasn’t in the passage</button>
      </div>
    </div>`;
  document.getElementById('back').onclick = () => go('tools');
  app.querySelectorAll('.opt[data-yes]').forEach((b) => {
    b.onclick = () => {
      s.trials.push({ same: item.same, yes: b.dataset.yes === '1' });
      s.ii += 1;
      if (s.ii >= s.items.length) {
        if (s.pi + 1 < s.passages.length) { s.pi += 1; s.phase = 'read'; s.items = null; s.ii = 0; }
        else { s.phase = 'reveal'; }
      }
      render();
    };
  });
}

// Breath-Counting Task (src/breathcount.js) — an objective meta-awareness measure that sits beside
// the silence practice. You count your own breaths silently (NOTHING on screen shows the number —
// that would defeat it), tapping Breath for 1-8 and the round Ninth pill on breath 9, with a quiet,
// never-shameful "I lost count" reset. A breathing dot + two chimes keep calm time (no countdown).
// The reveal presents accuracy and the self-caught reset rate as an equal-weight PROFILE — the reset
// row framed as meta-awareness (a win), never one hero score. (v179)
function renderBreathCount() {
  if (!state.bct) state.bct = { phase: 'intro', events: [] };
  const b = state.bct;

  if (b.phase === 'intro') {
    app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Tools', 'Breath counting', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Tools</button>')}
      <div class="card">
        <p><strong>Count your breaths, silently, in your head.</strong></p>
        <p>Breathe naturally. With each breath, tap <strong>Breath</strong>. On every <strong>ninth</strong> breath, tap <strong>Ninth</strong> instead — then start again at one.</p>
        <p>Lost the count? That’s normal — tap <strong>I lost count</strong> and begin again at one. Noticing you’ve drifted <em>is</em> the skill.</p>
        <p class="muted small">Count in your head — nothing on screen shows the number. A chime marks the halfway point and the end (about 3½ minutes).</p>
        <p class="muted small">${esc(BREATHCOUNT_CAVEATS[1])}</p>
      </div>
      <button class="btn amber" id="begin">Begin</button>
    </div>`;
    document.getElementById('back').onclick = () => go('tools');
    document.getElementById('begin').onclick = () => {
      b._tones = createTones();
      if (b._tones) { b._tones.unlock(); b._tones.start(); }
      b.target = 210; b.remaining = 210; b.events = []; b.phase = 'run';
      render();
    };
    return;
  }

  if (b.phase === 'run') {
    const target = b.target, half = Math.max(1, Math.floor(target / 2));
    app.innerHTML = `
    <div class="fade-in center">
      <p class="eyebrow" style="margin-top:18px;">Be here</p>
      <div class="stillness-dot" aria-hidden="true"></div>
      <button class="bct-field" id="bbreath" aria-label="Tap for a breath, counts one through eight"><span class="g" aria-hidden="true">◯</span><span class="eyebrow">Breath</span></button>
      <button class="bct-ninth" id="bninth" aria-label="Tap on your ninth breath"><span class="g" aria-hidden="true">●</span>Ninth</button>
      <div style="margin-top:18px;"><button class="btn ghost sm" id="breset" style="width:auto;" aria-label="I lost count, start the count over">I lost count — start over</button></div>
      <div style="margin-top:14px;"><button class="btn ghost sm" id="bend" style="width:auto;">End</button></div>
    </div>`;
    const push = (type) => { b.events.push({ type, t: performance.now() }); };
    document.getElementById('bbreath').onclick = () => push('B');
    document.getElementById('bninth').onclick = () => push('N');
    document.getElementById('breset').onclick = () => push('R');
    const toReveal = () => {
      if (b._timer) { clearInterval(b._timer); b._timer = null; }
      if (b._tones) { const t = b._tones; b._tones = null; setTimeout(() => t.close(), 2500); }
      b.phase = 'reveal'; render();
    };
    document.getElementById('bend').onclick = toReveal;
    if (!b._timer) {
      b._timer = setInterval(() => {
        if (state.bct !== b || state.route !== 'breathcount') { clearInterval(b._timer); b._timer = null; return; }
        b.remaining -= 1;
        const elapsed = target - b.remaining;
        if (b.remaining <= 0) { if (b._tones) b._tones.done(); toReveal(); }
        else if (elapsed === half) { if (b._tones) b._tones.interval(); announce('Halfway.'); }
      }, 1000);
    }
    return;
  }

  // Reveal — accuracy + reset-rate as an equal-weight profile (never one hero score).
  const score = breathCountScore(b.events);
  const reading = breathCountReading(score);
  let body;
  if (reading.level === 'suspect') {
    body = `<div class="insight">${esc(reading.note)}</div>
      <button class="btn ghost" id="bredo" style="margin-top:12px;">Try again, unhurried</button>`;
  } else if (!score.ready) {
    body = `<div class="score-reveal"><div class="lbl">You completed ${score.correct} clean ${score.correct === 1 ? 'cycle' : 'cycles'}.</div></div>
      <p class="muted small">${esc(reading.note)}</p>
      <button class="btn ghost" id="bdone" style="margin-top:12px;">Done</button>`;
  } else {
    const acc = Math.round(score.accuracy * 100);
    const caught = score.resetRate == null ? null : Math.round(score.resetRate * 100);
    body = `
      <table class="snaptable"><tbody>
        <tr><td>Stayed with the count</td><td class="snapsc">${acc}%</td></tr>
        ${caught != null ? `<tr><td><span class="eyebrow" style="color:var(--green-ink);">Meta-awareness</span><br>Caught yourself drifting</td><td class="snapsc">${caught}%<span class="muted small"> of slips</span></td></tr>` : ''}
      </tbody></table>
      <div class="insight" style="margin-top:12px;">${esc(reading.note)}</div>
      <p class="muted small" style="margin-top:8px;">${esc(BREATHCOUNT_CAVEATS[2])}</p>
      <button class="btn ghost" id="bdone" style="margin-top:12px;">Done</button>`;
  }
  app.innerHTML = `<div class="fade-in"><h1 tabindex="-1" id="bchead">Breath counting</h1>${body}</div>`;
  const h = document.getElementById('bchead'); if (h) h.focus();
  announce('Your breath-counting read is ready.');
  const redo = document.getElementById('bredo'); if (redo) redo.onclick = () => { state.bct = null; go('breathcount'); };
  const done = document.getElementById('bdone'); if (done) done.onclick = () => go('tools');
}

// Calibration (src/calibration.js) — a 2AFC "how well does your confidence track your accuracy?"
// mirror. Per item: answer, then say how sure (50-100% — below 50 is incoherent for 2AFC). The
// reveal headlines the over/under-confidence read (no Brier/number-chase), handles underconfidence
// gently, and states the honest caveats. Self-contained routed screen from Settings (v177).
function renderCalibration() {
  if (!state.calib) {
    const items = CALIBRATION_ITEMS.slice();
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = items[i]; items[i] = items[j]; items[j] = t; }
    state.calib = { items, i: 0, picked: null, trials: [] };
  }
  const c = state.calib;

  // Reveal once every item is answered.
  if (c.i >= c.items.length) {
    const reading = calibrationReading(calibrationScore(c.trials));
    app.innerHTML = `
    <div class="fade-in">
      <h1 tabindex="-1" id="calhead">Calibration</h1>
      <p>This isn’t about how many you got right. It’s about whether your <em>confidence</em> tracked your accuracy — knowing what you know, and what you only half-know.</p>
      <p class="eyebrow" style="margin-top:14px;">A gentle read — not a verdict</p>
      <div class="insight">${esc(reading.note)}</div>
      <div class="card" style="margin-top:14px;">
        ${CALIBRATION_CAVEATS.map((c2) => `<p class="muted small" style="margin:0 0 6px;">${esc(c2)}</p>`).join('')}
      </div>
      <button class="btn ghost" id="caldone" style="margin-top:8px;">Done</button>
    </div>`;
    const h = document.getElementById('calhead'); if (h) h.focus();
    announce('Here is your calibration read.');
    document.getElementById('caldone').onclick = () => { state.calib = null; go('tools'); };
    return;
  }

  const it = c.items[c.i];
  const stepHead = `<div class="row"><span class="muted small">Question ${c.i + 1} of ${c.items.length}</span><span class="spacer"></span>
        <button class="btn ghost sm" id="back" style="width:auto;">← Tools</button></div>`;

  if (c.picked == null) {
    // Answer phase.
    app.innerHTML = `
    <div class="fade-in">
      ${stepHead}
      <p class="likert-q" style="margin-top:8px;">${esc(it.q)}</p>
      <div class="likert-opts">
        <button class="opt" data-pick="a">${esc(it.a)}</button>
        <button class="opt" data-pick="b">${esc(it.b)}</button>
      </div>
    </div>`;
    document.getElementById('back').onclick = () => { state.calib = null; go('tools'); };
    app.querySelectorAll('.opt[data-pick]').forEach((b) => { b.onclick = () => { c.picked = b.dataset.pick; render(); }; });
    return;
  }

  // Confidence phase.
  app.innerHTML = `
    <div class="fade-in">
      ${stepHead}
      <p class="likert-q" style="margin-top:8px;">How sure are you?</p>
      <p class="muted small">You chose “${esc(c.picked === 'a' ? it.a : it.b)}”. There’s no penalty for low confidence — be honest about how sure you really are.</p>
      <div class="row" style="flex-wrap:wrap; gap:8px; margin-top:8px;">
        ${[50, 60, 70, 80, 90, 100].map((p) => `<button class="chip" data-conf="${p}" aria-label="${p === 50 ? 'Fifty percent — a guess' : p + ' percent sure'}">${p === 50 ? '50% (a guess)' : p + '%'}</button>`).join('')}
      </div>
    </div>`;
  document.getElementById('back').onclick = () => { state.calib = null; go('tools'); };
  app.querySelectorAll('.chip[data-conf]').forEach((b) => {
    b.onclick = () => {
      c.trials.push({ confidence: Number(b.dataset.conf), correct: it.correct === c.picked });
      c.i += 1; c.picked = null; render();
    };
  });
}

// Over-Claiming "epistemic check" (src/overclaiming.js) — a self-contained mirror for the
// universal habit of nodding along to things we half-recognize. Tick what you recognize from a
// shuffled list where ~25% are made up; the made-up items are disclosed afterward and a gentle,
// numberless, directional reading is offered. Deliberately NOT gamified: no score, no streak, no
// right/wrong colors, no retake-to-beat, no capture — transparency at the meta level (v175).
function renderEpistemicCheck() {
  if (!state.epistemic) {
    const pool = [];
    Object.keys(OVERCLAIM_BANK).forEach((k) => {
      OVERCLAIM_BANK[k].real.forEach((t) => pool.push({ t, foil: false }));
      OVERCLAIM_BANK[k].foil.forEach((t) => pool.push({ t, foil: true }));
    });
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp; }
    state.epistemic = { items: pool, selected: new Set(), revealed: false };
  }
  const e = state.epistemic;

  if (!e.revealed) {
    app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Tools', 'Epistemic check', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Tools</button>')}
      <p class="muted">Tick the ones you genuinely recognize — no pressure to tick many.</p>
      <div class="likert-opts">
        ${e.items.map((it, i) => `<button class="opt ${e.selected.has(it.t) ? 'selected' : ''}" data-i="${i}" aria-pressed="${e.selected.has(it.t)}">${esc(it.t)}</button>`).join('')}
      </div>
      <button class="btn" id="ecdone" style="margin-top:14px;">See what these were →</button>
    </div>`;
    document.getElementById('back').onclick = () => { state.epistemic = null; go('tools'); };
    app.querySelectorAll('.opt[data-i]').forEach((b) => {
      b.onclick = () => { const it = e.items[Number(b.dataset.i)]; if (e.selected.has(it.t)) e.selected.delete(it.t); else e.selected.add(it.t); render(); };
    });
    document.getElementById('ecdone').onclick = () => { e.revealed = true; render(); };
    return;
  }

  // Reveal: name the made-up items neutrally (let people locate themselves — no per-item
  // red ✗), then a numberless directional reading. No bias-c / d′ on screen by design.
  const reading = selfEnhancementReading(overclaimPooled(e.selected).biasC);
  const foils = e.items.filter((it) => it.foil);
  app.innerHTML = `
    <div class="fade-in">
      <h1 tabindex="-1" id="echead">Epistemic check</h1>
      <p>About a quarter of these don’t exist. That’s on purpose — and it’s not a trick on you. It’s one of the few honest mirrors for a habit we all share: nodding along to things we half-recognize.</p>
      <div class="card">
        <h2 style="font-size:1.05rem;">Here are the ones we made up.</h2>
        <table class="snaptable"><tbody>${foils.map((f) => `<tr><td>${esc(f.t)}</td><td class="muted small" style="text-align:right;">made up</td></tr>`).join('')}</tbody></table>
      </div>
      <p class="eyebrow" style="margin-top:14px;">A gentle read — not a verdict</p>
      <div class="insight">${esc(reading.note)}</div>
      <p class="muted small" style="margin-top:10px;">There’s no good or bad score here. Noticing the gap between recognizing and knowing is the whole exercise.</p>
      <button class="btn ghost" id="ecdone2" style="margin-top:8px;">Done</button>
    </div>`;
  const h = document.getElementById('echead'); if (h) h.focus();
  announce('Here is what these were, and a gentle read.');
  document.getElementById('ecdone2').onclick = () => { state.epistemic = null; go('tools'); };
}

function renderFocusCheck() {
  const TRIALS = 5;
  const fcState = state._focus || (state._focus = { phase: 'intro', rts: [], waiting: false, tooSoon: false });

  if (fcState.phase === 'intro') {
    app.innerHTML = `
      <div class="fade-in">
        ${viewHead('Tools', 'Focus Check', '', '<button class="btn ghost sm" id="back" style="width:auto;">← Back</button>')}
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
    <div class="domain-row tappable" data-domain="${id}" role="button" tabindex="0" aria-label="${esc(d.name)}, ${score} out of 100, ${esc(bandFor(score).label)}, trend ${dir === 'flat' ? 'no change' : sign + t.delta} — how to grow it" style="align-items:center;">
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
// The coach ORIGINATES a commitment (v249): pick a measured, NON-interior capacity that has
// genuinely slipped lately and has NO open commitment — so the cold open can OFFER to start one.
// Honesty (forma-validity v249): the trend EARNS the chip but never appears in its copy (no "you
// dipped" verdict in the user's own voice). domainTrend's 'down' is endpoint-only (first vs latest),
// so compensate: require the LATEST reading to sit below the earlier mean AND not be a recovery
// step, and exclude provisional/frozen scales (a dip there is sampling noise or an emptying bank,
// not the person). Suppress a capacity touched by a commitment in the last 14 days (re-originating
// right after a lapse reads as nagging). Returns a capacity id, or null.
function originableCapacity(p) {
  const today = todayStr();
  const open = new Set((p.goals || []).filter((g) => g && !g.done).map((g) => g.domain));
  const recentlyTouched = new Set();
  (p.goals || []).forEach((g) => {
    if (!g || !g.domain) return;
    const created = g.createdAt ? daysBetween(String(g.createdAt).slice(0, 10), today) : Infinity;
    const ck = Array.isArray(g.checkins) ? g.checkins : [];
    const lastKept = ck.length ? daysBetween(ck[ck.length - 1], today) : Infinity;
    if ((created >= 0 && created <= 14) || (lastKept >= 0 && lastKept <= 14)) recentlyTouched.add(g.domain);
  });
  const ids = activeDomainIds(p.settings && p.settings.faithTrack)
    .filter((id) => id !== 'interior' && !open.has(id) && !recentlyTouched.has(id));
  let best = null;
  for (const id of ids) {
    const t = domainTrend(p.history || [], id);
    if (!t || t.first == null || t.direction !== 'down') continue;
    const pts = t.points || [];
    if (pts.length < 3) continue;
    const latest = pts[pts.length - 1];
    const prev = pts[pts.length - 2];
    const earlier = pts.slice(0, -1);
    const mean = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    if (!(latest < mean - 2 && latest <= prev)) continue; // recent readings genuinely below earlier ones — not a first-vs-last artifact or a recovery
    const conf = confidence(p, id);
    if (conf.level === 'provisional' || conf.frozen) continue; // need >=building, never an emptying bank
    if (!best || t.delta < best.delta) best = { id, delta: t.delta };
  }
  return best ? best.id : null;
}

// Coach THREADS: the general space lives in coachLog; each capacity has its own thread in
// coachThreads[domainId] (like separate chats). These helpers abstract "the active thread".
function coachThreadLog(p, key) {
  if (key === 'general') return (p.coachLog = p.coachLog || []);
  p.coachThreads = p.coachThreads || {};
  return (p.coachThreads[key] = p.coachThreads[key] || []);
}
function coachThreadChips(p, activeKey) {
  const ct = p.coachThreads || {};
  const ch = p.coachHistory || {};
  // A domain chat shows if it has live messages OR archived history (so you can resume it).
  const domainKeys = [...new Set([...Object.keys(ct), ...Object.keys(ch)])]
    .filter((k) => k !== 'general' && k !== 'interior' && getDomain(k) && ((ct[k] && ct[k].length) || (ch[k] && ch[k].length)));
  const keys = ['general', ...domainKeys];
  if (activeKey !== 'general' && activeKey !== 'history' && !keys.includes(activeKey)) keys.push(activeKey); // current (maybe empty) thread
  if (Object.keys(ch).some((k) => ch[k] && ch[k].length)) keys.push('history'); // the archive view
  return keys;
}
function threadChipLabel(k) {
  if (k === 'general') return 'Today';
  if (k === 'history') return 'History';
  const d = getDomain(k); return d ? d.name : k;
}
function domainCoachGreeting(p, id) {
  const d = getDomain(id);
  const sc = (p.domainScores || {})[id];
  const band = sc != null ? bandFor(sc) : null;
  const where = band ? ` You're in the ${band.label.toLowerCase()} range here right now — a starting line, not a verdict.` : '';
  return `Let's talk about your ${d.name.toLowerCase()}.${where} What's on your mind about it — something that's been hard, or a place you'd like it to grow?`;
}

function renderCoach() {
  // A NEW day folds the prior day's chats into History so the live view stays "just the day's"
  // (archived, never lost — the coach still draws on the history).
  if (state.profile && state.profile.coachDay !== todayStr()) {
    state.profile = Profile.foldCoachHistory(state.profile, todayStr());
    save();
  }
  const p = state.profile;
  const live = Coach.hasKey(p);
  const provName = Coach.providerName(p);
  // Active thread: 'general' (the open space), a capacity id, or 'history' (the read-only archive).
  // Interior is never a coach thread (the faith track is walled), so fall back to general if asked.
  let tkey = state.coachThread || 'general';
  if (tkey !== 'general' && tkey !== 'history' && (!getDomain(tkey) || tkey === 'interior')) tkey = 'general';
  if (tkey === 'history') return renderCoachHistory(p);
  const isDomain = tkey !== 'general';
  const dom = isDomain ? getDomain(tkey) : null;
  const log = coachThreadLog(p, tkey);
  const threadHist = (p.coachHistory && p.coachHistory[tkey]) || [];

  const chips = coachThreadChips(p, tkey);
  const activeLabel = threadChipLabel(tkey);
  // Collapsible thread switcher: once you have more than one chat going, the chip row collapses
  // so the chat window stays wide — expand it only when you want to switch (Sean).
  const threadsOpen = !!state.coachThreadsOpen;
  const threadBar = chips.length > 1 ? `<details class="coach-threads" ${threadsOpen ? 'open' : ''}>
      <summary class="coach-threads-sum"><span class="muted small">${chips.length} chats ·</span> <strong>${esc(activeLabel)}</strong><span class="muted small"> — switch</span><span class="ct-chev" aria-hidden="true">›</span></summary>
      <div class="chip-row" style="margin:10px 0 2px;">${chips.map((k) =>
        `<button class="chip ${k === tkey ? 'sel' : ''}" data-thread="${esc(k)}" aria-pressed="${k === tkey}">${esc(threadChipLabel(k))}</button>`).join('')}</div>
    </details>` : '';

  // Starter prompts on a cold open — thread-specific so the entry is guided.
  const focus = Planner.focusForToday(p) || recommendFocus(p);
  const fname = getDomain(focus) ? getDomain(focus).name.toLowerCase() : null;
  let starters = [];
  if (!log.length) {
    if (isDomain) {
      const dn = dom.name.toLowerCase();
      starters = [
        { label: `How do I grow my ${dn}?` },
        { label: `When has it gone better?`, send: `When has my ${dn} gone better than usual, and what was different that day?` },
        { label: `One small step this week?`, send: `What's one small step I could take this week for my ${dn}?` },
      ];
    } else {
      starters = [
        { label: 'Where should I focus right now?' },
        { label: fname ? `How do I grow my ${fname}?` : 'How do I grow a capacity?' },
        { label: 'What’s one small step I could take this week?' },
      ];
      // Coach ORIGINATES a commitment (opt-in) for a slipped capacity — general space only.
      const originId = originableCapacity(p);
      if (originId) starters.unshift({ label: 'Help me pick one capacity to commit to.', send: `Help me set one small commitment for my ${getDomain(originId).name}.` });
    }
  }
  const hasMsgs = log.length > 0;
  const greeting = isDomain ? domainCoachGreeting(p, tkey) : Coach.coachGreeting(p);
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Coach', isDomain ? dom.name : 'Coach', isDomain ? `A thread about your ${dom.name.toLowerCase()} — it keeps the running conversation about this one area, so growth here is easier to follow. Tap “General” for the open space.` : '', `<span class="trendpill ${live ? 'up' : 'flat'}">${live ? `live · ${esc(provName)}` : 'offline mode'}</span>`)}
      ${!live ? `<p class="muted small">Add your API key in <button id="tosettings" class="inlinelink">Settings</button> — bring your own from any provider — for live, personalized coaching. Until then, the coach reads from your own data.</p>` : ''}
      ${threadBar}
      ${threadHist.length ? `<details class="coach-earlier"><summary class="muted small">Earlier in this chat (${threadHist.length}) — your coach still remembers these</summary><div class="chat earlier" style="margin-top:8px;">${threadHist.slice(-12).map(bubble).join('')}</div></details>` : ''}
      <div class="chat" id="chat" role="log" aria-live="polite" tabindex="-1">
        ${hasMsgs ? log.map(bubble).join('') : `<div class="bubble coach">${esc(greeting)}</div>`}
      </div>
      ${starters.length ? `<div id="starters" class="chiprow" style="margin:2px 0 10px;">${starters.map((c) => `<button class="chip starter" data-p="${esc(c.send || c.label)}">${esc(c.label)}</button>`).join('')}</div>` : ''}
      <div class="composer">
        <button class="btn amber" id="cmic" aria-label="Dictate your message" style="padding:12px 14px;">${micGlyph}</button>
        <input id="ci" placeholder="Ask your coach…" autocomplete="off" aria-label="Message your coach" />
        <button class="btn" id="send">Send</button>
      </div>
      ${hasMsgs ? `<p class="center" style="margin-top:8px;"><button class="btn ghost sm" id="archivethread" style="width:auto;">Archive this chat ↧</button> <span class="muted small">kept in History, not deleted</span></p>` : ''}
      ${micPrivacyNote()}
    </div>`;
  const tos = document.getElementById('tosettings');
  if (tos) tos.onclick = () => go('settings');
  app.querySelectorAll('[data-thread]').forEach((b) => b.onclick = () => {
    const key = b.dataset.thread;
    state.coachThread = key;
    renderCoach();
    announce(`Switched to ${threadChipLabel(key)} chat.`);
    const chip = app.querySelector('[data-thread].sel'); if (chip) chip.focus(); else focusViewHeading();
  });
  const threadsDetails = app.querySelector('details.coach-threads');
  if (threadsDetails) threadsDetails.addEventListener('toggle', () => { state.coachThreadsOpen = threadsDetails.open; });
  // Archive (not clear): move this chat's live messages into History so context is kept, and the
  // live thread starts fresh. (Days also auto-archive on their own; this is the manual version.)
  const arch = document.getElementById('archivethread');
  if (arch) arch.onclick = () => {
    const liveMsgs = coachThreadLog(p, tkey);
    if (liveMsgs.length) {
      p.coachHistory = p.coachHistory || {};
      p.coachHistory[tkey] = (p.coachHistory[tkey] || []).concat(liveMsgs);
      if (p.coachHistory[tkey].length > 400) p.coachHistory[tkey] = p.coachHistory[tkey].slice(-400);
      if (tkey === 'general') p.coachLog = []; else p.coachThreads[tkey] = [];
      save();
    }
    renderCoach();
    announce('Chat archived to History.');
    const chat = document.getElementById('chat'); if (chat) chat.focus(); else focusViewHeading();
  };
  const ci = document.getElementById('ci');
  const sendBtn = document.getElementById('send');
  attachMicButton(document.getElementById('cmic'), ci);
  let busy = false;
  const send = async () => {
    const text = ci.value.trim();
    if (!text || busy) return;
    busy = true;
    stopActiveMic(); // stop live dictation so no further phrase writes into the cleared input
    const st = document.getElementById('starters'); if (st) st.remove();
    ci.value = '';
    ci.disabled = true; sendBtn.disabled = true;
    appendBubble({ role: 'user', content: text });
    const typing = appendBubble({ role: 'assistant', content: '…', typing: true });
    let reply;
    try {
      reply = await Coach.coachReply(text, p, { log, focusDomain: isDomain ? tkey : null });
    } finally {
      busy = false;
    }
    if (typing) typing.remove();
    ci.disabled = false; sendBtn.disabled = false;
    if (state.profile !== p) return; // profile was reset/replaced mid-flight
    // Record the exchange in THIS thread only now — so coachReply saw clean prior history.
    log.push({ role: 'user', content: text, ts: Date.now() });
    log.push({ role: 'assistant', content: reply.text, ts: Date.now() });
    save();
    appendBubble({ role: 'assistant', content: reply.text, assertive: !!reply.escalated });
    if (document.getElementById('ci')) document.getElementById('ci').focus();
  };
  sendBtn.onclick = send;
  app.querySelectorAll('.starter').forEach((b) => {
    b.onclick = () => { ci.value = b.getAttribute('data-p'); send(); };
  });
  ci.onkeydown = (e) => { if (e.key === 'Enter') send(); };
}

// The History view — a read-only archive of earlier conversations, grouped by chat. Nothing here
// is lost: the live chats stay fresh each day, and the coach still draws on all of this as memory.
function renderCoachHistory(p) {
  const ch = p.coachHistory || {};
  const keys = Object.keys(ch).filter((k) => ch[k] && ch[k].length);
  const sections = keys.map((k) => {
    const label = k === 'general' ? 'General' : (getDomain(k) ? getDomain(k).name : k);
    return `<div class="card"><div class="eyebrow">${esc(label)}</div>
      <div class="chat earlier" style="margin-top:8px;">${ch[k].slice(-40).map(bubble).join('')}</div></div>`;
  }).join('');
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Coach', 'History', 'Earlier conversations, kept so nothing is lost. Your live chats stay fresh each day, and your coach still draws on these.', '<button class="btn ghost sm" id="backtocoach" style="width:auto;">← Today</button>')}
      ${sections || '<p class="muted small">No archived conversations yet.</p>'}
    </div>`;
  document.getElementById('backtocoach').onclick = () => { state.coachThread = 'general'; renderCoach(); announce('Back to today’s chat.'); focusViewHeading(); };
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
  if (typing) {
    // A calm, animated three-dot "composing" indicator — visually distinct from a real
    // message (no italic ellipsis pretending to be text). The dots are aria-hidden so the
    // polite chat log doesn't read them as content; a visually-hidden label (OUTSIDE the
    // hidden group, or it'd be hidden too) states the status once. Decays to three static
    // dots under reduced-motion — a recognizable "composing" glyph that still communicates.
    div.innerHTML = '<span class="typing-dots" aria-hidden="true"><span class="dot"></span><span class="dot"></span><span class="dot"></span></span><span class="sr-only">Coach is composing a reply</span>';
  } else {
    div.textContent = content;
  }
  chat.appendChild(div);
  // An explicit behavior:'smooth' overrides the CSS reduced-motion block (which
  // only governs the scroll-behavior property), so honor the preference in JS.
  // This fires on every chat message — including the crisis escalation directly
  // above — exactly where a vestibular-sensitive user can least tolerate motion.
  div.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'end' });
  return div;
}

// ---------------- tools ----------------
// Optional self-knowledge checks, lifted OUT of Settings (where they didn't belong) into
// their own bottom-tab. Each is a calm "mirror", adapted from an established research
// paradigm; none is part of the daily session. Handlers mirror the old Settings ones.
function renderTools() {
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Self-knowledge', 'Tools', "Optional mirrors and practices — each adapted from an established research paradigm. Separate from your daily session; do them anytime.")}

      <div class="eyebrow" style="margin:4px 0 10px;">Mirrors — see how your mind is working</div>

      <div class="card">
        <div class="row">${uiIcon('mirror')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Epistemic check</h2>
            <p class="muted small" style="margin:2px 0 0;">A two-minute mirror for a habit we all share — recognizing things we don’t actually know. Some items are made up on purpose.</p></div>
          <button class="btn ghost sm" id="toepistemic" style="width:auto;">Begin →</button>
        </div>
      </div>

      <div class="card">
        <div class="row">${uiIcon('target')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Calibration</h2>
            <p class="muted small" style="margin:2px 0 0;">A few questions where you answer and say how sure you are — a mirror for whether your confidence tracks what you actually know.</p></div>
          <button class="btn ghost sm" id="tocalibration" style="width:auto;">Begin →</button>
        </div>
      </div>

      <div class="eyebrow" style="margin:18px 0 10px;">Practices — train attention &amp; comprehension</div>

      <div class="card">
        <div class="row">${uiIcon('breath')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Breath counting</h2>
            <p class="muted small" style="margin:2px 0 0;">A few quiet minutes counting your own breaths — a mirror for attention and for noticing when the mind has wandered.</p></div>
          <button class="btn ghost sm" id="tobreath" style="width:auto;">Begin →</button>
        </div>
      </div>

      <div class="card">
        <div class="row">${uiIcon('book')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Deep reading</h2>
            <p class="muted small" style="margin:2px 0 0;">Read a short passage, then tell true restatements from clever near-misses — a measure of how accurately you take in what you read.</p></div>
          <button class="btn ghost sm" id="tosvt" style="width:auto;">Begin →</button>
        </div>
      </div>

      <div class="card">
        <div class="row">${uiIcon('breath')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Body scan</h2>
            <p class="muted small" style="margin:2px 0 0;">A few minutes moving attention slowly through the body, listening to what it’s telling you — the body as a place of knowing, not a problem to fix. Optional, private, never scored.</p></div>
          <button class="btn ghost sm" id="tobody" style="width:auto;">Begin →</button>
        </div>
      </div>

      <p class="muted small center" style="margin-top:6px;">A mirror you can see the basis of — never a verdict. See <button class="btn ghost sm" id="tomethods2" style="width:auto; display:inline; padding:0; border:none; color:var(--accent); font-weight:600;">the science behind them →</button></p>
    </div>`;
  const tec = document.getElementById('toepistemic'); if (tec) tec.onclick = () => { state.epistemic = null; go('epistemiccheck'); };
  const tcal = document.getElementById('tocalibration'); if (tcal) tcal.onclick = () => { state.calib = null; go('calibration'); };
  const tbr = document.getElementById('tobreath'); if (tbr) tbr.onclick = () => { state.bct = null; go('breathcount'); };
  const tsvt = document.getElementById('tosvt'); if (tsvt) tsvt.onclick = () => { state.svt = null; go('svt'); };
  const tbody = document.getElementById('tobody'); if (tbody) tbody.onclick = () => startGuidedSession('embodiment');
  const tm2 = document.getElementById('tomethods2'); if (tm2) tm2.onclick = () => go('methods');
}

// ---------------- settings ----------------
function renderSettings() {
  const p = state.profile;
  const prov = providerFor(p.settings.provider);
  const keyHint = { anthropic: 'sk-ant-…', openai: 'sk-…', gemini: 'AIza…', openrouter: 'sk-or-…' }[prov.id] || 'your API key';
  const res = p.research || {};
  const rsum = summarizeResearch(res.queue || []);
  const rel = p.release || {};
  app.innerHTML = `
    <div class="fade-in">
      ${viewHead('Your account & data', 'Settings', '')}

      <div class="card">
        <h2 style="font-size:1.05rem;">Your name</h2>
        <div class="field">
          <input id="name" aria-label="Your name" value="${esc(p.settings.name || '')}" placeholder="What should the coach call you?" />
        </div>
      </div>

      <div class="card">
        <h2 style="font-size:1.05rem;">Appearance</h2>
        <p class="muted small" style="margin:2px 0 10px;">Forma follows your device by default. Dark is calm and easy on the eyes at night.</p>
        <div class="segmented" role="group" aria-label="Appearance">
          ${[['system', 'System'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => {
            const on = currentTheme() === v;
            return `<button class="seg ${on ? 'on' : ''}" data-theme-set="${v}" aria-pressed="${on}">${l}</button>`;
          }).join('')}
        </div>
      </div>

      ${state.demo ? '' : `<div class="card">
        <div class="row">
          ${uiIcon('dove')}
          <div style="flex:1;">
            <h2 style="font-size:1.05rem; margin:0;">Spiritual Life track</h2>
            <p class="muted small" style="margin:2px 0 0;">Optional, faith-based. Adds a spiritual-formation scale, daily reflections, and a contemplative-silence practice. Kept private — never shown to any employer view.</p>
          </div>
          <button class="opt ${p.settings.faithTrack ? 'selected' : ''}" id="faith" aria-pressed="${!!p.settings.faithTrack}" aria-label="Spiritual Life track" style="width:auto; padding:8px 16px; font-weight:700;">${p.settings.faithTrack ? 'On' : 'Off'}</button>
        </div>
      </div>`}

      <div class="card">
        <h2 style="font-size:1.05rem;">Live AI coaching</h2>
        <p class="muted small">Optional. Bring your own API key from any supported provider to turn on live, personalized coaching. Your key is stored only in this browser and is sent only to the provider you pick — never to a Forma server (there isn't one), and never with your Spiritual Life content.</p>
        <div class="field">
          <label for="provider">Provider</label>
          <select id="provider">
            ${Object.values(PROVIDERS).map((pv) => `<option value="${esc(pv.id)}" ${prov.id === pv.id ? 'selected' : ''}>${esc(pv.label)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="key">${esc(prov.label)} API key</label>
          <input id="key" type="password" value="${esc(p.settings.apiKey || '')}" placeholder="${esc(keyHint)}" />
        </div>
        <div class="field">
          <label for="model">Model</label>
          <select id="model">
            ${prov.models.map((m) => `<option value="${esc(m)}" ${p.settings.model === m ? 'selected' : ''}>${esc(m)}</option>`).join('')}
          </select>
        </div>
        <div class="row" style="gap:8px; flex-wrap:wrap;">
          <button class="btn sm" id="savekey">Save</button>
          <button class="btn ghost sm" id="testkey">Test connection</button>
          <button class="btn ghost sm" id="howkey" aria-expanded="false" aria-controls="howkeybox" style="width:auto;">How to get a key →</button>
          <span id="saved" class="trendpill up" style="display:none;">saved ${uiIcon('check', 'tpico')}</span>
        </div>
        <div id="howkeybox" hidden style="margin-top:10px; background:var(--accent-soft); border-radius:12px; padding:12px;">
          <ol class="muted small" style="margin:0 0 8px; padding-left:18px;">
            ${prov.howTo.steps.map((st) => `<li>${esc(st)}</li>`).join('')}
          </ol>
          <a class="btn ghost sm" href="${esc(prov.howTo.url)}" target="_blank" rel="noopener noreferrer" style="width:auto; display:inline-block;">Open the ${esc(prov.label)} console →</a>
        </div>
        <p id="testresult" class="small" role="status" style="margin-top:10px;"></p>
      </div>

      <div class="card">
        <div class="row">${uiIcon('science')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">The science behind your measures</h2>
            <p class="muted small" style="margin:2px 0 0;">The research-backed paradigm each capacity’s exercises adapt — measurement you can see the basis of.</p></div>
          <button class="btn ghost sm" id="tomethods" style="width:auto;">View →</button>
        </div>
      </div>

      <div class="card">
        <div class="row">${uiIcon('building')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">For employers</h2>
            <p class="muted small" style="margin:2px 0 0;">A preview of the team dashboard — aggregated development signals, never individual raw data.</p></div>
          <button class="btn ghost sm" id="toteam" style="width:auto;">Preview →</button>
        </div>
      </div>

      ${state.demo ? '' : `<div class="card">
        <div class="row">${uiIcon('spark')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Sample profile</h2>
            <p class="muted small" style="margin:2px 0 0;">${esc(DEMO_SPEC.settingsHelp)}</p></div>
          <button class="btn ghost sm" id="opendemo" style="width:auto;">${esc(DEMO_SPEC.settingsLabel)} →</button>
        </div>
      </div>`}

      <div class="card">
        <h2 style="font-size:1.05rem;">Your data</h2>
        <p class="muted small">Everything Forma stores about you lives on this device — no server, no account, nothing uploaded. You own it: back it up, and restore it on any device. (Clearing your browser data erases it, so keep an export.)</p>
        <p class="muted small" style="margin-top:8px;">Two things do leave the device, only when you choose them: the live coach sends your message to the AI provider you picked, using your own key (never your Spiritual Life track), and voice dictation uses your browser’s speech service — in some browsers (e.g. Chrome) that sends the audio to a vendor to transcribe. Type, and stay offline, to keep everything fully on-device.</p>
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
        <div class="row">${uiIcon('mail')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Reminders &amp; encouragement</h2>
            <p class="muted small" style="margin:2px 0 0;">A gentle nudge to come back — added to your own calendar, so it works on any device and nothing leaves this one.</p>
          </div>
        </div>
        <div class="row" style="gap:10px; margin-top:12px; flex-wrap:wrap; align-items:flex-end;">
          <div class="field" style="margin:0;"><label for="remindtime">Time</label><input id="remindtime" type="time" value="08:00" style="width:auto;" /></div>
          <div class="field" style="margin:0;"><label for="remindcadence">Days</label><select id="remindcadence"><option value="daily">Every day</option><option value="weekdays">Weekdays</option></select></div>
          <button class="btn sm" id="addreminder" style="width:auto;">Add to my calendar →</button>
        </div>
        <p class="muted small" style="margin:8px 0 0;">One tap downloads a recurring reminder your calendar app (Apple / Google / Outlook) handles. Forma builds it on this device — it never sends anything, and there's no account.</p>
        <details style="margin-top:14px;">
          <summary class="muted small" style="cursor:pointer;">Get notified when cloud features ship (optional email)</summary>
          <div class="field" style="margin-top:10px;">
            <label>Email</label>
            <input id="contactemail" type="email" value="${esc((p.contact && p.contact.email) || '')}" placeholder="you@example.com" />
          </div>
          <div class="row" style="gap:8px;">
            <button class="btn sm" id="savecontact">${p.contact && p.contact.consent ? 'Update' : 'Opt in'}</button>
            ${p.contact && p.contact.consent ? `<button class="btn ghost sm" id="withdrawcontact">Remove my email</button>` : ''}
            <span id="contactsaved" class="trendpill up" style="display:none;">saved ${uiIcon('check', 'tpico')}</span>
          </div>
          <p class="muted small" style="margin-top:6px;">Stored <strong>only on this device</strong> — never sent anywhere (no server exists yet), and never linked to the anonymous research data.</p>
          <p id="contacterr" class="small" style="margin-top:8px; color:var(--red); display:none;"></p>
        </details>
      </div>

      <div class="card">
        <div class="row">${uiIcon('people')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Share results with an employer</h2>
            <p class="muted small" style="margin:2px 0 0;">Optional. Org sharing isn’t built yet — opt in now and your authorization, plus a dated copy of your Capacity Snapshot, is stored <strong>only on this device</strong> and never sent anywhere, until it ships. It would release only your snapshot (capacity scores + confidence) — <strong>never</strong> your reflections, coach chats, or Spiritual Life.</p>
            <p class="muted small" style="margin:6px 0 0;"><strong>This is entirely your choice.</strong> Forma never requires it, no one can turn it on for you, and sharing or not has no effect on your use of Forma.</p>
          </div>
        </div>
        ${rel.consent ? `
        <p class="muted small" style="margin-top:10px;">Authorized for <strong>${esc(rel.recipient)}</strong>${rel.snapshot && rel.snapshot.generated ? ` · snapshot dated ${esc(rel.snapshot.generated)}` : ''}. Withdrawing <strong>deletes</strong> this authorization and the stored copy.</p>
        <button class="btn ghost sm" id="withdrawrelease" style="margin-top:8px;">Withdraw authorization</button>
        ` : `
        <div class="field" style="margin-top:10px;">
          <label>Who are you authorizing?</label>
          <input id="releaserecipient" type="text" maxlength="120" placeholder="e.g. Acme Corp / my manager" />
        </div>
        <button class="btn sm" id="optrelease" style="width:auto;">Authorize</button>
        <p id="releaseerr" class="small" style="margin-top:8px; color:var(--red); display:none;"></p>
        `}
      </div>

      <div class="card">
        <div class="row">${uiIcon('science')}
          <div style="flex:1;"><h2 style="font-size:1.05rem; margin:0;">Anonymous research</h2>
            <p class="muted small" style="margin:2px 0 0;">${res.consent ? 'On — you’re sharing anonymous results to help improve Forma and ground its validity.' : 'Off — nothing is collected. You can help improve Forma by sharing de-identified results.'}</p></div>
          <button class="opt ${res.consent ? 'selected' : ''}" id="researchtoggle" aria-pressed="${!!res.consent}" style="width:auto; padding:8px 16px; font-weight:700;">${res.consent ? 'On' : 'Off'}</button>
        </div>
        ${res.consent ? `
        <p class="muted small" style="margin-top:10px;">You’ve shared <strong>${rsum.measured}</strong> anonymous result${rsum.measured === 1 ? '' : 's'} across ${rsum.days} day${rsum.days === 1 ? '' : 's'}. Each is a score and which option you chose, dated to the day — <strong>never</strong> your name, anything you wrote, or your Spiritual Life.</p>
        ${rsum.domains.length ? `<table class="snaptable" style="margin-top:8px;"><tbody>${rsum.domains.map((d) => `<tr><td>${esc(getDomain(d.key) ? getDomain(d.key).name : d.key)}</td><td class="muted small" style="text-align:right;">${d.n} shared</td><td class="snapsc">${d.mean}</td></tr>`).join('')}</tbody></table>` : `<p class="muted small" style="margin-top:6px;">No results shared yet — finish a session and your de-identified scores will appear here.</p>`}
        ${(() => {
          // Test-retest CONSISTENCY of the person's own repeated scores — the reliability
          // primitive (how steady, not how high, not how fast-growing). Only shows a domain
          // once it has ≥4 measured re-tests; a frozen/exhausted bank is labeled recall, per
          // the snapshot.js honesty rule. (v168)
          const stab = rsum.domains
            .map((d) => ({ d, s: domainStability(res.queue || [], d.key), fr: scaleFreshness(p, d.key) }))
            .filter((x) => x.s.ready);
          if (!stab.length) return '';
          return `<p class="small" style="margin:14px 0 2px;"><strong>How consistent your scores are</strong></p>
        <table class="snaptable"><tbody>${stab.map((x) => `<tr><td>${esc(getDomain(x.d.key) ? getDomain(x.d.key).name : x.d.key)}</td><td class="muted small" style="text-align:right;">${x.fr && x.fr.frozen ? 'reflects recall — items used up' : 'typical swing'}</td><td class="snapsc">±${x.s.meanAbsStep}</td></tr>`).join('')}</tbody></table>
        <p class="muted small" style="margin-top:6px;">This shows how steady your repeated scores are — not whether they’re growing, and not that they measure the right thing. A small swing can also mean you’re getting familiar with the task.</p>`;
        })()}
        <p class="muted small" style="margin-top:8px;">Per-question difficulty and norms come from the pooled, many-person dataset — not your device. Turning this off <strong>deletes everything you’ve shared</strong>.</p>
        ` : ''}
      </div>

      ${(() => {
        // Support Forma — pay-what-you-can PATRONAGE, never a paywall. Forma is free; nothing is
        // ever locked behind a gift. Dignified + tucked at the bottom of Settings (never a nag).
        // No in-app payments: this links OUT to a giving page Sean owns. SEAN: paste your giving
        // URL here (Open Collective recommended — its public ledger fits "show where it goes")
        // to turn the Support button live. Empty string = a calm "opens soon" state.
        const GIVE_URL = '';
        const goes = [
          'keeps Forma honest and independent — no ads, no investors pulling strings',
          'funds the research that tests whether the measures actually work',
          'keeps it free and open to anyone who needs it',
          'builds what’s next, with the people it’s for',
        ];
        return `<div class="card">
        <h2 style="font-size:1.05rem;">Support Forma</h2>
        <p class="muted small" style="margin:2px 0 10px;">Forma is built among the people it’s for — and kept honest by the people who believe in it, not by advertisers or investors. It’s free, and it always will be. If it’s helped you, you can help keep it that way.</p>
        <p class="small" style="margin:0 0 4px;"><strong>Where your gift goes</strong></p>
        <ul class="muted small" style="margin:0 0 12px; padding-left:18px; line-height:1.6;">${goes.map((g) => `<li>${g}</li>`).join('')}</ul>
        ${GIVE_URL
          ? `<a class="btn" href="${esc(GIVE_URL)}" target="_blank" rel="noopener noreferrer">Support Forma →</a>
        <p class="muted small center" style="margin:10px 0 0;">Give once or monthly — whatever you can. Completely optional; nothing in Forma is ever locked behind a gift, and we show you where every dollar goes.</p>`
          : `<p class="muted small" style="margin:0;">A transparent home for giving is opening soon. Nothing in Forma is ever locked behind a gift — this is patronage, freely given, with a public ledger so you can see exactly where it goes.</p>`}
      </div>`;
      })()}

      <p class="muted small center">Forma · the capacities a machine can’t keep for you.</p>
    </div>`;

  document.getElementById('name').onchange = (e) => { p.settings.name = e.target.value.trim(); save(); };
  [...document.querySelectorAll('[data-theme-set]')].forEach((b) => {
    b.onclick = () => { setTheme(b.getAttribute('data-theme-set')); render(); };
  });
  const tt = document.getElementById('toteam'); if (tt) tt.onclick = () => go('team');
  const tm = document.getElementById('tomethods'); if (tm) tm.onclick = () => go('methods');
  const od = document.getElementById('opendemo'); if (od) od.onclick = enterDemo;
  // The faith-track card is hidden in demo (the interior wall must stay closed on a
  // sample), so the toggle may not exist — bind null-safely.
  const fb = document.getElementById('faith');
  if (fb) fb.onclick = () => {
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
  document.getElementById('howkey').onclick = (e) => {
    const box = document.getElementById('howkeybox');
    if (box) box.hidden = !box.hidden;
    e.currentTarget.setAttribute('aria-expanded', box && !box.hidden ? 'true' : 'false');
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
    if (!p.settings.apiKey) { r.style.color = 'var(--red)'; r.textContent = 'Add a key first.'; announce('Add a key first.'); return; }
    r.style.color = 'var(--ink-faint)';
    r.textContent = 'Testing…';
    announce('Testing the connection…');
    try {
      const txt = await Coach.complete(p, { system: 'Reply with exactly: ok', messages: [{ role: 'user', content: 'ping' }], maxTokens: 8 });
      r.style.color = 'var(--green)';
      const okMsg = txt ? `Connected — live coaching is on (model: ${p.settings.model}).` : 'Connected.';
      r.textContent = `✓ ${okMsg}`;
      announce(okMsg);
    } catch (e) {
      r.style.color = 'var(--red)';
      const errMsg = Coach.friendlyApiError(e.message);
      r.textContent = `✗ ${errMsg}`;
      announce(`Connection failed: ${errMsg}`);
    }
  };
  // Calendar reminder: build the .ics on-device and hand it to the user's own calendar app.
  const addRem = document.getElementById('addreminder');
  if (addRem) addRem.onclick = () => {
    const time = (document.getElementById('remindtime') || {}).value || '08:00';
    const cadence = (document.getElementById('remindcadence') || {}).value || 'daily';
    const blob = new Blob([buildReminderIcs({ time, cadence })], { type: 'text/calendar' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'forma-reminder.ics';
    a.click();
    announce(`${reminderSummary(time, cadence)} Open it to add it to your calendar.`);
  };
  document.getElementById('savecontact').onclick = () => {
    if (blockedInDemo('manage reminders for')) return;
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
  if (withdrawC) withdrawC.onclick = () => { if (blockedInDemo('manage reminders for')) return; state.profile = Contact.clearContact(p); save(); render(); };
  // Release-of-information (employer): the individual's own choice. Authorize freezes
  // a copy of the interior-excluded snapshot for a NAMED recipient; withdraw deletes it.
  const optR = document.getElementById('optrelease');
  if (optR) optR.onclick = () => {
    if (blockedInDemo('authorize a release of')) return;
    const err = document.getElementById('releaseerr');
    const recipient = (document.getElementById('releaserecipient').value || '').trim();
    try {
      state.profile = Release.setRelease(p, { recipient, snapshot: buildSnapshot(p) });
      save(); render();
      announce('Release authorized — stored on this device only.');
    } catch (e) { if (err) { err.textContent = e.message; err.style.display = 'block'; } }
  };
  const wR = document.getElementById('withdrawrelease');
  if (wR) wR.onclick = () => {
    if (blockedInDemo('authorize a release of')) return;
    state.profile = Release.clearRelease(p); save(); render();
    announce('Authorization withdrawn and deleted.');
  };
  // Anonymous-research management: view what's shared + turn on / withdraw (which
  // deletes the queue). Re-renders directly, so announce + refocus (v157 pattern).
  const rt = document.getElementById('researchtoggle');
  if (rt) rt.onclick = () => {
    if (blockedInDemo('change research sharing for')) return;
    const turningOn = !(p.research && p.research.consent);
    Research.setConsent(p, turningOn); // off → also deletes the shared queue
    save(); render();
    announce(turningOn ? 'Anonymous research sharing on.' : 'Sharing off — your shared data was deleted.');
    const again = document.getElementById('researchtoggle'); if (again) again.focus(); else focusViewHeading();
  };
  document.getElementById('export').onclick = () => { if (blockedInDemo('export')) return; downloadBackup(); };
  document.getElementById('import').onclick = () => { if (blockedInDemo('restore')) return; document.getElementById('importfile').click(); };
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
    // Hard guard: this writes localStorage DIRECTLY, bypassing save()'s demo
    // no-op. In the sample it would erase the visitor's REAL profile.
    if (blockedInDemo('erase')) return;
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

// ---------------- Welcome promo (shows until they start) ----------------
// A calm motion intro for people who HAVEN'T started yet — it comes up on EVERY visit
// until they begin (start onboarding / build a baseline). Once they've started or
// onboarded, it never shows again. (Sean's call: keep inviting the unconverted, stop
// the moment they engage — so it's intentionally NOT dismiss-once anymore.) It lives
// OUTSIDE #app (which render() re-paints wholesale) so a view swap can't disturb it,
// and it reveals the real welcome screen beneath on dismiss.
(function maybeShowPromo() {
  // "Started" = finished onboarding (baseline) OR mid-onboarding with real progress
  // (resumed quick-check step, or an in-flight coach conversation). Any of these → no promo.
  const onboarded = !!(state.profile && state.profile.baseline);
  const inProgress = !!(state.onboard && (state.onboard.step > 0 || state.onboard.mode === 'conversation'))
    || !!(state.diag && Array.isArray(state.diag.messages) && state.diag.messages.length > 0);
  if (onboarded || inProgress) return;

  // Calm pacing: each scene holds ~8s before auto-advancing. The moment the
  // person takes manual control (an arrow / a key), auto-advance stops for good
  // so it never fights them — they drive from there.
  const SCENE_MS = 8000;
  // Show ALL the capacities — same source as the welcome pillrow and the science page,
  // so a visitor never sees a different count in the promo than on the page behind it.
  const caps = DOMAINS.map((d) => `<span class="pill">${d.icon} ${esc(d.name)}</span>`).join('');
  // Each scene is a builder → innerHTML for the stage. The last scene is the CTA
  // and does NOT auto-advance; it waits for the person to choose.
  const scenes = [
    () => `<div class="promo-eyebrow">Forma</div><p class="promo-line">AI keeps getting better at the work.</p>`,
    () => `<p class="promo-line">But who do you become while it does?</p>`,
    () => `<div class="promo-mark">${formaMark}</div><div class="promo-name">Forma</div><p class="promo-tag">train what AI can’t replace</p>`,
    () => `<div class="promo-eyebrow">What Forma trains</div><div class="promo-pills">${caps}</div>`,
    () => `<p class="promo-line" style="font-size:1.35rem;">A few minutes a day.</p><p class="promo-tag">Measured. Trained. Never a diagnosis.</p>`,
  ];
  const last = scenes.length - 1;
  const reduce = prefersReducedMotion();

  const overlay = document.createElement('div');
  overlay.className = 'promo-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Welcome to Forma');
  overlay.innerHTML = `
    <div class="promo-card">
      <div class="promo-rail" aria-hidden="true">${scenes.map(() => '<span></span>').join('')}</div>
      <button class="promo-close" id="promoClose" aria-label="Close">×</button>
      <button class="promo-nav promo-prev" id="promoPrev" aria-label="Previous" hidden>‹</button>
      <button class="promo-nav promo-next" id="promoNext" aria-label="Next">›</button>
      <div class="promo-stage" id="promoStage"></div>
      <div class="promo-foot">
        <button class="promo-sound" id="promoSound"><span class="promo-sound-ico" aria-hidden="true">▶</span> Play with sound</button>
        <span class="promo-foot-sp"></span>
        <button class="promo-skip" id="promoSkip">Skip intro</button>
        <span class="promo-cta" id="promoCta" hidden>
          <button class="btn amber" id="promoBegin">Begin →</button>
        </span>
      </div>
      <audio id="promoAudio" src="./forma-promo-vo.mp3" preload="none"></audio>
    </div>`;
  document.body.appendChild(overlay);
  // Move focus INTO the modal so keyboard/AT users aren't stranded on the page behind it.
  try { overlay.querySelector('#promoClose').focus(); } catch (e) { /* noop */ }

  const stage = overlay.querySelector('#promoStage');
  const rail = [...overlay.querySelectorAll('.promo-rail span')];
  const cta = overlay.querySelector('#promoCta');
  const skip = overlay.querySelector('#promoSkip');
  const prevBtn = overlay.querySelector('#promoPrev');
  const nextBtn = overlay.querySelector('#promoNext');
  // Narration (Sean's cloned-voice VO). Browsers block autoplay WITH sound, so the
  // popup opens as the silent motion carousel + a "Play with sound" button; tapping it
  // plays the VO and drives the scenes off the audio's own clock (perfect sync, no drift).
  const audio = overlay.querySelector('#promoAudio');
  const soundBtn = overlay.querySelector('#promoSound');
  // Scene start times (seconds) within the ~47s VO — each scene is on screen while its
  // line is spoken. Tuned to the Part 3 script's beats.
  const CUES = [0, 10, 20, 29, 40];
  const ICO_PLAY = '<span class="promo-sound-ico" aria-hidden="true">▶</span> Play with sound';
  const ICO_PAUSE = '<span class="promo-sound-ico" aria-hidden="true">❙❙</span> Pause';
  const ICO_REPLAY = '<span class="promo-sound-ico" aria-hidden="true">↻</span> Replay with sound';
  let i = -1, timer = null, manual = false, audioMode = false;
  const sceneForTime = (t) => { let s = 0; for (let k = 0; k < CUES.length; k++) if (t >= CUES[k]) s = k; return s; };
  const pauseAudio = () => { try { audio.pause(); } catch (e) {} };

  function dismiss() {
    if (timer) { clearTimeout(timer); timer = null; }
    pauseAudio();
    document.removeEventListener('keydown', onKey, true);
    overlay.remove();
    // Reveal the welcome screen beneath, focused for keyboard/AT users. The promo
    // is NOT marked seen — it returns on the next visit until they actually start.
    try { app.focus(); } catch (e) {}
  }
  // n = scene index (clamped); byUser = true when the person navigated, which
  // pins manual mode (auto-advance off) and silences the progress-fill animation.
  function show(n, byUser) {
    if (byUser) manual = true;
    i = Math.max(0, Math.min(last, n));
    const onLast = i >= last;
    const live = !reduce && !manual; // timed sequence still running?
    // Retrigger the fade by toggling the class off→on.
    stage.classList.remove('fade'); void stage.offsetWidth;
    stage.style.setProperty('--promo-dur', SCENE_MS + 'ms');
    stage.innerHTML = scenes[i]();
    stage.classList.add('fade');
    rail.forEach((s, idx) => { s.classList.toggle('done', idx < i); s.classList.toggle('now', idx === i && !onLast && live); });
    cta.hidden = !onLast;
    skip.hidden = onLast;
    prevBtn.hidden = i <= 0;   // arrows: back hidden on the first scene,
    nextBtn.hidden = onLast;   // next hidden on the CTA scene
    if (timer) { clearTimeout(timer); timer = null; }
    if (!onLast && live) timer = setTimeout(() => show(i + 1, false), SCENE_MS);
  }
  function onKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); dismiss(); }
    else if (e.key === 'Tab') {
      // Keep Tab cycling inside the modal (aria-modal claims the page beneath is inert). The
      // visible button set changes per scene, so filter by actual visibility (offsetParent).
      const f = [...overlay.querySelectorAll('button')].filter((b) => !b.disabled && b.offsetParent !== null);
      if (!f.length) return;
      const first = f[0], lastEl = f[f.length - 1], active = document.activeElement;
      if (e.shiftKey && (active === first || !overlay.contains(active))) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && (active === lastEl || !overlay.contains(active))) { e.preventDefault(); first.focus(); }
    }
    else if ((e.key === 'ArrowRight' || e.key === ' ') && i < last) { e.preventDefault(); show(i + 1, true); }
    else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); show(i - 1, true); }
  }

  overlay.querySelector('#promoClose').onclick = dismiss;
  overlay.querySelector('#promoBegin').onclick = dismiss; // reveals the welcome CTA beneath
  // Manual navigation pauses the narration so picture and voice never desync.
  prevBtn.onclick = () => { pauseAudio(); show(i - 1, true); };
  nextBtn.onclick = () => { pauseAudio(); show(i + 1, true); };
  skip.onclick = () => { pauseAudio(); show(last, true); };
  overlay.addEventListener('click', (e) => { if (e.target === overlay) dismiss(); }); // backdrop
  document.addEventListener('keydown', onKey, true);

  // Narration: start from the top (resetting the carousel), then let the audio's clock
  // drive the scenes. Tapping again pauses/resumes; after it ends, the button replays.
  function startNarration() {
    manual = true;            // kill the silent auto-advance for good — audio drives now
    audioMode = true;
    if (timer) { clearTimeout(timer); timer = null; }
    try { audio.currentTime = 0; } catch (e) {}
    show(0, false);           // manual is already true, so no timer / no progress-fill
    audio.play().catch(() => { /* blocked or missing file → stay in silent mode */ });
  }
  soundBtn.onclick = () => {
    if (audio.paused) {
      if (!audioMode || audio.ended || audio.currentTime === 0) startNarration();
      else audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  };
  audio.addEventListener('timeupdate', () => {
    if (!audioMode) return;
    const s = sceneForTime(audio.currentTime);
    if (s !== i) show(s, false); // manual already pinned → pure scene swap, audio-timed
  });
  audio.addEventListener('play', () => { audioMode = true; manual = true; if (timer) { clearTimeout(timer); timer = null; } soundBtn.innerHTML = ICO_PAUSE; });
  audio.addEventListener('pause', () => { if (!audio.ended) soundBtn.innerHTML = ICO_PLAY; });
  audio.addEventListener('ended', () => { show(last, false); soundBtn.innerHTML = ICO_REPLAY; });
  audio.addEventListener('error', () => { soundBtn.hidden = true; }); // no audio → silent promo only

  // Reduced motion → skip the timed sequence, land on the CTA scene immediately.
  show(reduce ? last : 0, false);
})();

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

// Opportunistic, fails-silent flush of the de-identified research queue — strictly
// post-render (render() already ran), fire-and-forget, never blocks paint. No-op
// unless an endpoint is configured AND consent is on AND we're online (server-ready;
// inert today since no endpoint exists). The flush itself sends ONLY the allow-listed
// de-identified payload (buildBatch) — never contact/release/PII.
(function flushResearchAtBoot() {
  try {
    const p = state.profile;
    if (!p || !p.settings) return;
    const endpoint = p.settings.researchEndpoint;
    if (!endpoint || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    if (!p.research || !p.research.consent) return;
    Research.flushResearch(p, { endpoint, save }).catch(() => {});
  } catch (e) { /* noop */ }
})();
