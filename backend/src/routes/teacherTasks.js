import express from "express";
import { TeacherTask } from "../models/TeacherTask.js";
import { requireAuth, requireRole } from "../auth.js";
import { sendNotification } from "../services/notificationService.js";
import { LessonCompletionReport } from "../models/LessonCompletionReport.js";
import { CourseAssignment } from "../models/CourseAssignment.js";
import { AssessmentResult } from "../models/AssessmentResult.js";
import { TeacherMonthChecklist } from "../models/TeacherMonthChecklist.js";

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

const expandTaskDates = ({
  startDate,
  endDate,
  skipWeekends = false,
  holidayDates = ""
}) => {
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

// End-of-day submission cutoff: 11:59:59 PM IST (Asia/Kolkata, UTC+5:30), fixed
const IST_OFFSET_MINUTES = 5 * 60 + 30;

function isPastDeadlineIST(dateStr) {
  if (!dateStr) return false;

  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return false;

  const cutoffUTCms =
    Date.UTC(y, m - 1, d, 23, 59, 59, 999) -
    IST_OFFSET_MINUTES * 60 * 1000;

  return Date.now() > cutoffUTCms;
}

function deadlineMessage(dateStr) {
  return `Submission window closed at 11:59 PM IST for ${dateStr}. Contact your mentor for an exception.`;
}

// GET /api/teacher-tasks - Fetch all tasks for logged-in teacher
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const tasks = await TeacherTask.find({
      teacher: req.user.id
    }).sort({
      date: 1,
      createdAt: -1
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher-tasks/for-teacher/:teacherId
// Admin/Mentor view of a specific teacher's assigned tasks
router.get("/for-teacher/:teacherId", requireAuth, async (req, res, next) => {
  try {
    if (!["admin", "mentor", "super_admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Not authorized to view another teacher's tasks"
      });
    }

    const tasks = await TeacherTask.find({
      teacher: req.params.teacherId
    }).sort({
      date: -1,
      createdAt: -1
    });

    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/teacher-tasks/admin-assign
// Admin/Mentor assigns task to a target teacher
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
      return res.status(400).json({
        message: "target teacherId is required"
      });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    const isRecurringDaily =
      taskMode === "daily" && (startDate || endDate);

    const taskDates = isRecurringDaily
      ? expandTaskDates({
          startDate,
          endDate,
          skipWeekends: !!skipWeekends,
          holidayDates
        })
      : [date || new Date().toISOString().split("T")[0]];

    if (taskDates.length === 0) {
      return res.status(400).json({
        message: "No valid dates were generated for the task range."
      });
    }

    const normalizedCategory = normalizeTaskCategory(
      category,
      req.user.role
    );

    const createdDocs = [];

    for (const taskDate of taskDates) {
      const created = await TeacherTask.create({
        teacher: teacherId,
        createdBy: req.user.id,
        assignedByAdmin:
          req.user.role === "admin" ||
          req.user.role === "super_admin",
        assignedByMentor: req.user.role === "mentor",
        title: title.trim(),
        category: normalizedCategory,
        date: taskDate,
        startTime: startTime || "11:30",
        endTime: endTime || "12:30",
        time:
          time ||
          `${startTime || "11:30"} - ${endTime || "12:30"}`,
        completed: false,
        source: req.body.source || (req.user.role === "mentor" ? "mentor_assigned" : "admin_assigned"),
        ageGroup: req.body.ageGroup || "",
        topic: req.body.topic || "",
        howToConduct: req.body.howToConduct || "",
        materials: req.body.materials || "",
        objective: req.body.objective || "",
        activityNotes: req.body.activityNotes || ""
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
          assignerName:
            req.user.name ||
            (req.user.role === "mentor" ? "Mentor" : "Admin"),
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
      console.warn(
        "Failed to send task_assigned notification:",
        notifyErr.message
      );
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
    const {
      title,
      category,
      date,
      startTime,
      endTime,
      time
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    const doc = await TeacherTask.create({
      teacher: req.user.id,
      title: title.trim(),
      category: category || "homework",
      date: date || new Date().toISOString().split("T")[0],
      startTime: startTime || "11:30",
      endTime: endTime || "12:30",
      time:
        time ||
        `${startTime || "11:30"} - ${endTime || "12:30"}`,
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

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (
      task.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    const {
      title,
      category,
      date,
      startTime,
      endTime,
      time,
      completed
    } = req.body;

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

// PATCH /api/teacher-tasks/:id/toggle
// Toggle task completion status
router.patch("/:id/toggle", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (
      task.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    const willBeCompleted = !task.completed;

    if (willBeCompleted && isPastDeadlineIST(task.date)) {
      return res.status(400).json({
        message: deadlineMessage(task.date)
      });
    }

    task.completed = willBeCompleted;

    await task.save();

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher-tasks/:id/report
// Submit a completion report
router.patch("/:id/report", requireAuth, async (req, res, next) => {
  try {
    const task = await TeacherTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (
      task.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    if (isPastDeadlineIST(task.date)) {
      return res.status(400).json({
        message: deadlineMessage(task.date)
      });
    }

    const {
      completionStatus,
      notes,
      pdcaPhase,
      attachments
    } = req.body;

    if (
      !["completed", "partial", "skipped"].includes(
        completionStatus
      )
    ) {
      return res.status(400).json({
        message:
          "completionStatus must be one of: completed, partial, skipped."
      });
    }

    if (
      completionStatus === "completed" &&
      !(notes || "").trim()
    ) {
      return res.status(400).json({
        message:
          "Notes describing what was accomplished are required."
      });
    }

    task.completionStatus = completionStatus;
    task.reportNotes = (notes || "").trim();

    if (pdcaPhase) {
      task.pdcaPhase = pdcaPhase;
    }

    if (Array.isArray(attachments)) {
      task.reportAttachments = attachments;
    }

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

    if (!task) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    if (
      task.teacher.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        message: "Forbidden"
      });
    }

    await TeacherTask.deleteOne({
      _id: task._id
    });

    res.json({
      success: true
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/teacher-tasks/checklist?month=9&year=2026
// Auto-computes teacher's monthly checklist (4 items) and returns it
router.get("/checklist", requireAuth, async (req, res, next) => {
  try {
    const month =
      Number(req.query.month) ||
      new Date().getMonth() + 1;

    const year =
      Number(req.query.year) ||
      new Date().getFullYear();

    // Mentor can pass ?teacherId=xxx to view another teacher's checklist
    const teacherId =
      req.query.teacherId &&
      (req.user.role === "mentor" ||
        req.user.role === "admin")
        ? req.query.teacherId
        : req.user.id;

    // Date range for this calendar month
    const startDate =
      `${year}-${String(month).padStart(2, "0")}-01`;

    const endDate =
      `${year}-${String(month).padStart(2, "0")}-31`;

    const monthStart =
      new Date(year, month - 1, 1);

    const monthEnd =
      new Date(year, month, 0, 23, 59, 59);

    // ── Count ALL activities (class_lesson + field_visit + mentor_published + lesson plan completions) ──
    const [
      classTaskCount,
      fieldTaskCount,
      mentorPublishedCount,
      lessonPlanCount,
      pcbTaskCount,
      courseCount,
      assessmentCount
    ] = await Promise.all([
      // Class lessons completed on calendar
      TeacherTask.countDocuments({
        teacher: teacherId,
        category: "class_lesson",
        completed: true,
        date: { $gte: startDate, $lte: endDate }
      }),

      // Field visits completed on calendar
      TeacherTask.countDocuments({
        teacher: teacherId,
        category: "field_visit",
        completed: true,
        date: { $gte: startDate, $lte: endDate }
      }),

      // Mentor-published activities completed on calendar
      TeacherTask.countDocuments({
        teacher: teacherId,
        source: "mentor_published",
        completed: true,
        date: { $gte: startDate, $lte: endDate }
      }),

      // Lesson plan completion reports (Training & Lessons tab "Mark Complete")
      LessonCompletionReport.countDocuments({
        teacher: teacherId,
        submittedAt: { $gte: monthStart, $lte: monthEnd }
      }),

      // PCB sessions completed
      TeacherTask.countDocuments({
        teacher: teacherId,
        category: "pcb_session",
        completed: true,
        date: { $gte: startDate, $lte: endDate }
      }),

      // Courses completed
      CourseAssignment.countDocuments({
        teacher: teacherId,
        status: "completed",
        updatedAt: { $gte: monthStart, $lte: monthEnd }
      }),

      // Assessments taken
      AssessmentResult.countDocuments({
        user: teacherId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      })
    ]);

    // Merge all activity sources into one count
    // Avoid double-counting: mentor_published tasks with class_lesson/field_visit category
    // are already counted in classTaskCount/fieldTaskCount, so only count mentor_published
    // tasks that don't have those categories
    const mentorPublishedOtherCount = await TeacherTask.countDocuments({
      teacher: teacherId,
      source: "mentor_published",
      category: { $nin: ["class_lesson", "field_visit"] },
      completed: true,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalActivityCount =
      classTaskCount + fieldTaskCount + mentorPublishedOtherCount + lessonPlanCount;

    // Default targets
    const DEFAULT_TARGETS = {
      activities: 4,
      courses: 1,
      assessments: 1,
      pcb_sessions: 1
    };

    // Auto-computed items (4 items — Activities merges everything)
    const autoItems = [
      {
        id: "activities",
        label: "Activities",
        required: true,
        count: totalActivityCount,
        target: DEFAULT_TARGETS.activities,
        met: totalActivityCount >= DEFAULT_TARGETS.activities
      },
      {
        id: "courses",
        label: "Courses",
        required: true,
        count: courseCount,
        target: DEFAULT_TARGETS.courses,
        met: courseCount >= DEFAULT_TARGETS.courses
      },
      {
        id: "assessments",
        label: "Assessments",
        required: true,
        count: assessmentCount,
        target: DEFAULT_TARGETS.assessments,
        met: assessmentCount >= DEFAULT_TARGETS.assessments
      },
      {
        id: "pcb_sessions",
        label: "PCB Sessions",
        required: false,
        count: pcbTaskCount,
        target: DEFAULT_TARGETS.pcb_sessions,
        met: pcbTaskCount >= DEFAULT_TARGETS.pcb_sessions
      }
    ];

    // Check for mentor overrides in DB
    const saved =
      await TeacherMonthChecklist.findOne({
        teacherId,
        month,
        year
      });

    const overrideMap = saved
      ? new Map(
          saved.items.map(i => [i.id, i])
        )
      : new Map();

    const items = autoItems.map(item => {
      const override = overrideMap.get(item.id);

      if (override) {
        // Use mentor's target if set
        const effectiveTarget = override.target != null ? override.target : item.target;
        const effectiveRequired = override.required != null ? override.required : item.required;

        return {
          ...item,
          target: effectiveTarget,
          required: effectiveRequired,
          met: override.mentorOverride ? override.met : (item.count >= effectiveTarget),
          mentorOverride: !!override.mentorOverride,
          mentorNote: override.mentorNote || ""
        };
      }

      return {
        ...item,
        mentorOverride: false,
        mentorNote: ""
      };
    });

    res.json({
      success: true,
      month,
      year,
      items
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/teacher-tasks/checklist/mentor-override
// Mentor/Admin can override checklist items
router.patch(
  "/checklist/mentor-override",
  requireAuth,
  async (req, res, next) => {

    // Explicit role check
    if (
      ![
        "mentor",
        "admin",
        "super_admin"
      ].includes(req.user?.role)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only mentors or admins can override a teacher checklist."
      });
    }

    try {
      const {
        teacherId,
        month,
        year,
        items
      } = req.body;

      if (
        !teacherId ||
        !month ||
        !year ||
        !Array.isArray(items)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "teacherId, month, year, items required."
        });
      }

      const updated =
        await TeacherMonthChecklist.findOneAndUpdate(
          {
            teacherId,
            month,
            year
          },
          {
            $set: {
              items,
              lastComputedAt: new Date()
            }
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
          }
        );

      res.json({
        success: true,
        checklist: updated
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/teacher-tasks/checklist/bulk-set-targets
// Mentor/Admin can set targets for multiple teachers at once
router.post(
  "/checklist/bulk-set-targets",
  requireAuth,
  async (req, res, next) => {
    if (
      !["mentor", "admin", "super_admin"].includes(req.user?.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Only mentors or admins can set checklist targets."
      });
    }

    try {
      const { teacherIds, month, year, items } = req.body;

      if (
        !Array.isArray(teacherIds) ||
        teacherIds.length === 0 ||
        !month ||
        !year ||
        !Array.isArray(items)
      ) {
        return res.status(400).json({
          success: false,
          message: "teacherIds (array), month, year, items required."
        });
      }

      const results = [];

      for (const tid of teacherIds) {
        // Build items array with target/required overrides only (no met override)
        const overrideItems = items.map(item => ({
          id: item.id,
          label: item.label || item.id,
          target: item.target,
          required: item.required,
          mentorOverride: false,
          met: false,
          count: 0,
          mentorNote: item.mentorNote || ""
        }));

        const updated = await TeacherMonthChecklist.findOneAndUpdate(
          { teacherId: tid, month, year },
          { $set: { items: overrideItems, lastComputedAt: new Date() } },
          { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        results.push({ teacherId: tid, success: true });
      }

      res.json({
        success: true,
        updated: results.length,
        results
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;