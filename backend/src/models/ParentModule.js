// Changed by: Snehal
// Date: 20-07-2026
// Description: New model for Parent Capacity Building — stores module + session curriculum data

import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  keyFocus: String,
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionNumber: Number,
  title: String,
  objective: String,
  activities: [activitySchema],
  homePractice: String,
}, { _id: false });

const parentModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  title: { type: String, required: true },
  category: String,
  ageGroup: String,
  duration: String,
  year: { type: Number, default: 1 },
  objective: String,
  outcomes: [String],
  sessions: [sessionSchema],
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const ParentModule = mongoose.model("ParentModule", parentModuleSchema);