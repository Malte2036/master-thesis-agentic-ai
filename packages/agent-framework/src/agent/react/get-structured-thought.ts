import {
  StructuredThoughtResponse,
  StructuredThoughtResponseSchema,
} from '@master-thesis-agentic-ai/types';
import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import chalk from 'chalk';
import { AIProvider } from '../../services';
import { Logger } from '../../logger';
import { ReActPrompt } from './prompt';
import { AgentTool } from './types';

export async function getStructuredThought(
  responseString: string,
  agentTools: AgentTool[],
  structuredAiProvider: AIProvider,
  logger: Logger,
): Promise<StructuredThoughtResponse> {
  logger.log(chalk.magenta('Generating structured thought...'));
  const structuredSystemPrompt =
    ReActPrompt.getStructuredThoughtPrompt(agentTools);

  const structuredResponse =
    await structuredAiProvider.generateJson<StructuredThoughtResponse>(
      responseString,
      structuredSystemPrompt,
      StructuredThoughtResponseSchema,
      0.1,
    );

  logger.log(
    chalk.magenta('Structured thought:'),
    JSON.stringify(structuredResponse, null, 2),
  );
  return structuredResponse;
}
