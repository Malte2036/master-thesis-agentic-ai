import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getNaturalLanguageThought } from '../../get-natural-language-thought';
import { mockAgentTools } from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';
import { stripThoughts } from '../../../../utils/llm';
import { getFriendlyResponse } from '../../get-friendly-response';

vi.setConfig(TEST_CONFIG);

describe('getFriendlyResponse', () => {
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

      it('should generate a friendly response', async () => {
        const routerProcess: RouterProcess = {
          question: 'Can you help me get my user information?',
          maxIterations: 3,
          iterationHistory: [
            {
              iteration: 0,
              naturalLanguageThought: `Natural language thought: <think>
Okay, the user is asking for help to get their user information. Let me think about how to approach this.
First, I need to determine which agent to use. The user mentioned "user information," which sounds like it's related to a learning management system, maybe Moodle. The tools available are moodle-agent and calendar-agent. Since the request is about user information, the moodle-agent is the right choice here. The calendar-agent is for scheduling and events, which isn't relevant here.
Next, I should check the parameters needed for the moodle-agent. The agent requires a prompt and parameters. The prompt should be a clear instruction. The user wants their user information, so the prompt could be "Retrieve user information for the current user." 
Parameters might include things like user ID, but since the user hasn't provided specific details, I should keep it general. The moodle-agent can handle retrieving personal user info without specific IDs if it's for the current user. 
Wait, the tool's parameters section says that if you don't know all exact parameters, you can describe them naturally. So I can say "current user" in the parameters. Let me structure the call accordingly.
So the function call would be to moodle-agent with the prompt "Retrieve user information for the current user" and parameters "user='current user'". That should fetch the necessary data. I need to make sure I'm not making up any parameters and that everything is based on the tool's requirements. 
I don't see any missing required parameters here. The prompt is clear, and the parameters are described naturally. So the next step is to call the moodle-agent with these settings.
</think>
CALL: moodle-agent
parameters="prompt=Retrieve user information for the current user, parameters=user='current user'"`,
              structuredThought: {
                functionCalls: [
                  {
                    function: 'moodle-agent',
                    args: {
                      prompt: 'Retrieve user information for the current user',
                      parameters: "user='current user'",
                    },
                    type: 'agent',
                    result:
                      '\n' +
                      '\n' +
                      'SUMMARY: The original goal of retrieving user information for the current user was successfully achieved. The system executed the `get_user_info` function, which returned the following details:  \n' +
                      '- **User ID**: `3`  \n' +
                      '- **Username**: `student`  \n' +
                      '- **First Name**: `Sabrina`  \n' +
                      '- **Last Name**: `Studentin`  \n' +
                      '\n' +
                      'The operation concluded with a status of **success**, as confirmed by the observation `"We successfully retrieved the user info."` The data provided is concrete and directly derived from the tool response, with no ambiguity or missing information. No further actions are required, as the objective has been fully met.',
                  },
                ],
                isFinished: false,
              },
            },
            {
              iteration: 1,
              naturalLanguageThought: `<think>
Okay, the user is asking for their user information again. Let me check the state to see what's already been done.
Looking at the STATE_JSON, the last action was calling the get_user_info function, which successfully retrieved the user details. The observation shows the user ID is 3, username is student, first name Sabrina, and last name Studentin. The status was a success, so the goal was already achieved.
Since the user is asking again, but the information is already available in the last observation, I don't need to make another tool call. The answer should just present the existing data from the successful retrieval. I'll format it as DONE with the evidence JSON block and the final answer listing the details verbatim.
</think>
DONE:
\`\`\`evidence-json
{"message":"We successfully retrieved the user info.\n\nOBSERVATION\nsource=moodle_api endpoint=get_user_info generated_at=2025-09-29T08:11:19.193Z\n\nFIELDS\nUser ID | Username | First Name | Last Name\n\nROWS\n3 | student | Sabrina | Studentin"}
\`\`\`
Final:
The current user has the following information:  
- **User ID**: 3  
- **Username**: student  
- **First Name**: Sabrina  
- **Last Name**: Studentin`,
              structuredThought: {
                functionCalls: [],
                isFinished: true,
              },
            },
          ],
          contextId: 'test-context-id',
          agentTools: mockAgentTools,
          agentName: 'test-agent',
        };

        const result = await getFriendlyResponse(
          routerProcess,
          aiProvider,
          logger,
        );

        expect(result).toBeDefined();
        expect(result).toContain('student');
        expect(result).toContain('Sabrina');
        expect(result).toContain('Studentin');

        expect(result).not.toContain('ORIGINAL_GOAL');
        expect(result).not.toContain('STATE_JSON');
        expect(result).not.toContain('TOOLS_SNAPSHOT');
        expect(result).not.toContain('DONE:');
        expect(result).not.toContain('CALL:');
        expect(result).not.toContain('SUMMARY:');

        expect(result).not.toContain('3');
      });
    });
  }
});
