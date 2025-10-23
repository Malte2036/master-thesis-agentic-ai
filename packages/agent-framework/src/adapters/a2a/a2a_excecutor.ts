import { Task, TaskStatusUpdateEvent } from '@a2a-js/sdk';
import {
  AgentExecutor,
  ExecutionEventBus,
  RequestContext,
} from '@a2a-js/sdk/server';
import { RouterResponse } from '@master-thesis-agentic-ai/types';
import { randomUUID } from 'crypto';
import { Router } from '../../agent';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { getRouterResponseSummary } from '../../agent/react/get-router-response-summary';

// 1. Define your agent's logic as a AgentExecutor
export class MyAgentExecutor implements AgentExecutor {
  private cancelledTasks = new Set<string>();

  constructor(
    private readonly logger: Logger,
    private readonly getRouter: () => Promise<Router>,
    private readonly aiProvider: AIProvider,
  ) {}

  public cancelTask = async (
    taskId: string,
    eventBus: ExecutionEventBus,
  ): Promise<void> => {
    this.cancelledTasks.add(taskId);
    // The execute loop is responsible for publishing the final state
  };

  async execute(
    requestContext: RequestContext,
    eventBus: ExecutionEventBus,
  ): Promise<void> {
    const userMessage = requestContext.userMessage;
    const existingTask = requestContext.task;

    // Determine IDs for the task and context, from requestContext.
    const taskId = requestContext.taskId;
    const contextId = requestContext.contextId;

    const userMessageText = userMessage.parts
      .filter((part) => part.kind === 'text')
      .map((part) => part.text)
      .join('');

    this.logger.log(
      'Executing task:',
      taskId,
      'with context:',
      contextId,
      'and user message:',
      userMessageText,
    );

    if (!existingTask) {
      const initialTask: Task = {
        kind: 'task',
        id: taskId,
        contextId: contextId,
        status: {
          state: 'submitted',
          timestamp: new Date().toISOString(),
        },
        history: [userMessage],
        metadata: userMessage.metadata,
        artifacts: [], // Initialize artifacts array
      };
      eventBus.publish(initialTask);
    }

    // 2. Publish "working" status update
    const workingStatusUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: 'working',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: randomUUID().toString(),
          parts: [{ kind: 'text', text: 'Thinking...' }],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: false,
    };
    eventBus.publish(workingStatusUpdate);

    const router = await this.getRouter();
    const generator = router.routeQuestion(userMessageText, 5);
    let results: RouterResponse;
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        results = value;
        break;
      }

      this.logger.log('Step:', value);
    }

    const finalResponse = await getRouterResponseSummary(
      results,
      this.aiProvider,
      this.logger,
    );

    this.logger.log('Final response:', finalResponse);

    // 4. Publish final status update
    const finalUpdate: TaskStatusUpdateEvent = {
      kind: 'status-update',
      taskId: taskId,
      contextId: contextId,
      status: {
        state: 'completed',
        message: {
          kind: 'message',
          role: 'agent',
          messageId: randomUUID().toString(),
          parts: [
            {
              kind: 'text',
              text: finalResponse,
            },
          ],
          taskId: taskId,
          contextId: contextId,
        },
        timestamp: new Date().toISOString(),
      },
      final: true,
    };
    eventBus.publish(finalUpdate);
    eventBus.finished();
  }
}
