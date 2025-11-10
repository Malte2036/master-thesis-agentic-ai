import { EvaluationReportBase } from '@master-thesis-agentic-ai/types';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  {
    id: 'case_001',
    task_type: 'get_user_info',
    input: 'Can you help me get my user information?',
    expected_output:
      'Here is your user information: First name: {firstname}, Last name: {lastname}, Username: {username}.',
    expected_tool_calls: [{ function: 'moodle-agent.get_user_info', args: {} }],
  },

  {
    id: 'case_002',
    task_type: 'get_all_courses',
    input: 'List all my current Moodle courses.',
    expected_output: 'Here are your current courses: {course_names}.',
    expected_tool_calls: [
      { function: 'moodle-agent.get_all_courses', args: {} },
    ],
  },

  // ── complex moodle queries ───────────────────────────────────────────────────
  {
    id: 'case_003',
    task_type: 'complex_moodle_queries',
    input:
      'Get all my assignments for the module "Digital Health UX" that are due after the 1 October 2025.',
    expected_output:
      'Here are the assignments for the module "Digital Health UX" that are due after the 1 October 2025: {assignment_name_001}{optional_list}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Combine moodle and calendar ──────────────────────────────────────────────
  {
    id: 'case_004',
    task_type: 'combine_moodle_and_calendar',
    input:
      'Get my last past assignment and create a calendar event for the date of the assignment and for 1.5hours. The Description of the calendar event should be the assignment intro.',
    expected_output:
      'I found the last past assignment with the name {assignment_name} and created a calendar event for {assignment_start_date} for 1.5 hours. The calendar event has the name {assignment_name} and the description {assignment_intro}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_before: '{today}' },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: '{assignment_name}',
          event_description: '{assignment_intro}',
          event_start_date: '{assignment_start_date}',
          event_end_date: '{assignment_start_date} + 1.5 hours',
        },
      },
    ],
  },

  // ── date-bounded assignment rollup (freeze-date friendly) ────────────────────
  {
    id: 'case_007',
    task_type: 'get_assignments_timeboxed',
    input: 'Show me all assignments across my courses due in October 2025.',
    expected_output:
      'Assignments due in October 2025: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '2025-10-01 00:00:00 UTC',
          due_before: '2025-10-31 23:59:59 UTC',
        },
      },
    ],
  },

  // ── summarize a specific page from Intro to Safety ───────────────────────────
  {
    id: 'case_006',
    task_type: 'summarize_page',
    input: 'Summarize the page "Emergency Procedures" from Intro to Safety.',
    expected_output:
      'Here is the summary of the page "Emergency Procedures" from Intro to Safety: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_contents',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── calendar: create a recurring study block (RRULE) ─────────────────────────
  {
    id: 'case_008',
    task_type: 'create_recurring_calendar',
    input:
      'Create a recurring study block every Monday and Wednesday from 10:00 to 11:30 for the next 4 weeks titled "Study Block".',
    expected_output:
      'I created a recurring event "Study Block" on Mondays and Wednesdays from 10:00 to 11:30 for 4 weeks.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Study Block',
          event_description: 'Recurring focused study time.',
          event_start_date: '{next_monday_10_00_ISO}',
          event_end_date: '{next_monday_11_30_ISO}',
          recurrence_rules: 'FREQ=WEEKLY;BYDAY=MO,WE;COUNT=8',
        },
      },
    ],
  },

  // ── calendar: find and patch an event (update) ───────────────────────────────
  {
    id: 'case_009',
    task_type: 'update_calendar_event',
    input:
      'Find my "Study Block" events and extend the duration to 2 hours for the next occurrence.',
    expected_output:
      'I found your upcoming "Study Block" event and updated its end time to reflect a 2-hour duration.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Study Block' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            start: '{original_start_ISO}',
            end: '{original_start_ISO} + 2 hours',
          },
        },
      },
    ],
  },

  // ── calendar: list upcoming events in a window ───────────────────────────────
  {
    id: 'case_010',
    task_type: 'list_calendar_events',
    input: 'List my calendar events for the next 7 days.',
    expected_output:
      'Here are your events for the next 7 days: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{today_ISO}',
          end_date: '{today_ISO} + 7 days',
        },
      },
    ],
  },

  // ── course contents enumeration (files/sections) ────────────────────────────
  {
    id: 'case_011',
    task_type: 'get_course_contents',
    input: 'List all sections and pages for "Intro to Safety".',
    expected_output:
      'Here are the sections and pages for "Intro to Safety": {sections_and_pages}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_contents',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
];
