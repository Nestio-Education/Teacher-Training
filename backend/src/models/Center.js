import mongoose from "mongoose";

const centerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: String,
    pincode: String,
    contactPerson: String,
    phone: String,
    email: String,
    status: { type: String, enum: ["active", "inactive"], default: "active", index: true },
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // New fields:
    type: { type: String, enum: ["preschool", "school"], default: "preschool", required: true, index: true },
    gradeBands: {
      type: [{ type: String, enum: ["1-3", "4-7", "1-9"] }],
      default: [],
      // Only meaningful when type === "school". Not enforced at schema level
      // (Mongoose can't easily cross-validate sibling fields cleanly here) —
      // enforced in the /assign route and the admin center-save handler instead.
    },
  },
  { timestamps: true }
);

export const Center = mongoose.model("Center", centerSchema);
