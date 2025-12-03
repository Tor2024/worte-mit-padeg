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
Create a grammatically and logically correct sentence using the preposition "{{preposition}}" and the noun "{{noun}}". The sentence should have a blank space where an article and/or adjective ending should be. The task requires the user to use a specific article type: '{{articleType}}'.

**CRITICAL Instructions:**

1.  **Create a Natural and CORRECT Sentence:**
    - Form a simple, natural-sounding, and **absolutely correct** German sentence. Your top priority is that the sentence must be something a native speaker would actually say.
    - The verb and context you create **MUST** logically and commonly be used with the given preposition "{{preposition}}".
    - **DO NOT** create nonsensical or grammatically questionable sentences. For example, if the preposition is "bis", do not use the verb "warten", because "warten bis" is incorrect German ("warten auf" is correct). If the preposition is "von", do not use it with "sprechen" if "sprechen über" sounds more natural in the context.
    - The sentence must clearly require a specific case (Nominativ, Akkusativ, Dativ, or Genitiv).
    - For two-way prepositions (Wechselpräpositionen), decide whether the context implies direction (Akkusativ) or location (Dativ) and create the sentence accordingly.

2.  **Insert a Blank:** In the sentence, replace ONLY the article/determiner and any adjective endings with "____".
    - Example: "Er spielt mit ____ neuen Haus." (The blank is for 'dem' or 'einem', depending on the articleType).
    - Example: "Ich fahre mit ____ Auto." (The blank is for 'dem' or 'einem').

3.  **Determine the Correct Case:** Identify the correct grammatical case (Nominativ, Akkusativ, Dativ, or Genitiv) that is required by the preposition in the context of your sentence.

4.  **Determine the Correct Answer:** Based on the requested \`{{articleType}}\` (definite or indefinite), figure out the exact word(s) that should fill the blank. This is the only thing that should be in the \`correctAnswer\` field.
    - If \`articleType\` is 'definite', use 'dem', 'den', 'der', 'die', 'das'.
    - If \`articleType\` is 'indefinite', use 'einem', 'einen', 'einer', 'eine', 'ein'.
    - If there's an adjective, the correct answer must include the article and the correctly declined adjective. E.g. "einem neuen".

5.  **Provide Translation:** Give a full Russian translation of the complete German sentence (with the blank filled in using the correct answer) to provide context.

**Output Format:**
Your response must be a single JSON object that adheres to the \`GenerateCaseQuizOutputSchema\`.

**Example 1 (Dativ, indefinite):**
- Input: { preposition: "mit", noun: "Auto", articleType: "indefinite" }
- Output:
  {
    "sentence": "Er fährt mit ____ Auto zur Arbeit.",
    "russianTranslation": "Он едет на (какой-то) машине на работу.",
    "correctCase": "Dativ",
    "correctAnswer": "einem"
  }

**Example 2 (Akkusativ, definite):**
- Input: { preposition: "in", noun: "Schule", articleType: "definite" }
- Output:
  {
    "sentence": "Das Kind geht in ____ Schule.",
    "russianTranslation": "Ребенок идет в (эту) школу.",
    "correctCase": "Akkusativ",
    "correctAnswer": "die"
  }

**Example 3 (Dativ, definite, with Adjective):**
- Input: { preposition: "mit", noun: "Haus", articleType: "definite" }
- Output:
  {
    "sentence": "Er spielt mit ____ schönen Haus.",
    "russianTranslation": "Он играет с (этим) красивым домом.",
    "correctCase": "Dativ",
    "correctAnswer": "dem schönen"
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
