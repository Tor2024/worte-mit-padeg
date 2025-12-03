'use server';

/**
 * @fileOverview A flow that generates example sentences for a given German word or phrase.
 *
 * - generateUsageExamples - A function that generates example sentences.
 * - GenerateUsageExamplesInput - The input type for the generateUsageExamples function.
 * - GenerateUsageExamplesOutput - The return type for the generateUsageExamples function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateUsageExamplesInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe('The German word or phrase to generate example sentences for.'),
});

export type GenerateUsageExamplesInput = z.infer<
  typeof GenerateUsageExamplesInputSchema
>;

const GenerateUsageExamplesOutputSchema = z.object({
  exampleSentences: z
    .array(z.string())
    .describe('An array of example sentences for the given word or phrase.'),
});

export type GenerateUsageExamplesOutput = z.infer<
  typeof GenerateUsageExamplesOutputSchema
>;

export async function generateUsageExamples(
  input: GenerateUsageExamplesInput
): Promise<GenerateUsageExamplesOutput> {
  return generateUsageExamplesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateUsageExamplesPrompt',
  input: {schema: GenerateUsageExamplesInputSchema},
  output: {schema: GenerateUsageExamplesOutputSchema},
  prompt: `Вы эксперт по немецкому языку. Создайте примеры предложений для следующего немецкого слова или фразы:

{{wordOrPhrase}}

Убедитесь, что примеры предложений релевантны и эффективно демонстрируют значение и использование слова. Верните примеры предложений в виде массива строк JSON.
`,
});

const generateUsageExamplesFlow = ai.defineFlow(
  {
    name: 'generateUsageExamplesFlow',
    inputSchema: GenerateUsageExamplesInputSchema,
    outputSchema: GenerateUsageExamplesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
