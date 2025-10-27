import { z } from 'zod';
import {
  AssignmentsResponse,
  AssignmentsResponseSchema,
} from '../schemas/moodle/assignment';
import {
  CoursesResponse,
  CoursesResponseSchema,
  MinimalCourse,
  SearchCoursesResponse,
  SearchCoursesResponseSchema,
} from '../schemas/moodle/course';
import {
  CourseContentsResponse,
  CourseContentsResponseSchema,
} from '../schemas/moodle/course_content';
import { UserInfo, UserInfoSchema } from '../schemas/moodle/user';
import { Logger } from '@master-thesis-agentic-ai/agent-framework';

const MOODLE_WEBSERVICE_PATH = '/webservice/rest/server.php';
const MOODLE_SERVICE_NAME = 'custom_rest_api';

export class MoodleProvider {
  constructor(
    private readonly logger: Logger,
    private readonly moodleBaseUrl: string,
    private readonly contextId: string,
  ) {}

  public async getToken(username: string, password: string): Promise<string> {
    try {
      const response = await fetch(`${this.moodleBaseUrl}/login/token.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Context-Id': this.contextId,
        },
        body: new URLSearchParams({
          username: username,
          password: password,
          service: MOODLE_SERVICE_NAME,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${await response.text()}`,
        );
      }

      const data = await response.json();
      if (!data.token) {
        throw new Error(`Token not found in response: ${JSON.stringify(data)}`);
      }

      return data.token;
    } catch (error) {
      this.logger.error('Failed to get token:', error);
      throw error;
    }
  }

  /**
   * Generic function to call Moodle REST API functions
   *
   * @param moodleBaseUrl The base URL of the Moodle instance (e.g., 'http://localhost:8080')
   * @param token The Moodle web service token
   * @param wsfunction The name of the web service function to call
   * @param args Additional arguments to pass to the web service function
   * @returns A promise that resolves to the API response
   * @throws Will throw an error if the network response is not ok or if the API returns an error
   */
  private async callMoodleFunction<T>(
    token: string,
    wsfunction: string,
    args: Record<string, unknown> = {},
  ): Promise<T> {
    const MoodleUrl = `${this.moodleBaseUrl}${MOODLE_WEBSERVICE_PATH}`;
    const params = new URLSearchParams();
    params.append('wstoken', token);
    params.append('wsfunction', wsfunction);
    params.append('moodlewsrestformat', 'json');

    // Add any additional arguments
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Array) {
          value.forEach((item, i) => {
            params.append(`${key}[${i}]`, String(item));
          });
        } else {
          params.append(key, value.toString());
        }
      }
    });

    try {
      const response = await fetch(MoodleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Context-Id': this.contextId,
        },
        body: params.toString(),
      });

      if (!response.ok) {
        this.logger.error('HTTP error:', JSON.stringify(response, null, 2));
        throw new Error(
          `HTTP error! status: ${response.status} - ${await response.text()}`,
        );
      }

      const data = await response.json();

      // Moodle WS often returns error details within a 200 response
      if (data.exception || data.errorcode) {
        throw new Error(
          `Moodle API Error: ${data.message || data.exception} (Errorcode: ${
            data.errorcode
          })`,
        );
      }

      return data as T;
    } catch (error) {
      this.logger.error(`Failed to call Moodle function ${wsfunction}:`, error);

      throw error;
    }
  }

  private verifyData<T>(data: unknown, schema: z.ZodSchema<T>): T {
    const result = schema.safeParse(data);

    if (!result.success) {
      throw new Error(`Failed to parse data: ${result.error}`);
    }

    return result.data;
  }

  public async getUserInfo(token: string): Promise<UserInfo> {
    const data = await this.callMoodleFunction<unknown>(
      token,
      'core_webservice_get_site_info',
    );

    return this.verifyData(data, UserInfoSchema);
  }

  public async getEnrolledCourses(
    token: string,
    userid: number,
  ): Promise<CoursesResponse> {
    const data = await this.callMoodleFunction<unknown>(
      token,
      'core_enrol_get_users_courses',
      { userid: userid.toString() },
    );

    return this.verifyData(data, CoursesResponseSchema);
  }

  public async findCoursesByName(
    token: string,
    courseName: string,
  ): Promise<SearchCoursesResponse> {
    const data = await this.callMoodleFunction<unknown>(
      token,
      'core_course_search_courses',
      { criterianame: 'search', criteriavalue: courseName },
    );

    return this.verifyData(data, SearchCoursesResponseSchema);
  }

  public async getCourseContents(
    token: string,
    courseid: number,
  ): Promise<CourseContentsResponse> {
    const data = await this.callMoodleFunction<unknown>(
      token,
      'core_course_get_contents',
      { courseid: courseid.toString() },
    );

    return this.verifyData(data, CourseContentsResponseSchema);
  }

  public async getAssignments(
    token: string,
    courseIds?: number[],
  ): Promise<AssignmentsResponse> {
    const data = await this.callMoodleFunction<unknown>(
      token,
      'mod_assign_get_assignments',
      { courseids: courseIds },
    );

    return this.verifyData(data, AssignmentsResponseSchema);
  }

  public async getAssignmentsForCourse(
    token: string,
    courseid: number,
  ): Promise<MinimalCourse | undefined> {
    const response = await this.getAssignments(token, [courseid]);
    return response.courses[0];
  }
}
