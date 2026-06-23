// reminder.js — a LOCAL, privacy-first return loop: generate a recurring calendar
// reminder (.ics) the user adds to their own Apple/Google/Outlook calendar in one tap.
//
// Why not a web push notification? A truly local notification that fires when the PWA is
// CLOSED isn't reliable on the web — Push needs a server, the Notification Triggers API is
// Chromium-only, and iOS PWAs barely support notifications. A calendar event reminds the
// person on ANY device, via software they already trust, and NOTHING leaves this device:
// Forma builds the .ics client-side and hands it to the user's own calendar. Pure + testable.

const PAD = (n) => String(n).padStart(2, '0');
// Floating local-time stamp (no TZ/no Z) — calendars read it in the user's own local time,
// which is exactly what a "remind me at 8am" daily reminder wants, with no VTIMEZONE complexity.
function localStamp(d) {
  return `${d.getFullYear()}${PAD(d.getMonth() + 1)}${PAD(d.getDate())}T${PAD(d.getHours())}${PAD(d.getMinutes())}00`;
}
function utcStamp(d) {
  return `${d.getUTCFullYear()}${PAD(d.getUTCMonth() + 1)}${PAD(d.getUTCDate())}T${PAD(d.getUTCHours())}${PAD(d.getUTCMinutes())}${PAD(d.getUTCSeconds())}Z`;
}

// Build the .ics text. opts: { time:'HH:MM' (local), cadence:'daily'|'weekdays', now:Date, url }.
// First occurrence = today at the chosen time if it's still ahead, else tomorrow.
export function buildReminderIcs(opts = {}) {
  const { time = '08:00', cadence = 'daily', now = new Date(), url = 'https://drseantobin.github.io/forma' } = opts;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(time));
  const hh = m ? Math.min(23, Math.max(0, parseInt(m[1], 10))) : 8;
  const mm = m ? Math.min(59, Math.max(0, parseInt(m[2], 10))) : 0;
  const start = new Date(now.getTime());
  start.setHours(hh, mm, 0, 0);
  if (start.getTime() <= now.getTime()) start.setDate(start.getDate() + 1); // first hit is in the future
  const rrule = cadence === 'weekdays' ? 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR' : 'FREQ=DAILY';
  const uid = `forma-${localStamp(start)}-${cadence}@forma.local`;
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Forma//Formation Reminder//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${localStamp(start)}`,
    'DURATION:PT5M',
    `RRULE:${rrule}`,
    'SUMMARY:Forma — a few minutes of formation',
    `DESCRIPTION:Train what AI can't replace. Open Forma: ${url}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    'DESCRIPTION:Forma',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

// A friendly summary of what the reminder will do, for the UI.
export function reminderSummary(time = '08:00', cadence = 'daily') {
  const when = cadence === 'weekdays' ? 'every weekday' : 'every day';
  return `A reminder ${when} at ${time}, added to your own calendar.`;
}
