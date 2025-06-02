import { McpAgentCallSchema } from '@master-thesis-agentic-rag/types';
import { z } from 'zod/v4';

export const StrukturedThoughtResponseSchema = z.object({
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

export type StrukturedThoughtResponse = z.infer<
  typeof StrukturedThoughtResponseSchema
>;

export const ReactActThinkAndFindActionsResponseSchema =
  StrukturedThoughtResponseSchema.extend({
    thought: z.string().describe('The thought process of the agent.'),
  });

export type ReactActThinkAndFindActionsResponse = z.infer<
  typeof ReactActThinkAndFindActionsResponseSchema
>;
