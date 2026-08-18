import mongoose from "mongoose";

// One "section" = one PDCA field (Plan/Do/Check/Act). We keep the AI's
// original text and the mentor's (possibly edited) text separately so we
// can always answer "which parts were AI-drafted vs Mentor-edited" —
// required by Section 9 of the AI_PDCA_Generator dev plan.
const sectionSchema = new mongoose.Schema(
  {
    aiText: { type: String, default: "" },
    mentorText: { type: String, default: "" },
    isAIDrafted: { type: Boolean, default: false },
    isMentorEdited: { type: Boolean, default: false },
  },
  { _id: false }
);

const deliverableStatusSchema = new mongoose.Schema(
  {
    id: String,
    label: String,
    status: {
      type: String,
      enum: ["met", "not_met", "needs_mentor_review"],
      default: "not_met",
    },
    count: Number,
    aiNote: String,
    mentorOverride: { type: Boolean, default: false },
  },
  { _id: false }
);

const pdcaReportSchema = new mongoose.Schema(
  {
    fellowId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    month: { type: Number, default: 1 }, // scoped to Month 1 for this phase, per the doc
    curriculumVersion: { type: String, default: "Month1-v1" },

    sections: {
      plan: sectionSchema,
      do: sectionSchema,
      check: sectionSchema,
      act: sectionSchema,
    },

    deliverablesStatus: [deliverableStatusSchema],
    // Which of plan/do/check/act had too little data for the AI to write
    // a real paragraph — Section 4/9 "low-data" handling.
    lowDataFields: [{ type: String, enum: ["plan", "do", "check", "act"] }],

    aiProvider: { type: String, default: null }, // "groq" | "gemini" | null
    aiAvailable: { type: Boolean, default: false },
    aiGeneratedAt: { type: Date },

    // Section 7: "Automatic carry-forward of Family Identification List
    // entries into Month 2 setup once the Month 1 report is approved."
    // Month 2 doesn't exist in the system yet, so this just stores the
    // matched entries on the report, ready to be pulled in once it does.
    familyIdentificationCarryForward: [{ type: String }],

    status: { type: String, enum: ["draft", "approved"], default: "draft" },
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// One report per fellow per month — generating again just updates the draft.
pdcaReportSchema.index({ fellowId: 1, month: 1 }, { unique: true });

export const PDCAReport =
  mongoose.models.PDCAReport || mongoose.model("PDCAReport", pdcaReportSchema);