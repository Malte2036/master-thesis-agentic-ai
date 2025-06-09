import { z } from 'zod/v4';
import { Logger } from '../../logger';

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

  model: string;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}
