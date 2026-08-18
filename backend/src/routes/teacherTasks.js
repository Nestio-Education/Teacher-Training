import express from "express";
import { TeacherTask } from "../models/TeacherTask.js";
import { User } from "../models/User.js";
import { requireAuth } from "../auth.js";
import { sendNotification } from "../services/notificationService.js";

const router = express.Router();

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") return String(value._id || value.id || "");
  return "";
};

const normalizeDate = (value) => {
  if (!value) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  const match = raw.match(/^\d{4}-\d{2}-\d{2}$/);
  if (!match) return "";
  const dt = new Date(`${raw}T00:00:00`);
  return Number.isNaN(dt.getTime()) ? "" : raw;
};

const buildDailyTaskDates = ({ startDate, endDate, skipWeekends = true, holidayDates = [] }) => {
  const validStart = normalizeDate(startDate);
  const validEnd = normalizeDate(endDate);
  if (!validStart || !validEnd) return [];

  const start = new Date(`${validStart}T00:00:00`);
  const end = new Date(`${validEnd}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const holidaySet = new Set(
    (Array.isArray(holidayDates) ? holidayDates : String(holidayDates || "").split(","))
      .map(item => normalizeDate(item))
      .filter(Boolean)
  );

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const iso = new Date(cursor.getTime() - cursor.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const dayOfWeek = cursor.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (!(skipWeekends && isWeekend) && !holidaySet.has(iso)) {
      dates.push(iso);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
};

const mentorOwnsTeacher = async (teacherId, mentorId) => {
  if (!teacherId || !mentorId) return false;

  const [teacher, mentor] = await Promise.all([
    User.findById(teacherId).select("assignedMentor mentorProfile.assignedTeachers"),
    User.findById(mentorId).select("mentorProfile.assignedTeachers")
  ]);

  if (!teacher || !mentor) return false;

  const teacherIdStr = String(teacherId);
  const mentorIdStr = String(mentorId);
  const assignedByField = normalizeId(teacher.assignedMentor);
  const assignedByList = (mentor.mentorProfile?.assignedTeachers || []).map(id => normalizeId(id));

  return assignedByField === mentorIdStr || assignedByList.includes(teacherIdStr);
};

const canManageTeacherTask = async (task, user) => {
  if (!task || !user) return false;
  if (user.role === "admin") return true;
  if (task.teacher?.toString() === user.id) return true;
  if (task.createdBy?.toString() === user.id) return true;

  if (user.role === "mentor") {
    return mentorOwnsTeacher(task.teacher, user.id);
  }

  return false;
};

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
// POST /api/teacher-tasks/admin-assign - Admin or mentor assigns task to a target teacher
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
      taskMode = "single",
      skipWeekends = true,
      holidayDates
    } = req.body;

    if (!teacherId) {
      return res.status(400).json({ message: "target teacherId is required" });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Task title is required" });
    }
    if (req.user.role !== "admin" && req.user.role !== "mentor") {
      return res.status(403).json({ message: "Only admins and mentors can assign tasks" });
    }

    const teacher = await User.findById(teacherId).select("_id assignedMentor role mentorProfile.assignedTeachers");
    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (req.user.role === "mentor") {
      const mentor = await User.findById(req.user.id).select("mentorProfile.assignedTeachers");
      const mentorAssignedIds = (mentor?.mentorProfile?.assignedTeachers || []).map(id => normalizeId(id));
      const isAssignedByField = normalizeId(teacher.assignedMentor) === String(req.user.id);
      const isAssignedInLegacyList = mentorAssignedIds.includes(String(teacherId));

      if (!isAssignedByField && !isAssignedInLegacyList) {
        return res.status(403).json({ message: "You can only assign tasks to teachers assigned to you" });
      }
    }

    const resolvedCategory = category || (req.user.role === "mentor" ? "mentor_assigned" : "admin_assigned");
    const normalizedDate = normalizeDate(date) || new Date().toISOString().split("T")[0];
    const taskTimes = {
      startTime: startTime || "11:30",
      endTime: endTime || "12:30",
      time: time || `${startTime || "11:30"} - ${endTime || "12:30"}`
    };

    const isDailyTask = String(taskMode).toLowerCase() === "daily";
    const assignmentDates = isDailyTask
      ? buildDailyTaskDates({
          startDate: startDate || normalizedDate,
          endDate: endDate || normalizedDate,
          skipWeekends: skipWeekends !== false,
          holidayDates: holidayDates || []
        })
      : [normalizedDate];
    if (!assignmentDates.length) {
      return res.status(400).json({ message: "No valid task dates were generated. Please choose a different date range or remove holiday dates." });
    }
    const createdTasks = [];
    for (const assignmentDate of assignmentDates) {
      const doc = await TeacherTask.create({
        teacher: teacherId,
        createdBy: req.user.id,
        assignedByAdmin: req.user.role === "admin",
        assignedByMentor: req.user.role === "mentor",
        title: title.trim(),
        category: resolvedCategory,
        date: assignmentDate,
        startTime: taskTimes.startTime,
        endTime: taskTimes.endTime,
        time: taskTimes.time,
        completed: false
      });
      createdTasks.push(doc);

      // Alert only the teacher/fellow this task was assigned to.
      try {
        const notifyResult = await sendNotification({
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
        if (!notifyResult?.inApp?.success) {
          console.warn("task_assigned notification did not deliver:", JSON.stringify(notifyResult));
        }
      } catch (notifyErr) {
        console.warn("Failed to send task_assigned notification:", notifyErr.message);
      }
    }
    res.status(201).json(isDailyTask ? { createdCount: createdTasks.length, tasks: createdTasks } : createdTasks[0]);
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
    if (!(await canManageTeacherTask(task, req.user))) {
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
    if (!(await canManageTeacherTask(task, req.user))) {
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
    if (!(await canManageTeacherTask(task, req.user))) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await TeacherTask.deleteOne({ _id: task._id });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;