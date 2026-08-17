/**
 * The sound and the buzz.
 *
 * Tones are synthesised with the Web Audio API rather than shipped as files:
 * three short cues would otherwise be three more network requests and a few
 * hundred kilobytes, for something the browser can produce exactly. It also
 * means there is no asset to go missing on a slow connection at the precise
 * moment a student is meant to feel rewarded.
 *
 * The context is created on first use, never at import. Browsers refuse to
 * start audio outside a user gesture, and every one of these fires after a
 * tap, so creating it lazily keeps it inside the gesture that allowed it.
 */

export type Cue = 'ding' | 'tada' | 'fanfare';

const MUTE_KEY = 'celebration_sound_muted_v1';

export function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}

export function setMuted(muted: boolean): void {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch { /* private mode */ }
}

/** Someone who asked the system for less motion did not ask for less sound,
 *  but they did ask for calm — so the confetti and the bounce respect it. */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    // Autoplay policy suspends a context created before any gesture; resuming
    // inside the gesture that plays the cue is what actually unblocks it.
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

/** One note. `at` is an offset in seconds from now. */
function note(c: AudioContext, freq: number, at: number, dur: number, gain = 0.16) {
  const osc = c.createOscillator();
  const vol = c.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const t = c.currentTime + at;
  // A hard start or stop on a square edge clicks; the short ramps are what
  // make these read as a chime rather than a pop.
  vol.gain.setValueAtTime(0, t);
  vol.gain.linearRampToValueAtTime(gain, t + 0.012);
  vol.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(vol).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

// Notes, in Hz. C5 E5 G5 C6 — a major arpeggio, which is why the fanfare
// reads as triumphant rather than merely loud.
const C5 = 523.25, E5 = 659.25, G5 = 783.99, C6 = 1046.5, A5 = 880;

const CUES: Record<Cue, (c: AudioContext) => void> = {
  ding: c => {
    note(c, G5, 0, 0.18);
    note(c, C6, 0.06, 0.22);
  },
  tada: c => {
    note(c, C5, 0, 0.14);
    note(c, E5, 0.09, 0.14);
    note(c, G5, 0.18, 0.34);
  },
  fanfare: c => {
    note(c, C5, 0, 0.12, 0.18);
    note(c, E5, 0.10, 0.12, 0.18);
    note(c, G5, 0.20, 0.12, 0.18);
    note(c, C6, 0.30, 0.42, 0.20);
    note(c, A5, 0.30, 0.42, 0.10);
    note(c, E5, 0.30, 0.42, 0.10);
  },
};

export function playCue(cue: Cue): void {
  if (isMuted()) return;
  const c = audio();
  if (!c) return;
  try { CUES[cue](c); } catch { /* audio unavailable — the visuals still run */ }
}

const BUZZ: Record<Cue, number | number[]> = {
  ding: 25,
  tada: [30, 40, 60],
  fanfare: [50, 40, 90, 40, 140],
};

export function buzz(cue: Cue): void {
  if (typeof navigator.vibrate !== 'function') return;
  try { navigator.vibrate(BUZZ[cue]); } catch { /* not permitted */ }
}

/** Sound and haptics together, which is how they are always used. */
export function celebrate(cue: Cue): void {
  playCue(cue);
  buzz(cue);
}
