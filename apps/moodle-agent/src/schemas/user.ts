import { z } from "zod";

export const UserInfoSchema = z.object({
  userid: z.number(),
  username: z.string(),
  firstname: z.string(),
  lastname: z.string(),
  siteurl: z.string(),
  userpictureurl: z.string().optional(),
  userlang: z.string().optional(),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;
