'use server';
/**
 * @fileOverview Provides an adjective declension practice exercise with detailed feedback.
 * 
 * - practiceAdjectiveDeclension - A function that checks a user's attempt at declining an adjective and provides detailed feedback.
 * - AdjectivePracticeInput - The input type.
 * - AdjectivePracticeOutput - The return type.
 */

import { ai } from '@/ai/genkit';
import {
  AdjectivePracticeInputSchema,
  AdjectivePracticeOutputSchema,
  type AdjectivePracticeInput,
  type AdjectivePracticeOutput,
} from '@/ai/schemas';

export async function practiceAdjectiveDeclension(input: AdjectivePracticeInput): Promise<AdjectivePracticeOutput> {
  return practiceAdjectiveDeclensionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'practiceAdjectiveDeclensionPrompt',
  input: { schema: AdjectivePracticeInputSchema },
  output: { schema: AdjectivePracticeOutputSchema },
  prompt: `You are an expert German grammar teacher providing feedback on an adjective declension exercise for a Russian-speaking student.

**Exercise Details:**
- Noun: {{noun}} ({{nounArticle}})
- Adjective: {{adjective}}
- Target Case: {{targetCase}}
- Article Type: {{articleType}} ('definite' for der/die/das or 'indefinite' for ein/eine)
- User's Answer: "{{userInput}}"

**Your Task:**

1.  **Determine the Correct Answer:** First, determine the 100% correct form of the adjective phrase based on the noun, its gender (derived from the article), the target case, and the article type (definite or indefinite).

2.  **Evaluate User's Input:** Compare the user's answer with the correct answer. The check must be case-sensitive.

3.  **Generate Detailed Feedback (The most important part!):**
    - **If the user is correct:**
        - Set \`isCorrect\` to \`true\`.
        - Provide a \`correctAnswer\` with the confirmed correct phrase.
        - Write a brief, encouraging \`explanation\` confirming they are right and reinforcing the rule they correctly applied. For example: "Отлично! Всё верно. После определенного артикля в дательном падеже у прилагательных всегда окончание -en."

    - **If the user is incorrect:**
        - Set \`isCorrect\` to \`false\`.
        - Provide the \`correctAnswer\`.
        - Write a comprehensive but clear \`explanation\` in Russian. This explanation is crucial. It must include:
            a. A clear statement of what the error was (e.g., wrong article, wrong adjective ending, wrong article type).
            b. **If the user used an indefinite article instead of a definite one, or vice-versa, explain WHY the requested article type was correct.** For example: "Задание требовало использовать определенный артикль 'dem', а не неопределенный 'einem', так как..."
            c. A step-by-step breakdown of the grammatical rule. Explain *why* the correct ending is what it is. Refer to the case, the gender of the noun, and the type of article (definite, indefinite).
            d. Explicitly state the correct ending and why it's used. For example: "Для существительных мужского рода в винительном падеже с неопределенным артиклем прилагательное получает окончание '-en'."

4.  **Provide Examples:**
    - Generate two distinct, useful example sentences in German that use the **correctly declined phrase** in the target case.
    - Provide a Russian translation for each example sentence.

**Example Scenario (Incorrect Article Type):**
- Input: { noun: "Haus", nounArticle: "das", adjective: "schön", targetCase: "Dativ", articleType: "definite", userInput: "einem schönen Haus" }
- Expected Output:
  {
    "isCorrect": false,
    "correctAnswer": "dem schönen Haus",
    "explanation": "Вы правильно определили падеж (Dativ) и окончание прилагательного, но ошиблись в типе артикля. Задание требовало использовать определенный артикль. Правило: в дательном падеже для существительных среднего рода используется определенный артикль 'dem'. Поэтому верный ответ: 'dem schönen Haus'.",
    "examples": [
      { "sentence": "Ich wohne in dem schönen Haus.", "translation": "Я живу в этом красивом доме." },
      { "sentence": "Wir gehen zu dem schönen Haus.", "translation": "Мы идем к красивому дому." }
    ]
  }

**Example Scenario (Incorrect Adjective Ending):**
- Input: { noun: "Stuhl", nounArticle: "der", adjective: "neu", targetCase: "Akkusativ", articleType: "indefinite", userInput: "einen neue Stuhl" }
- Expected Output:
  {
    "isCorrect": false,
    "correctAnswer": "einen neuen Stuhl",
    "explanation": "Почти правильно, но ошибка в окончании прилагательного. Правило: после неопределенного артикля ('einen') в винительном падеже (Akkusativ) для существительных мужского рода прилагательное всегда получает 'сильное' окончание '-en'. Поэтому правильно: 'einen neuen Stuhl'.",
    "examples": [
      { "sentence": "Ich kaufe einen neuen Stuhl.", "translation": "Я покупаю новый стул." },
      { "sentence": "Er braucht einen neuen Stuhl für sein Büro.", "translation": "Ему нужен новый стул для его офиса." }
    ]
  }
`,
});

const practiceAdjectiveDeclensionFlow = ai.defineFlow(
  {
    name: 'practiceAdjectiveDeclensionFlow',
    inputSchema: AdjectivePracticeInputSchema,
    outputSchema: AdjectivePracticeOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
