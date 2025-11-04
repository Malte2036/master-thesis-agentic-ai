import {
  AgentTool,
  StructuredThoughtResponse,
  StructuredThoughtResponseSchema,
} from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { ReActPrompt } from './prompt';

export async function getStructuredThought(
  naturalLanguageThought: string,
  agentTools: AgentTool[],
  structuredAiProvider: AIProvider,
  logger: Logger,
): Promise<StructuredThoughtResponse> {
  logger.log(chalk.magenta('Generating structured thought...'));
  const structuredSystemPrompt =
    ReActPrompt.getStructuredThoughtPrompt(agentTools);

  const structuredResponse =
    await structuredAiProvider.generateJson<StructuredThoughtResponse>(
      naturalLanguageThought,
      structuredSystemPrompt,
      StructuredThoughtResponseSchema,
      0.1,
    );

  if (
    structuredResponse.functionCalls &&
    structuredResponse.functionCalls.length > 0
  ) {
    structuredResponse.isFinished = false;
    logger.log(
      chalk.magenta('Structured thought:'),
      'Setting isFinished to false',
    );
  }

  logger.log(
    chalk.magenta('Structured thought:'),
    JSON.stringify(structuredResponse, null, 2),
  );
  return structuredResponse;
}
