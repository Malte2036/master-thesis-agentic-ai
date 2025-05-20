import { AIProvider, AIGenerateTextOptions } from './types';
import Groq from 'groq-sdk';
import { z } from 'zod';
import { generateSchemaDescription } from '../../utils/schema';
export class GroqProvider implements AIProvider {
  private readonly groq: Groq;

  constructor() {
    const groqApiKey = process.env['GROQ_API_KEY'];
    if (!groqApiKey) {
      throw new Error('GROQ_API_KEY is not set');
    }
    this.groq = new Groq({
      apiKey: groqApiKey,
    });
  }

  async generateText<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
  ): Promise<T> {
    const response = await this.groq.chat.completions.create({
      // model: 'llama-3.1-8b-instant',
      // model: 'deepseek-r1-distill-llama-70b',
      // model: 'llama3-70b-8192',
      model: 'gemma2-9b-it',
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

    // console.log('response is', response.choices[0].message.content);

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
