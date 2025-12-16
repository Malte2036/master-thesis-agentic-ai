/* eslint-disable no-console */
import { RouterProcess } from '@master-thesis-agentic-ai/types';
import EventSource from 'eventsource';

export interface RoutingAgentRequest {
  prompt: string;
  max_iterations?: number;
  testId?: string;
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
  async ask(
    request: RoutingAgentRequest,
    testId?: string,
  ): Promise<RoutingAgentResponse> {
    const response = await fetch(`${this.baseUrl}/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-test-id': testId,
      },
      body: JSON.stringify({
        max_iterations: 10,
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
    testId: string | undefined,
    timeout = 180000,
    maxRetries = 2,
  ): Promise<{ finalResponse: string; process: RouterProcess }> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(
            `🔄 Retry attempt ${attempt}/${maxRetries} for request: ${request.prompt.substring(0, 50)}...`,
          );
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
        }

        console.log('request', request);
        const { id } = await this.ask(request, testId);
        console.log('Connection to stream:', `${this.baseUrl}/stream/${id}`);

        return new Promise((resolve, reject) => {
          const eventSource = new EventSource(`${this.baseUrl}/stream/${id}`);
          const timeoutId: NodeJS.Timeout = setTimeout(() => {
            cleanup();
            reject(
              new Error(
                `SSE stream timeout after ${timeout}ms - no final response received`,
              ),
            );
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
                console.log('✅ Received final response');
                resolve({
                  finalResponse: data.data.finalResponse || '',
                  process: data.data.process as RouterProcess | undefined,
                });
              } else if (data.type === 'error') {
                cleanup();
                reject(new Error(`SSE Error: ${data.data}`));
              }
            } catch (parseError) {
              console.warn('⚠️ Failed to parse SSE message:', parseError);
            }
          };

          eventSource.onerror = (error) => {
            cleanup();
            reject(new Error(`SSE connection failed: ${error}`));
          };

          eventSource.onopen = () => {
            console.log('🔗 SSE connection opened');
          };
        });
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt + 1} failed:`, error);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
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
