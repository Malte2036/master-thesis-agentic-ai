import { EvaluationReportBase } from '@master-thesis-agentic-ai/types';

export const CURRENT_DATE_NOTE =
  'The current date is 2025-09-29T10:11:19.193+02:00.';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  // ── User profile ─────────────────────────────────────────────────────────────
  {
    id: 'case_101',
    task_type: 'single-hop',
    input: 'Show my Moodle profile basics.',
    expected_output:
      'Here is your user information: First name: {firstname}, Last name: {lastname}.',
    expected_tool_calls: [{ function: 'moodle-agent.get_user_info', args: {} }],
  },

  // ── Course listing & lookup ──────────────────────────────────────────────────
  {
    id: 'case_102',
    task_type: 'single-hop',
    input: 'List all my courses with a short summary.',
    expected_output: 'Here are your current courses: {course_names}.',
    expected_tool_calls: [
      { function: 'moodle-agent.get_all_courses', args: {} },
    ],
  },
  {
    id: 'case_103',
    task_type: 'single-hop',
    input: 'Find information about the course named "Intro to Safety".',
    expected_output:
      'Here is the information about the course "Intro to Safety": {course_information}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
    ],
  },
  {
    id: 'case_104',
    task_type: 'single-hop',
    input: 'Do I have a course called "Digital Health UX"?',
    expected_output:
      'The course: "Digital Health UX" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
    ],
  },
  {
    id: 'case_105',
    task_type: 'single-hop',
    input: 'Look up "Operations Level 2".',
    expected_output:
      'The course: "Operations Level 2" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Operations Level 2' },
      },
    ],
  },
  {
    id: 'case_106',
    task_type: 'single-hop',
    input: 'Search for the course "Advanced Mathematics".',
    expected_output:
      'The course: "Advanced Mathematics" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
    ],
  },
  {
    id: 'case_107',
    task_type: 'single-hop',
    input: 'Search for "Computer Science Fundamentals".',
    expected_output:
      'The course: "Computer Science Fundamentals" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
    ],
  },

  // ── Course details (sections, pages, activities) ─────────────────────────────
  {
    id: 'case_108',
    task_type: 'intra-agent-multi-hop',
    input: 'List all sections in "Intro to Safety".',
    expected_output: 'Here are the sections for "Intro to Safety": {sections}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_109',
    task_type: 'intra-agent-multi-hop',
    input: 'Show me the pages and forums in "Intro to Safety".',
    expected_output:
      'Here are the pages and forums in "Intro to Safety": {pages_and_forums}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_110',
    task_type: 'intra-agent-multi-hop',
    input: 'List all sections and pages for "Digital Health UX".',
    expected_output:
      'Here are the sections and pages for "Digital Health UX": {sections_and_pages}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_111',
    task_type: 'intra-agent-multi-hop',
    input: 'What URLs are linked in "Intro to Safety"?',
    expected_output: 'Here are the URLs linked in "Intro to Safety": {urls}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_112',
    task_type: 'intra-agent-multi-hop',
    input:
      'List the week names (section titles) for "Computer Science Fundamentals".',
    expected_output:
      'Here are the section titles for "Computer Science Fundamentals": {section_titles}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Summaries / page-level prompts ───────────────────────────────────────────
  {
    id: 'case_113',
    task_type: 'intra-agent-multi-hop',
    input: 'Summarize the page "Emergency Procedures" from Intro to Safety.',
    expected_output:
      'Here is the summary of the page "Emergency Procedures" from Intro to Safety: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_114',
    task_type: 'intra-agent-multi-hop',
    input: 'Summarize "Course Syllabus" in Digital Health UX.',
    expected_output:
      'Here is the summary of "Course Syllabus" from Digital Health UX: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Assignments (per course) ─────────────────────────────────────────────────
  {
    id: 'case_115',
    task_type: 'intra-agent-multi-hop',
    input: 'List assignments for "Intro to Safety".',
    expected_output:
      'Here are the assignments for "Intro to Safety": {assignment_names_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_116',
    task_type: 'intra-agent-multi-hop',
    input: 'List assignments for "Digital Health UX".',
    expected_output:
      'Here are the assignments for "Digital Health UX": {assignment_names_or_none}.',
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
  {
    id: 'case_117',
    task_type: 'intra-agent-multi-hop',
    input: 'Show assignments for "Operations Level 2".',
    expected_output:
      'Here are the assignments for "Operations Level 2": {assignment_names_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Operations Level 2' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_118',
    task_type: 'intra-agent-multi-hop',
    input: 'Show assignments for "Advanced Mathematics".',
    expected_output:
      'Here are the assignments for "Advanced Mathematics": {assignment_names_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_119',
    task_type: 'intra-agent-multi-hop',
    input: 'Show assignments for "Computer Science Fundamentals".',
    expected_output:
      'Here are the assignments for "Computer Science Fundamentals": {assignment_names_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Assignments (cross-course / timeboxed) ───────────────────────────────────
  {
    id: 'case_120',
    task_type: 'single-hop',
    input: 'Show all assignments due in September 2025.',
    expected_output:
      'Assignments due in September 2025: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '2025-09-01 00:00:00 UTC',
          due_before: '2025-09-30 23:59:59 UTC',
        },
      },
    ],
  },
  {
    id: 'case_121',
    task_type: 'single-hop',
    input: 'Show all assignments due in October 2025.',
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
  {
    id: 'case_122',
    task_type: 'single-hop',
    input: 'List all assignments due after 2025-09-20.',
    expected_output:
      'Assignments due after 2025-09-20: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_after: '2025-09-20 00:00:00 UTC' },
      },
    ],
  },
  {
    id: 'case_123',
    task_type: 'single-hop',
    input: 'List all assignments due before 2025-10-03.',
    expected_output:
      'Assignments due before 2025-10-03: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_before: '2025-10-03 00:00:00 UTC' },
      },
    ],
  },
  {
    id: 'case_124',
    task_type: 'single-hop',
    input: 'Find my most recent past assignment.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Your most recent past assignment is {assignment_name} with due date {due_date}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_before: '{today}' },
      },
    ],
  },
  {
    id: 'case_125',
    task_type: 'single-hop',
    input: 'What is my next assignment due after today?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Your next assignment is {assignment_name} due on {due_date}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_after: '{today}' },
      },
    ],
  },

  // ── Combine Moodle + Calendar (create events) ────────────────────────────────
  {
    id: 'case_126',
    task_type: 'inter-agent-multi-hop',
    input:
      'Create a calendar event for my next due assignment, lasting 2 hours, with the assignment intro as description.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a calendar event "{assignment_name}" starting at {assignment_start_date} for 2 hours with the assignment intro as the description.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_after: '{today}' },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: '{assignment_name}',
          event_description: '{assignment_intro}',
          event_start_date: '{assignment_start_date}',
          event_end_date: '{assignment_start_date} + 2 hours',
        },
      },
    ],
  },
  {
    id: 'case_127',
    task_type: 'inter-agent-multi-hop',
    input:
      'Find the next assignment in "Digital Health UX" and create a 90-minute calendar event using its intro as description.',
    expected_output:
      'I created a 90-minute calendar event for the next "Digital Health UX" assignment with the assignment intro as the description.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
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
  {
    id: 'case_128',
    task_type: 'inter-agent-multi-hop',
    input:
      'Take my last past assignment and create a 1.5 hour review session on its due date.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I found your last past assignment "{assignment_name}" and created a 1.5 hour review event on {assignment_start_date}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_before: '{today}' },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: '{assignment_name}',
          event_description: 'Review session for {assignment_name}.',
          event_start_date: '{assignment_start_date}',
          event_end_date: '{assignment_start_date} + 1.5 hours',
        },
      },
    ],
  },

  // ── Calendar: recurring events ───────────────────────────────────────────────
  {
    id: 'case_129',
    task_type: 'single-hop',
    input:
      'Set a recurring study block every Tue/Thu from 18:00 to 19:30 for the next 3 weeks called "Evening Study".',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a recurring event "Evening Study" on Tuesdays and Thursdays from 18:00 to 19:30 for 3 weeks.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Evening Study',
          event_description: 'Recurring focused study.',
          event_start_date: '{next_tuesday_18_00_ISO}',
          event_end_date: '{next_tuesday_19_30_ISO}',
          recurrence_rules: 'FREQ=WEEKLY;BYDAY=TU,TH;COUNT=6',
        },
      },
    ],
  },
  {
    id: 'case_130',
    task_type: 'single-hop',
    input:
      'Create a weekly "Math Review" every Friday 15:00–16:00 for 5 weeks.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a recurring event "Math Review" every Friday from 15:00 to 16:00 for 5 weeks.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Math Review',
          event_description: 'Weekly mathematics review.',
          event_start_date: '{next_friday_15_00_ISO}',
          event_end_date: '{next_friday_16_00_ISO}',
          recurrence_rules: 'FREQ=WEEKLY;BYDAY=FR;COUNT=5',
        },
      },
    ],
  },

  // ── Calendar: list, find, update ────────────────────────────────────────────
  {
    id: 'case_131',
    task_type: 'single-hop',
    input: 'List my calendar events for the next 7 days.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Here are your events for the next 7 days: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: { start_date: '{today_ISO}', end_date: '{today_ISO} + 7 days' },
      },
    ],
  },
  {
    id: 'case_132',
    task_type: 'single-hop',
    input: 'Show calendar events between 2025-10-01 and 2025-10-07.',
    expected_output:
      'Here are your events from 2025-10-01 to 2025-10-07: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '2025-10-01T00:00:00Z',
          end_date: '2025-10-07T23:59:59Z',
        },
      },
    ],
  },
  {
    id: 'case_133',
    task_type: 'intra-agent-multi-hop',
    input: 'Find my "Evening Study" event and extend the next one to 2 hours.',
    expected_output:
      'I found your upcoming "Evening Study" and updated its duration to 2 hours.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Evening Study' },
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
  {
    id: 'case_134',
    task_type: 'intra-agent-multi-hop',
    input: 'Move my next "Study Block" event 30 minutes later.',
    expected_output:
      'I found your upcoming "Study Block" event and shifted it 30 minutes later.',
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
            start: '{original_start_ISO} + 30 minutes',
            end: '{original_end_ISO} + 30 minutes',
          },
        },
      },
    ],
  },
  {
    id: 'case_135',
    task_type: 'intra-agent-multi-hop',
    input: 'Rename my next "Math Review" event to "Math Deep Dive".',
    expected_output: 'I updated your upcoming event title to "Math Deep Dive".',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Math Review' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            summary: 'Math Deep Dive',
            start: '{original_start_ISO}',
            end: '{original_end_ISO}',
          },
        },
      },
    ],
  },
  {
    id: 'case_136',
    task_type: 'intra-agent-multi-hop',
    input: 'Add location "Library Room B" to my next "Evening Study".',
    expected_output:
      'I added the location "Library Room B" to your next "Evening Study".',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Evening Study' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            location: 'Library Room B',
            start: '{original_start_ISO}',
            end: '{original_end_ISO}',
          },
        },
      },
    ],
  },

  // ── Cross-course assignment digests ──────────────────────────────────────────
  {
    id: 'case_137',
    task_type: 'single-hop',
    input: 'Give me a digest of upcoming assignments for the next 10 days.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Upcoming assignments in the next 10 days: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_after: '{today}', due_before: '{today} + 10 days' },
      },
    ],
  },
  {
    id: 'case_138',
    task_type: 'single-hop',
    input: 'Show assignments due this week.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output: 'Assignments due this week: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{monday_00_00_ISO}',
          due_before: '{sunday_23_59_ISO}',
        },
      },
    ],
  },
  {
    id: 'case_139',
    task_type: 'single-hop',
    input: 'What was due last week?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output: 'Assignments due last week: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{last_monday_00_00_ISO}',
          due_before: '{last_sunday_23_59_ISO}',
        },
      },
    ],
  },

  // ── Course-specific “next/last” (relative) ──────────────────────────────────
  {
    id: 'case_140',
    task_type: 'intra-agent-multi-hop',
    input: 'What is the next due assignment in "Advanced Mathematics"?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'The next due assignment in "Advanced Mathematics" is {assignment_name} on {due_date}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_141',
    task_type: 'intra-agent-multi-hop',
    input:
      'What was the most recent past assignment in "Computer Science Fundamentals"?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'The most recent past assignment in "Computer Science Fundamentals" is {assignment_name} (due {due_date}).',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Calendar creation from course context ────────────────────────────────────
  {
    id: 'case_142',
    task_type: 'inter-agent-multi-hop',
    input:
      'Create a 1-hour kickoff session for "Intro to Safety" next Monday at 09:00.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a 1-hour kickoff event for "Intro to Safety" next Monday at 09:00.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Intro to Safety — Kickoff',
          event_description: 'Course kickoff session.',
          event_start_date: '{next_monday_09_00_ISO}',
          event_end_date: '{next_monday_10_00_ISO}',
        },
      },
    ],
  },
  {
    id: 'case_143',
    task_type: 'single-hop',
    input: 'Every Wednesday 17:00–18:00 for 4 weeks, create "Safety Review".',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a recurring event "Safety Review" every Wednesday 17:00–18:00 for 4 weeks.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Safety Review',
          event_description: 'Weekly safety review.',
          event_start_date: '{next_wednesday_17_00_ISO}',
          event_end_date: '{next_wednesday_18_00_ISO}',
          recurrence_rules: 'FREQ=WEEKLY;BYDAY=WE;COUNT=4',
        },
      },
    ],
  },

  // ── Course details: blocks/forums ───────────────────────────────────────────
  {
    id: 'case_144',
    task_type: 'intra-agent-multi-hop',
    input: 'List the side blocks in "Intro to Safety".',
    expected_output:
      'Here are the blocks in "Intro to Safety": {block_titles}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_145',
    task_type: 'intra-agent-multi-hop',
    input: 'Which forums exist in "Digital Health UX"?',
    expected_output: 'Forums in "Digital Health UX": {forum_names}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Rollups by course family ────────────────────────────────────────────────
  {
    id: 'case_146',
    task_type: 'intra-agent-multi-hop',
    input:
      'Show assignments for "Intro to Safety" and "Digital Health UX" in one list.',
    expected_output:
      'Assignments across selected courses: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
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

  // ── “SAFE” alias to course ──────────────────────────────────────────────────
  {
    id: 'case_147',
    task_type: 'single-hop',
    input: 'Find the module "SAFE".',
    expected_output:
      'The course: "Intro to Safety" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'SAFE' },
      },
    ],
  },
  {
    id: 'case_148',
    task_type: 'intra-agent-multi-hop',
    input: 'Get details for the SAFE module.',
    expected_output:
      'Here are the sections and activities for "Intro to Safety": {sections_and_activities}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'SAFE' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Calendar windows (relative) ─────────────────────────────────────────────
  {
    id: 'case_149',
    task_type: 'single-hop',
    input: 'What do I have on my calendar tomorrow?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output: 'Here are your events for tomorrow: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{tomorrow_00_00_ISO}',
          end_date: '{tomorrow_23_59_ISO}',
        },
      },
    ],
  },
  {
    id: 'case_150',
    task_type: 'single-hop',
    input: 'Show me my events for this weekend.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Here are your events for this weekend: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{saturday_00_00_ISO}',
          end_date: '{sunday_23_59_ISO}',
        },
      },
    ],
  },

  // ── Page checks in other courses ────────────────────────────────────────────
  {
    id: 'case_151',
    task_type: 'intra-agent-multi-hop',
    input: 'Summarize the "Course Syllabus" page from "Advanced Mathematics".',
    expected_output:
      'Here is the summary of "Course Syllabus" from Advanced Mathematics: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_152',
    task_type: 'intra-agent-multi-hop',
    input: 'Summarize "Python Style Guide" in "Computer Science Fundamentals".',
    expected_output:
      'Here is the summary of "Python Style Guide" from Computer Science Fundamentals: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Assignment → calendar for a named course ────────────────────────────────
  {
    id: 'case_153',
    task_type: 'inter-agent-multi-hop',
    input:
      'Create a 2-hour prep session for the next "Operations Level 2" assignment on its due date.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a 2-hour prep event for the next "Operations Level 2" assignment on its due date.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Operations Level 2' },
      },
      {
        function: 'moodle-agent.get_assignments_for_course',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: '{assignment_name}',
          event_description: 'Prep session for {assignment_name}.',
          event_start_date: '{assignment_start_date}',
          event_end_date: '{assignment_start_date} + 2 hours',
        },
      },
    ],
  },

  // ── Course resource discovery ────────────────────────────────────────────────
  {
    id: 'case_154',
    task_type: 'intra-agent-multi-hop',
    input: 'List external links in "Computer Science Fundamentals".',
    expected_output:
      'External links in "Computer Science Fundamentals": {urls}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Capability (no tool call) ───────────────────────────────────────────────
  {
    id: 'case_155',
    task_type: 'single-hop',
    input: 'What can you do for me in Moodle?',
    expected_output:
      'I can search courses, list enrolled courses, fetch course details, list assignments (by course or across all courses with time filters), and create or update calendar events.',
    expected_tool_calls: [],
  },

  // ── Timeboxed “today/this month” queries ────────────────────────────────────
  {
    id: 'case_156',
    task_type: 'single-hop',
    input: 'Show assignments due today.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output: 'Assignments due today: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{today_00_00_ISO}',
          due_before: '{today_23_59_ISO}',
        },
      },
    ],
  },
  {
    id: 'case_157',
    task_type: 'single-hop',
    input: 'Show assignments due this month.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output: 'Assignments due this month: {assignment_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{first_of_month_00_00_ISO}',
          due_before: '{end_of_month_23_59_ISO}',
        },
      },
    ],
  },

  // ── Rename / augment calendar items ─────────────────────────────────────────
  {
    id: 'case_158',
    task_type: 'intra-agent-multi-hop',
    input:
      'Find my next "Evening Study" and add "Bring OSHA Quick Card" to its description.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I found your next "Evening Study" and added "Bring OSHA Quick Card" to its description.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Evening Study' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            description: '{original_description} • Bring OSHA Quick Card',
            start: '{original_start_ISO}',
            end: '{original_end_ISO}',
          },
        },
      },
    ],
  },

  // ── Cross-check page exists then summarize ───────────────────────────────────
  {
    id: 'case_159',
    task_type: 'intra-agent-multi-hop',
    input: 'Summarize "Final Exam Study Guide" from "Intro to Safety".',
    expected_output:
      'Here is the summary of "Final Exam Study Guide" from Intro to Safety: {summary}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Find-and-patch by free text (relative “upcoming”) ───────────────────────
  {
    id: 'case_160',
    task_type: 'intra-agent-multi-hop',
    input:
      'Find my next "Digital Health UX" session and add the location "Design Lab 2".',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I found your upcoming "Digital Health UX" session and added the location "Design Lab 2".',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Digital Health UX' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            location: 'Design Lab 2',
            start: '{original_start_ISO}',
            end: '{original_end_ISO}',
          },
        },
      },
    ],
  },

  // ── Multi-course section enumeration ────────────────────────────────────────
  {
    id: 'case_161',
    task_type: 'intra-agent-multi-hop',
    input: 'List section titles for "Operations Level 2".',
    expected_output:
      'Here are the section titles for "Operations Level 2": {section_titles}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Operations Level 2' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_162',
    task_type: 'intra-agent-multi-hop',
    input: 'List section titles for "Advanced Mathematics".',
    expected_output:
      'Here are the section titles for "Advanced Mathematics": {section_titles}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Per-course URL extraction ────────────────────────────────────────────────
  {
    id: 'case_163',
    task_type: 'intra-agent-multi-hop',
    input: 'Show external links for "Advanced Mathematics".',
    expected_output: 'External links in "Advanced Mathematics": {urls}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Advanced Mathematics' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_164',
    task_type: 'intra-agent-multi-hop',
    input: 'Show external links for "Computer Science Fundamentals".',
    expected_output:
      'External links in "Computer Science Fundamentals": {urls}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Day planning: assignments + calendar (today) ────────────────────────────
  {
    id: 'case_165',
    task_type: 'inter-agent-multi-hop',
    input: 'What assignments are due today and what events do I have today?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Here are your assignments due today: {assignment_list_or_none}. Here are your events today: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{today_00_00_ISO}',
          due_before: '{today_23_59_ISO}',
        },
      },
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{today_00_00_ISO}',
          end_date: '{today_23_59_ISO}',
        },
      },
    ],
  },

  // ── Week planning: assignments + calendar (this week) ───────────────────────
  {
    id: 'case_166',
    task_type: 'inter-agent-multi-hop',
    input: 'Give me this week’s assignments and my calendar schedule.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Assignments due this week: {assignment_list_or_none}. Events this week: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{monday_00_00_ISO}',
          due_before: '{sunday_23_59_ISO}',
        },
      },
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{monday_00_00_ISO}',
          end_date: '{sunday_23_59_ISO}',
        },
      },
    ],
  },

  // ── Follow-up: Create slots from assignments (this week) ────────────────────
  {
    id: 'case_167',
    task_type: 'inter-agent-multi-hop',
    input:
      'Create a 1-hour study slot on each day an assignment is due this week.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created 1-hour study events for each assignment due day this week.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: {
          due_after: '{monday_00_00_ISO}',
          due_before: '{sunday_23_59_ISO}',
        },
      },
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Study: {assignment_name}',
          event_description: 'Study time for {assignment_name}.',
          event_start_date: '{due_date} 17:00:00Z',
          event_end_date: '{due_date} 18:00:00Z',
        },
      },
    ],
  },

  // ── Course quick checkers ───────────────────────────────────────────────────
  {
    id: 'case_168',
    task_type: 'intra-agent-multi-hop',
    input: 'Does "Intro to Safety" have a forum for announcements?',
    expected_output:
      '"Intro to Safety" contains an announcements forum: {forum_name}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Intro to Safety' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },
  {
    id: 'case_169',
    task_type: 'intra-agent-multi-hop',
    input: 'Does "Digital Health UX" include a "Design Critique Forum"?',
    expected_output:
      '"Digital Health UX" contains the forum "Design Critique Forum".',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Digital Health UX' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Course-section enumeration variants ─────────────────────────────────────
  {
    id: 'case_170',
    task_type: 'intra-agent-multi-hop',
    input: 'List section names for "Computer Science Fundamentals".',
    expected_output:
      'Section names for "Computer Science Fundamentals": {section_titles}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'Computer Science Fundamentals' },
      },
      {
        function: 'moodle-agent.get_course_details',
        args: { course_id: '{moodle-agent.search_courses_by_name.course_id}' },
      },
    ],
  },

  // ── Calendar: busy window check (relative) ──────────────────────────────────
  {
    id: 'case_171',
    task_type: 'single-hop',
    input: 'Am I free next Thursday between 14:00 and 16:00?',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Here are your events next Thursday 14:00–16:00: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.get_calendar_events',
        args: {
          start_date: '{next_thursday_14_00_ISO}',
          end_date: '{next_thursday_16_00_ISO}',
        },
      },
    ],
  },

  // ── Create a calendar event for tomorrow (relative) ─────────────────────────
  {
    id: 'case_172',
    task_type: 'single-hop',
    input:
      'Create a 45-minute session to read "Hazard Types Overview" tomorrow at 18:00.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I created a 45-minute reading session for "Hazard Types Overview" tomorrow at 18:00.',
    expected_tool_calls: [
      {
        function: 'calendar-agent.create_calendar_event',
        args: {
          event_name: 'Read: Hazard Types Overview',
          event_description: 'Reading session.',
          event_start_date: '{tomorrow_18_00_ISO}',
          event_end_date: '{tomorrow_18_45_ISO}',
        },
      },
    ],
  },

  // ── Shift/retitle “next” event (relative) ───────────────────────────────────
  {
    id: 'case_173',
    task_type: 'intra-agent-multi-hop',
    input:
      'Find my next "Evening Study" and change the title to "Safety Study".',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'I found your upcoming event and renamed it to "Safety Study".',
    expected_tool_calls: [
      {
        function: 'calendar-agent.find_calendar_events_by_free_text_query',
        args: { query: 'Evening Study' },
      },
      {
        function: 'calendar-agent.update_calendar_event',
        args: {
          event_id:
            '{calendar-agent.find_calendar_events_by_free_text_query.event_id}',
          data: {
            summary: 'Safety Study',
            start: '{original_start_ISO}',
            end: '{original_end_ISO}',
          },
        },
      },
    ],
  },

  // ── Course presence yes/no (search-only) ────────────────────────────────────
  {
    id: 'case_174',
    task_type: 'single-hop',
    input: 'Do I have a course named "OPS-201"?',
    expected_output:
      'The course: "Operations Level 2" has the following information: {partial_course_information}',
    expected_tool_calls: [
      {
        function: 'moodle-agent.search_courses_by_name',
        args: { course_name: 'OPS-201' },
      },
    ],
  },

  // ── Multi-tool chain with 7-day window (relative) ───────────────────────────
  {
    id: 'case_175',
    task_type: 'inter-agent-multi-hop',
    input:
      'Give me a week-ahead brief: assignments due and my calendar for the next 7 days.',
    extended_evaluation_input: CURRENT_DATE_NOTE,
    expected_output:
      'Assignments due in the next 7 days: {assignment_list_or_none}. Events in the next 7 days: {event_list_or_none}.',
    expected_tool_calls: [
      {
        function: 'moodle-agent.get_assignments_for_all_courses',
        args: { due_after: '{today}', due_before: '{today} + 7 days' },
      },
      {
        function: 'calendar-agent.get_calendar_events',
        args: { start_date: '{today_ISO}', end_date: '{today_ISO} + 7 days' },
      },
    ],
  },
];
