import cron from "node-cron";
import { checkHttpSmsGatewayHealth } from "../services/httpsmsMonitorService.js";

/**
 * Runs hourly. If httpSMS is the active messaging provider and recent sends look like
 * the gateway phone has gone offline, alerts admins. No-op if httpSMS isn't the active provider.
 * Override with HTTPSMS_MONITOR_CRON (standard cron syntax) if a different frequency is needed.
 */
export const startHttpSmsMonitorCron = () => {
  const schedule = process.env.HTTPSMS_MONITOR_CRON || "0 * * * *";
  cron.schedule(schedule, async () => {
    try {
      const result = await checkHttpSmsGatewayHealth();
      if (result.alerted) {
        console.warn("[httpsms monitor] gateway_alert_sent", JSON.stringify(result));
      }
    } catch (error) {
      console.error("httpSMS monitor cron failed:", error.message);
    }
  });
  console.log(`httpSMS gateway monitor cron scheduled: ${schedule}`);
};

export default startHttpSmsMonitorCron;
