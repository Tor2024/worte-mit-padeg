import { z } from 'genkit';

// Schema for get-word-details flow
export const WordDetailsInputSchema = z.object({
  wordOrPhrase: z
    .string()
    .describe('The German word or phrase to get details for.'),
});
export type WordDetailsInput = z.infer<typeof WordDetailsInputSchema>;

const ExampleSentenceSchema = z.object({
  german: z.string().describe('The example sentence in German.'),
  russian: z.string().describe('The Russian translation of the sentence.'),
});

export const WordDetailsOutputSchema = z.object({
  translation: z.string().describe('The Russian translation of the word/phrase.'),
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
      prateritum: z.string().describe('The Präteritum (simple past) tense form (e.g., "ging").'),
      futurI: z.string().describe('The Futur I (future) tense form (e.g., "wird gehen").'),
      verbGovernment: z.string().optional().describe('The case the verb governs (e.g., "Akkusativ", "Dativ", "Genitiv") or the preposition it is used with.'),
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
        dualCaseExplanation: z.string().optional().describe('For Wechselpräpositionen, an explanation of when to use Akkusativ (wohin?) and Dativ (wo?).'),
        commonContractions: z.string().nullable().optional().describe('Common contractions with articles (e.g., "in + dem = im", "an + das = ans").'),
    })
    .optional()
    .describe('Details specific to prepositions.'),
  conjunctionDetails: z
    .object({
        verbPosition: z.enum(['secondPosition', 'endOfSentence']).describe('The position of the verb in a clause introduced by this conjunction (e.g., "secondPosition" for coordinating conjunctions like "und", "endOfSentence" for subordinating conjunctions like "weil").'),
    })
    .optional()
    .describe('Details specific to conjunctions.'),
  examples: z
    .array(ExampleSentenceSchema)
    .min(3)
    .describe('An array of three distinct example sentences, each with German and Russian versions.'),
});
export type WordDetailsOutput = z.infer<typeof WordDetailsOutputSchema>;


// Schema for provide-intelligent-error-correction flow
export const IntelligentErrorCorrectionInputSchema = z.object({
  word: z.string().describe('The word or phrase entered by the user.'),
  userInput: z.string().describe('The user input that needs to be checked.'),
  wordType: z.enum(['noun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'other']).describe('The type of the word.'),
  expectedArticle: z.string().optional().describe('The expected article for nouns (der, die, das). Only applicable if wordType is noun.'),
  practiceType: z.enum(['perfect', 'prateritum']).optional().describe('The specific verb form being practiced.'),
  expectedAnswer: z.string().optional().describe('The expected correct answer for the practice type.'),
  knownSynonyms: z.array(z.string()).optional().describe('Known synonyms for the word, if any.'),
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
