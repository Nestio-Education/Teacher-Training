import mongoose from "mongoose";

const activitySubmissionSchema = new mongoose.Schema(
  {
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
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
    itemType: { type: String, enum: ["activity", "lesson", "task"], default: "activity", index: true },
    taskCategory: { type: String }, // e.g. "field_visit", "pcb_session" — only set when itemType === "task"
    sourceTeacherTask: { type: mongoose.Schema.Types.ObjectId, ref: "TeacherTask", index: true },
    ageGroup: { type: String },
    milestone: String,
    developmentalDomain: [String],
    groupMastery: { type: String, enum: ["Emerging", "Developing", "Mastered"], default: "Developing" },
    flaggedChildren: [
      {
        child: { type: mongoose.Schema.Types.ObjectId, ref: "Child" },
        childName: { type: String, required: true },
        status: { type: String, enum: ["needs_support", "advanced"], default: "needs_support" },
        note: String
      }
    ],
    followUpAction: { type: String, enum: ["proceed_next", "repeat_activity", "remediate_subgroup"], default: "proceed_next" },
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
    files: [mongoose.Schema.Types.Mixed],
    status: { type: String, enum: ["pending", "approved", "flagged", "rejected"], default: "pending", index: true },
    rating: { type: Number, default: 5 },
    adminComments: { type: String },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },

    // --- Phase 1: External Field Visit Support ---

    // Unregistered children/families visited during home or Anganwadi visits
    externalBeneficiaries: [
      {
        childName: { type: String, required: true },
        age: { type: Number },                    // age in years
        gender: { type: String, enum: ["male", "female", "other"] },
        parentName: { type: String },
        contactNumber: { type: String },
        visitType: {
          type: String,
          enum: ["home_visit", "anganwadi_visit", "govt_school_visit"],
          required: true
        },
        centerName: { type: String },             // Anganwadi / school name if applicable
        notes: { type: String },
        geotag: {
          lat: { type: Number },
          lng: { type: Number }
        }
      }
    ],

    // Aggregate counts for the visit — used for quick reporting and CSV export
    visitMetrics: {
      totalChildrenCount: { type: Number, default: 0 },
      parentsPresent: { type: Number, default: 0 },
      locationName: { type: String },
      centerName: { type: String }
    },

    // Google Sheets sync metadata — populated after export/webhook
    googleFormSyncStatus: {
      synced: { type: Boolean, default: false },
      syncedAt: { type: Date },
      sheetRowId: { type: String }              // row reference in the linked Google Sheet
    }
  },
  { timestamps: true }
);

export const ActivitySubmission = mongoose.model("ActivitySubmission", activitySubmissionSchema);