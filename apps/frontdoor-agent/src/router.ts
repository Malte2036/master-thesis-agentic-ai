import {
  createAIProvider,
  getAgentConfig,
  getAgentConfigs,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  AgentCalls,
  AgentCallsSchema,
  AgentResponse,
  callAgent,
} from './agent';
import { Prompt } from './prompt';

const aiProvider = createAIProvider();

async function findRelevantAgent(
  question: string,
  intermediateAnswer?: string,
): Promise<AgentCalls> {
  const agents = getAgentConfigs(false);

  const systemPrompt = Prompt.getFindRelevantAgentPrompt(
    agents,
    intermediateAnswer,
  );

  return await aiProvider.generateText<AgentCalls>(
    question,
    systemPrompt,
    AgentCallsSchema,
  );
}

async function generateAnswer(
  question: string,
  intermediateAnswer?: string,
): Promise<AgentResponse[]> {
  const prompt = Prompt.getGenerateAnswerPrompt(question, intermediateAnswer);

  return await aiProvider.generateText<AgentResponse[]>(
    prompt,
    undefined,
    AgentCallsSchema,
  );
}

async function handleQuestion(
  question: string,
  moodle_token: string,
  remainingCalls: number,
  intermediateAnswer?: string,
): Promise<AgentResponse[]> {
  console.log('--------------------------------');
  console.log('Iteration', remainingCalls);
  console.log('--------------------------------');

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

  const response = await findRelevantAgent(question, intermediateAnswer);

  if (!response) {
    return [
      {
        agent: 'default',
        response:
          'I could not determine which agent should handle your question. Please try rephrasing it.',
        function: undefined,
      },
    ];
  }

  if (response.answer && response.agentCalls.length === 0) {
    console.log('Finished with answer', response.answer);
    return [
      {
        agent: 'default',
        response: response.answer,
        function: undefined,
      },
    ];
  }

  // TODO: Allow multiple agents
  const firstAgentCall = response.agentCalls[0];
  const relevantAgent = {
    agent: getAgentConfig(firstAgentCall.agentName),
    functions: firstAgentCall.functionsToCall ?? [],
  };

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

  // If this was the last call, return the responses
  if (remainingCalls === 0) {
    const answer = await generateAnswer(question, JSON.stringify(responses));
    console.log('Answer after last iteration', answer);
    return answer;
  }

  intermediateAnswer += `Iteration ${remainingCalls}: ${JSON.stringify(responses)}`;

  // Recursively handle the next iteration with the current response
  return handleQuestion(
    question,
    moodle_token,
    remainingCalls - 1,
    intermediateAnswer,
  );
}

export async function routeQuestion(
  question: string,
  moodle_token: string,
): Promise<AgentResponse[]> {
  return handleQuestion(question, moodle_token, 3);
}
