/**
 * AI Lesson Planner — port of Testing/api.py
 * Generates a structured lesson plan from age group, topic, and duration.
 */

const MISTRAL_MODEL = process.env.MISTRAL_MODEL || "mistral-small-2506";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are a lesson planning assistant for teachers.
Given an age group, topic, and duration, return ONLY a JSON object,
no markdown, no extra text, with exactly these keys:
"objective" (string), "activities" (list of strings), "materials" (list of strings).`;

function aiLog(event, details = {}) {
  console.log(`[ai-lesson-planner] ${event}`, JSON.stringify(details));
}

function buildLocalDraft({ ageGroup, topic, duration }) {
  return {
    objective: `By the end of this ${duration} lesson, children in the ${ageGroup} age group will demonstrate understanding of ${topic} through guided play and participation.`,
    activities: [
      `Warm-up circle: introduce ${topic} with a short story or song (5 min).`,
      `Main activity: hands-on exploration of ${topic} suited to ${ageGroup} (majority of ${duration}).`,
      `Guided practice: small-group discussion or demonstration related to ${topic}.`,
      `Closing circle: children share one thing they learned about ${topic}.`,
    ],
    materials: [
      "Chart paper / whiteboard",
      "Markers or crayons",
      `Age-appropriate props related to ${topic}`,
      "Storybook or flashcards (optional)",
    ],
  };
}

function stripCodeFences(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/\s*```$/, "");
  }
  return text.trim();
}

function parseLessonJson(raw) {
  const cleaned = stripCodeFences(raw);
  const draft = JSON.parse(cleaned);
  if (!draft || typeof draft.objective !== "string") {
    throw new Error("Invalid lesson plan JSON: missing objective.");
  }
  if (!Array.isArray(draft.activities)) draft.activities = [];
  if (!Array.isArray(draft.materials)) draft.materials = [];
  return {
    objective: draft.objective.trim(),
    activities: draft.activities.map((a) => String(a).trim()).filter(Boolean),
    materials: draft.materials.map((m) => String(m).trim()).filter(Boolean),
  };
}

function formatDraftText({ ageGroup, topic, duration, draft }) {
  const lines = [
    `LESSON PLAN - ${topic}`,
    `Age group: ${ageGroup}`,
    `Duration: ${duration}`,
    "",
    "OBJECTIVE",
    draft.objective,
    "",
    "ACTIVITIES",
  ];
  draft.activities.forEach((a, i) => lines.push(`  ${i + 1}. ${a}`));
  lines.push("", "MATERIALS");
  draft.materials.forEach((m) => lines.push(`  - ${m}`));
  return lines.join("\n");
}

async function callMistral({ ageGroup, topic, duration, apiKey }) {
  const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Age group: ${ageGroup}\nTopic: ${topic}\nDuration: ${duration}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Mistral API failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  return parseLessonJson(content);
}

async function callGemini({ ageGroup, topic, duration, apiKey }) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\nAge group: ${ageGroup}\nTopic: ${topic}\nDuration: ${duration}`,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Gemini API failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = await response.json();
  const content =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";
  return parseLessonJson(content);
}

function isUsableKey(key) {
  if (!key) return false;
  if (/^YOUR_/i.test(key) || /placeholder/i.test(key) || key === "your_api_key_here") return false;
  return true;
}

/**
 * Generate a lesson plan draft.
 * @param {{ ageGroup: string, topic: string, duration: string }} input
 */
export async function generateAILessonPlan(input = {}) {
  const ageGroup = String(input.ageGroup || input.age_group || "").trim();
  const topic = String(input.topic || "").trim();
  const duration = String(input.duration || "").trim();

  if (!ageGroup || !topic || !duration) {
    const err = new Error("Age group, topic, and duration are required.");
    err.status = 400;
    throw err;
  }

  const mistralKey = process.env.MISTRAL_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  let draft = null;
  let provider = "local";

  if (isUsableKey(mistralKey)) {
    try {
      aiLog("mistral_start", { model: MISTRAL_MODEL, ageGroup, topic, duration });
      draft = await callMistral({ ageGroup, topic, duration, apiKey: mistralKey });
      provider = "mistral";
    } catch (err) {
      aiLog("mistral_failed", { message: err.message });
    }
  }

  if (!draft && isUsableKey(geminiKey)) {
    try {
      aiLog("gemini_start", { model: GEMINI_MODEL, ageGroup, topic, duration });
      draft = await callGemini({ ageGroup, topic, duration, apiKey: geminiKey });
      provider = "gemini";
    } catch (err) {
      aiLog("gemini_failed", { message: err.message });
    }
  }

  if (!draft) {
    aiLog("local_fallback", { ageGroup, topic, duration });
    draft = buildLocalDraft({ ageGroup, topic, duration });
    provider = "local";
  }

  const draftText = formatDraftText({ ageGroup, topic, duration, draft });

  return {
    ageGroup,
    topic,
    duration,
    objective: draft.objective,
    activities: draft.activities,
    materials: draft.materials,
    draftText,
    provider,
    isLocalFallback: provider === "local",
  };
}
