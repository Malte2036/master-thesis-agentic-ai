import { z } from 'zod/v4';
import { AIProvider, AIGenerateTextOptions } from './types';
import { Ollama } from 'ollama';
import { Logger } from '../../logger';
import chalk from 'chalk';

export class OllamaProvider implements AIProvider {
  private readonly client: Ollama;
  public readonly model: string;

  constructor(
    private readonly logger: Logger,
    options?: { baseUrl?: string; model?: string },
  ) {
    this.client = new Ollama({
      host: options?.baseUrl || process.env['OLLAMA_BASE_URL'],
    });
    this.model = options?.model || 'mistral:instruct';

    this.healthCheck().then((isAvailable) => {
      if (!isAvailable) {
        throw new Error(`Model ${this.model} is not available`);
      }
      this.logger.log(`Model ${this.model} is available`);
    });
  }

  async healthCheck(): Promise<boolean> {
    return this.isModelAvailable(this.model);
  }

  private async isModelAvailable(model: string): Promise<boolean> {
    try {
      this.logger.log('Checking if model is available:', model);
      await this.client.show({ model: model });
      return true;
    } catch (error) {
      this.logger.error('Ollama model is not available:', model, error);
      return false;
    }
  }

  public async getModels(): Promise<{ name: string; size: number }[]> {
    const response = await this.client.list();
    return response.models.map((model) => ({
      name: model.model,
      size: model.size,
    }));
  }

  private async makeApiCall(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    isJson = false,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
  ) {
    this.logger.log('Making API call with temperature:', temperature);

    const response = await this.client.chat({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      stream: false,
      format: isJson && jsonSchema ? z.toJSONSchema(jsonSchema) : undefined,
      options: {
        temperature,
      },
    });

    if (!response.message?.content) {
      throw new Error('No response from Ollama');
    }

    return response.message.content;
  }

  async generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
    temperature?: number,
  ): Promise<string> {
    const messages = [
      ...(options?.messages || []),
      {
        role: 'user' as const,
        content: prompt,
      },
    ];

    const response = await this.makeApiCall(
      messages,
      false,
      undefined,
      temperature || 0.7,
    );

    // We get better results when we do not strip the <think> tags
    // if (response.startsWith('<think>')) {
    //   response = response.slice(response.indexOf('</think>') + 8);
    //   this.logger.log(
    //     chalk.magenta('Stripped <think> tags from natural language thought'),
    //   );
    // }

    return response.trim();
  }

  async generateJson<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
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

    const content = await this.makeApiCall(
      messages,
      true,
      jsonSchema,
      temperature,
    );

    if (!jsonSchema) {
      return content as T;
    }

    let jsonResponse;
    try {
      // Clean the response content before parsing
      const cleanedContent = content.trim().replace(/^```json\n?|\n?```$/g, '');
      jsonResponse = JSON.parse(cleanedContent);
    } catch (error) {
      this.logger.error('Failed to parse JSON response:', error);
      this.logger.error('Raw content:', content);
      throw new Error('Invalid JSON response format');
    }

    const parsedResponse = jsonSchema.safeParse(jsonResponse);
    if (parsedResponse.success === false) {
      this.logger.error('Invalid JSON response', content, parsedResponse.error);
      throw new Error('Invalid JSON response');
    }

    return parsedResponse.data as T;
  }
}
