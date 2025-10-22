import { describe, it, expect, beforeAll } from 'vitest';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import {
  addMoodleMapping,
  resetMappings,
} from '@master-thesis-agentic-ai/test-utils';

describe('E2E Routing Agent Test', () => {
  const ROUTING_AGENT_URL = 'http://localhost:3000';
  const MOODLE_AGENT_URL = 'http://localhost:1234';
  let routingAgent: RoutingAgentClient;

  beforeAll(async () => {
    await resetMappings();

    routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

    // Wait for services to be ready
    await routingAgent.waitForReady();
    await waitForService(
      `${MOODLE_AGENT_URL}/.well-known/agent.json`,
      'Moodle Agent',
    );

    // All services are ready
  }, 60_000);

  it('should tell his capabilities', async () => {
    const testPrompt = 'What are your capabilities?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    console.log(finalResponse);

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);

    expect(finalResponse.toLowerCase()).toContain('moodle');
    expect(finalResponse.toLowerCase()).toContain('course');
    expect(finalResponse.toLowerCase()).toContain('calendar');
  }, 60_000);

  it.only('should get a response to a question by using the moodle-agent', async () => {
    await addMoodleMapping('core_webservice_get_site_info', {
      userid: 90,
      username: 'annika.schmidt@example.com',
      firstname: 'Annika',
      lastname: 'Schmidt',
      siteurl: 'https://example.com',
      userpictureurl: 'https://example.com/user.png',
      userlang: 'de',
    });

    const testPrompt = 'Can you help me get my user information?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    // include sabrina student
    expect(finalResponse).toContain('Annika');
    expect(finalResponse).toContain('Schmidt');

    // Test completed successfully
  }, 60_000);

  // it('should combine multiple agents', async () => {
  //   const testPrompt =
  //     'Get my latest assignment and create a calendar event for it.';

  //   const finalResponse = await routingAgent.askAndWaitForResponse({
  //     prompt: testPrompt,
  //   });

  //   expect(finalResponse).toBeDefined();
  //   expect(finalResponse.length).toBeGreaterThan(0);
  //   expect(finalResponse.toLowerCase()).toContain('assignment');
  //   expect(finalResponse.toLowerCase()).toContain('calendar event');
  //   expect(finalResponse.toLowerCase()).toContain('created');
  // }, 120_000);
});
