import {
  createA2AFramework,
  Logger,
  OllamaProvider,
  ReActRouter,
  Router,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const logger = new Logger({ agentName: 'moodle-agent' });

const MODEL = 'qwen3:4b';

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    model,
  });
};

async function getRouter(model: string): Promise<Router> {
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
- Get all assignments using \`get_all_assignments_for_all_courses\`.
- Get assignments for a specific course using \`get_assignments_for_course\`.
- View personal user information via \`get_user_info\`.

---

**User**: Do I have any assignments due soon?  
**Thought**: The user is asking about their current assignments. I need to call a function to retrieve all their assignments.  
I will now use the \`get_all_assignments_for_all_courses\` function from the moodle-mcp agent and include assignment names and due dates to help answer the user’s question.

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

getRouter(MODEL).then((router) => {
  const agentFramework = createA2AFramework(
    logger,
    1234,
    {
      name: 'moodle-agent',
      description:
        'The Moodle Agent helps you explore Moodle: list courses, find a course by name, inspect course contents, and see assignments across all or specific courses.',
      version: '1.1.0',
      skills: [
        {
          id: 'get-all-courses',
          name: 'Get All Courses',
          description:
            'List all courses the current user is enrolled in. Optionally include summary, image, display name, and start/end dates.',
          tags: ['moodle', 'courses'],
        },
        {
          id: 'search-courses-by-name',
          name: 'Search Courses by Name',
          description:
            'Find courses by full or partial name for the current user. Can work with whatever course information is available (e.g., name, ID).',
          tags: ['moodle', 'courses', 'search'],
        },
        {
          id: 'get-course-contents',
          name: 'Get Course Contents',
          description:
            'Retrieve the sections and modules of a specific course. Accepts any identifying info you have (course ID, name, etc.), or will try to resolve automatically. Can include module descriptions, names, and contents.',
          tags: ['moodle', 'courses', 'contents'],
        },
        {
          id: 'get-assignments-for-all-courses',
          name: 'Get Assignments for All Courses',
          description:
            'List assignments across all enrolled courses. Accepts optional filters (due_after/due_before) and extra fields like due date, grade, etc.',
          tags: ['moodle', 'assignments'],
        },
        {
          id: 'get-assignments-for-course',
          name: 'Get Assignments for a Course',
          description:
            'List assignments for a specific course. Can use any available course info (ID, name, etc.) or resolve automatically. Supports extra fields such as due date, grade, etc.',
          tags: ['moodle', 'assignments', 'courses'],
        },
        {
          id: 'get-moodle-user-info',
          name: 'Get Moodle User Info',
          description:
            'Retrieve profile information for the current user, such as firstname, lastname, username, and picture URL.',
          tags: ['moodle', 'user'],
        },
      ],
    },
    router,
    getAIProvider(MODEL),
  );

  agentFramework.listen().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
});
