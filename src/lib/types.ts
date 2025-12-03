import type { WordDetailsOutput } from "@/ai/flows";

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';

export interface Word {
  text: string;
  details: WordDetailsOutput;
}
