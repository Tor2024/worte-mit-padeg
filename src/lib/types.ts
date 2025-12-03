import type { WordDetailsOutput } from "@/ai/schemas";

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'other';

export interface Word {
  text: string;
  details: WordDetailsOutput;
}
