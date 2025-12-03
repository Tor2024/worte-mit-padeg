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
  // Auto-capitalize nouns
  if (input.partOfSpeech === 'noun' && input.wordOrPhrase) {
    input.wordOrPhrase = input.wordOrPhrase.charAt(0).toUpperCase() + input.wordOrPhrase.slice(1);
  } else if (input.wordOrPhrase) {
    input.wordOrPhrase = input.wordOrPhrase.toLowerCase();
  }
  return getWordDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getWordDetailsPrompt',
  input: {schema: WordDetailsInputSchema},
  output: {schema: WordDetailsOutputSchema},
  prompt: `You are an expert German language teacher creating learning materials for a Russian-speaking student.

For the given German word or phrase "{{wordOrPhrase}}", provide a comprehensive set of details in the specified JSON format.

1.  **translation**: Provide the primary Russian translation.
2.  **alternativeTranslations**: Provide a list of up to 3 alternative Russian translations if they exist, especially if the meaning changes with context or article. For example, for "der See" (озеро), you might list the translation for "die See" (море). For "bis", you could provide "до" and "пока". If no alternatives, return an empty array.
3.  **partOfSpeech**: Determine the correct part of speech.

4.  **nounDetails**: If it's a noun, provide its article ('der', 'die', or 'das') and its plural form. The input word might be lowercased, but your output should be for the correctly capitalized noun.

5.  **verbDetails**: If it's a verb:
    - **presentTense**: Provide its full present tense conjugation for all persons (ich, du, er/sie/es, wir, ihr, sie/Sie).
    - **perfect**: Provide its perfect tense form (e.g., "ist gegangen").
    - **prateritum**: Provide its **full** Präteritum tense conjugation for all persons.
    - **futurI**: Provide its **full** Futur I tense conjugation for all persons.
    - **verbGovernment**: Specify the case(s) it governs (e.g., "Dativ", "Akkusativ", "Dativ + Akkusativ") or the specific preposition it's commonly used with (e.g., "warten auf + Akkusativ").
    - **isReflexive**: Set to true if it is a reflexive verb (used with "sich").

6.  **adjectiveDetails**: If it's an adjective:
    - **comparative**: Provide the comparative form (e.g., "schöner").
    - **superlative**: Provide the superlative form (e.g., "am schönsten").
    - **antonym**: Provide a relevant antonym if one exists.

7.  **prepositionDetails**: If it's a preposition:
    - **case**: Specify the case it governs ('Akkusativ', 'Dativ', 'Genitiv', or 'Wechselpräposition').
    - **dualCaseExplanation**: For 'Wechselpräposition', provide a clear explanation: "Akkusativ (куда?) / Dativ (где?)".
    - **commonContractions**: List common, frequently used contractions with articles (e.g., "in + dem = im, an + das = ans, von + dem = vom, zu + der = zur"). If there are none, return null for this field.

8.  **conjunctionDetails**: If it's a conjunction, specify the verb position it leads to ('secondPosition' or 'endOfSentence').

9.  **examples**: Provide three distinct and useful example sentences.
    - **Crucially, each example must use the exact word "{{wordOrPhrase}}" and not a related word with a prefix (like 'mitbringen' for 'bringen').**
    - Each example must have both the German sentence and its accurate Russian translation.
    - If the word is a verb, one of the three examples must show its usage in the perfect tense.
    - **CRITICAL**: When generating example sentences, always use common contractions of prepositions with articles (e.g., im, am, zum, zur, vom) where appropriate to make the language sound more natural. For example, instead of "Ich gehe in dem Park", write "Ich gehe im Park".

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
    
    // Ensure the main word is correctly cased in the output
    if (output) {
      if (output.partOfSpeech === 'noun') {
        input.wordOrPhrase = input.wordOrPhrase.charAt(0).toUpperCase() + input.wordOrPhrase.slice(1);
      } else {
        input.wordOrPhrase = input.wordOrPhrase.toLowerCase();
      }
    }
    
    return output!;
  }
);
