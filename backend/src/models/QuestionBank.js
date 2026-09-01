// Start: Prajwal — Versioned Question Bank (backs the "+ Add New Assessment" upload flow)
import mongoose from "mongoose";

const questionBankItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },       // e.g. "p34_1" — must be unique within a bank
    title: { type: String, required: true },     // short question label
    milestone: { type: String, default: "" },
    targetAge: { type: String, default: "" },
    text: { type: String, required: true },      // the actual observation question
    ratingScale: { type: [String], default: undefined }, // omit to use app default (Not yet/Emerging/Achieved)
    activities: { type: [String], default: [] },
  },
  { _id: false }
);

const questionBankSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },        // e.g. "gross_fine_motor" — must match SECTION_ICONS keys on frontend
    number: { type: Number, required: true },
    title: { type: String, required: true },
    items: { type: [questionBankItemSchema], default: [] },
  },
  { _id: false }
);

const questionBankSchema = new mongoose.Schema(
  {
    ageGroup: { type: String, required: true, index: true }, // e.g. "3–4 Years" — must match AGE_GROUPS keys
    version: { type: Number, required: true },
    isActive: { type: Boolean, default: true, index: true },
    sourceFileName: { type: String, default: "" },
    sourceFileType: { type: String, enum: ["docx", "xlsx", "manual"], default: "manual" },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    sections: { type: [questionBankSectionSchema], default: [] },
  },
  { timestamps: true }
);

// Only one active version per age group at a time
questionBankSchema.index({ ageGroup: 1, isActive: 1 });
questionBankSchema.index({ ageGroup: 1, version: 1 }, { unique: true });

export const QuestionBank = mongoose.model("QuestionBank", questionBankSchema);
// End: Prajwal
