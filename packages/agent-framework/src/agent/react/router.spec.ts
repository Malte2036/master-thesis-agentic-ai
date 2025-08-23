import { describe, it, expect, vi } from 'vitest';
import { ReActRouter } from './router';
import { AIProvider } from '../../services';
import { Logger } from '../../logger';
import { MCPName } from '../../config';
import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';
import { RouterProcess } from '@master-thesis-agentic-ai/types';

describe('ReActRouter', () => {
  describe('getNaturalLanguageThought', () => {
    it('should return a natural language thought', async () => {
      const aiProvider = {
        generateText: vi.fn().mockResolvedValue('This is a thought.'),
      } as unknown as AIProvider;
      const logger = {
        log: vi.fn(),
        debug: vi.fn(),
      } as unknown as Logger;
      const mcpName = 'test-mcp' as MCPName;
      const extendedNaturalLanguageThoughtSystemPrompt = 'extended-prompt';

      const router = new ReActRouter(
        aiProvider,
        aiProvider,
        logger,
        mcpName,
        extendedNaturalLanguageThoughtSystemPrompt,
      );

      const agentTools = {
        tools: [
          {
            function: {
              name: 'test-tool',
              description: 'A test tool.',
              parameters: {
                type: 'object',
                properties: {},
                required: [],
              },
            },
          },
        ],
      } as unknown as ListToolsResult;
      const routerProcess: RouterProcess = {
        question: 'What is the weather like?',
        maxIterations: 1,
        iterationHistory: [],
      };

      const thought = await router.getNaturalLanguageThought(
        agentTools,
        routerProcess,
      );

      expect(thought).toBe('This is a thought.');
      expect(aiProvider.generateText).toHaveBeenCalledOnce();
    });
  });
});
