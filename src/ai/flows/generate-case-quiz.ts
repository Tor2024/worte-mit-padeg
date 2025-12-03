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
Create a grammatically and logically correct sentence using the preposition "{{preposition}}" and the noun "{{noun}}". The sentence should have a blank space.

**CRITICAL Instructions:**

1.  **Create a Contextual and CORRECT Sentence:**
    - Form a simple, natural-sounding, and **absolutely correct** German sentence.
    - The verb and context you create **MUST** logically work with the given preposition "{{preposition}}".
    - **DO NOT** create nonsensical sentences. For example, if the preposition is "bis", do not use the verb "warten", because "warten bis" is incorrect German ("warten auf" is correct). Your primary goal is correctness.
    - The sentence must clearly require a specific case (Nominativ, Akkusativ, Dativ, or Genitiv).
    - For two-way prepositions (Wechselpräpositionen), decide whether the context implies direction (Akkusativ) or location (Dativ) and create the sentence accordingly.

2.  **Insert a Blank:** In the sentence, replace ONLY the article/determiner with "____".
    - If you decide to include an adjective, its ending should already be in the sentence. The blank is ONLY for the article.
    - Example with adjective: "Er spielt mit ____ kleinen Haus." (The blank is for 'dem').
    - Example without adjective: "Ich fahre mit ____ Auto." (The blank is for 'dem').

3.  **Determine the Correct Case:** Identify the correct grammatical case (Nominativ, Akkusativ, Dativ, or Genitiv) that is required by the preposition in the context of your sentence.

4.  **Determine the Correct Answer:** Figure out the exact article ('dem', 'den', 'der', 'die', 'das', 'einen', 'einem', etc.) that should fill the blank. This is the only thing that should be in the \`correctAnswer\` field.

5.  **Provide Translation:** Give a full Russian translation of the complete German sentence (with the blank filled in) to provide context.

**Output Format:**
Your response must be a single JSON object that adheres to the \`GenerateCaseQuizOutputSchema\`.

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

**Example 3 (Dativ - with Adjective):**
- Input: { preposition: "mit", noun: "Haus" }
- Output:
  {
    "sentence": "Er spielt mit ____ kleinen Haus.",
    "russianTranslation": "Он играет с маленьким домом.",
    "correctCase": "Dativ",
    "correctAnswer": "dem"
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
    if (!output?.correctAnswer) {
      throw new Error("AI failed to generate a valid correct answer.");
    }
    return output!;
  }
);
