export interface IAgentCallback {
  (error?: Error | null, result?: unknown): void;
}

export interface IAgentRequestHandler {
  (payload: RequestPayload, callback: IAgentCallback): Promise<void> | void;
}

export interface IAgentFramework {
  registerEndpoint(endpointName: string, handler: IAgentRequestHandler): void;
  listen(): Promise<void>;
}

export interface RequestPayload {
  query: Record<string, string>;
  params: Record<string, string>;
  body: unknown;
}

export interface ResponseError extends Error {
  statusCode: number;
}

export const createResponseError = (
  message: string,
  statusCode: number,
): ResponseError => {
  const error = new Error(message) as ResponseError;
  error.statusCode = statusCode;
  return error;
};

import { ExpressAgentAdapter } from './adapters/express';

const getPort = (agentName: string): number => {
  switch (agentName) {
    case 'moodle-agent':
      return 3000;
    default:
      return 3001;
  }
};

export function createAgentFramework(agentName: string): IAgentFramework {
  return new ExpressAgentAdapter(getPort(agentName));
}
