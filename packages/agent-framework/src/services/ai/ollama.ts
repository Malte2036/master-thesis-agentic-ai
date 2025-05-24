import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
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
              content: `You are a JSON response generator. Your task is to generate a single valid JSON object that strictly follows the provided schema.

IMPORTANT RULES:
1. The response must be a single valid JSON object
2. Do not include any explanations, markdown, or text outside the JSON object
3. Do not include any comments or notes
4. Ensure all required fields from the schema are present
5. Ensure all values match their expected types
6. Do not add any fields not specified in the schema
7. The response must be parseable by JSON.parse()

The schema of the JSON object is:
${JSON.stringify(zodToJsonSchema(jsonSchema), null, 2)}`,
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
        options: jsonSchema
          ? {
              temperature: 0.1, // Lower temperature for more deterministic JSON output
              num_predict: 1024, // Ensure enough tokens for complete JSON
            }
          : undefined,
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
      // Clean the response content before parsing
      const cleanedContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      jsonResponse = JSON.parse(cleanedContent);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      console.error('Raw content:', content);
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
