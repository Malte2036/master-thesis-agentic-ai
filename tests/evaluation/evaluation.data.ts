import { EvaluationReportBase } from '../report/report';

export const E2E_EVALUATION_TEST_DATA: EvaluationReportBase[] = [
  // ── Capability & User Info ───────────────────────────────────────────────────
  {
    input: 'What are your capabilities?',
    expected_output:
      'I can access Moodle course content, track assignments, and manage calendar events.',
    retrieval_context:
      'Available Moodle data: users (student=Sabrina Studentin, teacher=Thomas Teacher) | Courses enrolled for student: SAFE-101 (Intro to Safety), OPS-201 (Operations Level 2), MATH-301 (Advanced Mathematics), CS-401 (Computer Science Fundamentals), DH-501 (Digital Health UX) | Each course includes pages, forums, and some include assignments with due windows (+3/+7/+10/+14/+21 days) and submission types (file, online text).',
  },
  {
    input: 'Can you help me get my user information?',
    expected_output:
      'Here is your user information: Name: Sabrina Studentin, Username: student',
    retrieval_context:
      'User record: username=student, firstname=Sabrina, lastname=Studentin, email=student@example.com, auth=manual.',
  },

  // ── Course discovery ─────────────────────────────────────────────────────────
  {
    input: 'List all my current Moodle courses.',
    expected_output: 'Here are your current courses.',
    retrieval_context:
      'Enrolled courses for user "student": SAFE-101 (Intro to Safety), OPS-201 (Operations Level 2), MATH-301 (Advanced Mathematics), CS-401 (Computer Science Fundamentals), DH-501 (Digital Health UX).',
  },
  {
    input:
      'Show me the syllabus pages for each of my courses: SAFE-101, OPS-201, MATH-301, and CS-401.',
    expected_output: 'Here are the requested syllabus pages for your courses.',
    retrieval_context:
      'Syllabus pages exist: SAFE-101 → "Course Syllabus"; OPS-201 → "Course Syllabus"; MATH-301 → "Course Syllabus"; CS-401 → "Course Syllabus".',
  },

  // ── Global deadline queries (relative windows) ───────────────────────────────
  {
    input: 'Show all assignments due in the next 7 days.',
    expected_output: 'Here are the assignments due in the next 7 days.',
    retrieval_context:
      'Assignments with due ≤ +7 days: CS-401 → "Hello World Program" (due +3, file=1, onlineText=1); SAFE-101 → "Safety Quiz 1" (due +7, onlineText=1); MATH-301 → "Calculus Problem Set 1" (due +7, file=1, grade=50).',
  },
  {
    input:
      'Add all assignments due in the next 14 days to my calendar with 2-hour blocks and a reminder 24 hours before.',
    expected_output:
      'All assignments due in the next 14 days have been added to your calendar with 2-hour durations and 24-hour reminders.',
    retrieval_context:
      'Assignments with due ≤ +14 days: CS-401 → "Hello World Program" (+3, file=1, onlineText=1); SAFE-101 → "Safety Quiz 1" (+7, onlineText=1); MATH-301 → "Calculus Problem Set 1" (+7, file=1, grade=50); OPS-201 → "Operations Analysis" (+10, file=1, onlineText=1, grade=100); SAFE-101 → "Safety Equipment Essay" (+14, file=1, grade=100); MATH-301 → "Linear Algebra Assignment" (+14, file=1, grade=75).',
  },

  // ── Course-scoped queries ────────────────────────────────────────────────────
  {
    input:
      'For SAFE-101 (Intro to Safety), list all assignments with their due windows and submission types.',
    expected_output:
      'Here are the assignments for SAFE-101 with due windows and submission types.',
    retrieval_context:
      'SAFE-101 assignments: "Safety Quiz 1" (due +7, onlineText=1); "Safety Equipment Essay" (due +14, file=1).',
  },
  {
    input:
      'For OPS-201 (Operations Level 2), list assignments due within the next 10 days.',
    expected_output:
      'Here are the assignments for OPS-201 due within the next 10 days.',
    retrieval_context:
      'OPS-201 assignments due ≤ +10: "Operations Analysis" (due +10, file=1, onlineText=1, grade=100).',
  },
  {
    input:
      'For MATH-301, list assignments due within the next 14 days and include their point values.',
    expected_output:
      'Here are the assignments for MATH-301 due within the next 14 days with their point values.',
    retrieval_context:
      'MATH-301 assignments due ≤ +14: "Calculus Problem Set 1" (due +7, grade=50, file=1); "Linear Algebra Assignment" (due +14, grade=75, file=1).',
  },
  {
    input:
      'For CS-401, list all upcoming assignments and include whether file upload is required.',
    expected_output:
      'Here are the upcoming assignments for CS-401 with file upload requirements.',
    retrieval_context:
      'CS-401 upcoming assignments: "Hello World Program" (due +3, file=1, onlineText=1); "Data Structures Project" (due +21, file=1).',
  },

  // ── Specific named items from your dataset ───────────────────────────────────
  {
    input:
      'Create a calendar event for "Safety Quiz 1" including its intro as the description and a 30-minute reminder.',
    expected_output:
      'The calendar event "Safety Quiz 1" has been created successfully with a 30-minute reminder.',
    retrieval_context:
      'SAFE-101 → "Safety Quiz 1": intro="Complete this quiz to test your basic safety knowledge", due +7, onlineText=1.',
  },
  {
    input:
      'Create a calendar event for "Safety Equipment Essay" with a 2-hour duration and include the assignment intro in the description.',
    expected_output:
      'The calendar event "Safety Equipment Essay" has been created successfully.',
    retrieval_context:
      'SAFE-101 → "Safety Equipment Essay": intro="Write a 500-word essay on proper safety equipment usage", due +14, file=1, grade=100.',
  },
  {
    input:
      'Create a calendar event for "Operations Analysis" and include both file and online text submission details in the description.',
    expected_output:
      'The calendar event "Operations Analysis" has been created successfully.',
    retrieval_context:
      'OPS-201 → "Operations Analysis": intro="Analyze the provided operational scenario and submit your findings", due +10, file=1, onlineText=1, grade=100.',
  },
  {
    input:
      'Add "Calculus Problem Set 1" from MATH-301 to my calendar with a 1-hour duration and a reminder 2 hours before.',
    expected_output:
      'The calendar event "Calculus Problem Set 1" has been created successfully.',
    retrieval_context:
      'MATH-301 → "Calculus Problem Set 1": intro="Complete the first set of calculus problems", due +7, file=1, grade=50.',
  },
  {
    input:
      'Add "Linear Algebra Assignment" to my calendar and set a reminder 24 hours before.',
    expected_output:
      'The calendar event "Linear Algebra Assignment" has been created successfully.',
    retrieval_context:
      'MATH-301 → "Linear Algebra Assignment": intro="Solve the linear algebra problems in the textbook", due +14, file=1, grade=75.',
  },
  {
    input:
      'Schedule a 2-hour event for "Data Structures Project" from CS-401 with the assignment intro in the description.',
    expected_output:
      'The calendar event "Data Structures Project" has been created successfully.',
    retrieval_context:
      'CS-401 → "Data Structures Project": intro="Implement common data structures: linked list, stack, and queue", due +21, file=1, grade=150.',
  },

  // ── Filters by submission type / structure ───────────────────────────────────
  {
    input:
      'Show me assignments that require a file upload across all my courses and add them to my calendar.',
    expected_output:
      'Here are the assignments requiring file upload and they have been added to your calendar.',
    retrieval_context:
      'Assignments with file=1: SAFE-101 → "Safety Equipment Essay" (+14); OPS-201 → "Operations Analysis" (+10); MATH-301 → "Calculus Problem Set 1" (+7); MATH-301 → "Linear Algebra Assignment" (+14); CS-401 → "Hello World Program" (+3); CS-401 → "Data Structures Project" (+21).',
  },
  {
    input:
      'Find assignments that allow online text submissions and list their due windows.',
    expected_output:
      'Here are the assignments that allow online text submissions with their due windows.',
    retrieval_context:
      'Assignments with onlineText=1: SAFE-101 → "Safety Quiz 1" (+7); OPS-201 → "Operations Analysis" (+10); CS-401 → "Hello World Program" (+3).',
  },

  // ── Prep/derived planning from deadlines ─────────────────────────────────────
  {
    input:
      'For each assignment due next week, create a preparation event 48 hours earlier titled "Prep: <Assignment Name>".',
    expected_output:
      'Preparation events 48 hours before each assignment due next week have been created.',
    retrieval_context:
      'Next-week window (≤ +7): CS-401 "Hello World Program" (+3); SAFE-101 "Safety Quiz 1" (+7); MATH-301 "Calculus Problem Set 1" (+7).',
  },
  {
    input:
      'Block three 90-minute study sessions on the three days before my nearest deadline.',
    expected_output:
      'Three 90-minute study sessions have been scheduled on the days before your nearest deadline.',
    retrieval_context:
      'Nearest deadline: CS-401 → "Hello World Program" due +3 days.',
  },

  // ── Content & resources present in dataset ───────────────────────────────────
  {
    input:
      'Summarize the page "Emergency Procedures" from SAFE-101 and add a study event tomorrow at 18:00 with that summary in the description.',
    expected_output:
      'Here is the summary of "Emergency Procedures" and a study event has been created for tomorrow at 18:00.',
    retrieval_context:
      'SAFE-101 Section "Week 2: Personal Protective Equipment (PPE)" → Page "Emergency Procedures": sections include Fire Emergency (alarm, evacuate, assemble, report), Medical Emergency (call ext. 5555, first aid if trained, don’t move injured person, incident report), Chemical Spill (evacuate, alert, contact hazmat, no cleanup unless trained).',
  },
  {
    input:
      'List external resource links from SAFE-101 and CS-401 and add them to the event descriptions for their next deadlines.',
    expected_output:
      'External resource links have been listed and added to the descriptions of your next deadline events.',
    retrieval_context:
      'SAFE-101 external URLs: "OSHA Safety Standards" (https://www.osha.gov/laws-regs/regulations/standardnumber), "Safety Training Videos" (YouTube playlist placeholder). Next SAFE-101 deadline: "Safety Quiz 1" (+7). CS-401 external URLs: "Python Official Documentation" (https://docs.python.org/3/), "Python Tutor" (http://pythontutor.com), "LeetCode" (https://leetcode.com), "Course GitHub Repository" (https://github.com/university/cs401-fall2025). Next CS-401 deadline: "Hello World Program" (+3).',
  },
  {
    input:
      'Show new announcements or forum topics created this week across my courses.',
    expected_output:
      'Here are this week’s new announcements and forum topics across your courses.',
    retrieval_context:
      'Forums available (no timestamps in seed): SAFE-101 → "Course Announcements", "General Discussion", "Safety Incident Reports"; OPS-201 → "Announcements", "Operations Q&A"; MATH-301 → "Course Announcements", "Problem Set Help", "Study Groups"; CS-401 → "Course News", "General Discussion", "Help with Code", "Project Showcase".',
  },

  // ── Calendar ops (edits, recurring, cancellation) ────────────────────────────
  {
    input:
      'Create a recurring weekly calendar event "Exercise Session" every Tuesday 18:00–19:00 for the next 6 weeks.',
    expected_output:
      'The recurring weekly event "Exercise Session" has been created successfully.',
    retrieval_context: '',
  },
  {
    input:
      'Rename the calendar event "Exercise Session" next Tuesday to "Exercise & Focus Session" and move it to 18:30–19:30.',
    expected_output:
      'The event has been renamed to "Exercise & Focus Session" and rescheduled to 18:30–19:30.',
    retrieval_context: '',
  },
  {
    input:
      'Cancel all remaining occurrences of the recurring event "Exercise & Focus Session".',
    expected_output:
      'The recurring event "Exercise & Focus Session" has been canceled.',
    retrieval_context: '',
  },

  // ── Notifications / muting ───────────────────────────────────────────────────
  {
    input:
      'Pause notifications for calendar and Moodle updates until next Monday 08:00.',
    expected_output:
      'Notifications have been paused until next Monday at 08:00.',
    retrieval_context: '',
  },

  // ── High-level weekly planning ───────────────────────────────────────────────
  {
    input:
      'What do I need to do this week? Summarize all deadlines and add any missing events to my calendar.',
    expected_output:
      'Here is your summary for this week and missing events have been added to your calendar.',
    retrieval_context:
      'Within the next 7 days: CS-401 "Hello World Program" (+3); SAFE-101 "Safety Quiz 1" (+7); MATH-301 "Calculus Problem Set 1" (+7). Additional upcoming (beyond 7 but within 14): OPS-201 "Operations Analysis" (+10); SAFE-101 "Safety Equipment Essay" (+14); MATH-301 "Linear Algebra Assignment" (+14).',
  },
];
