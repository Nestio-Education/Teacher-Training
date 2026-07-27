import { connectDb, disconnectDb } from "./db.js";
import { Course } from "./models/Course.js";

async function run() {
  await connectDb();

  // Unpublish the 2 old seeded courses that have only 1 topic
  const oldCourses = ["Curriculum Design & Lesson Planning", "Pre-Primary Teacher Training"];
  for (const title of oldCourses) {
    const result = await Course.findOneAndUpdate(
      { title },
      { $set: { status: "draft" } },
      { new: true }
    );
    if (result) {
      console.log(`✅ Set "${result.title}" to draft (was published, only 1 topic)`);
    } else {
      console.log(`⚠️  Course not found: "${title}"`);
    }
  }

  console.log("\nDone. New teachers will no longer receive these 2 old courses.");
  await disconnectDb();
}
run();
