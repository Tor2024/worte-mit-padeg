'use server';

import { getWordDetails, provideIntelligentErrorCorrection, generateQuizQuestion, practiceAdjectiveDeclension } from '@/ai/flows';
import type { WordDetailsOutput, IntelligentErrorCorrectionInput, IntelligentErrorCorrectionOutput, GenerateQuizQuestionInput, GenerateQuizQuestionOutput, AdjectivePracticeInput, AdjectivePracticeOutput } from '@/ai/schemas';

export async function fetchWordDetails(word: string): Promise<{ success: true, data: WordDetailsOutput } | { success: false, error: string }> {
  try {
    const result = await getWordDetails({ wordOrPhrase: word });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось получить информацию о слове.' };
  }
}

export async function checkArticle(input: IntelligentErrorCorrectionInput): Promise<{ success: true, data: IntelligentErrorCorrectionOutput } | { success: false, error: string }> {
    try {
        const result = await provideIntelligentErrorCorrection(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось проверить ответ.' };
    }
}

export async function fetchQuizQuestion(input: GenerateQuizQuestionInput): Promise<{ success: true, data: GenerateQuizQuestionOutput } | { success: false, error: string }> {
    try {
        const result = await generateQuizQuestion(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось сгенерировать вопрос для теста.' };
    }
}

export async function checkAdjectiveDeclension(input: AdjectivePracticeInput): Promise<{ success: true, data: AdjectivePracticeOutput } | { success: false, error: string }> {
    try {
        const result = await practiceAdjectiveDeclension(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось проверить склонение прилагательного.' };
    }
}