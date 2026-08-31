import mongoose from "mongoose";

const questionItemSchema = new mongoose.Schema({
  id: { type: String },
  question: { type: String, required: true },
  options: [{ type: String }],
  answer: { type: Number, default: 0 },
  difficulty: { type: String, default: "Medium" },
  category: { type: String, default: "General" }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  course: { type: String, required: true },
  questions: { type: Number, default: 10 },
  passMark: { type: Number, default: 60 },
  dueDate: { type: String },
  status: { type: String, enum: ["draft", "published"], default: "draft" },
  attempts: { type: Number, default: 0 },
  avgScore: { type: Number, default: 0 },
  questionsList: [questionItemSchema]
}, { timestamps: true });

export const Quiz = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
