import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    status: { type: String, enum: ["completed", "in_progress", "pending"], default: "pending" },
    duration: String,
  },
  { _id: true }
);

const curriculumUnitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subject: String,
    grade: String,
    status: { type: String, enum: ["active", "draft", "completed"], default: "active" },
    progress: { type: Number, default: 0 },
    topics: [topicSchema],
    resources: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CurriculumUnit = mongoose.model("CurriculumUnit", curriculumUnitSchema);
