// Changed by: Snehal
// Date: 20-07-2026
// Description: New model for Parent Capacity Building — stores module + session curriculum data

import mongoose from "mongoose";

// Start: Snehal change — added translations field so Mongoose doesn't strip embedded translation data
const activitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  keyFocus: String,
  translations: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  sessionNumber: Number,
  title: String,
  objective: String,
  activities: [activitySchema],
  homePractice: String,
  translations: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });
// End: Snehal change

const parentModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  title: { type: String, required: true },
  category: String,
  ageGroup: String,
  duration: String,
  year: { type: Number, default: 1 },
  objective: String,
  // Start: Snehal change
  titleTranslations: { hi: String, mr: String },
  objectiveTranslations: { hi: String, mr: String },
  // End: Snehal change
  outcomes: [String],
  sessions: [sessionSchema],
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const ParentModule = mongoose.model("ParentModule", parentModuleSchema);