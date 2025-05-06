import { RequestPayload } from './request';

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
