// packages/agent-framework/src/services/ai/openai.ts
import OpenAI from 'openai';
import { z } from 'zod/v4';
import { AIProvider, AIGenerateTextOptions } from './types';
import { Logger } from '../../logger';

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
    // Accept OLLAMA_BASE_URL as a drop-in, or OPENAI_BASE_URL
    const baseURL =
      process.env['OPENAI_BASE_URL'] || process.env['OLLAMA_BASE_URL']; // e.g. http://localhost:8000/v1 (vLLM)

    if (!baseURL) {
      throw new Error(
        'OPENAI_BASE_URL (or OLLAMA_BASE_URL) is not set, e.g. http://localhost:8000/v1',
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

  // Keep AIProvider contract: size must be number; OpenAI doesn't expose it -> 0 sentinel
  public async getModels(): Promise<{ name: string; size: number }[]> {
    const list = await this.client.models.list();
    return list.data.map((m) => ({ name: m.id, size: 0 }));
  }

  private async makeApiCall(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    isJson = false,
    jsonSchema?: z.ZodSchema,
    temperature?: number,
  ): Promise<string> {
    this.logger.log(
      'Making OpenAI/vLLM API call with temperature:',
      temperature,
    );

    // Map to OpenAI SDK message type
    const openAIMessages: ChatMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Build response_format with correct typing
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
      temperature,
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
    const content = await this.makeApiCall(
      messages,
      false,
      undefined,
      temperature ?? 0.7,
    );
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

    const content = await this.makeApiCall(
      messages,
      true,
      jsonSchema,
      temperature,
    );

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
