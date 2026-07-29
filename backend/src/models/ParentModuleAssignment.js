// New model — links a Parent Capacity Building module to a specific
// class and/or teacher, decided by the admin. Either class or teacher
// (or both) may be set — module is optional-single-field assignable.
import mongoose from "mongoose";

const parentModuleAssignmentSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: "ParentModule", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: false, default: null, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false, default: null, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Prevent the exact same module+class+teacher combination being created twice
parentModuleAssignmentSchema.index(
  { module: 1, class: 1, teacher: 1 },
  { unique: true, partialFilterExpression: { class: { $exists: true }, teacher: { $exists: true } } }
);

export const ParentModuleAssignment = mongoose.model("ParentModuleAssignment", parentModuleAssignmentSchema);