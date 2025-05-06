import { z } from "zod";
import {
  AssignmentsResponse,
  AssignmentsResponseSchema,
} from "../schemas/moodle/assignment";
import {
  CoursesResponse,
  CoursesResponseSchema,
} from "../schemas/moodle/course";
import { UserInfo, UserInfoSchema } from "../schemas/moodle/user";

const MOODLE_WEBSERVICE_PATH = "/webservice/rest/server.php";

export class MoodleProvider {
  constructor(private readonly moodleBaseUrl: string) {}

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
    args: Record<string, any> = {}
  ): Promise<T> {
    const MoodleUrl = `${moodleBaseUrl}${MOODLE_WEBSERVICE_PATH}`;

    const params = new URLSearchParams();
    params.append("wstoken", token);
    params.append("wsfunction", wsfunction);
    params.append("moodlewsrestformat", "json");

    // Add any additional arguments
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    try {
      const response = await fetch(MoodleUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${await response.text()}`
        );
      }

      const data = await response.json();

      // Moodle WS often returns error details within a 200 response
      if (data.exception || data.errorcode) {
        throw new Error(
          `Moodle API Error: ${data.message || data.exception} (Errorcode: ${
            data.errorcode
          })`
        );
      }

      return data as T;
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `Failed to call Moodle function ${wsfunction}:`,
          error.message
        );
      } else {
        console.error(`Failed to call Moodle function ${wsfunction}:`, error);
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

  public async getAssignments(token: string): Promise<AssignmentsResponse> {
    const data = await this.callMoodleFunction<unknown>(
      this.moodleBaseUrl,
      token,
      "mod_assign_get_assignments"
    );

    return this.verifyData(data, AssignmentsResponseSchema);
  }

  public async getEnrolledCourses(
    token: string,
    userid: number
  ): Promise<CoursesResponse> {
    const data = await this.callMoodleFunction<unknown>(
      this.moodleBaseUrl,
      token,
      "core_enrol_get_users_courses",
      { userid: userid.toString() }
    );

    return this.verifyData(data, CoursesResponseSchema);
  }

  public async getUserInfo(token: string): Promise<UserInfo> {
    const data = await this.callMoodleFunction<unknown>(
      this.moodleBaseUrl,
      token,
      "core_webservice_get_site_info"
    );

    return this.verifyData(data, UserInfoSchema);
  }
}
