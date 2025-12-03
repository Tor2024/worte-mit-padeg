'use server';

/**
 * @fileOverview AI-powered content generation for new sentences with learned words and suggested related words and phrases.
 *
 * - generateNewSentences - A function that generates new sentences with learned words and suggests related words and phrases, personalized to the user's learning progress.
 * - GenerateNewSentencesInput - The input type for the generateNewSentences function.
 * - GenerateNewSentencesOutput - The return type for the generateNewSentences function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewSentencesInputSchema = z.object({
  word: z.string().describe('The word for which to generate new sentences.'),
  context: z.string().optional().describe('Context related to the word for better sentence generation.'),
  learningProgress: z.string().optional().describe('The user learning progress.'),
});
export type GenerateNewSentencesInput = z.infer<typeof GenerateNewSentencesInputSchema>;

const GenerateNewSentencesOutputSchema = z.object({
  sentences: z.array(z.string()).describe('Array of new sentences using the provided word.'),
  relatedWords: z.array(z.string()).describe('Array of related words and phrases.'),
  progress: z.string().describe('Progress of the AI generation.'),
});
export type GenerateNewSentencesOutput = z.infer<typeof GenerateNewSentencesOutputSchema>;

export async function generateNewSentences(input: GenerateNewSentencesInput): Promise<GenerateNewSentencesOutput> {
  return generateNewSentencesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewSentencesPrompt',
  input: {schema: GenerateNewSentencesInputSchema},
  output: {schema: GenerateNewSentencesOutputSchema},
  prompt: `You are an AI language learning assistant. Your goal is to help users learn German by generating example sentences with words they're learning and suggest related words and phrases.

  Word: {{{word}}}
  Context: {{{context}}}
  Learning Progress: {{{learningProgress}}}

  Generate 3 example sentences using the word. Also, suggest 5 related German words or phrases.

  Sentences:
  - ...
  Related Words:
  - ...

  Ensure the generated sentences are contextually relevant and helpful for language learners. Keep in mind that a user is learning German and give simple but helpful examples.
  Make sure the "sentences" field is just a list of sentences, and "relatedWords" is just a list of related words.`,
});

const generateNewSentencesFlow = ai.defineFlow(
  {
    name: 'generateNewSentencesFlow',
    inputSchema: GenerateNewSentencesInputSchema,
    outputSchema: GenerateNewSentencesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    output!.progress = 'Generated sentences using the learned word and suggested related words and phrases.';
    return output!;
  }
);
