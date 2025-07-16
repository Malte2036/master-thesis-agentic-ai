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
import { Logger } from '../logger';
import { uuidv4 } from 'zod/v4';
import { A2AClient } from '@a2a-js/sdk/client';

export class AgentClient {
  private readonly client: A2AClient;

  constructor(
    private readonly logger: Logger,
    private port: number,
  ) {
    this.client = new A2AClient(`http://localhost:${this.port}`);
  }

  async call() {
    const messageId = uuidv4();
    let taskId: string | undefined;

    try {
      const sendParams: MessageSendParams = {
        message: {
          messageId: messageId.toString(),
          role: 'user',
          parts: [{ kind: 'text', text: 'Hello, agent!' }],
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
        this.logger.log('Get Task Result:', getTaskResult);
      }
    } catch (error) {
      this.logger.error('A2A Client Communication Error:', error);
    }
  }
}
