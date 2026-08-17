import { User } from "../models/User.js";
import { TeacherAttendanceRecord } from "../models/Attendance.js";
import { ActivitySubmission } from "../models/ActivitySubmission.js";
import { CourseAssignment } from "../models/CourseAssignment.js";
import { ParentSessionAssignment } from "../models/ParentSessionAssignment.js";
import { TeacherTask } from "../models/TeacherTask.js";


/**
 * Reminder Prediction Service
 * ----------------------------
 * "AI Prediction" here means a transparent, rule-based scoring model
 * (not a black-box ML model) that answers: "Who is likely to miss a deadline?"
 *
 * Inputs used (per teacher):
 *  - Attendance history      -> TeacherAttendanceRecord   (last ATTENDANCE_WINDOW_DAYS)
 *  - Submission history      -> ActivitySubmission        (daily activity reports)
 *  - Pending tasks           -> CourseAssignment + ParentSessionAssignment
 *  - Completion rate         -> User.teacherProfile.completionRate (existing field)
 *
 * Output (per teacher):
 *  { teacherId, teacherName, riskLevel: "HIGH"|"MEDIUM"|"LOW", riskScore, reasons[], action }
 */

const ATTENDANCE_WINDOW_DAYS = 14;
const HIGH_RISK_THRESHOLD = 70;
const MEDIUM_RISK_THRESHOLD = 40;
const REMINDER_LEAD_HOURS = 24;

// ── Weights (must sum to 100) ──
const WEIGHTS = {
  attendance: 30,     // low attendance rate -> higher risk
  completionRate: 30, // low completion rate -> higher risk
  pendingLoad: 25,     // many pending items -> higher risk
  overdue: 15          // any already-overdue items -> higher risk
};

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Attendance score: % of the last N days the teacher was NOT present/late.
 * Higher = more risk.
 */
const scoreFromAttendance = async (teacherId) => {
  const since = daysAgo(ATTENDANCE_WINDOW_DAYS);
  const records = await TeacherAttendanceRecord.find({
    teacher: teacherId,
    attendanceDate: { $gte: since }
  }).lean();

  if (records.length === 0) {
    // No attendance history yet — treat as neutral, not risky by default.
    return { score: 0, rate: null, sampleSize: 0 };
  }

  const absentOrLate = records.filter((r) => r.status === "absent" || r.status === "late").length;
  const rate = Math.round((absentOrLate / records.length) * 100); // % problematic days
  return { score: rate, rate, sampleSize: records.length };
};

/**
 * Completion-rate score: inverse of teacherProfile.completionRate.
 */
const scoreFromCompletionRate = (user) => {
  const completionRate = user?.teacherProfile?.completionRate;
  if (completionRate === undefined || completionRate === null) {
    return { score: 0, completionRate: null };
  }
  return { score: clamp(100 - completionRate), completionRate };
};

/**
 * Pending-load score: counts pending items across categories, scaled to 0-100.
 * Also returns overdue count (dueDate already passed).
 */
const scorePendingLoad = async (teacherId) => {
  const now = new Date();

  const [pendingActivityReports, pendingCourseAssignments, pendingParentSessions] = await Promise.all([
    ActivitySubmission.countDocuments({ teacher: teacherId, status: "pending" }),
    CourseAssignment.find({
      teacher: teacherId,
      status: { $in: ["assigned", "in_progress", "revision"] }
    }).select("dueDate status").lean(),
    ParentSessionAssignment.find({
      teacher: teacherId,
      status: { $in: ["Pending", "In Progress"] }
    }).select("dueDate status").lean()
  ]);

  const overdueCourses = pendingCourseAssignments.filter((c) => c.dueDate && new Date(c.dueDate) < now);
  const overdueParentSessions = pendingParentSessions.filter((p) => p.dueDate && new Date(p.dueDate) < now);

  const totalPending = pendingActivityReports + pendingCourseAssignments.length + pendingParentSessions.length;
  const totalOverdue = overdueCourses.length + overdueParentSessions.length;

  // Scale: 0 pending -> 0, 8+ pending items -> 100 (cap)
  const pendingLoadScore = clamp(Math.round((totalPending / 8) * 100));
  // Scale: any overdue item is a strong signal; 3+ overdue -> 100 (cap)
  const overdueScore = clamp(Math.round((totalOverdue / 3) * 100));

  return {
    pendingLoadScore,
    overdueScore,
    counts: {
      pendingActivityReports,
      pendingCourseAssignments: pendingCourseAssignments.length,
      pendingParentSessions: pendingParentSessions.length,
      totalPending,
      totalOverdue
    }
  };
};

