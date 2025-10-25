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
  {
    input:
      'Create a calendar event with the name "Meeting with the team" and the description "We will discuss the project" from 2025-10-22T13:22:00Z to 2025-10-25T17:09:00Z.',
    expected_output:
      'The calendar event "Meeting with the team" has been created successfully.',
  },
  {
    input:
      'Get my last past assignment and create a calendar event for the date of the assignment and for 1.5hours. The Description of the calendar event should be the assignment intro.',
    expected_output:
      'The calendar event "Assignment 1" has been created successfully.',
  },
];
