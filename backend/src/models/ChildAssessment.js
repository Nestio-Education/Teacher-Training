// Start: Dnyaneshwari Thorat
import mongoose from "mongoose";

const childAssessmentSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true, index: true },
    stage: { type: String, enum: ["Baseline", "Midline", "Endline"], required: true },
    answers: { type: Map, of: String, default: {} },
    overallStatus: { type: String, default: "" },
    otherStatusText: { type: String, default: "" },
    recommendation: { type: String, default: "" },
    nextAssessmentDate: Date,
    assessmentDate: Date,
    sectionScores: [
      {
        id: String,
        title: String,
        score: Number,
        max: Number,
      }
    ],
  },
  { timestamps: true }
);

childAssessmentSchema.index({ child: 1, stage: 1 }, { unique: true });

export const ChildAssessment = mongoose.model("ChildAssessment", childAssessmentSchema);
// End: Dnyaneshwari Thorat
