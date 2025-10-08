import { describe, it, expect } from 'vitest';
import { getRouterResponse } from './utils/testing';
import { getRouter } from './index';

const MODEL = 'qwen3:4b';

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
});
