import mongoose from "mongoose";

const childSchema = new mongoose.Schema(
  {
    center: { type: mongoose.Schema.Types.ObjectId, ref: "Center", required: false, index: true },
    class: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: false, index: true },
    fullName: { type: String, required: true, trim: true },
    rollNo: String,
    dateOfBirth: Date,
    age: Number,
    ageGroup: { type: String, trim: true }, // e.g. "1-1.5 years", "2.5-3 years", "3-5 years"
    gender: { type: String, enum: ["Male", "Female", "Other", ""], default: "" },
    village: { type: String, trim: true, default: "" },
    program: { type: String, trim: true, default: "HAALS" }, // e.g. "HAALS", "PTP", "ECE"
    email: String,
    guardianName: { type: String, trim: true },
    guardianRelation: { type: String, trim: true, default: "Mother" },
    guardianPhone: { type: String, trim: true },
    address: String,
    enrollmentType: { type: String, enum: ["home_visit", "classroom", "community"], default: "home_visit" },
    assignedFellow: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    notes: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

childSchema.index({ class: 1, rollNo: 1 }, { unique: true, sparse: true });
childSchema.index({ fullName: 1, assignedFellow: 1 });

export const Child = mongoose.model("Child", childSchema);
