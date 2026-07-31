import mongoose from "mongoose";

const pdcaCycleSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // FIX: this field was missing entirely. The route creates cycles with a
    // menteeId and later calls cycle.populate("menteeId", "name email") —
    // without menteeId declared in the schema, Mongoose silently drops it on
    // create() (strict mode) and then throws a StrictPopulateError on the
    // populate() call, which is what was causing the generic 500.
    menteeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
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

// Cycle numbering is meant to be scoped per (mentor, mentee) - e.g. each
// fellow's own cycles start at 1 - so the uniqueness constraint should match
// that, not just (mentor, cycleNumber). Without menteeId in the index, two
// different fellows both getting "cycle 1" under the same mentor would
// collide on a duplicate-key error.
pdcaCycleSchema.index({ mentorId: 1, menteeId: 1, cycleNumber: 1 }, { unique: true });

const capstoneSubmissionSchema = new mongoose.Schema(
  {
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    milestone: { type: Number, required: true },
    fileUrl: { type: String },
    evidenceLink: { type: String },
    notes: { type: String },
    status: { type: String, enum: ["submitted", "approved", "rejected"], default: "submitted" },
    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
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

export const PDCACycle = mongoose.models.PDCACycle || mongoose.model("PDCACycle", pdcaCycleSchema);
export const CapstoneSubmission =
  mongoose.models.CapstoneSubmission || mongoose.model("CapstoneSubmission", capstoneSubmissionSchema);
export const MenteeObservation =
  mongoose.models.MenteeObservation || mongoose.model("MenteeObservation", menteeObservationSchema);