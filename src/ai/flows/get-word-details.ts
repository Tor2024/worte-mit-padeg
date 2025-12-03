'use server';

/**
 * @fileOverview A flow that provides detailed information about a German word or phrase for learning purposes.
 *
 * - getWordDetails - A function that fetches comprehensive details about a word.
 * - WordDetailsInput - The input type for the getWordDetails function.
 * - WordDetailsOutput - The return type for the getWordDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const WordDetailsInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe('The German word or phrase to get details for.'),
});
export type WordDetailsInput = z.infer<typeof WordDetailsInputSchema>;

const ExampleSentenceSchema = z.object({
  german: z.string().describe('The example sentence in German.'),
  russian: z.string().describe('The Russian translation of the sentence.'),
});

const WordDetailsOutputSchema = z.object({
  translation: z.string().describe('The Russian translation of the word/phrase.'),
  partOfSpeech: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'other'])
    .describe('The determined part of speech.'),
  nounDetails: z
    .object({
      article: z
        .enum(['der', 'die', 'das'])
        .describe("The noun's article."),
      plural: z.string().describe("The plural form of the noun."),
    })
    .optional()
    .describe('Details specific to nouns.'),
  verbDetails: z
    .object({
      presentTense: z.string().describe('The verb conjugation in the present tense (e.g., "ich gehe, du gehst...").'),
      perfect: z.string().describe('The perfect tense form (e.g., "ist gegangen").')
    })
    .optional()
    .describe('Details specific to verbs.'),
  prepositionDetails: z
    .object({
        case: z.enum(['Akkusativ', 'Dativ', 'Genitiv', 'Wechselpräposition']).describe('The case the preposition is used with (e.g., Akkusativ, Dativ, Genitiv, or Wechselpräposition for two-way prepositions).'),
    })
    .optional()
    .describe('Details specific to prepositions.'),
  examples: z
    .array(ExampleSentenceSchema)
    .describe('An array of example sentences, each with German and Russian versions.'),
});
export type WordDetailsOutput = z.infer<typeof WordDetailsOutputSchema>;

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
4.  **verbDetails**: If it's a verb, provide its present tense conjugation for 'ich, du, er/sie/es' and its perfect tense form.
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
