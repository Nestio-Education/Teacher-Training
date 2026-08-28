import mongoose from "mongoose";

const activitySchema = new mongoose.Schema({
  activityName: { type: String, trim: true },
  milestoneSource: { type: String, trim: true },
  domain: [{ type: String, trim: true }],
  engagementLevel: { type: String, trim: true },
  attempted: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  supportNeeded: { type: Boolean, default: false },
  milestoneStatus: { type: Number, min: 0, max: 5 } // 0/1-5 score
});

const visitObservationSchema = new mongoose.Schema(
  {
    visitDate: { type: Date, required: true, index: true },
    facilitatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    facilitatorNameRaw: { type: String, trim: true }, // Raw text from Form for auditing / matching fallbacks
    village: { type: String, trim: true },
    childId: { type: mongoose.Schema.Types.ObjectId, ref: "Child", index: true },
    childName: { type: String, required: true, trim: true },
    ageGroup: { type: String, trim: true },
    program: { type: String, trim: true }, // e.g. PTP, School Readiness, FLN, Library
    
    // Visit Status
    childPresent: { type: Boolean, default: true },
    caregiverAvailable: { type: Boolean, default: true },
    childWillingness: { type: Boolean, default: true },
    
    // Home Environment
    spaceAdequate: { type: Boolean },
    materialsAvailable: [{ type: String, trim: true }],
    householdItemsUsable: { type: Boolean },
    
    // Activities
    activities: [activitySchema],
    
    // Parent Engagement
    caregiverObserved: { type: Boolean },
    caregiverParticipated: { type: Boolean },
    canRepeatAtHome: { type: Boolean },
    helpFactors: [{ type: String, trim: true }],
    challenges: [{ type: String, trim: true }],
    isFollowUp: { type: Boolean },
    didLastWeekActivity: { type: Boolean },
    lastWeekCompletionCount: { type: Number },
    lastWeekDifficulties: { type: String, trim: true },
    homeActivitiesAssigned: { type: Boolean },
    
    // Follow-up
    recommendedAction: { type: String, trim: true },
    
    // Closing
    childParticipationRating: { type: Number, min: 1, max: 5 },
    parentCooperationRating: { type: Number, min: 1, max: 5 },
    homeEnvironmentRating: { type: Number, min: 1, max: 5 },
    remarks: { type: String, trim: true },
    photos: [{ type: String, trim: true }],

    // AI Report Reference (Section 7 stub)
    aiReportId: { type: mongoose.Schema.Types.ObjectId, ref: "PDCAReport" }
  },
  { timestamps: true }
);

export const VisitObservation = mongoose.model("VisitObservation", visitObservationSchema);
