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

  Пользователь изучает слово/фразу: "{{word}}"
  
  {{#ifEquals wordType "noun"}}
  Тип задания: Проверка артикля.
  Ввод пользователя: "{{userInput}}"
  Ожидаемый артикль: "{{expectedArticle}}"
  {{/ifEquals}}

  {{#ifEquals wordType "verb"}}
  Тип задания: Практика формы 'Perfekt'.
  Ввод пользователя: "{{userInput}}"
  Ожидаемый ответ: "{{expectedAnswer}}"
  {{/ifEquals}}

  {{#ifEquals practiceType "fill-in-the-blank"}}
  Тип задания: Заполните пропуск.
  Контекст: "{{sentenceContext}}"
  Ввод пользователя: "{{userInput}}"
  Ожидаемый ответ: "{{expectedAnswer}}"
  {{/ifEquals}}

  {{#ifEquals practiceType "case-quiz"}}
  Тип задания: Определи падеж.
  Предложение: "{{sentenceContext}}"
  Пользователь выбрал падеж: "{{userCaseSelection}}"
  Пользователь вписал слово: "{{userInput}}"
  Правильный падеж: "{{correctCase}}"
  Правильное слово: "{{expectedAnswer}}"
  {{/ifEquals}}


  Ваша задача — оценить ввод пользователя и предоставить полезную обратную связь.

  Вот конкретные инструкции в зависимости от типа задания:

  {{#ifEquals wordType "noun"}}
  СУЩЕСТВИТЕЛЬНОЕ (Проверка артикля):
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
  ГЛАГОЛ (Практика формы 'Perfekt'):
  - Сравните ввод пользователя ("{{userInput}}") с ожидаемым правильным ответом ("{{expectedAnswer}}").
  - isCorrect должен быть true, если ответ полностью совпадает (с учетом регистра).
  - Если ответ правильный, дайте короткое подтверждающее сообщение.
  - Если ответ неправильный:
    1.  Укажите правильный ответ: "{{expectedAnswer}}".
    2.  Кратко объясните, в чем ошибка. Например, обратите внимание на правильный вспомогательный глагол (haben/sein) или на форму Partizip II.
    3.  Не нужно генерировать поле 'hint' для глаголов.
  {{/ifEquals}}

  {{#ifEquals practiceType "fill-in-the-blank"}}
  ЗАПОЛНИТЕ ПРОПУСК:
  - Сравните ввод пользователя ("{{userInput}}") с ожидаемым правильным ответом ("{{expectedAnswer}}").
  - Учитывайте, что пользователь мог ввести слово в базовой форме, а требуется в измененной (например, склонение прилагательного).
  - isCorrect должен быть true, если ответ полностью совпадает (с учетом регистра).
  - Если ответ неправильный:
    1.  Укажите правильный ответ: "{{expectedAnswer}}".
    2.  Подробно, но понятно объясните, почему именно такая форма слова требуется в данном контексте. Ссылайтесь на падеж, род, число, время глагола и т.д.
    3.  **Если ошибка касается выбора между определенным и неопределенным артиклем, объясните, почему в этом предложении нужен именно такой тип артикля.**
    4.  Не нужно генерировать поле 'hint'.
  {{/ifEquals}}

  {{#ifEquals practiceType "case-quiz"}}
  ОПРЕДЕЛИ ПАДЕЖ:
  - Оцените два аспекта: правильно ли пользователь выбрал падеж и правильно ли он вписал слово.
  - \`isCorrect\` должен быть \`true\` только если ОБА ответа верны (падеж И слово).
  - Напишите ОДНО общее \`explanation\`.
  
  **Критически важный алгоритм для объяснения:**
  
  1.  **Полная правота:** Если \`{{userCaseSelection}}\` == \`{{correctCase}}\` И \`{{userInput}}\` == \`{{expectedAnswer}}\`, то:
      - \`explanation\`: "Блестяще! И падеж '{{correctCase}}', и форма '{{expectedAnswer}}' абсолютно верны. Так держать!"
      
  2.  **Ошибка только в падеже:** Если \`{{userCaseSelection}}\` != \`{{correctCase}}\` И \`{{userInput}}\` != \`{{expectedAnswer}}\` (и при этом пользователь вписал слово, которое было бы верным для ВЫБРАННОГО им падежа):
       - \`explanation\`: "Падеж выбран неверно. Правильный падеж здесь — '{{correctCase}}', потому что [ОБЪЯСНЕНИЕ ПРИЧИНЫ, например: предлог 'mit' всегда требует Dativ]. Само слово вы написали верно для выбранного вами (неправильного) падежа, но правильный ответ: '{{expectedAnswer}}'."
       
  3.  **Ошибка только в слове:** Если \`{{userCaseSelection}}\` == \`{{correctCase}}\` И \`{{userInput}}\` != \`{{expectedAnswer}}\`:
      - \`explanation\`: "Падеж '{{correctCase}}' вы определили абсолютно верно! Молодец! Однако в самом слове ошибка. Правильно писать '{{expectedAnswer}}'. [ОБЪЯСНЕНИЕ ОШИБКИ В СЛОВЕ, например: 'потому что 'Park' мужского рода, и в Akkusativ артикль будет 'den', а не 'dem'' ИЛИ 'потому что после предлога 'ohne' прилагательное склоняется по слабому типу и имеет окончание -en']. **Если ошибка в типе артикля (например, 'einen' вместо 'den'), обязательно объясните, почему нужен определенный или неопределенный артикль в этом конкретном предложении.**"

  4.  **Ошибки в обоих:** Если \`{{userCaseSelection}}\` != \`{{correctCase}}\` И \`{{userInput}}\` != \`{{expectedAnswer}}\`:
      - \`explanation\`: "Здесь есть ошибки и в выборе падежа, и в написании слова. Давайте разберемся. Правильный падеж — '{{correctCase}}', потому что [ОБЪЯСНЕНИЕ ПРИЧИНЫ ПАДЕЖА]. Исходя из этого, правильная форма слова — '{{expectedAnswer}}'. [ОБЪЯСНЕНИЕ ПРАВИЛЬНОЙ ФОРМЫ СЛОВА, если нужно]."

  **Пример (Ошибка в обоих):**
  - Вход: { userCaseSelection: "Akkusativ", userInput: "das", correctCase: "Dativ", expectedAnswer: "dem" }
  - Выход: { isCorrect: false, explanation: "Здесь есть ошибки и в выборе падежа, и в написании слова. Давайте разберемся. Правильный падеж — 'Dativ', потому что предлог 'zu' всегда требует Dativ. Исходя из этого, правильная форма слова — 'dem', так как существительное 'Haus' среднего рода (das Haus) в дательном падеже имеет артикль 'dem'." }

  Ваше объяснение должно быть обучающим, а не просто констатировать факт ошибки.
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
    // Basic pre-check to ensure the input is plausible before sending to AI
    if (input.practiceType === 'case-quiz' && !input.userInput) {
        return {
            isCorrect: false,
            explanation: "Вы не ввели слово. Пожалуйста, выберите падеж и впишите недостающее слово.",
        };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

// Helper function for Handlebars
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  // @ts-ignore
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this); //NOSONAR
});
