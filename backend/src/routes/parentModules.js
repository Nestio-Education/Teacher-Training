// Changed by: Snehal
// Date: 20-07-2026
// Description: Routes for Parent Capacity Building modules — list modules, get single module with sessions
// Updated: uses pre-seeded embedded translations (translations.hi/mr per session & activity) — no on-the-fly translation/save
import express from "express";
import { ParentModule } from "../models/ParentModule.js";
import { requireAuth } from "../auth.js";

const router = express.Router();
const SUPPORTED_LANGS = ["hi", "mr"];

// Builds a plain object for the given module, swapping in the requested
// language's text wherever an embedded translation exists. Never writes to the DB.
function localizeModule(modDoc, lang) {
  const obj = modDoc.toObject ? modDoc.toObject() : modDoc;
  if (!lang || lang === "en" || !SUPPORTED_LANGS.includes(lang)) {
    return obj;
  }
  const sessions = (obj.sessions || []).map((sess) => {
    const sessT = sess.translations && sess.translations[lang];
    const activities = (sess.activities || []).map((a) => {
      const aT = a.translations && a.translations[lang];
      return aT ? { ...a, activity: aT.activity, keyFocus: aT.keyFocus } : a;
    });
    return sessT
      ? { ...sess, title: sessT.title, objective: sessT.objective, homePractice: sessT.homePractice, activities }
      : { ...sess, activities };
  });
  const localizedTitle = obj.titleTranslations && obj.titleTranslations[lang];
  const localizedObjective = obj.objectiveTranslations && obj.objectiveTranslations[lang];
  return {
    ...obj,
    title: localizedTitle || obj.title,
    objective: localizedObjective || obj.objective,
    sessions,
  };
}

// GET all modules (supports filter by ageGroup/category, and lang for localization)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { ageGroup, category, lang } = req.query;
    const filter = { is_active: true };
    if (ageGroup) filter.ageGroup = ageGroup;
    if (category) filter.category = category;
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

export default router;