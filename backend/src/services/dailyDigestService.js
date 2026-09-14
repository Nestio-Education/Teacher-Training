import { getUpcomingReminders } from "./reminderPredictionService.js";
import { sendNotification } from "./notificationService.js";

/**
 * Start-of-Day Digest
 * --------------------
 * Groups every item a teacher has due today (activity reports, assessments,
 * course deadlines, parent sessions, assigned tasks — same source the
 * 24h-before-deadline cron already scans, via getUpcomingReminders()) into
 * ONE combined message per teacher, sent via in-app + email + SMS every
 * morning — always, regardless of the teacher's preferredNotificationChannel.
 */

const groupItemsByTeacher = (upcoming) => {
  const { activityReports, assessments, courseDeadlines, parentSessions, assignedTasks } = upcoming.teacherReminders;
  const allItems = [...activityReports, ...assessments, ...courseDeadlines, ...parentSessions, ...assignedTasks];

  const byTeacher = new Map();
  allItems.forEach((item) => {
    if (!byTeacher.has(item.teacherId)) {
      byTeacher.set(item.teacherId, { teacherId: item.teacherId, teacherName: item.teacherName, items: [] });
    }
    byTeacher.get(item.teacherId).items.push(item);
  });

  return Array.from(byTeacher.values());
};

const formatDigestMessage = (items) =>
  items.map((item) => `• ${item.message}`).join("\n");

export const sendDailyDigests = async () => {
  const upcoming = await getUpcomingReminders();
  const teacherGroups = groupItemsByTeacher(upcoming);

  const results = await Promise.allSettled(
    teacherGroups.map((group) =>
      sendNotification({
        recipientId: group.teacherId,
        templateKey: "daily_task_digest",
        channel: ["in_app", "email", "sms"],
        priority: "normal",
        replacements: {
          teacherName: group.teacherName,
          count: String(group.items.length),
          message: formatDigestMessage(group.items)
        },
        metadata: {
          notificationType: "daily_task_digest",
          itemCount: group.items.length
        }
      })
    )
  );

  const sentDetails = [];
  let failedCount = 0;
  results.forEach((result, index) => {
    const group = teacherGroups[index];
    if (result.status === "fulfilled" && result.value.success) {
      sentDetails.push({
        teacherName: group.teacherName,
        itemCount: group.items.length,
        channelsSucceeded: result.value.successCount,
        channelsAttempted: result.value.attemptedCount
      });
    } else {
      failedCount += 1;
    }
  });

  return {
    scannedAt: upcoming.generatedAt,
    teachersNotified: sentDetails.length,
    failedCount,
    totalItemsScanned: teacherGroups.reduce((sum, g) => sum + g.items.length, 0),
    sentDetails
  };
};

export default { sendDailyDigests };
