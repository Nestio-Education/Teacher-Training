import express from "express";
import mongoose from "mongoose";
import { requireRole } from "../auth.js";
import { MentorTask } from "../models/MentorTask.js";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { createAndEmitNotification, emitToUser } from "../socket.js";

const router = express.Router();

// ── POST /api/mentor-tasks — Mentor creates a task for a fellow ──
router.post("/", requireRole("mentor"), async (req, res, next) => {
  try {
    const { fellowId, month, title, description, dueDate, dueTime } = req.body;
    if (!fellowId || !title?.trim() || !month) {
      return res.status(400).json({ success: false, message: "fellowId, month, and title are required." });
    }
    if (!mongoose.Types.ObjectId.isValid(fellowId)) {
      return res.status(400).json({ success: false, message: "Invalid fellowId." });
    }

    const fellow = await User.findById(fellowId);
    if (!fellow) return res.status(404).json({ success: false, message: "Fellow not found." });

    const task = await MentorTask.create({
      mentorId: req.user.id,
      fellowId,
      month: Number(month),
      date: date || new Date().toISOString().slice(0, 10),
      title: title.trim(),
      description: description?.trim() || "",
      dueDate: dueDate || "",
      dueTime: dueTime || "",
    });

    // Alert the fellow that a new task has been assigned to them.
    try {
      const scheduleText = dueTime ? ` It is scheduled for ${dueTime}${dueDate ? " on " + dueDate : ""}. You will receive a reminder 2 hours before.` : "";
      await createAndEmitNotification({
        recipientId: fellowId,
        title: "New Task Assigned",
        body: `${req.user.name || "Your mentor"} assigned you a new task: "${task.title}" (Month ${task.month}).${scheduleText}`,
        type: "assignment",
        metadata: { taskId: task._id, mentorId: req.user.id, notificationType: "mentor_task_assigned" },
      });
    } catch (notifyErr) {
      console.warn("Failed to send mentor_task_assigned notification:", notifyErr.message);
    }

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
      return res.status(400).json({ success: false, message: "At least one evidence field is required." });
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

    // Alert the mentor that this fellow has completed/submitted the task.
    try {
      await createAndEmitNotification({
        recipientId: task.mentorId,
        title: "Task Completed by Fellow",
        body: `${req.user.name || "A fellow"} completed the task "${task.title}" and submitted it for your review.`,
        type: "assignment",
        metadata: { taskId: task._id, fellowId: req.user.id, notificationType: "mentor_task_submitted" },
      });
    } catch (notifyErr) {
      console.warn("Failed to send mentor_task_submitted notification:", notifyErr.message);
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/mentor-tasks/:taskId/review — Mentor approves/rejects evidence ──
router.put("/:taskId/review", requireRole("mentor"), async (req, res, next) => {
  try {
    const { status } = req.body;
    const task = await MentorTask.findOne({ _id: req.params.taskId, mentorId: req.user.id }).populate("fellowId", "name");
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    task.status = status === "approved" ? "approved" : "pending";
    task.reviewedAt = new Date();
    await task.save();

    // Alert the fellow of the review outcome (bonus — keeps the loop closed).
    try {
      await createAndEmitNotification({
        recipientId: task.fellowId._id || task.fellowId,
        title: task.status === "approved" ? "Task Approved" : "Task Sent Back",
        body:
          task.status === "approved"
            ? `${req.user.name || "Your mentor"} approved your task "${task.title}".`
            : `${req.user.name || "Your mentor"} reviewed "${task.title}" and sent it back — please check and resubmit.`,
        type: "assignment",
        metadata: { taskId: task._id, mentorId: req.user.id, notificationType: "mentor_task_reviewed" },
      });
    } catch (notifyErr) {
      console.warn("Failed to send mentor_task_reviewed notification:", notifyErr.message);
    }

    res.json({ success: true, task });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/mentor-tasks/pdca — Send PDCA notification to mentor or fellow ──
router.post("/pdca", requireRole("mentor", "fellow", "teacher"), async (req, res, next) => {
  try {
    const { recipientId, type, title, body } = req.body;
    if (!recipientId || !title) {
      return res.status(400).json({ success: false, message: "recipientId and title are required." });
    }

    const notif = await Notification.create({
      recipient: recipientId,
      type: type || "pdca",
      title,
      body: body || "",
      read: false,
    });

    // Emit real-time via Socket.IO
    emitToUser(recipientId, "notification:new", notif);

    res.json({ success: true, notification: notif });
  } catch (err) {
    next(err);
  }
});

export default router;