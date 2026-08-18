import express from "express";
import mongoose from "mongoose";
import { requireRole } from "../auth.js";
import { ActivitySubmission } from "../models/ActivitySubmission.js";
import { TeacherTask } from "../models/TeacherTask.js";
import { User } from "../models/User.js";
import { PDCAReport } from "../models/PDCAReport.js";
import { PDCACycle } from "../models/MentorTracking.js";
import { MonthCurriculum } from "../models/MonthCurriculum.js";
import {
  matchDeliverables,
  autoAssessSuccessCheck,
  buildFactsSummary,
} from "../services/pdcaGrounding.js";
import { generatePDCADraft } from "../services/aiPdcaGenerator.js";
// Legacy Month 1 fallback — this is "the first growth cycle" and must keep
// working exactly as it always has, with or without anyone ever uploading
// a curriculum. Only used when month === 1 and nothing's been published to
// MonthCurriculum for it (see /generate below).
import { MONTH1_MONTHLY_OBJECTIVE, MONTH1_WEEKLY_FOCUS } from "../data/month1Curriculum.js";
import {
  matchMonth1Deliverables,
  autoAssessSuccessCheck as autoAssessMonth1SuccessCheck,
  buildFactsSummary as buildMonth1FactsSummary,
} from "../services/month1Grounding.js";

const router = express.Router();

// Same DB-readiness guard already used in mentorTracking.js.
function requireDbConnection(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: "Database connection is not ready. Please try again in a moment.",
    });
  }
  next();
}
router.use(requireDbConnection);

async function ensureFellowBelongsToMentor(mentorId, fellowId) {
  const mentor = await User.findById(mentorId);
  const assignedTeachers = mentor?.mentorProfile?.assignedTeachers || [];
  return User.findOne({
    _id: fellowId,
    $or: [{ assignedMentor: mentorId }, { _id: { $in: assignedTeachers } }],
  });
}

