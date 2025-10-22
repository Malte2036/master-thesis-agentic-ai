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
    expect(
      iterationHistory?.[0]?.structuredThought.functionCalls[0].args
        .include_in_response,
    ).toEqual(
      expect.objectContaining({
        startdate: true,
      }),
    );

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
});
