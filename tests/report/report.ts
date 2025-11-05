/* eslint-disable no-console */

import {
  EvaluationReport,
  EvaluationReportEntry,
} from '@master-thesis-agentic-ai/types';
import fs from 'fs';
import { EXAMPLE_EVALUATION_TEST_DATA } from '../evaluation/evaluation.data.example';

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
