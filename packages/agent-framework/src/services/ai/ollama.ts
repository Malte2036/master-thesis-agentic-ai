import { z } from 'zod/v4';
import { AIProvider, AIGenerateTextOptions } from './types';
import { Ollama } from 'ollama';

export class OllamaProvider implements AIProvider {
  private readonly client: Ollama;
  public readonly model: string;

  constructor(options?: { baseUrl?: string; model?: string }) {
    this.client = new Ollama({
      host: options?.baseUrl || 'http://localhost:11434',
    });
    this.model = options?.model || 'mistral:instruct';
  }

  private async makeApiCall(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    isJson = false,
    jsonSchema?: z.ZodSchema,
  ) {
    const response = await this.client.chat({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
      format: isJson && jsonSchema ? z.toJSONSchema(jsonSchema) : undefined,
    });

    if (!response.message?.content) {
      throw new Error('No response from Ollama');
    }

    return response.message.content;
  }

  async generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
  ): Promise<string> {
    const messages = [
      ...(options?.messages || []),
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    return this.makeApiCall(messages);
  }

  async generateJson<T>(
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
${JSON.stringify(z.toJSONSchema(jsonSchema), null, 2)}`,
            },
          ]
        : []),
      ...(options?.messages || []),
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const content = await this.makeApiCall(messages, true, jsonSchema);

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

    return parsedResponse.data as T;
  }
}
