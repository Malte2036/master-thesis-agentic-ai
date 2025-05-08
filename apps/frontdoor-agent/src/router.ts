import {
  AgentConfig,
  getAgentConfig,
  getAgentConfigs,
} from '@master-thesis-agentic-rag/agent-framework';
import { aiProvider } from '.';
import {
  AgentCallFunction,
  AgentCalls,
  AgentCallsSchema,
  AgentResponse,
  callAgent,
} from './agent';
import { Prompt } from './prompt';

async function findRelevantAgent(question: string): Promise<{
  agent: AgentConfig;
  functions: AgentCallFunction[];
} | null> {
  const agents = getAgentConfigs(false);

  const prompt = Prompt.getFindRelevantAgentPrompt(agents, question);

  const agentCalls = await aiProvider.generateText<AgentCalls>(
    prompt,
    undefined,
    AgentCallsSchema,
  );

  // TODO: Allow multiple agents
  const firstAgentCall = agentCalls.agentCalls[0];
  return {
    agent: getAgentConfig(firstAgentCall.agentName),
    functions: firstAgentCall.functionsToCall ?? [],
  };
}

export async function routeQuestion(
  question: string,
  moodle_token: string,
): Promise<AgentResponse[]> {
  const relevantAgent = await findRelevantAgent(question);
  if (!relevantAgent) {
    return [
      {
        agent: 'default',
        response:
          'I could not determine which agent should handle your question. Please try rephrasing it.',
        function: undefined,
      },
    ];
  }

  if (relevantAgent.functions.length === 0) {
    return [
      {
        agent: 'default',
        response:
          'The agent does not have any functions. Please try rephrasing it.',
        function: undefined,
      },
    ];
  }

  console.log('Agent is', relevantAgent.agent.friendlyName);

  const responses = await Promise.all(
    relevantAgent.functions.map((agentFunction) =>
      callAgent(relevantAgent.agent, agentFunction, moodle_token),
    ),
  );

  return responses;
}
