import mongoose from "mongoose";

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
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ["homework", "exam", "workshop", "class", "tech", "admin_assigned"],
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
    }
  },
  { timestamps: true }
);

export const TeacherTask = mongoose.model("TeacherTask", teacherTaskSchema);
