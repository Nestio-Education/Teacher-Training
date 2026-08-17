import mongoose from "mongoose";

const ActivityBankSchema = new mongoose.Schema({
  activityId: { type: String, unique: true, index: true },
  sourceRowNumber: Number,
  milestone: String,
  activityName: String,
  duration: String,
  materialsRequired: String,
  developmentalDomain: String,
  purposeOfActivity: String,
  howToConduct: String,
  facilitatorRole: String,
  expectedLearningOutcomes: String,
  level: { type: String, index: true },
  type: { type: String, index: true },
  className: { type: String, index: true },
  ageGroup: String,
  status: { type: String, default: "Active", index: true },
  importBatchId: String,
  dayNumber: Number,
  learningObjectives: String,
  activities: String,
  resources: String,
  instructions: String,
  expectedOutput: String,
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }
}, { timestamps: true });

export const ActivityBank = mongoose.models.ActivityBank || mongoose.model("ActivityBank", ActivityBankSchema);
export default ActivityBank;
