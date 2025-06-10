import { z } from 'zod/v4';

export interface AIProvider {
  generateJson<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
  ): Promise<T>;

  generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
  ): Promise<string>;

  getModels(): Promise<{ name: string; size: number }[]>;

  model: string;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}
