import mongoose from "mongoose";

// A single week's focus line, e.g. "Week 1: System & Community Immersion — ...".
const weeklyFocusSchema = new mongoose.Schema(
  { week: { type: Number, required: true }, focus: { type: String, required: true, trim: true } },
  { _id: false }
);

// One trackable deliverable for the month, e.g. "Anganwadi Visits (min. 4)".
// keywords are the lowercase substrings matched against Fellow submission/task
// text to auto-detect whether it's been done (same matching approach as the
// original hand-written MONTH1_DELIVERABLES).
const deliverableDefSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    keywords: [{ type: String, trim: true, lowercase: true }],
    targetCount: { type: Number, default: null }, // null = "at least one", N = "at least N"
  },
  { _id: false }
);

// One success-check criterion, e.g. "4 Anganwadi visits completed".
// linkedDeliverableId, if set, lets the "do" section be auto-assessed from
// real logged data (mirrors the old hand-written DO_CRITERION_TO_DELIVERABLE
// map) — "check" criteria are always left null since they require judgement.
const criterionSchema = new mongoose.Schema(
  { criterion: { type: String, required: true, trim: true }, linkedDeliverableId: { type: String, default: null } },
  { _id: false }
);

const monthCurriculumSchema = new mongoose.Schema(
  {
    month: { type: Number, required: true, unique: true, index: true },
    curriculumVersion: { type: String, default: "v1" },

    monthlyObjective: { type: String, required: true, trim: true },
    weeklyFocus: [weeklyFocusSchema],
    deliverables: [deliverableDefSchema],
    successCheck: {
      plan: [criterionSchema],
      do: [criterionSchema],
      check: [criterionSchema],
      act: [criterionSchema],
    },

    // Provenance of the uploaded source doc this was parsed from.
    sourceFileName: { type: String, default: null },
    aiProvider: { type: String, default: null }, // "groq" | "gemini" | null (manually authored)

    // Drafts can be reviewed/edited before going live; the PDCA generator
    // only reads curricula with status "published".
    status: { type: String, enum: ["draft", "published"], default: "draft" },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: Date,
  },
  { timestamps: true }
);

export const MonthCurriculum =
  mongoose.models.MonthCurriculum || mongoose.model("MonthCurriculum", monthCurriculumSchema);