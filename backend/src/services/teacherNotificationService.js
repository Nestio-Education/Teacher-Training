import TeacherNotification from "../models/TeacherNotification.js";
import AutomationTeacher from "../models/AutomationTeacher.js";
import { User } from "../models/User.js";
import { sendNotification } from "./notificationService.js";

export const createDailyTaskNotification = async (assignment) => {
  const title = "Today’s preschool activity tasks are ready";
  const message = `Good morning ${assignment.teacherName}. Your class for today is ${assignment.className} ${assignment.level}. You have ${assignment.activityCount} activities assigned in your dashboard.`;

  const teacherNotification = await TeacherNotification.create({
    teacher: assignment.teacher,
    teacherId: assignment.teacherId,
    title,
    message,
    notificationDate: assignment.assignmentDate,
    type: "Daily Task",
    visibleFrom: new Date(),
    relatedAssignment: assignment._id
  });

  try {
    const automationTeacher = await AutomationTeacher.findById(assignment.teacher).lean();

    if (automationTeacher?.email) {
      const user = await User.findOne({
        email: automationTeacher.email.toLowerCase()
      }).select("_id");

      if (user) {
        await sendNotification({
          recipientId: user._id,
          templateKey: "daily_task_assigned",
          channel: "in_app",
          priority: "normal",
          replacements: {
            message
          },
          metadata: {
            assignmentId: assignment._id,
            assignmentDate: assignment.assignmentDate,
            teacherId: assignment.teacherId,
            notificationType: "daily_task_assigned"
          }
        });
      } else {
        console.warn(
          `No User account found for automation teacher email: ${automationTeacher.email}`
        );
      }
    }
  } catch (error) {
    console.warn(
      "Failed to create main daily task notification:",
      error.message
    );
  }

  return teacherNotification;
};

export const getTeacherNotifications = async (teacherId) => {
  return TeacherNotification.find({ teacherId }).sort({ createdAt: -1 }).limit(50);
};

export default {
  createDailyTaskNotification,
  getTeacherNotifications
};
