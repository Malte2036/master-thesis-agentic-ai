import { Logger } from '../../../logger';
import { AIProvider, OllamaProvider, OpenAIProvider } from '../../../services';
import { expect } from 'vitest';
import dotenv from 'dotenv';

dotenv.config();

// export const TEST_OLLAMA_BASE_URL = 'http://10.50.60.153:11434';
// export const TEST_OLLAMA_BASE_URL = 'http://localhost:11434';
export const TEST_OLLAMA_BASE_URL = process.env['OLLAMA_BASE_URL'];
if (!TEST_OLLAMA_BASE_URL) {
  throw new Error('OLLAMA_BASE_URL is not set');
}

export const TEST_TIMEOUT = 10000;

type TestProvider = 'ollama' | 'groq' | 'openai';

export const TEST_AI_PROVIDERS: {
  provider: TestProvider;
  model: string;
  structuredModel?: string;
}[] = [
  // ollama models
  //   { provider: 'ollama', model: 'llama3.1:8b' },
  //   { provider: 'ollama', model: 'mistral:instruct' },
  //   { provider: 'ollama', model: 'qwen3:0.6b' },
  // { provider: 'ollama', model: 'qwen3:1.7b' },
  { provider: 'ollama', model: 'qwen3:4b' }, // MAIN MODEL
  //   { provider: 'ollama', model: 'qwen3:30b' },
  // { provider: 'ollama', model: 'qwen3:4b-thinking-2507-q4_K_M' },
  //   { provider: 'ollama', model: 'deepseek-r1:1.5b' },
  //   { provider: 'ollama', model: 'phi:2.7b' },
  // ollama with custom structured model
  // { provider: 'ollama', model: 'qwen3:0.6b', structuredModel: 'phi:2.7b' },
  // groq models
  // { provider: 'groq', model: 'qwen-qwq-32b' },
  // { provider: 'groq', model: 'deepseek-r1:1.5b' },
  // openai models
  // { provider: 'openai', model: 'gpt-5-nano' },
];

export const setupTest = (
  provider: TestProvider,
  model: string,
  structuredModel?: string,
) => {
  const testName = expect.getState().currentTestName || 'unknown-test';
  const sanitizedTestName = testName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const logger = new Logger({
    agentName: sanitizedTestName,
    logsSubDir: `${model}-${structuredModel ?? model}`,
  });

  let aiProvider: AIProvider;
  if (provider === 'ollama') {
    aiProvider = new OllamaProvider(logger, {
      baseUrl: TEST_OLLAMA_BASE_URL,
      model,
    });
  } else if (provider === 'openai') {
    aiProvider = new OpenAIProvider(logger, {
      model,
    });
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return { logger, aiProvider };
};
