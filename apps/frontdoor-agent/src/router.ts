import fetch from 'node-fetch';

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
      const urlParams = new URLSearchParams();
      urlParams.set('prompt', question);
      urlParams.set('moodle_token', moodle_token);

      const url = `http://localhost:3003/courses?${urlParams.toString()}`;

      // Forward the question to the Moodle agent
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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
