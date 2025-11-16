import {
  addIterationToRouterProcess,
  AgentTool,
  RouterProcess,
  StructuredThoughtResponseWithResults,
  ToolCall,
} from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';

import { Logger } from '../../../logger';
import {
  Router,
  RouterAIOptions,
  RouterSystemPromptOptions,
  GeneratedThoughtsResponse,
} from '../../router';
import { getNaturalLanguageThought } from '../get-natural-language-thought';
import { getStructuredThought } from '../get-structured-thought';
import { getTodoThought } from '../get-todo-thought';

export abstract class ReActRouter extends Router {
  protected constructor(
    protected readonly logger: Logger,
    protected readonly aiOptions: RouterAIOptions,
    protected readonly systemPromptOptions: RouterSystemPromptOptions,
    protected readonly agentTools: AgentTool[],
  ) {
    super();
  }

  async *routeQuestion(
    question: string,
    maxIterations: number,
    contextId: string,
  ): AsyncGenerator<RouterProcess, RouterProcess, unknown> {
    const routerProcess: RouterProcess = {
      contextId,
      question,
      maxIterations,
      iterationHistory: [],
      agentTools: this.agentTools,
    };

    const generator = this.iterate(routerProcess);
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        if (this.disconnectClient) {
          await this.disconnectClient();
        }
        return value satisfies RouterProcess;
      }
      yield value satisfies RouterProcess;
    }
  }

  async *iterate(
    routerProcess: RouterProcess,
  ): AsyncGenerator<RouterProcess, RouterProcess, unknown> {
    const maxIterations = routerProcess.maxIterations;
    let currentIteration = routerProcess.iterationHistory?.length ?? 0;

    while (currentIteration < maxIterations) {
      this.logger.log(chalk.magenta('--------------------------------'));
      this.logger.log(
        chalk.cyan('Iteration'),
        currentIteration + 1,
        '/',
        maxIterations,
      );
      this.logger.log(chalk.magenta('--------------------------------'));

      const { naturalLanguageThought, todoThought, structuredThought } =
        await this.generateThoughts(routerProcess);

      if (structuredThought.isFinished) {
        this.logger.log(chalk.magenta('Finished'));

        routerProcess = addIterationToRouterProcess(
          routerProcess,
          currentIteration,
          naturalLanguageThought,
          todoThought,
          {
            isFinished: true,
            functionCalls: [],
          },
        );
        return routerProcess;
      }

      if (!structuredThought.functionCalls) {
        this.logger.log(chalk.magenta('No agent calls found.'));
        return this.setError(
          routerProcess,
          'No agent calls found. Please try rephrasing your question.',
        );
      }

      if (
        this.hasDuplicateFunctionCalls(
          routerProcess,
          structuredThought.functionCalls,
        )
      ) {
        this.logger.log(
          chalk.red(
            'Detected loop with repeated agent calls. But continuing the iteration.',
          ),
        );
        //   this.logger.log(
        //     chalk.red(
        //       'Detected loop with repeated agent calls. Breaking iteration. Wanted to call:',
        //     ),
        //     JSON.stringify(structuredThought.functionCalls, null, 2),
        //   );
        //   return {
        //     process: routerProcess,
        //     error:
        //       'I noticed we were repeating the same queries without progress.',
        //   };
      }

      this.logFunctionCalls(structuredThought.functionCalls);

      const agentResponses = await this.callClientInParallel(
        structuredThought.functionCalls,
        maxIterations - currentIteration - 1,
        routerProcess.contextId,
      );

      this.logger.debug(
        chalk.magenta('The response from calling the agent functions:'),
        JSON.stringify(
          agentResponses.map((response) => ({
            type: response.type,
            function: response.function,
            args: response.args,
            result: response.result,
          })),
          null,
          2,
        ),
      );

      const structuredThoughtWithResults: StructuredThoughtResponseWithResults =
        {
          ...structuredThought,
          functionCalls: agentResponses,
        };

      // const response = await this.observeAndSummarizeAgentResponses(
      //   routerProcess.question,
      //   structuredThought.agentCalls,
      //   agentResponses,
      //   structuredThought,
      // );

      // this.logger.log(
      //   chalk.magenta('Observation of the current iteration:'),
      //   chalk.yellow(response),
      // );

      // routerProcess = addIterationToRouterProcess(
      //   routerProcess,
      //   currentIteration,
      //   naturalLanguageThought,
      //   structuredThought,
      //   response,
      // );

      routerProcess = addIterationToRouterProcess(
        routerProcess,
        currentIteration,
        naturalLanguageThought,
        todoThought,
        structuredThoughtWithResults,
      );

      yield routerProcess;
      currentIteration++;
    }

    return this.setError(
      routerProcess,
      'Maximum number of iterations reached.',
    );
  }

  protected async generateThoughts(
    routerProcess: RouterProcess,
  ): Promise<GeneratedThoughtsResponse> {
    const todoThought = await getTodoThought(
      routerProcess,
      this.aiOptions.aiProvider,
      this.logger,
    );

    const naturalLanguageThought = await getNaturalLanguageThought(
      routerProcess,
      this.aiOptions.aiProvider,
      this.logger,
      this.systemPromptOptions.extendedNaturalLanguageThoughtSystemPrompt,
      todoThought,
    );

    const structuredThought = await getStructuredThought(
      naturalLanguageThought,
      this.agentTools,
      this.aiOptions.structuredAiProvider,
      this.logger,
    );

    return { naturalLanguageThought, todoThought, structuredThought };
  }

  private logFunctionCalls(functionCalls: ToolCall[]) {
    this.logger.log(chalk.cyan('Function calls:'));
    const flattenedCalls = functionCalls.flatMap((functionCall) => [
      {
        function: functionCall.function,
        parameters: JSON.stringify(functionCall.args, null, 2),
      },
    ]);
    this.logger.log(flattenedCalls);
  }

  private hasDuplicateFunctionCalls(
    routerProcess: RouterProcess,
    functionCalls: ToolCall[],
  ): boolean {
    // Serialize current agent calls to check for duplicates
    const currentFunctionCallsStr = JSON.stringify(
      functionCalls.map((a) => ({
        ...a,
        description: undefined,
      })),
    );
    // Check if we're repeating the same calls - detect loop
    return (
      routerProcess.iterationHistory?.some(
        (response) =>
          JSON.stringify(response.structuredThought.functionCalls) ===
          currentFunctionCallsStr,
      ) ?? false
    );
  }

  private setError(routerProcess: RouterProcess, error: string) {
    return {
      ...routerProcess,
      error,
    };
  }
}
