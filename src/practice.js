// practice.js — the TRAIN side, made daily. "Today's Practice" is an evidence-based, REAL-LIFE
// practice the person adapts (fill-in-the-blank) and does in their day. This is the honest form of
// training: real-life practice of evidence-based habits transfers; in-app drilling largely does
// not. Content is grounded in the growth guide + literature (forma-researcher-shaped) and reuses
// the implementation-intention machinery (composeCommitment) + coping plans already in the app.
//
// Each capacity carries a CADENCE:
//   'daily'       — genuinely recurs daily → framed as a morning "Today I'll …" intention.
//   'situational' — event-triggered (a decision, a conversation) → framed as an armed
//                   "Next time X, I'll Y" plan. A day with no trigger is NOT a missed day.
// Honesty: these never "raise your score"; the person owns/edits the blanks; an optional WOOP
// obstacle line (Oettingen) upgrades a plan to mental-contrasting. No effect-size numbers in copy.

export const PRACTICE = {
  attention:          { cadence: 'daily',       action: 'single-task it — let the interruption wait and stay on the task', cue: 'a notification pulls at me',                why: 'Removing interruption cues protects sustained attention; task-switching carries real resumption costs.' },
  memory:             { cadence: 'daily',       action: 'close the source and recall the key points from memory first',    cue: 'I finish a meeting or a chapter',          why: 'The testing effect — retrieval beats rereading for durable retention (Roediger & Karpicke).' },
  reading:            { cadence: 'situational', action: 'put it in my own words before moving on',                         cue: 'I finish a section of a demanding read',   why: 'Self-explanation deepens comprehension and integration (Dunlosky).' },
  persistence:        { cadence: 'situational', action: 'do it for two more minutes before I stop',                        cue: 'I hit the urge to quit',                   why: 'Pre-deciding the cue→action link reliably improves follow-through (Gollwitzer & Sheeran).' },
  judgment:           { cadence: 'situational', action: 'ask why my first take could be wrong, and list reasons against it', cue: 'I’m about to make a call that matters',    why: '“Consider the opposite” reliably reduces overconfidence and anchoring (Larrick).' },
  ai_autonomy:        { cadence: 'situational', action: 'draft my own answer first, then use AI to check or extend it',    cue: 'I reach for AI on a task',                 why: 'Doing the effort yourself is what keeps the capability yours — the formation bet (a frame, not a measured claim).' },
  presence:           { cadence: 'situational', action: 'reflect what I hear before offering any solution',                cue: 'someone shares a struggle',                why: 'Resisting the “righting reflex” deepens rapport (Motivational Interviewing).' },
  communication:      { cadence: 'situational', action: 'check it — “sounds like that landed hard?” — and let them correct me', cue: 'I think I know what someone feels',     why: 'Imagining another’s view didn’t improve accuracy across 25 studies; asking them did (Eyal, Steffel & Epley).' },
  emotion_regulation: { cadence: 'situational', action: 'put the feeling into specific words before I react',              cue: 'a strong feeling rises',                   why: 'Affect labeling dampens reactivity — “name it to tame it” (Lieberman).' },
  values:             { cadence: 'daily',       action: 'do one small action that expresses a value I care about',         cue: 'I plan my day',                            why: 'Consistent values-aligned action builds coherence and purpose over time (ACT).' },
  interior:           { cadence: 'daily',       action: 'hold a few minutes of intentional silence or prayer',             cue: 'a set time today',                         why: 'Regular contemplative practice supports attention and well-being; consistency matters more than length.' },
};

// The daily practice template for a capacity, or null if none.
export function practiceFor(domainId) {
  return PRACTICE[domainId] || null;
}
