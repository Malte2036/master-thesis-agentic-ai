/* eslint-disable no-console */
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
  public readonly contextId: string;

  constructor(name: string) {
    this.contextId = `${randomUUID().slice(0, 8)}-${name.replace(/ /g, '-').toLowerCase().slice(0, 100)}`;
    console.debug(`Wiremock context ID: ${this.contextId}`);
  }

  private static generateContextId(): string {
    return `test-${randomUUID()}`;
  }

  public static async resetGlobal(): Promise<void> {
    await fetch(`${WIREMOCK_URL}/mappings/reset`, { method: 'POST' });
    await fetch(`${WIREMOCK_URL}/requests/reset`, { method: 'POST' });
  }

  /**
   * Add a new mapping to Wiremock
   */
  public async addMapping(mapping: Mapping): Promise<void> {
    mapping.request.headers = {
      ...mapping.request.headers,
      'X-Context-Id': { equalTo: this.contextId },
    };

    await fetch(`${WIREMOCK_URL}/mappings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
  }

  /**
   * Count requests with the given method & URL pattern (and optional body patterns)
   */
  async count(
    method: string,
    urlPattern: string,
    bodyPatterns?: BodyPattern[],
  ): Promise<number> {
    const requestBody: RequestBody = {
      method,
      urlPattern,
      bodyPatterns,
      headers: { 'X-Context-Id': { equalTo: this.contextId } },
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
  async addMoodleMapping<T>(
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

    await this.addMapping({
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

  public async addMoodleLoginMapping(token: string): Promise<void> {
    await this.addMapping({
      request: {
        method: 'POST',
        url: '/login/token.php',
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
  async countMoodleRequests(
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

    return await this.count('POST', MOODLE_WEBSERVICE_PATH, bodyPatterns);
  }

  // calendar Wiremock helper methods
  async addCalendarMapping(
    url: CalendarPath,
    requestBody: any,
    responseBody: any,
  ): Promise<void> {
    await this.addMapping({
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

  async countCalendarRequests(
    url: CalendarPath,
    requestBody: any,
  ): Promise<number> {
    return await this.count(
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
