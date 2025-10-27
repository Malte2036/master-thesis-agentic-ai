// router.complex.spec.ts
import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getNaturalLanguageThought } from '../../get-natural-language-thought';
import mockAgentToolsComplex from '../router.spec.config.complex';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';
import { moodleAgentToolsMock } from '../moodle.spec.config';
import { calendarAgentToolsMock } from '../calendar.spec.config';

vi.setConfig(TEST_CONFIG);

describe('getNaturalLanguageThought (complex scenarios)', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${
      structuredModel ?? model
    }`, () => {
      let aiProvider: AIProvider;
      let logger: Logger;

      beforeEach(() => {
        const setup = setupTest(provider, model, structuredModel);

        aiProvider = setup.aiProvider;
        logger = setup.logger;
      });

      type Case = {
        name: string;
        question: string;
        // Regexes your “thought” should include
        mustContain: RegExp[];
        // Optional negatives to ensure it’s not hallucinating irrelevant tools
        mustNotContain?: RegExp[];
      };

      const cases: Case[] = [
        {
          name: 'Travel planning: pick correct flight search tool',
          question:
            'Find me a round-trip from Berlin to Tokyo leaving on 2025-10-05 and returning on 2025-10-18, 2 passengers in premium economy.',
          mustContain: [
            /search[_-]?flights/i,
            /berlin|BER/i,
            /tokyo|HND|NRT/i,
            /2025-10-05/i,
            /2025-10-18/i,
            /premium/i,
            /2/,
          ],
        },
        {
          name: 'Flight ops: real-time flight status, not search',
          question: 'Is LH203 on time for 2025-09-01?',
          mustContain: [/get[_-]?flight[_-]?status/i, /LH203/i, /2025-09-01/i],
          mustNotContain: [/search[_-]?flights/i],
        },
        {
          name: 'Finance: price + FX conversion chain',
          question: 'What is the current price of NVDA in EUR?',
          mustContain: [/query[_-]?finance[_-]?price/i, /NVDA/i, /EUR/i],
        },
        {
          name: 'FX only: pick exchange tool',
          question: 'Convert 100 USD to EUR with today’s rate.',
          mustContain: [/get[_-]?exchange[_-]?rate/i, /USD/i, /EUR/i],
        },
        {
          name: 'Enterprise RAG: vector search then fetch doc',
          question:
            'Show me the incident runbook for our “atlas” service and summarize the escalation steps.',
          mustContain: [
            /kb[_-]?vector[_-]?search/i,
            /atlas/i,
            /kb[_-]?fetch[_-]?document/i,
          ],
        },
        {
          name: 'Calendar automation: schedule with attendees',
          question:
            'Set up a project kickoff next Tuesday from 09:00 to 10:00 with alice@example.com and bob@example.com.',
          mustContain: [
            /create[_-]?calendar[_-]?event/i,
            /kickoff/i,
            /(alice@example\.com|bob@example\.com)/i,
            /(09:00|09\.00)/i,
            /(10:00|10\.00)/i,
          ],
        },
        {
          name: 'Analytics DB: choose SQL tool for a metric',
          question:
            'What were daily active users for the last 14 days for product “ProPlan”? Return date plus dau.',
          mustContain: [/run[_-]?sql[_-]?query/i, /ProPlan/i, /daily/i, /14/],
        },
        {
          name: 'Web ingestion + summarization',
          question:
            'Read this page and summarize pricing: https://example.com/pricing',
          mustContain: [/web[_-]?retrieve[_-]?and[_-]?summarize/i, /pricing/i],
        },
        {
          name: 'Translate with glossary',
          question:
            'Translate to German: “We use Retrieval-Augmented Generation (RAG) for our KB.” Keep “RAG” untranslated.',
          mustContain: [/translate(?:[-_]| the )text/i, /German|de\b/i, /RAG/i],
        },
      ];

      describe('getNaturalLanguageThought (complex)', () => {
        for (const c of cases) {
          it(`should hint correct tool(s) and entities: ${c.name}`, async () => {
            const routerProcess: RouterProcess = {
              contextId: 'test-context-id',
              question: c.question,
              maxIterations: 3,
              iterationHistory: [],
              trace: [],
            };

            const thought = await getNaturalLanguageThought(
              mockAgentToolsComplex,
              routerProcess,
              aiProvider,
              logger,
              '',
            );

            expect(thought).toBeDefined();
            expect(typeof thought).toBe('string');
            expect(thought.length).toBeGreaterThan(0);

            const lower = thought
              .toLowerCase()
              .slice(thought.indexOf('</think>') + 8)
              .trim();

            for (const rx of c.mustContain) {
              expect(lower).toMatch(rx);
            }
            if (c.mustNotContain) {
              for (const rx of c.mustNotContain) {
                expect(lower).not.toMatch(rx);
              }
            }
          });
        }
      });

      it('should not repeat the same function call twice with the same parameters with real moodle example', async () => {
        const routerProcess: RouterProcess = {
          contextId: 'test-context-id',
          question: 'get user info',
          maxIterations: 3,
          iterationHistory: [
            {
              iteration: 0,
              naturalLanguageThought: `I will now use the **get_user_info** function to retrieve personal information about the current user. The response will include the following fields: username, firstname, lastname,    ║
   siteurl, userpictureurl, and userlang.                                                                                                                                                                            ║
                                                                                                                                                                                                                     ║
  **Parameters:**                                                                                                                                                                                                    ║
  - No parameters required`,
              response: JSON.stringify(
                [
                  {
                    content: [
                      {
                        type: 'text',
                        text: '{"username":"student","firstname":"Sabrina","lastname":"Studentin","siteurl":"http://localhost:8080","userpictureurl":"http://localhost:8080/theme/image.php/boost/core/1746531048/u/f1"}',
                      },
                    ],
                  },
                ],
                null,
                2,
              ),
              structuredThought: {
                functionCalls: [
                  {
                    function: 'get_user_info',
                    args: {},
                  },
                ],
                isFinished: false,
              },
            },
          ],
          trace: [],
        };

        const thought = await getNaturalLanguageThought(
          moodleAgentToolsMock,
          routerProcess,
          aiProvider,
          logger,
          '',
        );

        expect(thought).toBeDefined();
        expect(thought.slice(thought.indexOf('</think>') + 8)).not.toMatch(
          /get[-_\s]user[-_\s]info/,
        );
      });

      it('should not repeat calendar creation call if already created in previous iteration', async () => {
        const routerProcess: RouterProcess = {
          contextId: 'test-context-id',
          question: 'Create a calendar entry for today',
          maxIterations: 5,
          iterationHistory: [
            {
              iteration: 0,
              naturalLanguageThought:
                '<think>\n' +
                `Okay, the user wants to create a calendar entry for today. Let me check the available tools. There's the calendar-agent with a skill named "calendar". The required parameters are prompt,    ║
   prompt, and reason. The user's request is straightforward: create an entry today. But I need to make sure I have all the necessary parameters. The prompt should be the action, which is "Create a calendar ent    ║
  ry". The reason is why it's being done, so maybe "User requested to create a calendar entry for today". Since the user jus    ║
  t said "create a calendar entry for today", I need to use the calendar-agent's skill. The parameters are all there: prompt is the action, reason is the justification. I should call the calendar-agent with these parameters.\n` +
                '</think>\n' +
                '\n' +
                'I will now use the **calendar-agent** to create a calendar entry. **Parameters** I will pass:\n' +
                '- prompt="Create a calendar entry"\n' +
                '- reason="User requested to create a calendar entry for today"\n',
              structuredThought: {
                functionCalls: [
                  {
                    function: 'calendar-agent',
                    args: {
                      prompt: 'Create a calendar entry',
                      reason:
                        'User requested to create a calendar entry for today',
                    },
                  },
                ],
                isFinished: false,
              },
              response:
                '[\n' +
                '  {\n' +
                '    "content": [\n' +
                '      {\n' +
                '        "type": "text",\n' +
                '        "text": {\n' +
                '          "response": "We successfully created the calendar event."\n' +
                '        }\n' +
                '      }\n' +
                '    ]\n' +
                '  }\n' +
                ']',
            },
          ],
          trace: [],
        };

        const thought = await getNaturalLanguageThought(
          calendarAgentToolsMock,
          routerProcess,
          aiProvider,
          logger,
          '',
        );

        expect(thought).toBeDefined();
        expect(typeof thought).toBe('string');
        expect(thought.length).toBeGreaterThan(0);

        // The thought should NOT contain another calendar creation call since it was already created
        const thoughtAfterThink = thought.slice(
          thought.indexOf('</think>') + 8,
        );
        expect(thoughtAfterThink).not.toMatch(/calendar[-_\s]agent/i);
        expect(thoughtAfterThink).not.toMatch(
          /create[-_\s]calendar[-_\s]entry/i,
        );

        // It should acknowledge that the calendar entry was already created
        expect(thoughtAfterThink.toLowerCase()).toMatch(
          /already|previously|created|done|completed/i,
        );
      });
    });
  }
});
