export interface AIProvider {
  generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
  ): Promise<string>;
}

export interface AIGenerateTextOptions {
  messages?: {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }[];
}

export interface AIProviderOptions {
  apiKey: string;
}
