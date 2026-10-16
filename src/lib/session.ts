import { fallbackThemes } from "@/content/library";
import { breathLines, easyStarts } from "@/content/practice-lines";
import type { Paragraph, Theme } from "@/content/content-types";
import type { Difficulty, Language } from "@/lib/types";

export type Stage = "relax" | "warmup" | "sentences" | "paragraph" | "express" | "converse" | "apply";
export type BeatType = "breathe" | "warmup" | "sentence" | "paragraph" | "speak";

export const stageOrder: Stage[] = ["relax", "warmup", "sentences", "paragraph", "express", "converse", "apply"];

export const stageLabel: Record<Stage, string> = {
  relax: "Settle in",
  warmup: "Warm up",
  sentences: "Build your flow",
  paragraph: "Read aloud",
  express: "Use your words",
  converse: "Keep talking",
  apply: "Make it yours",
};

export interface SessionBeat {
  id: string;
  stage: Stage;
  type: BeatType;
  language: Language;
  seconds: number;
  text?: string;
  title?: string;
  sentences?: string[];
  words?: number;
  source?: { label: string; url?: string; author?: string };
  tip: string;
}

export interface GuidedSession {
  beats: SessionBeat[];
  stages: Stage[];
  totalSeconds: number;
  usedIds: string[];
  themeKeys: string[];
}

/** An online passage session saved mid-way, with the setup it was created for,
 *  so we only offer to resume it for a matching language + difficulty. */
export interface ActivePassage {
  session: GuidedSession;
  language: Language | "mixed";
  difficulty: Difficulty;
}

const tips: Record<Language, string> = {
  english: "Take your time. A comfortable pace matters more than perfection.",
  hindi: "अपना समय लें। सही होने से ज़्यादा सहज गति मायने रखती है।",
  hinglish: "Apna time lo. Perfect hone se zyada comfortable pace matter karti hai.",
};

const breatheText: Record<Language, string> = {
  english: "Breathe out slowly",
  hindi: "धीरे-धीरे साँस छोड़ें",
  hinglish: "Dheere-dheere saans chhodo",
};

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Pick `count` distinct random lines from a pool. */
function pickLines(pool: string[], count: number): string[] {
  return shuffle(pool).slice(0, count);
}

function chooseTheme(language: Language, recent: Set<string>): Theme {
  const available = fallbackThemes[language].filter((theme) => !recent.has(`theme:${language}:${theme.key}`));
  return shuffle(available.length ? available : fallbackThemes[language])[0];
}

function chooseParagraph(theme: Theme, difficulty: Difficulty, recent: Set<string>): Paragraph {
  const unused = theme.paragraphs.filter((paragraph) => paragraph.difficulty === difficulty && !recent.has(paragraph.id));
  const sameDifficulty = theme.paragraphs.filter((paragraph) => paragraph.difficulty === difficulty);
  const anyUnused = theme.paragraphs.filter((paragraph) => !recent.has(paragraph.id));
  return shuffle(unused.length ? unused : sameDifficulty.length ? sameDifficulty : anyUnused.length ? anyUnused : theme.paragraphs)[0];
}

function languagesFor(language: Language | "mixed"): Language[] {
  return language === "mixed" ? shuffle<Language>(["english", "hindi", "hinglish"]) : [language];
}

export function sessionOutline(minutes: number): Stage[] {
  void minutes;
  return [...stageOrder];
}

export function applyOnlinePassages(session: GuidedSession, passages: import("@/lib/types").Passage[]): GuidedSession {
  if (!passages.length) return session;
  const byLanguage = new Map(passages.map((passage) => [passage.language, passage]));
  const beats = session.beats.map((beat) => {
    const passage = byLanguage.get(beat.language) || passages[0];
    if (!passage) return beat;
    if (beat.stage === "sentences") {
      const sentenceIndex = Number(beat.id.split("-").at(-1)) || 0;
      return { ...beat, id: `sentence-${passage.id}-${sentenceIndex}`, text: passage.sentences[sentenceIndex % passage.sentences.length] };
    }
    if (beat.type !== "paragraph") return beat;
    return {
      ...beat,
      id: passage.id,
      title: passage.title,
      sentences: passage.sentences,
      words: passage.wordCount,
      source: {
        label: passage.source === "gutenberg" ? "Project Gutenberg · public domain" : passage.source === "wikisource" ? "Wikisource · free source text" : "A simple practice story",
        url: passage.url,
        author: passage.author,
      },
    };
  });
  const onlineIds = passages.map((passage) => passage.id);
  return { ...session, beats, usedIds: [...session.usedIds.filter((id) => id.startsWith("theme:")), ...onlineIds] };
}

