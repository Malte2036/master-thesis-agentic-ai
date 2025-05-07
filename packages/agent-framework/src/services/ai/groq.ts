import { AIProvider, AIProviderOptions, AIGenerateTextOptions } from './types';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { generateSchemaDescription } from '../../utils/schema';
export class GroqProvider implements AIProvider {
  private readonly groq: Groq;

  constructor(private readonly options: AIProviderOptions) {
    this.groq = new Groq({
      apiKey: options.apiKey,
    });
  }

  async generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T> {
    const response = await this.groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
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
      ],
      response_format: jsonSchema ? { type: 'json_object' } : undefined,
    });

    if (!response.choices[0].message.content) {
      throw new Error('No response from Groq');
    }

    if (!jsonSchema) {
      return response.choices[0].message.content as T;
    }

    console.log('response is', response.choices[0].message.content);

    let jsonResponse;
    try {
      jsonResponse = JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Failed to parse JSON response:', error);
      throw new Error('Invalid JSON response format');
    }

    const parsedResponse = jsonSchema.safeParse(jsonResponse);
    if (parsedResponse.success === false) {
      console.error(
        'Invalid JSON response',
        response.choices[0].message.content,
        parsedResponse.error,
      );
      throw new Error('Invalid JSON response');
    }

    return parsedResponse.data;
  }
}
