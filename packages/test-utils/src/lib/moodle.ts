import { addMapping } from './wiremock';

const MOODLE_WEBSERVICE_PATH = '/webservice/rest/server.php';

export const addMoodleMapping = async <T>(
  wsfunction: string,
  responseBody: T,
  args?: Record<string, string>,
) => {
  const bodyPatterns: { contains: string }[] = [
    {
      contains: `wsfunction=${wsfunction}`,
    },
  ];

  if (args) {
    Object.entries(args).forEach(([key, value]) => {
      bodyPatterns.push({
        contains: new URLSearchParams({ [key]: value }).toString(),
      });
    });
  }

  bodyPatterns.push({
    contains: `moodlewsrestformat=json`,
  });

  await addMapping({
    request: {
      method: 'POST',
      url: MOODLE_WEBSERVICE_PATH,
      bodyPatterns,
    },
    response: {
      status: 200,
      jsonBody: responseBody,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  });
};
