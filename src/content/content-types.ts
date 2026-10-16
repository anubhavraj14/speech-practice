import { Difficulty, Language } from "@/lib/types";

export type ParagraphLength = "short" | "medium" | "long";

export interface Paragraph {
  id: string;
  difficulty: Difficulty;
  length: ParagraphLength;
  title: string;
  sentences: string[];
  summarize: string;
  followUp: string;
}

export interface Theme {
  key: string;
  title: string;
  language: Language;
  warmups: string[];
  paragraphs: Paragraph[];
  conversation: { question: string; followUps: string[] };
  application: string;
}
