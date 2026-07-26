import puppeteer from "puppeteer";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Certificate } from "../models/Certificate.js";
import { CourseAssignment } from "../models/CourseAssignment.js";
import { User } from "../models/User.js";
import { requireAuth, requireRole } from "../auth.js";

const router = express.Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logoBase64 = fs.readFileSync(path.join(__dirname, "../assets/logo.png")).toString("base64");
const logoDataUri = `data:image/png;base64,${logoBase64}`;

function calculateGrade(score, maxScore, fallbackGrade) {
  let initial = fallbackGrade;
  if (initial === "F") initial = "Fail";
  if (initial === "D") initial = "Pass";
  
  if (initial && ["A+", "A", "B+", "B", "C", "Pass", "Fail"].includes(initial)) {
    return initial;
  }
  
  if (score === null || score === undefined) return "Pass";
  const total = maxScore !== undefined && maxScore !== null ? maxScore : 100;
  const pct = total > 0 ? (score / total) * 100 : 0;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  return "Pass";
}

export async function autoIssueCertificateForAssignment(assignmentId) {
  const assignment = await CourseAssignment.findById(assignmentId)
    .populate("course", "title")
    .populate("teacher", "_id name email");

  if (!assignment || !assignment.course || !assignment.teacher) return null;

  const score = assignment.score;
  const grade = calculateGrade(
    score, 
    assignment.assessmentTotal, 
    assignment.grade || assignment.assessmentGrade
  );

  const existing = await Certificate.findOne({
    teacher: assignment.teacher._id,
    course: assignment.course._id,
  });
  if (existing) {
    if (score !== null && score !== undefined && (existing.score === null || existing.score === undefined)) {
      existing.score = score;
      existing.grade = grade;
      await existing.save();
    }
    return existing;
  }

  const count = await Certificate.countDocuments();
  const certNumber = `SPC-${String(count + 1).padStart(5, "0")}-${String(Date.now()).slice(-4)}`;

  try {
    const certificate = await Certificate.create({
      certificateNumber: certNumber,
      teacher: assignment.teacher._id,
      course: assignment.course._id,
      assignment: assignment._id,
      issuedBy: assignment.assignedBy || undefined,
      score: score ?? undefined,
      grade,
      status: "issued",
      issuedAt: new Date(),
    });
    return certificate;
  } catch (err) {
    if (err.code === 11000) return existing;
    throw err;
  }
}

// Teacher: get my certificates
router.get("/teacher", requireAuth, requireRole("teacher"), async (req, res, next) => {
  try {
    const certs = await Certificate.find({ teacher: req.user.id })
      .populate("course", "title duration category")
      .populate("issuedBy", "name")
      .populate("assignment", "assessmentTotal score")
      .sort({ issuedAt: -1 });
    res.json({ certificates: certs });
  } catch (err) {
    next(err);
  }
});

// Admin: get all certificates
router.get("/admin", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const certs = await Certificate.find()
      .populate("teacher", "name email")
      .populate("course", "title")
      .populate("issuedBy", "name")
      .sort({ issuedAt: -1 });
    res.json({ certificates: certs });
  } catch (err) {
    next(err);
  }
});

// Admin: generate certificate for teacher after course completion
router.post("/generate", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { teacherId, courseId, assignmentId, score, grade, googleFormUrl } = req.body;
    if (!teacherId || !courseId) {
      return res.status(400).json({ message: "teacherId and courseId are required" });
    }

    // Check if certificate already exists
    const existing = await Certificate.findOne({ teacher: teacherId, course: courseId });
    if (existing) {
      return res.status(409).json({ message: "Certificate already exists for this teacher and course", certificate: existing });
    }

    const teacher = await User.findById(teacherId).select("name email");
    if (!teacher) return res.status(404).json({ message: "Teacher not found" });

    // Generate certificate number
    const count = await Certificate.countDocuments();
    const certNumber = `SPC-${String(count + 1).padStart(5, "0")}-${String(Date.now()).slice(-4)}`;

    // Compute grade if not provided
    let finalGrade = grade || "Pass";
    if (score !== undefined && !grade) {
      let maxScore = 100;
      if (assignmentId) {
        const asg = await CourseAssignment.findById(assignmentId).select("assessmentTotal");
        if (asg && asg.assessmentTotal) maxScore = asg.assessmentTotal;
      }
      finalGrade = calculateGrade(score, maxScore);
    }

    const certificate = await Certificate.create({
      certificateNumber: certNumber,
      teacher: teacherId,
      course: courseId,
      assignment: assignmentId || undefined,
      issuedBy: req.user.id,
      score: score || undefined,
      grade: finalGrade,
      status: "issued",
      issuedAt: new Date(),
      metadata: {
        ...(googleFormUrl ? { googleFormUrl } : {}),
      }
    });

    res.status(201).json({ certificate });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Certificate already exists" });
    }
    next(error);
  }
});

