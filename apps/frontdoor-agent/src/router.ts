import fetch from 'node-fetch';
import { getAgentUrl } from '@master-thesis-agentic-rag/agent-framework';

interface AgentResponse {
  agent: string;
  response: unknown;
}

export async function routeQuestion(
  question: string,
  moodle_token: string,
): Promise<AgentResponse> {
  // Convert question to lowercase for case-insensitive matching
  const lowerQuestion = question.toLowerCase();

  // Check for Moodle-related keywords
  if (lowerQuestion.includes('moodle') || lowerQuestion.includes('kurs')) {
    try {
      const url = `${getAgentUrl('moodle-agent')}/courses`;

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
        agent: 'moodle',
        response: data,
      };
    } catch (error) {
      console.error('Error forwarding to Moodle agent:', error);
      return {
        agent: 'moodle',
        response:
          'Sorry, there was an error processing your Moodle-related question.',
      };
    }
  }

  // Default response if no specific agent matches
  return {
    agent: 'default',
    response:
      'I could not determine which agent should handle your question. Please try rephrasing it.',
  };
}
