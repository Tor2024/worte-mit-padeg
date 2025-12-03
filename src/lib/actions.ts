'use server';

import {
  generateUsageExamples,
  provideIntelligentErrorCorrection,
  generateNewSentences,
} from '@/ai/flows';

import type { Word } from './types';
import type { IntelligentErrorCorrectionOutput, GenerateNewSentencesOutput } from '@/ai/flows';

export async function getUsageExamples(word: string): Promise<{ success: true, data: string[] } | { success: false, error: string }> {
  try {
    const result = await generateUsageExamples({ wordOrPhrase: word });
    return { success: true, data: result.exampleSentences };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось сгенерировать примеры.' };
  }
}

export async function checkArticle(word: Word, selectedArticle: 'der' | 'die' | 'das'): Promise<{ success: true, data: IntelligentErrorCorrectionOutput } | { success: false, error: string }> {
  if (word.type !== 'noun' || !word.article) {
    return { success: false, error: 'Это не является допустимым существительным для викторины.' };
  }
  try {
    const result = await provideIntelligentErrorCorrection({
      word: word.text,
      userInput: selectedArticle,
      wordType: 'noun',
      expectedArticle: word.article,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось проверить артикль.' };
  }
}

export async function getAiPractice(word: string): Promise<{ success: true, data: GenerateNewSentencesOutput } | { success: false, error: string }> {
  try {
    const result = await generateNewSentences({ word: word });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось сгенерировать практическое задание.' };
  }
}