const onlinePrompts: Record<Language, { retell: string; connect: string; apply: string }> = {
  english: { retell: "Retell the passage in your own words. Keep only the ideas that stayed with you.", connect: "What does this passage make you think about?", apply: "Connect one idea from the passage to something in your own life." },
  hindi: { retell: "इस अंश को अपने शब्दों में बताएँ। केवल वही विचार रखें जो आपको याद रहे।", connect: "यह अंश आपको किस बारे में सोचने पर मजबूर करता है?", apply: "अंश के एक विचार को अपने जीवन के किसी अनुभव से जोड़ें।" },
  hinglish: { retell: "Passage ko apne words mein batao. Sirf wahi ideas rakho jo yaad rahe.", connect: "Yeh passage aapko kis baare mein sochne par majboor karta hai?", apply: "Passage ke ek idea ko apni life ke kisi experience se connect karo." },
};

function sourceFor(passage: import("@/lib/types").Passage) {
  const label = passage.source === "gutenberg" ? "Project Gutenberg · public domain" : passage.source === "wikisource" ? "Wikisource · free source text" : "A simple practice story";
  return { label, url: passage.url, author: passage.author };
}

export function buildOnlineSession(passages: import("@/lib/types").Passage[], minutes: 5 | 10 | 15 | 20 | 30): GuidedSession {
  if (!passages.length) throw new Error("Online content is required");
  const beats: Omit<SessionBeat, "seconds">[] = [];
  const add = (beat: Omit<SessionBeat, "seconds">) => beats.push(beat);
  const primary = passages[0];
  add({ id: `settle-${primary.id}`, stage: "relax", type: "breathe", language: primary.language, tip: tips[primary.language] });
  passages.forEach((passage) => {
    const lang = passage.language;
    const source = sourceFor(passage);
    // Warm-up and breath-group lines are standalone — never slices of the passage —
    // so the earlier stages don't repeat the sentences in the long paragraph.
    pickLines(easyStarts[lang], 2).forEach((text, index) => add({ id: `warmup-${lang}-${index}-${passage.id}`, stage: "warmup", type: "warmup", language: lang, text, tip: tips[lang] }));
    pickLines(breathLines[lang], 4).forEach((text, index) => add({ id: `sentence-${lang}-${index}-${passage.id}`, stage: "sentences", type: "sentence", language: lang, text, tip: tips[lang] }));
    add({ id: passage.id, stage: "paragraph", type: "paragraph", language: passage.language, title: passage.title, sentences: passage.sentences, words: passage.wordCount, source, tip: tips[passage.language] });
    add({ id: `express-${passage.id}`, stage: "express", type: "speak", language: passage.language, text: onlinePrompts[passage.language].retell, source, tip: tips[passage.language] });
    add({ id: `converse-${passage.id}`, stage: "converse", type: "speak", language: passage.language, text: onlinePrompts[passage.language].connect, source, tip: tips[passage.language] });
    add({ id: `apply-${passage.id}`, stage: "apply", type: "speak", language: passage.language, text: onlinePrompts[passage.language].apply, source, tip: tips[passage.language] });
  });
  const totalSeconds = minutes * 60;
  const seconds = Math.max(1, Math.floor(totalSeconds / beats.length));
  return { beats: beats.map((beat) => ({ ...beat, seconds })), stages: stageOrder.filter((stage) => beats.some((beat) => beat.stage === stage)), totalSeconds, usedIds: passages.map((passage) => passage.id), themeKeys: [] };
}

