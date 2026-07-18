import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "teacher-training")

client = AsyncIOMotorClient(MONGO_URI)
db = client[MONGO_DB_NAME]

materials_collection = db["materials"]
courses_collection = db["courses"]
assessments_collection = db["assessments"]
