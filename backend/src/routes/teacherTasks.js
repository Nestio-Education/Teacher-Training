import express from "express";
import { TeacherTask } from "../models/TeacherTask.js";
import { requireAuth } from "../auth.js";
import { sendNotification } from "../services/notificationService.js";

const router = express.Router();

// GET /api/teacher-tasks - Fetch all tasks for logged-in teacher
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tasks = await TeacherTask.find({ teacher: req.user.id }).sort({ date: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher-tasks/admin-assign - Admin assigns task to a target teacher
router.post("/admin-assign", requireAuth, async (req, res, next) => {
  try {
    const { teacherId, title, category, date, startTime, endTime, time } = req.body;
    if (!teacherId) {
      return res.status(400).json({ message: "target teacherId is required" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const doc = await TeacherTask.create({
      teacher: teacherId,
      createdBy: req.user.id,
      assignedByAdmin: true,
      title: title.trim(),
      category: category || "admin_assigned",
      date: date || new Date().toISOString().split("T")[0],
      startTime: startTime || "11:30",
      endTime: endTime || "12:30",
      time: time || `${startTime || "11:30"} - ${endTime || "12:30"}`,
      completed: false
    });

    // Alert only the teacher/fellow this task was assigned to.
    try {
      await sendNotification({
        recipientId: teacherId,
        templateKey: "task_assigned",
        channel: "in_app",
        priority: "normal",
        replacements: {
          assignerName: req.user.name || "Admin",
          taskTitle: doc.title,
          taskDate: doc.date
        },
        metadata: {
          taskId: doc._id,
          assignedBy: req.user.id,
          notificationType: "task_assigned"
        }
      });
    } catch (notifyErr) {
      console.warn("Failed to send task_assigned notification:", notifyErr.message);
    }

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher-tasks - Create new schedule task
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, category, date, startTime, endTime, time } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const doc = await TeacherTask.create({
      teacher: req.user.id,
      title: title.trim(),
      category: category || "homework",
      date: date || new Date().toISOString().split("T")[0],
      startTime: startTime || "11:30",
      endTime: endTime || "12:30",
      time: time || `${startTime || "11:30"} - ${endTime || "12:30"}`,
      completed: false
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

// PUT /api/teacher-tasks/:id - Update existing task
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.teacher.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { title, category, date, startTime, endTime, time, completed } = req.body;
    if (title !== undefined) task.title = title.trim();
    if (category !== undefined) task.category = category;
    if (date !== undefined) task.date = date;
    if (startTime !== undefined) task.startTime = startTime;
    if (endTime !== undefined) task.endTime = endTime;
    if (time !== undefined) task.time = time;
    if (completed !== undefined) task.completed = completed;

    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher-tasks/:id/toggle - Toggle task completion status
router.patch("/:id/toggle", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.teacher.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/teacher-tasks/:id - Delete task
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.teacher.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    await TeacherTask.deleteOne({ _id: task._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
