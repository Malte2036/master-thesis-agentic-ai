import express from 'express';
import { routeQuestion } from './router';
import { getAgentPort } from '@master-thesis-agentic-rag/agent-framework';
const app = express();

// Add JSON parsing middleware
app.use(express.json());

console.log('Frontdoor agent is running');

app.post('/ask', async (req, res) => {
  const { prompt, moodle_token } = req.body;
  console.log('Received question:', prompt);

  try {
    const result = await routeQuestion(prompt, moodle_token);
    res.json(result);
  } catch (error) {
    console.error('Error processing question:', error);
    res.status(500).json({
      agent: 'error',
      response: 'An error occurred while processing your question.',
    });
  }
});

const port = getAgentPort('frontdoor-agent');

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
