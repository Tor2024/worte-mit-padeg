'use server';
/**
 * @fileOverview Generates a multiple-choice quiz question for a German word.
 *
 * - generateQuizQuestion - A function that creates a quiz question with distractors.
 * - GenerateQuizQuestionInput - The input type for the function.
 * - GenerateQuizQuestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import {
  GenerateQuizQuestionInputSchema,
  GenerateQuizQuestionOutputSchema,
  type GenerateQuizQuestionInput,
  type GenerateQuizQuestionOutput,
} from '@/ai/schemas';

export async function generateQuizQuestion(input: GenerateQuizQuestionInput): Promise<GenerateQuizQuestionOutput> {
  return generateQuizQuestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateQuizQuestionPrompt',
  input: { schema: GenerateQuizQuestionInputSchema },
  output: { schema: GenerateQuizQuestionOutputSchema },
  prompt: `You are an AI language teacher creating multiple-choice questions for a Russian-speaking student learning German.

Given the German word "{{word}}" and its details, create THREE distinct and relevant quiz questions.

**Word Details:**
- Part of Speech: {{details.partOfSpeech}}
- Translation: {{details.translation}}
{{#if details.nounDetails}}
- Article: {{details.nounDetails.article}}
- Plural: {{details.nounDetails.plural}}
{{/if}}
{{#if details.verbDetails}}
- Perfect Tense: {{details.verbDetails.perfect}}
{{/if}}
{{#if details.prepositionDetails}}
- Case: {{details.prepositionDetails.case}}
{{/if}}

**Instructions:**

1.  **Choose Question Types:** Based on the available details, choose THREE DIFFERENT question types from the following list. If fewer than three types are possible, you may repeat a type but MUST ask a different question.
    *   'translation': Ask for the Russian translation.
    *   'article': (If noun) Ask for the article.
    *   'plural': (If noun with a non-obvious plural) Ask for the plural form.
    *   'perfect_tense': (If verb) Ask for the perfect tense.
    *   'case': (If preposition) Ask for the case it governs.

2.  **Formulate Questions:** For each chosen type, write a clear question in Russian.
    *   Example for translation: "Какой перевод у слова '{{word}}'?"
    *   Example for article: "Какой артикль у существительного '{{word}}'?"

3.  **Generate Options for Each Question:**
    *   Provide a total of 4 options for each question.
    *   One option must be the correctAnswer.
    *   The other three options must be plausible but incorrect **distractors**.
    *   For translations, find incorrect translations of other common German words.
    *   For articles, the options should be 'der', 'die', 'das', and a plausible distractor like 'den'. The options MUST be shuffled.
    *   For plurals, create grammatically plausible but incorrect plural forms.
    *   All options, including the correct answer, must be shuffled randomly in the 'options' array for each question.

4.  **Response Format:** Your final output must be a JSON array containing exactly three question objects, matching the GenerateQuizQuestionOutputSchema.

**Example for the word "Haus":**
[
  {
    "question": "Какой артикль у существительного 'Haus'?",
    "questionType": "article",
    "options": ["der", "die", "das", "den"],
    "correctAnswer": "das"
  },
  {
    "question": "Какой перевод у слова 'Haus'?",
    "questionType": "translation",
    "options": ["дом", "дерево", "машина", "книга"],
    "correctAnswer": "дом"
  },
  {
    "question": "Какая форма множественного числа у слова 'Haus'?",
    "questionType": "plural",
    "options": ["Häuser", "Hause", "Hausen", "Häuseren"],
    "correctAnswer": "Häuser"
  }
]
`,
});

const generateQuizQuestionFlow = ai.defineFlow(
  {
    name: 'generateQuizQuestionFlow',
    inputSchema: GenerateQuizQuestionInputSchema,
    outputSchema: GenerateQuizQuestionOutputSchema,
  },
  async (input): Promise<GenerateQuizQuestionOutput> => {
    try {
      const { output, finishReason } = await prompt(input);

      if (finishReason !== 'stop' || !output || !Array.isArray(output) || output.length === 0) {
        throw new Error('AI failed to generate a valid array of quiz questions.');
      }

      // Shuffle options for each question
      output.forEach(q => q.options.sort(() => Math.random() - 0.5));

      return output;
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      // If the model fails, return a fallback response that matches the schema (an array).
      return [
        {
          question: 'К сожалению, не удалось создать вопрос. Попробуйте еще раз.',
          questionType: 'translation',
          options: ['-', '-', '-', '-'],
          correctAnswer: '-',
        }
      ];
    }
  }
);
