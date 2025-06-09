import { AIProvider, AIGenerateTextOptions } from './types';
import Groq from 'groq-sdk';
import { z } from 'zod/v4';
import { Logger } from '../../logger';

export class GroqProvider implements AIProvider {
  private readonly groq: Groq;
  public readonly model: string;

  constructor(
    private readonly logger: Logger,
    options: {
      model: string;
    },
  ) {
    const groqApiKey = process.env['GROQ_API_KEY'];
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    this.groq = new Groq({
      apiKey: groqApiKey,
    });
    this.model = options.model;
  }

  private async makeApiCall(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    isJson = false,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
  ) {
    this.logger.log('Making API call with temperature:', temperature);

    const response = await this.groq.chat.completions.create({
      model: this.model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      response_format: isJson ? { type: 'json_object' } : undefined,
      temperature,
    });

    if (!response.choices[0].message.content) {
      throw new Error('No response from Groq');
    }

    return response.choices[0].message.content;
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

    return this.makeApiCall(messages, false, undefined, 0.7);
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
