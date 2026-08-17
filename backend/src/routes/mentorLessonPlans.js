import express from "express";
import XLSX from "xlsx";
import mongoose from "mongoose";
import { LessonPlan } from "../models/LessonPlan.js";
import { LessonPlanAssignment } from "../models/LessonPlanAssignment.js";
import { LessonCompletionReport } from "../models/LessonCompletionReport.js";
import { User } from "../models/User.js";
import { Center } from "../models/Center.js";
import { Notification } from "../models/Notification.js";
import { syncLessonPlanTranslations } from "../services/translationSync.js";

// Factory function so server.js can pass in its existing multer `upload` instance
export function createMentorLessonPlansRouter(upload) {
  const router = express.Router();

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Resolve the set of Center IDs this mentor is allowed to manage.
   * Sources: mentor's own mentorProfile.center + centres of all assignedTeachers.
   */
  async function getMentorCenterIds(mentor) {
    const centerIds = new Set();

    // Mentor's own centre
    if (mentor.mentorProfile?.center) {
      centerIds.add(String(mentor.mentorProfile.center));
    }

    // Centres of assigned teachers/fellows
    const assignedTeacherIds = mentor.mentorProfile?.assignedTeachers || [];
    if (assignedTeacherIds.length > 0) {
      const teachers = await User.find({ _id: { $in: assignedTeacherIds } })
        .select("teacherProfile.center")
        .lean();
      for (const t of teachers) {
        if (t.teacherProfile?.center) {
          centerIds.add(String(t.teacherProfile.center));
        }
      }
    }

    return centerIds;
  }

  /**
   * Verify that a given teacher/fellow belongs to this mentor.
   */
  function isTeacherOwnedByMentor(teacherId, mentor) {
    const assigned = (mentor.mentorProfile?.assignedTeachers || []).map(String);
    return assigned.includes(String(teacherId));
  }

  /**
   * Excel cell value extractor with fallback keys
   * (mirrors the getValue pattern used elsewhere in the codebase).
   */
  function getValue(row, ...keys) {
    for (const key of keys) {
      const val = row[key];
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }
    return "";
  }

  // ---------------------------------------------------------------------------
  // POST /import-excel — Parse an Excel file, upsert LessonPlans for this mentor
  // ---------------------------------------------------------------------------
  router.post("/import-excel", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
      }

      // Read Excel workbook
      const workbook = XLSX.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) {
        return res.status(400).json({ message: "Excel file has no sheets." });
      }
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });

      if (rows.length === 0) {
        return res.status(400).json({ message: "Excel sheet is empty." });
      }

      // Resolve mentor's allowed centres
      const mentor = await User.findById(req.user.id).lean();
      const allowedCenterIds = await getMentorCenterIds(mentor);

      // Pre-load all centres for name→id lookup
      const allCenters = await Center.find().select("name").lean();
      const centerNameMap = new Map();
      for (const c of allCenters) {
        centerNameMap.set(String(c.name).toLowerCase().trim(), String(c._id));
      }

      const created = [];
      const updated = [];
      const skippedRows = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // 1-indexed, +1 for header

        const title = getValue(row, "Title", "title", "Lesson Title", "lesson_title", "Name", "name");
        if (!title) {
          skippedRows.push({ row: rowNum, reason: "Missing title" });
          continue;
        }

        // Resolve centre
        const centreName = getValue(row, "Centre", "Center", "centre", "center", "Centre Name", "center_name");
        let centerId = null;

        if (centreName) {
          centerId = centerNameMap.get(centreName.toLowerCase().trim()) || null;

          if (!centerId) {
            skippedRows.push({ row: rowNum, title, reason: "Unknown centre", centreName });
            continue;
          }

          if (!allowedCenterIds.has(centerId)) {
            skippedRows.push({ row: rowNum, title, reason: "Centre not assigned to this mentor", centreName });
            continue;
          }
        }

        // Build lesson plan data
        const planData = {
          title,
          objectives: getValue(row, "Objectives", "objectives", "Learning Objectives", "learning_objectives"),
          instructions: getValue(row, "Instructions", "instructions", "Description", "description"),
          activities: getValue(row, "Activities", "activities", "Activity", "activity"),
          resources: getValue(row, "Resources", "resources", "Materials", "materials"),
          createdBy: req.user.id,
        };

        // Optional date
        const dateVal = getValue(row, "Date", "date", "Schedule Date", "schedule_date", "scheduleDate");
        if (dateVal) {
          const parsed = new Date(dateVal);
          if (!isNaN(parsed.getTime())) {
            planData.scheduleDate = parsed;
          }
        }

        // Optional week
        const weekVal = getValue(row, "Week", "week", "Schedule Week", "schedule_week", "scheduleWeek");
        if (weekVal && !isNaN(Number(weekVal))) {
          planData.scheduleWeek = Number(weekVal);
        }

        // Upsert: match by title + createdBy (same mentor) to allow re-imports
        const existing = await LessonPlan.findOne({ title: planData.title, createdBy: req.user.id });
        if (existing) {
          await LessonPlan.findByIdAndUpdate(existing._id, { $set: planData });
          updated.push({ row: rowNum, id: existing._id, title });
          syncLessonPlanTranslations(existing._id).catch(console.error);
        } else {
          const plan = await LessonPlan.create(planData);
          created.push({ row: rowNum, id: plan._id, title });
          syncLessonPlanTranslations(plan._id).catch(console.error);
        }
      }

      res.json({
        message: `Imported ${created.length} new, updated ${updated.length}, skipped ${skippedRows.length}.`,
        created: created.length,
        updated: updated.length,
        skippedRows,
      });
    } catch (error) {
      console.error("[mentor/lesson-plans/import-excel] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /auto-publish — Create lesson plans from a schedule & auto-assign
  // ---------------------------------------------------------------------------
  router.post("/auto-publish", async (req, res) => {
    try {
      const { courseId, classId, centerId, teacherId, gradeBand, schedule, title } = req.body;
      if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        return res.status(400).json({ message: "Schedule data is required." });
      }

      const mentor = await User.findById(req.user.id).lean();

      // ── Single-fellow targeting (preferred path) ──
      let targetTeacher = null;
      let resolvedCenterId = centerId || undefined;

      if (teacherId) {
        if (!mongoose.isValidObjectId(teacherId)) {
          return res.status(400).json({ message: "teacherId must be a valid id." });
        }
        if (!isTeacherOwnedByMentor(teacherId, mentor)) {
          return res.status(403).json({ message: "This fellow is not assigned to you." });
        }
        targetTeacher = await User.findById(teacherId).select("teacherProfile.center teacherProfile.classes").lean();
        if (!targetTeacher) {
          return res.status(400).json({ message: "Selected fellow could not be found." });
        }
        resolvedCenterId = targetTeacher.teacherProfile?.center ? String(targetTeacher.teacherProfile.center) : undefined;

        if (resolvedCenterId) {
          const center = await Center.findById(resolvedCenterId).lean();
          if (center?.type === "school") {
            if (!gradeBand) {
              return res.status(400).json({ message: "gradeBand is required — this fellow's school offers grade bands." });
            }
            if (!(center.gradeBands || []).includes(gradeBand)) {
              return res.status(400).json({
                message: `"${gradeBand}" is not an offered grade band for this fellow's school. Available: ${(center.gradeBands || []).join(", ") || "none configured"}.`,
              });
            }
          } else if (center?.type === "preschool" && gradeBand) {
            return res.status(400).json({ message: "gradeBand must not be provided for a preschool fellow." });
          }
        } else if (gradeBand) {
          return res.status(400).json({ message: "This fellow has no registered center, so gradeBand cannot be validated." });
        }
      }

      // Create one LessonPlan per day's activities
      const createdPlans = [];
      for (const day of schedule) {
        const activitiesText = day.activities.map(a => `${a.order}. ${a.contentTitle}`).join("\n");
        const objectivesText = [...new Set(day.activities.map(a => a.objectives).filter(Boolean))].join("; ");
        const instructionsText = day.activities.map(a => a.instructions).filter(Boolean).join("\n\n");
        const resourcesText = day.activities.map(a => a.resources).filter(Boolean).join(", ");

        const plan = await LessonPlan.create({
          course: courseId || undefined,
          title: title ? `${title} — ${day.date} (${day.dayOfWeek})` : `Auto Plan — ${day.date} (${day.dayOfWeek})`,
          objectives: objectivesText,
          instructions: instructionsText || activitiesText,
          activities: activitiesText,
          resources: resourcesText,
          scheduleDate: new Date(day.date),
          createdBy: req.user.id,
        });
        createdPlans.push(plan);
      }

      let assignedCount = 0;

      if (targetTeacher) {
        // ── Single-fellow path: assign every generated day to this one fellow ──
        for (const plan of createdPlans) {
          const existing = await LessonPlanAssignment.findOne({ lessonPlan: plan._id, teacher: teacherId });
          if (!existing) {
            await LessonPlanAssignment.create({
              lessonPlan: plan._id,
              teacher: teacherId,
              center: resolvedCenterId || undefined,
              class: classId || (targetTeacher.teacherProfile?.classes || [])[0],
              gradeBand: gradeBand || null,
              assignedDate: plan.scheduleDate,
              status: "pending",
            });
            assignedCount++;
          }
        }
      } else {
        // ── Fallback: broadcast to all of the mentor's fellows, scoped by center/class ──
        const teacherQuery = {
          status: "approved",
          assignedMentor: req.user.id,
          role: { $in: ["teacher", "fellow"] },
        };
        if (centerId) teacherQuery["teacherProfile.center"] = centerId;
        if (classId) teacherQuery["teacherProfile.classes"] = classId;

        const teachers = await User.find(teacherQuery);
        for (const plan of createdPlans) {
          for (const teacher of teachers) {
            const existing = await LessonPlanAssignment.findOne({ lessonPlan: plan._id, teacher: teacher._id });
            if (!existing) {
              await LessonPlanAssignment.create({
                lessonPlan: plan._id,
                teacher: teacher._id,
                center: centerId || teacher.teacherProfile?.center,
                class: classId || (teacher.teacherProfile?.classes || [])[0],
                assignedDate: plan.scheduleDate,
                status: "pending",
              });
              assignedCount++;
            }
          }
        }
      }

      // Kick off translation syncs
      for (const plan of createdPlans) {
        syncLessonPlanTranslations(plan._id).catch(console.error);
      }

      res.status(201).json({
        message: `Published ${createdPlans.length} lesson plans with ${assignedCount} teacher assignments.`,
        plansCreated: createdPlans.length,
        assignmentsCreated: assignedCount,
        plans: createdPlans.map(p => ({ id: p._id, title: p.title, date: p.scheduleDate })),
      });
    } catch (error) {
      console.error("[mentor/lesson-plans/auto-publish] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // POST /assign — Assign a lesson plan to a specific teacher (mentor's own)
  // ---------------------------------------------------------------------------
  router.post("/assign", async (req, res) => {
    try {
      const { lessonPlanId, teacherId, centerId, classId, gradeBand, assignedDate } = req.body;

      if (!lessonPlanId || !mongoose.isValidObjectId(lessonPlanId)) {
        return res.status(400).json({ message: "lessonPlanId is required and must be a valid id." });
      }

      const mentor = await User.findById(req.user.id).lean();

      if (teacherId) {
        if (!mongoose.isValidObjectId(teacherId)) {
          return res.status(400).json({ message: "teacherId must be a valid id." });
        }
        if (!isTeacherOwnedByMentor(teacherId, mentor)) {
          return res.status(403).json({ message: "This teacher is not assigned to you." });
        }
      }

      // ── Center / grade band validation ──
      let center = null;
      if (centerId) {
        if (!mongoose.isValidObjectId(centerId)) {
          return res.status(400).json({ message: "centerId must be a valid id." });
        }
        center = await Center.findById(centerId).lean();
        if (!center) {
          return res.status(400).json({ message: "Selected center could not be found." });
        }

        if (center.type === "school") {
          if (!gradeBand) {
            return res.status(400).json({ message: "gradeBand is required when assigning to a school." });
          }
          if (!(center.gradeBands || []).includes(gradeBand)) {
            return res.status(400).json({
              message: `"${gradeBand}" is not an offered grade band for this school. Available: ${(center.gradeBands || []).join(", ") || "none configured"}.`,
            });
          }
        } else if (center.type === "preschool" && gradeBand) {
          return res.status(400).json({ message: "gradeBand must not be provided for a preschool assignment." });
        }

        // Verify the selected teacher actually belongs to the selected center
        if (teacherId) {
          const teacherDoc = await User.findById(teacherId).select("teacherProfile.center").lean();
          const teacherCenterId = teacherDoc?.teacherProfile?.center ? String(teacherDoc.teacherProfile.center) : null;
          if (teacherCenterId !== String(centerId)) {
            return res.status(400).json({ message: "Selected fellow is not registered at the selected center." });
          }
        }
      } else if (gradeBand) {
        // gradeBand without a center makes no sense — reject rather than silently ignore
        return res.status(400).json({ message: "centerId is required when specifying gradeBand." });
      }

      // Prevent duplicate
      if (teacherId) {
        const existing = await LessonPlanAssignment.findOne({ lessonPlan: lessonPlanId, teacher: teacherId });
        if (existing) {
          return res.status(200).json({ assignment: existing, message: "Assignment already exists." });
        }
      }

      const assignment = await LessonPlanAssignment.create({
        lessonPlan: lessonPlanId,
        teacher: teacherId,
        center: centerId || undefined,
        class: classId || undefined,
        gradeBand: gradeBand || null,
        assignedDate: assignedDate || new Date(),
        status: "pending",
      });

      if (teacherId) {
        await Notification.create({
          recipient: teacherId,
          title: "New lesson plan assigned",
          body: "A lesson plan has been allocated to your classroom schedule.",
          status: "sent",
          sentAt: new Date(),
        });
      }

      res.status(201).json({ assignment });
    } catch (error) {
      console.error("[mentor/lesson-plans/assign] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /assignments — List assignments scoped to this mentor's fellows
  // ---------------------------------------------------------------------------
  router.get("/assignments", async (req, res) => {
    try {
      const mentor = await User.findById(req.user.id).select("mentorProfile.assignedTeachers").lean();
      const assignedTeacherIds = mentor?.mentorProfile?.assignedTeachers || [];

      const assignments = await LessonPlanAssignment.find({
        teacher: { $in: assignedTeacherIds },
      })
        .populate("lessonPlan")
        .populate("teacher", "name email")
        .populate("center", "name")
        .populate("class", "name");

      res.json({ assignments });
    } catch (error) {
      console.error("[mentor/lesson-plans/assignments GET] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // PATCH /assignments/:id — Review/update an assignment (mentor's own fellows only)
  // ---------------------------------------------------------------------------
  router.patch("/assignments/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Assignment id must be valid." });
      }

      // Load assignment, check ownership
      const assignment = await LessonPlanAssignment.findById(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found." });
      }

      const mentor = await User.findById(req.user.id).select("mentorProfile.assignedTeachers").lean();
      if (!isTeacherOwnedByMentor(assignment.teacher, mentor)) {
        return res.status(403).json({ message: "This assignment's teacher is not assigned to you." });
      }

      const { status, adminFeedback } = req.body;
      const updates = {};
      if (status) updates.status = status;
      if (adminFeedback !== undefined) updates.adminFeedback = adminFeedback;
      if (status === "reviewed" || adminFeedback) updates.reviewedAt = new Date();

      const updated = await LessonPlanAssignment.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
      );

      res.json({ assignment: updated });
    } catch (error) {
      console.error("[mentor/lesson-plans/assignments PATCH] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // GET /reports — Completion reports scoped to this mentor's fellows
  // ---------------------------------------------------------------------------
  router.get("/reports", async (req, res) => {
    try {
      const mentor = await User.findById(req.user.id).select("mentorProfile.assignedTeachers").lean();
      const assignedTeacherIds = mentor?.mentorProfile?.assignedTeachers || [];

      const reports = await LessonCompletionReport.find({
        teacher: { $in: assignedTeacherIds },
      })
        .populate({
          path: "assignment",
          populate: [
            { path: "lessonPlan" },
            { path: "center", select: "name" },
            { path: "class", select: "name" },
          ],
        })
        .populate("teacher", "name email")
        .populate("files");

      res.json({ reports });
    } catch (error) {
      console.error("[mentor/lesson-plans/reports GET] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // PATCH /reports/:id — Review a completion report (mentor's own fellows only)
  // ---------------------------------------------------------------------------
  router.patch("/reports/:id", async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Report id must be valid." });
      }

      const report = await LessonCompletionReport.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found." });
      }

      // Ownership check
      const mentor = await User.findById(req.user.id).select("mentorProfile.assignedTeachers").lean();
      if (!isTeacherOwnedByMentor(report.teacher, mentor)) {
        return res.status(403).json({ message: "This report's teacher is not assigned to you." });
      }

      const { status, adminFeedback } = req.body;
      const updates = {};
      if (status) updates.status = status;
      if (adminFeedback !== undefined) updates.adminFeedback = adminFeedback;
      updates.reviewedBy = req.user.id;
      updates.reviewedAt = new Date();

      const updated = await LessonCompletionReport.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { new: true }
      );

      // Also update parent assignment status when report is approved/rejected
      if (updated && (status === "approved" || status === "rejected")) {
        await LessonPlanAssignment.findByIdAndUpdate(updated.assignment, { status: "reviewed" });
      }

      res.json({ report: updated });
    } catch (error) {
      console.error("[mentor/lesson-plans/reports PATCH] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // ---------------------------------------------------------------------------
  // DELETE /:id — Delete a lesson plan and its assignments
  // ---------------------------------------------------------------------------
  router.delete("/:id", async (req, res) => {
    try {
      const planId = req.params.id;
      if (!mongoose.isValidObjectId(planId)) {
        return res.status(400).json({ message: "Invalid plan ID." });
      }

      const plan = await LessonPlan.findById(planId);
      if (!plan) return res.status(404).json({ message: "Lesson plan not found." });
      
      if (plan.createdBy.toString() !== req.user.id.toString()) {
        return res.status(403).json({ message: "You can only delete lesson plans you created." });
      }

      const assignments = await LessonPlanAssignment.find({ lessonPlan: planId });
      const hasCompleted = assignments.some(a => ["completed", "reviewed"].includes(a.status));
      if (hasCompleted) {
        return res.status(400).json({ message: "Cannot delete this lesson plan because one or more teachers have already completed it." });
      }

      await LessonPlanAssignment.deleteMany({ lessonPlan: planId });
      await LessonPlan.findByIdAndDelete(planId);

      res.json({ message: "Lesson plan and pending assignments deleted successfully." });
    } catch (error) {
      console.error("[mentor/lesson-plans DELETE] error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  return router;
}
