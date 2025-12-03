'use server';
/**
 * @fileOverview Checks a user's recall of a German word from its Russian translation.
 * 
 * - checkRecallAnswer - A function that evaluates the user's input, allowing for synonyms.
 * - CheckRecallInput - The input type.
 * - CheckRecallOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import {
  CheckRecallInputSchema,
  CheckRecallOutputSchema,
  type CheckRecallInput,
  type CheckRecallOutput,
} from '@/ai/schemas';

export async function checkRecallAnswer(input: CheckRecallInput): Promise<CheckRecallOutput> {
  return checkRecallAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'checkRecallAnswerPrompt',
  input: { schema: CheckRecallInputSchema },
  output: { schema: CheckRecallOutputSchema },
  prompt: `You are a German language teacher evaluating a student's answer.

**Task:**
The student was asked to translate the Russian word "{{russianWord}}" into German.
- The expected German word is: "{{germanWord}}"
{{#if article}}
- It's a noun, so the expected answer format is article + noun: "{{article}} {{germanWord}}"
{{/if}}
- The user's answer is: "{{userInput}}"

**Evaluation Steps:**

1.  **Direct Match:**
    - First, check if the user's input is an exact, case-insensitive match for the expected answer. 
    - For nouns, the user MUST provide the article. "Haus" is incorrect if "das Haus" was expected.
    - If it's an exact match, set \`isCorrect\` to \`true\` and \`isSynonym\` to \`false\`.

2.  **Synonym Check:**
    - If it's not a direct match, determine if the user's input is a valid German synonym for "{{germanWord}}".
    - For example, if the expected word was "deshalb", answers like "darum" or "deswegen" are also correct.
    - If it's a valid synonym:
        - Set \`isCorrect\` to \`true\`.
        - Set \`isSynonym\` to \`true\`.
        - The explanation should confirm it's a good synonym.

3.  **Incorrect Answer:**
    - If the answer is neither a direct match nor a valid synonym, set \`isCorrect\` to \`false\` and \`isSynonym\` to \`false\`.
    - The explanation should clearly state why the answer is wrong.

**Output Generation:**

- \`isCorrect\`: \`true\` if the answer is a direct match OR a valid synonym.
- \`isSynonym\`: \`true\` ONLY if it's a valid synonym, otherwise \`false\`.
- \`correctAnswer\`: Always provide the original, exact expected answer (e.g., "{{article}} {{germanWord}}" or just "{{germanWord}}").
- \`explanation\`: Provide a clear explanation in Russian based on the evaluation steps.
    - Correct match: "Отлично! Все верно."
    - Synonym: "Тоже правильно! '{{userInput}}' — хороший синоним для '{{germanWord}}'."
    - Incorrect: "Не совсем верно. Правильный ответ: '{{correctAnswer}}'. [Your brief explanation of the error]."

**Example (Correct):**
- Input: { russianWord: "дом", germanWord: "Haus", article: "das", userInput: "das Haus" }
- Output: { "isCorrect": true, "isSynonym": false, "correctAnswer": "das Haus", "explanation": "Отлично! Все верно." }

**Example (Synonym):**
- Input: { russianWord: "поэтому", germanWord: "deshalb", userInput: "darum" }
- Output: { "isCorrect": true, "isSynonym": true, "correctAnswer": "deshalb", "explanation": "Тоже правильно! 'darum' — хороший синоним для 'deshalb'." }

**Example (Incorrect):**
- Input: { russianWord: "стул", germanWord: "Stuhl", article: "der", userInput: "das Stuhl" }
- Output: { "isCorrect": false, "isSynonym": false, "correctAnswer": "der Stuhl", "explanation": "Не совсем верно. Правильный ответ: 'der Stuhl', потому что существительное 'Stuhl' мужского рода." }
`,
});

const checkRecallAnswerFlow = ai.defineFlow(
  {
    name: 'checkRecallAnswerFlow',
    inputSchema: CheckRecallInputSchema,
    outputSchema: CheckRecallOutputSchema,
  },
  async (input) => {
    const correctAnswer = input.article ? `${input.article} ${input.germanWord}` : input.germanWord;
    
    // Pre-process user input for nouns to ensure it contains an article if expected
    if (input.partOfSpeech === 'noun' && input.article) {
        if (!/^(der|die|das)\s/i.test(input.userInput)) {
            // If user didn't provide an article, we can short-circuit the AI call
            return {
                isCorrect: false,
                isSynonym: false,
                correctAnswer: correctAnswer,
                explanation: `Неверно. Для существительных нужно указывать артикль. Правильный ответ: "${correctAnswer}".`
            }
        }
    }
    const { output } = await prompt({...input, correctAnswer });
    if (output) {
      output.correctAnswer = correctAnswer;
    }
    return output!;
  }
);
