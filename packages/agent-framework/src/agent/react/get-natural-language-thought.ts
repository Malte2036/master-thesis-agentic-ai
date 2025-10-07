import { RouterProcess } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';
import { AgentTool } from './types';

export async function getNaturalLanguageThought(
  agentTools: AgentTool[],
  routerProcess: RouterProcess,
  aiProvider: AIProvider,
  logger: Logger,
  extendedNaturalLanguageThoughtSystemPrompt: string,
  agentName?: string,
): Promise<string> {
  const systemPrompt = ReActPrompt.getNaturalLanguageThoughtPrompt(
    extendedNaturalLanguageThoughtSystemPrompt,
    agentTools,
    routerProcess,
    agentName,
  );

  logger.log(chalk.magenta('Generating natural language thought...'));

  const responseString = await aiProvider.generateText?.(
    routerProcess.question,
    systemPrompt,
  );

  if (!responseString) {
    throw new Error('No response from AI provider');
  }

  logger.log(chalk.magenta('Natural language thought:'), responseString);

  return responseString;
}
