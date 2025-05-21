import { z } from 'zod';
import { AgentCallSchema } from '@master-thesis-agentic-rag/agent-framework';

export const ReactActThinkAndFindActionsResponseSchema = z.object({
  thought: z.string(),
  agentCalls: z.array(AgentCallSchema),
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
