import {
  AgentCard,
  AgentClient,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { AgentTool, AgentToolSchema } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';

export interface GetAgentsResult {
  agentClients: AgentClient[];
  agentTools: AgentTool[];
}

/**
 * Get available agents from URLs and create agent tools
 */
export async function getAgents(
  logger: Logger,
  agentUrls: string[],
): Promise<GetAgentsResult> {
  // Get available agents
  const availableAgents = await Promise.all(
    agentUrls.map((url) => AgentClient.createFromUrl(logger, url)),
  );

  // Create agent tools from cards
  const agentTools = await Promise.all(
    availableAgents.map((agent) =>
      agent.getAgentCard().then((agentCard: AgentCard) =>
        AgentToolSchema.parse({
          name: agentCard.name,
          description: agentCard.description,
          args: {
            prompt: {
              type: 'string',
              description: `
    A clear and specific instruction describing what you want this agent to accomplish.
    This should include the *goal*, *context*, and *expected output type* (e.g., summary, list, calendar event, etc.).
    Example: "List all assignments due next week for my course 'Digital Health'."`,
              required: true,
            },
            parameters: {
              type: 'string',
              description: `
    Structured or natural language parameters that provide additional context or control input for the agent.
    Prefer structured data (e.g., JSON) when possible — e.g.:
    {
      "courseId": "CS-401",
      "includePastAssignments": false
    }
    If you don't know all exact parameters, describe them naturally in text (the agent will infer them).`,
              required: false,
            },
          },
        }),
      ),
    ),
  );

  logger.log(chalk.magenta('Available agents:'));
  logger.table(agentTools);

  return {
    agentClients: availableAgents,
    agentTools,
  };
}
