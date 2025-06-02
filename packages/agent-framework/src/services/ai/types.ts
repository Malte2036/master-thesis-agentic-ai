import { z } from 'zod/v4';

export interface AIProvider {
  generateJson<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T>;

  generateText?(
    prompt: string,
    options?: AIGenerateTextOptions,
  ): Promise<string>;

  model: string;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}
