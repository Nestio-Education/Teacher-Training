# Course Generator Service

A Python microservice to parse curriculum materials, generate course structures, and create assessments using Groq LLM.

## Setup
1. `python -m venv venv`
2. `source venv/bin/activate`
3. `pip install -r requirements.txt`
4. Copy `.env.example` to `.env` and fill in values.
5. `uvicorn main:app --reload --port 8001`
