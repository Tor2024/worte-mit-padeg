import { config } from 'dotenv';
config();

import '@/ai/flows/generate-new-sentences.ts';
import '@/ai/flows/provide-intelligent-error-correction.ts';
import '@/ai/flows/generate-usage-examples.ts';
import '@/ai/flows/determine-part-of-speech.ts';
