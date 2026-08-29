// Start: Prajwal — Question Bank routes (mount under e.g. /api/teacher/question-banks)
import express from "express";
import multer from "multer";
import path from "path";
import { QuestionBank } from "../models/QuestionBank.js";
import { parseDocxQuestionBank, parseXlsxQuestionBank } from "../services/questionBankParser.js";
import { getDefaultSectionsForAgeGroup } from "../services/defaultQuestionBank.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const getAgeGroupVariations = (ag) => {
  const str = String(ag || "").trim();
  if (!str) return [];
  const alt = str.includes("–") ? str.replace(/–/g, "-") : str.replace(/-/g, "–");
  return Array.from(new Set([str, alt]));
};

// GET the currently active question bank for an age group (auto-creates default v1 if none exists)
// GET /api/teacher/question-banks/active?ageGroup=3–4 Years
router.get("/active", async (req, res) => {
  try {
    const { ageGroup } = req.query;
    if (!ageGroup) return res.status(400).json({ message: "ageGroup is required" });

    const variations = getAgeGroupVariations(ageGroup);
    let bank = await QuestionBank.findOne({ ageGroup: { $in: variations }, isActive: true }).sort({ version: -1 });

    if (!bank) {
      const defaultSections = getDefaultSectionsForAgeGroup(ageGroup);
      bank = await QuestionBank.create({
        ageGroup,
        version: 1,
        isActive: true,
        sourceFileName: "Standard Default Question Bank",
        sourceFileType: "manual",
        sections: defaultSections,
      });
    }

    res.json({ questionBank: bank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET version history for an age group
// GET /api/teacher/question-banks/versions?ageGroup=3–4 Years
router.get("/versions", async (req, res) => {
  try {
    const { ageGroup } = req.query;
    if (!ageGroup) return res.status(400).json({ message: "ageGroup is required" });

    const variations = getAgeGroupVariations(ageGroup);
    const versions = await QuestionBank.find({ ageGroup: { $in: variations } })
      .sort({ version: -1 })
      .select("ageGroup version isActive sourceFileName sourceFileType uploadedBy createdAt")
      .populate("uploadedBy", "name email");

    res.json({ versions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST upload a new question bank (docx or xlsx) — becomes the new active version
// POST /api/teacher/question-banks/upload   (multipart/form-data: file, ageGroup)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { ageGroup } = req.body;
    const teacherId = req.user?.id || req.user?._id || undefined;
    if (!ageGroup) return res.status(400).json({ message: "ageGroup is required" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const ext = path.extname(req.file.originalname).toLowerCase();
    let parsed;
    let sourceFileType;

    if (ext === ".docx" || ext === ".doc") {
      parsed = await parseDocxQuestionBank(req.file.buffer);
      sourceFileType = "docx";
    } else if (ext === ".xlsx" || ext === ".xls") {
      parsed = parseXlsxQuestionBank(req.file.buffer);
      sourceFileType = "xlsx";
    } else {
      return res.status(400).json({ message: "Unsupported file type. Please upload a Word (.doc, .docx) or Excel (.xlsx, .xls) file." });
    }

    if (!parsed.sections || parsed.sections.length === 0) {
      return res.status(422).json({ message: "No questions could be parsed from this file." });
    }

    const variations = getAgeGroupVariations(ageGroup);

    // Determine next version number for this age group
    const latest = await QuestionBank.findOne({ ageGroup: { $in: variations } }).sort({ version: -1 });
    const nextVersion = latest ? latest.version + 1 : 1;

    // Deactivate any currently active version (keep_versions = true, so we don't delete it)
    await QuestionBank.updateMany({ ageGroup: { $in: variations }, isActive: true }, { $set: { isActive: false } });

    const newBank = await QuestionBank.create({
      ageGroup,
      version: nextVersion,
      isActive: true,
      sourceFileName: req.file.originalname,
      sourceFileType,
      uploadedBy: teacherId,
      sections: parsed.sections,
    });

    res.status(201).json({
      message: `Question bank v${nextVersion} for ${ageGroup} saved and activated.`,
      questionBank: newBank,
    });
  } catch (err) {
    console.error("Question bank upload error:", err);
    res.status(500).json({ message: err.message || "Failed to process the uploaded file." });
  }
});

// POST activate a previous version (rollback)
// POST /api/teacher/question-banks/:id/activate
router.post("/:id/activate", async (req, res) => {
  try {
    const bank = await QuestionBank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: "Version not found" });

    const variations = getAgeGroupVariations(bank.ageGroup);
    await QuestionBank.updateMany({ ageGroup: { $in: variations }, isActive: true }, { $set: { isActive: false } });
    bank.isActive = true;
    await bank.save();

    res.json({ message: `Version ${bank.version} is now active for ${bank.ageGroup}.`, questionBank: bank });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST save/update questions directly for an age group (creates new active version)
// POST /api/teacher/question-banks/update-sections
router.post("/update-sections", async (req, res) => {
  try {
    const { ageGroup, sections } = req.body;
    const teacherId = req.user?.id || req.user?._id || undefined;
    if (!ageGroup) return res.status(400).json({ message: "ageGroup is required" });
    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ message: "sections array is required" });
    }

    const variations = getAgeGroupVariations(ageGroup);
    const latest = await QuestionBank.findOne({ ageGroup: { $in: variations } }).sort({ version: -1 });
    const nextVersion = latest ? latest.version + 1 : 1;

    await QuestionBank.updateMany({ ageGroup: { $in: variations }, isActive: true }, { $set: { isActive: false } });

    const newBank = await QuestionBank.create({
      ageGroup,
      version: nextVersion,
      isActive: true,
      sourceFileName: "Direct UI Edit",
      sourceFileType: "manual",
      uploadedBy: teacherId,
      sections,
    });

    res.status(201).json({
      message: `Question bank v${nextVersion} for ${ageGroup} saved and activated.`,
      questionBank: newBank,
    });
  } catch (err) {
    console.error("Error updating question bank sections:", err);
    res.status(500).json({ message: err.message || "Failed to update question bank." });
  }
});

export default router;
// End: Prajwal
