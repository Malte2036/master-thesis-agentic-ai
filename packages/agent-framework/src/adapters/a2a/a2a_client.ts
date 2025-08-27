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

export class AgentClient {
  private readonly client: A2AClient;
  public readonly id: string;

  constructor(
    private readonly logger: Logger,
    private port: number,
  ) {
    this.client = new A2AClient(`http://localhost:${this.port}`);
    this.id = randomUUID();
  }

  async getAgentCard(): Promise<AgentCard> {
    return await this.client.getAgentCard();
  }

  async call(message: string): Promise<string> {
    const messageId = randomUUID();
    let taskId: string | undefined;

    this.logger.debug(
      `[AgentClient] Calling agent with messageId: ${messageId}`,
    );

    try {
      const sendParams: MessageSendParams = {
        message: {
          messageId: messageId,
          role: 'user',
          parts: [{ kind: 'text', text: message }],
          kind: 'message',
        },
      };

      const sendResponse: SendMessageResponse =
        await this.client.sendMessage(sendParams);

      const result = (sendResponse as SendMessageSuccessResponse).result;
      if (result.kind === 'task') {
        // The agent created a task.
        const taskResult = result as Task;
        this.logger.log('Send Message Result (Task):', taskResult);
        taskId = taskResult.id; // Save the task ID for the next call
      } else if (result.kind === 'message') {
        // The agent responded with a direct message.
        const messageResult = result as Message;
        this.logger.log('Send Message Result (Direct Message):', messageResult);
        // No task was created, so we can't get task status.
      }

      // 2. If a task was created, get its status.
      if (taskId) {
        const getParams: TaskQueryParams = { id: taskId };
        const getResponse: GetTaskResponse =
          await this.client.getTask(getParams);

        const getTaskResult = (getResponse as GetTaskSuccessResponse).result;

        const message = JSON.stringify(
          getTaskResult.status.message?.parts.map((part) => {
            if (part.kind === 'text') {
              return part.text;
            }
            return part;
          }),
          null,
          2,
        );
        this.logger.log('Get Task Result:', message);
        return message;
      }

      return 'We could not get the task result. Please try again.';
    } catch (error) {
      this.logger.error('A2A Client Communication Error:', error);
      return 'Due to an error, we could not get the task result. Please try again.';
    }
  }
}
