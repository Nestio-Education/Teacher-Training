/**
 * courseLibrary.routes.js
 * ----------------------------------------------------------------------
 * Wired into server.js via attachCourseLibraryRoutes(app, { Course, requireAuth }).
 * Deliberately does NOT wire assessment-result routes (POST /api/assessments,
 * GET /api/assessments/mine, GET /api/admin/assessments) -- live equivalents
 * of all three already exist directly in server.js.
 * ---------------------------------------------------------------------- */
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { parseChapterCourseDocx } from "../services/docxCourseParser.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const LIBRARY_PATH = path.join(__dirname, "../data/courseLibrary.json");
const ASSESSMENT_PATH = path.join(__dirname, "../data/assessmentBank.json");

function loadLibrary() {
  const raw = fs.readFileSync(LIBRARY_PATH, "utf-8");
  return JSON.parse(raw).courses;
}
function loadAssessmentBank() {
  return JSON.parse(fs.readFileSync(ASSESSMENT_PATH, "utf-8"));
}

// GET /api/course-library
router.get("/course-library", (req, res) => {
  try {
    const courses = loadLibrary();
    res.json({
      courses: courses.map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        level: c.level,
        duration: c.duration,
        description: c.description,
        objectives: c.objectives,
        color: c.color,
        topicCount: c.topics.length,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load course library.", error: err.message });
  }
});

router.get("/course-library/:libraryId", (req, res) => {
  try {
    const courses = loadLibrary();
    const found = courses.find((c) => c.id === req.params.libraryId);
    if (!found) return res.status(404).json({ message: "Course not found in library." });
    res.json({ course: found });
  } catch (err) {
    res.status(500).json({ message: "Failed to load course.", error: err.message });
  }
});

// POST /api/courses/from-library  body: { libraryId }
function makeFromLibraryHandler(Course) {
  return async (req, res) => {
    try {
      const { libraryId } = req.body;
      if (!libraryId) return res.status(400).json({ message: "libraryId is required." });
      const courses = loadLibrary();
      const lib = courses.find((c) => c.id === libraryId);
      if (!lib) return res.status(404).json({ message: "Course not found in library." });

      const modules = lib.topics.map((topic, idx) => ({
        title: topic.title,
        description: "",
        contents: [
          {
            title: topic.title,
            type: "document", // valid enum value directly -- this path bypasses
                               // the "reading"->"document" normalizer in server.js,
                               // so it must already be a valid value here.
            notes: topic.notes,
            suggestedDuration: `${Math.max(10, Math.round(topic.notes.split(" ").length / 130) * 5)} min read`,
            order: idx,
          },
        ],
      }));

      const course = await Course.create({
        title: lib.title,
        category: lib.category,
        level: lib.level,
        duration: lib.duration,
        durationText: lib.duration,
        description: lib.description,
        objectives: lib.objectives,
        contentType: "Document", // valid enum value (was "Notes", not in ["Video","PDF","Document"])
        libraryId: lib.id,
        modules,
        createdBy: req.user?.id,
      });

      res.json({ course });
    } catch (err) {
      res.status(500).json({ message: "Failed to create course from library.", error: err.message });
    }
  };
}

// POST /api/courses/parse-docx  multipart field "file"
// Parses the doc and returns the payload for admin preview -- does NOT
// save to the DB. The frontend confirms, then calls the existing, already-
// working POST /api/courses (same path LOCAL_LIBRARY courses use), so
// this feature can't introduce a second, divergent save path.
function makeParseDocxHandler() {
  return async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded." });
      const ext = path.extname(req.file.originalname).toLowerCase();
      if (ext !== ".docx") {
        return res.status(400).json({ message: "Only .docx files are supported for direct parsing." });
      }
      const course = await parseChapterCourseDocx(req.file.buffer, req.file.originalname);
      if (!course.modules.length) {
        return res.status(422).json({
          message: "No Heading 1 sections found in this document. Use Word's 'Heading 1' style for each chapter/module.",
        });
      }
      res.json({ course });
    } catch (err) {
      res.status(500).json({ message: "Failed to parse document.", error: err.message });
    }
  };
}

// GET /api/assessment-bank/:libraryId
router.get("/assessment-bank/:libraryId", (req, res) => {
  try {
    const bank = loadAssessmentBank();
    const questions = bank[req.params.libraryId];
    if (!questions) return res.status(404).json({ message: "No assessment found for this course." });
    res.json({ questions });
  } catch (err) {
    res.status(500).json({ message: "Failed to load assessment.", error: err.message });
  }
});

/**
 * attachCourseLibraryRoutes(app, { Course, requireAuth })
 * Deliberately omits AssessmentResult-based routes -- see file header.
 */
export function attachCourseLibraryRoutes(app, { Course, requireAuth }) {
  app.use("/api", router);
  app.post("/api/courses/from-library", requireAuth, makeFromLibraryHandler(Course));
  app.post("/api/courses/parse-docx", requireAuth, upload.single("file"), makeParseDocxHandler());
}

export { router, loadLibrary, loadAssessmentBank };
