// packages/agent-framework/src/agent/react/tests/get-structured-thought.parallel.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getStructuredThought } from '../../get-structured-thought';
import { moodleAgentToolsMock } from '../moodle.spec.config';
import mockAgentToolsComplex from '../router.spec.config.complex';
import { setupTest, TEST_AI_PROVIDERS, TEST_TIMEOUT } from '../spec.config';

vi.setConfig({ testTimeout: TEST_TIMEOUT });

describe('getStructuredThought (parallel execution semantics)', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${structuredModel ?? model}`, () => {
      let aiProvider: AIProvider;
      let logger: Logger;

      beforeEach(() => {
        const setup = setupTest(provider, model, structuredModel);

        aiProvider = setup.aiProvider;
        logger = setup.logger;
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
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

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
        expect(res.isFinished).toBe(false);
      });

      it('Dependent call without args → MUST be omitted (no chaining in same iteration)', async () => {
        const thought = `
          First I will run kb_vector_search for "atlas incident runbook" then use kb_fetch_document with the returned docId.
          (Note: I do not know the docId yet.)
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
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
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

        expect(res.functionCalls).toEqual([]); // nothing runs in parallel without args
      });

      it('All calls include include_in_response (policy enforcement)', async () => {
        const thought = `
          Parallel plan:
          - kb_vector_search query "atlas" topK 2
          - translate_text text "Hello" targetLang "de"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

        for (const c of res.functionCalls) {
          expect(c.args['include_in_response']).toBeInstanceOf(Object);
        }
      });

      it('Complete user information present → should finish loop instead of making another call', async () => {
        const thought = `
          The user's personal information is as follows:

          - **Username**: student
          - **First Name**: Sabrina
          - **Last Name**: Studentin
          - **Site URL**: http://localhost:8080
          - **User Picture URL**: http://localhost:8080/theme/image.php/boost/core/1746531048/u/f1
          - **User Language**: (Not explicitly listed in the response, but the tool's parameters include \`userlang\` as a required field. The value may be inferred from the context or missing in the provided response.)

            Let me know if you need further details!
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

        // Should recognize that we have complete information and finish
        expect(res.functionCalls).toEqual([]);
        expect(res.isFinished).toBe(true);
      });

      it('should set isFinished to true when agent cannot execute function due to missing parameters', async () => {
        const result = await getStructuredThought(
          'I cannot execute **get_course_contents** yet. **Missing required parameters**: - course_id (e.g., 12345) Please provide the exact course ID or the course name to proceed. I will call **search_courses_by_name** if you share the course name.',
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

        expect(result).toBeDefined();
        expect(result.functionCalls.length).toBe(0);
        expect(result.isFinished).toBe(true);
      });

      it('should not call any function when presenting already retrieved user information', async () => {
        const result = await getStructuredThought(
          "Here is your user information:\n\n- **Username**: `student`\n- **First Name**: `Sabrina`\n- **Last Name**: `Studentin`\n- **Site URL**: `http://localhost:8080`\n- **User Picture URL**: `http://localhost:8080/theme/image.php/boost/core/1746531048/u/f1`\n- **User Language**: (Not explicitly specified in the response; likely defaults to the site's language setting)\n\nLet me know if you need further details! 😊",
          mockAgentToolsComplex,
          aiProvider,
          logger,
        );

        expect(result).toBeDefined();
        expect(result.functionCalls.length).toBe(0);
        expect(result.isFinished).toBe(true);
      });

      it('should not call any function when presenting already retrieved user information with real moodle example', async () => {
        const naturalLanguageThought = `Here is your user information:
        - **Username:** student
        - **First Name:** Sabrina
        - **Last Name:** Studentin
        - **Site URL:** http://localhost:8080
        - **User Picture URL:** http://localhost:8080/theme/image.php/boost/core/1746531048/u/f1
        - **Language:** (The response does not explicitly state the language code, but the \`userlang\` field is included in the request.)
        
        Let me know if you need further details!`;

        const result = await getStructuredThought(
          naturalLanguageThought,
          moodleAgentToolsMock,
          aiProvider,
          logger,
        );

        // Should recognize that user information is already present and not make another call
        expect(result).toBeDefined();
        expect(result.functionCalls.length).toBe(0);
        expect(result.isFinished).toBe(true);
      });
    });
  }
});
