import type { BreathEvery, Language, Pace } from "@/lib/types";

export type { BreathEvery, Pace };

/**
 * Breath-coordination engine.
 *
 * Design principle: speech is NOT driven by a rigid breathing metronome. We do
 * not force a breath after every few words or at every comma. Instead, a "breath
 * unit" is normally a whole sentence spoken on one out-breath; commas and clauses
 * become light micro-pauses within that breath, not breath points. Only unusually
 * long sentences are split — infrequently, at a natural clause boundary — so you
 * are never asked to gulp air mid-thought. A "free" mode removes enforced inhales
 * entirely, letting you breathe whenever you need while the words simply pace.
 */

/** Target words-per-minute for the speaking (out-breath) window. We practise
 *  slower than the conversational norm (~150-190 wpm) and build up. */
export const PACE_WPM: Record<Pace, number> = { slow: 100, steady: 120, natural: 140 };
export const PACE_LABEL: Record<Pace, string> = { slow: "Slow", steady: "Steady", natural: "Natural" };

export const BREATH_EVERY_LABEL: Record<BreathEvery, string> = { sentence: "Per sentence", free: "Free" };

/** All durations in milliseconds. */
export const BREATH = {
  /** A single comfortable breath taken before a sentence. */
  inhaleMs: 1600,
  /** Brief settle at the top of the breath before speaking. */
  holdMs: 200,
  /** Natural rest after finishing a sentence. */
  sentenceRestMs: 1000,
  /** Short rest after a mid-sentence breath (only used when a long sentence is split). */
  midRestMs: 450,
  /** A clear pause between meaningful thoughts at a comma/clause — a phrasing
   *  stop, NOT a breath. Long enough to be felt, so reading is properly phrased. */
  commaMicroPauseMs: 550,
  /** Only split a sentence into more than one breath if it exceeds this many words. */
  maxWordsPerBreath: 18,
  /** A breath group never lasts less than this while speaking. */
  minSpeakMs: 700,
} as const;

/** A span of text to be spoken on a single out-breath (normally one sentence). */
export interface BreathUnit {
  words: string[];
  /** Word indices after which a brief comma/clause micro-pause occurs (not a breath). */
  pauseAfter: number[];
  /** True when this unit ends a sentence (a natural, longer rest follows). */
  endsSentence: boolean;
}

