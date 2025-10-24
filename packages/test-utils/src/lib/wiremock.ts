const WIREMOCK_URL = 'http://localhost:8081/__admin';
const MOODLE_WEBSERVICE_PATH = '/webservice/rest/server.php';

type CalendarPath = `/${string}`;

type BodyPattern = { contains?: string; equalToJson?: Record<string, any> };

type Mapping = {
  request: {
    method: string;
    url: string;
    bodyPatterns?: BodyPattern[];
  };
  response: {
    status: number;
    jsonBody: any;
    headers: Record<string, string>;
  };
};

export class Wiremock {
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
  private static async addMapping(mapping: Mapping): Promise<void> {
    await fetch(`${WIREMOCK_URL}/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
  }

  /**
   * Get all requests made to Wiremock
   */
  private static async getRequests(): Promise<any> {
    const res = await fetch(`${WIREMOCK_URL}/requests`);
    return res.json();
  }

  /**
   * Count requests with the given method & URL pattern (and optional body patterns)
   */
  static async count(
    method: string,
    urlPattern: string,
    bodyPatterns?: BodyPattern[],
  ): Promise<number> {
    const requestBody: any = { method, urlPattern };
    if (bodyPatterns) {
      requestBody.bodyPatterns = bodyPatterns;
    }

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

  /**
   * Count Moodle webservice requests with the given function and optional arguments
   */
  static async countMoodleRequests(
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

    return await Wiremock.count('POST', MOODLE_WEBSERVICE_PATH, bodyPatterns);
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
