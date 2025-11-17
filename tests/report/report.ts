/* eslint-disable no-console */

import {
  EvaluationReport,
  EvaluationReportEntry,
} from '@master-thesis-agentic-ai/types';
import fs from 'fs';
import { EXAMPLE_EVALUATION_TEST_DATA } from '../evaluation/evaluation.data.example';

const REPORT_BASE_PATH = './evaluation/report';

export const writeEvaluationReport = (
  report: EvaluationReport,
  includeExampleData = true,
): void => {
  // Only add example data if requested and not already present
  if (includeExampleData) {
    const exampleData = getExampleEvaluationTestData();
    const exampleIds = new Set(exampleData.map((entry) => entry.id));
    const existingIds = new Set(report.testEntries.map((entry) => entry.id));
    
    // Only add example entries that aren't already in the report
    const newExampleData = exampleData.filter(
      (entry) => !existingIds.has(entry.id),
    );
    if (newExampleData.length > 0) {
      report.testEntries.push(...newExampleData);
    }
  }

  fs.writeFileSync(
    `${REPORT_BASE_PATH}/report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(`Evaluation report written to ${REPORT_BASE_PATH}/report.json`);
};

const getExampleEvaluationTestData = (): EvaluationReportEntry[] => {
  return EXAMPLE_EVALUATION_TEST_DATA;
};
