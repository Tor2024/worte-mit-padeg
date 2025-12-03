'use server';
/**
 * @fileOverview Generates a German case quiz exercise.
 * 
 * - generateCaseQuiz - A function that creates a sentence with a blank and asks the user to determine the correct case.
 * - GenerateCaseQuizInput - The input type.
 * - GenerateCaseQuizOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateCaseQuizInputSchema,
  GenerateCaseQuizOutputSchema,
  type GenerateCaseQuizInput,
  type GenerateCaseQuizOutput,
} from '@/ai/schemas';

export async function generateCaseQuiz(input: GenerateCaseQuizInput): Promise<GenerateCaseQuizOutput> {
  return generateCaseQuizFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCaseQuizPrompt',
  input: { schema: GenerateCaseQuizInputSchema },
  output: { schema: GenerateCaseQuizOutputSchema },
  prompt: `You are an expert German language teacher creating a case-based quiz for a Russian-speaking student.

**Task:**
Create a sentence using the preposition "{{preposition}}" and the noun "{{noun}}". The sentence should have a blank space where the article and any adjective endings would go.

**Instructions:**

1.  **Create a Contextual Sentence:** Form a simple, natural-sounding German sentence that uses the preposition "{{preposition}}" with the noun "{{noun}}". The sentence must clearly require a specific case. For two-way prepositions (Wechselpräpositionen), decide whether the context implies direction (Akkusativ) or location (Dativ).

2.  **Insert a Blank:** In the sentence, replace the article/determiner part of the noun phrase with "____". For example, "Ich fahre mit ____ Auto." or "Er geht in ____ Park.".

3.  **Determine the Correct Case:** Identify the correct grammatical case (Nominativ, Akkusativ, Dativ, or Genitiv) that is required by the preposition in the context of your sentence.

4.  **Determine the Correct Answer:** Figure out the exact word or words that should fill the blank. This is typically an article ('dem', 'den', 'der', etc.).

5.  **Provide Translation:** Give a full Russian translation of the complete German sentence (with the blank filled in) to provide context.

**Output Format:**
Your response must be a single JSON object that adheres to the \`GenerateCaseQuizOutputSchema\`.

-   \`sentence\`: The German sentence with the blank.
-   \`russianTranslation\`: The Russian translation.
-   \`correctCase\`: The correct case as a string ('Nominativ', 'Akkusativ', 'Dativ', 'Genitiv').
-   \`correctAnswer\`: The string that fills the blank.

**Example 1 (Dativ):**
- Input: { preposition: "mit", noun: "Auto" }
- Output:
  {
    "sentence": "Er fährt mit ____ Auto zur Arbeit.",
    "russianTranslation": "Он едет на машине на работу.",
    "correctCase": "Dativ",
    "correctAnswer": "dem"
  }

**Example 2 (Akkusativ - Wechselpräposition):**
- Input: { preposition: "in", noun: "Schule" }
- Output:
  {
    "sentence": "Das Kind geht in ____ Schule.",
    "russianTranslation": "Ребенок идет в школу.",
    "correctCase": "Akkusativ",
    "correctAnswer": "die"
  }

**Example 3 (Dativ - Wechselpräposition):**
- Input: { preposition: "in", noun: "Schule" }
- Output:
  {
    "sentence": "Das Kind lernt in ____ Schule.",
    "russianTranslation": "Ребенок учится в школе.",
    "correctCase": "Dativ",
    "correctAnswer": "der"
  }
`,
});

const generateCaseQuizFlow = ai.defineFlow(
  {
    name: 'generateCaseQuizFlow',
    inputSchema: GenerateCaseQuizInputSchema,
    outputSchema: GenerateCaseQuizOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
