import { z } from 'zod';

export interface AIProvider {
  generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T>;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}

export interface AIProviderOptions {
  apiKey: string;
}
