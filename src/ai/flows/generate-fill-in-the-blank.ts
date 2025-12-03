'use server';
/**
 * @fileOverview Generates a "fill-in-the-blank" exercise.
 *
 * - generateFillInTheBlank - A function that creates a sentence with a blank space for the user to fill in.
 * - GenerateFillInTheBlankInput - The input type for the function.
 * - GenerateFillInTheBlankOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateFillInTheBlankInputSchema,
  GenerateFillInTheBlankOutputSchema,
  type GenerateFillInTheBlankInput,
  type GenerateFillInTheBlankOutput,
} from '@/ai/schemas';

export async function generateFillInTheBlank(input: GenerateFillInTheBlankInput): Promise<GenerateFillInTheBlankOutput> {
  return generateFillInTheBlankFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFillInTheBlankPrompt',
  input: { schema: GenerateFillInTheBlankInputSchema },
  output: { schema: GenerateFillInTheBlankOutputSchema },
  prompt: `You are an AI language teacher creating a fill-in-the-blank exercise for a Russian-speaking student learning German.

**Task:**
Based on the provided German word "{{word}}" and one of its example sentences, create a fill-in-the-blank puzzle.

**Word Details:**
- German Word: {{word}}
- Part of Speech: {{partOfSpeech}}
- Example Sentence (German): "{{example.german}}"
- Example Sentence (Russian Translation): "{{example.russian}}"

**Instructions:**

1.  **Create the Blank:** Take the German example sentence and replace the target word "{{word}}" with a blank marker like "______".
    - The replacement must be exact. If the word in the sentence has a different form (e.g., a conjugated verb, a declined adjective), you must find and replace that specific form. For example, if the word is "gehen" and the sentence is "Er ist gegangen", you must replace "gegangen".
    - Your primary tool for this should be a case-insensitive search for the base word "{{word}}" and its variations. The most likely candidate for replacement is a word that starts with the same letters.

2.  **Identify the Correct Answer:** The "correctAnswer" is the exact word or form that was removed from the sentence.

3.  **Formulate the Output:** Your final output must be a single JSON object matching the GenerateFillInTheBlankOutputSchema.
    - \`sentenceWithBlank\`: The German sentence with "______" in place of the word.
    - \`correctAnswer\`: The exact word that was removed.
    - \`russianTranslation\`: The original Russian translation of the full sentence, to provide context.

**Example:**
- Input: { word: "Haus", partOfSpeech: "noun", example: { german: "Ich wohne in dem schönen Haus.", russian: "Я живу в этом красивом доме." } }
- Output:
  {
    "sentenceWithBlank": "Ich wohne in dem schönen ______.",
    "correctAnswer": "Haus",
    "russianTranslation": "Я живу в этом красивом доме."
  }

**Example (Verb):**
- Input: { word: "gehen", partOfSpeech: "verb", example: { german: "Wir sind ins Kino gegangen.", russian: "Мы пошли в кино." } }
- Output:
  {
    "sentenceWithBlank": "Wir sind ins Kino ______.",
    "correctAnswer": "gegangen",
    "russianTranslation": "Мы пошли в кино."
  }
`,
});

const generateFillInTheBlankFlow = ai.defineFlow(
  {
    name: 'generateFillInTheBlankFlow',
    inputSchema: GenerateFillInTheBlankInputSchema,
    outputSchema: GenerateFillInTheBlankOutputSchema,
  },
  async (input) => {
    // This is a complex task for an LLM. We can help it by trying a simple replacement first.
    // This regex looks for the word as a whole word, case-insensitively.
    const baseWord = input.word.replace(/[\W_]+$/, ''); // handle cases like "sich (D) ansehen"
    const regex = new RegExp(`\\b${baseWord}\\b`, 'i');
    
    if (regex.test(input.example.german)) {
        const match = input.example.german.match(regex);
        if (match) {
            const sentenceWithBlank = input.example.german.replace(regex, "______");
            return {
                sentenceWithBlank,
                correctAnswer: match[0],
                russianTranslation: input.example.russian,
            };
        }
    }

    // If simple replacement fails, let the LLM handle the more complex cases (like conjugated verbs).
    const { output } = await prompt(input);
    return output!;
  }
);

    