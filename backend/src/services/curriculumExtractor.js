// backend/src/services/curriculumExtractor.js
//
// Turns an uploaded curriculum document (.docx, .txt, .md) into the
// structured shape MonthCurriculum expects: monthly objective, weekly
// focus, a deliverables checklist (with matching keywords), and success
// check criteria. Same Groq -> Gemini fallback pattern as
// aiPdcaGenerator.js, and the same strict-grounding spirit: the AI may only
// restructure what's actually in the document, never invent deliverables
// or objectives that aren't there.

import mammoth from "mammoth";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `You convert a Fellowship curriculum document for ONE month into structured JSON for a Plan-Do-Check-Act (PDCA) tracking system.

RULES:
- Only use content that is actually present in the document. Do not invent deliverables, objectives, or weeks that aren't described.
- "deliverables" are the concrete trackable outputs/artifacts the Fellow must produce that month (e.g. "Anganwadi Visits", "Field Diary Entries", "Community Map"). For each, give a short lowercase "keywords" list (2-4 phrases) that would appear in a Fellow's activity log or submission describing that deliverable, and a "targetCount" (a number if the doc gives a minimum count, otherwise null).
- "successCheck" has four arrays (plan/do/check/act) of short criterion strings describing what "success" looks like for that phase, taken from the document if present (if the document doesn't separate these explicitly, infer reasonable ones strictly from its content).
- For each "do" criterion only, if it maps cleanly onto one deliverable's "id", set "linkedDeliverableId" to that id so it can be auto-checked against real logs; otherwise null. "plan"/"check"/"act" criteria always get "linkedDeliverableId": null (they require human judgement).
- "weeklyFocus" is a short one-line description per week, numbered from 1.
- Give every deliverable a short, unique, lowercase snake_case "id".

OUTPUT — return ONLY valid JSON, no markdown, no code fences, no preamble:
{
  "monthlyObjective": "...",
  "weeklyFocus": [{"week": 1, "focus": "..."}],
  "deliverables": [{"id": "...", "label": "...", "keywords": ["..."], "targetCount": null}],
  "successCheck": {
    "plan": [{"criterion": "...", "linkedDeliverableId": null}],
    "do": [{"criterion": "...", "linkedDeliverableId": "..."}],
    "check": [{"criterion": "...", "linkedDeliverableId": null}],
    "act": [{"criterion": "...", "linkedDeliverableId": null}]
  }
}`;

function aiLog(event, details = {}) {
  console.log(`[curriculum-extractor] ${event}`, JSON.stringify(details));
}

function isUsableKey(key) {
  if (!key) return false;
  if (/^YOUR_/i.test(key) || /placeholder/i.test(key) || key === "your_api_key_here") return false;
  return true;
}

function stripCodeFences(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return text.trim();
}

// ── Step 1: raw text extraction from the uploaded file ──
export async function extractTextFromFile(buffer, originalName) {
  const ext = (originalName.split(".").pop() || "").toLowerCase();
  if (ext === "docx") {
    const { value: text } = await mammoth.extractRawText({ buffer });
    return text.trim();
  }
  if (ext === "txt" || ext === "md") {
    return buffer.toString("utf-8").trim();
  }
  throw new Error(
    `Unsupported file type ".${ext}". Upload a .docx, .txt, or .md curriculum document.`
  );
}

// ── Step 2: structured parse via AI ──
function validateParsed(parsed) {
  if (!parsed || typeof parsed.monthlyObjective !== "string" || !parsed.monthlyObjective.trim()) {
    throw new Error("AI parse is missing a monthlyObjective.");
  }
  if (!Array.isArray(parsed.deliverables) || parsed.deliverables.length === 0) {
    throw new Error("AI parse produced no deliverables.");
  }
  const seen = new Set();
  for (const d of parsed.deliverables) {
    if (!d.id || !d.label) throw new Error("Every deliverable needs an id and label.");
    if (seen.has(d.id)) d.id = `${d.id}_${seen.size}`; // de-dupe defensively
    seen.add(d.id);
    d.keywords = Array.isArray(d.keywords) ? d.keywords.map((k) => String(k).toLowerCase()) : [];
    d.targetCount = Number.isFinite(d.targetCount) ? d.targetCount : null;
  }
  const sc = parsed.successCheck || {};
  for (const phase of ["plan", "do", "check", "act"]) {
    sc[phase] = Array.isArray(sc[phase]) ? sc[phase] : [];
  }
  parsed.successCheck = sc;
  parsed.weeklyFocus = Array.isArray(parsed.weeklyFocus) ? parsed.weeklyFocus : [];
  return parsed;
}

async function callGroq({ userMessage, apiKey }) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Groq API failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  return validateParsed(JSON.parse(stripCodeFences(data.choices?.[0]?.message?.content || "")));
}

async function callGemini({ userMessage, apiKey }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\n${userMessage}` }] }],
      }),
    }
  );
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini API failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
  return validateParsed(JSON.parse(stripCodeFences(content)));
}

const MAX_DOC_CHARS = 12000; // keep prompts small/cheap; curriculum docs are a few pages at most

/**
 * Parse a curriculum document's raw text into the structured shape
 * MonthCurriculum expects. Throws if no AI provider is configured or
 * available — unlike the PDCA draft generator, there's no sensible "blank
 * template" fallback for a curriculum parse, so the route should surface
 * the error and let the mentor fill the form in by hand instead.
 */
export async function parseCurriculumDocument(rawText) {
  if (!rawText || rawText.trim().length < 40) {
    throw new Error("Document appears to be empty or too short to parse.");
  }
  const userMessage = `Curriculum document text:\n\n${rawText.slice(0, MAX_DOC_CHARS)}`;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (isUsableKey(groqKey)) {
    try {
      aiLog("groq_start", {});
      const parsed = await callGroq({ userMessage, apiKey: groqKey });
      return { ...parsed, aiProvider: "groq" };
    } catch (err) {
      aiLog("groq_failed", { message: err.message });
    }
  }
  if (isUsableKey(geminiKey)) {
    try {
      aiLog("gemini_start", {});
      const parsed = await callGemini({ userMessage, apiKey: geminiKey });
      return { ...parsed, aiProvider: "gemini" };
    } catch (err) {
      aiLog("gemini_failed", { message: err.message });
    }
  }

  throw new Error(
    "AI parsing is currently unavailable (no Groq/Gemini key configured or both failed). Try again shortly, or ask an admin to check the API keys."
  );
}