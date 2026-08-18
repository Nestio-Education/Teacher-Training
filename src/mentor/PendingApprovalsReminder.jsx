import { useEffect, useRef } from "react";
import { getMentorFellows, notifyPendingApprovals } from "../services/api";

// How often to poll for pending fellows while the mentor is active in the app.
const CHECK_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
// Don't nag the mentor more than once per this window, even if pendingCount stays > 0.
const REMIND_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Mount this once near the top of the Mentor Dashboard shell (not inside a specific tab)
 * so it keeps polling regardless of which tab the mentor is viewing.
 *
 * <PendingApprovalsReminder
 *   setToast={setToast}
 *   onPendingCountChange={setPendingApprovalsCount} // optional: drive a sidebar badge
 * />
 *
 * Behavior:
 * - Polls getMentorFellows() every CHECK_INTERVAL_MS.
 * - Shows an in-app toast when pendingCount > 0, at most once per REMIND_COOLDOWN_MS.
 * - On that same cooldown, also calls notifyPendingApprovals() so the backend
 *   emails the mentor at their login email address — reaching them even if
 *   they've stepped away from this tab.
 */
export function PendingApprovalsReminder({ setToast, onPendingCountChange }) {
  const lastReminderRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const checkPending = async () => {
      try {
        const res = await getMentorFellows();
        if (cancelled) return;

        const pendingCount = (res?.fellows || []).filter((f) => f.status === "pending").length;
        onPendingCountChange?.(pendingCount);

        const now = Date.now();
        if (pendingCount > 0 && now - lastReminderRef.current > REMIND_COOLDOWN_MS) {
          lastReminderRef.current = now;

          // In-app nudge
          setToast?.({
            msg: `⏳ You have ${pendingCount} fellow${pendingCount > 1 ? "s" : ""} awaiting approval.`,
            type: "info",
          });

          // Email nudge — backend sends to the mentor's login email via sendNotificationEmail
          try {
            await notifyPendingApprovals();
          } catch {
            // Silent fail — a failed email send shouldn't disrupt the in-app toast.
          }
        }
      } catch {
        // Silent fail — a background check shouldn't disrupt the mentor's session.
      }
    };

    checkPending(); // run once immediately on mount
    const interval = setInterval(checkPending, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [setToast, onPendingCountChange]);

  return null; // no UI of its own — drives toasts + optional badge count
}