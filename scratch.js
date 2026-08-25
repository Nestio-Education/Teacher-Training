import mongoose from "mongoose";
import { Note } from "./backend/src/models/CourseNote.js";
import { Course } from "./backend/src/models/Course.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/nestio"); // or whatever DB uri
  // Let's find any notes in the system and print their structure
  const notes = await Note.find().limit(5);
  console.log("Found notes:", JSON.stringify(notes, null, 2));
  mongoose.disconnect();
}
run();
