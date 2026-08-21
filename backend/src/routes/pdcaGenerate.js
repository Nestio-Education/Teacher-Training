import express from "express";
import mongoose from "mongoose";
import { requireRole } from "../auth.js";
import { ActivitySubmission } from "../models/ActivitySubmission.js";
import { TeacherTask } from "../models/TeacherTask.js";
import { User } from "../models/User.js";
import { PDCAReport } from "../models/PDCAReport.js";
import { PDCACycle } from "../models/MentorTracking.js";
import {
  matchDeliverables,
  autoAssessSuccessCheck,
  buildFactsSummary,
} from "../services/pdcaGrounding.js";
import { generatePDCADraft } from "../services/aiPdcaGenerator.js";
// Full 24-month curriculum — static, code-based (no database, no upload/
// publish step). See backend/src/data/monthCurricula.js for the content
// and how to edit any month.
import { MONTH_CURRICULA } from "../data/monthCurricula.js";
import { MONTH_TITLES } from "../data/monthMeta.js";

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

// ── GET /api/pdca/fellow/progress — 24-Month Roadmap Progress for Fellow ──
router.get("/fellow/progress", requireRole("fellow", "teacher"), async (req, res, next) => {
  try {
    const reports = await PDCAReport.find({ fellowId: req.user.id }).lean();
    const reportsByMonth = new Map(reports.map((r) => [r.month, r]));

    const user = await User.findById(req.user.id)
      .populate("assignedMentor", "name email")
      .lean();

    const months = Array.from({ length: 24 }, (_, i) => {
      const monthNum = i + 1;
      const curriculum = MONTH_CURRICULA[monthNum];
      const rep = reportsByMonth.get(monthNum);
      const totalDeliverables = curriculum?.deliverables?.length || 0;
      const metDeliverables = rep?.deliverablesStatus
        ? rep.deliverablesStatus.filter((d) => d.status === "met").length
        : 0;
      const percent = totalDeliverables > 0 ? Math.round((metDeliverables / totalDeliverables) * 100) : 0;

      return {
        month: monthNum,
        title: MONTH_TITLES[monthNum] || `Month ${monthNum}`,
        semester: Math.floor((monthNum - 1) / 6) + 1,
        status: rep ? rep.status : "not_started",
        approvedAt: rep?.approvedAt || null,
        metCount: metDeliverables,
        totalCount: totalDeliverables,
        percent,
        hasReport: !!rep,
      };
    });

    res.json({
      success: true,
      months,
      mentor: user?.assignedMentor || null,
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/pdca/fellow/month/:month — Detail & Checklist for Specific Month ──
router.get("/fellow/month/:month", requireRole("fellow", "teacher"), async (req, res, next) => {
  try {
    const month = Number(req.params.month);
    if (!month || month < 1 || month > 24) {
      return res.status(400).json({ success: false, message: "Invalid month (expected 1–24)." });
    }

    const curriculum = MONTH_CURRICULA[month];
    if (!curriculum) {
      return res.status(404).json({ success: false, message: "Month curriculum not found." });
    }

    const report = await PDCAReport.findOne({ fellowId: req.user.id, month })
      .populate("approvedBy", "name email")
      .populate("mentorId", "name email")
      .lean();

    let deliverablesStatus = [];
    if (report && Array.isArray(report.deliverablesStatus) && report.deliverablesStatus.length > 0) {
      deliverablesStatus = report.deliverablesStatus;
    } else {
      // Initialize default checklist based on curriculum deliverables
      deliverablesStatus = (curriculum.deliverables || []).map((d) => ({
        id: d.id,
        label: d.label,
        status: "not_met",
        count: 0,
        targetCount: d.targetCount || 1,
        fellowMarked: false,
        note: "",
      }));
    }

    res.json({
      success: true,
      month,
      title: MONTH_TITLES[month] || `Month ${month}`,
      monthlyObjective: curriculum.monthlyObjective,
      weeklyFocus: curriculum.weeklyFocus,
      deliverablesStatus,
      report: report || null,
      isApproved: report?.status === "approved",
    });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/pdca/fellow/month/:month/checklist — Fellow Updates Deliverables Checklist ──
router.put("/fellow/month/:month/checklist", requireRole("fellow", "teacher"), async (req, res, next) => {
  try {
    const month = Number(req.params.month);
    if (!month || month < 1 || month > 24) {
      return res.status(400).json({ success: false, message: "Invalid month (expected 1–24)." });
    }

    const { deliverablesStatus } = req.body;
    if (!Array.isArray(deliverablesStatus)) {
      return res.status(400).json({ success: false, message: "deliverablesStatus array is required." });
    }

    const curriculum = MONTH_CURRICULA[month];
    if (!curriculum) {
      return res.status(400).json({ success: false, message: "Invalid curriculum month." });
    }

    let report = await PDCAReport.findOne({ fellowId: req.user.id, month });

    if (report && report.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit an approved month report. This month is already locked.",
      });
    }

    const fellow = await User.findById(req.user.id);
    const mentorId = fellow?.assignedMentor || report?.mentorId || null;

    report = await PDCAReport.findOneAndUpdate(
      { fellowId: req.user.id, month },
      {
        $set: {
          fellowId: req.user.id,
          mentorId,
          month,
          curriculumVersion: curriculum.curriculumVersion || "v1",
          deliverablesStatus,
          status: "draft",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, report });
  } catch (err) {
    next(err);
  }
});

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

    const curriculum = MONTH_CURRICULA[month];
    if (!curriculum) {
      return res.status(400).json({
        success: false,
        message: `Month ${month} is not a valid Fellowship month (expected 1–24).`,
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

    const existingReport = await PDCAReport.findOne({ fellowId, month });

    // All facts computed deterministically first — the AI only writes
    // prose from these, per the grounding rule. Every month (1–24) reads
    // from the static MONTH_CURRICULA table, so this path is identical
    // regardless of which month is selected.
    let deliverablesStatus = matchDeliverables(curriculum.deliverables, submissions, tasks);

    // If fellow or mentor already marked/updated deliverables on their checklist, preserve that progress
    if (existingReport && Array.isArray(existingReport.deliverablesStatus) && existingReport.deliverablesStatus.length > 0) {
      const existingMap = new Map(existingReport.deliverablesStatus.map((d) => [d.id, d]));
      deliverablesStatus = deliverablesStatus.map((d) => {
        const prev = existingMap.get(d.id);
        if (prev && (prev.fellowMarked || prev.mentorOverride || prev.status === "met" || (prev.count && prev.count > 0))) {
          return {
            ...d,
            status: prev.status || d.status,
            count: prev.count !== undefined ? prev.count : d.count,
            targetCount: prev.targetCount || d.targetCount,
            fellowMarked: prev.fellowMarked || false,
            mentorOverride: prev.mentorOverride || false,
            note: prev.note || "",
          };
        }
        return d;
      });
    }

    const successCheck = autoAssessSuccessCheck(curriculum.successCheck, deliverablesStatus);
    const facts = buildFactsSummary(fellow, submissions, tasks, deliverablesStatus);
    const monthlyObjective = curriculum.monthlyObjective;
    const weeklyFocus = curriculum.weeklyFocus;
    const curriculumVersion = curriculum.curriculumVersion;

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

    const fellow = await ensureFellowBelongsToMentor(req.user.id, fellowId);
    if (!fellow) {
      return res.status(404).json({ success: false, message: "Fellow not found or not assigned to you." });
    }

    const report = await PDCAReport.findOne({ fellowId, month });
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

    const fellow = await ensureFellowBelongsToMentor(req.user.id, fellowId);
    if (!fellow) {
      return res.status(404).json({ success: false, message: "Fellow not found or not assigned to you." });
    }

    let report = await PDCAReport.findOne({ fellowId, month });
    if (!report) {
      return res.status(404).json({ success: false, message: "Generate a draft first." });
    }

    report.mentorId = req.user.id;

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