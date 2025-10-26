/* eslint-disable no-console */
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import {
  EvaluationReport,
  EvaluationReportEntry,
  writeEvaluationReport,
} from '../report/report';
import { E2E_EVALUATION_TEST_DATA } from './evaluation.data';

const ROUTING_AGENT_URL = 'http://localhost:3000';
const MOODLE_AGENT_URL = 'http://localhost:1234';
const CALENDAR_AGENT_URL = 'http://localhost:1235';

const report: EvaluationReport = {
  testEntries: [],
};

async function runEvaluationTests() {
  console.log('🚀 Starting E2E Evaluation Tests...');

  try {
    // Initialize routing agent
    const routingAgent = new RoutingAgentClient(ROUTING_AGENT_URL);

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

    console.log('✅ All services are ready');

    console.log('🔄 Running evaluation tests in batches...');

    // Run tests in batches to prevent SSE timeout issues
    const BATCH_SIZE = 1;
    const BATCH_DELAY = 2000; // 2 seconds between batches
    const results: EvaluationReportEntry[] = [];

    for (let i = 0; i < E2E_EVALUATION_TEST_DATA.length; i += BATCH_SIZE) {
      const batch = E2E_EVALUATION_TEST_DATA.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(
        E2E_EVALUATION_TEST_DATA.length / BATCH_SIZE,
      );

      console.log(
        `🔄 Running batch ${batchNumber}/${totalBatches} (${batch.length} tests)...`,
      );

      const batchPromises = batch.map(async (testData, batchIndex) => {
        const globalIndex = i + batchIndex;
        console.log(
          `📝 Running test ${globalIndex + 1}/${E2E_EVALUATION_TEST_DATA.length}: "${testData.input}"`,
        );

        const startTime = Date.now();

        try {
          const finalResponse = await routingAgent.askAndWaitForResponse(
            {
              prompt: testData.input,
            },
            undefined,
            180000,
          ); // 3 minutes timeout

          const endTime = Date.now();
          const completionTime = (endTime - startTime) / 1000; // Convert to seconds

          console.log(
            `✅ Test ${globalIndex + 1} completed in ${completionTime.toFixed(2)}s`,
          );

          return {
            input: testData.input,
            actual_output: finalResponse,
            retrieval_context: testData.retrieval_context,
            expected_output: testData.expected_output,
            completion_time: completionTime,
          };
        } catch (error) {
          const endTime = Date.now();
          const completionTime = (endTime - startTime) / 1000; // Convert to seconds

          console.error(
            `❌ Test ${globalIndex + 1} failed after ${completionTime.toFixed(2)}s:`,
            error,
          );
          return {
            input: testData.input,
            actual_output: `ERROR: ${error}`,
            expected_output: testData.expected_output,
            retrieval_context: testData.retrieval_context,
            completion_time: completionTime,
          };
        }
      });

      const batchResults: EvaluationReportEntry[] =
        await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < E2E_EVALUATION_TEST_DATA.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }
    report.testEntries.push(...results);

    console.log('📊 Writing evaluation report...');
    writeEvaluationReport(report);

    console.log('🎉 All evaluation tests completed successfully!');

    console.log(`📈 Total tests run: ${results.length}`);
  } catch (error) {
    console.error('❌ Evaluation tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
runEvaluationTests();
