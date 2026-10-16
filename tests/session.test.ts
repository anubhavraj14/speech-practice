import { describe, expect, it } from "vitest";
import { applyOnlinePassages, buildCategorySession, buildOnlineSession, buildSession, stageOrder } from "../src/lib/session";
import { paragraphStats, themesByLanguage } from "../src/content/library";
import type { Language } from "../src/lib/types";
import { stableExcerptId } from "../src/lib/content-service";

const paras = (ids: string[]) => ids.filter((id) => !id.startsWith("theme:"));
const languages: Language[] = ["english", "hindi", "hinglish"];
const lengths = [5, 10, 15, 20, 30] as const;

describe("buildSession — duration", () => {
  it("matches the requested length almost exactly for every language and length", () => {
    for (const language of languages) for (const minutes of lengths) {
      const s = buildSession(language, "easy", minutes, []);
      expect(Math.abs(s.totalSeconds - minutes * 60)).toBeLessThanOrEqual(2);
    }
  });
});

describe("buildSession — sequence", () => {
  it("follows the logical stage order and leads from reading into speaking", () => {
    const s = buildSession("english", "medium", 15, []);
    expect(s.stages[0]).toBe("relax");
    expect(s.stages).toContain("paragraph");
    expect(s.stages).toContain("express");
    expect(s.stages).toContain("converse");
    // stages must respect the canonical order
    const positions = s.stages.map((st) => stageOrder.indexOf(st));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // a paragraph is always followed later by an express (own-words) beat
    const firstParagraph = s.beats.findIndex((b) => b.type === "paragraph");
    const firstExpress = s.beats.findIndex((b) => b.stage === "express");
    expect(firstExpress).toBeGreaterThan(firstParagraph);
  });
});

describe("buildSession — no repetition", () => {
  it("never shows the same passage twice within one session", () => {
    for (const minutes of lengths) {
      const ids = paras(buildSession("english", "medium", minutes, []).usedIds);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("avoids recently used themes and passages in the next session", () => {
    const first = buildSession("english", "easy", 15, []);
    const second = buildSession("english", "easy", 15, first.usedIds);
    const a = paras(first.usedIds); const b = paras(second.usedIds);
    expect(b.some((id) => a.includes(id))).toBe(false);
    expect(second.themeKeys.some((k) => first.themeKeys.includes(k))).toBe(false);
  });

  it("produces varied content across several consecutive sessions", () => {
    let recent: string[] = [];
    const themesSeen = new Set<string>();
    for (let i = 0; i < 5; i++) {
      const s = buildSession("hindi", "easy", 15, recent);
      s.themeKeys.forEach((k) => themesSeen.add(k));
      recent = [...s.usedIds, ...recent];
    }
    expect(themesSeen.size).toBeGreaterThanOrEqual(4);
  });
});

describe("buildSession — language", () => {
  it("keeps a single-language session entirely in that language", () => {
    for (const language of languages) {
      const s = buildSession(language, "medium", 20, []);
      expect(s.beats.every((b) => b.language === language)).toBe(true);
    }
  });
});

describe("online passage integration", () => {
  const onlinePassage = { id: "gutenberg:123:sample", language: "english" as const, source: "gutenberg" as const, title: "A Public Domain Book", author: "An Author", url: "https://www.gutenberg.org/ebooks/123", sentences: ["One fresh sentence from a book.", "Another source sentence follows.", "The passage continues with a third thought.", "A fourth thought makes the practice longer.", "The final line completes the excerpt."], wordCount: 31, difficulty: "easy" as const };

  it("reads the retrieved passage only in the paragraph, not in earlier stages", () => {
    const session = buildOnlineSession([onlinePassage], 10);
    const paragraph = session.beats.find((beat) => beat.type === "paragraph");
    expect(paragraph?.sentences).toEqual(onlinePassage.sentences);
    expect(paragraph?.source?.url).toBe(onlinePassage.url);
    // warm-up / breath-group stages use standalone lines, NOT the passage sentences
    const earlier = session.beats.filter((beat) => beat.type === "warmup" || beat.type === "sentence");
    expect(earlier.length).toBeGreaterThan(0);
    expect(earlier.every((beat) => beat.text && beat.text.trim().length > 0)).toBe(true);
    expect(earlier.some((beat) => onlinePassage.sentences.includes(beat.text || ""))).toBe(false);
    expect(session.usedIds).toEqual([onlinePassage.id]);
  });

  it("creates substantial category sessions instead of one-line drills", () => {
    for (const category of ["breathing", "pace", "articulation", "reading", "prompts"] as const) {
      const session = buildCategorySession(category, onlinePassage);
      expect(session.beats.length).toBeGreaterThanOrEqual(4);
      expect(session.usedIds).toEqual([onlinePassage.id]);
    }
  });

  it("creates stable, excerpt-specific ids for repetition avoidance", () => {
    expect(stableExcerptId("book:1", "same excerpt")).toBe(stableExcerptId("book:1", "same excerpt"));
    expect(stableExcerptId("book:1", "first excerpt")).not.toBe(stableExcerptId("book:1", "second excerpt"));
  });

  it("replaces reading material while preserving the guided progression and attribution", () => {
    const session = buildSession("english", "easy", 10, []);
    const hydrated = applyOnlinePassages(session, [{
      id: "gutenberg:123:sample", language: "english", source: "gutenberg", title: "A Public Domain Book",
      author: "An Author", url: "https://www.gutenberg.org/ebooks/123", sentences: ["A fresh first sentence.", "A second sentence with a natural pause."], wordCount: 11, difficulty: "easy",
    }]);
    const reading = hydrated.beats.find((beat) => beat.type === "paragraph");
    expect(reading?.sentences).toEqual(["A fresh first sentence.", "A second sentence with a natural pause."]);
    expect(reading?.source?.label).toContain("public domain");
    expect(hydrated.usedIds).toContain("gutenberg:123:sample");
    expect(hydrated.stages).toEqual(stageOrder);
  });
});

describe("content library", () => {
  it("provides a substantial, distinct paragraph library per language", () => {
    const stats = paragraphStats();
    for (const language of languages) {
      const total = stats[language].easy + stats[language].medium + stats[language].advanced;
      expect(total).toBeGreaterThanOrEqual(30);
    }
  });
  it("has unique paragraph ids across the whole library", () => {
    const ids = languages.flatMap((l) => themesByLanguage[l].flatMap((t) => t.paragraphs.map((p) => p.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
