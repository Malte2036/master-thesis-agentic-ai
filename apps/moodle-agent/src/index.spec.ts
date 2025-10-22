import {
  addMoodleMapping,
  resetMappings,
} from '@master-thesis-agentic-ai/test-utils';
import { describe, expect, it } from 'vitest';
import { getRouter } from './index';
import { getRouterResponse } from './utils/testing';
import {
  mockCourseSearchCoursesResponseDigitalHealth,
  mockEnrolledCourses,
  mockAssignments,
  mockUserInfo,
  assignmentDefaults,
} from './utils/mock.spec.utils';
import {
  compareTimes,
  parseTimestamp,
  parseTimestampToISOString,
} from '@master-thesis-agentic-ai/agent-framework';

const MODEL = 'qwen3:4b';

describe('Moodle Agent Tests', () => {
  beforeAll(async () => {
    await resetMappings();
  });

  it('should be able to get the user info', async () => {
    await addMoodleMapping('core_webservice_get_site_info', mockUserInfo);

    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      'Test if the moodle-agent is able to get the user info',
      5,
    );

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(routerResponse?.process?.iterationHistory?.[0]?.response).toContain(
      mockUserInfo.firstname,
    );
    expect(routerResponse?.process?.iterationHistory?.[0]?.response).toContain(
      mockUserInfo.lastname,
    );

    expect(routerResponse?.process?.iterationHistory?.length).toBe(2);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .isFinished,
    ).toBe(true);
  }, 60_000);

  it('should be able to determine how to get the start date of a course', async () => {
    const searchValue = 'UX Design';

    await addMoodleMapping('core_webservice_get_site_info', mockUserInfo);
    await addMoodleMapping('core_enrol_get_users_courses', mockEnrolledCourses);
    await addMoodleMapping(
      'core_course_search_courses',
      mockCourseSearchCoursesResponseDigitalHealth,
      {
        criterianame: 'search',
        criteriavalue: searchValue,
      },
    );

    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      `When does the course "${searchValue}" start?`,
      5,
    );

    expect(routerResponse?.error).toBeUndefined();

    const iterationHistory = routerResponse?.process?.iterationHistory;
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(iterationHistory?.[0]?.structuredThought.functionCalls).toHaveLength(
      1,
    );
    expect(
      iterationHistory?.[0]?.structuredThought.functionCalls[0].function,
    ).toBe('search_courses_by_name');
    expect(
      iterationHistory?.[0]?.structuredThought.functionCalls[0].args
        .course_name,
    ).toBe(searchValue);
    // expect(
    //   iterationHistory?.[0]?.structuredThought.functionCalls[0].args
    //     .include_in_response,
    // ).toEqual(
    //   expect.objectContaining({
    //     startdate: true,
    //   }),
    // );

    expect(iterationHistory?.[0]?.response).toContain(
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].fullname,
    );
    expect(iterationHistory?.[0]?.response).toContain(
      parseTimestampToISOString(
        mockCourseSearchCoursesResponseDigitalHealth.courses[0].startdate,
      ),
    );

    expect(iterationHistory?.length).toBe(2);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .isFinished,
    ).toBe(true);
  }, 60_000);

  it('get assignments for a course', async () => {
    const searchValue =
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].fullname;
    await addMoodleMapping('core_webservice_get_site_info', mockUserInfo);
    await addMoodleMapping('core_enrol_get_users_courses', mockEnrolledCourses);
    await addMoodleMapping(
      'core_course_search_courses',
      mockCourseSearchCoursesResponseDigitalHealth,
      {
        criterianame: 'search',
        criteriavalue: searchValue,
      },
    );
    await addMoodleMapping('mod_assign_get_assignments', mockAssignments);

    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      `What are the assignments for the course "${searchValue}"?`,
      5,
    );

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(routerResponse?.process?.iterationHistory?.length).toBe(3);

    // GET COURSE ID
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls,
    ).toHaveLength(1);
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls[0],
    ).toEqual(
      expect.objectContaining({
        function: 'search_courses_by_name',
        args: expect.objectContaining({
          course_name: searchValue,
        }),
      }),
    );
    expect(routerResponse?.process?.iterationHistory?.[1]?.response).toContain(
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].id,
    );

    // GET ASSIGNMENTS
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .functionCalls,
    ).toHaveLength(1);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .functionCalls[0],
    ).toEqual(
      expect.objectContaining({
        function: 'get_assignments_for_course',
        args: expect.objectContaining({
          course_id: mockCourseSearchCoursesResponseDigitalHealth.courses[0].id,
        }),
      }),
    );

    expect(
      routerResponse?.process?.iterationHistory?.[2]?.structuredThought
        .isFinished,
    ).toBe(true);
    expect(
      routerResponse?.process?.iterationHistory?.[2]?.naturalLanguageThought,
    ).toContain(
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].assignments[0]
        .name,
    );
    expect(
      routerResponse?.process?.iterationHistory?.[2]?.naturalLanguageThought,
    ).toContain(
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].assignments[0]
        .name,
    );
  }, 60_000);

  it('should be able to get the latest assignments for a course by course name', async () => {
    const searchValue =
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].fullname;
    await addMoodleMapping('core_webservice_get_site_info', mockUserInfo);
    await addMoodleMapping('core_enrol_get_users_courses', mockEnrolledCourses);
    await addMoodleMapping(
      'core_course_search_courses',
      mockCourseSearchCoursesResponseDigitalHealth,
      {
        criterianame: 'search',
        criteriavalue: searchValue,
      },
    );
    await addMoodleMapping('mod_assign_get_assignments', mockAssignments);

    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      `What are the latest assignments for the course "${searchValue}"?`,
      5,
    );

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(routerResponse?.process?.iterationHistory?.length).toBe(3);

    // GET COURSE ID
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls,
    ).toHaveLength(1);
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls[0],
    ).toEqual(
      expect.objectContaining({
        function: 'search_courses_by_name',
        args: expect.objectContaining({ course_name: searchValue }),
      }),
    );

    // GET ASSIGNMENTS
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .functionCalls,
    ).toHaveLength(1);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .functionCalls[0],
    ).toEqual(
      expect.objectContaining({
        function: 'get_assignments_for_course',
        args: expect.objectContaining({
          course_id: mockCourseSearchCoursesResponseDigitalHealth.courses[0].id,
        }),
      }),
    );

    expect(
      routerResponse?.process?.iterationHistory?.[2]?.structuredThought
        .isFinished,
    ).toBe(true);
    expect(
      routerResponse?.process?.iterationHistory?.[2]?.naturalLanguageThought,
    ).toContain(
      mockCourseSearchCoursesResponseDigitalHealth.courses[0].assignments.sort(
        (a, b) => (compareTimes(a.duedate, b.duedate) ? 1 : -1),
      )[0].name,
    );
  }, 60_000);

  it.only('should list assignments due in the next 7 days across all courses (windowed, field-filtered, single-call)', async () => {
    await addMoodleMapping('core_webservice_get_site_info', mockUserInfo);

    // Build a custom assignments payload with mixed due dates
    const now = Math.floor(Date.now() / 1000); // seconds
    const days = (d: number) => d * 24 * 60 * 60;

    const in3Days = now + days(3);
    const in6Days = now + days(6);
    const in15Days = now + days(15);
    const yesterday = now - days(1);

    const customAssignmentsPayload = {
      courses: [
        {
          id: 101,
          fullname: 'Data Mining WS25',
          assignments: [
            assignmentDefaults({
              id: 9001,
              course: 101,
              name: 'HW2: Classification (inside window)',
              duedate: in3Days,
              url: 'https://moodle.example/mod/assign/view.php?id=9001',
            }),
            assignmentDefaults({
              id: 9002,
              course: 101,
              name: 'Project Proposal (outside window)',
              duedate: in15Days,
              url: 'https://moodle.example/mod/assign/view.php?id=9002',
            }),
          ],
        },
        {
          id: 202,
          fullname: 'IR Systems',
          assignments: [
            assignmentDefaults({
              id: 9101,
              course: 202,
              name: 'Paper Critique (inside window)',
              duedate: in6Days,
              url: 'https://moodle.example/mod/assign/view.php?id=9101',
            }),
            assignmentDefaults({
              id: 9102,
              course: 202,
              name: 'Late Reflection (past, outside window)',
              duedate: yesterday,
              url: 'https://moodle.example/mod/assign/view.php?id=9102',
            }),
          ],
        },
      ],
    };

    // Map the bulk-assignments endpoint to our mixed dataset
    await addMoodleMapping(
      'mod_assign_get_assignments',
      customAssignmentsPayload,
    );

    const agent = await getRouter(MODEL);

    // Ask for a 7-day window and a compact table with selected fields
    const routerResponse = await getRouterResponse(
      agent,
      [
        'List all assignments due in the next 7 days across my courses.',
        'Only include: course, name, due date (ISO), and url.',
        'Prefer a single call if possible.',
      ].join(' '),
      6,
    );

    expect(routerResponse?.error).toBeUndefined();
    const iters = routerResponse?.process?.iterationHistory ?? [];
    expect(iters).toBeDefined();

    // 1) Planning: should pick get_assignments_for_all_courses with a window
    expect(iters[0]?.structuredThought.functionCalls).toHaveLength(1);
    const fc = iters[0].structuredThought.functionCalls[0];

    expect(fc.function).toBe('get_assignments_for_all_courses');
    // We don't assert exact timestamps, but we require both bounds to exist:
    expect(fc.args).toEqual(
      expect.objectContaining({
        due_after: expect.anything(),
        due_before: expect.anything(),
        // include_in_response: expect.objectContaining({
        //   // Make sure the agent requested only what we asked for (or at least these):
        //   course: true,
        //   name: true,
        //   duedate: true,
        //   url: true,
        // }),
      }),
    );

    // 2) Observation → Natural language summary should contain only inside-window items
    // Convert our timestamps to ISO strings the same way your tools do:
    const toISO = (t: number) => parseTimestampToISOString(t);

    const insideNames = [
      'HW2: Classification (inside window)',
      'Paper Critique (inside window)',
    ];
    const outsideNames = [
      'Project Proposal (outside window)',
      'Late Reflection (past, outside window)',
    ];

    // The final step should be finished and contain the inside-window assignments
    const last = iters[iters.length - 1];
    expect(last?.structuredThought.isFinished).toBe(true);

    // Must include both "inside" assignments and their ISO dates
    for (const name of insideNames) {
      expect(last?.naturalLanguageThought ?? last?.response ?? '').toContain(
        name,
      );
    }
    expect(last?.naturalLanguageThought ?? last?.response ?? '').toContain(
      toISO(in3Days),
    );
    expect(last?.naturalLanguageThought ?? last?.response ?? '').toContain(
      toISO(in6Days),
    );

    // Must not include the "outside" ones
    for (const name of outsideNames) {
      expect(
        last?.naturalLanguageThought ?? last?.response ?? '',
      ).not.toContain(name);
    }

    // Sanity: should be 2–3 iterations (plan -> act -> finish)
    expect(iters.length).toBeGreaterThanOrEqual(2);
    expect(iters.length).toBeLessThanOrEqual(4);
  }, 60_000);
});