const riskLevelFromScore = (score) => {
  if (score >= HIGH_RISK_THRESHOLD) return "HIGH";
  if (score >= MEDIUM_RISK_THRESHOLD) return "MEDIUM";
  return "LOW";
};

const buildReasons = ({ attendance, completion, pending }) => {
  const reasons = [];
  if (attendance.sampleSize > 0 && attendance.rate >= 20) {
    reasons.push(`Absent/late ${attendance.rate}% of days in the last ${ATTENDANCE_WINDOW_DAYS} days`);
  }
  if (completion.completionRate !== null && completion.completionRate < 60) {
    reasons.push(`Low completion rate (${completion.completionRate}%)`);
  }
  if (pending.counts.totalPending > 0) {
    reasons.push(`${pending.counts.totalPending} pending item(s) across activity reports, courses, parent sessions`);
  }
  if (pending.counts.totalOverdue > 0) {
    reasons.push(`${pending.counts.totalOverdue} item(s) already overdue`);
  }
  if (reasons.length === 0) reasons.push("No risk signals found — on track");
  return reasons;
};

/**
 * Calculate a single teacher's risk of missing an upcoming deadline.
 */
export const calculateTeacherRisk = async (user) => {
  const teacherId = user._id;

  const [attendance, pending] = await Promise.all([
    scoreFromAttendance(teacherId),
    scorePendingLoad(teacherId)
  ]);
  const completion = scoreFromCompletionRate(user);

  const riskScore = clamp(Math.round(
    (attendance.score * WEIGHTS.attendance +
      completion.score * WEIGHTS.completionRate +
      pending.pendingLoadScore * WEIGHTS.pendingLoad +
      pending.overdueScore * WEIGHTS.overdue) / 100
  ));

  const riskLevel = riskLevelFromScore(riskScore);
  const reasons = buildReasons({ attendance, completion, pending });

  return {
    teacherId: String(teacherId),
    teacherName: user.name,
    riskLevel,
    riskScore,
    reasons,
    pendingCounts: pending.counts,
    action: riskLevel === "LOW"
      ? "No action needed"
      : `Send reminder ${REMINDER_LEAD_HOURS} hours before deadline`
  };
};

/**
 * Risk report for all approved teachers — used by the admin dashboard.
 */
export const getRiskReport = async () => {
  const teachers = await User.find({ role: "teacher", status: "approved" })
    .select("name teacherProfile.completionRate assignedMentor")
    .lean();

  const report = await Promise.all(teachers.map((t) => calculateTeacherRisk(t)));

  // Highest risk first
  report.sort((a, b) => b.riskScore - a.riskScore);

  return {
    generatedAt: new Date().toISOString(),
    totalTeachers: report.length,
    highRiskCount: report.filter((r) => r.riskLevel === "HIGH").length,
    mediumRiskCount: report.filter((r) => r.riskLevel === "MEDIUM").length,
    lowRiskCount: report.filter((r) => r.riskLevel === "LOW").length,
    teachers: report
  };
};

/**
 * 3.7 Mentor Intervention Recommendations
 * ----------------------------------------
 * Groups HIGH/MEDIUM risk fellows by their assignedMentor, so each mentor
 * gets ONE alert listing only THEIR OWN at-risk fellows — not every fellow
 * in the system. Fellows with no assignedMentor are skipped (nothing to
 * route the alert to) rather than broadcast to all mentors.
 */
