import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { getUpcomingReminders, getFellowsNeedingMentorAttention } from "./reminderPredictionService.js";
import { sendNotification } from "./notificationService.js";

/**
 * Write a single in-app reminder notification for a teacher.
 */
const sendTeacherReminder = async (item) => {
  const { createAndEmitNotification } = await import("../socket.js");

  return createAndEmitNotification({
    recipientId: item.teacherId,
    title: `Reminder: ${item.category}`,
    body: item.message,
    type: "in_app",
    metadata: {
      reminderCategory: item.category,
      itemId: item.itemId,
      dueDate: item.dueDate,
      priority: "high"
    }
  });
};

/**
 * Notify all approved admins about registration approvals that have
 * been pending too long.
 */
const notifyAdminsOfPendingApprovals = async (registrationApprovals) => {
  if (registrationApprovals.length === 0) return 0;

  const admins = await User.find({ role: "admin", status: "approved" }).select("_id").lean();
  const approvalSummary = registrationApprovals.map((u) => u.message).join(" | ");

  await Promise.allSettled(
    admins.map((admin) =>
      Notification.create({
        recipient: admin._id,
        channel: "in_app",
        title: "Pending registration approvals",
        body: approvalSummary,
        status: "delivered",
        sentAt: new Date(),
        metadata: { category: "reminder", priority: "urgent" }
      })
    )
  );

  return admins.length;
};

/**
 * Notify each center's mentor about registration approvals pending
 * specifically at THEIR center — not a broadcast like admins get.
 */
const notifyMentorsOfCenterApprovals = async (centerApprovals) => {
  if (centerApprovals.length === 0) return 0;

  const byMentor = new Map();
  centerApprovals.forEach((u) => {
    if (!byMentor.has(u.centerMentorId)) byMentor.set(u.centerMentorId, []);
    byMentor.get(u.centerMentorId).push(u);
  });

  const results = await Promise.allSettled(
    Array.from(byMentor.entries()).map(([mentorId, approvals]) => {
      const names = approvals.map((a) => `${a.name} (${a.role})`).join(", ");
      return sendNotification({
        recipientId: mentorId,
        templateKey: "center_pending_approvals",
        channel: "in_app",
        priority: "normal",
        replacements: {
          message: `${approvals.length} pending approval(s) at your center: ${names}`
        },
        metadata: {
          notificationType: "center_pending_approvals",
          centerName: approvals[0]?.centerName || null,
          count: approvals.length
        }
      });
    })
  );

  return results.filter((r) => r.status === "fulfilled").length;
};

/**
 * 3.7 — Notify each mentor about ONLY their own at-risk fellows.
 * One alert per mentor per day, summarizing all their HIGH/MEDIUM risk
 * fellows together (not one notification per fellow, to avoid alert spam).
 */
const notifyMentorsOfAtRiskFellows = async () => {
  const grouped = await getFellowsNeedingMentorAttention();
  if (grouped.length === 0) return 0;

  const results = await Promise.allSettled(
    grouped.map(({ mentorId, fellows }) => {
      const highCount = fellows.filter((f) => f.riskLevel === "HIGH").length;
      const lines = fellows
        .map((f) => `${f.fellowName} (${f.riskLevel}): ${f.reasons[0]}`)
        .join(" | ");

      return sendNotification({
        recipientId: mentorId,
        templateKey: "fellows_needing_attention",
        channel: "in_app",
        priority: highCount > 0 ? "high" : "normal",
        replacements: {
          message: `${fellows.length} fellow(s) need attention: ${lines}`
        },
        metadata: {
          notificationType: "fellows_needing_attention",
          highRiskCount: highCount,
          totalFlagged: fellows.length
        }
      });
    })
  );

  return results.filter((r) => r.status === "fulfilled").length;
};

/**
 * Scans everything due within the next 24 hours (via reminderPredictionService)
 * and actually sends the reminders. This is the single function called by:
 *  - POST /api/reminder-automation/send-reminders (manual admin trigger)
 *  - the daily cron job (automatic, unattended)
 */
export const dispatchDueReminders = async () => {
  const upcoming = await getUpcomingReminders();
  const { activityReports, assessments, courseDeadlines, parentSessions, assignedTasks } = upcoming.teacherReminders;
  const allTeacherItems = [...activityReports, ...assessments, ...courseDeadlines, ...parentSessions, ...assignedTasks];

  const results = await Promise.allSettled(allTeacherItems.map(sendTeacherReminder));

  // Build a human-readable log of exactly who got what and why —
  // this is what an admin/supervisor can point to as "the basis" for each reminder.
  const sentDetails = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const item = allTeacherItems[index];
      sentDetails.push({
        teacherName: item.teacherName,
        category: item.category,
        reason: item.message,
        dueDate: item.dueDate
      });
    }
  });

  const sentCount = results.filter((r) => r.status === "fulfilled").length;
  const failedCount = results.length - sentCount;

  const adminNotified = await notifyAdminsOfPendingApprovals(upcoming.adminReminders.registrationApprovals);
  const centerMentorsNotified = await notifyMentorsOfCenterApprovals(upcoming.mentorReminders.pendingCenterApprovals);
  const mentorsNotified = await notifyMentorsOfAtRiskFellows();

  return {
    scannedAt: upcoming.generatedAt,
    sentCount,
    failedCount,
    adminNotified,
    centerMentorsNotified,
    mentorsNotified,
    totalItemsScanned: allTeacherItems.length,
    sentDetails
  };
};

export default { dispatchDueReminders };