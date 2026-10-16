import { describe, expect, it } from "vitest";
import {
  BREATH,
  PACE_WPM,
  buildBreathUnits,
  chunkIntoBreathGroups,
  restMsForUnit,
  speakMsForWords,
  wordSchedule,
} from "../src/lib/breath";

const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe("buildBreathUnits — breaths are per sentence, not per comma", () => {
  it("keeps a comma-separated sentence as ONE breath unit", () => {
    const units = buildBreathUnits(["Hello there, how are you today?"]);
    expect(units.length).toBe(1);
    expect(units[0].endsSentence).toBe(true);
    // the comma becomes a micro-pause, not a breath
    expect(units[0].pauseAfter.length).toBe(1);
  });

  it("creates one breath unit per sentence", () => {
    const units = buildBreathUnits(["I woke up early.", "I made some tea.", "The morning felt calm."]);
    expect(units.length).toBe(3);
    expect(units.every((u) => u.endsSentence)).toBe(true);
  });

  it("does not split a normal-length sentence even with several commas", () => {
    const units = buildBreathUnits(["In the morning, I stretch, I breathe, and I plan my day."]);
    expect(units.length).toBe(1);
    expect(units[0].pauseAfter.length).toBeGreaterThanOrEqual(3);
  });

  it("splits only very long sentences, into the fewest breaths, at clause boundaries", () => {
    const long = "After reviewing the numbers from last quarter, we decided to delay the launch by two weeks, so the whole team could test everything carefully again before release.";
    const units = buildBreathUnits(long.split("\n"));
    expect(units.length).toBeGreaterThan(1);
    expect(units.length).toBeLessThanOrEqual(3);
    for (const u of units) expect(u.words.length).toBeLessThanOrEqual(BREATH.maxWordsPerBreath);
    // only the final unit ends the sentence
    expect(units[units.length - 1].endsSentence).toBe(true);
    expect(units.slice(0, -1).every((u) => !u.endsSentence)).toBe(true);
  });

  it("handles empty and whitespace input", () => {
    expect(buildBreathUnits([])).toEqual([]);
    expect(buildBreathUnits(["", "   "])).toEqual([]);
  });

  it("treats a long Hindi sentence as one breath when within the limit", () => {
    const units = buildBreathUnits(["परीक्षण शुरू करने से पहले, मैं चाहता हूँ कि टीम राय देख ले।"]);
    expect(units.length).toBe(1);
    expect(units[0].pauseAfter.length).toBe(1);
  });
});

describe("wordSchedule", () => {
  it("adds a micro-pause (not a breath) at comma positions", () => {
    const [unit] = buildBreathUnits(["Yes, absolutely right."]);
    const withPause = wordSchedule(unit, 120);
    // same words with no comma should finish sooner
    const [plain] = buildBreathUnits(["Yes absolutely right now."]);
    const noPause = wordSchedule(plain, 120);
    expect(withPause.total).toBeGreaterThan(noPause.total - BREATH.commaMicroPauseMs);
    expect(withPause.starts.length).toBe(unit.words.length);
  });
});

describe("timing math", () => {
  it("scales the speaking window with word count and pace", () => {
    expect(speakMsForWords(6, PACE_WPM.slow)).toBeGreaterThan(speakMsForWords(6, PACE_WPM.natural));
    expect(speakMsForWords(6, 120)).toBe(3000);
  });

  it("never drops below the minimum speaking duration", () => {
    expect(speakMsForWords(1, 300)).toBe(BREATH.minSpeakMs);
  });

  it("rests longer after a sentence end than after a mid-sentence breath", () => {
    expect(restMsForUnit({ words: ["a"], pauseAfter: [], endsSentence: true })).toBe(BREATH.sentenceRestMs);
    expect(restMsForUnit({ words: ["a"], pauseAfter: [], endsSentence: false })).toBe(BREATH.midRestMs);
  });
});

describe("chunkIntoBreathGroups (display helper, not breath driver)", () => {
  it("still wraps long parts for readability", () => {
    const groups = chunkIntoBreathGroups("one two three four five six seven eight");
    expect(groups.length).toBe(2);
    expect(groups.map(wc)).toEqual([4, 4]);
  });

  it("keeps punctuation attached", () => {
    expect(chunkIntoBreathGroups("Before we begin, I would like to start.")[0]).toBe("Before we begin,");
  });
});
