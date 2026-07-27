// New model — links a Parent Capacity Building module to a specific
// class and teacher, decided by the admin. A module is visible to a
// teacher only if an assignment exists for that teacher (and class).
import mongoose from "mongoose";

const parentModuleAssignmentSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: "ParentModule", required: true, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// Prevent the same module being assigned twice to the same teacher+class
parentModuleAssignmentSchema.index({ module: 1, class: 1, teacher: 1 }, { unique: true });

export const ParentModuleAssignment = mongoose.model("ParentModuleAssignment", parentModuleAssignmentSchema);