from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Lesson(BaseModel):
    title: str
    content_summary: str
    learning_objectives: List[str]

class Module(BaseModel):
    module_title: str
    lessons: List[Lesson]

class CourseCreate(BaseModel):
    course_title: str
    course_summary: str
    modules: List[Module]

class Course(CourseCreate):
    id: str = Field(alias="_id")
    material_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    level: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Question(BaseModel):
    type: str  # "MCQ" or "short_answer"
    question: str
    options: Optional[List[str]] = None
    correct_answer: Optional[str] = None
    expected_answer_points: Optional[List[str]] = None
    linked_module: str

class AssessmentCreate(BaseModel):
    assessment_title: str
    questions: List[Question]

class Assessment(AssessmentCreate):
    id: str = Field(alias="_id")
    course_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Material(BaseModel):
    id: str = Field(alias="_id")
    filename: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
