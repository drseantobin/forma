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

  // A cached brown-noise buffer (softer than white — closer to breath/ocean), reused
  // by every wave so we don't reallocate each breath.
  let noise = null;
  const getNoise = (c) => {
    if (noise) return noise;
    const len = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02; // brownish integration
      data[i] = last * 3.2;
    }
    noise = buf;
    return noise;
  };

  // A breath "wave": filtered brown noise that SWELLS in over an inhale and EBBS out
  // over an exhale (rising/falling, like a wave or the breath itself), and is PANNED for
  // bilateral stimulation with headphones — inhale washes to the LEFT, exhale to the
  // RIGHT (alternating L/R each breath). Replaces the per-breath beep.
  const breathWave = (phase, durSec = 4, gainPeak = 0.14) => {
    const c = ensure();
    if (!c) return;
    const t0 = c.currentTime;
    const dur = Math.max(1, durSec);
    const src = c.createBufferSource();
    src.buffer = getNoise(c);
    src.loop = true;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.Q.value = 0.6;
    const g = c.createGain();
    const pan = c.createStereoPanner ? c.createStereoPanner() : null;
    if (pan) pan.pan.setValueAtTime(phase === 'in' ? -0.85 : 0.85, t0); // bilateral: in=left, out=right
    if (phase === 'in') {
      // swell up + brighten as the breath fills
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gainPeak, t0 + dur * 0.85);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      filt.frequency.setValueAtTime(280, t0);
      filt.frequency.linearRampToValueAtTime(950, t0 + dur);
    } else {
      // ebb down + darken as the breath empties
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(gainPeak, t0 + dur * 0.22);
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur);
      filt.frequency.setValueAtTime(950, t0);
      filt.frequency.linearRampToValueAtTime(280, t0 + dur);
    }
    src.connect(filt).connect(g);
    if (pan) g.connect(pan).connect(c.destination); else g.connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.1);
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
    breathWave,                                  // bilateral breath wash (phase 'in' | 'out', durSec)
    done: () => { ping(396, 1.5, 0.12); setTimeout(() => ping(528, 1.8, 0.11), 200); }, // two-note close
    close: () => { try { ctx && ctx.close(); } catch (e) { /* noop */ } ctx = null; },
  };
}
