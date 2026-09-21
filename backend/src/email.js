import nodemailer from "nodemailer";
import { PortalSetting } from "./models/PortalSetting.js";
import mongoose from "mongoose";
import { Resend } from "resend";

/**
 * Load the active email provider ("smtp" default, or "resend") plus
 * whichever provider's config, from PortalSetting with env var fallback.
 */
async function getEmailProviderConfig() {
  const keys = ["emailProvider", "resendApiKey", "fromEmail", "fromName"];
  const docs = await PortalSetting.find({ key: { $in: keys } });
  const map = {};
  docs.forEach((d) => { map[d.key] = d.value; });

  const provider = String(map.emailProvider || process.env.EMAIL_PROVIDER || "smtp");
  const apiKey = String(map.resendApiKey || process.env.RESEND_API_KEY || "");
  const fromEmail = String(map.fromEmail || process.env.FROM_EMAIL || "");
  const fromName = String(map.fromName || process.env.FROM_NAME || "SpacECE Notifications");

  return { provider, apiKey, fromEmail, fromName };
}

async function sendResendEmail({ to, subject, html, fromEmail, fromName }) {
  const { apiKey } = await getEmailProviderConfig();
  if (!apiKey) {
    return { success: false, error: "Resend not configured. Set the Resend API key in Settings & Roles > Email." };
  }
  if (!fromEmail) {
    return { success: false, error: "Resend requires a verified From Email. Set it in Settings & Roles > Email." };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html: html || subject,
    });

    if (error) {
      return { success: false, error: error.message || "Resend send failed" };
    }
    return { success: true, messageId: data?.id };
  } catch (error) {
    return { success: false, error: error.message || "Unknown Resend error" };
  }
}

/**
 * Load SMTP config from the PortalSetting collection.
 * Returns null if SMTP is not configured.
 */
async function getSmtpConfig() {
  const keys = ["smtpHost", "smtpPort", "smtpUser", "smtpPass", "fromEmail", "fromName"];
  const docs = await PortalSetting.find({ key: { $in: keys } });
  const map = {};
  docs.forEach((d) => { map[d.key] = d.value; });

  // Fallback to environment variables
  if ((!map.smtpHost || !map.smtpUser || !map.smtpPass)) {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return {
        host: String(process.env.SMTP_HOST),
        port: Number(process.env.SMTP_PORT) || 587,
        user: String(process.env.SMTP_USER),
        pass: String(process.env.SMTP_PASS),
        fromEmail: String(process.env.FROM_EMAIL || process.env.SMTP_USER),
        fromName: String(process.env.FROM_NAME || "SpacECE Notifications"),
      };
    }
    return null;
  }

  return {
    host: String(map.smtpHost),
    port: Number(map.smtpPort) || 587,
    user: String(map.smtpUser),
    pass: String(map.smtpPass),
    fromEmail: String(map.fromEmail || map.smtpUser),
    fromName: String(map.fromName || "SpacECE Notifications"),
  };
}

/**
 * Send an email to a single recipient using the portal's SMTP config.
 * Returns { success: boolean, error?: string }.
 */
export async function sendEmail({ to, subject, html }) {
  const { provider, fromEmail, fromName } = await getEmailProviderConfig();

  if (provider === "resend") {
    const result = await sendResendEmail({ to, subject, html, fromEmail, fromName });
    if (!result.success) {
      console.error("[email] resend_send_error", JSON.stringify({ to, subject, error: result.error }));
    }
    return result;
  }

  // Existing SMTP path — unchanged from here down
  try {
    const config = await getSmtpConfig();
    if (!config) {
      return { success: false, error: "SMTP not configured. Set SMTP settings in Settings & Roles > Email." };
    }

    const transportOpts = {
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: { user: config.user, pass: config.pass },
      family: 4, // Force IPv4 to prevent ENETUNREACH / IPv6 errors on cloud servers like Render
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
      tls: {
        rejectUnauthorized: false,
      },
    };


    const transporter = nodemailer.createTransport(transportOpts);

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html: html || subject,
    });

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[email] send_error", JSON.stringify({ to, subject, error: error.message }));
    return { success: false, error: error.message || "Unknown email error" };
  }
}

/**
 * Send bulk emails to multiple recipients.
 * Returns an array of results, one per recipient.
 */
