import { z } from 'genkit';

// Schema for get-word-details flow
export const WordDetailsInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe('The German word or phrase to get details for.'),
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other']).optional().describe('An optional hint for the part of speech to resolve ambiguity.'),
});
export type WordDetailsInput = z.infer<typeof WordDetailsInputSchema>;

const ExampleSentenceSchema = z.object({
  german: z.string().describe('The example sentence in German.'),
  russian: z.string().describe('The Russian translation of the sentence.'),
});

export const WordDetailsOutputSchema = z.object({
  translation: z.string().describe('The primary Russian translation of the word/phrase.'),
  alternativeTranslations: z.array(z.string()).optional().describe('A list of alternative Russian translations, if they exist.'),
  partOfSpeech: z
    .enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other'])
    .describe('The determined part of speech.'),
  nounDetails: z
    .object({
      article: z
        .enum(['der', 'die', 'das'])
        .describe("The noun's article."),
      plural: z.string().describe("The plural form of the noun."),
    })
    .optional()
    .describe('Details specific to nouns.'),
  verbDetails: z
    .object({
      presentTense: z.string().describe('The full verb conjugation in the present tense for all persons (ich, du, er/sie/es, wir, ihr, sie/Sie), formatted for readability.'),
      perfect: z.string().describe('The perfect tense form (e.g., "ist gegangen").'),
      verbGovernment: z.string().optional().describe('The case the verb governs or the preposition it is used with, explained in Russian (e.g., "warten auf + Akkusativ (ждать кого-то/что-то)").'),
      isReflexive: z.boolean().optional().describe('Whether the verb is reflexive (used with "sich").'),
    })
    .optional()
    .describe('Details specific to verbs.'),
  adjectiveDetails: z
    .object({
        comparative: z.string().describe('The comparative form (e.g., "schöner").'),
        superlative: z.string().describe('The superlative form (e.g., "am schönsten").'),
        antonym: z.string().optional().describe('An antonym for the adjective.'),
    })
    .optional()
    .describe('Details specific to adjectives.'),
  prepositionDetails: z
    .object({
        case: z.enum(['Akkusativ', 'Dativ', 'Genitiv', 'Wechselpräposition']).describe('The case the preposition is used with (e.g., Akkusativ, Dativ, Genitiv, or Wechselpräposition for two-way prepositions).'),
        dualCaseExplanation: z.string().optional().describe('For Wechselpräpositionen, an explanation in Russian of when to use Akkusativ (куда?) and Dativ (где?).'),
        commonContractions: z.string().nullable().optional().describe('A string listing common contractions with articles, e.g., "in + dem = im, an + das = ans, von + dem = vom, zu + der = zur".'),
    })
    .optional()
    .describe('Details specific to prepositions.'),
  conjunctionDetails: z
    .object({
        verbPosition: z.enum(['secondPosition', 'endOfSentence']).describe('The position of the verb in a clause introduced by this conjunction.'),
    })
    .optional()
    .describe('Details specific to conjunctions.'),
  examples: z
    .array(ExampleSentenceSchema)
    .min(3)
    .describe('An array of three distinct example sentences, each with German and Russian versions.'),
  learningStatus: z.enum(['new', 'in_progress', 'learned']).optional().describe('The current learning status of the word.'),
});
export type WordDetailsOutput = z.infer<typeof WordDetailsOutputSchema>;


// Schema for provide-intelligent-error-correction flow
export const IntelligentErrorCorrectionInputSchema = z.object({
  word: z.string().describe('The word or phrase the user is practicing.'),
  userInput: z.string().describe('The user input that needs to be checked.'),
  practiceType: z.enum(['article', 'perfect', 'fill-in-the-blank', 'case-quiz']).describe('The specific type of practice being performed.'),
  wordType: z.string().optional().describe('A hint about the word type for context.'),
  expectedAnswer: z.string().optional().describe('The expected correct answer for the practice type.'),
  sentenceContext: z.string().optional().describe('The sentence in which the word was used, with a blank for the word. For fill-in-the-blank checks.'),
  userCaseSelection: z.string().optional().describe("The case the user selected in a case quiz."),
  correctCase: z.string().optional().describe("The correct case for a case quiz."),
  articleType: z.enum(['definite', 'indefinite']).optional().describe('The type of article that was required for the task (definite or indefinite).'),
});
export type IntelligentErrorCorrectionInput = z.infer<typeof IntelligentErrorCorrectionInputSchema>;

export const IntelligentErrorCorrectionOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user input is correct or not.'),
  explanation: z.string().describe('The AI explanation for why the input is correct or incorrect.'),
  hint: z.string().optional().describe('A helpful mnemonic hint to guide the user to the correct answer (for incorrect noun articles).'),
});
export type IntelligentErrorCorrectionOutput = z.infer<typeof IntelligentErrorCorrectionOutputSchema>;

