// Snehal change
import express from "express";
import { ParentSessionAssignment } from "../models/ParentSessionAssignment.js";
import { ParentModule } from "../models/ParentModule.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// GET assignments for the logged-in teacher for a given module
// Auto-creates a "Pending" assignment record for any session that doesn't have one yet.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { moduleId } = req.query;
    if (!moduleId) return res.status(400).json({ message: "moduleId is required" });

    const mod = await ParentModule.findById(moduleId);
    if (!mod) return res.status(404).json({ message: "Module not found" });

    const existing = await ParentSessionAssignment.find({ teacher: req.user.id, module: moduleId });
    const existingBySession = new Map(existing.map((a) => [a.sessionNumber, a]));

    const missing = (mod.sessions || [])
      .filter((s) => !existingBySession.has(s.sessionNumber))
      .map((s) => ({
        teacher: req.user.id,
        module: moduleId,
        sessionNumber: s.sessionNumber,
        status: "Pending",
        assignedDate: new Date(),
      }));

    let created = [];
    if (missing.length) {
      created = await ParentSessionAssignment.insertMany(missing, { ordered: false }).catch(() => []);
    }

    const all = [...existing, ...created];
    res.json({ success: true, assignments: all });
  } catch (error) {
    next(error);
  }
});

// POST feedback for a session assignment — saves feedback, marks status Completed
router.post("/:id/feedback", requireAuth, async (req, res, next) => {
  try {
    const assignment = await ParentSessionAssignment.findOne({ _id: req.params.id, teacher: req.user.id });
    if (!assignment) return res.status(404).json({ message: "Session assignment not found" });

    const { sessionDetails, participants, feedback, photoUploadId, attendanceSheetUploadId } = req.body;

    if (sessionDetails) assignment.sessionDetails = sessionDetails;
    if (participants) assignment.participants = participants;
    if (feedback) assignment.feedback = feedback;
    if (photoUploadId) assignment.photoUpload = photoUploadId;
    if (attendanceSheetUploadId) assignment.attendanceSheetUpload = attendanceSheetUploadId;

    assignment.status = "Completed";
    assignment.completedAt = new Date();

    await assignment.save();
    res.json({ success: true, assignment });
  } catch (error) {
    next(error);
  }
});

export default router;