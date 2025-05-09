import { OpenAIProvider } from './openai';
import { AIProvider } from './types';

export const createAIProvider = (): AIProvider => {
  const openaiApiKey = process.env['OPENAI_API_KEY'];
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  return new OpenAIProvider({
    apiKey: openaiApiKey,
  });
};
