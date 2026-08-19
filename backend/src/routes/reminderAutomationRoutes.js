import express from "express";
import { requireAuth, requireRole } from "../auth.js";
import { getRiskReport, getUpcomingReminders } from "../services/reminderPredictionService.js";
import { dispatchDueReminders } from "../services/reminderDispatchService.js";

const router = express.Router();

/**
 * GET /api/reminder-automation/risk-report
 * Full "who is likely to miss deadlines" risk list for every approved teacher.
 * Admin only.
 */
router.get("/risk-report", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const report = await getRiskReport();
    res.json({ success: true, ...report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/reminder-automation/upcoming
 * Concrete items due within the next 24 hours, across all categories,
 * plus registration approvals waiting on the admin/mentor.
 * Admin only.
 */
router.get("/upcoming", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const upcoming = await getUpcomingReminders();
    res.json({ success: true, ...upcoming });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/reminder-automation/send-reminders
 * Manually trigger sending reminders for everything currently due.
 * The cron job (reminderCron.js) calls the same dispatchDueReminders()
 * function automatically, every day — this route is for an on-demand
 * admin trigger (the "Send Reminders Now" button).
 * Admin only.
 */
router.post("/send-reminders", requireAuth, requireRole("admin"), async (_req, res) => {
  try {
    const result = await dispatchDueReminders();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;