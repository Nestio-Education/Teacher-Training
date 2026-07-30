import express from "express";
import mongoose from "mongoose";
import { PDCACycle, CapstoneSubmission, MenteeObservation } from "../models/MentorTracking.js";
import { sendNotificationEmail } from "../email.js"; // adjust path if email.js lives elsewhere

// Note: We expect the router to be mounted such that requireAuth and requireRole("mentor")
// are applied before reaching these routes, or we'll apply them in server.js.
const router = express.Router();

// ---------------------------------------------------------------------------
// DB CONNECTION GUARD
// ---------------------------------------------------------------------------
// Mongoose readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
// If Atlas is unreachable (cluster paused, IP not whitelisted, network blip),
// every query below would otherwise hang until it times out and throws a
// generic 500 with no useful message. This guard fails fast with a clear
// 503 instead, and logs the readyState so it's obvious in the server console.
function requireDbConnection(req, res, next) {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    const stateNames = { 0: "disconnected", 1: "connected", 2: "connecting", 3: "disconnecting" };
    console.error(
      `[mentorTracking] DB not ready. readyState=${state} (${stateNames[state] || "unknown"}). ` +
      `Check: cluster paused? IP allowlisted in Atlas Network Access? MONGO_URI correct in .env?`
    );
    return res.status(503).json({
      success: false,
      message: "Database connection is not ready. Please try again in a moment.",
      debug: { readyState: state, readyStateName: stateNames[state] || "unknown" },
    });
  }
  next();
}

router.use(requireDbConnection);

