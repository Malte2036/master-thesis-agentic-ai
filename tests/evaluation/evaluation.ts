/* eslint-disable no-console */
import {
  EvaluationReport,
  EvaluationReportEntry,
} from '@master-thesis-agentic-ai/types';
import { RoutingAgentClient } from '../utils/routing-agent-client';
import { waitForService } from '../utils/wait-for-service';
import { E2E_EVALUATION_TEST_DATA } from './evaluation.data';
import {
  writeEvaluationReport,
  getGitHash,
  getTimestamp,
} from '../report/report';

const ROUTING_AGENT_URL = 'http://localhost:3000';
const MOODLE_AGENT_URL = 'http://localhost:1234';
const CALENDAR_AGENT_URL = 'http://localhost:1235';

const TIMEOUT = 360000;
// Run tests in batches
const BATCH_SIZE = 5; // 10;
const BATCH_DELAY = 2000; // 2 seconds between batches

const report: EvaluationReport = {
  gitHash: getGitHash(),
  timestamp: getTimestamp(),
  testEntries: [],
};

async function runEvaluationTests() {
  console.log('🚀 Starting E2E Evaluation Tests...');

  // Write empty report at the beginning with hash and timestamp
  console.log('📊 Writing initial empty report...');
  writeEvaluationReport(report, false);

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

      const batchResults: EvaluationReportEntry[] = await Promise.all(
        batch.map(async (testData) => {
          console.log(
            `📝 Running test ${testData.id}/${E2E_EVALUATION_TEST_DATA.length}: "${testData.input}"`,
          );

          const startTime = Date.now();

          try {
            const { finalResponse, process } =
              await routingAgent.askAndWaitForResponse(
                {
                  prompt: testData.input,
                },
                `test-${testData.id}`,
                TIMEOUT,
              );

            const endTime = Date.now();
            const completionTime = (endTime - startTime) / 1000; // Convert to seconds

            console.log(
              `✅ Test ${testData.id} completed in ${completionTime.toFixed(2)}s`,
            );

            // console.log(
            //   `📝 Test ${testData.id} trace:`,
            //   JSON.stringify(trace, null, 2),
            // );

            return {
              ...testData,
              actual_output: finalResponse,
              retrieval_context: [],
              completion_time: completionTime,
              trace: process,
              token_cost: 0,
            } satisfies EvaluationReportEntry;
          } catch (error) {
            const endTime = Date.now();
            const completionTime = (endTime - startTime) / 1000; // Convert to seconds

            console.error(
              `❌ Test ${testData.id} failed after ${completionTime.toFixed(2)}s:`,
              error,
            );
            return {
              ...testData,
              actual_output: `ERROR: ${error}`,
              retrieval_context: [],
              completion_time: completionTime,
              trace: undefined,
              token_cost: 0,
            } satisfies EvaluationReportEntry;
          }
        }),
      );

      results.push(...batchResults);
      report.testEntries.push(...batchResults);

      // Write report after each batch to ensure progress is saved
      console.log('📊 Writing evaluation report...');
      writeEvaluationReport(report);

      // Add delay between batches (except for the last batch)
      if (i + BATCH_SIZE < E2E_EVALUATION_TEST_DATA.length) {
        console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      }
    }

    console.log('🎉 All evaluation tests completed successfully!');

    console.log(`📈 Total tests run: ${results.length}`);
  } catch (error) {
    console.error('❌ Evaluation tests failed:', error);
    process.exit(1);
  }
}

// Run the tests
runEvaluationTests();
