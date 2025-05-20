import {
  createAgentFramework,
  createResponseError,
  IAgentRequestHandler,
  OpenAIProvider,
  ResponseError,
} from '@master-thesis-agentic-rag/agent-framework';
import { LegacyRouter } from './legacy/router';
import { ReActRouter } from './react/router';
import { Router } from './router';
import chalk from 'chalk';
import { z } from 'zod';

const agentFramework = createAgentFramework('routing-agent');

const aiProvider = new OpenAIProvider();
const legacyRouter = new LegacyRouter(aiProvider);
const reActRouter = new ReActRouter(aiProvider);

const getRouter = (router?: 'legacy' | 'react'): Router => {
  if (router === 'legacy') {
    return legacyRouter;
  }
  return reActRouter;
};

const FriendlyResponseSchema = z.object({
  friendlyResponse: z.string(),
});

type FriendlyResponse = z.infer<typeof FriendlyResponseSchema>;

const askHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const { prompt, moodle_token, router } = payload.body as {
      prompt: string;
      moodle_token: string;
      router?: 'legacy' | 'react';
    };

    if (!prompt || !moodle_token) {
      callback(
        createResponseError(
          'Missing required fields: prompt and moodle_token',
          400,
        ),
      );
      return;
    }

    console.log(chalk.cyan('--------------------------------'));
    console.log(chalk.cyan('User question:'), prompt);
    console.log(chalk.cyan('--------------------------------'));

    const results = await getRouter(router).routeQuestion(prompt, moodle_token);

    const friendlyResponse = await aiProvider.generateText<FriendlyResponse>(
      prompt,
      {
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant.
          You are given a question and a list of the steps the agent took to answer the question.
          You need to answer the question based on the results.

          The steps are:
          ${JSON.stringify(results, null, 2)}

          `,
          },
        ],
      },
      FriendlyResponseSchema,
    );

    console.log(
      chalk.green('Friendly response:'),
      friendlyResponse.friendlyResponse,
    );

    // console.log('Results are', results);
    callback(null, {
      router: router,
      friendlyResponse: friendlyResponse.friendlyResponse,
      results: results,
    });
  } catch (error) {
    console.error('Error processing question:', error);
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      if (!responseError.statusCode) {
        responseError.statusCode = 500;
      }
      callback(error);
    } else {
      callback(
        createResponseError(
          'An error occurred while processing your question.',
          500,
        ),
      );
    }
  }
};

agentFramework.registerEndpoint('ask', askHandler);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
