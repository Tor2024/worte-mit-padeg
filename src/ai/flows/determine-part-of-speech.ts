'use server';

/**
 * @fileOverview A flow that determines the part of speech for a given German word or phrase.
 *
 * - determinePartOfSpeech - A function that determines the part of speech.
 * - DeterminePartOfSpeechInput - The input type for the determinePartOfSpeech function.
 * - DeterminePartOfSpeechOutput - The return type for the determinePartOfSpeech function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { WordType } from '@/lib/types';

const DeterminePartOfSpeechInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe('The German word or phrase to determine the part of speech for.'),
});

export type DeterminePartOfSpeechInput = z.infer<
  typeof DeterminePartOfSpeechInputSchema
>;

const DeterminePartOfSpeechOutputSchema = z.object({
  partOfSpeech: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'other'])
    .describe('The determined part of speech.'),
});

export type DeterminePartOfSpeechOutput = z.infer<
  typeof DeterminePartOfSpeechOutputSchema
>;

export async function determinePartOfSpeech(
  input: DeterminePartOfSpeechInput
): Promise<DeterminePartOfSpeechOutput> {
  return determinePartOfSpeechFlow(input);
}

const prompt = ai.definePrompt({
  name: 'determinePartOfSpeechPrompt',
  input: {schema: DeterminePartOfSpeechInputSchema},
  output: {schema: DeterminePartOfSpeechOutputSchema},
  prompt: `You are a German language expert. Determine the part of speech for the following German word or phrase:

{{wordOrPhrase}}

Respond with one of the following: "noun", "verb", "adjective", "adverb", or "other".
If the input is a phrase, determine the most appropriate category or "other".
`,
});

const determinePartOfSpeechFlow = ai.defineFlow(
  {
    name: 'determinePartOfSpeechFlow',
    inputSchema: DeterminePartOfSpeechInputSchema,
    outputSchema: DeterminePartOfSpeechOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
