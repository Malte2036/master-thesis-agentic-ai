// packages/agent-framework/src/services/ai/openai.ts
import OpenAI from 'openai';
import { z } from 'zod/v4';
import { AIProvider, AIGenerateTextOptions } from './types';
import { Logger } from '../../logger';
import chalk from 'chalk';

type ModelOptions = {
  temperature?: number;
  top_p?: number;
  top_k?: number;
  min_p?: number;
  seed?: number;
};

const DEFAULT_OPTIONS: ModelOptions = {
  temperature: 0.6,
  top_p: 0.8,
  top_k: 20,
  min_p: 0,
  // This seed is used to reproduce the results
  seed: 42,
};

// Use SDK's message param type for compatibility with .create()
type ChatMessage = OpenAI.ChatCompletionMessageParam;

// Local union for response_format compatible with OpenAI v6
type ResponseFormat =
  | { type: 'text' }
  | { type: 'json_object' }
  | {
      type: 'json_schema';
      json_schema: {
        name: string;
        schema: Record<string, unknown>;
        strict?: boolean;
      };
    };

function deepStripKeys(
  obj: any,
  keysToStrip = new Set<string>(['propertyNames']),
): any {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => deepStripKeys(v, keysToStrip));
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (keysToStrip.has(k)) continue;
    out[k] = deepStripKeys(v, keysToStrip);
  }
  return out;
}

export class OpenAIProvider implements AIProvider {
  private readonly client: OpenAI;
  public readonly model: string;

  constructor(
    private readonly logger: Logger,
    options?: { model?: string },
  ) {
    this.logger.log(
      chalk.cyan('Creating OpenAIProvider with model:'),
      options?.model,
    );
    const baseURL = process.env['OPENAI_BASE_URL']; // e.g. http://localhost:8000/v1 (vLLM)

    if (!baseURL) {
      throw new Error(
        'OPENAI_BASE_URL is not set, e.g. http://localhost:8000/v1',
      );
    }

    // vLLM accepts any token
    const apiKey = process.env['OPENAI_API_KEY'] || 'test';

    this.client = new OpenAI({ apiKey, baseURL });
    this.model = options?.model || 'Qwen/Qwen3-4B-Instruct';

    // Fire-and-forget health check
    this.healthCheck().then((ok) => {
      if (!ok)
        throw new Error(`Model ${this.model} is not available on ${baseURL}`);
      this.logger.log(`Model ${this.model} is available`);
    });
  }

  async healthCheck(): Promise<boolean> {
    return this.isModelAvailable(this.model);
  }

  private async isModelAvailable(model: string): Promise<boolean> {
    try {
      this.logger.log('Checking if model is available via /v1/models:', model);
      const list = await this.client.models.list();
      const ids = list.data.map((m) => m.id);
      const ok = ids.includes(model);
      if (!ok)
        this.logger.warn('Model not found in /v1/models list:', {
          available: ids,
        });
      return ok;
    } catch (err) {
      this.logger.error('Model availability check failed:', err);
      return false;
    }
  }

  public async getModels(): Promise<{ name: string; size: number }[]> {
    const list = await this.client.models.list();
    return list.data.map((m) => ({ name: m.id, size: 0 }));
  }

  private async makeApiCall(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    isJson = false,
    jsonSchema?: z.ZodSchema,
    opts?: ModelOptions,
  ): Promise<string> {
    this.logger.log('Making OpenAI/vLLM API call with options:', opts);

    const openAIMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    let response_format: ResponseFormat | undefined;
    if (isJson) {
      if (jsonSchema) {
        try {
          const raw = z.toJSONSchema(jsonSchema) as unknown;
          const sanitized = deepStripKeys(
            raw,
            new Set(['propertyNames']),
          ) as Record<string, unknown>;
          response_format = {
            type: 'json_schema',
            json_schema: { name: 'response', schema: sanitized, strict: true },
          };
        } catch {
          response_format = { type: 'json_object' };
        }
      } else {
        response_format = { type: 'json_object' };
      }
    }

    const params: OpenAI.ChatCompletionCreateParamsNonStreaming = {
      model: this.model,
      messages: openAIMessages,
      temperature: opts?.temperature,
      top_p: opts?.top_p,
      seed: opts?.seed,
      // vLLM-specific sampling options — harmlessly ignored by OpenAI
      ...(opts?.top_k !== undefined ? { top_k: opts.top_k } : {}),
      ...(opts?.min_p !== undefined ? { min_p: opts.min_p } : {}),
      stream: false,
      ...(response_format ? { response_format } : {}),
    };

    const res = await this.client.chat.completions.create(params);
    const content = res.choices?.[0]?.message?.content ?? '';
    if (!content) throw new Error('No content returned from OpenAI/vLLM');
    return content;
  }

  async generateText(
    prompt: string,
    options?: AIGenerateTextOptions,
    temperature?: number,
  ): Promise<string> {
    const messages = [
      ...(options?.messages || []),
      { role: 'user' as const, content: prompt },
    ];
    const content = await this.makeApiCall(messages, false, undefined, {
      ...DEFAULT_OPTIONS,
      temperature: temperature ?? DEFAULT_OPTIONS.temperature,
    });
    return content.trim();
  }

  async generateJson<T>(
    prompt: string,
    options?: AIGenerateTextOptions,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
  ): Promise<T> {
    const schemaMsg = jsonSchema
      ? [
          {
            role: 'system' as const,
            content:
              'You are a JSON generator. Output ONE valid JSON object ONLY. No markdown, no comments, no extra text. It MUST follow the given schema.',
          },
        ]
      : [];

    const messages = [
      ...schemaMsg,
      ...(options?.messages || []),
      { role: 'user' as const, content: prompt },
    ];

    const content = await this.makeApiCall(messages, true, jsonSchema, {
      ...DEFAULT_OPTIONS,
      temperature: temperature ?? DEFAULT_OPTIONS.temperature,
    });

    if (!jsonSchema) {
      return content as unknown as T;
    }

    let jsonResponse: unknown;
    try {
      const cleaned = content.trim().replace(/^```json\n?|\n?```$/g, '');
      jsonResponse = JSON.parse(cleaned);
    } catch (err) {
      this.logger.error('Failed to parse JSON response:', err);
      this.logger.error('Raw content:', content);
      throw new Error('Invalid JSON response format');
    }

    const parsed = jsonSchema.safeParse(jsonResponse);
    if (!parsed.success) {
      this.logger.error('Invalid JSON response', jsonResponse, parsed.error);
      throw new Error('Invalid JSON response');
    }
    return parsed.data as T;
  }
}

export default OpenAIProvider;
