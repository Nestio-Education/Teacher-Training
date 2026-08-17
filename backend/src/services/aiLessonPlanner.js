/**
 * AI Lesson Planner — port of Testing/api.py
 * Generates a structured lesson plan from age group, topic, and duration.
 */

import { callGroq, stripCodeFences } from "./groqClient.js";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const SYSTEM_PROMPT = `You are an expert Early Childhood Education (ECE) curriculum designer working for SpacECE India Foundation.
Your task is to create a detailed, classroom-ready lesson plan tailored specifically to the given age group, topic, and session duration.

PEDAGOGICAL GUIDELINES:
- Design ALL activities to be play-based, hands-on, and developmentally appropriate for the given age group.
- Use BLOOM'S TAXONOMY verbs for the objective (e.g., identify, demonstrate, compare, create, describe, sort, match).
- Structure activities with a clear flow: warm-up → main activity → guided practice → closure.
- For younger children (2–4 years): use sensory play, repetition, and simple language.
- For older children (5–8 years): include higher-order thinking, group collaboration, and creative expression.
- Each activity description must be specific (what the teacher does, what children do, how long it takes).
- Materials should be realistic, low-cost, and available in Indian classrooms.

WARM-UP RULE (CRITICAL):
- The warm-up MUST include at least one SPECIFIC, NAMED song, rhyme, or chant relevant to the topic.
- Do NOT say "a fun song" or "a number song" — NAME the actual song or rhyme (e.g., "Five Little Ducks", "Wheels on the Bus", "Johnny Johnny Yes Papa", "Twinkle Twinkle", "One Two Buckle My Shoe") and describe the specific actions children do while singing it.
- If no well-known song fits perfectly, suggest a simple original chant with the exact words written out (2–4 lines).

OUTPUT FORMAT — return ONLY a valid JSON object with NO markdown, NO code fences, NO preamble:
{
  "objective": "One clear, measurable learning objective using a Bloom's taxonomy action verb",
  "activities": [
    "Warm-up (X min): [Named song or rhyme — write its title in quotes, describe the actions children perform while singing]",
    "Main Activity (X min): [detailed hands-on or play-based activity — describe teacher role and child actions]",
    "Guided Practice (X min): [small-group or pair work where children apply the concept]",
    "Closure (X min): [reflection or sharing — children verbalize or demonstrate what they learned]"
  ],
  "materials": ["item1", "item2", "item3", "..."]
}

STRICT RULES:
- The total time across all activities MUST add up to the given session duration.
- Generate EXACTLY 4 activities following the warm-up → main → practice → closure arc.
- The objective must be a single sentence starting with "By the end of this lesson, children will be able to...".
- Do NOT invent obscure materials — use locally available, affordable items.
- Do NOT return markdown, code fences, or any text outside the JSON object.`;

