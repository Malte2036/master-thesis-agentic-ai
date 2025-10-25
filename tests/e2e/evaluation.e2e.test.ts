import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import { Wiremock } from '@master-thesis-agentic-ai/test-utils';
import { mockAssignments, mockUserInfo } from './routing.e2e.test.mock';
import { EvaluationReport, writeEvaluationReport } from '../report/report';
import { E2E_EVALUATION_TEST_DATA } from './evaluation.e2e.test.data';

describe('E2E Routing Agent Test', () => {
  const ROUTING_AGENT_URL = 'http://localhost:3000';
  const MOODLE_AGENT_URL = 'http://localhost:1234';
  const CALENDAR_AGENT_URL = 'http://localhost:1235';
  let routingAgent: RoutingAgentClient;

  const report: EvaluationReport = {
    testEntries: [],
  };

  beforeAll(async () => {
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
  }, 30_000);

  afterAll(() => {
    writeEvaluationReport(report);
  });

  for (const testData of E2E_EVALUATION_TEST_DATA) {
    it(`should "${testData.input}"`, async () => {
      const finalResponse = await routingAgent.askAndWaitForResponse({
        prompt: testData.input,
      });

      report.testEntries.push({
        input: testData.input,
        actual_output: finalResponse,
        expected_output: testData.expected_output,
      });
    }, 30_000);
  }
});
