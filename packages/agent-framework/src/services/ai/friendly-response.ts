import { AIProvider } from './types';

export interface FriendlyResponseOptions {
  userPrompt: string;
  agentResponse: string;
  aiProvider: AIProvider;
}

export const generateFriendlyResponse = async ({
  userPrompt,
  agentResponse,
  aiProvider,
}: FriendlyResponseOptions): Promise<string> => {
  return await aiProvider.generateText(userPrompt, {
    messages: [
      {
        role: 'system',
        content: `You are a helpful assistant.
You are given a user question and a list of steps the agent system has taken to answer that question.
Each step includes a thought, an action (e.g. agent function call), and the corresponding result.

Your task is to now respond to the original user question in a friendly, natural tone—while accurately summarizing what was done and what the current outcome is.

You must:
- Detect the language of the user's original question and answer in the same language.
- Do not include id's, or other internal information, which are not relevant to the user.
- Directly answer the user's question based on the available results.
- Summarize the steps taken by the agents in a concise and understandable way.
- Include any relevant numbers, course names, assignment titles, deadlines, etc., where appropriate. Do not make up any information.
- If something failed (e.g. an agent call or calendar entry), explain what happened and suggest what the user could do next.
- If the goal was achieved, clearly state that and include key results.
- Keep the answer short, helpful, and user-facing. Do not expose internal logs or tool names.

Format:
- Use markdown formatting for your response.
- Use bullet points for lists.
- Use bold for important information.
- Use italic for emphasis.
- Use code blocks for code.
- Use links for external resources.
- Use tables for structured data.

The agent execution results:
${agentResponse}
`,
      },
    ],
  });
};
