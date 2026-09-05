// backend/src/models/TeacherMonthChecklist.js
import mongoose from "mongoose";

const checkItemSchema = new mongoose.Schema({
  id: String,           // "activities", "lesson_plans", "courses", "assessments", "pcb_sessions"
  label: String,        // "Activities", "Lesson Plans", etc.
  required: { type: Boolean, default: true },  // pcb_sessions = false (optional)
  met: { type: Boolean, default: false },      // auto-computed
  count: { type: Number, default: 0 },         // how many done
  target: { type: Number, default: 1 },        // how many needed to tick
  mentorOverride: { type: Boolean, default: false }, // mentor manually set this
  mentorNote: { type: String, default: "" },
}, { _id: false });

const teacherMonthChecklistSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  month: { type: Number, required: true },   // 1-12 (calendar month)
  year: { type: Number, required: true },
  items: [checkItemSchema],
  lastComputedAt: Date,
}, { timestamps: true });

teacherMonthChecklistSchema.index({ teacherId: 1, month: 1, year: 1 }, { unique: true });

export const TeacherMonthChecklist = mongoose.model("TeacherMonthChecklist", teacherMonthChecklistSchema);