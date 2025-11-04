import { EvaluationReportBase } from '../report/report';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  {
    id: 'case_000',
    task_type: 'get_capabilities',
    input: 'What are your capabilities?',
    expected_output:
      'I can access Moodle course content (pages, forums, assignments), track assignments and their due windows, and create/manage calendar events (one-off and recurring), including adding reminders and updating or canceling events.',
    expected_tool_calls: [],
  },

  {
    id: 'case_001',
    task_type: 'get_user_info',
    input: 'Can you help me get my user information?',
    expected_output:
      'Here is your user information: Name: Sabrina Studentin, Username: student, Email: student@example.com.',
    expected_tool_calls: [
      {
        function: 'get_user_info',
        args: {},
      },
    ],
  },

  {
    id: 'case_002',
    task_type: 'get_all_courses',
    input: 'List all my current Moodle courses.',
    expected_output:
      'Here are your current courses: SAFE-101 (Intro to Safety), OPS-201 (Operations Level 2), MATH-301 (Advanced Mathematics), CS-401 (Computer Science Fundamentals), DH-501 (Digital Health UX).',
    expected_tool_calls: [
      {
        function: 'get_all_courses',
        args: {},
      },
    ],
  },

  // ── complex moodle queries ───────────────────────────────────────────────────
  {
    id: 'case_003',
    task_type: 'complex_moodle_queries',
    input:
      'Show me the syllabus pages for each of my courses: SAFE-101, OPS-201, MATH-301, and CS-401.',
    expected_output:
      'Here are the requested syllabus pages: SAFE-101 → "Course Syllabus"; OPS-201 → "Course Syllabus"; MATH-301 → "Course Syllabus"; CS-401 → "Course Syllabus".',
    expected_tool_calls: [
      {
        function: 'get_syllabus_pages',
        args: {},
      },
    ],
  },

  // ── Combine moodle and calendar ───────────────────────────────────────────────────
  {
    id: 'case_004',
    task_type: 'combine_moodle_and_calendar',
    input:
      'Get my last past assignment and create a calendar event for the date of the assignment and for 1.5hours. The Description of the calendar event should be the assignment intro.',
    expected_output:
      'Created calendar event for "Safety Quiz 1" (due in +7 days) with description: "Complete this quiz to test your basic safety knowledge" and a 30-minute reminder.',
    expected_tool_calls: [
      {
        function: 'get_all_courses',
        args: {},
      },
    ],
  },

  // ── Capability & User Info ───────────────────────────────────────────────────
  // {
  //   id: 'case_000',
  //   task_type: 'get_capabilities',
  //   input: 'What are your capabilities?',
  //   expected_output:
  //     'I can access Moodle course content (pages, forums, assignments), track assignments and their due windows, and create/manage calendar events (one-off and recurring), including adding reminders and updating or canceling events.',
  // },
  // {
  //   id: 'case_001',
  //   task_type: 'get_user_info',
  //   input: 'Can you help me get my user information?',
  //   expected_output:
  //     'Here is your user information: Name: Sabrina Studentin, Username: student, Email: student@example.com, Authentication: manual.',
  // },
  // // ── Course discovery ─────────────────────────────────────────────────────────
  // {
  //   id: 'case_002',
  //   task_type: 'list_courses',
  //   input: 'List all my current Moodle courses.',
  //   expected_output:
  //     'Here are your current courses: SAFE-101 (Intro to Safety), OPS-201 (Operations Level 2), MATH-301 (Advanced Mathematics), CS-401 (Computer Science Fundamentals), DH-501 (Digital Health UX).',
  // },
  // {
  //   id: 'case_003',
  //   task_type: 'get_syllabus_pages',
  //   input:
  //     'Show me the syllabus pages for each of my courses: SAFE-101, OPS-201, MATH-301, and CS-401.',
  //   expected_output:
  //     'Here are the requested syllabus pages: SAFE-101 → "Course Syllabus"; OPS-201 → "Course Syllabus"; MATH-301 → "Course Syllabus"; CS-401 → "Course Syllabus".',
  // },
  // // ── Global deadline queries (relative windows) ───────────────────────────────
  // {
  //   id: 'case_004',
  //   task_type: 'list_assignments_due_in_window',
  //   input: 'Show all assignments due in the next 7 days.',
  //   expected_output:
  //     'Assignments due in the next 7 days: CS-401 → "Hello World Program" (due in +3 days; submission types: file upload and online text). SAFE-101 → "Safety Quiz 1" (due in +7 days; submission type: online text). MATH-301 → "Calculus Problem Set 1" (due in +7 days; submission type: file; points: 50).',
  // },
  // {
  //   id: 'case_005',
  //   task_type: 'schedule_assignments_due_in_window',
  //   input:
  //     'Add all assignments due in the next 14 days to my calendar with 2-hour blocks and a reminder 24 hours before.',
  //   expected_output:
  //     'Added calendar events (2-hour duration, 24-hour reminder) for: CS-401 → "Hello World Program" (due in +3 days); SAFE-101 → "Safety Quiz 1" (due in +7 days); MATH-301 → "Calculus Problem Set 1" (due in +7 days); OPS-201 → "Operations Analysis" (due in +10 days); SAFE-101 → "Safety Equipment Essay" (due in +14 days); MATH-301 → "Linear Algebra Assignment" (due in +14 days).',
  // },
  // // ── Course-scoped queries ────────────────────────────────────────────────────
  // {
  //   id: 'case_006',
  //   task_type: 'list_course_assignments',
  //   input:
  //     'For SAFE-101 (Intro to Safety), list all assignments with their due windows and submission types.',
  //   expected_output:
  //     'SAFE-101 assignments: "Safety Quiz 1" (due in +7 days; submission: online text). "Safety Equipment Essay" (due in +14 days; submission: file upload).',
  // },
  // {
  //   id: 'case_007',
  //   task_type: 'list_course_assignments_due_in_window',
  //   input:
  //     'For OPS-201 (Operations Level 2), list assignments due within the next 10 days.',
  //   expected_output:
  //     'OPS-201 assignments due within 10 days: "Operations Analysis" (due in +10 days; submissions: file upload and online text; points: 100).',
  // },
  // {
  //   id: 'case_008',
  //   task_type: 'list_course_assignments_due_in_window_with_points',
  //   input:
  //     'For MATH-301, list assignments due within the next 14 days and include their point values.',
  //   expected_output:
  //     'MATH-301 assignments due within 14 days: "Calculus Problem Set 1" (due in +7 days; 50 points; submission: file). "Linear Algebra Assignment" (due in +14 days; 75 points; submission: file).',
  // },
  // {
  //   id: 'case_009',
  //   task_type: 'list_course_assignments_with_requirements',
  //   input:
  //     'For CS-401, list all upcoming assignments and include whether file upload is required.',
  //   expected_output:
  //     'CS-401 upcoming assignments: "Hello World Program" (due in +3 days; file upload required; also allows online text). "Data Structures Project" (due in +21 days; file upload required).',
  // },
  // // ── Specific named items from your dataset ───────────────────────────────────
  // {
  //   id: 'case_010',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Create a calendar event for "Safety Quiz 1" including its intro as the description and a 30-minute reminder.',
  //   expected_output:
  //     'Created calendar event for "Safety Quiz 1" (due in +7 days) with description: "Complete this quiz to test your basic safety knowledge" and a 30-minute reminder.',
  // },
  // {
  //   id: 'case_011',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Create a calendar event for "Safety Equipment Essay" with a 2-hour duration and include the assignment intro in the description.',
  //   expected_output:
  //     'Created calendar event for "Safety Equipment Essay" (due in +14 days) with 2-hour duration and description: "Write a 500-word essay on proper safety equipment usage".',
  // },
  // {
  //   id: 'case_012',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Create a calendar event for "Operations Analysis" and include both file and online text submission details in the description.',
  //   expected_output:
  //     'Created calendar event for "Operations Analysis" (due in +10 days) with description noting required submissions: file upload and online text (points: 100).',
  // },
  // {
  //   id: 'case_013',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Add "Calculus Problem Set 1" from MATH-301 to my calendar with a 1-hour duration and a reminder 2 hours before.',
  //   expected_output:
  //     'Created 1-hour calendar event for "Calculus Problem Set 1" (due in +7 days) with a reminder 2 hours before.',
  // },
  // {
  //   id: 'case_014',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Add "Linear Algebra Assignment" to my calendar and set a reminder 24 hours before.',
  //   expected_output:
  //     'Created calendar event for "Linear Algebra Assignment" (due in +14 days) with a reminder 24 hours before.',
  // },
  // {
  //   id: 'case_015',
  //   task_type: 'create_assignment_event',
  //   input:
  //     'Schedule a 2-hour event for "Data Structures Project" from CS-401 with the assignment intro in the description.',
  //   expected_output:
  //     'Created 2-hour calendar event for "Data Structures Project" (due in +21 days) with description: "Implement common data structures: linked list, stack, and queue".',
  // },
  // // ── Filters by submission type / structure ───────────────────────────────────
  // {
  //   id: 'case_016',
  //   task_type: 'filter_assignments_by_submission_type_and_schedule',
  //   input:
  //     'Show me assignments that require a file upload across all my courses and add them to my calendar.',
  //   expected_output:
  //     'Assignments requiring file upload have been listed and scheduled: SAFE-101 → "Safety Equipment Essay" (due +14). OPS-201 → "Operations Analysis" (due +10). MATH-301 → "Calculus Problem Set 1" (due +7). MATH-301 → "Linear Algebra Assignment" (due +14). CS-401 → "Hello World Program" (due +3). CS-401 → "Data Structures Project" (due +21).',
  // },
  // {
  //   id: 'case_017',
  //   task_type: 'filter_assignments_by_submission_type',
  //   input:
  //     'Find assignments that allow online text submissions and list their due windows.',
  //   expected_output:
  //     'Assignments that allow online text submissions: SAFE-101 → "Safety Quiz 1" (due in +7 days). OPS-201 → "Operations Analysis" (due in +10 days). CS-401 → "Hello World Program" (due in +3 days).',
  // },
  // // ── Prep/derived planning from deadlines ─────────────────────────────────────
  // {
  //   id: 'case_018',
  //   task_type: 'create_prep_events_for_next_week_deadlines',
  //   input:
  //     'For each assignment due next week, create a preparation event 48 hours earlier titled "Prep: <Assignment Name>".',
  //   expected_output:
  //     'Created preparation events 48 hours before the next-week deadlines for: CS-401 → "Hello World Program" (+3); SAFE-101 → "Safety Quiz 1" (+7); MATH-301 → "Calculus Problem Set 1" (+7).',
  // },
  // {
  //   id: 'case_019',
  //   task_type: 'schedule_study_sessions_before_nearest_deadline',
  //   input:
  //     'Block three 90-minute study sessions on the three days before my nearest deadline.',
  //   expected_output:
  //     'Nearest deadline is CS-401 → "Hello World Program" (due in +3 days). Three 90-minute study sessions have been scheduled on the three preceding days.',
  // },
  // // ── Content & resources present in dataset ───────────────────────────────────
  // {
  //   id: 'case_020',
  //   task_type: 'summarize_page_and_schedule_study_event',
  //   input:
  //     'Summarize the page "Emergency Procedures" from SAFE-101 and add a study event tomorrow at 18:00 with that summary in the description.',
  //   expected_output:
  //     'Summary of "Emergency Procedures": Fire Emergency — pull alarm, evacuate, assemble, report. Medical Emergency — call ext. 5555, administer first aid only if trained, do not move injured person, file incident report. Chemical Spill — evacuate area, alert authorities, contact hazmat, do not clean unless trained. A study event for tomorrow at 18:00 has been created with this summary in the description.',
  // },
  // {
  //   id: 'case_021',
  //   task_type: 'add_external_links_to_next_deadline_events',
  //   input:
  //     'List external resource links from SAFE-101 and CS-401 and add them to the event descriptions for their next deadlines.',
  //   expected_output:
  //     'External links added to the next-deadline event descriptions. SAFE-101 (next deadline: "Safety Quiz 1" in +7 days) ⇒ URLs: OSHA Safety Standards (https://www.osha.gov/laws-regs/regulations/standardnumber), Safety Training Videos (YouTube playlist placeholder). CS-401 (next deadline: "Hello World Program" in +3 days) ⇒ URLs: Python Official Documentation (https://docs.python.org/3/), Python Tutor (http://pythontutor.com), LeetCode (https://leetcode.com), Course GitHub Repository (https://github.com/university/cs401-fall2025).',
  // },
  // {
  //   id: 'case_022',
  //   task_type: 'list_new_forums_this_week',
  //   input:
  //     'Show new announcements or forum topics created this week across my courses.',
  //   expected_output:
  //     "Here are this week's new forums available per course (timestamps not provided in dataset): SAFE-101 → 'Course Announcements', 'General Discussion', 'Safety Incident Reports'. OPS-201 → 'Announcements', 'Operations Q&A'. MATH-301 → 'Course Announcements', 'Problem Set Help', 'Study Groups'. CS-401 → 'Course News', 'General Discussion', 'Help with Code', 'Project Showcase'.",
  // },
  // // ── Calendar ops (edits, recurring, cancellation) ────────────────────────────
  // {
  //   id: 'case_023',
  //   task_type: 'create_recurring_event',
  //   input:
  //     'Create a recurring weekly calendar event "Exercise Session" every Tuesday 18:00–19:00 for the next 6 weeks.',
  //   expected_output:
  //     'Created a recurring weekly event "Exercise Session" on Tuesdays from 18:00–19:00 for the next 6 weeks.',
  // },
  // {
  //   id: 'case_024',
  //   task_type: 'update_single_event_occurrence',
  //   input:
  //     'Rename the calendar event "Exercise Session" next Tuesday to "Exercise & Focus Session" and move it to 18:30–19:30.',
  //   expected_output:
  //     'The event next Tuesday has been updated: renamed to "Exercise & Focus Session" and rescheduled to 18:30–19:30.',
  // },
  // {
  //   id: 'case_025',
  //   task_type: 'cancel_recurring_event',
  //   input:
  //     'Cancel all remaining occurrences of the recurring event "Exercise & Focus Session".',
  //   expected_output:
  //     'All remaining occurrences of the recurring event "Exercise & Focus Session" have been canceled.',
  // },
  // // ── Notifications / muting ───────────────────────────────────────────────────
  // {
  //   id: 'case_026',
  //   task_type: 'pause_notifications_until',
  //   input:
  //     'Pause notifications for calendar and Moodle updates until next Monday 08:00.',
  //   expected_output:
  //     'Notifications for calendar and Moodle updates have been paused until next Monday at 08:00.',
  // },
  // // ── High-level weekly planning ───────────────────────────────────────────────
  // {
  //   id: 'case_027',
  //   task_type: 'weekly_planning_summary_and_schedule_missing',
  //   input:
  //     'What do I need to do this week? Summarize all deadlines and add any missing events to my calendar.',
  //   expected_output:
  //     'This week (≤ +7 days): CS-401 → "Hello World Program" (due +3). SAFE-101 → "Safety Quiz 1" (due +7). MATH-301 → "Calculus Problem Set 1" (due +7). Missing calendar events (if any) have been created. Also upcoming within 14 days: OPS-201 → "Operations Analysis" (due +10), SAFE-101 → "Safety Equipment Essay" (due +14), MATH-301 → "Linear Algebra Assignment" (due +14).',
  // },
];
