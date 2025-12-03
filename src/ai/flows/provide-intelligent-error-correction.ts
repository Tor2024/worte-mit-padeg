'use server';

/**
 * @fileOverview Provides intelligent error correction with AI explanations and hints.
 *
 * - provideIntelligentErrorCorrection - A function that offers intelligent error checking with AI-powered explanations and helpful hints.
 * - IntelligentErrorCorrectionInput - The input type for the provideIntelligentErrorCorrection function.
 * - IntelligentErrorCorrectionOutput - The return type for the provideIntelligentErrorCorrection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentErrorCorrectionInputSchema = z.object({
  word: z.string().describe('The word or phrase entered by the user.'),
  userInput: z.string().describe('The user input that needs to be checked.'),
  wordType: z.enum(['noun', 'verb', 'adjective', 'adverb', 'other']).describe('The type of the word.'),
  expectedArticle: z.string().optional().describe('The expected article for nouns (der, die, das). Only applicable if wordType is noun.'),
  knownSynonyms: z.array(z.string()).optional().describe('Known synonyms for the word, if any.'),
});

export type IntelligentErrorCorrectionInput = z.infer<typeof IntelligentErrorCorrectionInputSchema>;

const IntelligentErrorCorrectionOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user input is correct or not.'),
  explanation: z.string().describe('The AI explanation for why the input is correct or incorrect.'),
  hint: z.string().optional().describe('A helpful hint to guide the user to the correct answer.'),
});

export type IntelligentErrorCorrectionOutput = z.infer<typeof IntelligentErrorCorrectionOutputSchema>;

export async function provideIntelligentErrorCorrection(
  input: IntelligentErrorCorrectionInput
): Promise<IntelligentErrorCorrectionOutput> {
  return intelligentErrorCorrectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentErrorCorrectionPrompt',
  input: {schema: IntelligentErrorCorrectionInputSchema},
  output: {schema: IntelligentErrorCorrectionOutputSchema},
  prompt: `You are an AI-powered language learning assistant, providing feedback on German word and phrase usage.

  The user is learning the word/phrase: {{{word}}} ({{wordType}})
  User Input: {{{userInput}}}

  Your task is to assess the user's input and provide helpful feedback.

  Here are the specific instructions based on the word type:

  {{#ifEquals wordType "noun"}}
  NOUN:
  - Check if the user input is the correct article (der, die, das) for the noun.
  - If incorrect, explain the correct article and why it is so. Provide a hint if possible.
  - isCorrect should reflect if the correct article was provided
  {{/ifEquals}}

  {{#ifEquals wordType "verb"}}
  VERB:
  - Assess if the verb form and usage are appropriate in the given context.
  - Consider variations and synonyms.
  - Provide an explanation of why the input is correct or incorrect in terms of meaning and grammatical correctness.
  - isCorrect should reflect if the answer is correct, based on meaning and grammatical correctness.
  {{/ifEquals}}

  {{#ifEquals wordType "adjective"}}
  ADJECTIVE:
  - Assess if the adjective form and usage are appropriate in the given context.
  - Consider variations and synonyms.
  - Provide an explanation of why the input is correct or incorrect in terms of meaning and grammatical correctness.
  - isCorrect should reflect if the answer is correct, based on meaning and grammatical correctness.
  {{/ifEquals}}

    {{#ifEquals wordType "adverb"}}
  ADVERB:
  - Assess if the adverb form and usage are appropriate in the given context.
  - Consider variations and synonyms.
  - Provide an explanation of why the input is correct or incorrect in terms of meaning and grammatical correctness.
  - isCorrect should reflect if the answer is correct, based on meaning and grammatical correctness.
  {{/ifEquals}}

  {{#ifEquals wordType "other"}}
  OTHER:
  - Assess if the usage is appropriate in the given context.
  - Provide an explanation of why the input is correct or incorrect.
  - isCorrect should reflect if the answer is correct.
  {{/ifEquals}}

  Output the response as a JSON object with the following fields:
  - isCorrect (boolean): true if the input is correct, false otherwise.
  - explanation (string): A detailed explanation of why the input is correct or incorrect.
  - hint (string, optional): A helpful hint to guide the user to the correct answer (if incorrect).
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const intelligentErrorCorrectionFlow = ai.defineFlow(
  {
    name: 'intelligentErrorCorrectionFlow',
    inputSchema: IntelligentErrorCorrectionInputSchema,
    outputSchema: IntelligentErrorCorrectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

// Helper function for Handlebars
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  // @ts-ignore
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this); //NOSONAR
});

import Handlebars from 'handlebars';

