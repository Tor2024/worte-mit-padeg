export type WordType = 'noun' | 'verb' | 'adjective' | 'adverb' | 'other';

export interface Word {
  text: string;
  type: WordType;
  article?: 'der' | 'die' | 'das';
}
