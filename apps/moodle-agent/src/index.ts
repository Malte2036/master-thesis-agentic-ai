import express from "express";
import dotenv from "dotenv";
import { MoodleProvider } from "./moodleProvider";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const moodleProvider = new MoodleProvider(process.env.MOODLE_BASE_URL!);

app.get("/courses/", async (_req, res) => {
  const userInfo = await moodleProvider.getUserInfo(process.env.MOODLE_TOKEN!);
  if (!userInfo) {
    res.status(400).json({ error: "User info not found" });
    return;
  }

  const courses = await moodleProvider.getEnrolledCourses(
    process.env.MOODLE_TOKEN!,
    userInfo.userid
  );
  res.json(courses);
});

app.get("/assignments/", async (req, res) => {
  const assignments = await moodleProvider.getAssignments(
    process.env.MOODLE_TOKEN!
  );

  res.json(assignments);
});

app.get("/user/", async (_req, res) => {
  const userInfo = await moodleProvider.getUserInfo(process.env.MOODLE_TOKEN!);
  res.json(userInfo);
});

app.listen(port, () => {
  if (!process.env.MOODLE_BASE_URL || !process.env.MOODLE_TOKEN) {
    console.error("MOODLE_BASE_URL or MOODLE_TOKEN is not set");
    process.exit(1);
  }

  console.log(`Server is running at http://localhost:${port}`);
});
