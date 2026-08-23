import express from "express";
import mongoose from "mongoose";
import { requireRole } from "../auth.js";
import { MentorTask } from "../models/MentorTask.js";
import { User } from "../models/User.js";

const router = express.Router();

// ── POST /api/mentor-tasks — Mentor creates a task for a fellow ──
router.post("/", requireRole("mentor"), async (req, res, next) => {
  try {
    const { fellowId, month, title, description } = req.body;
    if (!fellowId || !title?.trim() || !month) {
      return res.status(400).json({ success: false, message: "fellowId, month, and title are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(fellowId)) {
      return res.status(400).json({ success: false, message: "Invalid fellowId." });
    }

    // Verify fellow belongs to this mentor
    const fellow = await User.findById(fellowId);
    if (!fellow) return res.status(404).json({ success: false, message: "Fellow not found." });

    const task = await MentorTask.create({
      mentorId: req.user.id,
      fellowId,
      month: Number(month),
      title: title.trim(),
      description: description?.trim() || "",
    });

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentor-tasks?fellowId=&month= — Mentor fetches tasks they assigned ──
router.get("/", requireRole("mentor"), async (req, res, next) => {
  try {
    const query = { mentorId: req.user.id };
    if (req.query.fellowId) query.fellowId = req.query.fellowId;
    if (req.query.month) query.month = Number(req.query.month);

    const tasks = await MentorTask.find(query)
      .populate("fellowId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/mentor-tasks/fellow?month= — Fellow fetches tasks assigned to them ──
router.get("/fellow", requireRole("fellow", "teacher"), async (req, res, next) => {
  try {
    const query = { fellowId: req.user.id };
    if (req.query.month) query.month = Number(req.query.month);

    const tasks = await MentorTask.find(query)
      .populate("mentorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, tasks });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mentor-tasks/:taskId/evidence — Fellow submits evidence ──
router.put("/:taskId/evidence", requireRole("fellow", "teacher"), async (req, res, next) => {
  try {
    const { text, photoUrl, formLink } = req.body;
    if (!text?.trim() && !photoUrl?.trim() && !formLink?.trim()) {
      return res.status(400).json({ success: false, message: "At least one evidence field (text, photoUrl, or formLink) is required." });
    }

    const task = await MentorTask.findOne({ _id: req.params.taskId, fellowId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    task.evidence = {
      text: text?.trim() || "",
      photoUrl: photoUrl?.trim() || "",
      formLink: formLink?.trim() || "",
      submittedAt: new Date(),
    };
    task.status = "submitted";
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mentor-tasks/:taskId/review — Mentor approves/rejects evidence ──
router.put("/:taskId/review", requireRole("mentor"), async (req, res, next) => {
  try {
    const { status } = req.body; // "approved" | "pending"
    const task = await MentorTask.findOne({ _id: req.params.taskId, mentorId: req.user.id });
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    task.status = status === "approved" ? "approved" : "pending";
    task.reviewedAt = new Date();
    await task.save();

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

export default router;