// --- PDCA / Growth Cycles ---
router.get("/pdca", async (req, res, next) => {
  try {
    const cycles = await PDCACycle.find({ mentorId: req.user.id })
      .populate("menteeId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, cycles });
  } catch (err) {
    next(err);
  }
});

router.post("/pdca", async (req, res, next) => {
  try {
    console.log("[pdca:create] body received:", JSON.stringify(req.body));

    const { menteeId, plan, do: doField, check, act, cycleNumber } = req.body;

    if (!menteeId) {
      return res.status(400).json({ success: false, message: "menteeId is required" });
    }
    // FIX 1: validate menteeId is a real ObjectId *before* hitting Mongoose,
    // so a bad/blank id from the frontend returns a clean 400 instead of a
    // raw CastError 500.
    if (!mongoose.Types.ObjectId.isValid(menteeId)) {
      return res.status(400).json({ success: false, message: "menteeId is not a valid id." });
    }
    if (!plan || !doField || !check || !act) {
      return res.status(400).json({ success: false, message: "All Growth Cycle fields (plan, do, check, act) are required" });
    }

    // FIX 2: if a cycleNumber wasn't sent, or collides with one that already
    // exists for this mentor+mentee, recompute it server-side instead of
    // trusting whatever the frontend calculated (which can drift, e.g. after
    // a failed earlier attempt, and trip a unique index).
    const existingForMentee = await PDCACycle.countDocuments({
      mentorId: req.user.id,
      menteeId,
    });
    const safeCycleNumber = cycleNumber && !Number.isNaN(Number(cycleNumber))
      ? Number(cycleNumber)
      : existingForMentee + 1;

    const cycle = await PDCACycle.create({
      mentorId: req.user.id,
      menteeId,
      cycleNumber: safeCycleNumber,
      plan,
      do: doField,
      check,
      act
    });
    const populated = await cycle.populate("menteeId", "name email");
    res.status(201).json({ success: true, cycle: populated });
  } catch (err) {
    // FIX 3: turn the three most common Mongoose failure modes into clear,
    // actionable 4xx responses instead of a bare 500 with no explanation.
    console.error("[pdca:create] FAILED. Full error below:");
    console.error("[pdca:create] DB readyState at time of failure:", mongoose.connection.readyState);
    console.error(err);

    if (err.code === 11000) {
      // Duplicate key — almost always a unique index collision on
      // {mentorId, cycleNumber} or similar. Log the offending key so it's
      // visible in the server console even though we still respond cleanly.
      console.error("[pdca:create] Duplicate key error. keyValue:", err.keyValue);
      return res.status(409).json({
        success: false,
        message: "A Growth Cycle with that cycle number already exists for this fellow. Please try again.",
        debug: err.keyValue,
      });
    }
    if (err.name === "ValidationError") {
      const fieldErrors = Object.keys(err.errors || {}).map(k => `${k}: ${err.errors[k].message}`);
      console.error("[pdca:create] Validation error fields:", fieldErrors);
      return res.status(400).json({
        success: false,
        message: "Growth Cycle validation failed.",
        debug: fieldErrors,
      });
    }
    if (err.name === "CastError") {
      console.error("[pdca:create] Cast error on field:", err.path, "value:", err.value);
      return res.status(400).json({
        success: false,
        message: `Invalid value for field "${err.path}".`,
        debug: { path: err.path, value: err.value },
      });
    }
    // FIX 4: Mongoose network/timeout errors (e.g. MongoServerSelectionError,
    // MongoNetworkError) surface here as generic 500s otherwise. Flag them
    // explicitly so it's obvious this is a connectivity issue, not a bug in
    // the request itself — matches the Atlas "Connection failed [1006]"
    // symptom seen in the Data Explorer.
    if (err.name === "MongoServerSelectionError" || err.name === "MongoNetworkError" || err.name === "MongoTimeoutError") {
      return res.status(503).json({
        success: false,
        message: "Could not reach the database. The cluster may be paused, or your IP may not be allowlisted in Atlas Network Access.",
        debug: { errorName: err.name },
      });
    }

    next(err);
  }
});

// --- Capstone Submissions ---
router.get("/capstone", async (req, res, next) => {
  try {
    const submissions = await CapstoneSubmission.find({ mentorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, submissions });
  } catch (err) {
    next(err);
  }
});

router.post("/capstone", async (req, res, next) => {
  try {
    const submission = await CapstoneSubmission.create({ mentorId: req.user.id, ...req.body });
    res.status(201).json({ success: true, submission });
  } catch (err) {
    next(err);
  }
});

// --- Mentee Observations ---
router.get("/observations", async (req, res, next) => {
  try {
    const observations = await MenteeObservation.find({ mentorId: req.user.id })
      .populate("menteeId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, observations });
  } catch (err) {
    next(err);
  }
});

router.post("/observations", async (req, res, next) => {
  try {
    const observation = await MenteeObservation.create({ mentorId: req.user.id, ...req.body });
    res.status(201).json({ success: true, observation });
  } catch (err) {
    next(err);
  }
});

// --- Pending Fellow Approvals count (used by reminder polling) ---
router.get("/pending-approvals-count", async (req, res, next) => {
  try {
    const { Fellow } = await import("../models/Fellow.js");
    const pendingCount = await Fellow.countDocuments({
      mentorId: req.user.id,
      status: "pending"
    });
    res.json({ success: true, pendingCount });
  } catch (err) {
    next(err);
  }
});

// --- Pending Fellow Approvals: email nudge ---
router.post("/notify-pending", async (req, res, next) => {
  try {
    console.log("[notify-pending] called by mentor:", req.user?.id);

    const { Fellow } = await import("../models/Fellow.js");
    const pendingFellows = await Fellow.find({
      mentorId: req.user.id,
      status: "pending"
    }).select("name");

    console.log("[notify-pending] pendingFellows found:", pendingFellows.length);

    if (pendingFellows.length === 0) {
      return res.json({ success: true, sent: false, reason: "no_pending", message: "No pending approvals." });
    }

    const listHtml = pendingFellows.map((f) => `<li>${f.name}</li>`).join("");
    const count = pendingFellows.length;

    const result = await sendNotificationEmail({
      recipient: req.user.id,
      title: `⏳ ${count} fellow${count > 1 ? "s" : ""} awaiting your approval`,
      body: `You have ${count} fellow${count > 1 ? "s" : ""} waiting for approval:<ul>${listHtml}</ul>`,
      category: "mentor_pending_approvals",
    });

    console.log("[notify-pending] sendNotificationEmail result:", result);

    res.json({
      success: true,
      sent: result.success,
      count,
      reason: result.success ? undefined : "email_send_failed",
      error: result.success ? undefined : result.error,
    });
  } catch (err) {
    console.error("[notify-pending] unhandled error:", err);
    next(err);
  }
});

export default router;