export const getFellowsNeedingMentorAttention = async () => {
  const teachers = await User.find({ role: "teacher", status: "approved" })
    .select("name teacherProfile.completionRate assignedMentor")
    .lean();

  const risks = await Promise.all(teachers.map((t) => calculateTeacherRisk(t)));

  const byMentor = new Map();
  teachers.forEach((teacher, idx) => {
    const risk = risks[idx];
    if (risk.riskLevel === "LOW") return; // only MEDIUM/HIGH need mentor attention
    if (!teacher.assignedMentor) return; // no mentor to route this to

    const mentorId = String(teacher.assignedMentor);
    if (!byMentor.has(mentorId)) byMentor.set(mentorId, []);
    byMentor.get(mentorId).push({
      fellowId: risk.teacherId,
      fellowName: risk.teacherName,
      riskLevel: risk.riskLevel,
      riskScore: risk.riskScore,
      reasons: risk.reasons
    });
  });

  // Each mentor's own list, high risk first
  const result = [];
  for (const [mentorId, fellows] of byMentor.entries()) {
    fellows.sort((a, b) => b.riskScore - a.riskScore);
    result.push({ mentorId, fellows });
  }
  return result;
};

// ─────────────────────────────────────────────────────────────
// Step 2: Deadline-window scanner
// Finds concrete items that fall due within the next
// REMINDER_LEAD_HOURS (24h) window, across all 5 categories.
// This is what the cron job (Step 4) will loop over to actually
// send reminders — separate from the overall risk score above.
// ─────────────────────────────────────────────────────────────

const hoursUntil = (date) => (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60);

