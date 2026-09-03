import mongoose from "mongoose";

const classSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: true, index: true },
    name: { type: String, required: true },
    ageGroup: String,
    curriculumLevel: String,
    schedule: String,
    capacity: { type: Number, default: 0 },
    assessmentTitle: String,
    assessmentSubject: String,
    assessmentQuestions: { type: Number, default: 0 },
    assessmentPassMark: { type: Number, default: 60 },
    assessmentInstructions: String,
    assessmentStatus: { type: String, default: "active" },
    assessmentQuestionsList: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
        points: { type: Number, default: 1 },
      },
    ],
    lastUpdatedBy: {
      role: String,
      name: String,
      updatedAt: Date,
    },
  },
  { timestamps: true }
);

classSchema.index({ center: 1, name: 1 }, { unique: true });

export const ClassModel = mongoose.model("Class", classSchema);
