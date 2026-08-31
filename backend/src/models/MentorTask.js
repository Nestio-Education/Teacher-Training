import mongoose from "mongoose";

// Mentor-assigned custom learning tasks for specific fellows
const mentorTaskSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fellowId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: Number, required: true, min: 1, max: 24 },
    date: { type: String, default: () => new Date().toISOString().slice(0, 10) }, // YYYY-MM-DD — which calendar day this task shows on for the fellow
    title: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "submitted", "approved"], default: "pending" },
    // Fellow's evidence submission
    evidence: {
      text: { type: String, default: "" },
      photoUrl: { type: String, default: "" },  // base64 or uploaded URL
      formLink: { type: String, default: "" },
      submittedAt: { type: Date },
    },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

mentorTaskSchema.index({ mentorId: 1, fellowId: 1, month: 1 });

export const MentorTask =
  mongoose.models.MentorTask || mongoose.model("MentorTask", mentorTaskSchema);