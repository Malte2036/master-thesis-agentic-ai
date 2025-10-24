import { AgentClient, Logger } from '@master-thesis-agentic-ai/agent-framework';

export const handleToolCalls = async (
  logger: Logger,
  functionCalls: any[],
  agents: AgentClient[],
): Promise<string[]> => {
  functionCalls = functionCalls.map((call) => ({
    ...call,
    function: call.function.split('/')[0],
  }));

  logger.log(
    'Calling tools in parallel:',
    functionCalls.map((call) => call.function),
  );

  // Process all function calls in parallel
  const agentPromises = functionCalls.map(async (parsedDecision) => {
    if (
      !parsedDecision.args['prompt'] ||
      typeof parsedDecision.args['prompt'] !== 'string'
    ) {
      logger.log(
        'No prompt was provided for function:',
        parsedDecision.function,
      );
      return 'No prompt was provided';
    }

    const agentClient = agents.find(
      (agent) => agent.name === parsedDecision.function,
    );
    if (!agentClient) {
      logger.log(`No agent found for function: ${parsedDecision.function}`);
      return `No agent found for function: ${parsedDecision.function}`;
    }
    let agentResponse: any = '';

    try {
      agentResponse = await agentClient.call(
        `${parsedDecision.args['prompt']}; We want to call the agent because: ${parsedDecision.args['reason']}`,
      );
      logger.log(
        `Result from agent ${parsedDecision.function}:`,
        agentResponse,
      );
    } catch (error) {
      logger.log(`Error calling agent ${parsedDecision.function}:`, error);
      agentResponse = `Error calling agent: ${error}`;
    }

    const textResponse =
      typeof agentResponse === 'object' && agentResponse.response
        ? agentResponse.response
        : agentResponse;

    return String(textResponse);
  });

  // Wait for all agent calls to complete
  const results = await Promise.all(agentPromises);

  logger.log('All agent calls completed:', results);

  return results;
};
