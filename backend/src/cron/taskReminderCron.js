import cron from "node-cron";
import { MentorTask } from "../models/MentorTask.js";
import { Notification } from "../models/Notification.js";

/**
 * Runs every minute.
 * Finds tasks whose dueDate+dueTime is exactly 2 hours away (±1 min window),
 * sends an in-app notification to the fellow, and marks reminderSentAt so it
 * never fires twice for the same task.
 */
export function startTaskReminderCron(io) {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Target window: tasks due between 1h59m and 2h01m from now
      const windowStart = new Date(now.getTime() + (2 * 60 - 1) * 60 * 1000); // +119 min
      const windowEnd   = new Date(now.getTime() + (2 * 60 + 1) * 60 * 1000); // +121 min

      // Fetch pending tasks that have a dueDate+dueTime set and no reminder sent yet
      const tasks = await MentorTask.find({
        status: { $in: ["pending", "submitted"] },
        dueDate: { $ne: "" },
        dueTime: { $ne: "" },
        reminderSentAt: null,
      }).populate("fellowId", "name").populate("mentorId", "name");

      for (const task of tasks) {
        if (!task.dueDate || !task.dueTime) continue;

        // Build a Date from dueDate + dueTime (treat as local time)
        const [year, month, day] = task.dueDate.split("-").map(Number);
        const [hour, minute]     = task.dueTime.split(":").map(Number);
        const dueAt = new Date(year, month - 1, day, hour, minute, 0, 0);

        // Check if dueAt falls inside our 2-minute window
        if (dueAt >= windowStart && dueAt <= windowEnd) {
          // Create in-app notification
          const notif = await Notification.create({
            recipient: task.fellowId._id,
            type: "task_reminder",
            title: `⏰ Reminder: "${task.title}" at ${task.dueTime}`,
            body: `You have a task scheduled for ${task.dueTime} today: "${task.title}". ${task.description ? task.description : ""} Please be ready!`,
            read: false,
          });

          // Emit via Socket.IO if available
          if (io) {
            io.to(`user:${task.fellowId._id}`).emit("notification:new", notif);
          }

          // Mark reminder as sent so it never fires again for this task
          task.reminderSentAt = now;
          await task.save();

          console.log(
            `[taskReminderCron] Reminder sent → fellow: ${task.fellowId.name}, task: "${task.title}", dueTime: ${task.dueTime}`
          );
        }
      }
    } catch (err) {
      console.error("[taskReminderCron] Error:", err.message);
    }
  });

  console.log("Task reminder cron scheduled: every minute (2-hour advance alerts)");
}