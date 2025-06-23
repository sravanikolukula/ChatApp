import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema(
  {
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    text: { type: String },
    image: { type: String },
    seen: { type: Boolean, default: false },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "group" },
  },
  { timestamps: true }
);

export const Messages =
  mongoose.models.messages || mongoose.model("messages", messagesSchema);