// Schema for generate-quiz-question
export const GenerateQuizQuestionInputSchema = z.object({
  word: z.string().describe('The German word to create a question for.'),
  details: WordDetailsOutputSchema.describe('The detailed information about the word.'),
});
export type GenerateQuizQuestionInput = z.infer<typeof GenerateQuizQuestionInputSchema>;

export const GenerateQuizQuestionOutputSchema = z.object({
  question: z.string().describe('The question being asked.'),
  questionType: z.enum(['translation', 'article', 'plural', 'perfect_tense', 'case']).describe('The type of question being asked.'),
  options: z.array(z.string()).describe('A list of 4 options, including the correct answer and 3 distractors.'),
  correctAnswer: z.string().describe('The correct answer from the options list.'),
});
export type GenerateQuizQuestionOutput = z.infer<typeof GenerateQuizQuestionOutputSchema>;

// Schema for practice-adjective-declension flow
export const AdjectivePracticeInputSchema = z.object({
  adjective: z.string().describe('The adjective in its base form (e.g., "schön").'),
  noun: z.string().describe('The noun (e.g., "Haus").'),
  nounArticle: z.enum(['der', 'die', 'das']).describe('The article of the noun.'),
  targetCase: z.enum(['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv']).describe('The target case for declension.'),
  articleType: z.enum(['definite', 'indefinite']).describe('The type of article to use (definite "der/die/das" or indefinite "ein/eine").'),
  userInput: z.string().describe('The user\'s attempt to decline the adjective and noun phrase.'),
});
export type AdjectivePracticeInput = z.infer<typeof AdjectivePracticeInputSchema>;

export const AdjectivePracticeOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s input is correct.'),
  correctAnswer: z.string().describe('The fully correct phrase.'),
  explanation: z.string().describe('A detailed explanation of the declension rule, why the user\'s answer was right or wrong, and what the correct form is.'),
  examples: z.array(z.object({
    sentence: z.string().describe('An example sentence using the declined phrase.'),
    translation: z.string().describe('The Russian translation of the sentence.'),
  })).describe('At least two example sentences demonstrating the correct usage in the target case.'),
});
export type AdjectivePracticeOutput = z.infer<typeof AdjectivePracticeOutputSchema>;


// Schema for check-recall-answer flow
export const CheckRecallInputSchema = z.object({
  russianWord: z.string().describe('The Russian word that was prompted.'),
  germanWord: z.string().describe('The expected German word.'),
  partOfSpeech: z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other']).describe('The part of speech of the German word.'),
  article: z.string().optional().describe('The article of the German noun, if applicable.'),
  userInput: z.string().describe('The user\'s answer.'),
});
export type CheckRecallInput = z.infer<typeof CheckRecallInputSchema>;

export const CheckRecallOutputSchema = z.object({
  isCorrect: z.boolean().describe('Whether the user\'s answer is considered correct. This includes synonyms.'),
  isSynonym: z.boolean().describe('True if the user provided a valid synonym, but not the exact expected answer.'),
  correctAnswer: z.string().describe('The exact expected answer, including the article for nouns.'),
  explanation: z.string().describe('A clear explanation of why the answer is correct, incorrect, or a synonym.'),
});
export type CheckRecallOutput = z.infer<typeof CheckRecallOutputSchema>;


// Schema for generate-fill-in-the-blank flow
export const GenerateFillInTheBlankInputSchema = z.object({
    word: z.string().describe("The German word to be practiced."),
    partOfSpeech: z.string().describe("The word's part of speech."),
    example: ExampleSentenceSchema.describe("The example sentence to use for the exercise."),
});
export type GenerateFillInTheBlankInput = z.infer<typeof GenerateFillInTheBlankInputSchema>;

export const GenerateFillInTheBlankOutputSchema = z.object({
    sentenceWithBlank: z.string().describe('The German sentence with the target word replaced by "______".'),
    correctAnswer: z.string().describe("The exact word (in its correct form) that was removed from the sentence."),
    russianTranslation: z.string().describe("The Russian translation of the original sentence, for context."),
});
export type GenerateFillInTheBlankOutput = z.infer<typeof GenerateFillInTheBlankOutputSchema>;

// Schema for generate-case-quiz flow
export const GenerateCaseQuizInputSchema = z.object({
    noun: z.string().describe("The noun to be used in the quiz."),
    preposition: z.string().describe("The preposition to be used in the quiz."),
    articleType: z.enum(['definite', 'indefinite']).describe('The type of article to use for the quiz question.'),
});
export type GenerateCaseQuizInput = z.infer<typeof GenerateCaseQuizInputSchema>;

export const GenerateCaseQuizOutputSchema = z.object({
    sentence: z.string().describe('The German sentence with a blank for the article, e.g., "Ich gehe in ____ Park."'),
    russianTranslation: z.string().describe('The Russian translation of the full sentence for context.'),
    correctCase: z.enum(['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv']).describe('The correct case required by the preposition in this context.'),
    correctAnswer: z.string().describe('The correct article that fills the blank, e.g., "den".'),
});
export type GenerateCaseQuizOutput = z.infer<typeof GenerateCaseQuizOutputSchema>;
    