import { connectDb } from "./src/db.js";
import { MentorTask } from "./src/models/MentorTask.js";

async function main() {
  await connectDb();
  const tasks = await MentorTask.find().sort({ createdAt: -1 }).limit(3).lean();
  console.log(JSON.stringify(tasks, null, 2));
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});