import express from "express";
import { PDCACycle, CapstoneSubmission, MenteeObservation } from "../models/MentorTracking.js";

// Note: We expect the router to be mounted such that requireAuth and requireRole("mentor")
// are applied before reaching these routes, or we'll apply them in server.js.

const router = express.Router();

// --- PDCA Cycles ---
router.get("/pdca", async (req, res, next) => {
  try {
    const cycles = await PDCACycle.find({ mentorId: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, cycles });
  } catch (err) {
    next(err);
  }
});

router.post("/pdca", async (req, res, next) => {
  try {
    const cycle = await PDCACycle.create({
      mentorId: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, cycle });
  } catch (err) {
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
    const submission = await CapstoneSubmission.create({
      mentorId: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, submission });
  } catch (err) {
    next(err);
  }
});

// --- Mentee Observations ---
router.get("/observations", async (req, res, next) => {
  try {
    const observations = await MenteeObservation.find({ mentorId: req.user.id }).populate("menteeId", "name email").sort({ createdAt: -1 });
    res.json({ success: true, observations });
  } catch (err) {
    next(err);
  }
});

router.post("/observations", async (req, res, next) => {
  try {
    const observation = await MenteeObservation.create({
      mentorId: req.user.id,
      ...req.body
    });
    res.status(201).json({ success: true, observation });
  } catch (err) {
    next(err);
  }
});

export default router;
