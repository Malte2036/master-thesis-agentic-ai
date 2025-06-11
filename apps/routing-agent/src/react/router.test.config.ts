import {
  ListToolsResult,
  MCPClient,
} from '@master-thesis-agentic-rag/agent-framework';

export const TEST_AI_PROVIDERS: {
  provider: 'ollama' | 'groq';
  model: string;
  structuredModel?: string;
}[] = [
  // ollama models
  // { provider: 'ollama', model: 'llama3.1:8b' },
  // { provider: 'ollama', model: 'mistral:instruct' },
  { provider: 'ollama', model: 'qwen3:0.6b' },
  // { provider: 'ollama', model: 'qwen3:1.7b' },
  // { provider: 'ollama', model: 'qwen3:4b' },
  // { provider: 'ollama', model: 'deepseek-r1:1.5b' },
  // { provider: 'ollama', model: 'phi:2.7b' },

  // ollama with custom structured model
  { provider: 'ollama', model: 'qwen3:0.6b', structuredModel: 'phi:2.7b' },

  // groq models
  // { provider: 'groq', model: 'qwen-qwq-32b' },
  // { provider: 'groq', model: 'deepseek-r1:1.5b' },
];

export const createAgentTools = (): Record<string, ListToolsResult> =>
  ({
    'moodle-agent': {
      tools: [
        {
          name: 'find-course-id',
          description:
            'Find the course ID for a specific course from Moodle by its name',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseName: { type: 'string' },
            },
            required: ['courseName'],
          },
        },
        {
          name: 'get-course-info',
          description: 'Get information about a specific course from Moodle',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseId: { type: 'number' },
            },
            required: ['courseId'],
          },
        },
        {
          name: 'get-assignments',
          description: 'Get assignments for a specific course from Moodle',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseId: { type: 'number' },
            },
            required: ['courseId'],
          },
        },
      ],
    },
    'library-agent': {
      tools: [
        {
          name: 'search-resources',
          description: 'Search for academic books and papers',
          inputSchema: {
            type: 'object' as const,
            properties: {
              query: { type: 'string' },
              resourceType: { type: 'string' },
              yearFrom: { type: 'number' },
              maxResults: { type: 'number' },
            },
            required: ['query'],
          },
        },
      ],
    },
  }) satisfies Record<string, ListToolsResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockAgents = (jestInstance: any): MCPClient[] => {
  const agentTools = createAgentTools();

  return Object.entries(agentTools).map(
    ([agentName, toolsResult]) =>
      ({
        name: agentName,
        listTools: jestInstance.fn().mockResolvedValue({
          tools: toolsResult.tools.map(
            (tool: ListToolsResult['tools'][number]) => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema.properties,
            }),
          ),
        }),
      }) satisfies Partial<MCPClient> as MCPClient,
  );
};

export const EXAMPLE_AGENT_RESPONSES = {
  getAllCourses: {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({
          courses: [
            {
              id: 1405,
              fullname: 'D3.1 Einführung Künstliche Intelligenz',
              displayname: 'D3.1 Einführung Künstliche Intelligenz',
              visible: 1,
              summary:
                '<div style="font-family:Arial, sans-serif;font-size:16px;" class="angebot filter-offer container-fluid"><div class="row"><div style="width:315px;"><img src="https://meinmoodle.hosting.medien.hs-duesseldorf.de/img/wpm-offer-images/1405-1741701474910.png" alt="Bild des Angebots" width="300" height="200" /><div class="figure-caption" style="margin-top:10px;">Robot reading a book</div></div><div class="col"><div class="d-flex justify-content-end"><div class="text-right"><b class="ml-2 filter-study-program-abbreviation">BMI</b></div></div><div style="width:80%;"><h3 class="filter-heading">D3.1 Einführung Künstliche Intelligenz</h3><span style="font-size:14px;" class="filter-lecturers"><span class="filter-examiner">Prof. Dr. Dennis Müller</span><span class="filter-supervisors"></span></span></div><div class="my-3 filter-description-short" style="white-space:pre-line;"><span></span><p>Künstliche Intelligenz ist in aller Munde. Aber was ist das eigentlich und wie können Maschinen lernen? In di',
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/164434/course/overviewfiles/ek.png',
              completed: false,
              startdate: 1696921200,
              enddate: 0,
              isfavourite: false,
              hidden: false,
            },
            {
              id: 1388,
              fullname: 'D4.1.1 Machine Perception und Tracking',
              displayname: 'D4.1.1 Machine Perception und Tracking',
              visible: 1,
              summary: null,
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/164021/course/overviewfiles/pedestriantracking.png',
              completed: false,
              startdate: 1681768800,
              enddate: 1713304800,
              isfavourite: false,
              hidden: false,
            },
            {
              id: 1389,
              fullname: 'D5.1.2: Advances in Intelligent Systems (ISS)',
              displayname: 'D5.1.2: Advances in Intelligent Systems (ISS)',
              visible: 1,
              summary: null,
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/164038/course/overviewfiles/aai.png',
              completed: false,
              startdate: 1696230000,
              enddate: 0,
              isfavourite: false,
              hidden: false,
            },
            {
              id: 1392,
              fullname: 'PF1.2 Designing Digital Health User Experience',
              displayname: 'PF1.2 Designing Digital Health User Experience',
              visible: 1,
              summary:
                '<p dir="ltr">Dieser Kurs ist Teil des PF 1 Digital Health und fokussiert die Gestaltung von Nutzerschnittstellen im Bereich der digitalen Gesundheit. Gerade bei Anwendungen für Ärzte und Therapeuten ist sowohl Präzision als auch eine gute Bedienbarkeit unabdingbar. Auf Seite der Patient*innen ist es häufig wichtig auf besondere Bedürfnisse (z.B. krankheits-, oder altersbedingt) einzugehen. Aber auch im Bereich der Anwendungen, z.B. Apps, für die Allgemeinheit, spielt eine gute User Experience eine Rolle bei der Auswahl von Anwendungen aus einem scheinbar unbegrenztem Angebot im App Store. Im Kurs lernt ihr die Grundlagen der UI / UX Gestaltung und Usability sowie Vorgehensweisen und Methoden wie man diese erreicht. </p>\r\n<p dir="ltr">Vorkenntnisse sind nicht erforderlich. </p>',
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/164058/course/generated/course.svg',
              completed: false,
              startdate: 1743458400,
              enddate: 0,
              isfavourite: true,
              hidden: false,
            },
            {
              id: 632,
              fullname: 'Sendezentrum',
              displayname: 'Sendezentrum',
              visible: 1,
              summary: null,
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/127455/course/overviewfiles/59b8059c85c81e9f2f7512361a227e86.webp.png',
              completed: false,
              startdate: 1718748000,
              enddate: 0,
              isfavourite: false,
              hidden: false,
            },
            {
              id: 690,
              fullname: 'Masterprojekt 1',
              displayname: 'Masterprojekt 1',
              visible: 1,
              summary: null,
              courseimage:
                'https://mdl.hs-duesseldorf.de/pluginfile.php/134715/course/generated/course.svg',
              completed: null,
              startdate: 1720130400,
              enddate: 0,
              isfavourite: false,
              hidden: false,
            },
          ],
        }),
      },
    ],
    isError: false,
  },
};
