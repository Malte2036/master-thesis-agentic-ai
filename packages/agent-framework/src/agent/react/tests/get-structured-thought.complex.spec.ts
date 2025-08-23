// packages/agent-framework/src/agent/react/tests/get-structured-thought.parallel.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../logger';
import { AIProvider, OllamaProvider } from '../../../services';
import { getStructuredThought } from '../get-structured-thought';
import { TEST_AI_PROVIDERS, TEST_OLLAMA_BASE_URL } from './spec.config';
import { getMockAgentToolsComplex } from './router.spec.config.complex'; // from previous message

vi.setConfig({ testTimeout: 15000 });

describe('getStructuredThought (parallel execution semantics)', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${structuredModel ?? model}`, () => {
      let aiProvider: AIProvider;
      let logger: Logger;
      const tools = getMockAgentToolsComplex();

      beforeEach(() => {
        const testName = expect.getState().currentTestName || 'unknown-test';
        const sanitized = testName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
        logger = new Logger({
          agentName: sanitized,
          logsSubDir: `${model}-${structuredModel ?? model}`,
        });

        if (provider === 'ollama') {
          aiProvider = new OllamaProvider(logger, {
            baseUrl: TEST_OLLAMA_BASE_URL,
            model: structuredModel ?? model,
          });
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
      });

      it('Multiple independent calls → all included in one iteration (parallel)', async () => {
        const thought = `
          I will do everything in parallel:
          - search_flights origin "BER" destination "HND" date "2025-10-05"
          - kb_vector_search query "atlas incident runbook" topK 3
          - translate_text text "Hello" targetLang "de"
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        expect(res.isFinished).toBe(false);

        const names = res.functionCalls.map((c) => c.function);
        expect(names).toEqual(
          expect.arrayContaining([
            'search_flights',
            'kb_vector_search',
            'translate_text',
          ]),
        );

        // All calls must have include_in_response
        for (const c of res.functionCalls) {
          expect(c.args['include_in_response']).toBeInstanceOf(Object);
        }
      });

      it('Dependent call without args → MUST be omitted (no chaining in same iteration)', async () => {
        const thought = `
          First I will run kb_vector_search for "atlas incident runbook" then use kb_fetch_document with the returned docId.
          (Note: I do not know the docId yet.)
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        const names = res.functionCalls.map((c) => c.function);
        expect(names).toContain('kb_vector_search');
        // Because docId is not present in the thought, kb_fetch_document must not appear
        expect(names).not.toContain('kb_fetch_document');
      });

      it('Dependent call allowed only if args are explicitly present in the thought', async () => {
        const thought = `
          I already know the doc id. Call kb_fetch_document with docId "doc-123".
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        const call = res.functionCalls[0];
        expect(call.function).toBe('kb_fetch_document');
        expect(call.args['docId']).toBe('doc-123');
        expect(call.args['include_in_response']).toBeDefined();
      });

      it('No ordering assumptions: result may list calls in any order', async () => {
        const thought = `
          Perform translate_text (text "We use RAG", targetLang "de") and kb_vector_search (query "atlas").
          Run them in parallel.
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        // Only assert presence, not order
        const names = res.functionCalls.map((c) => c.function);
        expect(names).toEqual(
          expect.arrayContaining(['translate_text', 'kb_vector_search']),
        );
      });

      it('Deduplicate identical calls (same tool + identical args) to avoid redundant parallel work', async () => {
        const thought = `
          Call kb_vector_search query "atlas runbook" topK 3.
          Also call kb_vector_search query "atlas runbook" topK 3. (duplicate)
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        const vectorCalls = res.functionCalls.filter(
          (c) => c.function === 'kb_vector_search',
        );
        // Prefer 1 call; if your policy allows duplicates, change this to >=1 and add a follow-up dedupe layer in code.
        expect(vectorCalls.length).toBe(1);
      });

      it('Multiple calls to same tool with different args are allowed (parallel batching)', async () => {
        const thought = `
          Search multiple trips in parallel:
          - search_flights origin "BER" destination "HND" date "2025-10-05"
          - search_flights origin "BER" destination "NRT" date "2025-10-06"
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        const flightCalls = res.functionCalls.filter(
          (c) => c.function === 'search_flights',
        );
        expect(flightCalls.length).toBeGreaterThanOrEqual(2);

        // Check they’re not identical
        const argsSet = new Set(
          flightCalls.map((c) =>
            JSON.stringify({
              o: c.args['origin'],
              d: c.args['destination'],
              dt: c.args['date'],
            }),
          ),
        );
        expect(argsSet.size).toBeGreaterThanOrEqual(2);

        for (const c of flightCalls)
          expect(c.args['include_in_response']).toBeDefined();
      });

      it('Capabilities paragraph mentioning tools → descriptive only (final answer, no calls)', async () => {
        const thought = `
          Capabilities: I can use search_flights and kb_vector_search to help, but I am only explaining right now.
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        expect(res.functionCalls).toEqual([]);
        expect(res.isFinished).toBe(true);
      });

      it('Missing required params for an action → do not invent; produce NO calls', async () => {
        const thought = `I will use search_flights soon (but I have not provided origin/destination/date).`;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        expect(res.functionCalls).toEqual([]); // nothing runs in parallel without args
        expect(res.isFinished).toBe(true);
      });

      it('All calls include include_in_response (policy enforcement)', async () => {
        const thought = `
          Parallel plan:
          - kb_vector_search query "atlas" topK 2
          - translate_text text "Hello" targetLang "de"
        `;
        const res = await getStructuredThought(
          thought,
          tools,
          aiProvider,
          logger,
        );

        for (const c of res.functionCalls) {
          expect(c.args['include_in_response']).toBeInstanceOf(Object);
        }
      });
    });
  }
});
