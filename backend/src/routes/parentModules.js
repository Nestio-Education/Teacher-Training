// Changed by: Snehal
// Date: 20-07-2026
// Description: Routes for Parent Capacity Building modules — list modules, get single module with sessions
// Updated: uses pre-seeded embedded translations (translations.hi/mr per session & activity) — no on-the-fly translation/save
import express from "express";
import { ParentModule } from "../models/ParentModule.js";
import { syncParentModuleTranslations } from "../services/translationSync.js";

function localizeModule(modDoc, lang) {
  if (!lang || lang === 'en') return modDoc;
  const m = modDoc.toObject ? modDoc.toObject() : modDoc;

  // Legacy fallback: titleTranslations and objectiveTranslations
  if (m.titleTranslations && m.titleTranslations[lang]) m.title = m.titleTranslations[lang];
  if (m.objectiveTranslations && m.objectiveTranslations[lang]) m.objective = m.objectiveTranslations[lang];

  if (m.translations && m.translations[lang]) {
    const trans = m.translations[lang];
    if (trans.title?.text) m.title = trans.title.text;
    if (trans.objective?.text) m.objective = trans.objective.text;
  }

  if (m.sessions) {
    m.sessions = m.sessions.map(s => {
      // Legacy fallback
      if (s.titleTranslations && s.titleTranslations[lang]) s.title = s.titleTranslations[lang];
      if (s.objectiveTranslations && s.objectiveTranslations[lang]) s.objective = s.objectiveTranslations[lang];
      if (s.homePracticeTranslations && s.homePracticeTranslations[lang]) s.homePractice = s.homePracticeTranslations[lang];

      if (s.translations && s.translations[lang]) {
        const st = s.translations[lang];
        if (st.title?.text) s.title = st.title.text;
        if (st.objective?.text) s.objective = st.objective.text;
        if (st.homePractice?.text) s.homePractice = st.homePractice.text;
      }
      if (s.activities) {
        s.activities = s.activities.map(a => {
          // Legacy fallback
          if (a.activityTranslations && a.activityTranslations[lang]) a.activity = a.activityTranslations[lang];
          if (a.keyFocusTranslations && a.keyFocusTranslations[lang]) a.keyFocus = a.keyFocusTranslations[lang];

          if (a.translations && a.translations[lang]) {
            const at = a.translations[lang];
            if (at.activity?.text) a.activity = at.activity.text;
            if (at.keyFocus?.text) a.keyFocus = at.keyFocus.text;
          }
          return a;
        });
      }
      return s;
    });
  }
  return m;
}

import { ParentModuleAssignment } from "../models/ParentModuleAssignment.js";
import { requireAuth } from "../auth.js";

const router = express.Router();
const SUPPORTED_LANGS = ["hi", "mr", "gu", "kn", "te", "ta", "ml"];



// GET all modules (supports filter by ageGroup/category, and lang for localization)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { ageGroup, category, lang } = req.query;
    const filter = { is_active: true };
    if (ageGroup) filter.ageGroup = ageGroup;
    if (category) filter.category = category;

    // Teachers only see modules explicitly assigned to them by the admin.
    // Admins/trainers/super_admin/mentor continue to see everything (unchanged).
    if (req.user.role === "teacher") {
      const assignments = await ParentModuleAssignment.find({ teacher: req.user.id }).select("module");
      const assignedModuleIds = assignments.map((a) => a.module);
      filter._id = { $in: assignedModuleIds };
    }

    const modules = await ParentModule.find(filter).sort({ moduleNumber: 1 });
    const result = modules.map((mod) => localizeModule(mod, lang));
    res.json({ success: true, modules: result });
  } catch (error) {
    next(error);
  }
});
// GET single module with full session detail (supports lang for localization)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { lang } = req.query;
    const mod = await ParentModule.findById(req.params.id);
    if (!mod) return res.status(404).json({ message: "Module not found" });
    const result = localizeModule(mod, lang);
    res.json({ success: true, module: result });
  } catch (error) {
    next(error);
  }
});
// Snehal Change
// ADMIN: Create a new module
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { moduleNumber, title, category, ageGroup, duration, year, objective, outcomes, sessions } = req.body;

    if (!moduleNumber || !title) {
      return res.status(400).json({ message: "moduleNumber and title are required" });
    }

    const mod = await ParentModule.create({
      moduleNumber, title, category, ageGroup, duration, year, objective, outcomes, sessions,
    });

    res.status(201).json({ success: true, module: mod });
  } catch (error) {
    next(error);
  }
});
// Start: Snehal change
// ADMIN: Edit an existing module
router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const updates = req.body;
    const mod = await ParentModule.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!mod) return res.status(404).json({ message: "Module not found" });
    res.json({ success: true, module: mod });
  } catch (error) {
    next(error);
  }
});

// ADMIN: Delete a module
router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const mod = await ParentModule.findByIdAndDelete(req.params.id);
    if (!mod) return res.status(404).json({ message: "Module not found" });
    res.json({ success: true, message: "Module deleted" });
  } catch (error) {
    next(error);
  }
});
// End: Snehal change
export default router;