/** True if dueDate falls within [0, REMINDER_LEAD_HOURS] hours from now (not yet overdue). */
const isDueWithinReminderWindow = (dueDate) => {
  if (!dueDate) return false;
  const hrs = hoursUntil(dueDate);
  return hrs >= 0 && hrs <= REMINDER_LEAD_HOURS;
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

/** 1. Daily activity reports — treated as due by end of today. */
const findDueActivityReports = async () => {
  const pending = await ActivitySubmission.find({
    status: "pending",
    activityDate: { $gte: startOfToday(), $lte: endOfToday() }
  })
    .populate("teacher", "name")
    .lean();

  return pending
    .filter((item) => item.teacher)
    .map((item) => ({
      category: "Daily Activity Report",
      teacherId: String(item.teacher._id),
      teacherName: item.teacher.name,
      itemId: String(item._id),
      dueDate: endOfToday(),
      message: `Daily activity report for ${new Date(item.activityDate).toDateString()} is still pending.`
    }));
};

/** 2. Pending assessments — CourseAssignment's assessment component not yet completed. */
const findDueAssessments = async () => {
  const assignments = await CourseAssignment.find({
    dueDate: { $ne: null },
    assessmentCompletedAt: null
  })
    .populate("teacher", "name")
    .lean();

  return assignments
    .filter((item) => item.teacher && isDueWithinReminderWindow(item.dueDate))
    .map((item) => ({
      category: "Pending Assessment",
      teacherId: String(item.teacher._id),
      teacherName: item.teacher.name,
      itemId: String(item._id),
      dueDate: item.dueDate,
      message: `Assessment for "${item.title}" is due ${new Date(item.dueDate).toLocaleString()}.`
    }));
};

/** 3. Course deadlines — CourseAssignment not yet submitted/completed. */
const findDueCourseDeadlines = async () => {
  const assignments = await CourseAssignment.find({
    dueDate: { $ne: null },
    status: { $in: ["assigned", "in_progress", "revision"] }
  })
    .populate("teacher", "name")
    .lean();

  return assignments
    .filter((item) => item.teacher && isDueWithinReminderWindow(item.dueDate))
    .map((item) => ({
      category: "Course Deadline",
      teacherId: String(item.teacher._id),
      teacherName: item.teacher.name,
      itemId: String(item._id),
      dueDate: item.dueDate,
      message: `Course assignment "${item.title}" is due ${new Date(item.dueDate).toLocaleString()}.`
    }));
};

/** 4. Parent sessions — ParentSessionAssignment not yet completed. */
const findDueParentSessions = async () => {
  const assignments = await ParentSessionAssignment.find({
    dueDate: { $ne: null },
    status: { $in: ["Pending", "In Progress"] }
  })
    .populate("teacher", "name")
    .lean();

  return assignments
    .filter((item) => item.teacher && isDueWithinReminderWindow(item.dueDate))
    .map((item) => ({
      category: "Parent Session",
      teacherId: String(item.teacher._id),
      teacherName: item.teacher.name,
      itemId: String(item._id),
      dueDate: item.dueDate,
      message: `Parent session #${item.sessionNumber} is due ${new Date(item.dueDate).toLocaleString()}.`
    }));
};

/**
 * 4b. Manually assigned tasks (admin/mentor "Assign Task") — TeacherTask
 * has no separate dueDate field, its "date" IS the due date. A task is
 * due-for-reminder if it's still not completed and its date is today
 * or already in the past (overdue) — both cases need a nudge.
 */
const findDueAssignedTasks = async () => {
  const todayStr = new Date().toISOString().split("T")[0];

  const pending = await TeacherTask.find({
    completed: false,
    date: { $lte: todayStr }
  })
    .populate("teacher", "name")
    .lean();

  return pending
    .filter((item) => item.teacher)
    .map((item) => {
      const overdue = item.date < todayStr;
      return {
        category: "Assigned Task",
        teacherId: String(item.teacher._id),
        teacherName: item.teacher.name,
        itemId: String(item._id),
        dueDate: item.date,
        message: overdue
          ? `Task "${item.title}" was due on ${item.date} and is still pending.`
          : `Task "${item.title}" is due today (${item.date}) and still pending.`
      };
    });
};

/**
 * 5. Registration approvals — this is an ADMIN action item, not a teacher risk.
 * There's no "dueDate" for a signup, so instead we flag accounts that have been
 * waiting too long (escalating urgency), so the admin gets nudged to act.
 */
const REGISTRATION_URGENT_HOURS = 48; // pending > 48h -> urgent nudge to admin

const findPendingRegistrationApprovals = async () => {
  const pendingUsers = await User.find({ status: "pending" })
    .select("name role createdAt teacherProfile.center")
    .populate("teacherProfile.center", "name mentor")
    .lean();

  return pendingUsers.map((u) => {
    const hoursPending = Math.round((Date.now() - new Date(u.createdAt).getTime()) / (1000 * 60 * 60));
    return {
      category: "Registration Approval",
      userId: String(u._id),
      name: u.name,
      role: u.role,
      hoursPending,
      urgent: hoursPending >= REGISTRATION_URGENT_HOURS,
      // The center's mentor is a real, related party for this approval —
      // unlike admin (which has no scoping field), this is a genuine link.
      centerMentorId: u.teacherProfile?.center?.mentor ? String(u.teacherProfile.center.mentor) : null,
      centerName: u.teacherProfile?.center?.name || null,
      message: `${u.name} (${u.role}) has been awaiting approval for ${hoursPending}h.`
    };
  });
};

/**
 * Master scanner — call this from the cron job / API route.
 * Returns everything that needs a reminder sent right now.
 */
export const getUpcomingReminders = async () => {
  const [activityReports, assessments, courseDeadlines, parentSessions, assignedTasks, registrationApprovals] = await Promise.all([
    findDueActivityReports(),
    findDueAssessments(),
    findDueCourseDeadlines(),
    findDueParentSessions(),
    findDueAssignedTasks(),
    findPendingRegistrationApprovals()
  ]);

  return {
    generatedAt: new Date().toISOString(),
    reminderWindowHours: REMINDER_LEAD_HOURS,
    teacherReminders: {
      activityReports,
      assessments,
      courseDeadlines,
      parentSessions,
      assignedTasks
    },
    adminReminders: {
      // Admin has no scoping field in the schema (global role) — every
      // approved admin genuinely IS "related" here, so this stays a
      // broadcast, gated only by the urgency threshold to avoid noise.
      registrationApprovals: registrationApprovals.filter((u) => u.urgent)
    },
    mentorReminders: {
      // Unlike admin, a center's mentor IS a specific, real relation
      // (Center.mentor) — so this is targeted, not gated by the same
      // 48h urgency threshold, since the mentor should know as soon
      // as their own center has someone awaiting approval.
      pendingCenterApprovals: registrationApprovals.filter((u) => u.centerMentorId)
    },
    totalTeacherReminders: activityReports.length + assessments.length + courseDeadlines.length + parentSessions.length + assignedTasks.length,
    totalAdminReminders: registrationApprovals.filter((u) => u.urgent).length
  };
};

export default {
  calculateTeacherRisk,
  getRiskReport,
  getFellowsNeedingMentorAttention,
  getUpcomingReminders
};
