'use server';

import { getWordDetails, provideIntelligentErrorCorrection, generateQuizQuestion, practiceAdjectiveDeclension, checkRecallAnswer as checkRecallAnswerFlow, generateFillInTheBlank, generateCaseQuiz } from '@/ai/flows';
import type { WordDetailsOutput, IntelligentErrorCorrectionInput, IntelligentErrorCorrectionOutput, GenerateQuizQuestionInput, GenerateQuizQuestionOutput, AdjectivePracticeInput, AdjectivePracticeOutput, CheckRecallInput, CheckRecallOutput, GenerateFillInTheBlankInput, GenerateFillInTheBlankOutput, GenerateCaseQuizInput, GenerateCaseQuizOutput } from '@/ai/schemas';
import { getCachedWordDetails, setCachedWordDetails } from './wordCache';

// Helper function to handle errors more gracefully
const handleActionError = (error: unknown, defaultMessage: string): { success: false, error: string } => {
    console.error(error);
    // Check for specific rate limit error message from Google AI
    if (error instanceof Error && error.message.includes('429')) {
        return { success: false, error: 'Слишком много запросов. Пожалуйста, подождите минуту и попробуйте снова.' };
    }
    // Check if error is an object with a message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
        return { success: false, error: String(error.message) };
    }
    return { success: false, error: defaultMessage };
}

export async function fetchWordDetails(word: string, partOfSpeech?: any): Promise<{ success: true, data: WordDetailsOutput } | { success: false, error: string }> {
  try {
    // Cache is only available on the client
    if (typeof window !== 'undefined') {
      const cachedDetails = getCachedWordDetails(word);
      if (cachedDetails) {
        return { success: true, data: cachedDetails };
      }
    }

    // If not in cache or on the server, fetch from the AI
    const result = await getWordDetails({ wordOrPhrase: word, partOfSpeech: partOfSpeech });

    // Save the result to the cache before returning, only on client
    if (typeof window !== 'undefined') {
      setCachedWordDetails(word, result);
    }

    return { success: true, data: result };
  } catch (error) {
    return handleActionError(error, 'Не удалось получить информацию о слове.');
  }
}

export async function checkAnswer(input: IntelligentErrorCorrectionInput): Promise<{ success: true, data: IntelligentErrorCorrectionOutput } | { success: false, error: string }> {
    try {
        const result = await provideIntelligentErrorCorrection(input);
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось проверить ответ.');
    }
}

export async function fetchQuizQuestion(input: GenerateQuizQuestionInput): Promise<{ success: true, data: GenerateQuizQuestionOutput } | { success: false, error: string }> {
    try {
        const result = await generateQuizQuestion(input);
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось сгенерировать вопрос для теста.');
    }
}

export async function checkAdjectiveDeclension(input: AdjectivePracticeInput): Promise<{ success: true, data: AdjectivePracticeOutput } | { success: false, error: string }> {
    try {
        const result = await practiceAdjectiveDeclension(input);
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось проверить склонение прилагательного.');
    }
}

export async function checkRecallAnswer(input: CheckRecallInput): Promise<{ success: true, data: CheckRecallOutput } | { success: false, error: string }> {
    try {
        const result = await checkRecallAnswerFlow(input);
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось проверить перевод.');
    }
}

export async function fetchFillInTheBlank(input: GenerateFillInTheBlankInput): Promise<{ success: true, data: GenerateFillInTheBlankOutput } | { success: false, error: string }> {
    try {
        const result = await generateFillInTheBlank(input);
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось создать упражнение "Заполните пропуск".');
    }
}

export async function fetchCaseQuiz(input: GenerateCaseQuizInput): Promise<{ success: true, data: GenerateCaseQuizOutput } | { success: false, error: string }> {
    try {
        const result = await generateCaseQuiz(input);
        if (!result.correctAnswer) {
            throw new Error("AI failed to provide a correct answer for the case quiz.");
        }
        return { success: true, data: result };
    } catch (error) {
        return handleActionError(error, 'Не удалось создать викторину по падежам.');
    }
}
