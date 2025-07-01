import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    bio: { type: String },
    profilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Group =
  mongoose.models.group || mongoose.model("group", groupSchema);
