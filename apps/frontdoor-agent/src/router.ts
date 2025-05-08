import fetch from 'node-fetch';
import {
  AgentConfig,
  getAgentConfig,
  getAgentConfigs,
  generateSchemaDescription,
} from '@master-thesis-agentic-rag/agent-framework';
import { aiProvider } from '.';
import { z } from 'zod';

interface AgentResponse {
  agent: string;
  function: AgentCallFunction | undefined;
  response: unknown;
}

const AgentCallFunctionSchema = z.object({
  functionName: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

type AgentCallFunction = z.infer<typeof AgentCallFunctionSchema>;

const AgentCallSchema = z.object({
  agentName: z.string(),
  functionsToCall: z.array(AgentCallFunctionSchema).optional(),
});

const AgentCallsSchema = z.object({
  agentCalls: z.array(AgentCallSchema),
});

type AgentCalls = z.infer<typeof AgentCallsSchema>;

async function findRelevantAgent(question: string): Promise<{
  agent: AgentConfig;
  functions: AgentCallFunction[];
} | null> {
  const agents = JSON.stringify(getAgentConfigs(false));

  const prompt = `
  system:
  You are a smart assistant designed to select only the most relevant and immediately executable agent functions to answer the user's question.
  
  Guidelines:
  - ONLY include agents and functions that can be executed **now**, using information already available in the question.
  - OMIT functions that require the result of another function — even if that function is also listed in this response.
  - If a parameter is not known yet, DO NOT include the function depending on it in the current step.
  - Clearly identify which function(s) to call **first** to gather the necessary data.
  - If no agents or functions are relevant or ready to run, respond accordingly.
  
  Execution logic:
  - Treat the resolution as a **multi-step process**. After each function call, a **new prompt iteration** will be made.
  - DO NOT include functions for future steps in the current response.
  - If a function must be called to fetch parameters for a second function, return only the first one now.
  
  Available agents and their functions:
  ${agents}
  
  User question:
  ${question}
  `;

  const agentCalls = await aiProvider.generateText<AgentCalls>(
    prompt,
    undefined,
    AgentCallsSchema,
  );

  return {
    agent: getAgentConfig(agentCalls.agentCalls[0].agentName),
    functions: agentCalls.agentCalls[0].functionsToCall ?? [],
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

async function callAgent(
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