// ── GET /api/pdca/mentor/reports — every PDCA report across this mentor's
// fellows, any month/status. Backs the unified Growth Cycle History list
// and the Fellow Progress panel (replaces the old PDCACycle-based views).
// NOTE: must be declared before GET /:fellowId so "mentor" isn't parsed as
// a fellowId.
router.get("/mentor/reports", requireRole("mentor"), async (req, res, next) => {
  try {
    const reports = await PDCAReport.find({ mentorId: req.user.id })
      .populate("fellowId", "name email")
      .sort({ updatedAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pdca/generate — Mentor clicks "Generate Draft" ──
router.post("/generate", requireRole("mentor"), async (req, res, next) => {
  try {
    const { fellowId } = req.body;
    const month = Number(req.body.month) || 1;
    if (!fellowId || !mongoose.Types.ObjectId.isValid(fellowId)) {
      return res.status(400).json({ success: false, message: "A valid fellowId is required." });
    }

    const curriculum = await MonthCurriculum.findOne({ month, status: "published" });
    if (!curriculum && month !== 1) {
      return res.status(400).json({
        success: false,
        message: `Month ${month} doesn't have a published curriculum yet. Upload one from the Curriculum tab first.`,
      });
    }

    const fellow = await ensureFellowBelongsToMentor(req.user.id, fellowId);
    if (!fellow) {
      return res.status(404).json({ success: false, message: "Fellow not found or not assigned to you." });
    }

    const [submissions, tasks] = await Promise.all([
      ActivitySubmission.find({ teacher: fellowId }),
      TeacherTask.find({ teacher: fellowId }),
    ]);

    // All facts computed deterministically first — the AI only writes
    // prose from these, per the grounding rule. Month 1 always uses the
    // original hardcoded curriculum (the "first growth cycle") unless an
    // admin/mentor has explicitly published a replacement for it; every
    // other month requires an uploaded, published curriculum.
    let deliverablesStatus, successCheck, facts, monthlyObjective, weeklyFocus, curriculumVersion;
    if (curriculum) {
      deliverablesStatus = matchDeliverables(curriculum.deliverables, submissions, tasks);
      successCheck = autoAssessSuccessCheck(curriculum.successCheck, deliverablesStatus);
      facts = buildFactsSummary(fellow, submissions, tasks, deliverablesStatus);
      monthlyObjective = curriculum.monthlyObjective;
      weeklyFocus = curriculum.weeklyFocus;
      curriculumVersion = curriculum.curriculumVersion;
    } else {
      deliverablesStatus = matchMonth1Deliverables(submissions, tasks);
      successCheck = autoAssessMonth1SuccessCheck(deliverablesStatus);
      facts = buildMonth1FactsSummary(fellow, submissions, tasks, deliverablesStatus);
      monthlyObjective = MONTH1_MONTHLY_OBJECTIVE;
      weeklyFocus = MONTH1_WEEKLY_FOCUS;
      curriculumVersion = "month1-legacy";
    }

    const groundingData = {
      fellowName: fellow.name,
      monthlyObjective,
      weeklyFocus,
      deliverables: deliverablesStatus,
      successCheckDo: successCheck.do,
      facts,
    };

    const aiResult = await generatePDCADraft(groundingData);

    const report = await PDCAReport.findOneAndUpdate(
      { fellowId, month },
      {
        $set: {
          mentorId: req.user.id,
          curriculumVersion,
          "sections.plan.aiText": aiResult.plan,
          "sections.do.aiText": aiResult.do,
          "sections.check.aiText": aiResult.check,
          "sections.act.aiText": aiResult.act,
          "sections.plan.isAIDrafted": !!aiResult.plan,
          "sections.do.isAIDrafted": !!aiResult.do,
          "sections.check.isAIDrafted": !!aiResult.check,
          "sections.act.isAIDrafted": !!aiResult.act,
          deliverablesStatus,
          lowDataFields: aiResult.low_data_fields || [],
          aiProvider: aiResult.provider,
          aiAvailable: aiResult.aiAvailable,
          aiGeneratedAt: new Date(),
          status: "draft",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, report, aiAvailable: aiResult.aiAvailable, successCheck });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/pdca/:fellowId — fetch the current draft/approved report ──
router.get("/:fellowId", requireRole("mentor"), async (req, res, next) => {
  try {
    const { fellowId } = req.params;
    const month = Number(req.query.month) || 1;
    if (!mongoose.Types.ObjectId.isValid(fellowId)) {
      return res.status(400).json({ success: false, message: "Invalid fellowId." });
    }
    const report = await PDCAReport.findOne({ fellowId, month, mentorId: req.user.id });
    res.json({ success: true, report: report || null });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/pdca/:fellowId/approve — Mentor clicks "Approve & Save" ──
router.post("/:fellowId/approve", requireRole("mentor"), async (req, res, next) => {
  try {
    const { fellowId } = req.params;
    const { plan, do: doText, check, act, deliverablesStatus } = req.body;
    const month = Number(req.body.month) || 1;

    if (!plan?.trim() || !doText?.trim() || !check?.trim() || !act?.trim()) {
      return res.status(400).json({ success: false, message: "All four PDCA sections are required to approve." });
    }

    const report = await PDCAReport.findOne({ fellowId, month, mentorId: req.user.id });
    if (!report) {
      return res.status(404).json({ success: false, message: "Generate a draft first." });
    }

    report.sections.plan.mentorText = plan;
    report.sections.do.mentorText = doText;
    report.sections.check.mentorText = check;
    report.sections.act.mentorText = act;
    report.sections.plan.isMentorEdited = plan.trim() !== (report.sections.plan.aiText || "").trim();
    report.sections.do.isMentorEdited = doText.trim() !== (report.sections.do.aiText || "").trim();
    report.sections.check.isMentorEdited = check.trim() !== (report.sections.check.aiText || "").trim();
    report.sections.act.isMentorEdited = act.trim() !== (report.sections.act.aiText || "").trim();

    if (Array.isArray(deliverablesStatus)) {
      report.deliverablesStatus = report.deliverablesStatus.map((d) => {
        const override = deliverablesStatus.find((x) => x.id === d.id);
        if (!override) return d;
        return {
          ...(d.toObject ? d.toObject() : d),
          status: override.status,
          mentorOverride: override.status !== d.status,
        };
      });
    }

    // Family ID carry-forward (Section 7) — store matched entries on the
    // approved report; Month 2 doesn't exist yet to pull these into.
    const familyDeliverable = report.deliverablesStatus.find((d) => d.id === "family_id_list");
    if (familyDeliverable && familyDeliverable.status === "met") {
      const familySubs = await ActivitySubmission.find({
        teacher: fellowId,
        description: { $regex: /family/i },
      }).select("activityName description");
      report.familyIdentificationCarryForward = familySubs.map(
        (s) => s.activityName || s.description.slice(0, 120)
      );
    }

    report.status = "approved";
    report.approvedAt = new Date();
    report.approvedBy = req.user.id;
    await report.save();

    const existingCycle = await PDCACycle.findOne({
      mentorId: req.user.id,
      menteeId: fellowId,
      sourceReportId: report._id,
    });

    if (existingCycle) {
      existingCycle.plan = plan;
      existingCycle.do = doText;
      existingCycle.check = check;
      existingCycle.act = act;
      existingCycle.outcome = existingCycle.outcome || "pending";
      existingCycle.status = "Completed";
      existingCycle.outcomeNotes = existingCycle.outcomeNotes || "";
      await existingCycle.save();
    } else {
      const cycleNumber = (await PDCACycle.countDocuments({ mentorId: req.user.id, menteeId: fellowId })) + 1;
      await PDCACycle.create({
        mentorId: req.user.id,
        menteeId: fellowId,
        cycleNumber,
        plan,
        do: doText,
        check,
        act,
        category: "Other",
        outcome: "pending",
        status: "Completed",
        sourceReportId: report._id,
      });
    }

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/pdca/admin/reports — Section 6: "visible to Admin for oversight" ──
router.get("/admin/reports", requireRole("admin"), async (req, res, next) => {
  try {
    const reports = await PDCAReport.find({ status: "approved" })
      .populate("fellowId", "name email")
      .populate("mentorId", "name email")
      .sort({ approvedAt: -1 });
    res.json({ success: true, reports });
  } catch (err) {
    next(err);
  }
});

export default router;