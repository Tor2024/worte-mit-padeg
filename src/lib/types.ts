import type { WordDetailsOutput } from "@/ai/schemas";

export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'preposition' | 'conjunction' | 'other';

export interface Word {
  text: string;
  details: WordDetailsOutput;
  // --- Interval Repetition fields ---
  /** Date for the next review in ISO format */
  nextReview: string;
  /** The current interval in days between reviews */
  interval: number;
  /** A factor representing how easy the word is to remember (starts at 2.5) */
  easeFactor: number;
  /** Number of times the word has been reviewed successfully in a row */
  repetitions: number;
  /** Date of the last review in ISO format */
  lastReviewed: string | null;
}
