'use server';

/**
 * @fileOverview AI-powered content generation for new sentences with learned words and suggested related words and phrases.
 *
 * - generateNewSentences - A function that generates new sentences with learned words and suggests related words and phrases, personalized to the user's learning progress.
 * - GenerateNewSentencesInput - The input type for the generateNewSentences function.
 * - GenerateNewSentencesOutput - The return type for the generateNewSentences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewSentencesInputSchema = z.object({
  word: z.string().describe('The word for which to generate new sentences.'),
  context: z.string().optional().describe('Context related to the word for better sentence generation.'),
  learningProgress: z.string().optional().describe('The user learning progress.'),
});
export type GenerateNewSentencesInput = z.infer<typeof GenerateNewSentencesInputSchema>;

const GenerateNewSentencesOutputSchema = z.object({
  sentences: z.array(z.string()).describe('Array of new sentences using the provided word.'),
  relatedWords: z.array(z.string()).describe('Array of related words and phrases.'),
  progress: z.string().describe('Progress of the AI generation.'),
});
export type GenerateNewSentencesOutput = z.infer<typeof GenerateNewSentencesOutputSchema>;

export async function generateNewSentences(input: GenerateNewSentencesInput): Promise<GenerateNewSentencesOutput> {
  return generateNewSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewSentencesPrompt',
  input: {schema: GenerateNewSentencesInputSchema},
  output: {schema: GenerateNewSentencesOutputSchema},
  prompt: `Вы — ИИ-помощник для изучения языков. Ваша цель — помочь пользователям выучить немецкий язык, создавая примеры предложений со словами, которые они изучают, и предлагая связанные слова и фразы.

  Слово: {{{word}}}
  Контекст: {{{context}}}
  Прогресс обучения: {{{learningProgress}}}

  Создайте 3 примера предложений с использованием данного слова. Также предложите 5 связанных немецких слов или фраз.

  Предложения:
  - ...
  Связанные слова:
  - ...

  Убедитесь, что сгенерированные предложения контекстуально релевантны и полезны для изучающих язык. Помните, что пользователь изучает немецкий язык, и давайте простые, но полезные примеры.
  Убедитесь, что поле "sentences" — это просто список предложений, а "relatedWords" — это просто список связанных слов.`,
});

const generateNewSentencesFlow = ai.defineFlow(
  {
    name: 'generateNewSentencesFlow',
    inputSchema: GenerateNewSentencesInputSchema,
    outputSchema: GenerateNewSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    output!.progress = 'Сгенерированы предложения с использованием выученного слова и предложены связанные слова и фразы.';
    return output!;
  }
);
