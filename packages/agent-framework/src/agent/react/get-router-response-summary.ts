import { RouterResponse } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';

export async function getRouterResponseSummary(
  routerResponse: RouterResponse,
  aiProvider: AIProvider,
  logger: Logger,
): Promise<string> {
  const systemPrompt =
    ReActPrompt.getRouterResponseSummaryPrompt(routerResponse);

  logger.log(chalk.magenta('Generating summary...'));

  let responseString = await aiProvider.generateText?.('', systemPrompt);

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  responseString = responseString
    .slice(responseString.indexOf('</think>') + 8)
    .trim();

  logger.log(chalk.magenta('Summary:'), responseString);

  return responseString;
}
