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

// POST create assignment(s): module + (class and/or teacher)
// - If teacherId is given (with or without classId) -> single assignment.
// - If only classId is given -> assign the module to EVERY teacher whose
//   teacherProfile.classes includes that class.
router.post("/", requireAuth, requireRole("admin", "super_admin"), async (req, res, next) => {
  try {
    const { moduleId, classId, teacherId } = req.body;

    if (!moduleId) {
      return res.status(400).json({ message: "moduleId is required" });
    }
    if (!classId && !teacherId) {
      return res.status(400).json({ message: "Select at least a teacher or a class" });
    }

    const mod = await ParentModule.findById(moduleId);
    if (!mod) return res.status(404).json({ message: "Module not found" });

    let cls = null;
    if (classId) {
      cls = await ClassModel.findById(classId);
      if (!cls) return res.status(404).json({ message: "Class not found" });
    }

    // Case 1: teacher explicitly chosen (with or without a class) —
    // single assignment.
    if (teacherId) {
      const teacher = await User.findById(teacherId);
      if (!teacher || teacher.role !== "teacher") {
        return res.status(404).json({ message: "Teacher not found" });
      }

      const assignment = await ParentModuleAssignment.create({
        module: moduleId,
        class: classId || null,
        teacher: teacherId,
        assignedBy: req.user.id,
      });

      return res.status(201).json({ success: true, assignment });
    }

    // Case 2: only a class was chosen — assign to every teacher who
    // has this class in their teacherProfile.classes.
    const teachersInClass = await User.find({
      role: "teacher",
      "teacherProfile.classes": classId,
    });

    if (teachersInClass.length === 0) {
      return res.status(404).json({ message: "No teachers are assigned to this class yet." });
    }

    const created = [];
    const skipped = [];
    for (const teacher of teachersInClass) {
      try {
        const assignment = await ParentModuleAssignment.create({
          module: moduleId,
          class: classId,
          teacher: teacher._id,
          assignedBy: req.user.id,
        });
        created.push(assignment);
      } catch (err) {
        if (err.code === 11000) {
          skipped.push(teacher._id); // already assigned — not an error
        } else {
          throw err;
        }
      }
    }

    return res.status(201).json({
      success: true,
      assignments: created,
      message: `Assigned to ${created.length} teacher(s) in this class${skipped.length ? `, ${skipped.length} already assigned` : ""}.`,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This assignment already exists." });
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