const WS = /\s+/;
/** A word that closes a clause with punctuation. */
const SOFT_END = /[,;:—–]["'”’)]?$/;
/** Connectors that mark a natural clause boundary in EN / Hindi / Hinglish. */
const CONNECTORS = new Set([
  "and", "but", "or", "so", "because", "yet", "while", "although", "which", "when",
  "और", "लेकिन", "तो", "क्योंकि", "जबकि", "कि",
  "aur", "lekin", "kyunki", "jabki", "magar", "phir",
]);

function tokenize(text: string): string[] {
  return text.trim().split(WS).filter(Boolean);
}

function normalize(word: string): string {
  return word.toLowerCase().replace(/[^\p{L}]/gu, "");
}

function endsSentencePunct(sentence: string): boolean {
  return /[.?!।]["'”’)]?$/.test(sentence.trim());
}

/**
 * Legacy helper kept for display line-wrapping and tests: break a sentence into
 * readable chunks. This does NOT drive breathing anymore.
 */
export function chunkIntoBreathGroups(sentence: string, maxWords = 7): string[] {
  const trimmed = sentence.trim();
  if (!trimmed) return [];
  const parts: string[] = [];
  const rawParts = trimmed.split(/([,;:—–])/);
  let buffer = "";
  for (const token of rawParts) {
    if (/^[,;:—–]$/.test(token)) {
      buffer += token;
      parts.push(buffer.trim());
      buffer = "";
    } else {
      buffer += token;
    }
  }
  if (buffer.trim()) parts.push(buffer.trim());

  const phrases: string[] = [];
  for (const part of parts.filter(Boolean)) {
    const words = tokenize(part);
    if (words.length <= maxWords) {
      phrases.push(part.trim());
    } else {
      const count = Math.ceil(words.length / maxWords);
      const base = Math.floor(words.length / count);
      const extra = words.length - base * count;
      let cursor = 0;
      for (let i = 0; i < count; i++) {
        const size = base + (i < extra ? 1 : 0);
        phrases.push(words.slice(cursor, cursor + size).join(" "));
        cursor += size;
      }
    }
  }
  return phrases.filter((p) => p.length > 0);
}

/** Indices (into `words`) that close a clause and warrant a brief micro-pause. */
function microPauseIndices(words: string[]): number[] {
  const result: number[] = [];
  for (let i = 0; i < words.length - 1; i++) if (SOFT_END.test(words[i])) result.push(i);
  return result;
}

/**
 * Choose where to break a long sentence into the FEWEST breaths possible,
 * snapping each break to a nearby clause boundary so breaths feel natural.
 * Returns a list of unit sizes (word counts).
 */
function splitLongSentence(words: string[], max: number): number[] {
  const unitCount = Math.ceil(words.length / max);
  if (unitCount <= 1) return [words.length];

  const soft: number[] = [];
  for (let i = 0; i < words.length - 1; i++) {
    if (SOFT_END.test(words[i]) || CONNECTORS.has(normalize(words[i + 1]))) soft.push(i);
  }

  const breakAfter: number[] = [];
  const window = Math.ceil(max / 2);
  for (let k = 1; k < unitCount; k++) {
    const target = Math.round((words.length * k) / unitCount) - 1;
    let best = -1;
    let bestDist = Infinity;
    for (const s of soft) {
      if (breakAfter.includes(s)) continue;
      const d = Math.abs(s - target);
      if (d < bestDist) { bestDist = d; best = s; }
    }
    breakAfter.push(best >= 0 && bestDist <= window ? best : target);
  }
  breakAfter.sort((a, b) => a - b);

  const sizes: number[] = [];
  let prev = -1;
  for (const b of breakAfter) { if (b > prev) { sizes.push(b - prev); prev = b; } }
  sizes.push(words.length - 1 - prev);
  return sizes.filter((n) => n > 0);
}

/**
 * Turn sentences into breath units. One unit per sentence by default; a long
 * sentence becomes the minimum number of units, split at natural clause points.
 */
export function buildBreathUnits(sentences: string[], maxWordsPerBreath = BREATH.maxWordsPerBreath): BreathUnit[] {
  const units: BreathUnit[] = [];
  for (const sentence of sentences) {
    const words = tokenize(sentence);
    if (!words.length) continue;
    const endsSent = endsSentencePunct(sentence);
    if (words.length <= maxWordsPerBreath) {
      units.push({ words, pauseAfter: microPauseIndices(words), endsSentence: endsSent });
      continue;
    }
    const sizes = splitLongSentence(words, maxWordsPerBreath);
    let cursor = 0;
    sizes.forEach((size, index) => {
      const slice = words.slice(cursor, cursor + size);
      units.push({ words: slice, pauseAfter: microPauseIndices(slice), endsSentence: index === sizes.length - 1 && endsSent });
      cursor += size;
    });
  }
  return units;
}

/** Milliseconds to spend speaking `count` words at the given pace. */
export function speakMsForWords(count: number, wpm: number): number {
  return Math.max(BREATH.minSpeakMs, Math.round((count / wpm) * 60000));
}

/**
 * Per-word start times (ms) across a unit, including comma micro-pauses, plus the
 * total speaking duration. Used to drive karaoke-style word highlighting.
 */
export function wordSchedule(unit: BreathUnit, wpm: number): { starts: number[]; total: number } {
  const n = unit.words.length;
  const base = speakMsForWords(n, wpm) / n;
  const starts: number[] = [];
  let t = 0;
  for (let i = 0; i < n; i++) {
    starts.push(t);
    t += base;
    if (unit.pauseAfter.includes(i)) t += BREATH.commaMicroPauseMs;
  }
  return { starts, total: t };
}

/** The rest after a unit: longer at a sentence end, short after a mid-sentence breath. */
export function restMsForUnit(unit: BreathUnit): number {
  return unit.endsSentence ? BREATH.sentenceRestMs : BREATH.midRestMs;
}

/** Short, localized cue text for the breath phases. */
export const breathPhaseCue: Record<Language, { inhale: string; speak: string; rest: string; free: string }> = {
  english: { inhale: "Breathe in", speak: "Speak on the out-breath", rest: "Rest", free: "Breathe whenever you need" },
  hindi: { inhale: "साँस लें", speak: "छोड़ती साँस पर बोलें", rest: "रुकें", free: "जब ज़रूरत हो तब साँस लें" },
  hinglish: { inhale: "Saans lo", speak: "Exhale par bolo", rest: "Ruko", free: "Jab zaroorat ho tab saans lo" },
};
