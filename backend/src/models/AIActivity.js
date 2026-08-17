import mongoose from "mongoose";

const aiActivitySchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true },
    ageGroup: { type: String, required: true },
    duration: { type: String, required: true },
    objective: { type: String, required: true },
    activities: [{ type: String, required: true }],
    materials: [{ type: String }],
    provider: { type: String }, // mistral/gemini/local
    generatedAt: { type: Date },
    savedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  { timestamps: true }
);

export const AIActivity = mongoose.models.AIActivity || mongoose.model("AIActivity", aiActivitySchema);
export default AIActivity;
