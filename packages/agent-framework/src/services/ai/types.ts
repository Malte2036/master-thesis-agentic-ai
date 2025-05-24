import { z } from 'zod';

export interface AIProvider {
  generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T>;

  model: string;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}
