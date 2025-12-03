import type { WordDetailsOutput } from "@/ai/schemas";

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'other';

export interface Word {
  text: string;
  details: WordDetailsOutput;
}