function aiLog(event, details = {}) {
  console.log(`[ai-lesson-planner] ${event}`, JSON.stringify(details));
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

async function callGroqLesson({ ageGroup, topic, duration }) {
  const userPrompt = `Age group: ${ageGroup}\nTopic: ${topic}\nDuration: ${duration}`;
  const raw = await callGroq({ systemPrompt: SYSTEM_PROMPT, userPrompt, temperature: 0.3 });
  return parseLessonJson(raw);
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

  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  let draft = null;
  let provider = null;

  if (isUsableKey(groqKey)) {
    try {
      aiLog("groq_start", { model: GROQ_MODEL, ageGroup, topic, duration });
      draft = await callGroqLesson({ ageGroup, topic, duration });
      provider = "groq";
    } catch (err) {
      aiLog("groq_failed", { message: err.message });
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
    aiLog("ai_unavailable", {
      ageGroup,
      topic,
      duration,
      groqKeySet: isUsableKey(groqKey),
      geminiKeySet: isUsableKey(geminiKey),
    });
    const err = new Error(
      "AI lesson plan generation failed: no AI provider is available or all providers returned an error. " +
      "Please ensure GROQ_API_KEY is set correctly in your environment."
    );
    err.status = 503;
    throw err;
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
  };
}

const SCHEDULE_SYSTEM_PROMPT = `You are an early-childhood-education activity planner.
Given an activity type, developmental level, a starting topic, a number of weeks, and how many
activities to schedule per day, return ONLY a JSON object, no markdown, no extra text, with
exactly this shape:
{
  "activities": [
    {
      "contentTitle": string,
      "contentType": string,
      "durationMinutes": number,
      "materials": string,
      "purpose": string,
      "howToConduct": string,
      "facilitatorRole": string,
      "expectedOutcomes": string
    }
  ]
}
Return one entry per distinct activity idea appropriate for the given type/level/topic — enough
variety to fill (weeks * 5 working days * activitiesPerDay) slots without excessive repetition.
Do not include dates; scheduling is handled separately.`;

export async function generateAIActivityPool({ type, level, topic, activitiesPerDay, durationWeeks }) {
  const userPrompt = `Activity type: ${type}\nLevel: ${level}\nStarting topic: ${topic}\nActivities per day: ${activitiesPerDay}\nDuration weeks: ${durationWeeks}`;
  const raw = await callGroq({ systemPrompt: SCHEDULE_SYSTEM_PROMPT, userPrompt, temperature: 0.5 });
  const cleaned = stripCodeFences(raw);
  const parsed = JSON.parse(cleaned);
  if (!parsed || !Array.isArray(parsed.activities) || parsed.activities.length === 0) {
    throw new Error("Invalid activity schedule JSON from Groq.");
  }
  return parsed.activities;
}

/**
 * Builds the same schedule shape generateScheduleFromDataset produces client-side,
 * so it can be posted straight to POST /api/mentor/lesson-plans/auto-publish unchanged.
 */
export function buildScheduleFromPool({ pool, type, level, topic, startDate, durationWeeks, activitiesPerDay }) {
  const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = [];
  const cur = new Date(startDate);
  const totalWorkingDays = durationWeeks * 5;
  while (days.length < totalWorkingDays) {
    const dow = cur.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }

  let cursor = 0;
  const schedule = days.map((d) => {
    const activities = [];
    for (let i = 0; i < activitiesPerDay; i++) {
      const a = pool[cursor % pool.length];
      cursor++;
      activities.push({
        order: i + 1,
        contentTitle: a.contentTitle,
        moduleTitle: `${type} · ${level}`,
        contentType: a.contentType,
        durationMinutes: a.durationMinutes,
        materials: a.materials,
        purpose: a.purpose,
        howToConduct: a.howToConduct,
        facilitatorRole: a.facilitatorRole,
        expectedOutcomes: a.expectedOutcomes,
        instructions: `How to conduct:\n${a.howToConduct}\n\nFacilitator role: ${a.facilitatorRole}`,
        objectives: a.expectedOutcomes || a.purpose,
      });
    }
    return { date: d.toISOString().split("T")[0], dayOfWeek: WEEKDAY_NAMES[d.getDay()], activities };
  });

  const totalActivities = schedule.reduce((sum, day) => sum + day.activities.length, 0);
  return { course: { title: topic }, totalActivities, totalDays: schedule.length, durationWeeks, schedule };
}

export async function generateAIActivitySchedule(input = {}) {
  const type = String(input.type || "").trim();
  const level = String(input.level || "").trim();
  const topic = String(input.topic || "").trim();
  const startDate = input.startDate;
  const durationWeeks = Number(input.durationWeeks) || 1;
  const activitiesPerDay = Number(input.maxActivitiesPerDay) || 1;

  if (!type || !level || !topic || !startDate) {
    const err = new Error("type, level, topic, and startDate are required.");
    err.status = 400;
    throw err;
  }

  const pool = await generateAIActivityPool({ type, level, topic, activitiesPerDay, durationWeeks });
  return buildScheduleFromPool({ pool, type, level, topic, startDate, durationWeeks, activitiesPerDay });
}
