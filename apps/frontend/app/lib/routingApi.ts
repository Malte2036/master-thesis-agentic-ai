const routingAgentUrl = 'http://localhost:3000/';

export const askRoutingAgent = async (
  prompt: string,
  router: 'legacy' | 'react',
  max_iterations: number,
  model: string,
) => {
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

  return response.json();
};
