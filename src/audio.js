// audio.js — tiny Web Audio chime generator for the contemplation timer.
// No audio files ship or load: every tone is synthesized on the fly. The point
// is to let a person close their eyes and still feel time passing — a soft bell
// to open, a marker every 30 seconds, gentle ticks through the final stretch,
// and a two-note close.
//
// AudioContext must be created/resumed from a user gesture (iOS only unlocks
// audio that way), so the caller calls unlock() on the "Begin" tap.

export function createTones() {
  const Ctx = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
  if (!Ctx) return null;
  let ctx = null;

  const ensure = () => {
    if (!ctx) {
      try { ctx = new Ctx(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { ctx.resume().catch(() => {}); }
    return ctx;
  };

  // One soft sine "ping" with a bell-like exponential decay. Gentle by design —
  // this runs while someone is trying to be still, not to alert them.
  const ping = (freq, dur = 0.9, gain = 0.11) => {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  };

  return {
    unlock: () => { ensure(); },                 // call on the Begin tap
    start: () => ping(528, 1.2, 0.10),           // bell that opens the silence
    interval: () => ping(440, 1.0, 0.09),        // every-30-seconds marker
    tick: () => ping(660, 0.16, 0.06),           // soft per-second tick in the last 10s
    done: () => { ping(396, 1.5, 0.12); setTimeout(() => ping(528, 1.8, 0.11), 200); }, // two-note close
    close: () => { try { ctx && ctx.close(); } catch (e) { /* noop */ } ctx = null; },
  };
}
