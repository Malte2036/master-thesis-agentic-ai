/* eslint-disable no-console */

import { RouterProcess, ToolCall } from '@master-thesis-agentic-ai/types';
import fs from 'fs';
import { EXAMPLE_EVALUATION_TEST_DATA } from '../evaluation/evaluation.data.example';

export type EvaluationReportBase = {
  id: string;
  task_type: string;
  input: string;
  expected_output: string;
  expected_tool_calls: ToolCall[];
};

export type EvaluationReportEntry = EvaluationReportBase & {
  actual_output: string;
  retrieval_context: string[];
  trace: RouterProcess;
  completion_time: number;
  token_cost: number;
};

export type EvaluationReport = {
  testEntries: EvaluationReportEntry[];
};

const REPORT_BASE_PATH = './evaluation/report';

export const writeEvaluationReport = (report: EvaluationReport): void => {
  report.testEntries.push(...getExampleEvaluationTestData());

  fs.writeFileSync(
    `${REPORT_BASE_PATH}/report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(`Evaluation report written to ${REPORT_BASE_PATH}/report.json`);
};

const getExampleEvaluationTestData = (): EvaluationReportEntry[] => {
  return EXAMPLE_EVALUATION_TEST_DATA;
};
