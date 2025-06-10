const routingAgentUrl = 'http://localhost:3000/';

interface RoutingAgentResponse {
  id: string;
  status: string;
  message: string;
}

export const askRoutingAgent = async (
  prompt: string,
  router: 'legacy' | 'react',
  max_iterations: number,
  model: string,
): Promise<RoutingAgentResponse> => {
  const url = new URL(routingAgentUrl);
  url.pathname = '/ask';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      router,
      max_iterations,
      model,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
