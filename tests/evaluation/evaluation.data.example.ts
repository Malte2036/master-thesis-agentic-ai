import { EvaluationReportEntry } from '../report/report';

export const EXAMPLE_EVALUATION_TEST_DATA: EvaluationReportEntry[] = [
  // {
  //   id: 'case_example_000',
  //   task_type: 'example_task',
  //   input: 'What is the weather in Tokyo?',
  //   expected_output: 'The weather in Tokyo is sunny and 20 degrees Celsius.',
  //   expected_tool_calls: [
  //     {
  //       function: 'weather_agent.get_weather',
  //       args: { city: 'Tokyo' },
  //     },
  //   ],
  //   actual_output: 'I was not able to complete your request.',
  //   retrieval_context: [],
  //   trace: {
  //     contextId: 'example_context_id',
  //     question: 'What is the weather in Tokyo?',
  //     maxIterations: 10,
  //     agentTools: [],
  //     iterationHistory: [
  //       {
  //         iteration: 0,
  //         naturalLanguageThought: 'What is the weather in Tokyo?',
  //         structuredThought: {
  //           functionCalls: [],
  //           isFinished: true,
  //         },
  //       },
  //     ],
  //   },
  //   completion_time: 1000,
  //   token_cost: 1000,
  // },
];
