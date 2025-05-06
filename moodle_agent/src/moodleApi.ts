import { z } from "zod";
import {
  AssignmentsResponse,
  AssignmentsResponseSchema,
} from "./schemas/assignment";
import { CoursesResponse, CoursesResponseSchema } from "./schemas/course";

const MOODLE_WEBSERVICE_PATH = "/webservice/rest/server.php";

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
async function callMoodleFunction<T>(
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

function verifyData<T>(data: unknown, schema: z.ZodSchema<T>): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new Error(`Failed to parse data: ${result.error}`);
  }

  return result.data;
}

export async function getAssignments(
  moodleBaseUrl: string,
  token: string
): Promise<AssignmentsResponse> {
  const data = await callMoodleFunction<unknown>(
    moodleBaseUrl,
    token,
    "mod_assign_get_assignments"
  );

  return verifyData(data, AssignmentsResponseSchema);
}

export async function getCourses(
  moodleBaseUrl: string,
  token: string
): Promise<CoursesResponse> {
  const data = await callMoodleFunction<unknown>(
    moodleBaseUrl,
    token,
    "core_course_get_courses"
  );

  return verifyData(data, CoursesResponseSchema);
}
