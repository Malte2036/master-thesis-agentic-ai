import { EvaluationReportBase } from '../report/report';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  {
    input: 'What are your capabilities?',
    expected_output:
      'I can access Moodle course content, track assignments, and manage calendar events.',
  },
  {
    input: 'Can you help me get my user information?',
    expected_output:
      'Here is your user information: Name: Sabrina Student, Username: student',
  },
];
