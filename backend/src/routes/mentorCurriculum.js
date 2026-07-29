import express from "express";
import { CurriculumPlan, CurriculumPhase, CurriculumAssignment } from "../models/Curriculum.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// Get all curriculum plans created by the logged-in mentor
router.get("/plans", async (req, res) => {
  try {
    const plans = await CurriculumPlan.find({ mentor: req.user.id }).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch plans", error: error.message });
  }
});

// Create a new curriculum plan
router.post("/plans", async (req, res) => {
  try {
    const { title, durationType } = req.body;
    if (!title || !durationType) {
      return res.status(400).json({ message: "Title and durationType are required" });
    }
    
    const plan = new CurriculumPlan({
      title,
      durationType,
      mentor: req.user.id,
      status: "draft"
    });
    
    await plan.save();
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to create plan", error: error.message });
  }
});

// Update a curriculum plan (e.g. publish)
router.put("/plans/:id", async (req, res) => {
  try {
    const { title, durationType, status } = req.body;
    const plan = await CurriculumPlan.findOneAndUpdate(
      { _id: req.params.id, mentor: req.user.id },
      { $set: { title, durationType, status } },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: "Failed to update plan", error: error.message });
  }
});

// Delete a curriculum plan and its phases
router.delete("/plans/:id", async (req, res) => {
  try {
    const plan = await CurriculumPlan.findOneAndDelete({ _id: req.params.id, mentor: req.user.id });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    
    // Also delete associated phases
    await CurriculumPhase.deleteMany({ plan: plan._id });
    
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete plan", error: error.message });
  }
});

// Get phases for a specific plan
router.get("/plans/:id/phases", async (req, res) => {
  try {
    const phases = await CurriculumPhase.find({ plan: req.params.id }).sort({ phaseNumber: 1 });
    res.json(phases);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch phases", error: error.message });
  }
});

// Add a phase to a plan
router.post("/plans/:id/phases", async (req, res) => {
  try {
    const { phaseNumber, semester, title, startDate, endDate, topics } = req.body;
    
    // Verify plan belongs to mentor
    const plan = await CurriculumPlan.findOne({ _id: req.params.id, mentor: req.user.id });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    
    const phase = new CurriculumPhase({
      plan: plan._id,
      phaseNumber,
      semester,
      title,
      startDate,
      endDate,
      topics: topics || []
    });
    
    await phase.save();
    res.status(201).json(phase);
  } catch (error) {
    res.status(500).json({ message: "Failed to add phase", error: error.message });
  }
});

// Update a phase (and its embedded topics)
router.put("/phases/:phaseId", async (req, res) => {
  try {
    const { phaseNumber, semester, title, startDate, endDate, topics } = req.body;
    const phase = await CurriculumPhase.findByIdAndUpdate(
      req.params.phaseId,
      { $set: { phaseNumber, semester, title, startDate, endDate, topics } },
      { new: true }
    );
    if (!phase) return res.status(404).json({ message: "Phase not found" });
    res.json(phase);
  } catch (error) {
    res.status(500).json({ message: "Failed to update phase", error: error.message });
  }
});

// Delete a phase
router.delete("/phases/:phaseId", async (req, res) => {
  try {
    const phase = await CurriculumPhase.findByIdAndDelete(req.params.phaseId);
    if (!phase) return res.status(404).json({ message: "Phase not found" });
    res.json({ message: "Phase deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete phase", error: error.message });
  }
});

// Assign a plan and a specific active phase to a fellow
router.post("/assign", async (req, res) => {
  try {
    const { planId, fellowId, activePhaseId } = req.body;
    if (!planId || !fellowId || !activePhaseId) {
      return res.status(400).json({ message: "planId, fellowId, and activePhaseId are required" });
    }
    
    // Upsert assignment for this fellow and plan (a fellow can only have one assignment per plan)
    const assignment = await CurriculumAssignment.findOneAndUpdate(
      { plan: planId, fellow: fellowId },
      {
        $set: {
          assignedBy: req.user.id,
          activePhase: activePhaseId,
          status: "active"
        }
      },
      { upsert: true, new: true }
    ).populate("activePhase").populate("fellow", "name email");
    
    res.status(200).json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Failed to assign plan", error: error.message });
  }
});

// Get all curriculum assignments for the mentor's mentees
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await CurriculumAssignment.find({ assignedBy: req.user.id })
      .populate("plan", "title durationType")
      .populate("activePhase", "title semester phaseNumber")
      .populate("fellow", "name email");
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch assignments", error: error.message });
  }
});

// -------------------------------------------------------------
// Fellow Facing API (Can be used by fellows to see their assigned curriculum)
// -------------------------------------------------------------
router.get("/my-curriculum", async (req, res) => {
  try {
    // Only fellows use this route
    const assignments = await CurriculumAssignment.find({ fellow: req.user.id, status: "active" })
      .populate("plan")
      .populate("activePhase");
      
    // Fetch all phases for the assigned plans so the UI can show "locked" upcoming phases
    const planIds = assignments.map(a => a.plan._id);
    const allPhases = await CurriculumPhase.find({ plan: { $in: planIds } }).sort({ phaseNumber: 1 });
    
    res.json({ assignments, allPhases });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch fellow curriculum", error: error.message });
  }
});

export default router;
