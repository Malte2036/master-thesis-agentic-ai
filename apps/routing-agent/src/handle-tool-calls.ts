import { AgentClient, Logger } from '@master-thesis-agentic-ai/agent-framework';

export const handleToolCalls = async (
  logger: Logger,
  functionCalls: any[],
  agents: { [key: string]: AgentClient },
): Promise<any[]> => {
  functionCalls = functionCalls.map((call) => ({
    ...call,
    function: call.function.split('/')[0],
  }));

  logger.log(
    'Calling tools in parallel:',
    functionCalls.map((call) => call.function),
  );

  const parsedDecision = functionCalls[0];

  if (
    !parsedDecision.args['prompt'] ||
    typeof parsedDecision.args['prompt'] !== 'string'
  ) {
    logger.log('No prompt was provided');
    return [
      {
        content: [
          {
            type: 'text',
            text: 'No prompt was provided',
          },
        ],
      },
    ];
  }

  const agentClient = agents[parsedDecision.function];
  let agentResponse: any = '';

  if (agentClient) {
    agentResponse = await agentClient.call(
      `${parsedDecision.args['prompt']}; We want to call the agent because: ${parsedDecision.args['reason']}`,
    );
  } else {
    logger.log('No agent were called');
  }

  logger.log('Result from agent:', agentResponse);

  const textResponse =
    typeof agentResponse === 'object' && agentResponse.response
      ? agentResponse.response
      : agentResponse;

  return [
    {
      content: [
        {
          type: 'text',
          text: String(textResponse),
        },
      ],
    },
  ];
};
