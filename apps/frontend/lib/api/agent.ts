import { RouterProcess } from '@master-thesis-agentic-ai/types';

export type SSEMessage =
  | { type: 'connected'; data: string }
  | { type: 'iteration_update'; data: unknown }
  | {
      type: 'final_response';
      data: { finalResponse: string; process: RouterProcess };
    }
  | { type: 'error'; data: string };

export type SSECallbacks = {
  onConnected?: (message: string) => void;
  onUpdate?: (process: RouterProcess) => void;
  onFinalResponse?: (response: string, process: RouterProcess) => void;
  onError?: (error: string) => void;
  onComplete?: () => void;
};

const ROUTING_AGENT_URL =
  process.env.NEXT_PUBLIC_ROUTING_AGENT_URL || 'http://localhost:3000';

/**
 * Send a message to the agent and stream the response via SSE
 */
export const askAgent = async (
  message: string,
  callbacks: SSECallbacks,
  maxIterations = 5,
  previousContext?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<() => void> => {
  // Step 1: Send the message and get session ID
  const response = await fetch(`${ROUTING_AGENT_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: message,
      max_iterations: maxIterations,
      previous_context: previousContext || [],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`);
  }

  const { id: sessionId } = (await response.json()) as {
    id: string;
    status: string;
    message: string;
  };

  // Step 2: Connect to SSE stream
  const eventSource = new EventSource(
    `${ROUTING_AGENT_URL}/stream/${sessionId}`,
  );

  eventSource.onmessage = (event) => {
    try {
      const message: SSEMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'connected':
          callbacks.onConnected?.(message.data);
          break;

        case 'iteration_update':
          callbacks.onUpdate?.(message.data as RouterProcess);
          break;

        case 'final_response':
          callbacks.onFinalResponse?.(
            message.data.finalResponse,
            message.data.process,
          );
          eventSource.close();
          callbacks.onComplete?.();
          break;

        case 'error':
          callbacks.onError?.(message.data);
          eventSource.close();
          callbacks.onComplete?.();
          break;
      }
    } catch (error) {
      console.error('Error parsing SSE message:', error);
      callbacks.onError?.('Failed to parse server message');
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    callbacks.onError?.('Connection to server lost');
    eventSource.close();
    callbacks.onComplete?.();
  };

  // Return cleanup function
  return () => {
    eventSource.close();
  };
};
