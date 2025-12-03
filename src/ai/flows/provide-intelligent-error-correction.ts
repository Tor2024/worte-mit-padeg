'use server';

/**
 * @fileOverview Provides intelligent error correction with AI explanations and hints.
 *
 * - provideIntelligentErrorCorrection - A function that offers intelligent error checking with AI-powered explanations and helpful hints.
 * - IntelligentErrorCorrectionInput - The input type for the provideIntelligentErrorCorrection function.
 * - IntelligentErrorCorrectionOutput - The return type for the provideIntelligentErrorCorrection function.
 */

import {ai} from '@/ai/genkit';
import {
  IntelligentErrorCorrectionInputSchema,
  IntelligentErrorCorrectionOutputSchema,
  type IntelligentErrorCorrectionInput,
  type IntelligentErrorCorrectionOutput,
} from '@/ai/schemas';
import Handlebars from 'handlebars';

export async function provideIntelligentErrorCorrection(
  input: IntelligentErrorCorrectionInput
): Promise<IntelligentErrorCorrectionOutput> {
  return intelligentErrorCorrectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentErrorCorrectionPrompt',
  input: {schema: IntelligentErrorCorrectionInputSchema},
  output: {schema: IntelligentErrorCorrectionOutputSchema},
  prompt: `Вы — языковой ИИ-помощник, предоставляющий обратную связь по использованию немецких слов и фраз.

  Пользователь изучает слово/фразу: "{{word}}" ({{wordType}})
  Ввод пользователя: "{{userInput}}"
  
  {{#if expectedArticle}}
  Ожидаемый артикль: "{{expectedArticle}}"
  {{/if}}

  Ваша задача — оценить ввод пользователя и предоставить полезную обратную связь.

  Вот конкретные инструкции в зависимости от типа слова:

  {{#ifEquals wordType "noun"}}
  СУЩЕСТВИТЕЛЬНОЕ:
  - Проверьте, является ли ввод пользователя ("{{userInput}}") правильным артиклем ("{{expectedArticle}}") для существительного "{{word}}".
  - isCorrect должен отражать, был ли предоставлен правильный артикль.
  - Если правильно, дайте короткое подтверждение.
  - Если неверно:
    1.  Объясните, почему правильный артикль — "{{expectedArticle}}".
    2.  **Обязательно придумайте яркую, забавную или абсурдную мнемоническую подсказку (hint)**, чтобы помочь запомнить связь слова с его артиклем. Подсказка должна связывать род (мужской, женский, средний) с самим предметом.
        *   Для 'der' (мужской род): ассоциируйте слово с чем-то мужским, сильным, большим (например, "ДЕРзкий директор").
        *   Для 'die' (женский род): ассоциируйте с чем-то женским, красивым, изящным (например, "ДИвная дама").
        *   Для 'das' (средний род): ассоциируйте с чем-то нейтральным, маленьким, абстрактным или даже странным (например, "ДАС и всё.", или что-то детское).
  - Ответ должен быть кратким и по существу.
  {{/ifEquals}}

  {{#ifEquals wordType "verb"}}
  ГЛАГОЛ:
  - Оцените, подходят ли форма и использование глагола в данном контексте.
  - Рассмотрите варианты и синонимы.
  - Предоставьте объяснение, почему ввод правильный или неправильный с точки зрения значения и грамматической правильности.
  - isCorrect должен отражать правильность ответа с точки зрения значения и грамmatical правильности.
  {{/ifEquals}}

  {{#ifEquals wordType "adjective"}}
  ПРИЛАГАТЕЛЬНОЕ:
  - Оцените, подходят ли форма и использование прилагательного в данном контексте.
  - Рассмотрите варианты и синонимы.
  - Предоставьте объяснение, почему ввод правильный или неправильный с точки зрения значения и грамматической правильности.
  - isCorrect должен отражать правильность ответа с точки зрения значения и грамматической правильности.
  {{/ifEquals}}

    {{#ifEquals wordType "adverb"}}
  НАРЕЧИЕ:
  - Оцените, подходят ли форма и использование наречия в данном контексте.
  - Рассмотрите варианты и синонимы.
  - Предоставьте объяснение, почему ввод правильный или неправильный с точки зрения значения и грамматической правильности.
  - isCorrect должен отражать правильность ответа с точки зрения значения и грамматической правильности.
  {{/ifEquals}}

  {{#ifEquals wordType "other"}}
  ДРУГОЕ:
  - Оцените, подходит ли использование в данном контексте.
  - Предоставьте объяснение, почему ввод правильный или неправильный.
  - isCorrect должен отражать правильность ответа.
  {{/ifEquals}}

  Выведите ответ в виде объекта JSON со следующими полями:
  - isCorrect (boolean): true, если ввод правильный, иначе false.
  - explanation (string): Подробное объяснение, почему ввод правильный или неправильный.
  - hint (string, optional): Полезная мнемоническая подсказка, чтобы направить пользователя к правильному ответу (только если неправильно и только для существительных).
  `, config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const intelligentErrorCorrectionFlow = ai.defineFlow(
  {
    name: 'intelligentErrorCorrectionFlow',
    inputSchema: IntelligentErrorCorrectionInputSchema,
    outputSchema: IntelligentErrorCorrectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

// Helper function for Handlebars
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  // @ts-ignore
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this); //NOSONAR
});
