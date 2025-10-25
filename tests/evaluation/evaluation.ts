import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import { EvaluationReport, writeEvaluationReport } from '../report/report';
import { E2E_EVALUATION_TEST_DATA } from './evaluation.data';

const ROUTING_AGENT_URL = 'http://localhost:3000';
const MOODLE_AGENT_URL = 'http://localhost:1234';
const CALENDAR_AGENT_URL = 'http://localhost:1235';

const report: EvaluationReport = {
  testEntries: [],
};

async function runEvaluationTests() {
  // eslint-disable-next-line no-console
  console.log('🚀 Starting E2E Evaluation Tests...');

  try {
    // Initialize routing agent
    const routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

    // eslint-disable-next-line no-console
    console.log('⏳ Waiting for services to be ready...');

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

    // eslint-disable-next-line no-console
    console.log('✅ All services are ready');
    // eslint-disable-next-line no-console
    console.log('🔄 Running evaluation tests concurrently...');

    // Run all tests concurrently
    const testPromises = E2E_EVALUATION_TEST_DATA.map(
      async (testData, index) => {
        // eslint-disable-next-line no-console
        console.log(
          `📝 Running test ${index + 1}/${E2E_EVALUATION_TEST_DATA.length}: "${testData.input}"`,
        );

        const finalResponse = await routingAgent.askAndWaitForResponse({
          prompt: testData.input,
        });

        // eslint-disable-next-line no-console
        console.log(`✅ Test ${index + 1} completed`);

        return {
          input: testData.input,
          actual_output: finalResponse,
          expected_output: testData.expected_output,
        };
      },
    );

    const results = await Promise.all(testPromises);
    report.testEntries.push(...results);

    // eslint-disable-next-line no-console
    console.log('📊 Writing evaluation report...');
    writeEvaluationReport(report);

    // eslint-disable-next-line no-console
    console.log('🎉 All evaluation tests completed successfully!');
    // eslint-disable-next-line no-console
    console.log(`📈 Total tests run: ${results.length}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Evaluation tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
runEvaluationTests();
