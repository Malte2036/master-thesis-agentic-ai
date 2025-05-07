import { AIProvider, AIProviderOptions, AIGenerateTextOptions } from './types';
import Groq from 'groq-sdk';

export class GroqProvider implements AIProvider {
  private readonly groq: Groq;

  constructor(private readonly options: AIProviderOptions) {
    this.groq = new Groq({
      apiKey: options.apiKey,
    });
  }

  async generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
  ): Promise<string> {
    const response = await this.groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        ...(options?.messages || []),
        {
          role: 'user' as const,
          content: prompt,
        },
      ],
    });

    return response.choices[0].message.content || '';
  }
}
