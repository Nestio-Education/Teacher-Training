import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI.trim();

const SUPPORTED_LANGS = [
  { code: "hi", name: "Hindi" },
  { code: "mr", name: "Marathi" },
  { code: "te", name: "Telugu" },
  { code: "kn", name: "Kannada" },
  { code: "ta", name: "Tamil" },
  { code: "gu", name: "Gujarati" },
  { code: "ml", name: "Malayalam" }
];

function hash(str) {
  if (!str) return null;
  return crypto.createHash("md5").update(str).digest("hex");
}

function getTransText(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val.text) return val.text;
  return null;
}

function isUntranslated(val, originalText) {
  const text = getTransText(val);
  if (!text) return true; // missing
  if (text === originalText) return true;
  // If it's something like "[KN] ewggs - 2026-07-16 (Thu)" and original is "ewggs - 2026-07-16 (Thu)"
  if (text.endsWith(originalText) || text.includes(originalText)) {
    // If it's more than 80% identical, probably untranslated properly
    return true; 
  }
  return false;
}

async function translateBatch(textMap, langName) {
  if (Object.keys(textMap).length === 0) return {};
  const prompt = `Translate the values in this JSON object into ${langName}. Keep the exact same keys. Only translate the string values. Return ONLY valid JSON, nothing else.\n\n${JSON.stringify(textMap)}`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        response_format: { type: "json_object" }
      })
    });
    const data = await res.json();
    if (data.error) {
      if (data.error.message?.includes("Rate limit")) {
        const waitMs = 12000;
        console.log(`  Rate limited, waiting ${waitMs/1000}s...`);
        await new Promise(r => setTimeout(r, waitMs));
        return translateBatch(textMap, langName);
      }
      console.error("Groq error:", data.error.message);
      return {};
    }
    return JSON.parse(data.choices[0].message.content);
  } catch (err) {
    console.error(`Failed to translate to ${langName}:`, err.message);
    return {};
  }
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  console.log("Connected to:", db.databaseName);

  console.log("\n=== Processing Lesson Plans ===");
  const items = await db.collection("lessonplans").find({}).toArray();
  for (const item of items) {
    let translations = item.translations || {};
    let updated = false;

    for (const lang of SUPPORTED_LANGS) {
      if (!translations[lang.code]) translations[lang.code] = {};
      const batch = {};
      const fields = {
        title: item.title,
        objectives: item.objectives,
        instructions: item.instructions,
        activities: item.activities,
        resources: item.resources
      };
      
      for (const [key, origText] of Object.entries(fields)) {
        if (!origText) continue;
        const current = translations[lang.code][key];
        if (isUntranslated(current, origText)) {
          batch[key] = origText;
        }
      }

      if (Object.keys(batch).length > 0) {
        console.log(` [${lang.name}] Translating ${Object.keys(batch).length} missing fields for: ${item.title}`);
        const result = await translateBatch(batch, lang.name);
        for (const [key, translatedText] of Object.entries(result)) {
          if (translatedText && translatedText !== batch[key]) {
            translations[lang.code][key] = { text: translatedText, hash: hash(batch[key]) };
            updated = true;
          }
        }
        await sleep(800);
      }
    }

    if (updated) {
      await db.collection("lessonplans").updateOne({ _id: item._id }, { $set: { translations } });
      console.log(` ✓ Updated: ${item.title}`);
    }
  }

  console.log("\nDone!");
  process.exit(0);
}

run().catch(console.error);
