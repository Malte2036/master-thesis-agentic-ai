import { z } from 'zod';
import { Course, SearchCourse } from './course';

export const includeCourseInResponseSchema = z
  .object({
    summary: z
      .boolean()
      .nullish()
      .describe('Whether to include the course summary in the response'),
    courseimage: z
      .boolean()
      .nullish()
      .describe('Whether to include the course image in the response'),
    displayname: z
      .boolean()
      .nullish()
      .describe('Whether to include the course display name in the response'),
    completed: z
      .boolean()
      .nullish()
      .describe(
        'Whether to include the course completed status in the response',
      ),
    startdate: z
      .boolean()
      .nullish()
      .describe('Whether to include the course start date in the response'),
    enddate: z
      .boolean()
      .nullish()
      .describe('Whether to include the course end date in the response'),
    isfavourite: z
      .boolean()
      .nullish()
      .describe(
        'Whether to include the course favourite status in the response',
      ),
    hidden: z
      .boolean()
      .nullish()
      .describe('Whether to include the course hidden status in the response'),
  })
  .nullish();

export const filterCourse = (
  data: Partial<Course & SearchCourse>,
  include_in_response?: z.infer<typeof includeCourseInResponseSchema>,
): Partial<Course> => {
  const filteredCourse: Partial<Course> = {
    id: data.id,
    fullname: data.fullname,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredCourse as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredCourse;
};
