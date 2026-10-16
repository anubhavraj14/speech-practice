import { Difficulty, Language, Passage } from "@/lib/types";
import { enThemes } from "./themes.en";
import { hiThemes } from "./themes.hi";
import { hgThemes } from "./themes.hg";
import { Paragraph, Theme } from "./content-types";

export type { Passage };

const rawThemes: Record<Language, Theme[]> = {
  english: enThemes,
  hindi: hiThemes,
  hinglish: hgThemes,
};

function toPassage(p: Paragraph, language: Language): Passage {
  return {
    id: p.id,
    language,
    source: "local",
    title: p.title,
    sentences: p.sentences,
    wordCount: p.sentences.join(" ").trim().split(/\s+/).filter(Boolean).length,
    difficulty: p.difficulty,
  };
}

export const themesByLanguage: Record<Language, Theme[]> = rawThemes;
export const fallbackThemes = themesByLanguage;

export const fallbackPassages: Record<Language, Passage[]> = {
  english: enThemes.flatMap((t) => t.paragraphs.map((p) => toPassage(p, "english"))),
  hindi: hiThemes.flatMap((t) => t.paragraphs.map((p) => toPassage(p, "hindi"))),
  hinglish: hgThemes.flatMap((t) => t.paragraphs.map((p) => toPassage(p, "hinglish"))),
};

export const fallbackWarmups: Record<Language, string[]> = {
  english: enThemes.flatMap((t) => t.warmups),
  hindi: hiThemes.flatMap((t) => t.warmups),
  hinglish: hgThemes.flatMap((t) => t.warmups),
};

export function passagesFor(language: Language, difficulty?: Difficulty): Passage[] {
  const list = fallbackPassages[language];
  return difficulty ? list.filter((p) => p.difficulty === difficulty) : list;
}

export function paragraphStats(): Record<Language, Record<Difficulty, number>> {
  const stats: Record<Language, Record<Difficulty, number>> = {
    english: { easy: 0, medium: 0, advanced: 0 },
    hindi: { easy: 0, medium: 0, advanced: 0 },
    hinglish: { easy: 0, medium: 0, advanced: 0 },
  };
  (Object.keys(fallbackPassages) as Language[]).forEach((lang) => {
    fallbackPassages[lang].forEach((p) => { stats[lang][p.difficulty]++; });
  });
  return stats;
}
