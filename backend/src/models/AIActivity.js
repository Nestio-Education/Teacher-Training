import mongoose from "mongoose";

const aiActivitySchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    ageGroup: {
      type: String,
      required: true
    },
    duration: {
      type: String,
      required: true
    },
    objective: {
      type: String,
      required: true
    },
    activities: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    materials: {
      type: [String],
      default: []
    },
    provider: {
      type: String,
      default: "local"
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    savedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending"
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const AIActivity = mongoose.model("AIActivity", aiActivitySchema);

export default AIActivity;