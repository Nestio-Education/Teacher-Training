import crypto from "crypto";

// Minimal Groq service for translations
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export const SUPPORTED_LANGS = [
  { code: "hi", name: "Hindi" },
  { code: "mr", name: "Marathi" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
  { code: "gu", name: "Gujarati" },
  { code: "ml", name: "Malayalam" }
];

// Helper to generate a content hash (to avoid re-translating if original hasn't changed)
export function generateContentHash(str) {
  if (!str) return null;
  return crypto.createHash("md5").update(str).digest("hex");
}

import { translate } from "@vitalets/google-translate-api";


const sleep = ms => new Promise(res => setTimeout(res, ms));

export async function translateText(text, targetLangCode, targetLangName) {
  await sleep(1500); // Prevent rate limits

  if (!text || typeof text !== "string" || !text.trim()) return text;
  
  try {
    const { text: translated } = await translate(text, { to: targetLangCode });
    return translated;
  } catch (err) {
    console.error(`Translation failed for ${targetLangName || targetLangCode}:`, err.message);
    return text;
  }
}

export async function translateObjectFields(obj, fieldsToTranslate, existingTranslations = {}) {
  // Returns a new translations object: { langCode: { fieldName: { text: "...", hash: "..." } } }
  const result = JSON.parse(JSON.stringify(existingTranslations || {}));

  for (const lang of SUPPORTED_LANGS) {
    if (!result[lang.code]) result[lang.code] = {};

    for (const field of fieldsToTranslate) {
      const originalText = obj[field];
      if (!originalText) continue;
      
      const currentHash = generateContentHash(originalText);
      const existing = result[lang.code][field];

      // Skip if already translated and hash matches
      if (existing && existing.hash === currentHash && existing.text) {
        continue;
      }

      const translated = await translateText(originalText, lang.code, lang.name);
      result[lang.code][field] = {
        text: translated,
        hash: currentHash
      };
    }
  }

  return result;
}
