import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { AgentConfig } from '../config';
import express, { Request, Response } from 'express';
import { Logger } from '../logger';

export class McpServerAgentAdapter {
  private expressApp: express.Application;
  private mcpServer: McpServer;

  constructor(
    private readonly logger: Logger,
    private agentConfig: AgentConfig,
  ) {
    this.mcpServer = new McpServer(
      {
        name: agentConfig.name,
        version: '1.0.0',
        description: agentConfig.description,
      },
      { capabilities: { logging: {} } },
    );

    this.expressApp = express();
    this.expressApp.use(express.json());

    // Handle MCP requests
    this.expressApp.post('/mcp', async (req: Request, res: Response) => {
      try {
        this.logger.debug(
          'Received MCP request:',
          JSON.stringify(req.body, null, 2),
        );

        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
        });

        await this.mcpServer.connect(transport);
        await transport.handleRequest(req, res, req.body);

        res.on('close', () => {
          this.logger.debug('Request closed');
          transport.close();
        });
      } catch (error) {
        this.logger.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Handle GET requests to /mcp
    this.expressApp.get('/mcp', async (req: Request, res: Response) => {
      this.logger.debug('Received GET MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        }),
      );
    });

    // Handle DELETE requests to /mcp
    this.expressApp.delete('/mcp', async (req: Request, res: Response) => {
      this.logger.debug('Received DELETE MCP request');
      res.writeHead(405).end(
        JSON.stringify({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Method not allowed.',
          },
          id: null,
        }),
      );
    });

    // Register the functions endpoint
    this.expressApp.get('/functions', (req, res) => {
      const functions = this.agentConfig.functions.map((func) => ({
        name: func.name,
        description: func.description,
        parameters: func.parameters,
      }));
      res.json(functions);
    });
  }

  listen(): Promise<void> {
    return new Promise((resolve) => {
      this.expressApp.listen(this.agentConfig.port, () => {
        this.logger.debug(
          `Server is running on port ${this.agentConfig.port} for agent ${this.agentConfig.name}`,
        );
        resolve();
      });
    });
  }

  getServer(): McpServer {
    return this.mcpServer;
  }
}
