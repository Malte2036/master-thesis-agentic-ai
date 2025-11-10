import { Wiremock } from '@master-thesis-agentic-ai/test-utils';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  TestContext,
  vi,
} from 'vitest';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import { mockAssignments, mockUserInfo } from './routing.e2e.test.mock';

vi.setConfig({ testTimeout: 120_000, maxConcurrency: 3 });

describe('E2E Routing Agent Test', () => {
  const ROUTING_AGENT_URL = 'http://localhost:3000';

  const AGENT_URLS = ['http://localhost:1234', 'http://localhost:1235'];

  let routingAgent: RoutingAgentClient;

  beforeAll(async () => {
    await Wiremock.resetGlobal();
    routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

    // Wait for services to be ready
    await routingAgent.waitForReady();

    await Promise.all(
      AGENT_URLS.map((agentUrl) =>
        waitForService(`${agentUrl}/.well-known/agent.json`, agentUrl),
      ),
    );
  });

  beforeEach(async (ctx) => {
    (ctx as unknown as TestContext).wiremock = new Wiremock(ctx.task.name);
  });

  // afterEach(async (ctx) => {
  //   await (ctx as unknown as TestContext).wiremock.reset();
  // });

  it.concurrent('should tell his capabilities', async ({ wiremock }) => {
    const testPrompt = 'What are your capabilities?';

    const { finalResponse } = await routingAgent.askAndWaitForResponse(
      {
        prompt: testPrompt,
      },
      wiremock.contextId,
    );

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);

    expect(finalResponse.toLowerCase()).toContain('moodle');
    expect(finalResponse.toLowerCase()).toContain('course');
    expect(finalResponse.toLowerCase()).toContain('calendar');
  });

  it.concurrent(
    'should get a response to a question by using the moodle-agent',
    async ({ wiremock }) => {
      await wiremock.addMoodleLoginMapping('mock-token');

      await wiremock.addMoodleMapping(
        'core_webservice_get_site_info',
        mockUserInfo,
      );

      const testPrompt = 'Can you help me get my user information?';

      const { finalResponse } = await routingAgent.askAndWaitForResponse(
        {
          prompt: testPrompt,
        },
        wiremock.contextId,
      );

      expect(finalResponse).toBeDefined();
      expect(finalResponse.length).toBeGreaterThan(0);
      // include sabrina student
      expect(finalResponse).toContain('Annika');
      expect(finalResponse).toContain('Schmidt');

      expect(
        await wiremock.countMoodleRequests('core_webservice_get_site_info'),
      ).toBe(1);
    },
  );

  it.concurrent('should create a calendar event', async ({ wiremock }) => {
    const requestBody = {
      summary: 'Meeting with John Doe',
      description: 'We will discuss the project',
      start: {
        dateTime: '2025-10-22T13:22:00Z',
        timeZone: 'UTC',
      },
      end: {
        dateTime: '2025-10-25T17:09:00Z',
        timeZone: 'UTC',
      },
    };

    const responseBody = {
      id: '8793287321',
      summary: requestBody.summary,
      description: requestBody.description,
      start: {
        dateTime: requestBody.start.dateTime,
        timeZone: 'UTC',
      },
      end: {
        dateTime: requestBody.end.dateTime,
        timeZone: 'UTC',
      },
    };

    await wiremock.addCalendarMapping(
      '/calendar/v3/calendars/primary/events',
      requestBody,
      responseBody,
    );

    const testPrompt = `Create a calendar event with the name "${requestBody.summary}" and the description "${requestBody.description}" from ${new Date(requestBody.start.dateTime).toUTCString()} to ${new Date(requestBody.end.dateTime).toUTCString()}.`;
    const { finalResponse } = await routingAgent.askAndWaitForResponse(
      {
        prompt: testPrompt,
      },
      wiremock.contextId,
    );

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    expect(finalResponse).toContain(responseBody.summary);
    // expect(finalResponse).toContain(responseBody.description);
    expect(finalResponse).not.toContain(responseBody.id);

    expect(
      await wiremock.countCalendarRequests(
        '/calendar/v3/calendars/primary/events',
        requestBody,
      ),
    ).toBe(1);
  });

  it.concurrent(
    'should create a recurring calendar event',
    async ({ wiremock }) => {
      const requestBody = {
        summary: 'Weekly Team Standup',
        description: 'Our regular weekly team standup meeting',
        start: {
          dateTime: '2017-10-23T09:00:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2017-10-23T09:30:00Z',
          timeZone: 'UTC',
        },
        recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO'],
      };

      const responseBody = {
        id: 'recurring-event-123',
        summary: requestBody.summary,
        description: requestBody.description,
        start: {
          dateTime: requestBody.start.dateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: requestBody.end.dateTime,
          timeZone: 'UTC',
        },
        recurrence: requestBody.recurrence,
      };

      await wiremock.addCalendarMapping(
        '/calendar/v3/calendars/primary/events',
        requestBody,
        responseBody,
      );

      const testPrompt = `Create a recurring calendar event with the name "${requestBody.summary}" and the description "${requestBody.description}" every Monday at 9:00 AM UTC for 30 minutes beginning on ${requestBody.start.dateTime}.`;
      const { finalResponse } = await routingAgent.askAndWaitForResponse(
        {
          prompt: testPrompt,
        },
        wiremock.contextId,
      );

      expect(finalResponse).toBeDefined();
      expect(finalResponse.length).toBeGreaterThan(0);
      expect(finalResponse).toContain(responseBody.summary);
      expect(finalResponse.toLowerCase()).toContain('recurring');
      // expect(finalResponse.toLowerCase()).toContain('created');

      expect(
        await wiremock.countCalendarRequests(
          '/calendar/v3/calendars/primary/events',
          requestBody,
        ),
      ).toBe(1);
    },
  );

  it.concurrent(
    'should create a daily recurring calendar event',
    async ({ wiremock }) => {
      const requestBody = {
        summary: 'Daily Standup',
        description: 'Daily team check-in meeting',
        start: {
          dateTime: '2025-01-15T10:00:00Z',
          timeZone: 'UTC',
        },
        end: {
          dateTime: '2025-01-15T10:15:00Z',
          timeZone: 'UTC',
        },
        recurrence: ['RRULE:FREQ=DAILY;COUNT=10'],
      };

      const responseBody = {
        id: 'daily-recurring-event-456',
        summary: requestBody.summary,
        description: requestBody.description,
        start: {
          dateTime: requestBody.start.dateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: requestBody.end.dateTime,
          timeZone: 'UTC',
        },
        recurrence: requestBody.recurrence,
      };

      await wiremock.addCalendarMapping(
        '/calendar/v3/calendars/primary/events',
        requestBody,
        responseBody,
      );

      const testPrompt = `Create a daily recurring calendar event with the name "${requestBody.summary}" and the description "${requestBody.description}" every day at 10:00 AM UTC for 15 minutes, repeating 10 times. Beginning on ${requestBody.start.dateTime}.`;
      const { finalResponse } = await routingAgent.askAndWaitForResponse(
        {
          prompt: testPrompt,
        },
        wiremock.contextId,
      );

      expect(finalResponse).toBeDefined();
      expect(finalResponse.length).toBeGreaterThan(0);
      expect(finalResponse).toContain(responseBody.summary);
      // expect(finalResponse.toLowerCase()).toContain('recurring');
      // expect(finalResponse.toLowerCase()).toContain('scheduled');
      // expect(finalResponse.toLowerCase()).toContain('daily');
      // expect(finalResponse.toLowerCase()).toContain('10');

      expect(
        await wiremock.countCalendarRequests(
          '/calendar/v3/calendars/primary/events',
          requestBody,
        ),
      ).toBe(1);
    },
  );

  it.concurrent(
    'should combine the moodle-agent and the calendar-agent',
    async ({ wiremock }) => {
      await wiremock.addMoodleLoginMapping('mock-token');

      await wiremock.addMoodleMapping(
        'core_webservice_get_site_info',
        mockUserInfo,
      );

      await wiremock.addMoodleMapping(
        'mod_assign_get_assignments',
        mockAssignments,
      );

      const lastPastAssignment = mockAssignments.courses
        .flatMap((course) => course.assignments)
        .sort((a, b) => b.duedate - a.duedate)[0];

      const calendarRequestBody = {
        summary: lastPastAssignment.name,
        intro: lastPastAssignment.intro,
        start: {
          dateTime: lastPastAssignment.duedate,
        },
        end: {
          dateTime: lastPastAssignment.duedate + 1.5 * 60 * 60 * 1000,
        },
      };

      const calendarResponseBody = {
        id: '1234567890',
        summary: calendarRequestBody.summary,
        description: calendarRequestBody.intro,
        start: {
          dateTime: new Date(calendarRequestBody.start.dateTime).toUTCString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(calendarRequestBody.end.dateTime).toUTCString(),
          timeZone: 'UTC',
        },
      };

      await wiremock.addCalendarMapping(
        '/calendar/v3/calendars/primary/events',
        // calendarRequestBody,
        undefined,
        calendarResponseBody,
      );

      const testPrompt =
        'Get my last past assignment and create a calendar event for the date of the assignment and for 1.5hours. The Description of the calendar event should be the assignment intro.';

      const { finalResponse } = await routingAgent.askAndWaitForResponse(
        {
          prompt: testPrompt,
        },
        wiremock.contextId,
      );

      expect(finalResponse).toBeDefined();
      expect(finalResponse.length).toBeGreaterThan(0);
      expect(finalResponse.toLowerCase()).toContain('calendar event');
      expect(finalResponse.toLowerCase()).toContain('created');
      // expect(finalResponse.toLowerCase()).toContain(
      //   calendarResponseBody.summary.toLowerCase(),
      // );

      expect(
        await wiremock.countCalendarRequests(
          '/calendar/v3/calendars/primary/events',
          // calendarRequestBody,
          undefined,
        ),
      ).toBe(1);
    },
  );

  it.concurrent(
    'should handle German request for all assignments and create calendar entries',
    async ({ wiremock }) => {
      await wiremock.addMoodleLoginMapping('mock-token');

      await wiremock.addMoodleMapping(
        'core_webservice_get_site_info',
        mockUserInfo,
      );

      await wiremock.addMoodleMapping(
        'mod_assign_get_assignments',
        mockAssignments,
      );

      await wiremock.addCalendarMapping(
        '/create_calendar_event',
        undefined,
        {},
      );

      const testPrompt =
        'Hole mir alle Abgaben und erstelle je einen Kalendareintrag pro assignment';

      const { finalResponse } = await routingAgent.askAndWaitForResponse(
        {
          prompt: testPrompt,
        },
        wiremock.contextId,
      );

      expect(finalResponse).toBeDefined();
      expect(finalResponse.length).toBeGreaterThan(0);

      // The response should contain German keywords or English translations
      const responseLower = finalResponse.toLowerCase();
      expect(
        responseLower.includes('assignment') ||
          responseLower.includes('abgabe') ||
          responseLower.includes('aufgabe'),
      ).toBe(true);

      expect(
        responseLower.includes('calendar') ||
          responseLower.includes('kalender') ||
          responseLower.includes('termin'),
      ).toBe(true);

      expect(
        responseLower.includes('created') ||
          responseLower.includes('erstellt') ||
          responseLower.includes('angelegt'),
      ).toBe(true);

      // Verify that the moodle agent was called to get assignments
      expect(
        await wiremock.countMoodleRequests('mod_assign_get_assignments'),
      ).toBe(1);

      // // Verify that calendar events were created (one per assignment)
      // expect(await Wiremock.countCalendarRequests('/create_calendar_event')).toBe(
      //   3, // Based on mockAssignments, there are 3 assignments total
      // );
    },
  );
});
