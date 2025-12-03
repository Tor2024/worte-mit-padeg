import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Ротация API ключей для обхода лимитов
const getApiKey = () => {
  const keys = process.env.GEMINI_API_KEYS?.split(',').filter(k => k.trim());
  if (!keys || keys.length === 0) {
    // Если переменная не задана или пуста, возвращаем undefined,
    // Genkit будет использовать стандартную переменную окружения GEMINI_API_KEY
    return undefined;
  }
  // Выбираем случайный ключ из списка
  const apiKey = keys[Math.floor(Math.random() * keys.length)];
  return apiKey;
};

export const ai = genkit({
  plugins: [googleAI({ apiKey: getApiKey })],
  model: 'googleai/gemini-2.5-flash',
});
