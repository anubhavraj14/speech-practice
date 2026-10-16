export type Language = "english" | "hindi" | "hinglish";
export type Difficulty = "easy" | "medium" | "advanced";
export type Category = "pace" | "breathing" | "articulation" | "reading" | "prompts";
/** Target speaking pace for the breath pacer's exhale window. */
export type Pace = "slow" | "steady" | "natural";
/** How often the breath guide suggests a breath. "free" = no enforced inhales. */
export type BreathEvery = "sentence" | "free";

export interface Passage {
  id: string;
  language: Language;
  source: "gutenberg" | "wikisource" | "local";
  title: string;
  author?: string;
  url?: string;
  sentences: string[];
  wordCount: number;
  difficulty: Difficulty;
}

export interface Exercise {
  id: string;
  language: Language;
  category: Category;
  difficulty: Difficulty;
  title: string;
  context: string;
  content: string;
  phrases?: string[];
  tip: string;
  seconds: number;
}

export interface Session {
  id: string;
  date: string;
  duration: number;
  exercises: string[];
  categories: Category[];
  languages: Language[];
  difficulty: Difficulty;
  confidence: number;
  comfort: number;
  notes: string;
}

export interface Preferences {
  goal: 10 | 15 | 20 | 30;
  language: Language | "mixed";
  difficulty: Difficulty;
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
  showPauseMarkers: boolean;
  /** Target speaking pace for the breath pacer. */
  pace: Pace;
  /** Show the breathing orb + inhale markers during reading. */
  breathingGuide: boolean;
  /** Let the pacer flow continuously from one breath group to the next. */
  autoAdvance: boolean;
  /** How often the breath guide suggests a breath. */
  breathEvery: BreathEvery;
  /** @deprecated kept for Supabase schema compatibility; not used in UI */
  skills: string[];
}
