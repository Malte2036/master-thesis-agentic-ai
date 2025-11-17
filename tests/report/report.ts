/* eslint-disable no-console */

import {
  EvaluationReport,
  EvaluationReportEntry,
} from '@master-thesis-agentic-ai/types';
import fs from 'fs';
import { execSync } from 'child_process';
import { EXAMPLE_EVALUATION_TEST_DATA } from '../evaluation/evaluation.data.example';

const REPORT_BASE_PATH = './evaluation/report';

export const getGitHash = (): string | undefined => {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.warn('Failed to get git hash:', error);
    return undefined;
  }
};

export const getTimestamp = (): string => {
  return new Date().toISOString();
};

export const writeEvaluationReport = (
  report: EvaluationReport,
  includeExampleData = true,
): void => {
  // Only add example data if requested and not already present
  if (includeExampleData) {
    const exampleData = getExampleEvaluationTestData();
    const existingIds = new Set(report.testEntries.map((entry) => entry.id));

    // Only add example entries that aren't already in the report
    const newExampleData = exampleData.filter(
      (entry) => !existingIds.has(entry.id),
    );
    if (newExampleData.length > 0) {
      report.testEntries.push(...newExampleData);
    }
  }

  // Add git hash and timestamp if not already present
  if (!report.gitHash) {
    report.gitHash = getGitHash();
  }
  if (!report.timestamp) {
    report.timestamp = getTimestamp();
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
