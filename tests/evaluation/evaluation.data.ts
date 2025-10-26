import { EvaluationReportBase } from '../report/report';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  // ── Capability & User Info ───────────────────────────────────────────────────
  {
    input: 'What are your capabilities?',
    expected_output:
      'I can access Moodle course content, track assignments, and manage calendar events.',
  },
  {
    input: 'Can you help me get my user information?',
    expected_output:
      'Here is your user information: Name: Sabrina Studentin, Username: student',
  },

  // ── Course discovery ─────────────────────────────────────────────────────────
  {
    input: 'List all my current Moodle courses.',
    expected_output: 'Here are your current courses.',
  },
  {
    input:
      'Show me the syllabus pages for each of my courses: SAFE-101, OPS-201, MATH-301, and CS-401.',
    expected_output: 'Here are the requested syllabus pages for your courses.',
  },

  // ── Global deadline queries (relative windows) ───────────────────────────────
  {
    input: 'Show all assignments due in the next 7 days.',
    expected_output: 'Here are the assignments due in the next 7 days.',
  },
  {
    input:
      'Add all assignments due in the next 14 days to my calendar with 2-hour blocks and a reminder 24 hours before.',
    expected_output:
      'All assignments due in the next 14 days have been added to your calendar with 2-hour durations and 24-hour reminders.',
  },

  // ── Course-scoped queries ────────────────────────────────────────────────────
  {
    input:
      'For SAFE-101 (Intro to Safety), list all assignments with their due windows and submission types.',
    expected_output:
      'Here are the assignments for SAFE-101 with due windows and submission types.',
  },
  {
    input:
      'For OPS-201 (Operations Level 2), list assignments due within the next 10 days.',
    expected_output:
      'Here are the assignments for OPS-201 due within the next 10 days.',
  },
  {
    input:
      'For MATH-301, list assignments due within the next 14 days and include their point values.',
    expected_output:
      'Here are the assignments for MATH-301 due within the next 14 days with their point values.',
  },
  {
    input:
      'For CS-401, list all upcoming assignments and include whether file upload is required.',
    expected_output:
      'Here are the upcoming assignments for CS-401 with file upload requirements.',
  },

  // ── Specific named items from your dataset ───────────────────────────────────
  {
    input:
      'Create a calendar event for "Safety Quiz 1" including its intro as the description and a 30-minute reminder.',
    expected_output:
      'The calendar event "Safety Quiz 1" has been created successfully with a 30-minute reminder.',
  },
  {
    input:
      'Create a calendar event for "Safety Equipment Essay" with a 2-hour duration and include the assignment intro in the description.',
    expected_output:
      'The calendar event "Safety Equipment Essay" has been created successfully.',
  },
  {
    input:
      'Create a calendar event for "Operations Analysis" and include both file and online text submission details in the description.',
    expected_output:
      'The calendar event "Operations Analysis" has been created successfully.',
  },
  {
    input:
      'Add "Calculus Problem Set 1" from MATH-301 to my calendar with a 1-hour duration and a reminder 2 hours before.',
    expected_output:
      'The calendar event "Calculus Problem Set 1" has been created successfully.',
  },
  {
    input:
      'Add "Linear Algebra Assignment" to my calendar and set a reminder 24 hours before.',
    expected_output:
      'The calendar event "Linear Algebra Assignment" has been created successfully.',
  },
  {
    input:
      'Schedule a 2-hour event for "Data Structures Project" from CS-401 with the assignment intro in the description.',
    expected_output:
      'The calendar event "Data Structures Project" has been created successfully.',
  },

  // ── Filters by submission type / structure ───────────────────────────────────
  {
    input:
      'Show me assignments that require a file upload across all my courses and add them to my calendar.',
    expected_output:
      'Here are the assignments requiring file upload and they have been added to your calendar.',
  },
  {
    input:
      'Find assignments that allow online text submissions and list their due windows.',
    expected_output:
      'Here are the assignments that allow online text submissions with their due windows.',
  },

  // ── Prep/derived planning from deadlines ─────────────────────────────────────
  {
    input:
      'For each assignment due next week, create a preparation event 48 hours earlier titled "Prep: <Assignment Name>".',
    expected_output:
      'Preparation events 48 hours before each assignment due next week have been created.',
  },
  {
    input:
      'Block three 90-minute study sessions on the three days before my nearest deadline.',
    expected_output:
      'Three 90-minute study sessions have been scheduled on the days before your nearest deadline.',
  },

  // ── Content & resources present in dataset ───────────────────────────────────
  {
    input:
      'Summarize the page "Emergency Procedures" from SAFE-101 and add a study event tomorrow at 18:00 with that summary in the description.',
    expected_output:
      'Here is the summary of "Emergency Procedures" and a study event has been created for tomorrow at 18:00.',
  },
  {
    input:
      'List external resource links from SAFE-101 and CS-401 and add them to the event descriptions for their next deadlines.',
    expected_output:
      'External resource links have been listed and added to the descriptions of your next deadline events.',
  },
  {
    input:
      'Show new announcements or forum topics created this week across my courses.',
    expected_output:
      'Here are this week’s new announcements and forum topics across your courses.',
  },

  // ── Calendar ops (edits, recurring, cancellation) ────────────────────────────
  {
    input:
      'Create a recurring weekly calendar event "Exercise Session" every Tuesday 18:00–19:00 for the next 6 weeks.',
    expected_output:
      'The recurring weekly event "Exercise Session" has been created successfully.',
  },
  {
    input:
      'Rename the calendar event "Exercise Session" next Tuesday to "Exercise & Focus Session" and move it to 18:30–19:30.',
    expected_output:
      'The event has been renamed to "Exercise & Focus Session" and rescheduled to 18:30–19:30.',
  },
  {
    input:
      'Cancel all remaining occurrences of the recurring event "Exercise & Focus Session".',
    expected_output:
      'The recurring event "Exercise & Focus Session" has been canceled.',
  },

  // ── Notifications / muting ───────────────────────────────────────────────────
  {
    input:
      'Pause notifications for calendar and Moodle updates until next Monday 08:00.',
    expected_output:
      'Notifications have been paused until next Monday at 08:00.',
  },

  // ── High-level weekly planning ───────────────────────────────────────────────
  {
    input:
      'What do I need to do this week? Summarize all deadlines and add any missing events to my calendar.',
    expected_output:
      'Here is your summary for this week and missing events have been added to your calendar.',
  },
];
