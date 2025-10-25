import {
  createA2AFramework,
  Logger,
  OllamaProvider,
  ReActRouter,
  Router,
} from '@master-thesis-agentic-ai/agent-framework';
import chalk from 'chalk';
import dotenv from 'dotenv';
dotenv.config();

const HOSTNAME = process.env.HOSTNAME || 'localhost';

const logger = new Logger({ agentName: 'moodle-agent' });

const AI_MODEL = process.env.AI_MODEL;
if (!AI_MODEL) {
  throw new Error('AI_MODEL is not set');
}
logger.log('Using AI model:', chalk.cyan(AI_MODEL));

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    model,
  });
};

export async function getRouter(model: string): Promise<Router> {
  const aiProvider = getAIProvider(model);
  const structuredAiProvider = aiProvider;
  return await ReActRouter.createWithMCP(
    aiProvider,
    structuredAiProvider,
    logger,
    'moodle-mcp',
    `
### Moodle Specific Instructions
- You are a highly skilled moodle expert, and only answer questions related to moodle.
- Moodle is a learning management system (LMS) that is used to create and manage online courses for universities.
- Moodle has courses (modules), assignments (tasks), and users (students and teachers).
- If someone speaks to you, he always mean something related to moodle.

- There are functions, which can be called to get information about the user, courses, assignments, etc.
- There are functions which apply to all courses, and functions which apply to a specific course.

### ✅ Examples

**User**: What can you do?  
**Thought**: The user is asking about my available capabilities. I will not execute anything, but describe the functions I have access to.  
**Final Answer**:  
I have the capability to:
- Get all enrolled courses using \`get_all_courses\` from the moodle-mcp agent.
- Search for specific courses using \`search_courses_by_name\`.
- Retrieve course contents with \`get_course_contents\`.
- Get all assignments using \`get_assignments_for_all_courses\`.
- Get assignments for a specific course using \`get_assignments_for_course\`.
- View personal user information via \`get_user_info\`.

---

**User**: Do I have any assignments due soon?  
**Thought**: The user is asking about their current assignments. I need to call a function to retrieve all their assignments.  
I will now use the \`get_assignments_for_all_courses\` function from the moodle-mcp agent and include assignment names and due dates to help answer the user’s question.

---

**User**: I’m looking for the course “Introduction to Psychology”  
**Thought**: The user wants to find a course by name. The course name is clearly specified.  
I will now use the \`search_courses_by_name\` function from the moodle-mcp agent with the course name “Introduction to Psychology” to retrieve the relevant course.

---

**User**: What courses am I enrolled in?  
**Thought**: The user wants a list of their enrolled courses. I can satisfy this by retrieving all their courses.  
I will now call the \`get_all_courses\` function from the moodle-mcp agent and include course names and summaries.

---

**User**: What do you know about me?  
**Thought**: The user is asking for information about themselves. I have a function for this.  
I will now use the \`get_user_info\` function from the moodle-mcp agent and include first name, last name, and user picture URL.

---

**User**: Can you show me what's inside my "Web Development" course?  
**Thought**: The user is requesting course contents. I need a course ID, which has not yet been provided.  
I cannot call \`get_course_contents\` from the moodle-mcp agent yet because I do not have the course ID. I will ask the user for the exact course ID or guide them to search for the course name first using \`search_courses_by_name\`.


    `,
  );
}

const agentFramework = createA2AFramework(
  logger,
  HOSTNAME,
  1234,
  {
    name: 'moodle-agent',
    description:
      'The Moodle Agent is a specialized AI assistant for Moodle Learning Management System (LMS) operations. It provides comprehensive access to course management, assignment tracking, and user information through a set of powerful MCP tools. The agent can retrieve all enrolled courses, search for specific courses by name, inspect detailed course contents, view assignments across all courses or for specific courses with optional date filtering, and access personal user information. It uses ReAct reasoning to intelligently route user requests to the appropriate Moodle API functions, making it an essential tool for students and educators navigating their Moodle environment.',
    version: '1.1.0',
    skills: [],
  },
  () => getRouter(AI_MODEL),
  getAIProvider(AI_MODEL),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
