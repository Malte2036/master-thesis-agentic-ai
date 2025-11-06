import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import cors from 'cors';
import express, { Request, Response } from 'express';
import { AgentConfig } from '../../config';
import { Logger } from '../../logger';

export type AuthRoutes = {
  authEndpoint: (req: Request, res: Response) => void;
  authCallbackEndpoint: (req: Request, res: Response) => void;
};

export class McpServerAgentAdapter {
  private expressApp: express.Application;
  private mcpServer: McpServer;

  constructor(
    private readonly logger: Logger,
    private agentConfig: AgentConfig,
    private readonly authRoutes: AuthRoutes | undefined,
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

    // Enable CORS for all routes
    this.expressApp.use(cors());

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

    this.expressApp.get('/health', (req, res) => {
      res.send('OK');
    });

    // Handle both GET and POST for /auth
    // GET is used for OAuth redirects (calendar)
    // POST is used for direct authentication (moodle)
    this.expressApp.get(
      '/auth',
      this.authRoutes?.authEndpoint ??
        ((req, res) => {
          res.status(404).send('Not found');
        }),
    );
    this.expressApp.post(
      '/auth',
      this.authRoutes?.authEndpoint ??
        ((req, res) => {
          res.status(404).send('Not found');
        }),
    );

    this.expressApp.get(
      '/auth/callback',
      this.authRoutes?.authCallbackEndpoint ??
        ((req, res) => {
          res.status(404).send('Not found');
        }),
    );
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
