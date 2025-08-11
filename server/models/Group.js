import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        joinedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "user" }],
    bio: { type: String },
    profilePic: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Group =
  mongoose.models.group || mongoose.model("group", groupSchema);
