import mongoose from "mongoose";

const childFeedbackSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true, index: true },
    childName: String,
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    teacherName: String,
    strengths: String,
    areasNeedingSupport: String,
    recommendation: String,
    rawInput: String,
    status: { type: String, default: "submitted" },
    reviewStatus: { type: String, enum: ["pending", "reviewed"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export const ChildFeedback = mongoose.model("ChildFeedback", childFeedbackSchema);