import express from "express";
import { TeacherTask } from "../models/TeacherTask.js";
import { requireAuth } from "../auth.js";
import { sendNotification } from "../services/notificationService.js";

const router = express.Router();

const normalizeTaskCategory = (category, role = "") => {
  if (category === "mentor_assigned") return "mentor_task";
  if (category === "mentor_task") return "mentor_task";
  if (category === "admin_assigned") return "admin_assigned";
  return category || (role === "mentor" ? "mentor_task" : "homework");
};

const getHolidaySet = (holidayDates = "") => {
  const set = new Set();
  for (const entry of String(holidayDates || "").split(",")) {
    const trimmed = entry.trim();
    if (trimmed) set.add(trimmed);
  }
  return set;
};

const expandTaskDates = ({ startDate, endDate, skipWeekends = false, holidayDates = "" }) => {
  const normalizedStart = startDate || endDate;
  const normalizedEnd = endDate || startDate;
  if (!normalizedStart || !normalizedEnd) return [];

  const start = new Date(`${normalizedStart}T12:00:00`);
  const end = new Date(`${normalizedEnd}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

  const dates = [];
  const holidaySet = getHolidaySet(holidayDates);
  const current = new Date(start);

  while (current <= end) {
    const isoDate = current.toISOString().slice(0, 10);
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    const isHoliday = holidaySet.has(isoDate);

    if (!isWeekend || !skipWeekends) {
      if (!isHoliday) dates.push(isoDate);
    }

    current.setDate(current.getDate() + 1);
  }

  return dates;
};

// End-of-day submission cutoff: 11:59:59 PM IST (Asia/Kolkata, UTC+5:30), fixed —
// computed explicitly rather than relying on server TZ, since all users are in India.
const IST_OFFSET_MINUTES = 5 * 60 + 30;

function isPastDeadlineIST(dateStr) {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;
  // Cutoff instant = 23:59:59.999 IST on dateStr, expressed in UTC.
  const cutoffUTCms = Date.UTC(y, m - 1, d, 23, 59, 59, 999) - IST_OFFSET_MINUTES * 60 * 1000;
  return Date.now() > cutoffUTCms;
}

function deadlineMessage(dateStr) {
  return `Submission window closed at 11:59 PM IST for ${dateStr}. Contact your mentor for an exception.`;
}

// GET /api/teacher-tasks - Fetch all tasks for logged-in teacher
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tasks = await TeacherTask.find({ teacher: req.user.id }).sort({ date: 1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher-tasks/for-teacher/:teacherId - Admin/Mentor view of a
// specific teacher's assigned tasks (e.g. the "View" profile page).
router.get("/for-teacher/:teacherId", requireAuth, async (req, res, next) => {
  try {
    if (!["admin", "mentor", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not authorized to view another teacher's tasks" });
    }
    const tasks = await TeacherTask.find({ teacher: req.params.teacherId }).sort({ date: -1, createdAt: -1 });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher-tasks/admin-assign - Admin/Mentor assigns task to a target teacher
router.post("/admin-assign", requireAuth, async (req, res, next) => {
  try {
    const {
      teacherId,
      title,
      category,
      date,
      startDate,
      endDate,
      startTime,
      endTime,
      time,
      taskMode,
      skipWeekends,
      holidayDates
    } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "target teacherId is required" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }

    const isRecurringDaily = taskMode === "daily" && (startDate || endDate);
    const taskDates = isRecurringDaily
      ? expandTaskDates({ startDate, endDate, skipWeekends: !!skipWeekends, holidayDates })
      : [date || new Date().toISOString().split("T")[0]];

    if (taskDates.length === 0) {
      return res.status(400).json({ message: "No valid dates were generated for the task range." });
    }

    const normalizedCategory = normalizeTaskCategory(category, req.user.role);
    const createdDocs = [];

    for (const taskDate of taskDates) {
      const created = await TeacherTask.create({
        teacher: teacherId,
        createdBy: req.user.id,
        assignedByAdmin: req.user.role === "admin" || req.user.role === "super_admin",
        assignedByMentor: req.user.role === "mentor",
        title: title.trim(),
        category: normalizedCategory,
        date: taskDate,
        startTime: startTime || "11:30",
        endTime: endTime || "12:30",
        time: time || `${startTime || "11:30"} - ${endTime || "12:30"}`,
        completed: false
      });
      createdDocs.push(created);
    }

    const primaryDoc = createdDocs[0];

    // Alert only the teacher/fellow this task was assigned to.
    try {
      await sendNotification({
        recipientId: teacherId,
        templateKey: "task_assigned",
        channel: "in_app",
        priority: "normal",
        replacements: {
          assignerName: req.user.name || (req.user.role === "mentor" ? "Mentor" : "Admin"),
          taskTitle: primaryDoc.title,
          taskDate: primaryDoc.date
        },
        metadata: {
          taskId: primaryDoc._id,
          assignedBy: req.user.id,
          notificationType: "task_assigned",
          createdCount: createdDocs.length
        }
      });
    } catch (notifyErr) {
      console.warn("Failed to send task_assigned notification:", notifyErr.message);
    }

    res.status(201).json({
      success: true,
      createdCount: createdDocs.length,
      tasks: createdDocs,
      task: primaryDoc
    });
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

    const willBeCompleted = !task.completed;
    if (willBeCompleted && isPastDeadlineIST(task.date)) {
      return res.status(400).json({ message: deadlineMessage(task.date) });
    }

    task.completed = willBeCompleted;
    await task.save();
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher-tasks/:id/report - Submit a completion report for a calendar
// task (Field Visit, PCB Session, and other calendar-category activities).
// Hard-blocks after the end-of-day (11:59 PM IST) deadline for the task's date.
router.patch("/:id/report", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.teacher.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (isPastDeadlineIST(task.date)) {
      return res.status(400).json({ message: deadlineMessage(task.date) });
    }

    const { completionStatus, notes, pdcaPhase, attachments } = req.body;
    if (!["completed", "partial", "skipped"].includes(completionStatus)) {
      return res.status(400).json({ message: "completionStatus must be one of: completed, partial, skipped." });
    }
    if (completionStatus === "completed" && !(notes || "").trim()) {
      return res.status(400).json({ message: "Notes describing what was accomplished are required." });
    }

    task.completionStatus = completionStatus;
    task.reportNotes = (notes || "").trim();
    if (pdcaPhase) task.pdcaPhase = pdcaPhase;
    if (Array.isArray(attachments)) task.reportAttachments = attachments;
    task.reportSubmittedAt = new Date();
    task.completed = true;

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