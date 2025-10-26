import chalk from 'chalk';
import { Logger } from '../../logger';
import { OllamaProvider } from './ollama';
import { OpenAIProvider } from './openai';

export * from './types';
export * from './openai';
export * from './groq';
export * from './ollama';

export const getAIProvider = (logger: Logger) => {
  const model = process.env['AI_MODEL'];
  if (!model) {
    throw new Error('AI_MODEL is not set');
  }
  logger.log(chalk.cyan('Using model:'), model);
  return new OllamaProvider(logger, { model });
  // return new OpenAIProvider(logger, { model });
};