// Admin: automatically generate certificate when a course is completed
router.post("/auto-generate/:assignmentId", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const assignment = await CourseAssignment.findById(req.params.assignmentId)
      .populate("course", "title")
      .populate("teacher", "_id name email");

    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (assignment.status !== "completed" && assignment.progressPercent !== 100) {
      // Allow admin to force-generate if desired
      if (!req.body.force) {
        return res.status(400).json({ message: "Course is not completed yet. Mark it completed first or use force=true." });
      }
    }

    const existing = await Certificate.findOne({
      teacher: assignment.teacher._id,
      course: assignment.course._id
    });
    if (existing) {
      return res.status(409).json({ message: "Certificate already exists", certificate: existing });
    }

    const count = await Certificate.countDocuments();
    const certNumber = `SPC-${String(count + 1).padStart(5, "0")}-${String(Date.now()).slice(-4)}`;

    const grade = calculateGrade(
      assignment.score, 
      assignment.assessmentTotal, 
      assignment.grade || assignment.assessmentGrade
    );

    const certificate = await Certificate.create({
      certificateNumber: certNumber,
      teacher: assignment.teacher._id,
      course: assignment.course._id,
      assignment: assignment._id,
      issuedBy: req.user.id,
      score: assignment.score || undefined,
      grade,
      status: "issued",
      issuedAt: new Date(),
    });

    res.status(201).json({ certificate });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Certificate already exists" });
    }
    next(error);
  }
});

// Admin: revoke certificate
router.patch("/:id/revoke", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(
      req.params.id,
      { status: "revoked" },
      { new: true }
    );
    if (!cert) return res.status(404).json({ message: "Certificate not found" });
    res.json({ certificate: cert });
  } catch (err) {
    next(err);
  }
});

