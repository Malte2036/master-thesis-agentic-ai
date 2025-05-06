import express from "express";
import dotenv from "dotenv";
import { getAssignments, getCourses } from "./moodleApi";
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.get("/courses/", async (_req, res) => {
  const courses = await getCourses(
    process.env.MOODLE_BASE_URL!,
    process.env.MOODLE_TOKEN!
  );
  res.json(courses);
});

app.get("/assignments/", async (req, res) => {
  const assignments = await getAssignments(
    process.env.MOODLE_BASE_URL!,
    process.env.MOODLE_TOKEN!
  );

  res.json(assignments);
});

app.listen(port, () => {
  if (!process.env.MOODLE_BASE_URL || !process.env.MOODLE_TOKEN) {
    console.error("MOODLE_BASE_URL or MOODLE_TOKEN is not set");
    process.exit(1);
  }

  console.log(`Server is running at http://localhost:${port}`);
});
