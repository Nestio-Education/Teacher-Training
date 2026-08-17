"""
Teacher Support Chatbot — Standalone FastAPI Microservice (Groq API)

Provides a conversational AI assistant for teacher-facing policy Q&A.
Uses Groq API (LLaMA / Mixtral models) for inference.

Quick start:
    pip install fastapi uvicorn groq pydantic
    export GROQ_API_KEY=your_key_here
    uvicorn main:app --reload --port 8001
"""

import os
import logging
import asyncio
from typing import List, Optional
from dotenv import load_dotenv

# Load env from backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", "backend", ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# ── Logging ──────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("teacher-support-chat")

# ── Environment ──────────────────────────────────────────────────
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
CHATBOT_MAX_TOKENS = int(os.environ.get("CHATBOT_MAX_TOKENS", "1024"))

# ── System Prompt — loaded from external file at startup ─────────
# Edit chatbot_instructions.txt to change chatbot behaviour.
# No code changes needed.
_INSTRUCTIONS_FILE = os.path.join(os.path.dirname(__file__), "chatbot_instructions.txt")
try:
    with open(_INSTRUCTIONS_FILE, "r", encoding="utf-8") as _f:
        TEACHER_SUPPORT_SYSTEM_PROMPT = _f.read()
    logger.info("Loaded system prompt from %s", _INSTRUCTIONS_FILE)
except FileNotFoundError:
    logger.warning(
        "chatbot_instructions.txt not found — using fallback prompt. "
        "Please create %s to configure the chatbot.",
        _INSTRUCTIONS_FILE,
    )
    TEACHER_SUPPORT_SYSTEM_PROMPT = (
        "You are a support assistant on SpacECE India Foundation's Teacher Dashboard. "
        "Answer only questions about attendance, certificates, and course deadlines. "
        "You have no access to individual records. "
        "For anything else, refer the teacher to their coordinator."
    )

# ── Pydantic Models ──────────────────────────────────────────────

class ChatHistoryItem(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatHistoryItem]] = None
    source: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str


class HealthResponse(BaseModel):
    status: str
    module: str

class AssignmentFeedbackRequest(BaseModel):
    teacher_name: str
    course_title: str
    submission_text: str
    rubric_score: float

class AssignmentFeedbackResponse(BaseModel):
    feedback: str


# ── FastAPI App ──────────────────────────────────────────────────
app = FastAPI(
    title="Teacher Support Chatbot",
    version="1.0.0",
    description="Standalone chatbot micro-service for teacher portal support.",
)

# Permissive CORS for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}
MAX_RETRIES = 3
BASE_BACKOFF_SECONDS = 1.0


async def call_groq_with_retry(messages: list, max_tokens: int, temperature: Optional[float] = None) -> str:
    import httpx

    payload = {
        "model": GROQ_MODEL,
        "max_tokens": max_tokens,
        "messages": messages,
    }
    if temperature is not None:
        payload["temperature"] = temperature

    last_exc = None

    async with httpx.AsyncClient(timeout=30.0) as client:
        for attempt in range(MAX_RETRIES):
            try:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                if resp.status_code in RETRYABLE_STATUS_CODES and attempt < MAX_RETRIES - 1:
                    wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
                    logger.warning(
                        "Groq API returned %s (attempt %d/%d) — retrying in %.1fs",
                        resp.status_code, attempt + 1, MAX_RETRIES, wait,
                    )
                    await asyncio.sleep(wait)
                    continue

                resp.raise_for_status()
                data = resp.json()
                reply = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

                if not reply:
                    raise ValueError("Empty reply from Groq API")

                return reply

            except (httpx.TimeoutException, httpx.ConnectError) as exc:
                last_exc = exc
                if attempt < MAX_RETRIES - 1:
                    wait = BASE_BACKOFF_SECONDS * (2 ** attempt)
                    logger.warning(
                        "Groq API connection issue (attempt %d/%d): %s — retrying in %.1fs",
                        attempt + 1, MAX_RETRIES, exc, wait,
                    )
                    await asyncio.sleep(wait)
                    continue
                raise

            except httpx.HTTPStatusError as exc:
                last_exc = exc
                raise

    # Should not be reached, but guard anyway
    raise last_exc or RuntimeError("Groq API call failed after retries")


# ── Routes ───────────────────────────────────────────────────────

@app.get("/api/v1/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "module": "teacher-support-chat"}


@app.post("/api/v1/teacher-support-chat", response_model=ChatResponse)
async def teacher_support_chat(req: ChatRequest):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    # Build message history
    messages = [{"role": "system", "content": TEACHER_SUPPORT_SYSTEM_PROMPT}]

    if req.history:
        for item in req.history:
            messages.append({"role": item.role, "content": item.content})

    messages.append({"role": "user", "content": req.message.strip()})

    # Check API key
    if not GROQ_API_KEY or GROQ_API_KEY.startswith("YOUR_") or "placeholder" in GROQ_API_KEY.lower():
        logger.warning("GROQ_API_KEY is missing or placeholder — returning canned response.")
        return ChatResponse(
            reply=(
                "I'm sorry, the AI service is not fully configured yet. "
                "Please contact the SpacECE coordinator for assistance, "
                "or check the relevant section of the portal for your query."
            )
        )

    try:
        reply = await call_groq_with_retry(messages, CHATBOT_MAX_TOKENS)
        return ChatResponse(reply=reply)

    except Exception as exc:
        logger.error("Groq API error: %s", exc)
        return ChatResponse(
            reply=(
                "I'm having a little trouble connecting right now. "
                "Please try again in a moment, or contact the SpacECE "
                "coordinator for immediate help."
            )
        )


@app.post("/api/v1/assignment-feedback", response_model=AssignmentFeedbackResponse)
async def assignment_feedback(req: AssignmentFeedbackRequest):
    if not GROQ_API_KEY or GROQ_API_KEY.startswith("YOUR_") or "placeholder" in GROQ_API_KEY.lower():
        return AssignmentFeedbackResponse(
            feedback="AI Feedback is not configured. Please add your Groq API key."
        )

    system_prompt = (
        "You are an expert Teacher Assessor for SpacECE. "
        "Your job is to read a teacher's assignment submission and provide a short, constructive review based on their rubric score. "
        "If the score is >= 85, praise them and point out specific strengths. "
        "If the score is < 85, encourage them and point out specific areas to improve. "
        "Structure your response exactly like this:\n\n"
        "Dear [Teacher Name],\n\n"
        "[1-2 sentence overall impression]\n\n"
        "- [Bullet point 1: Specific feedback referencing their text]\n"
        "- [Bullet point 2: Specific feedback referencing their text]\n"
        "- [Bullet point 3: Specific feedback referencing their text]\n\n"
        "Best regards,\nAdmin Team"
    )

    user_prompt = (
        f"Teacher Name: {req.teacher_name}\n"
        f"Course Title: {req.course_title}\n"
        f"Rubric Score: {req.rubric_score}/100\n"
        f"Submission Text:\n{req.submission_text}\n"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        reply = await call_groq_with_retry(messages, max_tokens=500, temperature=0.5)
        return AssignmentFeedbackResponse(feedback=reply)

    except Exception as exc:
        logger.error("Groq API error (Feedback): %s", exc)
        return AssignmentFeedbackResponse(
            feedback="Error generating AI feedback. Please try again or use manual feedback."
        )


# ── Serve static files (widget JS, example HTML) ────────────────
# Mount AFTER routes so /api/... takes priority.
_this_dir = os.path.dirname(os.path.abspath(__file__))
app.mount("/static", StaticFiles(directory=_this_dir), name="static")