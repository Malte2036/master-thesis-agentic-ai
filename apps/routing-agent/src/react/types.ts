import { McpAgentCallSchema } from '@master-thesis-agentic-rag/agent-framework';
import { z } from 'zod';

export const ReactActThinkAndFindActionsResponseSchema = z.object({
  thought: z.string(),
  agentCalls: z.array(McpAgentCallSchema),
  isFinished: z.boolean(),
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
