import cron from "node-cron";
import { sendDailyDigests } from "../services/dailyDigestService.js";
import { PortalSetting } from "../models/PortalSetting.js";

/**
 * Runs every morning and sends each teacher ONE combined email + SMS +
 * in-app digest of everything due that day. Separate from the 10:00 AM
 * per-item reminder cron (reminderCron.js) — this is the "start of your
 * day" nudge, that one is the "24h before deadline" nudge.
 *
 * Default schedule: 8:00 AM every day. Override with DAILY_DIGEST_CRON
 * env var (standard cron syntax) if a different time is needed.
 */
export const startDailyDigestCron = () => {
  const schedule = process.env.DAILY_DIGEST_CRON || "0 8 * * *";

  cron.schedule(schedule, async () => {
    try {
      const setting = await PortalSetting.findOne({ key: "enableReminders" });
      if (setting && setting.value === false) {
        console.log("Daily digest skipped (disabled in Portal Settings).");
        return;
      }

      const result = await sendDailyDigests();
      console.log(
        `Daily digest completed: ${result.teachersNotified} teacher(s) notified, ` +
        `${result.failedCount} failed, ${result.totalItemsScanned} item(s) scanned.`
      );
    } catch (error) {
      console.error("Daily digest failed:", error.message);
    }
  });

  console.log(`Daily digest cron scheduled: ${schedule}`);
};

export default startDailyDigestCron;