export async function sendBulkEmails({ recipients, subject, body }) {
  const html = body
    .replace(/\n/g, "<br>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  const BATCH_SIZE = 10;
  const allResults = [];

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (r) => {
        const result = await sendEmail({ to: r.email, subject, html });
        return { recipientId: r._id, email: r.email, ...result };
      })
    );
    allResults.push(...results.map((r) =>
      r.status === "fulfilled"
        ? r.value
        : { recipientId: null, success: false, error: r.reason?.message || "Failed to send" }
    ));
  }

  return allResults;
}

/**
 * Send notification email and create in-app notification
 */
export async function sendNotificationEmail({ recipient, title, body, category = "system" }) {
  const teacher = await (await import("./models/User.js")).User.findById(recipient).select("name email");
  
  if (!teacher || !teacher.email) {
    return { success: false, error: "Recipient has no email address" };
  }

  // Create in-app notification
  const Notification = (await import("./models/Notification.js")).Notification;
  const notification = await Notification.create({
    recipient,
    channel: "email",
    title,
    body,
    status: "pending",
    metadata: { category, priority: "normal" },
  });

  // Send email if provider is configured
  const providerConfig = await getEmailProviderConfig();
  let canSend = false;
  if (providerConfig.provider === "resend") {
    canSend = !!providerConfig.apiKey;
  } else {
    canSend = !!(await getSmtpConfig());
  }

  if (canSend) {
    const result = await sendEmail({
      to: teacher.email,
      subject: title,
      html: `<h2>${title}</h2><p>${body}</p><p><a href="http://localhost:5173">Open SpacECE Portal</a></p>`,
    });
    
    await Notification.findByIdAndUpdate(notification._id, {
      status: result.success ? "sent" : "failed",
      error: result.error,
      sentAt: result.success ? new Date() : undefined,
    });

    console.log("[email] notification_sent", JSON.stringify({ 
      recipient: teacher.email, 
      title, 
      success: result.success 
    }));
    return result;
  }

  await Notification.findByIdAndUpdate(notification._id, {
    status: "skipped",
    error: "Email provider not configured",
  });

  return { success: false, error: "Email provider not configured" };
}

// Start: Dnyaneshwari Thorat
/**
 * Load Messaging provider configuration (Twilio, Vonage, Fast2SMS).
 */
export async function getMessagingConfig() {
  const keys = [
    "messagingProvider",
    "twilioSid", "twilioToken", "twilioFrom",
    "vonageApiKey", "vonageApiSecret", "vonageFrom",
    "fast2smsKey", "httpsmsApiKey", "httpsmsPhone"
  ];
  const docs = await PortalSetting.find({ key: { $in: keys } });
  const map = {};
  docs.forEach((d) => { map[d.key] = d.value; });

  return {
    provider: String(map.messagingProvider || process.env.MESSAGING_PROVIDER || "twilio"),
    twilioSid: String(map.twilioSid || process.env.TWILIO_ACCOUNT_SID || ""),
    twilioToken: String(map.twilioToken || process.env.TWILIO_AUTH_TOKEN || ""),
    twilioFrom: String(map.twilioFrom || process.env.TWILIO_FROM_NUMBER || ""),
    vonageApiKey: String(map.vonageApiKey || process.env.VONAGE_API_KEY || ""),
    vonageApiSecret: String(map.vonageApiSecret || process.env.VONAGE_API_SECRET || ""),
    vonageFrom: String(map.vonageFrom || process.env.VONAGE_FROM || "SpacECE"),
    fast2smsKey: String(map.fast2smsKey || process.env.FAST2SMS_KEY || ""),
    httpsmsApiKey: String(map.httpsmsApiKey || process.env.HTTPSMS_API_KEY || ""),
    httpsmsPhone: String(map.httpsmsPhone || process.env.HTTPSMS_PHONE || ""),
  };
}

// Keep getTwilioConfig as fallback for backward compatibility
export async function getTwilioConfig() {
  const conf = await getMessagingConfig();
  if (conf.provider !== "twilio" || !conf.twilioSid || !conf.twilioToken) return null;
  return {
    sid: conf.twilioSid,
    token: conf.twilioToken,
    from: conf.twilioFrom
  };
}
// End: Dnyaneshwari Thorat
