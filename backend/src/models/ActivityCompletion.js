import mongoose from "mongoose";

const activityCompletionSchema = new mongoose.Schema(
  {
    child: { type: mongoose.Schema.Types.ObjectId, ref: "Child", required: true, index: true },
    stage: { type: String, required: true },
    itemId: { type: String, required: true }, // e.g. "1.1"
    activityIndex: { type: Number, required: true }, // e.g. 0
    completed: { type: Boolean, default: true },
    completedAt: { type: Date },
    observationNotes: { type: String },
  },
  { timestamps: true }
);

activityCompletionSchema.index({ child: 1, stage: 1, itemId: 1, activityIndex: 1 }, { unique: true });

export default mongoose.models.ActivityCompletion || mongoose.model("ActivityCompletion", activityCompletionSchema);
