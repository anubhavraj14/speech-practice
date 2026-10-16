import { Difficulty, Language, Passage } from "@/lib/types";
import { fallbackPassages, fallbackWarmups } from "@/content/library";
import { stories } from "@/content/stories";

const GUTENDEX = "https://gutendex.com";
const WIKISOURCE_HI = "https://hi.wikisource.org/w/api.php";

const WORD_RANGES: Record<Difficulty, [number, number]> = {
  easy: [35, 70],
  medium: [70, 130],
  advanced: [130, 220],
};

const ENGLISH_TOPICS = [
  "morning", "walk", "friendship", "learning", "work", "home", "travel", "nature",
  "quiet", "garden", "family", "books", "city", "village", "river", "mountain",
];

const HINDI_TOPICS = [
  "सुबह", "यात्रा", "मित्र", "पुस्तक", "प्रकृति", "गाँव", "नदी", "पहाड़",
  "शहर", "बगीचा", "परिवार", "शांति", "ज्ञान", "साधारण",
];

const GUTENBERG_FALLBACK_CATALOG = [
  { id: 1342, title: "Pride and Prejudice", author: "Jane Austen" },
  { id: 11, title: "Alice's Adventures in Wonderland", author: "Lewis Carroll" },
  { id: 1661, title: "The Adventures of Sherlock Holmes", author: "Arthur Conan Doyle" },
  { id: 84, title: "Frankenstein", author: "Mary Wollstonecraft Shelley" },
  { id: 2701, title: "Moby Dick", author: "Herman Melville" },
];

interface GutendexBook {
  id: number;
  title: string;
  authors?: { name: string }[];
  formats: Record<string, string>;
}

interface WikisourceHit {
  title: string;
}

function textFormat(book: GutendexBook): string | undefined {
  return book.formats["text/plain; charset=utf-8"] || book.formats["text/plain"];
}

export function stableExcerptId(source: string, text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
  return `${source}:${(hash >>> 0).toString(36)}`;
}

function random<T>(arr: T[]): T | undefined {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentenceSplit(text: string): string[] {
  return text
    .replace(/([.?!।])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter((s) => s.length > 10);
}

function cleanGutenbergText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*\* START OF (THIS|THE) PROJECT GUTENBERG EBOOK[\s\S]*?\*\*\*/, "")
    .replace(/\*\*\* END OF (THIS|THE) PROJECT GUTENBERG EBOOK[\s\S]*/, "")
    .replace(/\[Illustration[^\]]*\]/gi, "")
    .replace(/[_*]{2,}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function usableParagraph(p: string): boolean {
  if (p.length < 80) return false;
  if (/^[A-Z\s\d.]+$/.test(p)) return false;
  if (p.startsWith("CHAPTER") || p.startsWith("Chapter")) return false;
  if (p.includes("Gutenberg") && p.includes("License")) return false;
  return true;
}

/**
 * Build a passage from sentences when no single paragraph lands in range:
 * greedily group consecutive sentences into windows of [min, max] words.
 * This is essential for sources (e.g. Wikisource) that don't give clean
 * paragraph breaks.
 */
function windowFromSentences(text: string, min: number, max: number): string | null {
  const sentences = sentenceSplit(text).filter((s) => wordCount(s) <= max);
  const windows: string[] = [];
  let buffer: string[] = [];
  let count = 0;
  for (const sentence of sentences) {
    buffer.push(sentence);
    count += wordCount(sentence);
    if (count >= min) {
      if (count <= max) windows.push(buffer.join(" "));
      buffer = [];
      count = 0;
    }
  }
  if (!windows.length) return null;
  return shuffle(windows).sort((a, b) => Math.abs(wordCount(a) - (min + max) / 2) - Math.abs(wordCount(b) - (min + max) / 2))[0];
}

function extractParagraph(text: string, difficulty: Difficulty): string | null {
  const [min, max] = WORD_RANGES[difficulty];
  const chunks = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/[ \t\u00a0]+/g, " ").trim())
    .filter((p) => usableParagraph(p) && wordCount(p) >= min && wordCount(p) <= max);
  if (chunks.length) {
    const best = shuffle(chunks).slice(0, 5).sort((a, b) => Math.abs(wordCount(a) - (min + max) / 2) - Math.abs(wordCount(b) - (min + max) / 2));
    return best[0] || chunks[0];
  }
  // Fallback: assemble a passage from sentences across the whole text.
  const flat = text.replace(/\s+/g, " ").trim();
  return windowFromSentences(flat, min, max);
}

async function fetchDirectGutenberg(language: "english" | "hinglish", difficulty: Difficulty, avoidIds: Set<string>): Promise<Passage | null> {
  for (const book of shuffle(GUTENBERG_FALLBACK_CATALOG)) {
    const url = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: "no-store", headers: { "User-Agent": "SpeakFlow/1.0 (public-domain reading practice)" } });
      if (!response.ok) continue;
      const paragraph = extractParagraph(cleanGutenbergText(await response.text()), difficulty);
      if (!paragraph) continue;
      const id = stableExcerptId(`gutenberg:${book.id}`, paragraph);
      if (avoidIds.has(id)) continue;
      return { id, language, source: "gutenberg", title: book.title, author: book.author, url: `https://www.gutenberg.org/ebooks/${book.id}`, sentences: sentenceSplit(paragraph), wordCount: wordCount(paragraph), difficulty };
    } catch {
      continue;
    }
  }
  return null;
}

