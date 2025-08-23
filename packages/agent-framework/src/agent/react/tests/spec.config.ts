export const TEST_OLLAMA_BASE_URL = 'http://10.50.60.153:11434';

export const TEST_AI_PROVIDERS: {
  provider: 'ollama' | 'groq';
  model: string;
  structuredModel?: string;
}[] = [
  // ollama models
  //   { provider: 'ollama', model: 'llama3.1:8b' },
  //   { provider: 'ollama', model: 'mistral:instruct' },
  //   { provider: 'ollama', model: 'qwen3:0.6b' },
  // { provider: 'ollama', model: 'qwen3:1.7b' },
  { provider: 'ollama', model: 'qwen3:4b' },
  //   { provider: 'ollama', model: 'qwen3:30b' },
  //   { provider: 'ollama', model: 'deepseek-r1:1.5b' },
  //   { provider: 'ollama', model: 'phi:2.7b' },

  // ollama with custom structured model
  // { provider: 'ollama', model: 'qwen3:0.6b', structuredModel: 'phi:2.7b' },

  // groq models
  // { provider: 'groq', model: 'qwen-qwq-32b' },
  // { provider: 'groq', model: 'deepseek-r1:1.5b' },
];
