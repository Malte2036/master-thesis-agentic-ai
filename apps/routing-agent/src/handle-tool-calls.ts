import { AgentClient, Logger } from '@master-thesis-agentic-ai/agent-framework';

export const handleToolCalls = async (
  logger: Logger,
  functionCalls: any[],
  agents: AgentClient[],
  contextId: string,
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
    const agentClient = agents.find(
      (agent) => agent.name === parsedDecision.function,
    );
    if (!agentClient) {
      logger.log(`No agent found for function: ${parsedDecision.function}`);
      return {
        message: `No agent found for function: ${parsedDecision.function}`,
        process: undefined,
      };
    }

    try {
      return await agentClient.call(
        `${parsedDecision.args['prompt']}; We want to call the agent because: ${parsedDecision.args['reason']}`,
        contextId,
      );
    } catch (error) {
      logger.log(`Error calling agent ${parsedDecision.function}:`, error);
      return { message: `Error calling agent: ${error}`, process: undefined };
    }
  });

  // Wait for all agent calls to complete
  const results = await Promise.all(agentPromises);

  logger.log('All agent calls completed:', results);

  return results.map((r) => r.message);
};
