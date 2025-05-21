import {
  AgentCall,
  AgentCallFunction,
  AgentCalls,
  AgentConfig,
  AgentResponse,
  getAgentConfig,
} from '@master-thesis-agentic-rag/agent-framework';

export async function callAgentsInParallel(
  agentCalls: AgentCalls[],
  moodle_token: string,
  remainingCalls: number,
) {
  if (remainingCalls < 0) {
    return [
      {
        agent: 'default',
        response:
          'Maximum number of LLM calls reached. Please try rephrasing your question.',
        function: undefined,
      },
    ];
  }

  const flattenedAgentCalls = agentCalls.flatMap((agentCall) =>
    agentCall.agentCalls?.map((agentCall: AgentCall) => ({
      agent: getAgentConfig(agentCall.agentName),
      functions: agentCall.functionsToCall ?? [],
    })),
  );

  const validAgents = flattenedAgentCalls.filter(
    (agent) => agent && agent.functions && agent.functions.length > 0,
  );

  if (validAgents.length === 0) {
    return [
      {
        agent: 'default',
        response:
          'None of the selected agents have any functions. Please try rephrasing your question.',
        function: undefined,
      },
    ];
  }

  console.log(
    'Processing agents:',
    validAgents.map((a) => a?.agent?.friendlyName).join(', '),
  );

  return await Promise.all(
    validAgents.flatMap((agent) =>
      agent?.functions.map((agentFunction: AgentCallFunction) =>
        callAgent(agent.agent, agentFunction, moodle_token),
      ),
    ),
  );
}

export async function callAgent(
  agent: AgentConfig,
  agentFunction: AgentCallFunction,
  moodle_token: string,
): Promise<AgentResponse> {
  try {
    console.log('Forwarding to', agent.name, agentFunction.functionName);

    const url = `http://localhost:${agent.port}/${agentFunction.functionName}`;

    // Forward the question to the Moodle agent
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        moodle_token: moodle_token,
        ...agentFunction.parameters,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      agent: agent.name,
      response: data,
      function: agentFunction,
    };
  } catch (error) {
    console.error(`Error forwarding to ${agent.name} agent:`, error);
    return {
      agent: agent.name,
      response: `Sorry, there was an error processing your ${agent.friendlyName}-related question.`,
      function: agentFunction,
    };
  }
}
