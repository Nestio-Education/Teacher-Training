import mongoose from "mongoose";

const activitySubmissionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center" },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    lessonPlan: { type: mongoose.Schema.Types.ObjectId, ref: "LessonPlan" },
    activityBank: { type: mongoose.Schema.Types.ObjectId, ref: "ActivityBank" },
    activityDate: { type: Date, required: true, index: true },
    description: { type: String, required: true },
    activityName: { type: String },
    duration: { type: String },
    level: { type: String },
    type: { type: String },
    ageGroup: { type: String },
    milestone: String,
    developmentalDomain: String,
    purposeOfActivity: String,
    howToConduct: String,
    facilitatorRole: String,
    materialsRequired: { type: String },
    expectedLearningOutcomes: { type: String },
    dayNumber: { type: Number },
    learningObjectives: String,
    activities: String,
    resources: String,
    instructions: String,
    expectedOutput: String,
    notes: String,
    files: [{ type: mongoose.Schema.Types.ObjectId, ref: "FileAsset" }],
    status: { type: String, enum: ["pending", "approved", "flagged", "rejected"], default: "pending", index: true },
    adminComments: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

export const ActivitySubmission = mongoose.model("ActivitySubmission", activitySubmissionSchema);
