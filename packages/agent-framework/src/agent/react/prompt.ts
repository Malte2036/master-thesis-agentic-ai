import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../services';
import { DefaultPrompt, RoutingAgentPrompt } from './prompts';
import { AgentTool } from './types';

export class ReActPrompt {
  public static getNaturalLanguageThoughtPrompt(
    extendedSystemPrompt: string,
    agentTools: AgentTool[],
    routerProcess: RouterProcess,
    agentName?: string,
  ): AIGenerateTextOptions {
    if (agentName === 'routing-agent') {
      return RoutingAgentPrompt.getNaturalLanguageThoughtPrompt(
        agentTools,
        routerProcess,
      );
    }
    return DefaultPrompt.getNaturalLanguageThoughtPrompt(
      extendedSystemPrompt,
      agentTools,
      routerProcess,
    );
  }

  public static getStructuredThoughtPrompt(
    agentTools: AgentTool[],
    agentName?: string,
  ): AIGenerateTextOptions {
    if (agentName === 'routing-agent') {
      return RoutingAgentPrompt.getStructuredThoughtPrompt(agentTools);
    }
    return DefaultPrompt.getStructuredThoughtPrompt(agentTools);
  }
}
