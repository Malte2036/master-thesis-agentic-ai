import { describe, it, expect, beforeAll } from 'vitest';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';

describe('E2E Routing Agent Test', () => {
  const ROUTING_AGENT_URL = 'http://localhost:3000';
  const MOODLE_AGENT_URL = 'http://localhost:1234';
  let routingAgent: RoutingAgentClient;

  beforeAll(async () => {
    routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

    // Wait for services to be ready
    await routingAgent.waitForReady();
    await waitForService(
      `${MOODLE_AGENT_URL}/.well-known/agent.json`,
      'Moodle Agent',
    );

    // All services are ready
  }, 60_000);

  it('should get a response to a question by using the moodle-agent', async () => {
    const testPrompt = 'Can you help me get my user information?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    // include sabrina student
    expect(finalResponse).toContain('Sabrina');
    expect(finalResponse).toContain('Studentin');
    expect(finalResponse).toContain('student');

    // Test completed successfully
  }, 60_000);

  it('should get a response to a question by using the moodle-agent', async () => {
    const testPrompt = 'What are my assignments?';

    const finalResponse = await routingAgent.askAndWaitForResponse({
      prompt: testPrompt,
    });

    expect(finalResponse).toBeDefined();
    expect(finalResponse.length).toBeGreaterThan(0);
    expect(finalResponse).toContain('Assignments');
    expect(finalResponse).toContain('due soon');
    expect(finalResponse).toContain('due date');
    expect(finalResponse).toContain('grade');
    expect(finalResponse).toContain('timemodified');
  }, 60_000);
});
