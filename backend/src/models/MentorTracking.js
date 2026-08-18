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
    // Optional skill/goal deadline — e.g. "class should know shapes by Aug 31"
    targetDate: { type: Date, default: null },
    // Skill domain this goal falls under
    category: {
      type: String,
      enum: ["Classroom Management", "Literacy", "Numeracy", "Social-Emotional", "Transitions", "Other"],
      default: "Other"
    },
    // Outcome recorded by mentor once target date passes
    outcome: {
      type: String,
      enum: ["pending", "met", "partially_met", "not_met"],
      default: "pending"
    },
    outcomeNotes: { type: String, default: "" },
    sourceReportId: { type: mongoose.Schema.Types.ObjectId, ref: "PDCAReport", default: null, index: true },
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

// ── Weekly Progress Report — submitted by Fellow against a specific goal ──
const weeklyReportSchema = new mongoose.Schema(
  {
    cycleId:   { type: mongoose.Schema.Types.ObjectId, ref: "PDCACycle", required: true, index: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    // ISO date string of the Monday of the reported week (e.g. "2025-08-12")
    weekOf:    { type: Date, required: true },
    report:    { type: String, required: true },
  },
  { timestamps: true }
);

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
export const WeeklyReport = mongoose.models.WeeklyReport || mongoose.model("WeeklyReport", weeklyReportSchema);