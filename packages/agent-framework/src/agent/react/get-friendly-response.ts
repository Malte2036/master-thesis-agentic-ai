import { RouterProcess } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';
import { stripThoughts } from '../../utils/llm';

export async function getFriendlyResponse(
  routerResponse: RouterProcess,
  aiProvider: AIProvider,
  logger: Logger,
): Promise<string> {
  const systemPrompt = ReActPrompt.getFriendlyResponsePrompt(routerResponse);

  logger.log(chalk.magenta('Generating friendly response...'));

  let responseString = await aiProvider.generateText?.('', systemPrompt);

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  responseString = stripThoughts(responseString);
  logger.log(chalk.magenta('Friendly response:'), responseString);

  return responseString;
}
