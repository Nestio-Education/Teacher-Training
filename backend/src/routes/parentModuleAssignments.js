// New route — Admin assigns Parent Capacity Building modules to a
// teacher for a specific class. Only admin/super_admin can create or
// remove assignments. Any authenticated user can list them (needed so
// the admin UI can show current assignments per module).
import express from "express";
import { ParentModuleAssignment } from "../models/ParentModuleAssignment.js";
import { ParentModule } from "../models/ParentModule.js";
import { User } from "../models/User.js";
import { ClassModel } from "../models/Class.js";
import { requireAuth, requireRole } from "../auth.js";

const router = express.Router();

// GET assignments, optionally filtered by moduleId — used by the admin
// UI to show who a module is currently assigned to.
router.get("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { moduleId } = req.query;
    const filter = {};
    if (moduleId) filter.module = moduleId;

    const assignments = await ParentModuleAssignment.find(filter)
      .populate("teacher", "name email")
      .populate("class", "name ageGroup")
      .sort({ createdAt: -1 });

    res.json({ success: true, assignments });
  } catch (error) {
    next(error);
  }
});

// POST create a new assignment: module + class + teacher
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { moduleId, classId, teacherId } = req.body;
    if (!moduleId || !classId || !teacherId) {
      return res.status(400).json({ message: "moduleId, classId and teacherId are required" });
    }

    const [mod, cls, teacher] = await Promise.all([
      ParentModule.findById(moduleId),
      ClassModel.findById(classId),
      User.findById(teacherId),
    ]);
    if (!mod) return res.status(404).json({ message: "Module not found" });
    if (!cls) return res.status(404).json({ message: "Class not found" });
    if (!teacher || teacher.role !== "teacher") {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const assignment = await ParentModuleAssignment.create({
      module: moduleId,
      class: classId,
      teacher: teacherId,
      assignedBy: req.user.id,
    });

    res.status(201).json({ success: true, assignment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This module is already assigned to this teacher for this class." });
    }
    next(error);
  }
});

// DELETE remove an assignment (unassign)
router.delete("/:id", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const assignment = await ParentModuleAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    res.json({ success: true, message: "Assignment removed" });
  } catch (error) {
    next(error);
  }
});

export default router;