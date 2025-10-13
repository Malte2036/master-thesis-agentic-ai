import { z } from 'zod';
import { UserInfo } from './user';

export const includeUserInfoInResponseSchema = z.object({
  username: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the username in the response. Often this is an email address.',
    ),
  firstname: z
    .boolean()
    .nullish()
    .describe('Whether to include the first name in the response'),
  lastname: z
    .boolean()
    .nullish()
    .describe('Whether to include the last name in the response'),
  siteurl: z
    .boolean()
    .nullish()
    .describe('Whether to include the site url in the response'),
  userpictureurl: z
    .boolean()
    .nullish()
    .describe('Whether to include the user picture url in the response'),
  userlang: z
    .boolean()
    .nullish()
    .describe('Whether to include the user language in the response'),
});

export function filterUserInfo(
  data: UserInfo,
  include_in_response?: z.infer<typeof includeUserInfoInResponseSchema>,
): Partial<UserInfo> {
  const filteredUserInfo: Partial<UserInfo> = {};

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredUserInfo as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredUserInfo;
}
