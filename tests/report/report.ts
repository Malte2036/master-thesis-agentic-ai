import fs from 'fs';

export type EvaluationReportBase = {
  input: string;
  expected_output: string;
};

export type EvaluationReportEntry = EvaluationReportBase & {
  actual_output: string;
};

export type EvaluationReport = {
  testEntries: EvaluationReportEntry[];
};

const REPORT_BASE_PATH = './evaluation/report';

export const writeEvaluationReport = (report: EvaluationReport): void => {
  fs.writeFileSync(
    `${REPORT_BASE_PATH}/report.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(`Evaluation report written to ${REPORT_BASE_PATH}/report.json`);
};
