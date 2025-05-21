import express from 'express';
import {
  IAgentFramework,
  IAgentRequestHandler,
  RequestPayload,
  ResponseError,
} from '../index';
import cors from 'cors';

export class ExpressAgentAdapter implements IAgentFramework {
  private expressApp: express.Application;

  constructor(private port: number) {
    this.expressApp = express();
    // Add JSON parsing middleware
    this.expressApp.use(express.json());

    this.expressApp.use(cors());
  }

  listen(): Promise<void> {
    return new Promise(() => {
      const server = this.expressApp.listen(this.port, () => {
        console.log(`Server is running on port ${this.port}`);
      });

      // Handle server errors
      server.on('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE') {
          console.error(`Port ${this.port} is already in use`);
          process.exit(1);
        } else {
          console.error('Server error:', error);
        }
      });
    });
  }

  registerEndpoint(endpointName: string, handler: IAgentRequestHandler): void {
    this.expressApp.post(
      `/${endpointName}/`,
      (req: express.Request, res: express.Response) => {
        const payload: RequestPayload = {
          body: req.body,
        };

        const callback = (error?: Error | null, result?: unknown) => {
          if (error) {
            console.error(`Error handling endpoint ${endpointName}:`, error);
            const responseError = error as ResponseError;
            res.status(responseError.statusCode || 500).json({
              error: error.message || 'Internal server error',
            });
            return;
          }
          res.json(result);
        };

        const promise = handler(payload, callback);
        if (promise && typeof promise.catch === 'function') {
          promise.catch((err: Error) => {
            if (!res.headersSent) {
              console.error(
                `Unhandled promise rejection for endpoint ${endpointName}:`,
                err,
              );
              const responseError = err as ResponseError;
              res.status(responseError.statusCode || 500).json({
                error: err.message || 'Internal server error (async)',
              });
            }
          });
        }
      },
    );
  }
}
