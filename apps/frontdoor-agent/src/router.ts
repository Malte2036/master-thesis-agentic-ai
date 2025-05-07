import fetch from 'node-fetch';
import { getAgentUrl } from '@master-thesis-agentic-rag/agent-framework';
import { aiProvider } from '.';

interface AgentResponse {
  agent: string;
  response: unknown;
}

interface KeywordMapping {
  keyword: string;
  relatedTerms: string[];
}

async function detectKeyword(
  question: string,
  keywordMappings: KeywordMapping[],
): Promise<boolean> {
  const keywords = keywordMappings.map((mapping) => mapping.keyword);
  const relatedTermsList = keywordMappings
    .map((mapping) => `${mapping.keyword}: ${mapping.relatedTerms.join(', ')}`)
    .join('\n      - ');

  const prompt = `
  system:
  You are a precise topic detection assistant specialized in educational context. Your task is to analyze if a given question is related to specific keywords.
  
  Rules:
  1. Consider both direct mentions and contextual relevance
  2. Look for semantic relationships, not just exact matches
  3. Return ONLY "true" or "false" as your response
  4. Be conservative - only return true if there's a clear connection
  5. Consider the following keyword relationships:
      - ${relatedTermsList}
  
  Keywords to check: ${keywords.join(', ')}
  
  user:
  Question to analyze: "${question}"
  
  assistant:
  I will analyze if the question is related to any of the keywords and respond with either "true" or "false".
  `;
  console.log('Prompt is', prompt);
  const response = await aiProvider.generateText(prompt);
  console.log('AI Response is', response);

  return response.toLowerCase().includes('true');
}

export async function routeQuestion(
  question: string,
  moodle_token: string,
): Promise<AgentResponse> {
  // Check for Moodle-related keywords
  const keywordMappings: KeywordMapping[] = [
    {
      keyword: 'moodle',
      relatedTerms: ['LMS', 'Learning Management System', 'Moodle'],
    },
    {
      keyword: 'kurs',
      relatedTerms: [
        'Module',
        'Kurse',
        'Lehrveranstaltungen',
        'Studium',
        'Studien',
        'Lehrveranstaltung',
      ],
    },
  ];

  const isMoodleRelated = await detectKeyword(question, keywordMappings);
  console.log('isMoodleRelated', isMoodleRelated);

  if (isMoodleRelated) {
    try {
      const url = `${getAgentUrl('moodle-agent')}/courses`;

      // Forward the question to the Moodle agent
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: question,
          moodle_token: moodle_token,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        agent: 'moodle',
        response: data,
      };
    } catch (error) {
      console.error('Error forwarding to Moodle agent:', error);
      return {
        agent: 'moodle',
        response:
          'Sorry, there was an error processing your Moodle-related question.',
      };
    }
  }

  // Default response if no specific agent matches
  return {
    agent: 'default',
    response:
      'I could not determine which agent should handle your question. Please try rephrasing it.',
  };
}
