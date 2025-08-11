import { Messages } from "../models/Messages.js";
import { User } from "../models/User.js";
import { io, userSocketMap } from "../server.js";
import mongoose from "mongoose";
import cloudinary from "../libs/cloudinary.js";
import { groupSeenStatus } from "../models/groupSeenStatusSchema.js";
import { Group } from "../models/Group.js";

//Get all uesrs except the logged in user
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    //get all users whose id not equal to userId
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    const unseenMessages = {};
    //for each filteredUser check how many messages are unseen
    const promises = filteredUsers.map(async (user) => {
      //fetch all the messages sent by this user to current user
      const messages = await Messages.find({
        sender_id: user._id, // convert both to string
        receiver_id: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

    // Wait until all asynchronous DB operations complete
    await Promise.all(promises);

    res.json({ success: true, filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    //convert the selected user id to mongoDB objectId
    const selectedUserId = new mongoose.Types.ObjectId(req.params.id);
    const myId = req.user._id;

    //fetch all messages betweeb the two users
    const messages = await Messages.find({
      $or: [
        { sender_id: myId, receiver_id: selectedUserId },
        { sender_id: selectedUserId, receiver_id: myId },
      ],
    });

    //Mark all msgs sent by the selected user to this current user as read or seen
    await Messages.updateMany(
      { sender_id: selectedUserId, receiver_id: myId },
      { $set: { seen: true } }
    );

    return res.json({ success: true, message: messages });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

//api to mark messages as seen using message id

export const markMessageAsSeen = async (req, res) => {
  try {
    const msgId = req.params.id;
    await Messages.findByIdAndUpdate(msgId, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res, json({ success: false, message: error.message });
  }
};

//send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiver_id = req.params.id;
    const sender_id = req.user._id;

    if (!text && !image) {
      return res.json({ success: false, message: "Empty messsage" });
    }

    let imageUrl;
    //if image upload it to cloudinary
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    }

    //store the msg in db
    const newMessage = await Messages.create({
      sender_id,
      receiver_id,
      text,
      image: imageUrl,
    });

    //emit new message to receiver's socket
    const receiverSocketId = userSocketMap[receiver_id];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//sendGroup messages /api/messages/group/send:groupId
export const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { text, image } = req.body;
    const sender_id = req.user._id;

    if (!text && !image) {
      return res.json({ success: false, message: "Empty messsage" });
    }

    const group = await Group.findById(groupId).populate("members.user");

    const membersAtSendTime = group.members
      .filter((m) => new Date(m.joinedAt) <= new Date())
      .map((m) => m.user._id);

    let imageUrl;
    //if an image, upload to  cloudinary
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    }

    //store msg in database
    try {
      const newMessage = await Messages.create({
        sender_id,
        text,
        image: imageUrl,
        groupId,
        membersAtSendTime,
      });

      await newMessage.populate("sender_id", "profilePic fullName");
      await newMessage.populate("membersAtSendTime", "fullName profilePic");

      //Get sender's socket id
      const senderSocketId = userSocketMap[sender_id];
      if (senderSocketId) {
        //Emit the new message to all members except sender
        io.to(groupId)
          .except(senderSocketId)
          .emit("newGroupMessage", newMessage);
      } else {
        io.to(groupId).emit("newGroupMessage", newMessage);
      }

      res.json({ success: true, newMessage });
    } catch (error) {
      console.log(error);
      return res.json({ success: false, message: error.message });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getGroupMessages = async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const { groupId } = req.params;

  try {
    // const user = await User.findById(userId);
    const group = await Group.findById(groupId);
    const memberData = group.members?.find(
      (m) => m.user.toString() === userId.toString()
    );

    if (!memberData) throw new Error("User not in group");

    const messages = await Messages.find({
      groupId,
      createdAt: { $gt: memberData.joinedAt },
    })
      .sort({ createdAt: 1 })
      .populate("sender_id", "profilePic fullName")
      .populate("membersAtSendTime", "fullName profilePic");

    const seenStatus = await groupSeenStatus.findOne({ groupId, userId });

    //set seenStaus to group as now
    await groupSeenStatus.findOneAndUpdate(
      { userId, groupId },
      { $set: { lastSeenAt: new Date() } },
      { upsert: true }
    );

    //unseenMessages.Filter unseen messages not sent by this user
    const messageIdsToUpdate = messages
      .filter(
        (msg) =>
          msg.sender_id._id?.toString() !== userId.toString() &&
          !msg.seenBy?.includes(userId)
      )
      .map((msg) => msg._id);

    // Update seenBy
    if (messageIdsToUpdate.length > 0) {
      await Messages.updateMany(
        { _id: { $in: messageIdsToUpdate } },
        { $addToSet: { seenBy: userId } }
      );
    }

    //. Group message IDs by sender to reduce socket traffic
    const senderToMessages = {};

    messageIdsToUpdate.forEach((msgId) => {
      const msg = messages.find((m) => m._id.equals(msgId));
      if (!msg || !msg.sender_id._id) return;
      const senderId = msg.sender_id._id?.toString();

      if (!senderToMessages[senderId]) {
        senderToMessages[senderId] = [];
      }
      senderToMessages[senderId].push(msg._id);
    });

    // Emit batched socket events per sender
    Object.entries(senderToMessages).forEach(([senderId, msgIds]) => {
      const senderSocketId = userSocketMap[senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit(
          "update-msg-seenBy",
          msgIds,
          userId,
          groupId
        );
      }
    });

    res.json({ success: true, messages: messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
