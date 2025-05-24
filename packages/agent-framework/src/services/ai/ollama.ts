import { z } from 'zod';
import { generateSchemaDescription } from '../../utils/schema';
import { AIProvider, AIGenerateTextOptions } from './types';

export class OllamaProvider implements AIProvider {
  private readonly baseUrl: string;
  public readonly model: string;

  constructor(options?: { baseUrl?: string; model?: string }) {
    this.baseUrl = options?.baseUrl || 'http://localhost:11434';
    this.model = options?.model || 'mistral:instruct';
  }

  async generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T> {
    const messages = [
      ...(jsonSchema
        ? [
            {
              role: 'system' as const,
              content: `You are a JSON response generator.
              The response must be a single valid JSON object that strictly follows the provided schema.
              The schema of the JSON object is:
              ${generateSchemaDescription(jsonSchema)}`,
            },
          ]
        : []),
      ...(options?.messages || []),
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        stream: false,
        format: jsonSchema ? 'json' : undefined,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.message?.content;

    if (!content) {
      throw new Error('No response from Ollama');
    }

    if (!jsonSchema) {
      return content as T;
    }

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response format');
    }

    const parsedResponse = jsonSchema.safeParse(jsonResponse);
    if (parsedResponse.success === false) {
      console.error('Invalid JSON response', content, parsedResponse.error);
      throw new Error('Invalid JSON response');
    }

    return parsedResponse.data;
  }
}
