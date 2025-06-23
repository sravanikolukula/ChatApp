import { Messages } from "../models/Messages.js";
import { User } from "../models/User.js";
import { io, userSocketMap } from "../server.js";
import mongoose from "mongoose";
import cloudinary from "../libs/cloudinary.js";
import { Groups } from "../models/Group.js";

//Get all uesrs except the logged in user
export const getUserForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Messages.find({
        sender_id: user._id, // convert both to string
        receiver_id: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id] = messages.length;
      }
    });

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
    const selectedUserId = new mongoose.Types.ObjectId(req.params.id);
    const myId = req.user._id;

    const messages = await Messages.find({
      $or: [
        { sender_id: myId, receiver_id: selectedUserId },
        { sender_id: selectedUserId, receiver_id: myId },
      ],
    });
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

    let imageUrl;
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    }

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

    let imageUrl;
    if (image) {
      const uploadedImage = await cloudinary.uploader.upload(image);
      imageUrl = uploadedImage.secure_url;
    }

    try {
      const newMessage = await Messages.create({
        sender_id,
        text,
        image: imageUrl,
        groupId,
      });

      await newMessage.populate("sender_id", "profilePic fullName");

      const senderSocketId = userSocketMap[sender_id];
      if (senderSocketId) {
        io.to(groupId)
          .except(senderSocketId)
          .emit("newGroupMessage", newMessage);
      } else {
        io.to(groupId).emit("newGroupMessage", newMessage);
      }

      /*  console.log(`Emitting message to group ${groupId}:`, newMessage);
      io.to(groupId).emit("newGroupMessage", newMessage);
 */
      //get members of group (Except sender)
      /* const group = await Groups.findById(groupId);
      const otherMembers = group.members.filter(
        (id) => id.toString() !== sender_id
      ); */

      // emit message to each members socket
      /*    otherMembers.forEach((memberId) => {
        const socketId = userSocketMap[memberId];
        if (socketId) {
          io.to(socketId).emit("newGroupMessage", newMessage);
        }
      });

      io.to(groupId).emit("newGroupMessage", newMessage); */

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
  const { groupId } = req.params;
  try {
    const messages = await Messages.find({ groupId })
      .sort({ createdAt: 1 })
      .populate("sender_id", "profilePic fullName");

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
