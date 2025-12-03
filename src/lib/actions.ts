'use server';

import { getWordDetails, provideIntelligentErrorCorrection, generateQuizQuestion, practiceAdjectiveDeclension, checkRecallAnswer as checkRecallAnswerFlow, generateFillInTheBlank, generateCaseQuiz } from '@/ai/flows';
import type { WordDetailsOutput, IntelligentErrorCorrectionInput, IntelligentErrorCorrectionOutput, GenerateQuizQuestionInput, GenerateQuizQuestionOutput, AdjectivePracticeInput, AdjectivePracticeOutput, CheckRecallInput, CheckRecallOutput, GenerateFillInTheBlankInput, GenerateFillInTheBlankOutput, GenerateCaseQuizInput, GenerateCaseQuizOutput } from '@/ai/schemas';

export async function fetchWordDetails(word: string, partOfSpeech?: any): Promise<{ success: true, data: WordDetailsOutput } | { success: false, error: string }> {
  try {
    const result = await getWordDetails({ wordOrPhrase: word, partOfSpeech: partOfSpeech });
    return { success: true, data: result };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Не удалось получить информацию о слове.' };
  }
}

export async function checkAnswer(input: IntelligentErrorCorrectionInput): Promise<{ success: true, data: IntelligentErrorCorrectionOutput } | { success: false, error: string }> {
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

export async function checkRecallAnswer(input: CheckRecallInput): Promise<{ success: true, data: CheckRecallOutput } | { success: false, error: string }> {
    try {
        const result = await checkRecallAnswerFlow(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось проверить перевод.' };
    }
}

export async function fetchFillInTheBlank(input: GenerateFillInTheBlankInput): Promise<{ success: true, data: GenerateFillInTheBlankOutput } | { success: false, error: string }> {
    try {
        const result = await generateFillInTheBlank(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось создать упражнение "Заполните пропуск".' };
    }
}

export async function fetchCaseQuiz(input: GenerateCaseQuizInput): Promise<{ success: true, data: GenerateCaseQuizOutput } | { success: false, error: string }> {
    try {
        const result = await generateCaseQuiz(input);
        return { success: true, data: result };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Не удалось создать викторину по падежам.' };
    }
}
