import mongoose from "mongoose";

const reportAttachmentSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: "FileAsset" },
    name: String,
    url: String,
    uploadedAt: Date
  },
  { _id: false }
);

const teacherTaskSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    assignedByAdmin: {
      type: Boolean,
      default: false
    },
    assignedByMentor: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: [
        // Legacy categories (kept for backward compatibility with existing docs)
        "homework", "exam", "workshop", "class", "tech", "admin_assigned", "mentor_assigned",
        // Mentor and calendar categories used by the UI and reports
        "mentor_task", "class_lesson", "field_visit", "pcb_session", "pdca_deliverable", "self_learning", "custom_task"
      ],
      default: "homework"
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    startTime: {
      type: String, // HH:MM
      default: "11:30"
    },
    endTime: {
      type: String, // HH:MM
      default: "12:30"
    },
    time: {
      type: String // "11:30 - 12:30"
    },
    completed: {
      type: Boolean,
      default: false
    },
    // ── Report fields (Field Visit / PCB Session / other calendar-category reports) ──
    completionStatus: {
      type: String,
      enum: ["completed", "partial", "skipped"],
      default: undefined
    },
    reportNotes: {
      type: String,
      default: ""
    },
    reportAttachments: {
      type: [reportAttachmentSchema],
      default: []
    },
    pdcaPhase: {
      type: String,
      enum: ["plan", "do", "check", "act"],
      default: undefined
    },
    reportSubmittedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

export const TeacherTask = mongoose.model("TeacherTask", teacherTaskSchema);
