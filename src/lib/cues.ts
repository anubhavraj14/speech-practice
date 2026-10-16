/**
 * Gentle multisensory cues: soft Web Audio tones (desktop) and Vibration API
 * haptics (mobile). No audio files — tones are synthesised. Both are optional
 * and only ever triggered after a user gesture (pressing Start / Space), which
 * is what browsers require to start audio.
 */

export interface CueOptions {
  sound: boolean;
  haptics: boolean;
}

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Play one soft tone with a quick attack and gentle decay. */
function tone(freq: number, durationMs: number, peak = 0.06, delayMs = 0): void {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + delayMs / 1000;
  const dur = durationMs / 1000;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(start);
  osc.stop(start + dur + 0.03);
}

function buzz(pattern: number | number[]): void {
  if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
    try { navigator.vibrate(pattern); } catch { /* unsupported */ }
  }
}

/** Breathe-in: a calm, low, slightly longer tone + a soft single pulse. */
export function cueInhale(o: CueOptions): void {
  if (o.sound) tone(330, 420, 0.06);
  if (o.haptics) buzz(45);
}

/** Start speaking on the out-breath: a short, slightly brighter tone. */
export function cueSpeak(o: CueOptions): void {
  if (o.sound) tone(494, 150, 0.05);
  if (o.haptics) buzz(25);
}

/** End of a sentence (a natural rest): a gentle two-note settle. */
export function cueSentenceEnd(o: CueOptions): void {
  if (o.sound) { tone(392, 140, 0.045); tone(330, 200, 0.04, 130); }
  if (o.haptics) buzz([18, 40, 18]);
}

/** Session complete: a pleasant little ascending chime. */
export function cueComplete(o: CueOptions): void {
  if (o.sound) { tone(523, 160, 0.06); tone(659, 160, 0.06, 150); tone(784, 260, 0.06, 300); }
  if (o.haptics) buzz([30, 50, 30, 50, 70]);
}

/** Warm-up inhale phase. */
export function cueWarmupInhale(o: CueOptions): void {
  if (o.sound) tone(330, 500, 0.06);
  if (o.haptics) buzz(60);
}

/** Warm-up exhale phase (lower, longer, calming). */
export function cueWarmupExhale(o: CueOptions): void {
  if (o.sound) tone(262, 600, 0.055);
  if (o.haptics) buzz(40);
}

/** Warm-up hold phase: the lightest possible tick. */
export function cueWarmupHold(o: CueOptions): void {
  if (o.haptics) buzz(12);
}
