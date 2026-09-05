// Shared Groq chat-completions helper.
// Mirrors the rate-limit-aware pattern used in course_generator_service's groq_client.py:
// header-aware pacing + exponential backoff on 429s.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

function isUsableKey(key) {
  if (!key) return false;
  if (/^YOUR_/i.test(key) || /placeholder/i.test(key)) return false;
  return true;
}

async function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

/**
 * Call Groq chat completions with basic 429-aware retry/backoff.
 * @param {{ systemPrompt: string, userPrompt: string, model?: string, temperature?: number, maxRetries?: number, responseFormat?: object }} args
 * @returns {Promise<string>} raw text content from the model
 */
export async function callGroq({ systemPrompt, userPrompt, model, temperature = 0.4, maxRetries = 3, responseFormat }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!isUsableKey(apiKey)) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  let attempt = 0;
  let lastError;

  while (attempt <= maxRetries) {
    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || process.env.GROQ_MODEL || "openai/gpt-oss-20b",
        temperature,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        ...(responseFormat ? { response_format: responseFormat } : {}),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = Number(response.headers.get("retry-after")) || 2 ** attempt;
      await sleep(retryAfter * 1000);
      attempt++;
      continue;
    }

    const detail = await response.text();
    lastError = new Error(`Groq API failed (${response.status}): ${detail.slice(0, 300)}`);
    lastError.status = response.status;
    break;
  }

  throw lastError || new Error("Groq API failed after retries.");
}

export function stripCodeFences(raw) {
  let text = String(raw || "").trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/i, "");
    text = text.replace(/\s*```$/, "");
  }
  return text.trim();
}
