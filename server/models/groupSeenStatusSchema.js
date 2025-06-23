import mongoose from "mongoose";

const groupSeenStatusSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "group",
      required: true,
    },

    lastSeenAt: { type: Date, default: new Date(0) },
  },
  { timestamps: true }
);

export const groupSeenStatus =
  mongoose.models.groupSeenStatus ||
  mongoose.model("groupseenstatus", groupSeenStatusSchema);
