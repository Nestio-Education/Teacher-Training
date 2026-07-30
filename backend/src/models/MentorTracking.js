import mongoose from "mongoose";

const pdcaCycleSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleNumber: { type: Number, required: true },
    plan: { type: String, required: true },
    do: { type: String, required: true },
    check: { type: String, required: true },
    act: { type: String, required: true },
    status: { type: String, enum: ["In Progress", "Completed"], default: "Completed" },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const capstoneSubmissionSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    milestone: { type: Number, required: true },
    fileUrl: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const menteeObservationSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    observation: { type: String, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const PDCACycle = mongoose.model("PDCACycle", pdcaCycleSchema);
export const CapstoneSubmission = mongoose.model("CapstoneSubmission", capstoneSubmissionSchema);
export const MenteeObservation = mongoose.model("MenteeObservation", menteeObservationSchema);
