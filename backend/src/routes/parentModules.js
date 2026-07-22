// Changed by: Snehal
// Date: 20-07-2026
// Description: Routes for Parent Capacity Building modules — list modules, get single module with sessions
// Updated: added multi-language support (Hindi/Marathi) via on-the-fly translation with DB caching

import express from "express";
import { translate } from "@vitalets/google-translate-api";
import { ParentModule } from "../models/ParentModule.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

const SUPPORTED_LANGS = ["hi", "mr"]; // English is the default/original, no translation needed

async function translateText(text, targetLang) {
  if (!text || typeof text !== "string") return text;
  try {
    const res = await translate(text, { to: targetLang });
    return res.text;
  } catch (err) {
    console.error(`Translation failed for "${text.slice(0, 30)}...":`, err.message);
    return text; // fallback to original English if translation fails
  }
}

async function translateModule(modDoc, lang) {
  const obj = modDoc.toObject();

  const [title, objective, outcomes] = await Promise.all([
    translateText(obj.title, lang),
    translateText(obj.objective, lang),
    Promise.all((obj.outcomes || []).map((o) => translateText(o, lang))),
  ]);

  const sessions = await Promise.all(
    (obj.sessions || []).map(async (sess) => {
      const [sTitle, sObjective, sHomePractice, activities] = await Promise.all([
        translateText(sess.title, lang),
        translateText(sess.objective, lang),
        translateText(sess.homePractice, lang),
        Promise.all(
          (sess.activities || []).map(async (a) => ({
            time: a.time, // keep as-is (e.g. "15 min")
            activity: await translateText(a.activity, lang),
            keyFocus: await translateText(a.keyFocus, lang),
          }))
        ),
      ]);
      return { ...sess, title: sTitle, objective: sObjective, homePractice: sHomePractice, activities };
    })
  );

  return { ...obj, title, objective, outcomes, sessions };
}

async function getOrCreateTranslation(modDoc, lang) {
  if (!lang || lang === "en" || !SUPPORTED_LANGS.includes(lang)) {
    return modDoc.toObject();
  }
  if (modDoc.translations && modDoc.translations[lang]) {
    return modDoc.translations[lang];
  }
  const translated = await translateModule(modDoc, lang);
  modDoc.translations = modDoc.translations || {};
  modDoc.translations[lang] = translated;
  modDoc.markModified("translations");
  await modDoc.save();
  return translated;
}

// GET all modules (supports filter by ageGroup/category, and lang for translation)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const { ageGroup, category, lang } = req.query;
    const filter = { is_active: true };
    if (ageGroup) filter.ageGroup = ageGroup;
    if (category) filter.category = category;
    const modules = await ParentModule.find(filter).sort({ moduleNumber: 1 });

    const result = await Promise.all(modules.map((mod) => getOrCreateTranslation(mod, lang)));
    res.json({ success: true, modules: result });
  } catch (error) {
    next(error);
  }
});

// GET single module with full session detail (supports lang for translation)
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { lang } = req.query;
    const mod = await ParentModule.findById(req.params.id);
    if (!mod) return res.status(404).json({ message: "Module not found" });

    const result = await getOrCreateTranslation(mod, lang);
    res.json({ success: true, module: result });
  } catch (error) {
    next(error);
  }
});

export default router;