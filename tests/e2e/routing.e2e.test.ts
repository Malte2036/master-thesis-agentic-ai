import { describe, it, expect, beforeAll } from 'vitest';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import { Wiremock } from '@master-thesis-agentic-ai/test-utils';
import { mockAssignments, mockUserInfo } from './routing.e2e.test.mock';

describe('E2E Routing Agent Test', () => {
  const ROUTING_AGENT_URL = 'http://localhost:3000';
  const MOODLE_AGENT_URL = 'http://localhost:1234';
  const CALENDAR_AGENT_URL = 'http://localhost:1235';
  let routingAgent: RoutingAgentClient;

  beforeAll(async () => {
    await Wiremock.reset();

    routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

    // Wait for services to be ready
    await routingAgent.waitForReady();
    await waitForService(
      `${MOODLE_AGENT_URL}/.well-known/agent.json`,
      'Moodle Agent',
    );
    await waitForService(
      `${CALENDAR_AGENT_URL}/.well-known/agent.json`,
      'Calendar Agent',
    );

    // All services are ready
  }, 60_000);

  it('should tell his capabilities', async () => {
    const testPrompt = 'What are your capabilities?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);

    expect(finalResponse.toLowerCase()).toContain('moodle');
    expect(finalResponse.toLowerCase()).toContain('course');
    expect(finalResponse.toLowerCase()).toContain('calendar');
  }, 60_000);

  it('should get a response to a question by using the moodle-agent', async () => {
    await Wiremock.addMoodleMapping(
      'core_webservice_get_site_info',
      mockUserInfo,
    );

    const testPrompt = 'Can you help me get my user information?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    // include sabrina student
    expect(finalResponse).toContain('Annika');
    expect(finalResponse).toContain('Schmidt');

    expect(
      await Wiremock.countMoodleRequests('core_webservice_get_site_info'),
    ).toBe(1);

    // Test completed successfully
  }, 60_000);

  it('should create a calendar event', async () => {
    await Wiremock.addCalendarMapping('/create_calendar_event', {});

    const testPrompt =
      'Create a calendar event with the name "Test Event" and the description "This is a test event" from 2025-10-22 to 2025-10-25.';
    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    expect(finalResponse.toLowerCase()).toContain('calendar event');
    expect(finalResponse.toLowerCase()).toContain('created');

    expect(await Wiremock.countCalendarRequests('/create_calendar_event')).toBe(
      1,
    );
  }, 60_000);

  it('should combine multiple agents', async () => {
    await Wiremock.addMoodleMapping(
      'core_webservice_get_site_info',
      mockUserInfo,
    );

    await Wiremock.addMoodleMapping(
      'mod_assign_get_assignments',
      mockAssignments,
    );

    const testPrompt =
      'Get my latest assignment and create a calendar event for it.';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    expect(finalResponse.toLowerCase()).toContain('assignment');
    expect(finalResponse.toLowerCase()).toContain('calendar event');
    expect(finalResponse.toLowerCase()).toContain('created');

    expect(await Wiremock.countCalendarRequests('/create_calendar_event')).toBe(
      1,
    );
  }, 120_000);
});
