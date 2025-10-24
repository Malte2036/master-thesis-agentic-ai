import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AgentConfig } from '../../config';
import {
  ListToolsRequest,
  ListToolsResultSchema,
  CallToolRequest,
  CallToolResultSchema,
  ListPromptsRequest,
  ListPromptsResultSchema,
  GetPromptRequest,
  GetPromptResultSchema,
  ListResourcesRequest,
  ListResourcesResultSchema,
  LoggingMessageNotificationSchema,
  ResourceListChangedNotificationSchema,
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
import { Logger } from '../../logger';

export class MCPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private sessionId?: string;

  constructor(
    private readonly logger: Logger,
    private agentConfig: AgentConfig,
  ) {
    this.client = new Client({
      name: this.agentConfig.name,
      version: '1.0.0',
    });

    this.transport = new StreamableHTTPClientTransport(
      new URL(
        `http://${this.agentConfig.hostname}:${this.agentConfig.port}/mcp`,
      ),
      {
        sessionId: this.sessionId,
      },
    );

    // Set up notification handlers
    this.client.setNotificationHandler(
      LoggingMessageNotificationSchema,
      (notification) => {
        this.logger.debug(
          `${notification.params.level} - ${notification.params.data}`,
        );
      },
    );

    this.client.setNotificationHandler(
      ResourceListChangedNotificationSchema,
      async () => {
        this.logger.debug('Resource list changed notification received');
        try {
          const resourcesResult = await this.client.request(
            {
              method: 'resources/list',
              params: {},
            },
            ListResourcesResultSchema,
          );
          this.logger.debug(
            'Available resources count:',
            resourcesResult.resources.length,
          );
        } catch (error) {
          this.logger.debug(
            'Failed to list resources after change notification:',
            error,
          );
        }
      },
    );
  }

  public get name() {
    return this.agentConfig.name;
  }

  async connect() {
    await this.client.connect(this.transport);
    this.sessionId = this.transport.sessionId;
    this.logger.debug(
      'Connected to MCP server with session ID:',
      this.sessionId,
    );
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close();
      this.logger.debug('Disconnected from MCP server');
    }
  }

  async terminateSession() {
    if (this.transport && this.transport.sessionId) {
      await this.transport.terminateSession();
      this.sessionId = undefined;
      this.logger.debug('Session terminated successfully');
    }
  }

  async getServerCapabilities() {
    return this.client.getServerCapabilities();
  }

  async listTools(): Promise<ListToolsResult> {
    const toolsRequest: ListToolsRequest = {
      method: 'tools/list',
    };
    return this.client.request(toolsRequest, ListToolsResultSchema);
  }

  async callTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<CallToolResult> {
    const request: CallToolRequest = {
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    return this.client.request(request, CallToolResultSchema);
  }

  async listPrompts() {
    const promptsRequest: ListPromptsRequest = {
      method: 'prompts/list',
      params: {},
    };
    return this.client.request(promptsRequest, ListPromptsResultSchema);
  }

  async getPrompt(name: string, args: Record<string, unknown>) {
    const promptRequest: GetPromptRequest = {
      method: 'prompts/get',
      params: {
        name,
        arguments: args as Record<string, string>,
      },
    };
    return this.client.request(promptRequest, GetPromptResultSchema);
  }

  async listResources() {
    const resourcesRequest: ListResourcesRequest = {
      method: 'resources/list',
      params: {},
    };
    return this.client.request(resourcesRequest, ListResourcesResultSchema);
  }
}
