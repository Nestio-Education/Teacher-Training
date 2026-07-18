import os
import json
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

def generate_assessment_from_course(course_data: dict) -> dict:
    course_json_str = json.dumps(course_data)
    
    system_prompt = """You are an expert assessment designer. Given the following structured course JSON, generate an assessment.
You MUST generate questions ONLY from each lesson's content_summary / learning_objectives.
Generate roughly 1 MCQ and 1 short_answer question per lesson.
MCQs need exactly 4 options with correct_answer matching one option exactly.
short_answer questions need 2-4 expected_answer_points.
Tag every question with its linked_module title.

Return ONLY valid JSON with this exact schema (no markdown fences, no preamble, no extra keys):
{
  "assessment_title": "String",
  "questions": [
    {
      "type": "MCQ",
      "question": "String",
      "options": ["String", "String", "String", "String"],
      "correct_answer": "String",
      "linked_module": "String"
    },
    {
      "type": "short_answer",
      "question": "String",
      "expected_answer_points": ["String", "String"],
      "linked_module": "String"
    }
  ]
}
"""
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": course_json_str}
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
        raise ValueError(f"Failed to parse assessment JSON from model response: {e}\nResponse: {content}")

def auto_grade_short_answers(short_answers: list) -> list:
    if not short_answers:
        return []
        
    system_prompt = """You are an expert evaluator grading short answers.
You will be provided a JSON array of answer objects. Each object contains:
- question
- expected_answer_points
- user_answer

For each answer, evaluate if the user_answer covers the expected points.
Assign a score from 0 to 5 for each. 0 means completely wrong/empty, 5 means covers all key points.
Return a valid JSON array of objects with this exact schema (no markdown, no extra keys):
[
  {
    "question": "String",
    "is_correct": Boolean (True if score >= 3),
    "score": Integer,
    "max_score": 5,
    "feedback": "String (Constructive feedback explaining what was missed or praising good points)"
  }
]
"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(short_answers)}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        graded = json.loads(content.strip())
        return graded
    except Exception as e:
        print(f"Error in AI grading: {e}")
        # Fallback
        results = []
        for sa in short_answers:
            results.append({
                "question": sa.get("question"),
                "is_correct": False,
                "score": 0,
                "max_score": 5,
                "feedback": "AI grading failed to process this answer."
            })
        return results
