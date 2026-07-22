// Snehal change
import mongoose from "mongoose";

const parentSessionAssignmentSchema = new mongoose.Schema({
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  module: { type: mongoose.Schema.Types.ObjectId, ref: "ParentModule", required: true },
  sessionNumber: { type: Number, required: true },
  status: { type: String, enum: ["Pending", "In Progress", "Completed"], default: "Pending" },
  assignedDate: Date,
  dueDate: Date,
  completedAt: Date,
  sessionDetails: {
    date: Date,
    duration: String,
    venue: String,
    parentsPresent: Number,
  },
  participants: [{
    parentName: String,
    childName: String,
    contact: String,
    attendance: { type: String, enum: ["Present", "Absent"] },
  }],
  feedback: {
    parentParticipation: Number,
    parentEngagement: Number,
    understandingLevel: String,
    questionsAsked: String,
    challengesFaced: String,
    suggestions: String,
    overallRating: Number,
    remarks: String,
  },
  photoUpload: { type: mongoose.Schema.Types.ObjectId, ref: "FileAsset" },
  attendanceSheetUpload: { type: mongoose.Schema.Types.ObjectId, ref: "FileAsset" },
}, { timestamps: true });

parentSessionAssignmentSchema.index({ teacher: 1, module: 1, sessionNumber: 1 }, { unique: true });

export const ParentSessionAssignment = mongoose.model("ParentSessionAssignment", parentSessionAssignmentSchema);