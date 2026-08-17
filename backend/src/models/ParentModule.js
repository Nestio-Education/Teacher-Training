import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  time: String,
  activity: String,
  keyFocus: String,
  translations: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });


const contentBlockSchema = new mongoose.Schema({
  heading: { type: String, default: null },
  body: String,
}, { _id: false });


const sessionSchema = new mongoose.Schema({
  sessionNumber: Number,
  title: String,
  objective: String,
  activities: [activitySchema],
  homePractice: String,
 
  content: { type: [contentBlockSchema], default: [] },
  reflection: { type: String, default: "" },

  translations: { type: mongoose.Schema.Types.Mixed },
}, { _id: false });


const parentModuleSchema = new mongoose.Schema({
  moduleNumber: { type: Number, required: true },
  title: { type: String, required: true },
  category: String,
  ageGroup: String,
  duration: String,
  year: { type: Number, default: 1 },
  objective: String,
  
  titleTranslations: { hi: String, mr: String },
  objectiveTranslations: { hi: String, mr: String },
  
  outcomes: [String],
  sessions: [sessionSchema],
  translations: { type: mongoose.Schema.Types.Mixed, default: {} },
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

export const ParentModule = mongoose.model("ParentModule", parentModuleSchema);
