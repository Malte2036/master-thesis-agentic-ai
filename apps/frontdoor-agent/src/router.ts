import fetch from 'node-fetch';
import {
  AgentConfig,
  getAgentConfig,
  getAgentConfigs,
  getAgentUrl,
  generateSchemaDescription,
} from '@master-thesis-agentic-rag/agent-framework';
import { aiProvider } from '.';
import { z } from 'zod';

interface AgentResponse {
  agent: string;
  response: unknown;
}

const AgentCallSchema = z.object({
  agentName: z.string(),
  functionsToCall: z
    .array(
      z.object({
        functionName: z.string(),
        parameters: z.record(z.string(), z.unknown()),
      }),
    )
    .optional(),
});

const AgentCallsSchema = z.object({
  agentCalls: z.array(AgentCallSchema),
});

async function findRelevantAgent(question: string): Promise<{
  agent: AgentConfig;
  functions: {
    functionName: string;
    parameters: Record<string, unknown> | undefined;
  }[];
} | null> {
  const agents = JSON.stringify(getAgentConfigs(false));

  const prompt = `
  system:
  You are a helpful assistant that can help the user find the most relevant agents for their question.
  Only include agents that are relevant to the question.
  Only include the agent functions that are relevant to the questions and which are needed to answer the question.
  Drop functions that are not needed to answer the question.
  If there is no relevant agent or functions, accept that.
  
  Strict: Answer in raw json format.
  Strict: The AgentCallsSchemas is the schema of the json object you should return. Follow it strictly! Do not add any other properties. Do not return an toplevel array. The returned object contains an array of AgentCallSchemas under the key "agentCalls". Follow the schema strictly!

  AgentCallSchemas:
  ${generateSchemaDescription(AgentCallsSchema)}

  Available agents:
  ${agents}

  Question:
  ${question}
  `;

  console.log('Prompt is', prompt);
  const response = await aiProvider.generateText(prompt);
  console.log('Detected agent is', response);

  const jsonResponse = JSON.parse(response);

  if (jsonResponse === 'null') {
    return null;
  }

  const agentCalls = AgentCallsSchema.parse(jsonResponse);
  if (agentCalls.agentCalls.length === 0) {
    return null;
  }

  return {
    agent: getAgentConfig(agentCalls.agentCalls[0].agentName),
    functions: agentCalls.agentCalls[0].functionsToCall ?? [],
  };
}

export async function routeQuestion(
  question: string,
  moodle_token: string,
): Promise<AgentResponse> {
  const relevantAgent = await findRelevantAgent(question);
  if (!relevantAgent) {
    return {
      agent: 'default',
      response:
        'I could not determine which agent should handle your question. Please try rephrasing it.',
    };
  }

  if (relevantAgent.functions.length === 0) {
    return {
      agent: 'default',
      response:
        'The agent does not have any functions. Please try rephrasing it.',
    };
  }

  console.log('Agent is', relevantAgent);

  try {
    console.log(
      'Forwarding to',
      relevantAgent.agent.name,
      relevantAgent.functions[0].functionName,
    );

    const url = `http://localhost:${relevantAgent.agent.port}/${relevantAgent.functions[0].functionName}`;

    // Forward the question to the Moodle agent
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: question,
        moodle_token: moodle_token,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return {
      agent: relevantAgent.agent.name,
      response: data,
    };
  } catch (error) {
    console.error(
      `Error forwarding to ${relevantAgent.agent.name} agent:`,
      error,
    );
    return {
      agent: relevantAgent.agent.name,
      response: ` Sorry, there was an error processing your ${relevantAgent.agent.friendlyName}-related question.`,
    };
  }
}
