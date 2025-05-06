import express from "express";
import dotenv from "dotenv";
import { MoodleProvider } from "./providers/moodleProvider";
import { RequestData, RequestDataSchema } from "./schemas/request/request";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const moodleProvider = new MoodleProvider(process.env.MOODLE_BASE_URL!);

const parseRequest = (req: express.Request): RequestData => {
  const parsed = RequestDataSchema.safeParse(req.query);
  if (!parsed.success) {
    console.error(parsed.error);
    throw new Error("Invalid request");
  }
  return parsed.data;
};

app.get("/courses/", async (req, res) => {
  const requestData = parseRequest(req);
  const userInfo = await moodleProvider.getUserInfo(requestData.moodle_token);
  if (!userInfo) {
    res.status(400).json({ error: "User info not found" });
    return;
  }

  const courses = await moodleProvider.getEnrolledCourses(
    requestData.moodle_token,
    userInfo.userid
  );
  res.json(courses);
});

app.get("/assignments/", async (req, res) => {
  const requestData = parseRequest(req);
  const assignments = await moodleProvider.getAssignments(
    requestData.moodle_token
  );

  res.json(assignments);
});

app.get("/user/", async (req, res) => {
  const requestData = parseRequest(req);
  const userInfo = await moodleProvider.getUserInfo(requestData.moodle_token);
  res.json(userInfo);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
