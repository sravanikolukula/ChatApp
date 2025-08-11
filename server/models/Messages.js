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
    type: { type: String, default: "text" },
    seen: { type: Boolean, default: false },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "group" },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
    membersAtSendTime: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
      },
    ],
  },
  { timestamps: true }
);

// export const Messages =
//   mongoose.models.messages || mongoose.model("messages", messagesSchema);
export const Messages =
  (mongoose.models && mongoose.models.messages) ||
  mongoose.model("messages", messagesSchema);
