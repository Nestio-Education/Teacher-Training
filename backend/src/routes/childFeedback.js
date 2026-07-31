import express from "express";
import { ChildFeedback } from "../models/ChildFeedback.js";
import { requireAuth, requireRole } from "../auth.js";

const router = express.Router();

// GET all feedback — Admin Feedback inbox tab
router.get("/", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const feedbacks = await ChildFeedback.find({})
      .populate("child")
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    next(error);
  }
});

// GET feedback for one specific child — Child profile page
router.get("/child/:childId", requireAuth, async (req, res, next) => {
  try {
    const feedbacks = await ChildFeedback.find({ child: req.params.childId })
      .populate("teacher", "name email")
      .sort({ createdAt: -1 });
    res.json({ feedbacks });
  } catch (error) {
    next(error);
  }
});

// POST new feedback — Teacher "Submit to Admin"
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const feedback = await ChildFeedback.create({
      ...req.body,
      teacher: req.body.teacher || req.user.id,
      teacherName: req.body.teacherName || req.user.name,
    });
    const populated = await ChildFeedback.findById(feedback._id)
      .populate("child")
      .populate("teacher", "name email");
    res.status(201).json({ feedback: populated });
  } catch (error) {
    next(error);
  }
});

// PATCH — Admin marks feedback as reviewed / adds a note
router.patch("/:id", requireAuth, requireRole("admin"), async (req, res, next) => {
  try {
    const { reviewStatus, adminNote } = req.body;
    const update = {};
    if (reviewStatus !== undefined) update.reviewStatus = reviewStatus;
    if (adminNote !== undefined) update.adminNote = adminNote;

    const feedback = await ChildFeedback.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate("child")
      .populate("teacher", "name email");

    if (!feedback) return res.status(404).json({ message: "Feedback not found" });
    res.json({ feedback });
  } catch (error) {
    next(error);
  }
});

export default router;