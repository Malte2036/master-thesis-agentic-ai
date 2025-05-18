import { z } from 'zod';

export const ForumDiscussionSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const ForumIntroFileSchema = z.object({
  filename: z.string(),
  filepath: z.string(),
  filesize: z.number(),
  fileurl: z.string(),
  timemodified: z.number(),
  mimetype: z.string(),
  isexternalfile: z.boolean(),
  repositorytype: z.string(),
});

export const ForumSchema = z.object({
  id: z.number(),
  course: z.number(),
  type: z.string(),
  name: z.string(),
  intro: z.string(),
  introformat: z.number(),
  introfiles: z.array(ForumIntroFileSchema),
  duedate: z.number(),
  cutoffdate: z.number(),
  assessed: z.number(),
  assesstimestart: z.number(),
  assesstimefinish: z.number(),
  scale: z.number(),
  grade_forum: z.number(),
  grade_forum_notify: z.number(),
  maxbytes: z.number(),
  maxattachments: z.number(),
  forcesubscribe: z.number(),
  trackingtype: z.number(),
  rsstype: z.number(),
  rssarticles: z.number(),
  timemodified: z.number(),
  warnafter: z.number(),
  blockafter: z.number(),
  blockperiod: z.number(),
  completiondiscussions: z.number(),
  completionreplies: z.number(),
  completionposts: z.number(),
  cmid: z.number(),
  numdiscussions: z.number(),
  cancreatediscussions: z.boolean(),
  lockdiscussionafter: z.number(),
  istracked: z.boolean(),
  unreadpostscount: z.number(),
});

export const ForumDiscussionsResponseSchema = z.object({
  discussions: z.array(ForumDiscussionSchema),
});

export type ForumDiscussionsResponse = z.infer<
  typeof ForumDiscussionsResponseSchema
>;

export const ModForumGetForumsByCoursesResponseSchema = z.array(ForumSchema);

export type ModForumGetForumsByCoursesResponse = z.infer<
  typeof ModForumGetForumsByCoursesResponseSchema
>;
