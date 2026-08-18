import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { requireRole } from "../auth.js";
import { MonthCurriculum } from "../models/MonthCurriculum.js";
import { extractTextFromFile, parseCurriculumDocument } from "../services/curriculumExtractor.js";
import { ActivitySubmission } from "../models/ActivitySubmission.js";
import { TeacherTask } from "../models/TeacherTask.js";
import { ensureFellowBelongsToMentor } from "../services/fellowAccess.js";
import { matchDeliverables, autoAssessSuccessCheck, buildFactsSummary } from "../services/pdcaGrounding.js";
import { generatePDCADraft } from "../services/aiPdcaGenerator.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

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

// ── GET /api/curriculum — every month's curriculum (published or draft),
// summarized. Powers the month picker + the curriculum management list. ──
router.get("/", requireRole("mentor", "admin"), async (req, res, next) => {
  try {
    const docs = await MonthCurriculum.find()
      .select("month monthlyObjective status deliverables sourceFileName aiProvider updatedAt publishedAt")
      .sort({ month: 1 });
    res.json({
      success: true,
      curricula: docs.map((d) => ({
        month: d.month,
        monthlyObjective: d.monthlyObjective,
        status: d.status,
        deliverableCount: d.deliverables?.length || 0,
        sourceFileName: d.sourceFileName,
        aiProvider: d.aiProvider,
        updatedAt: d.updatedAt,
        publishedAt: d.publishedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/curriculum/parse — upload a doc, get back an AI-structured
// draft to review/edit. Nothing is saved yet — the mentor/admin reviews the
// parsed objective/weekly-focus/deliverables/success-check in the UI first,
// then calls publish (below) once they're happy with it. ──
router.post("/parse", requireRole("mentor", "admin"), upload.single("file"), async (req, res, next) => {
  try {
    const month = Number(req.body.month);
    if (!month || month < 1 || month > 24) {
      return res.status(400).json({ success: false, message: "A valid month number is required." });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Upload a curriculum document (.docx, .txt, or .md)." });
    }

    const rawText = await extractTextFromFile(req.file.buffer, req.file.originalname);
    const parsed = await parseCurriculumDocument(rawText);

    res.json({
      success: true,
      draft: {
        month,
        monthlyObjective: parsed.monthlyObjective,
        weeklyFocus: parsed.weeklyFocus,
        deliverables: parsed.deliverables,
        successCheck: parsed.successCheck,
        sourceFileName: req.file.originalname,
        aiProvider: parsed.aiProvider,
      },
    });
  } catch (err) {
    // Parsing failures (bad file type, AI unavailable, malformed AI output)
    // are user-facing, not server errors — surface the message directly.
    res.status(422).json({ success: false, message: err.message || "Failed to parse curriculum document." });
  }
});

// ── POST /api/pdca-curriculum/design — the one-shot "upload curriculum and
// have it get designed at that moment" flow used by the Custom Growth Cycle
// form. Upload a doc + pick a fellow (and month), and in a single request:
//   1. extract + AI-parse the curriculum document (same as /parse)
//   2. save it as a draft MonthCurriculum (so it shows up in "Manage Month
//      Curricula" for later editing/publishing — no separate step required)
//   3. ground it against that fellow's real logged activity
//   4. AI-draft the Plan/Do/Check/Act text right away
// Returns both the parsed curriculum and the ready-to-review PDCA draft, so
// the mentor never has to leave the Custom Growth Cycle card. Unlike
// /api/pdca/generate, this does NOT require the curriculum to already be
// published — it designs directly from the freshly uploaded document.
router.post(
  "/design",
  requireRole("mentor"),
  upload.single("file"),
  async (req, res, next) => {
    try {
      const month = Number(req.body.month) || 1;
      const { fellowId } = req.body;
      if (!fellowId || !mongoose.Types.ObjectId.isValid(fellowId)) {
        return res.status(400).json({ success: false, message: "A valid fellowId is required." });
      }
      if (!req.file) {
        return res.status(400).json({ success: false, message: "Upload a curriculum document (.docx, .txt, or .md)." });
      }

      const fellow = await ensureFellowBelongsToMentor(req.user.id, fellowId);
      if (!fellow) {
        return res.status(404).json({ success: false, message: "Fellow not found or not assigned to you." });
      }

      // Step 1: extract + parse the document.
      const rawText = await extractTextFromFile(req.file.buffer, req.file.originalname);
      const parsed = await parseCurriculumDocument(rawText);

      // Step 2: keep it as a draft record so it's reusable/editable later
      // from "Manage Month Curricula" — designing a growth cycle from it
      // doesn't publish it, it just uses it right now.
      const curriculumDoc = await MonthCurriculum.findOneAndUpdate(
        { month },
        {
          $set: {
            monthlyObjective: parsed.monthlyObjective,
            weeklyFocus: parsed.weeklyFocus,
            deliverables: parsed.deliverables,
            successCheck: parsed.successCheck,
            sourceFileName: req.file.originalname,
            aiProvider: parsed.aiProvider,
            uploadedBy: req.user.id,
          },
          $setOnInsert: { status: "draft" },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // Step 3: ground against this fellow's real submissions/tasks.
      const [submissions, tasks] = await Promise.all([
        ActivitySubmission.find({ teacher: fellowId }),
        TeacherTask.find({ teacher: fellowId }),
      ]);
      const deliverablesStatus = matchDeliverables(parsed.deliverables, submissions, tasks);
      const successCheck = autoAssessSuccessCheck(parsed.successCheck, deliverablesStatus);
      const facts = buildFactsSummary(fellow, submissions, tasks, deliverablesStatus);

      // Step 4: AI drafts Plan/Do/Check/Act right now, from the
      // just-uploaded curriculum — nothing published, nothing pre-saved.
      const aiResult = await generatePDCADraft({
        fellowName: fellow.name,
        monthlyObjective: parsed.monthlyObjective,
        weeklyFocus: parsed.weeklyFocus,
        deliverables: deliverablesStatus,
        successCheckDo: successCheck.do,
        facts,
      });

      res.json({
        success: true,
        curriculum: {
          month,
          monthlyObjective: curriculumDoc.monthlyObjective,
          status: curriculumDoc.status,
          sourceFileName: curriculumDoc.sourceFileName,
        },
        draft: {
          plan: aiResult.plan,
          do: aiResult.do,
          check: aiResult.check,
          act: aiResult.act,
          aiAvailable: aiResult.aiAvailable,
          lowDataFields: aiResult.low_data_fields || [],
          deliverablesStatus,
        },
      });
    } catch (err) {
      res.status(422).json({ success: false, message: err.message || "Failed to design Growth Cycle from curriculum." });
    }
  }
);

// ── POST /api/curriculum/:month/publish — save the (possibly hand-edited)
// draft as the live curriculum for that month. Upserts, so re-publishing a
// month just overwrites it — the PDCA generator always reads whatever the
// latest published version says. ──
router.post("/:month/publish", requireRole("mentor", "admin"), async (req, res, next) => {
  try {
    const month = Number(req.params.month);
    if (!month || month < 1 || month > 24) {
      return res.status(400).json({ success: false, message: "Invalid month." });
    }
    const { monthlyObjective, weeklyFocus, deliverables, successCheck, sourceFileName, aiProvider } = req.body;

    if (!monthlyObjective?.trim()) {
      return res.status(400).json({ success: false, message: "Monthly objective is required." });
    }
    if (!Array.isArray(deliverables) || deliverables.length === 0) {
      return res.status(400).json({ success: false, message: "At least one deliverable is required." });
    }
    for (const d of deliverables) {
      if (!d.id?.trim() || !d.label?.trim()) {
        return res.status(400).json({ success: false, message: "Every deliverable needs an id and a label." });
      }
    }

    const doc = await MonthCurriculum.findOneAndUpdate(
      { month },
      {
        $set: {
          monthlyObjective: monthlyObjective.trim(),
          weeklyFocus: Array.isArray(weeklyFocus) ? weeklyFocus : [],
          deliverables,
          successCheck: {
            plan: successCheck?.plan || [],
            do: successCheck?.do || [],
            check: successCheck?.check || [],
            act: successCheck?.act || [],
          },
          sourceFileName: sourceFileName || null,
          aiProvider: aiProvider || null,
          status: "published",
          publishedBy: req.user.id,
          publishedAt: new Date(),
          uploadedBy: req.user.id,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, curriculum: doc });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/curriculum/:month — fetch one month's full curriculum. ──
router.get("/:month", requireRole("mentor", "admin"), async (req, res, next) => {
  try {
    const month = Number(req.params.month);
    const doc = await MonthCurriculum.findOne({ month });
    res.json({ success: true, curriculum: doc || null });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/curriculum/:month — remove a month's curriculum (admin
// only — this takes that month out of rotation for every mentor). ──
router.delete("/:month", requireRole("admin"), async (req, res, next) => {
  try {
    const month = Number(req.params.month);
    await MonthCurriculum.deleteOne({ month });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;