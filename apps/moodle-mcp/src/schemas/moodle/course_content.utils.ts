import { z } from 'zod';
import { CourseContent } from './course_content';

export const includeCourseContentInResponseSchema = z
  .object({
    summary: z.boolean().nullish(),
    modules: z
      .object({
        description: z
          .boolean()
          .nullish()
          .describe(
            'Whether to include the module description in the response',
          ),
        modname: z
          .boolean()
          .nullish()
          .describe('Whether to include the module name in the response'),
        contents: z
          .boolean()
          .nullish()
          .describe('Whether to include the module contents in the response'),
      })
      .nullish()
      .describe('Whether to include the module in the response'),
  })
  .nullish();

export function filterCourseContent(
  data: CourseContent,
  include_in_response?: z.infer<typeof includeCourseContentInResponseSchema>,
): Partial<CourseContent> | undefined {
  const filteredCourseContent: Partial<CourseContent> = {
    id: data.id,
    name: data.name,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      const valueToInclude = data[key as keyof typeof data];

      if (key === 'modules' && Array.isArray(valueToInclude)) {
        const modules = valueToInclude as CourseContent['modules'];
        // TODO: Filter modules by include_in_response
        filteredCourseContent.modules = modules;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (filteredCourseContent as any)[key] = valueToInclude;
      }
    }
  });

  return filteredCourseContent;
}
