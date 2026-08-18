// backend/src/services/aiPdcaGenerator.js
//
// Generates a PDCA (Plan/Do/Check/Act) draft for any published month's
// curriculum. Mirrors the Groq -> Gemini fallback pattern already used in
// aiLessonPlanner.js (Section 4 of the doc: "reuse whichever AI service is
// already active for the Lesson Planner feature"). The AI only writes
// prose from pre-computed facts (see pdcaGrounding.js) — it never counts
// or infers.

const GROQ_MODEL = process.env.GROQ_MODEL || "qwen/qwen3.6-27b";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are drafting a FIRST-DRAFT PDCA (Plan / Do / Check / Act) report for a SpacECE India Foundation "Umang Fellowship" Fellow, covering the month whose Monthly Objective and Weekly Focus are given to you below. A Mentor will review, edit, and approve this draft before it is final — you are not producing a finished report.

STRICT GROUNDING RULE (most important rule):
- You may ONLY state facts, counts, or observations that are explicitly present in the data given to you below.
- Do NOT invent visit counts, dates, names, conversations, or outcomes that are not in the data.
- Do NOT assess or guess how the Fellow felt, what they understood, or the quality of their relationships with community members — that is always the Mentor's judgement call, never yours.
- If a section has little or no supporting data, output EXACTLY this string for that field: "Not enough data — Mentor to complete." Do not pad it with generic filler text.

WHAT TO WRITE PER SECTION:
- "plan": 2-4 sentences on what the Fellow was expected to learn/explore this month, using ONLY the Monthly Objective and Weekly Focus list given.
- "do": 3-5 sentences on what the Fellow ACTUALLY did, grounded only in the deliverables/facts given (cite real counts, e.g. "completed 3 of the required 4 Anganwadi visits").
- "check": 2-4 sentences noting gaps/observations from the DATA ONLY (missing deliverables, stale activity, rework needed). Never assess judgement-based criteria (stakeholder understanding, trust, theory-practice connection) — those are listed separately for the Mentor, don't try to answer them yourself.
- "act": 2-3 sentences suggesting concrete next steps based only on the missing/pending items given.

OUTPUT — return ONLY a valid JSON object, no markdown, no code fences, no preamble:
{
  "plan": "...",
  "do": "...",
  "check": "...",
  "act": "...",
  "low_data_fields": ["plan" | "do" | "check" | "act", ...]
}
low_data_fields lists every section where you had to use the "Not enough data" fallback text.`;

function aiLog(event, details = {}) {
  console.log(`[ai-pdca-generator] ${event}`, JSON.stringify(details));
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

function parsePdcaJson(raw) {
  const cleaned = stripCodeFences(raw);
  const draft = JSON.parse(cleaned);
  const fields = ["plan", "do", "check", "act"];
  for (const f of fields) {
    if (typeof draft[f] !== "string" || !draft[f].trim()) {
      throw new Error(`Invalid PDCA draft JSON: missing or empty "${f}".`);
    }
  }
  return {
    plan: draft.plan.trim(),
    do: draft.do.trim(),
    check: draft.check.trim(),
    act: draft.act.trim(),
    low_data_fields: Array.isArray(draft.low_data_fields)
      ? draft.low_data_fields.filter((f) => fields.includes(f))
      : [],
  };
}

function buildUserMessage(groundingData) {
  return [
    `Monthly Objective:\n${groundingData.monthlyObjective}`,
    ``,
    `Weekly Focus:`,
    ...groundingData.weeklyFocus.map((w) => `- Week ${w.week}: ${w.focus}`),
    ``,
    `Deliverables status (real, pre-computed — do not recount):`,
    ...groundingData.deliverables.map(
      (d) => `- ${d.label}: ${d.status}${d.count != null ? ` (count: ${d.count})` : ""}`
    ),
    ``,
    `Facts (only source of truth for "do" and "check"):`,
    ...groundingData.facts.map((f) => `- ${f}`),
    ``,
    `Success-check "do" items already auto-assessed from real data:`,
    ...groundingData.successCheckDo.map((c) =>
      c.autoAssessed ? `- ${c.criterion}: ${c.met ? "met" : "not met"} (${c.basis})` : `- ${c.criterion}: mentor to assess`
    ),
  ].join("\n");
}

async function callGroq({ userMessage, apiKey }) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.2,
      // Qwen 3.6 emits its reasoning in <think> tags by default. Disable
      // reasoning and enforce JSON mode so its response can be parsed as the
      // PDCA object expected below.
      reasoning_effort: "none",
      reasoning_format: "hidden",
      response_format: { type: "json_object" },
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
  return parsePdcaJson(data.choices?.[0]?.message?.content || "");
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
  return parsePdcaJson(content);
}

/**
 * Generate a PDCA draft (any month) from pre-computed grounding data.
 * Never throws for "AI unavailable" — per the doc's fallback requirement,
 * it returns an empty template instead so the route can respond 200 with
 * a usable blank form rather than crashing the flow.
 */
export async function generatePDCADraft(groundingData) {
  const userMessage = buildUserMessage(groundingData);
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  let draft = null;
  let provider = null;

  if (isUsableKey(groqKey)) {
    try {
      aiLog("groq_start", { fellow: groundingData.fellowName });
      draft = await callGroq({ userMessage, apiKey: groqKey });
      provider = "groq";
    } catch (err) {
      aiLog("groq_failed", { message: err.message });
    }
  }

  if (!draft && isUsableKey(geminiKey)) {
    try {
      aiLog("gemini_start", { fellow: groundingData.fellowName });
      draft = await callGemini({ userMessage, apiKey: geminiKey });
      provider = "gemini";
    } catch (err) {
      aiLog("gemini_failed", { message: err.message });
    }
  }

  if (!draft) {
    aiLog("ai_unavailable", {
      fellow: groundingData.fellowName,
      groqKeySet: isUsableKey(groqKey),
      geminiKeySet: isUsableKey(geminiKey),
    });
    // Empty template fallback — Section 4/6: "if the AI service is
    // unavailable, the system returns an empty template rather
    // than failing."
    return {
      aiAvailable: false,
      provider: null,
      plan: "",
      do: "",
      check: "",
      act: "",
      low_data_fields: ["plan", "do", "check", "act"],
    };
  }

  return { aiAvailable: true, provider, ...draft };
}
