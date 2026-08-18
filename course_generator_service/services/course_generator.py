import os
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def generate_course_from_text(text: str) -> dict:
    # Limit to ~25,000 characters (~6,000 tokens) to easily fit in the 12,000 TPM limit
    text = text[:25000]
    
    system_prompt = """You are an expert curriculum designer. Given the following source material, create a structured course.
You MUST base the course ONLY on the provided material. Do not invent facts.
Return ONLY valid JSON with this exact schema (no markdown fences, no preamble, no extra keys):
{
  "course_title": "String",
  "course_summary": "String",
  "modules": [
    {
      "module_title": "String",
      "lessons": [
        {
          "title": "String",
          "content_summary": "String",
          "learning_objectives": ["String", "String"]
        }
      ]
    }
  ]
}
"""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": text}
        ],
        temperature=0.3
    )
    
    content = response.choices[0].message.content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
        
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Failed to parse course JSON from model response: {e}\nResponse: {content}")