// Verify certificate by number (public)
// Teacher (or admin) — download certificate as a PDF
router.get("/:id/pdf", requireAuth, async (req, res, next) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate("teacher", "name")
      .populate("course", "title");

    if (!cert) return res.status(404).json({ message: "Certificate not found" });

    if (req.user.role === "teacher" && String(cert.teacher._id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const dateStr = new Date(cert.issuedAt).toLocaleDateString("en-IN", {
      day: "numeric", month: "long", year: "numeric",
    });

    // Start: Prajwal edit — redesigned certificate template (gold-foil elegant style, no QR for now)
    const html = `
    <html>
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;900&family=Great+Vibes&family=Montserrat:wght@500;600;700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 0; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Montserrat', sans-serif; }

        .page {
          width: 1123px; height: 794px; position: relative;
          background: radial-gradient(circle at 50% 0%, #fffdf5 0%, #fdf6e3 60%, #faf0d7 100%);
          overflow: hidden;
        }

        .border-outer {
          position: absolute; inset: 22px;
          border: 3px solid #b8860b;
        }
        .border-inner {
          position: absolute; inset: 34px;
          border: 1.5px solid #d4af37;
        }

        .corner {
          position: absolute; width: 90px; height: 90px;
          border-top: 4px solid #b8860b; border-left: 4px solid #b8860b;
        }
        .corner.tl { top: 34px; left: 34px; }
        .corner.tr { top: 34px; right: 34px; transform: rotate(90deg); }
        .corner.br { bottom: 34px; right: 34px; transform: rotate(180deg); }
        .corner.bl { bottom: 34px; left: 34px; transform: rotate(270deg); }

        .content {
          position: absolute; inset: 70px;
          display: flex; flex-direction: column; align-items: center;
          text-align: center;
        }

        .brand-row { display: flex; align-items: center; gap: 20px; margin-top: 4px; }
        .logo { width: 92px; height: auto; }
        .brand-text { text-align: left; }
        .brand-name { font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 700; color: #78350f; letter-spacing: 1px; }
        .brand-sub { font-size: 10.5px; color: #a16207; letter-spacing: 3px; font-weight: 600; }

        .divider { width: 140px; height: 2px; background: linear-gradient(90deg, transparent, #d4af37, transparent); margin: 18px 0; }

        .title {
          font-family: 'Playfair Display', serif; font-size: 40px; font-weight: 900;
          color: #92400e; letter-spacing: 1px; margin: 6px 0 2px;
        }
        .title-sub { font-size: 11.5px; letter-spacing: 5px; color: #a16207; font-weight: 600; text-transform: uppercase; }

        .presented { font-size: 13.5px; color: #57534e; margin-top: 30px; font-style: italic; }

        .name {
          font-family: 'Great Vibes', cursive; font-size: 58px; color: #78350f;
          margin: 10px 0 4px; line-height: 1;
        }
        .name-underline { width: 320px; height: 1.5px; background: #d4af37; margin-bottom: 18px; }

        .for-course { font-size: 13.5px; color: #57534e; font-style: italic; }
        .course { font-family: 'Playfair Display', serif; font-size: 21px; font-weight: 700; color: #1c1917; margin: 8px 0 0; max-width: 640px; }

        .meta-row {
          display: flex; justify-content: center; gap: 60px;
          margin-top: auto; padding-top: 26px; width: 100%;
        }
        .meta-item { text-align: center; }
        .meta-label { font-size: 9.5px; letter-spacing: 1.5px; color: #a8a29e; text-transform: uppercase; font-weight: 600; }
        .meta-value { font-size: 14px; color: #1c1917; font-weight: 700; margin-top: 3px; font-family: 'Playfair Display', serif; }

        .footer-row {
          display: flex; justify-content: center; align-items: flex-end; gap: 120px;
          width: 100%; margin-top: 24px; padding: 0 10px;
        }

        .signature-block { text-align: center; }
        .signature-line { width: 180px; height: 1px; background: #78350f; margin: 0 auto 6px; }
        .signature-label { font-size: 10.5px; color: #57534e; font-weight: 600; }

        .seal {
          width: 74px; height: 74px; border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #fde68a, #d97706 70%, #92400e 100%);
          display: flex; align-items: center; justify-content: center;
          color: #fffbeb; font-family: 'Playfair Display', serif; font-weight: 900; font-size: 10px;
          box-shadow: 0 3px 8px rgba(146,64,14,0.35);
          border: 2px solid #fde68a;
          text-align: center; line-height: 1.2;
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="border-outer"></div>
        <div class="border-inner"></div>
        <div class="corner tl"></div>
        <div class="corner tr"></div>
        <div class="corner br"></div>
        <div class="corner bl"></div>

        <div class="content">
          <div class="brand-row">
            <img class="logo" src="${logoDataUri}" alt="SpacECE Logo" />
            <div class="brand-text">
              <div class="brand-name">SpacECE Teacher Training Portal</div>
              <div class="brand-sub">EARLY CHILDHOOD EDUCATION</div>
            </div>
          </div>

          <div class="divider"></div>
          <div class="title">Certificate of Completion</div>
          <div class="title-sub">Awarded in Recognition of Achievement</div>

          <div class="presented">This certificate is proudly presented to</div>
          <div class="name">${cert.teacher?.name || "Teacher"}</div>
          <div class="name-underline"></div>

          <div class="for-course">for successfully completing the course</div>
          <div class="course">${cert.course?.title || "Course"}</div>

          <div class="meta-row">
            <div class="meta-item">
              <div class="meta-label">Certificate No.</div>
              <div class="meta-value">${cert.certificateNumber}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Grade</div>
              <div class="meta-value">${cert.grade || "Pass"}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Date Issued</div>
              <div class="meta-value">${dateStr}</div>
            </div>
          </div>

          <div class="footer-row">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">Authorized Signatory</div>
            </div>
            <div class="seal">SPACECE<br/>VERIFIED</div>
          </div>
        </div>
      </div>
    </body>
    </html>`;
    // End: Prajwal edit

    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfUint8 = await page.pdf({ format: "A4", landscape: true, printBackground: true });
    const pdfBuffer = Buffer.from(pdfUint8);
    await browser.close();

    // Start: Dnyaneshwari Thorat
    const isView = req.query.view === "true";
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": isView 
        ? "inline"
        : `attachment; filename="Certificate-${cert.certificateNumber}.pdf"`,
    });
    // End: Dnyaneshwari Thorat
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});

export default router;