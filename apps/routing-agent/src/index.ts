import {
  OllamaProvider,
  ResponseError,
  RouterResponse,
  RouterResponseFriendly,
} from '@master-thesis-agentic-rag/agent-framework';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import { z } from 'zod';
import { ReActRouter } from './react/router';
import { Router } from './router';
import { getAllAgentsMcpClients } from './agents/agent';

const aiProvider = new OllamaProvider({
  baseUrl: 'http://10.50.60.153:11434',
  // model: 'mixtral:8x7b',
  // model: 'llama3:8b',
  model: 'llama3.1:8b',
});
// const aiProvider = new OpenAIProvider();
// const legacyRouter = new LegacyRouter(aiProvider);
const reActRouter = new ReActRouter(aiProvider);

const getRouter = (router?: 'legacy' | 'react'): Router => {
  // if (router === 'legacy') {
  //   return legacyRouter;
  // }
  return reActRouter;
};

const FriendlyResponseSchema = z.object({
  friendlyResponse: z.string(),
});

type FriendlyResponse = z.infer<typeof FriendlyResponseSchema>;

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

expressApp.post('/ask', async (req, res) => {
  try {
    const {
      prompt,
      moodle_token,
      router,
      max_iterations = 5,
    } = req.body as {
      prompt: string;
      moodle_token: string;
      router?: 'legacy' | 'react';
      max_iterations?: number;
    };

    if (!prompt || !moodle_token) {
      res.status(400).json({
        error: 'Missing required fields: prompt and moodle_token',
      });
      return;
    }

    console.log(chalk.cyan('--------------------------------'));
    console.log(chalk.cyan('User question:'), prompt);
    console.log(chalk.cyan('--------------------------------'));

    const generator = getRouter(router).routeQuestion(
      prompt,
      moodle_token,
      max_iterations,
    );

    let results: RouterResponse;
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        results = value;
        break;
      }
      // console.log(chalk.magenta('Received result:'), value);
    }

    results.process?.iterationHistory?.sort(
      (a, b) => a.iteration - b.iteration,
    );

    const friendlyResponse = await aiProvider.generateText<FriendlyResponse>(
      prompt,
      {
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant.
    You are given a user question and a list of steps the agent system has taken to answer that question.
    Each step includes a thought, an action (e.g. agent function call), and the corresponding result.
    
    Your task is to now respond to the original user question in a friendly, natural tone—while accurately summarizing what was done and what the current outcome is.
    
    You must:
    - Directly answer the user's question based on the available results.
    - Summarize the steps taken by the agents in a concise and understandable way.
    - Include any relevant numbers, course names, assignment titles, deadlines, etc., where appropriate.
    - If something failed (e.g. an agent call or calendar entry), explain what happened and suggest what the user could do next.
    - If the goal was achieved, clearly state that and include key results.
    - Keep the answer short, helpful, and user-facing. Do not expose internal logs or tool names.
    
    The agent execution results:
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

    res.json({
      friendlyResponse: friendlyResponse.friendlyResponse,
      ai_model: aiProvider.model,
      process: results.process,
      error: results.error,
    } satisfies RouterResponseFriendly);
  } catch (error) {
    console.error('Error processing question:', error);
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      res.status(responseError.statusCode || 500).json({
        error:
          responseError.message ||
          'An error occurred while processing your question.',
      });
    } else {
      res.status(500).json({
        error: 'An error occurred while processing your question.',
      });
    }
  }
});

// Start the server and keep it running
expressApp.listen(3000, () => {
  console.log(`Server is running on port 3000`);
});
