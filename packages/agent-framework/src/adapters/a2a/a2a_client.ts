import {
  GetTaskResponse,
  GetTaskSuccessResponse,
  Message,
  MessageSendParams,
  SendMessageResponse,
  SendMessageSuccessResponse,
  Task,
  TaskQueryParams,
} from '@a2a-js/sdk';
import { Logger } from '../../logger';
import { randomUUID } from 'crypto';
import { A2AClient } from '@a2a-js/sdk/client';
import { AgentCard } from '@a2a-js/sdk';
import { z } from 'zod/v4';
import { RouterProcess } from '@master-thesis-agentic-ai/types';

// // undici-diagnostics.ts
// import dc from 'node:diagnostics_channel';
//
// dc.channel('undici:request:create').subscribe((msg: any) => {
//   const { request } = msg;
//   // Some undici versions expose .origin/.path, others via msg.info
//   const origin = request?.origin ?? msg?.info?.origin;
//   const method = request?.method ?? msg?.info?.method;
//   const path = request?.path ?? msg?.info?.path;
//   console.log(`[undici] ${method} ${origin}${path}`);
// });

// dc.channel('undici:request:error').subscribe((msg: any) => {
//   const { error } = msg;
//   console.error('[undici:error]', error);
// });

export class AgentClient {
  public readonly id: string;

  private constructor(
    private readonly logger: Logger,
    public readonly name: string,
    private readonly client: A2AClient,
  ) {
    this.id = randomUUID();
  }

  static async createFromUrl(
    logger: Logger,
    url: string,
  ): Promise<AgentClient> {
    if (!z.url().safeParse(url).success) {
      throw new Error('Invalid agent URL');
    }

    const a2aClient = new A2AClient(url);
    const agentCard = await a2aClient.getAgentCard();

    logger.debug(`Created agent client for ${agentCard.name}`);
    return new AgentClient(logger, agentCard.name, a2aClient);
  }

  async getAgentCard(): Promise<AgentCard> {
    return await this.client.getAgentCard();
  }

  async call(
    message: string,
    contextId: string,
  ): Promise<{ message: string; process: RouterProcess | undefined }> {
    const messageId = randomUUID();
    let taskId: string | undefined;

    this.logger.debug(
      `[AgentClient] Calling ${this.name} with messageId: ${messageId} and contextId: ${contextId}`,
    );

    try {
      const sendParams: MessageSendParams = {
        message: {
          messageId: messageId,
          role: 'user',
          parts: [{ kind: 'text', text: message }],
          kind: 'message',
          contextId,
        },
      };

      const sendResponse: SendMessageResponse =
        await this.client.sendMessage(sendParams);

      const result = (sendResponse as SendMessageSuccessResponse).result;
      if (result.kind === 'task') {
        // The agent created a task.
        const taskResult = result as Task;
        // this.logger.log('Send Message Result (Task):', taskResult);
        this.logger.debug('Send Message Result (Task):', taskResult.id);
        taskId = taskResult.id; // Save the task ID for the next call
      } else if (result.kind === 'message') {
        // The agent responded with a direct message.
        const messageResult = result as Message;
        this.logger.debug(
          'Send Message Result (Direct Message):',
          messageResult.messageId,
        );
        // No task was created, so we can't get task status.
      }

      // 2. If a task was created, get its status.
      if (taskId) {
        const getParams: TaskQueryParams = { id: taskId };
        const getResponse: GetTaskResponse =
          await this.client.getTask(getParams);

        const getTaskResult = (getResponse as GetTaskSuccessResponse).result;

        const process = getTaskResult.status.message?.parts.find(
          (part) => part.kind === 'data',
        )?.data as RouterProcess;
        const message = getTaskResult.status.message?.parts.find(
          (part) => part.kind === 'text',
        )?.text as string;

        return { message, process };
      }

      return {
        message: 'We could not get the task result. Please try again.',
        process: undefined,
      };
    } catch (error) {
      this.logger.error('A2A Client Communication Error:', error);
      return {
        message:
          'Due to an error, we could not get the task result. Please try again.',
        process: undefined,
      };
    }
  }
}
