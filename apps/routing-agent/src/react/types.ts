import { McpAgentCallSchema } from '@master-thesis-agentic-rag/types';
import { z } from 'zod';

export const ReactActThinkAndFindActionsResponseSchema = z.object({
  thought: z.string().describe('The thought process of the agent.'),
  agentCalls: z
    .array(McpAgentCallSchema)
    .describe(
      'The agent calls to make. The agentCalls array must contain only the immediate next function to call. Do not include future function calls.',
    ),
  isFinished: z
    .boolean()
    .describe('Whether the agent has finished its task.')
    .default(false),
});

export type ReactActThinkAndFindActionsResponse = z.infer<
  typeof ReactActThinkAndFindActionsResponseSchema
>;

export const ReactActObserveAndSummarizeAgentResponsesResponseSchema = z.object(
  {
    summary: z.string(),
  },
);

export type ReactActObserveAndSummarizeAgentResponsesResponse = z.infer<
  typeof ReactActObserveAndSummarizeAgentResponsesResponseSchema
>;
