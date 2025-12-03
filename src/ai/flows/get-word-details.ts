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

4.  **verbDetails**: If it's a verb:
    - **presentTense**: Provide its full present tense conjugation for all persons (ich, du, er/sie/es, wir, ihr, sie/Sie).
    - **perfect**: Provide its perfect tense form (e.g., "ist gegangen").
    - **prateritum**: Provide its Präteritum tense form (e.g., "ging").
    - **futurI**: Provide its Futur I tense form (e.g., "wird gehen").
    - **verbGovernment**: Specify the case(s) it governs (e.g., "Dativ", "Akkusativ", "Dativ + Akkusativ") or the specific preposition it's commonly used with (e.g., "warten auf + Akkusativ").
    - **isReflexive**: Set to true if it is a reflexive verb (used with "sich").

5.  **adjectiveDetails**: If it's an adjective:
    - **comparative**: Provide the comparative form (e.g., "schöner").
    - **superlative**: Provide the superlative form (e.g., "am schönsten").
    - **antonym**: Provide a relevant antonym if one exists.

6.  **prepositionDetails**: If it's a preposition:
    - **case**: Specify the case it governs ('Akkusativ', 'Dativ', 'Genitiv', or 'Wechselpräposition').
    - **dualCaseExplanation**: For 'Wechselpräposition', provide a clear explanation: "Akkusativ (куда?) / Dativ (где?)".
    - **commonContractions**: List common contractions with articles (e.g., "in + dem = im, an + das = ans").

7.  **conjunctionDetails**: If it's a conjunction, specify the verb position it leads to ('secondPosition' or 'endOfSentence').

8.  **examples**: Provide three distinct and useful example sentences.
    - **Crucially, each example must use the exact word "{{wordOrPhrase}}" and not a related word with a prefix (like 'mitbringen' for 'bringen').**
    - Each example must have both the German sentence and its accurate Russian translation.
    - If the word is a verb, one of the three examples must show its usage in the perfect tense.

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