export function buildCategorySession(category: import("@/lib/types").Category, passage: import("@/lib/types").Passage): GuidedSession {
  const full = buildOnlineSession([passage], 10);
  const stagesByCategory: Record<import("@/lib/types").Category, Stage[]> = {
    breathing: ["relax", "warmup", "sentences"], pace: ["warmup", "sentences", "paragraph"], articulation: ["warmup", "sentences", "paragraph"], reading: ["sentences", "paragraph", "express"], prompts: ["paragraph", "express", "converse", "apply"],
  };
  let beats = full.beats.filter((beat) => stagesByCategory[category].includes(beat.stage));
  if (category === "breathing") beats = [full.beats[0], full.beats[0], ...beats.filter((beat) => beat.stage !== "relax"), full.beats.find((beat) => beat.stage === "paragraph")!].map((beat, index) => ({ ...beat, id: `${beat.id}-breath-${index}` }));
  if (category === "reading") beats = [...beats, ...beats.filter((beat) => beat.type === "paragraph").map((beat) => ({ ...beat, id: `${beat.id}-reread`, tip: "Read it again in a way that feels natural to you. Change or ignore the pause points as needed." }))];
  return { ...full, beats, stages: stageOrder.filter((stage) => beats.some((beat) => beat.stage === stage)) };
}

export function buildSession(
  language: Language | "mixed",
  difficulty: Difficulty,
  minutes: 5 | 10 | 15 | 20 | 30,
  recentIds: string[] = []
): GuidedSession {
  const recent = new Set(recentIds);
  const languages = languagesFor(language);
  const selected = languages.map((lang) => {
    const theme = chooseTheme(lang, recent);
    return { language: lang, theme, paragraph: chooseParagraph(theme, difficulty, recent) };
  });
  const primary = selected[0];
  const beats: Omit<SessionBeat, "seconds">[] = [];
  const add = (beat: Omit<SessionBeat, "seconds">) => beats.push(beat);

  add({ id: "relax", stage: "relax", type: "breathe", language: primary.language, text: breatheText[primary.language], tip: tips[primary.language] });
  selected.forEach(({ language: lang, theme }) => theme.warmups.slice(0, 2).forEach((text, index) =>
    add({ id: `warmup-${lang}-${index}`, stage: "warmup", type: "warmup", language: lang, text, tip: tips[lang] })));
  // Breath-group lines are standalone practice sentences, not slices of the
  // paragraph, so this stage never repeats the reading that follows.
  selected.forEach(({ language: lang }) => pickLines(breathLines[lang], 3).forEach((text, index) =>
    add({ id: `sentence-${lang}-${index}`, stage: "sentences", type: "sentence", language: lang, text, tip: tips[lang] })));
  selected.forEach(({ language: lang, paragraph }) => add({
    id: paragraph.id, stage: "paragraph", type: "paragraph", language: lang, title: paragraph.title,
    sentences: paragraph.sentences, words: paragraph.sentences.join(" ").trim().split(/\s+/).length, tip: tips[lang],
  }));
  selected.forEach(({ language: lang, paragraph }) => add({ id: `express-${paragraph.id}`, stage: "express", type: "speak", language: lang, text: paragraph.summarize, tip: tips[lang] }));
  selected.forEach(({ language: lang, theme }) => add({ id: `converse-${lang}-${theme.key}`, stage: "converse", type: "speak", language: lang, text: theme.conversation.question, tip: tips[lang] }));
  selected.forEach(({ language: lang, theme }) => add({ id: `apply-${lang}-${theme.key}`, stage: "apply", type: "speak", language: lang, text: theme.application, tip: tips[lang] }));

  const totalSeconds = minutes * 60;
  const base = Math.floor(totalSeconds / beats.length);
  const remainder = totalSeconds - base * beats.length;
  const timedBeats = beats.map((beat, index) => ({ ...beat, seconds: base + (index < remainder ? 1 : 0) }));
  const themeKeys = selected.map(({ language: lang, theme }) => `${lang}:${theme.key}`);
  const usedIds = [...selected.map(({ language: lang, theme }) => `theme:${lang}:${theme.key}`), ...selected.map(({ paragraph }) => paragraph.id)];

  return { beats: timedBeats, stages: stageOrder.filter((stage) => timedBeats.some((beat) => beat.stage === stage)), totalSeconds, usedIds, themeKeys };
}
