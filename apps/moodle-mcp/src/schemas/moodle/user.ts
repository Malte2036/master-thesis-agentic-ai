import { z } from 'zod';

export const UserInfoSchema = z.object({
  userid: z.number().describe('User ID'),
  username: z.string().describe('Username'),
  firstname: z.string().describe('First Name'),
  lastname: z.string().describe('Last Name'),
  siteurl: z.string().describe('Site URL'),
  userpictureurl: z.string().optional().describe('User Picture URL'),
  userlang: z.string().optional().describe('User Language'),
});

export type UserInfo = z.infer<typeof UserInfoSchema>;
