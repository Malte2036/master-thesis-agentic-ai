import { AgentCard } from '@a2a-js/sdk';
import {
  A2AExpressApp,
  AgentExecutor,
  DefaultRequestHandler,
  InMemoryTaskStore,
  TaskStore,
} from '@a2a-js/sdk/server';
import express from 'express';
import { Logger } from '../logger';
import { MyAgentExecutor } from './a2a_excecutor';

export type MinimalAgentCard = Pick<
  AgentCard,
  'name' | 'description' | 'version' | 'skills'
>;

export class A2AServer {
  private expressApp: express.Application;
  private card: AgentCard;

  constructor(
    private readonly logger: Logger,
    private port: number,
    card: MinimalAgentCard,
  ) {
    this.card = {
      ...card,
      url: `http://localhost:${this.port}`,
      capabilities: {
        streaming: false,
        pushNotifications: false,
        stateTransitionHistory: false, // Agent uses history
      },
      securitySchemes: undefined,
      security: undefined,
      defaultInputModes: ['text/plain'],
      defaultOutputModes: ['text/plain'],
      supportsAuthenticatedExtendedCard: false,
    } satisfies AgentCard;

    const taskStore: TaskStore = new InMemoryTaskStore();
    const agentExecutor: AgentExecutor = new MyAgentExecutor(this.logger);

    const requestHandler = new DefaultRequestHandler(
      this.card,
      taskStore,
      agentExecutor,
    );

    const appBuilder = new A2AExpressApp(requestHandler);
    this.expressApp = appBuilder.setupRoutes(express(), '');
  }

  listen(): Promise<void> {
    return new Promise((resolve) => {
      this.expressApp.listen(this.port, () => {
        this.logger.debug(
          `Agent is running on port ${this.port} for agent ${this.card.name}`,
        );
        this.logger.debug(
          `Agent Card: http://localhost:${this.port}/.well-known/agent.json`,
        );
        resolve();
      });
    });
  }
}
