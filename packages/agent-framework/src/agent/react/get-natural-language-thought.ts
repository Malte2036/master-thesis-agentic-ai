import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { AIProvider } from '../../services';
import { Logger } from '../../logger';
import { ReActPrompt } from './prompt';
import { AgentTool } from './types';

export async function getNaturalLanguageThought(
  agentTools: AgentTool[],
  routerProcess: RouterProcess,
  aiProvider: AIProvider,
  logger: Logger,
  extendedNaturalLanguageThoughtSystemPrompt: string,
): Promise<string> {
  const systemPrompt = ReActPrompt.getNaturalLanguageThoughtPrompt(
    extendedNaturalLanguageThoughtSystemPrompt,
    agentTools,
    routerProcess,
  );

  logger.log(chalk.magenta('Generating natural language thought...'));

  let responseString = await aiProvider.generateText?.(
    routerProcess.question,
    systemPrompt,
  );

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  if (responseString.startsWith('<think>')) {
    responseString = responseString.slice(
      responseString.indexOf('</think>') + 8,
    );
    logger.log(
      chalk.magenta('Stripped <think> tags from natural language thought'),
    );
  }

  responseString = responseString.trim();

  logger.log(chalk.magenta('Natural language thought:'), responseString);

  return responseString;
}
