import { AgentConfig } from '@master-thesis-agentic-rag/agent-framework';
import { z } from 'zod';

export interface AgentResponse {
  agent: string;
  function: AgentCallFunction | undefined;
  response: unknown;
}

export const AgentCallFunctionSchema = z.object({
  functionName: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type AgentCallFunction = z.infer<typeof AgentCallFunctionSchema>;

export const AgentCallSchema = z.object({
  agentName: z.string(),
  functionsToCall: z.array(AgentCallFunctionSchema).optional(),
});

export const AgentCallsSchema = z.object({
  agentCalls: z.array(AgentCallSchema),
});

export type AgentCalls = z.infer<typeof AgentCallsSchema>;

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
