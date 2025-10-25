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

  // ── Added tests below ─────────────────────────────────────────────────────────

  {
    input: 'List all my current Moodle courses.',
    expected_output: 'Here are your current courses.',
  },
  {
    input: 'Show all assignments due in the next 7 days.',
    expected_output: 'Here are the assignments due in the next 7 days.',
  },
  {
    input:
      'Add all assignments due in the next 14 days to my calendar with 2-hour blocks and reminders 24 hours before.',
    expected_output:
      'All assignments due in the next 14 days have been added to your calendar with 2-hour durations and 24-hour reminders.',
  },
  {
    input:
      'For the course "Einführung in digitale Kompetenzen", list assignments due before 2025-11-10.',
    expected_output:
      'Here are the assignments for "Einführung in digitale Kompetenzen" due before 2025-11-10.',
  },
  {
    input:
      'Create calendar events for all assignments in "Digital Health UI/UX" that are due this month.',
    expected_output:
      'Calendar events for this month’s assignments in "Digital Health UI/UX" have been created.',
  },
  {
    input:
      'When is my next assignment deadline? Add it to my calendar with a 30-minute reminder.',
    expected_output:
      'Your next assignment deadline has been identified and added to your calendar with a 30-minute reminder.',
  },
  {
    input:
      'Summarize new Moodle announcements from the last 7 days across all my courses.',
    expected_output: 'Here are your latest announcements from the last 7 days.',
  },
  {
    input:
      'I have time on 2025-11-02 from 09:00 to 12:00. Schedule a study block called "Statistics Revision" and avoid conflicts.',
    expected_output:
      'The study block "Statistics Revision" has been scheduled without conflicts.',
  },
  {
    input:
      'Create a recurring weekly calendar event "Exercise Session" every Tuesday 18:00–19:00 from 2025-11-04 to 2025-12-16.',
    expected_output:
      'The recurring weekly event "Exercise Session" has been created successfully.',
  },
  {
    input:
      'Find overdue assignments and create catch-up calendar events of 1 hour each for this weekend.',
    expected_output:
      'Catch-up events for overdue assignments have been created for this weekend.',
  },
  {
    input:
      'Export my upcoming assignment deadlines for the next 30 days as calendar entries.',
    expected_output:
      'Upcoming assignment deadlines for the next 30 days have been exported to your calendar.',
  },
  {
    input:
      'Rename the calendar event "Project Meeting" on 2025-11-05 to "Capstone Project Meeting" and move it to 16:00–17:00.',
    expected_output:
      'The event has been renamed to "Capstone Project Meeting" and rescheduled to 16:00–17:00.',
  },
  {
    input:
      'Delete the calendar event "Old Lecture Reminder" on 2025-10-15 at 08:00.',
    expected_output:
      'The calendar event "Old Lecture Reminder" has been deleted.',
  },
  {
    input:
      'Create a calendar event for my next upcoming quiz with a 10-minute reminder and include the Moodle URL.',
    expected_output:
      'A calendar event for your next quiz has been created with a 10-minute reminder and the Moodle URL.',
  },
  {
    input:
      'Show me assignments that require a file upload and are due before 2025-11-15.',
    expected_output:
      'Here are the assignments requiring file upload due before 2025-11-15.',
  },
  {
    input:
      'Block 3 study sessions of 90 minutes each for my nearest deadline, distributed on the three days before it.',
    expected_output:
      'Three study sessions of 90 minutes have been scheduled on the days leading up to your nearest deadline.',
  },
  {
    input:
      'For each assignment due next week, create a prep event 48 hours earlier with the title "Prep: <Assignment Name>".',
    expected_output:
      'Preparation events 48 hours before each assignment due next week have been created.',
  },
  {
    input:
      'Combine my Moodle deadlines and existing calendar to detect conflicts next week and suggest alternative times.',
    expected_output:
      'Potential conflicts next week have been identified and alternative times have been suggested.',
  },
  {
    input:
      'Show me what changed this week in my courses: new materials, new deadlines, or updated instructions.',
    expected_output:
      'Here are this week’s changes in your courses, including new materials, deadlines, and updates.',
  },
  {
    input:
      'Create a calendar event named "Thesis Writing Sprint" on 2025-11-09 from 10:00 to 14:00 with the description "Focus on methodology chapter".',
    expected_output:
      'The calendar event "Thesis Writing Sprint" has been created successfully.',
  },
  {
    input:
      'Set reminders 2 days before and 2 hours before for all deadlines in the next 10 days.',
    expected_output:
      'Reminders 2 days and 2 hours before have been added for all deadlines in the next 10 days.',
  },
  {
    input:
      'List all assignments with missing submissions from last month and add follow-up tasks for tomorrow evening.',
    expected_output:
      'Here are last month’s missing submissions and follow-up tasks have been added for tomorrow evening.',
  },
  {
    input:
      'Create a calendar event for my next lab session from the Moodle schedule and include its location and description.',
    expected_output:
      'The next lab session has been added to your calendar with location and description.',
  },
  {
    input:
      'Pause notifications for calendar and Moodle updates until 2025-11-03 08:00.',
    expected_output: 'Notifications have been paused until 2025-11-03 08:00.',
  },
  {
    input:
      'For "Digital Health UI/UX", create milestones: outline (2025-11-05 18:00), draft (2025-11-10 18:00), final (2025-11-15 18:00).',
    expected_output:
      'Milestone events for "Digital Health UI/UX" have been created: outline, draft, and final.',
  },
  {
    input:
      'What do I need to do this week? Summarize and add missing tasks to my calendar.',
    expected_output:
      'Here is your summary for this week and missing tasks have been added to your calendar.',
  },
  {
    input:
      'From my Moodle to-dos, create a study plan with daily 60-minute slots at 19:00 for the next 5 days.',
    expected_output:
      'A 5-day study plan with daily 60-minute slots at 19:00 has been created.',
  },
  {
    input:
      'Find assignments with group work requirements and schedule a group meeting 3 days before each due date.',
    expected_output:
      'Group meetings have been scheduled 3 days before each relevant assignment due date.',
  },
  {
    input: 'Cancel the recurring event "Exercise Session" starting 2025-11-04.',
    expected_output:
      'The recurring event "Exercise Session" has been canceled.',
  },
  {
    input:
      'Create a calendar event "Exam Day" on 2025-12-12 08:00–12:00 and add a 3-day preparation block the weekend before.',
    expected_output:
      'The event "Exam Day" has been created and a 3-day preparation block has been scheduled the prior weekend.',
  },
];
