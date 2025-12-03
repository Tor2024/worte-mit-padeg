'use server';

/**
 * @fileOverview A flow that provides detailed information about a German word or phrase for learning purposes.
 *
 * - getWordDetails - A function that fetches comprehensive details about a word.
 * - WordDetailsInput - The input type for the getWordDetails function.
 * - WordDetailsOutput - The return type for the getWordDetails function.
 */

import {ai} from '@/ai/genkit';
import {
  WordDetailsInputSchema,
  WordDetailsOutputSchema,
  type WordDetailsInput,
  type WordDetailsOutput,
} from '@/ai/schemas';

export async function getWordDetails(
  input: WordDetailsInput
): Promise<WordDetailsOutput> {
  return getWordDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWordDetailsPrompt',
  input: {schema: WordDetailsInputSchema},
  output: {schema: WordDetailsOutputSchema},
  prompt: `You are an expert German language teacher creating learning materials for a Russian-speaking student.

For the given German word or phrase "{{wordOrPhrase}}", provide a comprehensive set of details in the specified JSON format.

1.  **translation**: Provide the primary Russian translation.
2.  **partOfSpeech**: Determine the correct part of speech.
3.  **nounDetails**: If it's a noun, provide its article ('der', 'die', or 'das') and its plural form.
4.  **verbDetails**: If it's a verb, provide its full present tense conjugation for all persons (ich, du, er/sie/es, wir, ihr, sie/Sie) and its perfect tense form. Format the present tense conjugation clearly, with each person on a new line.
5.  **prepositionDetails**: If it's a preposition, specify the case it governs (e.g., 'Akkusativ', 'Dativ', 'Genitiv', or 'Wechselpräposition' if it's a two-way preposition).
6.  **examples**: Provide three distinct and useful example sentences. Each example must have both the German sentence and its accurate Russian translation.

Your response must be a valid JSON object matching the output schema.
`,
});

const getWordDetailsFlow = ai.defineFlow(
  {
    name: 'getWordDetailsFlow',
    inputSchema: WordDetailsInputSchema,
    outputSchema: WordDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
