import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../../services';
import { AgentTool } from '../types';

export const BASE_PROMPTS: string[] = [
  `Some important information for you:
    - Current date and time: ${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })}

Important rules:
- Speak in the first person. Speak professionally.
- IMPORTANT: Do everything in English.
`,
];

export const createNaturalLanguageThoughtPrompt = (
  systemContent: string,
  agentTools: AgentTool[],
  routerProcess: RouterProcess,
): AIGenerateTextOptions => {
  return {
    messages: [
      ...BASE_PROMPTS.map((content) => ({
        role: 'system' as const,
        content,
      })),
      {
        role: 'system',
        content: systemContent,
      },
      {
        role: 'system',
        content: `
TOOLS SNAPSHOT:
${JSON.stringify(agentTools, null, 2)}
`,
      },
      {
        role: 'assistant',
        content: `Past actions and their results (oldest → newest):
${
  routerProcess.iterationHistory
    ?.map(
      (it) =>
        `Iteration ${it.iteration}
- Thought which justifies the next step: ${it.naturalLanguageThought}
- The function calls that were made: ${JSON.stringify(
          it.structuredThought.functionCalls,
          null,
          2,
        )}
- The response that was made after seeing the response of the function calls: ${
          it.response
        }
`,
    )
    .join('\n') ?? '— none —'
}
`,
      },
    ],
  };
};

const structuredPromptCoreIntent = `Follow these rules with absolute precision:

1) Identify the Core Intent
   • If the thought contains explicit action phrases like "I will call...", "I will use...", "I need to execute...", the intent is to **call a tool**. Proceed to Rule 2.
   • If the thought is a descriptive statement, a list of capabilities, or a direct message to the user (e.g., "I can do the following...", "Here are your assignments..."), the intent is to **provide a final answer**. Proceed to Rule 3.`;

export const createStructuredSystemContent = (
  intro: string,
  globalPolicy: string,
  toolCallGeneration: string,
  finalAnswerGeneration: string,
  examples: string,
) => {
  return `${intro}

${globalPolicy}

${structuredPromptCoreIntent}

${toolCallGeneration}

${finalAnswerGeneration}

---
${examples}

---
Now, parse the following thought with zero deviation from these rules.`;
};

export const createStructuredThoughtPrompt = (
  systemContent: string,
  agentTools: AgentTool[],
): AIGenerateTextOptions => ({
  messages: [
    {
      role: 'system',
      content: systemContent,
    },
    {
      role: 'system',
      content: `Possible function calls: ${JSON.stringify(
        agentTools,
        null,
        2,
      )}`,
    },
  ],
});
