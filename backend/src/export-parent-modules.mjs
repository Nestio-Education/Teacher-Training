import mongoose from "mongoose";
import fs from "fs";
import { ParentModule } from "./models/ParentModule.js";

const mongoUri =
  process.env.MONGODB_URI ||
  "mongodb://127.0.0.1:27017/teacher_training_portal";

try {
  await mongoose.connect(mongoUri);

  console.log(`MongoDB connected: ${mongoose.connection.name}`);

  const modules = await ParentModule.find({})
    .sort({ moduleNumber: 1 })
    .lean();

  console.log(`Found ${modules.length} Parent Capacity Building modules`);

  const cleanModules = modules.map(({ _id, __v, createdAt, updatedAt, ...module }) => module);

  fs.writeFileSync(
    "src/parentModulesData.json",
    JSON.stringify(cleanModules, null, 2),
    "utf8"
  );

  console.log("Export completed successfully.");
  console.log("File created: src/parentModulesData.json");

  for (const module of cleanModules) {
    console.log(
      `Module ${module.moduleNumber}: ${module.title} | Sessions: ${module.sessions?.length || 0}`
    );
  }
} catch (error) {
  console.error("Export failed:", error);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
