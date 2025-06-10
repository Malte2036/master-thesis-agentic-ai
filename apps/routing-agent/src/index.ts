import {
  OllamaProvider,
  Logger,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  ResponseError,
  RouterResponse,
  RouterResponseFriendly,
} from '@master-thesis-agentic-rag/types';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import { z } from 'zod/v4';
import { ReActRouter } from './react/router';
import { Router } from './router';
import { MongoDBService } from './services/mongodb.service';
import { ObjectId } from 'mongodb';

const logger = new Logger({ agentName: 'routing-agent' });

const OllamaBaseUrl = 'http://10.50.60.153:11434';

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    baseUrl: OllamaBaseUrl,
    model,
  });
};

// const getStructuredAIProvider = (model: string) => {
//   return new OllamaProvider({
//     baseUrl: 'http://localhost:11434',
//     model: 'Osmosis/Osmosis-Structure-0.6B:latest',
//   });
// };

const getRouter = (model: string, router?: 'legacy' | 'react'): Router => {
  const aiProvider = getAIProvider(model);
  const structuredAiProvider = aiProvider; //getStructuredAIProvider(model);
  return new ReActRouter(aiProvider, structuredAiProvider, logger);
};

const RequestBodySchema = z.object({
  prompt: z.string(),
  router: z.enum(['legacy', 'react']).optional().default('react'),
  max_iterations: z.number().optional().default(5),
  model: z.string().optional().default('mixtral:8x7b'),
});
type RequestBody = z.infer<typeof RequestBodySchema>;

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

expressApp.post('/ask', async (req, res) => {
  let body: RequestBody;
  try {
    const parsed = RequestBodySchema.safeParse(req.body);

    if (!parsed.success) {
      logger.error('Error parsing request body:', parsed.error);
      res.status(400).json({
        error: 'Missing required fields in request body',
      });
      return;
    }

    body = parsed.data;
  } catch (error) {
    logger.error('Error parsing request body:', error);
    res.status(400).json({
      error: 'Invalid request body',
    });
    return;
  }

  logger.log(chalk.cyan('--------------------------------'));
  logger.log(chalk.cyan('User question:'), body.prompt);
  logger.log(chalk.cyan('Using model:'), body.model);
  logger.log(chalk.cyan('Using router:'), body.router);
  logger.log(chalk.cyan('Using max iterations:'), body.max_iterations);
  logger.log(chalk.cyan('--------------------------------'));

  const routerResponseFriendly: RouterResponseFriendly = {
    friendlyResponse: '',
    process: {
      question: body.prompt,
      maxIterations: body.max_iterations,
      iterationHistory: [],
    },
    ai_model: body.model,
    error: undefined,
  };

  let database: MongoDBService;
  let databaseItemId: ObjectId;
  try {
    logger.log(chalk.magenta('Connecting to database:'));
    database = MongoDBService.getInstance(logger);
    await database.connect();
    logger.log(chalk.magenta('Creating router response friendly:'));
    const { insertedId } = await database.createRouterResponseFriendly(
      routerResponseFriendly,
    );
    databaseItemId = insertedId;
    logger.log(
      chalk.magenta('Router response friendly created:'),
      databaseItemId,
    );

    // Return the MongoDB ID immediately to the user
    res.json({
      id: databaseItemId.toString(),
      status: 'processing',
      message: 'Question received and processing started',
    });
  } catch (error) {
    logger.error('Error connecting to database:', error);
    res.status(500).json({
      error: 'An error occurred while connecting to the database.',
    });
    return;
  }

  // Continue processing in the background
  (async () => {
    try {
      logger.log(chalk.magenta('Routing question:'));
      const generator = getRouter(body.model, body.router).routeQuestion(
        body.prompt,
        body.max_iterations,
      );

      let results: RouterResponse;
      while (true) {
        const { done, value } = await generator.next();
        if (done) {
          results = value;
          break;
        }

        routerResponseFriendly.process = value;
        await database.updateRouterResponseFriendly(
          databaseItemId,
          routerResponseFriendly,
        );
      }

      results.process?.iterationHistory?.sort(
        (a, b) => a.iteration - b.iteration,
      );

      routerResponseFriendly.process = results.process;
      routerResponseFriendly.error = results.error;

      await database.updateRouterResponseFriendly(
        databaseItemId,
        routerResponseFriendly,
      );

      const aiProvider = getAIProvider(body.model);
      const friendlyResponse = await aiProvider.generateText(body.prompt, {
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant.
    You are given a user question and a list of steps the agent system has taken to answer that question.
    Each step includes a thought, an action (e.g. agent function call), and the corresponding result.
    
    Your task is to now respond to the original user question in a friendly, natural tone—while accurately summarizing what was done and what the current outcome is.
    
    You must:
    - Detect the language of the user's original question and answer in the same language.
    - Do not include id's, or other internal information, which are not relevant to the user.
    - Directly answer the user's question based on the available results.
    - Summarize the steps taken by the agents in a concise and understandable way.
    - Include any relevant numbers, course names, assignment titles, deadlines, etc., where appropriate. Do not make up any information.
    - If something failed (e.g. an agent call or calendar entry), explain what happened and suggest what the user could do next.
    - If the goal was achieved, clearly state that and include key results.
    - Keep the answer short, helpful, and user-facing. Do not expose internal logs or tool names.

    Format:
    - Use markdown formatting for your response.
    - Use bullet points for lists.
    - Use bold for important information.
    - Use italic for emphasis.
    - Use code blocks for code.
    - Use links for external resources.
    - Use tables for structured data.
    
    The agent execution results:
    ${JSON.stringify(results, null, 2)}
    `,
          },
        ],
      });

      logger.log(chalk.green('Friendly response:'), friendlyResponse);
      routerResponseFriendly.friendlyResponse = friendlyResponse;

      await database.updateRouterResponseFriendly(
        databaseItemId,
        routerResponseFriendly,
      );

      logger.log(chalk.green('Processing completed successfully'));
    } catch (error) {
      logger.error('Error processing question:', error);
      routerResponseFriendly.error =
        error instanceof Error
          ? error.message
          : 'An error occurred while processing your question.';

      await database
        .updateRouterResponseFriendly(databaseItemId, routerResponseFriendly)
        .catch((error) => {
          logger.error('Error updating router response friendly:', error);
        });
    }
  })(); // Close the async IIFE
});

expressApp.get('/models', async (req, res) => {
  try {
    const aiProvider = getAIProvider('qwen3:4b');
    const models = await aiProvider.getModels();
    res.json(models);
  } catch (error) {
    logger.error('Error getting models:', error);
    res.status(500).json({ error: 'An error occurred while getting models.' });
  }
});

// Start the server and keep it running
expressApp.listen(3000, () => {
  logger.log(`Server is running on port 3000`);
});
