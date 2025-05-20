import { AIProvider, AIProviderOptions, AIGenerateTextOptions } from './types';
import OpenAI from 'openai';
import { z } from 'zod';
import { generateSchemaDescription } from '../../utils/schema';

export class OpenAIProvider implements AIProvider {
  private readonly openai: OpenAI;

  constructor(private readonly options: AIProviderOptions) {
    this.openai = new OpenAI({
      apiKey: options.apiKey,
    });
  }

  async generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      // model: 'gpt-4o-mini',
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
      throw new Error('No response from OpenAI');
    }

    if (!jsonSchema) {
      return response.choices[0].message.content as T;
    }

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

    // console.log(
    //   'Response from LLM is:\n',
    //   JSON.stringify(parsedResponse.data, null, 2),
    // );

    return parsedResponse.data;
  }
}
