'use server';

import { getWordDetails } from '@/ai/flows';
import type { WordDetailsOutput } from '@/ai/flows';

export async function fetchWordDetails(word: string): Promise<{ success: true, data: WordDetailsOutput } | { success: false, error: string }> {
  try {
    const result = await getWordDetails({ wordOrPhrase: word });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось получить информацию о слове.' };
  }
}
