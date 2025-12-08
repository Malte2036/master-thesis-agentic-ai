import { RouterProcess } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';
import { stripThoughts } from '../../utils/llm';

export async function getTodoThought(
  routerProcess: RouterProcess,
  aiProvider: AIProvider,
  logger: Logger,
  isRoutingAgent: boolean,
): Promise<string> {
  const systemPrompt = ReActPrompt.getTodoThoughtPrompt(
    routerProcess,
    isRoutingAgent,
  );

  logger.log(chalk.magenta('Generating todo thought...'));

  let responseString = await aiProvider.generateText?.(
    routerProcess.question,
    systemPrompt,
  );

  responseString = stripThoughts(responseString);

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  logger.log(chalk.magenta('Todo thought:'), responseString);

  return responseString;
}