async function fetchGutenbergPassage(language: "english" | "hinglish", difficulty: Difficulty, avoidIds: Set<string>): Promise<Passage | null> {
  const topic = random(ENGLISH_TOPICS);
  try {
    const res = await fetch(`${GUTENDEX}/books?search=${encodeURIComponent(topic || "nature")}&languages=en&copyright=false`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) return fetchDirectGutenberg(language, difficulty, avoidIds);
    const data = await res.json();
    const results: GutendexBook[] = Array.isArray(data.results) ? data.results : [];
    const books = shuffle(results.filter((book) => textFormat(book))).slice(0, 6);
    if (!books.length) return fetchDirectGutenberg(language, difficulty, avoidIds);

    for (const book of books) {
      const url = textFormat(book);
      if (!url) continue;
      try {
        const textRes = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!textRes.ok) continue;
        const text = cleanGutenbergText(await textRes.text());
        const paragraph = extractParagraph(text, difficulty);
        if (!paragraph) continue;
        const author = book.authors?.[0]?.name;
        const id = stableExcerptId(`gutenberg:${book.id}`, paragraph);
        if (avoidIds.has(id)) continue;
        return {
          id,
          language,
          source: "gutenberg",
          title: book.title,
          author,
          url: `https://www.gutenberg.org/ebooks/${book.id}`,
          sentences: sentenceSplit(paragraph),
          wordCount: wordCount(paragraph),
          difficulty,
        };
      } catch {
        continue;
      }
    }
    return fetchDirectGutenberg(language, difficulty, avoidIds);
  } catch {
    return fetchDirectGutenberg(language, difficulty, avoidIds);
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<sup[^>]*>[\s\S]*?<\/sup>/gi, "") // drop footnote/reference markers
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section)>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\[[\d\s,]+\]/g, "") // drop citation brackets like [1]
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function fetchWikisourceHindi(difficulty: Difficulty, avoidIds: Set<string>): Promise<Passage | null> {
  const topic = random(HINDI_TOPICS);
  try {
    const res = await fetch(
      `${WIKISOURCE_HI}?action=query&list=search&srsearch=${encodeURIComponent(topic || "सुबह")}&srnamespace=0&srlimit=10&format=json&origin=*`,
      { signal: AbortSignal.timeout(8000), cache: "no-store" }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const results: WikisourceHit[] = Array.isArray(data.query?.search) ? data.query.search : [];
    const hits = shuffle(results.filter((hit) => !avoidIds.has(`wikisource:${hit.title}`))).slice(0, 6);
    if (!hits.length) return null;

    for (const hit of hits) {
      try {
        const parseRes = await fetch(
          `${WIKISOURCE_HI}?action=parse&page=${encodeURIComponent(hit.title)}&prop=text&format=json&origin=*`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!parseRes.ok) continue;
        const parsed = await parseRes.json();
        const html = parsed.parse?.text?.["*"] || "";
        const text = stripHtml(html);
        const paragraph = extractParagraph(text, difficulty);
        if (!paragraph) continue;
        const id = stableExcerptId(`wikisource:${hit.title}`, paragraph);
        if (avoidIds.has(id)) continue;
        return {
          id,
          language: "hindi",
          source: "wikisource",
          title: hit.title,
          url: `https://hi.wikisource.org/wiki/${encodeURIComponent(hit.title)}`,
          sentences: sentenceSplit(paragraph),
          wordCount: wordCount(paragraph),
          difficulty,
        };
      } catch {
        continue;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function pickLocalFallback(language: Language, difficulty: Difficulty, avoidIds: Set<string>): Passage | null {
  const pool = fallbackPassages[language].filter((p) => p.difficulty === difficulty && !avoidIds.has(p.id));
  if (pool.length) return random(pool) || null;
  const any = fallbackPassages[language].filter((p) => !avoidIds.has(p.id));
  if (any.length) return random(any) || null;
  const all = fallbackPassages[language];
  return random(all) || null;
}

/** A simple curated story served as a reading passage. */
function pickStory(language: Language, difficulty: Difficulty, avoidIds: Set<string>): Passage | null {
  const all = stories[language];
  if (!all?.length) return null;
  const byDifficulty = all.filter((s) => s.difficulty === difficulty && !avoidIds.has(s.id));
  const unused = all.filter((s) => !avoidIds.has(s.id));
  const chosen = random(byDifficulty.length ? byDifficulty : unused.length ? unused : all);
  if (!chosen) return null;
  return {
    id: chosen.id,
    language,
    source: "local",
    title: chosen.title,
    sentences: chosen.sentences,
    wordCount: wordCount(chosen.sentences.join(" ")),
    difficulty,
  };
}

export async function fetchOnlinePassage(language: Language, difficulty: Difficulty, recentIds: string[] = []): Promise<Passage | null> {
  const avoid = new Set(recentIds);
  // English: real public-domain books from Project Gutenberg, with a simple-story fallback.
  if (language === "english") return (await fetchGutenbergPassage("english", difficulty, avoid)) ?? pickStory("english", difficulty, avoid);
  // Hindi & Hinglish: curated simple stories (no reliable, correct-language online source).
  // In particular, Hinglish must be Hindi-English code-mixed text, not English books.
  return pickStory(language, difficulty, avoid);
}

export async function fetchPassage(language: Language, difficulty: Difficulty, recentIds: string[] = []): Promise<Passage> {
  const avoid = new Set(recentIds);
  let passage = await fetchOnlinePassage(language, difficulty, recentIds);

  if (!passage) {
    passage = pickLocalFallback(language, difficulty, avoid);
  }

  if (!passage) {
    passage = pickLocalFallback(language, difficulty, new Set());
  }
  if (!passage) throw new Error(`No passages available for ${language}`);

  return passage;
}

export function fetchWarmup(language: Language): string {
  const list = fallbackWarmups[language];
  return random(list) || "Let's begin gently.";
}

export function naturalPauses(text: string): string[] {
  return text.split(/(?<=[,;:.?!])\s+/).map((s) => s.trim()).filter(Boolean);
}
