import { z } from 'zod/v4';
import { RouterProcessSchema } from './router';
import { ToolCallSchema } from './agent';

export const EvaluationReportBaseSchema = z.object({
  id: z.string(),
  task_type: z.string(),
  input: z.string(),
  extended_evaluation_input: z
    .string()
    .describe(
      'Additional input for the evaluation. This is used to provide additional context for the evaluation.',
    )
    .optional(),
  expected_output: z.string(),
  expected_tool_calls: z.array(ToolCallSchema),
});

export const EvaluationReportEntrySchema = EvaluationReportBaseSchema.extend({
  actual_output: z.string(),
  retrieval_context: z.array(z.string()),
  trace: z.lazy(() => RouterProcessSchema),
  completion_time: z.number(),
  token_cost: z.number(),
});

export const EvaluationReportSchema = z.object({
  testEntries: z.array(EvaluationReportEntrySchema),
});

export type EvaluationReportBase = z.infer<typeof EvaluationReportBaseSchema>;
export type EvaluationReportEntry = z.infer<typeof EvaluationReportEntrySchema>;
export type EvaluationReport = z.infer<typeof EvaluationReportSchema>;
