import os
from bson import ObjectId
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uuid

# Load dotenv before importing services that use env vars
from dotenv import load_dotenv
load_dotenv()

from models import Material, Course, Assessment
from db import materials_collection, courses_collection, assessments_collection
from parsers import extract_text_from_file
from services.course_generator import generate_course_from_text
from services.assessment_generator import generate_assessment_from_course, auto_grade_short_answers
from pydantic import BaseModel
from typing import List, Dict, Any

class AutoGradeRequest(BaseModel):
    answers: List[Dict[str, Any]]


app = FastAPI(title="Course Generator Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/materials/upload")
async def upload_material(file: UploadFile = File(...)):
    # 1. Read and parse file
    try:
        file_bytes = await file.read()
        text_content = extract_text_from_file(file.filename, file_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {str(e)}")
        
    # 2. Generate Course
    try:
        course_data = generate_course_from_text(text_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Course generation failed: {str(e)}")
        
    # 3. Generate Assessment
    try:
        assessment_data = generate_assessment_from_course(course_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assessment generation failed: {str(e)}")
        
    # 4. Save to DB
    from bson.objectid import ObjectId
    material_id_obj = ObjectId()
    course_id_obj = ObjectId()
    assessment_id_obj = ObjectId()
    
    material_id = str(material_id_obj)
    course_id = str(course_id_obj)
    assessment_id = str(assessment_id_obj)
    
    material = Material(_id=material_id, filename=file.filename)
    
    # We will use the string version for any Pydantic models (if used), 
    # but when inserting into PyMongo, we MUST use the ObjectId object directly 
    # so Mongoose (Node.js) can read them correctly later.
    
    # material isn't saved directly in the provided snippet but assuming it is somewhere,
    # or maybe it's just course_data and assessment_data.
    
    course_data["_id"] = course_id_obj
    course_data["material_id"] = material_id_obj
    course_data["title"] = course_data.get("course_title", "Untitled AI Course")
    course_data["description"] = course_data.get("course_summary", "")
    course_data["category"] = "Foundations of ECE"
    course_data["level"] = "Beginner"
    
    # Map modules to Node schema
    mapped_modules = []
    for i, mod in enumerate(course_data.get("modules", [])):
        mapped_contents = []
        for j, lesson in enumerate(mod.get("lessons", [])):
            mapped_contents.append({
                "_id": str(ObjectId()),
                "title": lesson.get("title", ""),
                "description": lesson.get("content_summary", ""),
                "type": "document",
                "notes": f"{lesson.get('content_summary', '')}\n\nLearning Objectives:\n• " + "\n• ".join(lesson.get("learning_objectives", [])),
                "order": j + 1
            })
            
        mapped_modules.append({
            "_id": str(ObjectId()),
            "title": mod.get("module_title", ""),
            "order": i + 1,
            "contents": mapped_contents
        })
    course_data["modules"] = mapped_modules
    
    assessment_data["_id"] = str(assessment_id_obj)
    assessment_data["course_id"] = str(course_id_obj)
    assessment = Assessment(**assessment_data)
    
    mat_dict = material.model_dump(by_alias=True)
    mat_dict["_id"] = material_id_obj
    
    # ensure course module ids are ObjectIds
    for mod in course_data.get("modules", []):
        mod["_id"] = ObjectId(mod["_id"])
        for content in mod.get("contents", []):
            content["_id"] = ObjectId(content["_id"])
            
    ass_dict = assessment.model_dump(by_alias=True)
    ass_dict["_id"] = assessment_id_obj
    ass_dict["course_id"] = course_id_obj
    
    await materials_collection.insert_one(mat_dict)
    await courses_collection.insert_one(course_data)
    await assessments_collection.insert_one(ass_dict)
    
    # Convert ObjectIds back to strings for JSON serialization in the return response
    def stringify_objectids(obj):
        if isinstance(obj, dict):
            return {k: stringify_objectids(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [stringify_objectids(item) for item in obj]
        elif isinstance(obj, ObjectId):
            return str(obj)
        return obj

    return {
        "material_id": str(material_id),
        "course_id": str(course_id),
        "assessment_id": str(assessment_id),
        "course": stringify_objectids(course_data),
        "assessment": stringify_objectids(ass_dict)
    }

@app.get("/api/v1/courses")
async def get_courses():
    cursor = courses_collection.find({})
    courses = await cursor.to_list(length=100)
    
    def stringify_objectids(obj):
        from bson.objectid import ObjectId
        if isinstance(obj, dict):
            return {k: stringify_objectids(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [stringify_objectids(item) for item in obj]
        elif isinstance(obj, ObjectId):
            return str(obj)
        return obj

    return {"courses": stringify_objectids(courses)}

@app.get("/api/v1/courses/{course_id}")
async def get_course(course_id: str):
    # Try looking up by ObjectId or string
    try:
        from bson.objectid import ObjectId
        query = {"_id": ObjectId(course_id)}
    except Exception:
        query = {"_id": course_id}
        
    course = await courses_collection.find_one(query)
    # Also check string if ObjectId failed
    if not course:
        course = await courses_collection.find_one({"_id": course_id})
        
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    def stringify_objectids(obj):
        from bson.objectid import ObjectId
        if isinstance(obj, dict):
            return {k: stringify_objectids(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [stringify_objectids(item) for item in obj]
        elif isinstance(obj, ObjectId):
            return str(obj)
        return obj

    return stringify_objectids(course)

@app.get("/api/v1/courses/{course_id}/assessment")
async def get_assessment(course_id: str):
    assessment = await assessments_collection.find_one({"course_id": course_id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    assessment["_id"] = str(assessment["_id"])
    return assessment

@app.post("/api/v1/courses/{course_id}/generate_assessment")
async def generate_assessment(course_id: str, course_data: dict):
    # Check if already exists
    existing = await assessments_collection.find_one({"course_id": course_id})
    if existing:
        existing["_id"] = str(existing["_id"])
        return existing
        
    assessment_data = generate_assessment_from_course(course_data)
    assessment_id = ObjectId()
    
    assessment_data["_id"] = str(assessment_id)
    assessment_data["course_id"] = course_id
    assessment = Assessment(**assessment_data)
    
    ass_dict = assessment.model_dump(by_alias=True)
    ass_dict["_id"] = assessment_id
    ass_dict["course_id"] = course_id
    
    await assessments_collection.insert_one(ass_dict)
    ass_dict["_id"] = str(ass_dict["_id"])
    return ass_dict

@app.post("/api/v1/assessments/auto-grade")
async def auto_grade_assessment(req: AutoGradeRequest):
    # Split MCQs and short answers
    results = []
    short_answers = []
    
    for ans in req.answers:
        q_type = ans.get("type")
        if q_type == "MCQ":
            is_correct = ans.get("user_answer") == ans.get("correct_answer")
            results.append({
                "question": ans.get("question"),
                "is_correct": is_correct,
                "score": 1 if is_correct else 0,
                "max_score": 1,
                "feedback": "Correct!" if is_correct else f"Incorrect. The correct answer was {ans.get('correct_answer')}."
            })
        elif q_type == "short_answer":
            short_answers.append(ans)
            
    # Grade short answers with AI
    if short_answers:
        try:
            ai_graded = auto_grade_short_answers(short_answers)
            results.extend(ai_graded)
        except Exception as e:
            # Fallback if AI grading fails
            for sa in short_answers:
                results.append({
                    "question": sa.get("question"),
                    "is_correct": False,
                    "score": 0,
                    "max_score": 5,
                    "feedback": f"Could not auto-grade: {str(e)}"
                })
                
    # Calculate overall score
    total_score = sum(r["score"] for r in results)
    max_score = sum(r["max_score"] for r in results)
    percentage = int((total_score / max_score) * 100) if max_score > 0 else 0
    grade = "A+" if percentage >= 90 else "A" if percentage >= 80 else "B+" if percentage >= 70 else "B" if percentage >= 60 else "C" if percentage >= 50 else "F"
    
    return {
        "graded": True,
        "score": total_score,
        "max_score": max_score,
        "percentage": percentage,
        "grade": grade,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8002, reload=True)
