import { randomUUID } from 'crypto';

const WIREMOCK_URL = 'http://localhost:8082/__admin';
const MOODLE_WEBSERVICE_PATH = '/webservice/rest/server.php';

type CalendarPath = `/${string}`;

type BodyPattern = { contains?: string; equalToJson?: Record<string, any> };

type HeaderPattern = {
  [headerName: string]: {
    equalTo?: string;
    matches?: string;
    doesNotMatch?: string;
    contains?: string;
  };
};

type RequestBody = {
  method: string;
  urlPattern: string;
  headers: HeaderPattern;
  bodyPatterns?: BodyPattern[];
};

type Mapping = {
  request: {
    method: string;
    url: string;
    bodyPatterns?: BodyPattern[];
    headers?: HeaderPattern;
  };
  response: {
    status: number;
    jsonBody: any;
    headers: Record<string, string>;
  };
};

export class Wiremock {
  public static generateTestId(): string {
    return `test-${randomUUID()}`;
  }

  /**
   * Reset all mappings and requests in Wiremock
   */
  static async reset(): Promise<void> {
    await fetch(`${WIREMOCK_URL}/mappings/reset`, { method: 'POST' });
    await fetch(`${WIREMOCK_URL}/requests/reset`, { method: 'POST' });
  }

  /**
   * Add a new mapping to Wiremock
   */
  public static async addMapping(mapping: Mapping): Promise<void> {
    await fetch(`${WIREMOCK_URL}/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
  }

  /**
   * Count requests with the given method & URL pattern (and optional body patterns)
   */
  static async count(
    testId: string,
    method: string,
    urlPattern: string,
    bodyPatterns?: BodyPattern[],
  ): Promise<number> {
    const requestBody: RequestBody = {
      method,
      urlPattern,
      bodyPatterns,
      headers: { 'X-Context-Id': { equalTo: testId } },
    };

    const res = await fetch(`${WIREMOCK_URL}/requests/count`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
    const data = await res.json();

    return data.count;
  }

  // Moodle Wiremock helper methods
  static async addMoodleMapping<T>(
    testId: string,
    wsfunction: string,
    responseBody: T,
    args?: Record<string, string>,
  ): Promise<void> {
    const bodyPatterns: BodyPattern[] = [
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

    await Wiremock.addMapping({
      request: {
        method: 'POST',
        url: MOODLE_WEBSERVICE_PATH,
        bodyPatterns,
        headers: {
          'X-Context-Id': {
            equalTo: testId,
          },
        },
      },
      response: {
        status: 200,
        jsonBody: responseBody,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }

  public static async addMoodleLoginMapping(
    testId: string,
    token: string,
  ): Promise<void> {
    await Wiremock.addMapping({
      request: {
        method: 'POST',
        url: '/login/token.php',
        headers: {
          'X-Context-Id': {
            equalTo: testId,
          },
        },
      },

      response: {
        status: 200,
        jsonBody: { token },
        headers: {
          'Content-Type': 'application/json',
        },
      },
    });
  }

  /**
   * Count Moodle webservice requests with the given function and optional arguments
   */
  static async countMoodleRequests(
    testId: string,
    wsfunction: string,
    args?: Record<string, string>,
  ): Promise<number> {
    const bodyPatterns: BodyPattern[] = [
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

    return await Wiremock.count(
      testId,
      'POST',
      MOODLE_WEBSERVICE_PATH,
      bodyPatterns,
    );
  }

  // calendar Wiremock helper methods
  static async addCalendarMapping(
    url: CalendarPath,
    requestBody: any,
    responseBody: any,
  ): Promise<void> {
    await Wiremock.addMapping({
      request: {
        method: 'POST',
        url,
        bodyPatterns: requestBody ? [{ equalToJson: requestBody }] : undefined,
      },
      response: {
        status: 200,
        jsonBody: responseBody,
        headers: { 'Content-Type': 'application/json' },
      },
    });
  }

  static async countCalendarRequests(
    url: CalendarPath,
    requestBody: any,
  ): Promise<number> {
    return await Wiremock.count(
      'todo',
      'POST',
      url,
      requestBody
        ? [
            {
              equalToJson: requestBody,
            },
          ]
        : undefined,
    );
  }
}
