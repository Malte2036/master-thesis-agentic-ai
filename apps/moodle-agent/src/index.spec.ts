import { describe, it, expect } from 'vitest';
import { getRouterResponse } from './utils/testing';
import { getRouter } from './index';

const MODEL = 'qwen3:4b';

const MOODLE_TEST_DATA = {
  courses: {
    DIGITAL_HEALTH: {
      id: 5,
      assignments: [
        {
          name: 'Redesigning a Digital Health App for Patient Engagement',
        },
      ],
    },
  },
};

describe('Moodle Agent Tests', () => {
  it('should be able to get the user info', async () => {
    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      'Test if the moodle-agent is able to get the user info',
      5,
    );

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(routerResponse?.process?.iterationHistory?.[0]?.response).toContain(
      'Sabrina',
    );
    expect(routerResponse?.process?.iterationHistory?.[0]?.response).toContain(
      'Studentin',
    );

    expect(routerResponse?.process?.iterationHistory?.length).toBe(2);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .isFinished,
    ).toBe(true);
  }, 60_000);

  it('should be able to determine how to get the start date of a course', async () => {
    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      'When does the course "Digital Health" start?',
      5,
    );

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls,
    ).toHaveLength(1);
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls[0].function,
    ).toBe('search_courses_by_name');
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls[0].args.course_name,
    ).toBe('Digital Health');
    expect(
      routerResponse?.process?.iterationHistory?.[0]?.structuredThought
        .functionCalls[0].args.include_in_response,
    ).toEqual(
      expect.objectContaining({
        startdate: true,
      }),
    );

    expect(routerResponse?.process?.iterationHistory?.length).toBe(2);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .isFinished,
    ).toBe(true);
  }, 60_000);

  it('get assignments for a course', async () => {
    const agent = await getRouter(MODEL);

    const routerResponse = await getRouterResponse(
      agent,
      'What are the assignments for the course "Digital Health"?',
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
          course_name: 'Digital Health',
        }),
      }),
    );
    expect(routerResponse?.process?.iterationHistory?.[1]?.response).toContain(
      MOODLE_TEST_DATA.courses.DIGITAL_HEALTH.id,
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
          course_id: MOODLE_TEST_DATA.courses.DIGITAL_HEALTH.id,
        }),
      }),
    );

    expect(
      routerResponse?.process?.iterationHistory?.[2]?.structuredThought
        .isFinished,
    ).toBe(true);
    expect(
      routerResponse?.process?.iterationHistory?.[2]?.naturalLanguageThought,
    ).toContain(MOODLE_TEST_DATA.courses.DIGITAL_HEALTH.assignments[0].name);
  }, 60_000);
});
