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
  prompt: `You are an AI language teacher creating a multiple-choice question for a Russian-speaking student learning German.

Given the German word "{{word}}" and its details, create three relevant and distinct quiz questions.

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

1.  **Choose a Question Type:** Based on the available details, randomly choose THREE of the following question types:
    *   'translation': Ask for the Russian translation.
    *   'article': (If noun) Ask for the article.
    *   'plural': (If noun with a non-obvious plural) Ask for the plural form.
    *   'perfect_tense': (If verb) Ask for the perfect tense.
    *   'case': (If preposition) Ask for the case it governs.

2.  **Formulate the Question:** Write a clear question in Russian.
    *   Example for translation: "Какой перевод у слова '{{word}}'?"
    *   Example for article: "Какой артикль у существительного '{{word}}'?"

3.  **Generate Options:**
    *   Provide a total of 4 options.
    *   One option must be the correctAnswer.
    *   The other three options must be plausible but incorrect **distractors**.
    *   For translations, find incorrect translations of other common German words.
    *   For articles, the options should be 'der', 'die', 'das', and if one is correct, the fourth could be a nonsense article like 'dem' or a repeat, but it's better to have just three options in that case. Let's stick to 4 options for consistency, so maybe one is a distractor like 'den'. The options MUST be shuffled.
    *   For plurals, create grammatically plausible but incorrect plural forms.
    *   All options, including the correct answer, must be shuffled randomly in the 'options' array.

4.  **Response Format:** Your final output must be a single JSON object matching the GenerateQuizQuestionOutputSchema.

**Example for the word "Haus":**
[
  {
    "question": "Какой артикль у существительного 'Haus'?",
    "questionType": "article",
    "options": ["der", "die", "das", "dem"],
    "correctAnswer": "das"
  },
  {
    "question": "Какой перевод у слова 'Haus'?",
    "questionType": "translation",
    "options": ["дом", "машина", "дерево", "книга"],
    "correctAnswer": "дом"
  },
  {
    "question": "Какое множественное число у слова 'Haus'?",
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
  async (input) => {
    const { output, finishReason } = await prompt(input);

    if (finishReason !== 'stop' || !output) {
      // If the model fails to generate a valid output, return a "valid" empty-like response
      // to prevent the app from crashing. The UI will handle this gracefully.
      return [];
    }
    
    // Basic shuffle of options to ensure randomness
    output.forEach(q => q.options.sort(() => Math.random() - 0.5));
    return output;
  }
);
