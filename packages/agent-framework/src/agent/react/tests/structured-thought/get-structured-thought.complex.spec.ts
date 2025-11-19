// packages/agent-framework/src/agent/react/tests/get-structured-thought.parallel.spec.ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getStructuredThought } from '../../get-structured-thought';
import { moodleAgentToolsMock } from '../moodle.spec.config';
import mockAgentToolsComplex from '../router.spec.config.complex';
import { setupTest, TEST_AI_PROVIDERS, TEST_CONFIG } from '../spec.config';

vi.setConfig(TEST_CONFIG);

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
        CALL:
        search_flights
        parameters="origin='BER', destination='HND', date='2025-10-05'"
        
        kb_vector_search
        parameters="query='atlas incident runbook', topK=3"
        
        run_sql_query
        parameters="sql='SELECT * FROM users LIMIT 10'"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        const names = res.functionCalls?.map((c) => c.function) ?? [];
        expect(names).toEqual(
          expect.arrayContaining([
            'search_flights',
            'kb_vector_search',
            'run_sql_query',
          ]),
        );

        // All calls should have valid args structure
        for (const c of res.functionCalls ?? []) {
          expect(c.args).toBeDefined();
        }
        expect(res.isFinished).toBe(false);
      });

      it('Dependent call without args → MUST be omitted (no chaining in same iteration)', async () => {
        const thought = `
          CALL:
          kb_vector_search 
          parameters="query='atlas incident runbook', topK=3"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        const names = res.functionCalls.map((c) => c.function);
        expect(names).toContain('kb_vector_search');
        // Should only contain the vector search, not any dependent calls
        expect(names.length).toBe(1);
      });

      it('Function call with explicit args in the thought', async () => {
        const thought = `
          CALL:
          kb_vector_search 
          parameters="query='atlas service', topK=3"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        const call = res.functionCalls[0];
        expect(call.function).toBe('kb_vector_search');
        expect(call.args['query']).toContain('atlas');
        expect(call.args).toBeDefined();
      });

      it('No ordering assumptions: result may list calls in any order', async () => {
        const thought = `
          CALL:
          run_sql_query
          parameters="sql='SELECT * FROM metrics'"

          kb_vector_search
          parameters="query='atlas', topK=3"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        // Only assert presence, not order
        const names = res.functionCalls.map((c) => c.function);
        expect(names).toEqual(
          expect.arrayContaining(['run_sql_query', 'kb_vector_search']),
        );
      });

      it('Deduplicate identical calls (same tool + identical args) to avoid redundant parallel work', async () => {
        const thought = `
          CALL:
          kb_vector_search 
          parameters="query='atlas runbook', topK=3"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        const vectorCalls = res.functionCalls.filter(
          (c) => c.function === 'kb_vector_search',
        );
        // Prefer 1 call; if your policy allows duplicates, change this to >=1 and add a follow-up dedupe layer in code.
        expect(vectorCalls.length).toBe(1);
      });

      it('Multiple calls to same tool with different args are allowed (parallel batching)', async () => {
        const thought = `
          CALL:
          search_flights
          parameters="origin='BER', destination='HND', date='2025-10-05'"
          
          search_flights
          parameters="origin='BER', destination='NRT', date='2025-10-06'"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
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

        for (const c of flightCalls) expect(c.args).toBeDefined();
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
          false,
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
          false,
        );

        expect(res.functionCalls).toEqual([]); // nothing runs in parallel without args
      });

      it('All calls have valid args structure (policy enforcement)', async () => {
        const thought = `
          CALL:
          kb_vector_search
          parameters="query='atlas', topK=2"

          web_retrieve_and_summarize
          parameters="url='https://example.com/docs', focus='pricing'"
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        for (const c of res.functionCalls) {
          expect(c.args).toBeDefined();
        }
      });

      it('Complete user information present → should finish loop instead of making another call', async () => {
        const thought = `
          The user's personal information is as follows:

          - **Username**: student
          - **First Name**: Sabrina
          - **Last Name**: Studentin
        
            Let me know if you need further details!
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        // Should recognize that we have complete information and finish
        expect(res.functionCalls).toEqual([]);
        expect(res.isFinished).toBe(true);
      });

      it('should set isFinished to true when agent cannot execute function due to missing parameters', async () => {
        const result = await getStructuredThought(
          'I cannot execute **get_course_details** yet. **Missing required parameters**: - course_id (e.g., 12345) Please provide the exact course ID or the course name to proceed. I will call **search_courses_by_name** if you share the course name.',
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
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
          false,
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
          false,
        );

        // Should recognize that user information is already present and not make another call
        expect(result).toBeDefined();
        expect(result.functionCalls.length).toBe(0);
        expect(result.isFinished).toBe(true);
      });

      it('is finished is not set, if we have remaining tasks', async () => {
        const thought = `
        <think>
        Okay, the user is asking for their own user information. Let me check the available tools. There's a function called get_user_info that retrieves personal details about the user who asked the question. The pa    ║
  rameters required are minimal. The function doesn't need any other parameters. So I should call get_user_info. Let me structure the function call accordingly.
  </think>

  CALL:
  get_user_info
  parameters=""
        `;
        const res = await getStructuredThought(
          thought,
          mockAgentToolsComplex,
          aiProvider,
          logger,
          false,
        );

        expect(res.isFinished).toBe(false);
        expect(res.functionCalls.length).toBe(1);
      });
    });
  }
});
