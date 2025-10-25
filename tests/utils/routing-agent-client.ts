import EventSource from 'eventsource';

export interface RoutingAgentRequest {
  prompt: string;
  max_iterations?: number;
}

export interface RoutingAgentResponse {
  id: string;
  status: string;
  message: string;
}

export interface SSEMessage {
  type: string;
  data: {
    finalResponse?: string;
    [key: string]: unknown;
  };
}

export class RoutingAgentClient {
  private baseUrl: string;

  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
  }

  /**
   * Send a request to the routing agent and get the immediate response
   */
  async ask(request: RoutingAgentRequest): Promise<RoutingAgentResponse> {
    const response = await fetch(`${this.baseUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        max_iterations: 5,
        ...request,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Send a request and wait for the final response via SSE
   */
  async askAndWaitForResponse(
    request: RoutingAgentRequest,
    timeout = 120000,
  ): Promise<string> {
    console.log('request', request);
    const { id } = await this.ask(request);
    console.log('Connection to stream:', `${this.baseUrl}/stream/${id}`);

    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(`${this.baseUrl}/stream/${id}`);
      const timeoutId: NodeJS.Timeout = setTimeout(() => {
        cleanup();
        reject(new Error('SSE stream timeout - no final response received'));
      }, timeout);

      const cleanup = () => {
        eventSource.close();
        if (timeoutId) clearTimeout(timeoutId);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data);

          if (data.type === 'final_response') {
            cleanup();
            console.log(data.data.finalResponse);
            resolve(data.data.finalResponse || '');
          } else if (data.type === 'error') {
            cleanup();
            reject(new Error(`SSE Error: ${data.data}`));
          }
        } catch {
          // Error parsing SSE data
        }
      };

      eventSource.onerror = () => {
        cleanup();
        reject(new Error('SSE connection failed'));
      };

      eventSource.onopen = () => {
        // SSE connection opened
      };
    });
  }

  /**
   * Get the health status of the routing agent
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Test the routing agent with a simple request
   */
  async test(): Promise<string> {
    const response = await fetch(`${this.baseUrl}/test`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }

  /**
   * Get available models
   */
  async getModels(): Promise<unknown> {
    const response = await fetch(`${this.baseUrl}/models`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  /**
   * Wait for the routing agent to be ready
   */
  async waitForReady(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await this.healthCheck()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    throw new Error(`❌ Routing Agent not ready after ${timeout}ms`);
  }
}

/**
 * Convenience function to quickly ask the routing agent and get the final response
 */
export async function askRoutingAgent(
  prompt: string,
  options: Partial<RoutingAgentRequest> = {},
  baseUrl = 'http://localhost:3000',
): Promise<string> {
  const client = new RoutingAgentClient(baseUrl);
  return client.askAndWaitForResponse({ prompt, ...options });
}

/**
 * Convenience function to just send a request without waiting for response
 */
export async function sendToRoutingAgent(
  prompt: string,
  options: Partial<RoutingAgentRequest> = {},
  baseUrl = 'http://localhost:3000',
): Promise<RoutingAgentResponse> {
  const client = new RoutingAgentClient(baseUrl);
  return client.ask({ prompt, ...options });
}
