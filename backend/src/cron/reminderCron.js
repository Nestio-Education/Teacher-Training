import cron from "node-cron";
import { dispatchDueReminders } from "../services/reminderDispatchService.js";

/**
 * Runs once a day and sends reminders for anything due within the next
 * 24 hours: daily activity reports, pending assessments, course deadlines,
 * parent sessions, and nudges admins about overdue registration approvals.
 *
 * Default schedule: 10:00 AM every day. Override with REMINDER_CRON env var
 * (standard cron syntax) if a different time is needed.
 */
export const startReminderAutomationCron = () => {
  const schedule = process.env.REMINDER_CRON || "0 10 * * *";

  cron.schedule(schedule, async () => {
    try {
      const result = await dispatchDueReminders();
      console.log(
        `Reminder automation completed: ${result.sentCount} teacher reminder(s) sent, ` +
        `${result.failedCount} failed, ${result.adminNotified} admin(s) notified, ` +
        `${result.mentorsNotified} mentor(s) notified about at-risk fellows.`
      );
    } catch (error) {
      console.error("Reminder automation failed:", error.message);
    }
  });

  console.log(`Reminder automation cron scheduled: ${schedule}`);
};

export default startReminderAutomationCron;