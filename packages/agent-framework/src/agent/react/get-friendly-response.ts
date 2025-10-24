import { RouterResponse } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';

export async function getFriendlyResponse(
  routerResponse: RouterResponse,
  aiProvider: AIProvider,
  logger: Logger,
): Promise<string> {
  const systemPrompt = ReActPrompt.getFriendlyResponsePrompt(routerResponse);

  logger.log(chalk.magenta('Generating friendly response...'));

  let responseString = await aiProvider.generateText?.('', systemPrompt);

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  responseString = responseString
    .slice(responseString.indexOf('</think>') + 8)
    .trim();

  logger.log(chalk.magenta('Friendly response:'), responseString);

  return responseString;
}
