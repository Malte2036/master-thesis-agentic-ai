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

export class MoodleProvider {
  constructor(
    private readonly logger: Logger,
    private readonly moodleBaseUrl: string,
  ) {}

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
    moodleBaseUrl: string,
    token: string,
    wsfunction: string,
    args: Record<string, unknown> = {},
  ): Promise<T> {
    const MoodleUrl = `${moodleBaseUrl}${MOODLE_WEBSERVICE_PATH}`;

    const params = new URLSearchParams();
    params.append('wstoken', token);
    params.append('wsfunction', wsfunction);
    params.append('moodlewsrestformat', 'json');

    // Add any additional arguments
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(MoodleUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
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
      if (error instanceof Error) {
        this.logger.error(
          `Failed to call Moodle function ${wsfunction}:`,
          error.message,
        );
      } else {
        this.logger.error(
          `Failed to call Moodle function ${wsfunction}:`,
          error,
        );
      }
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
      this.moodleBaseUrl,
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
      this.moodleBaseUrl,
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
      this.moodleBaseUrl,
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
      this.moodleBaseUrl,
      token,
      'core_course_get_contents',
      { courseid: courseid.toString() },
    );

    return this.verifyData(data, CourseContentsResponseSchema);
  }

  public async getAssignments(token: string): Promise<AssignmentsResponse> {
    const data = await this.callMoodleFunction<unknown>(
      this.moodleBaseUrl,
      token,
      'mod_assign_get_assignments',
    );

    return this.verifyData(data, AssignmentsResponseSchema);
  }

  public async getAssignmentsForCourse(
    token: string,
    courseid: number,
  ): Promise<MinimalCourse | undefined> {
    const assignments = await this.getAssignments(token);
    return assignments.courses.find((course) => course.id === courseid);
  }
}
