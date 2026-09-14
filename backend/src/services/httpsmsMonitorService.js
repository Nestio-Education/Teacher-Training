import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { getMessagingConfig } from "../email.js";
import { sendEmail } from "../email.js";

const LOOKBACK_HOURS = 2;
const FAILURE_THRESHOLD = 3; // consecutive failed/expired httpSMS sends with zero success in the window

/**
 * Checks recent httpSMS-channel Notification records for a run of failures with no successes,
 * and alerts admins if the gateway phone looks offline. Designed to be cheap enough to run hourly.
 */
export async function checkHttpSmsGatewayHealth() {
  const conf = await getMessagingConfig();
  if (conf.provider !== "httpsms") {
    return { checked: false, reason: "httpsms is not the active messaging provider" };
  }

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000);
  const recent = await Notification.find({
    channel: "sms",
    createdAt: { $gte: since },
    providerMessageId: { $exists: true },
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  if (recent.length === 0) {
    return { checked: true, alerted: false, reason: "no httpSMS sends attempted in the lookback window" };
  }

  const hasRecentSuccess = recent.some((n) => n.status === "delivered" || n.status === "sent");
  const consecutiveFailures = [];

  for (const n of recent) {
    if (n.status === "failed" || n.status === "expired") consecutiveFailures.push(n);
    else break; // stop counting at the first non-failure, most-recent-first
  }

  if (hasRecentSuccess || consecutiveFailures.length < FAILURE_THRESHOLD) {
    return { checked: true, alerted: false, consecutiveFailures: consecutiveFailures.length };
  }

  await alertAdminsGatewayOffline(consecutiveFailures.length);
  return { checked: true, alerted: true, consecutiveFailures: consecutiveFailures.length };
}

async function alertAdminsGatewayOffline(failureCount) {
  const admins = await User.find({ role: "admin", status: "approved" }).select("_id email name").lean();
  const title = "httpSMS gateway phone may be offline";
  const body = `${failureCount} consecutive SMS sends via httpSMS have failed or expired in the last ${LOOKBACK_HOURS} hours with no successful delivery. Check that the paired Android phone is powered on, connected, and has not had the httpSMS app killed in the background.`;

  await Promise.allSettled(
    admins.map(async (admin) => {
      await Notification.create({
        recipient: admin._id,
        channel: "in_app",
        title,
        body,
        status: "delivered",
        sentAt: new Date(),
        metadata: { priority: "urgent", category: "alert" },
      });

      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: `SpacECE: ${title}`,
          html: `<h2>${title}</h2><p>${body}</p>`,
        });
      }
    })
  );
}
