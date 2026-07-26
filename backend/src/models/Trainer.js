import mongoose from "mongoose";

const trainerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    subject: {
      // primary expertise / subject shown on cards & headers
      type: String,
      required: true,
      trim: true,
    },
    qualification: {
      type: String,
      default: "Graduate",
    },
    linkedin: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    // Courses this trainer is assigned to teach.
    // Stored as plain course-name strings (NOT ObjectId refs) because the
    // frontend (AddTrainerModal / TrainerProfileView) sends and displays
    // these as plain strings, e.g. ["Maths", "Early Childhood Ed"].
    assignedCourses: {
      type: [String],
      default: [],
    },

    // Stat counters shown on trainer cards / KPI tiles
    courses: {
      type: Number,
      default: 0,
    },
    batches: {
      type: Number,
      default: 0,
    },
    sessions: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    // Stored as a display string (e.g. "26/07/2026") to match
    // `new Date().toLocaleDateString("en-IN")` used on the frontend.
    joined: {
      type: String,
    },

    // Role-restricted portal permissions toggled in the "Portal Access" tab
    portalAccess: {
      uploadContent: { type: Boolean, default: true },
      reviewAssignments: { type: Boolean, default: true },
      hostSessions: { type: Boolean, default: true },
      respondForum: { type: Boolean, default: true },
      viewOwnBatch: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

export const Trainer =
  mongoose.models.Trainer || mongoose.model("Trainer", trainerSchema);