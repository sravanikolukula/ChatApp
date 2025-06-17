import { Messages } from "../models/Messages.js";
import { User } from "../models/User.js";
import { io, userSocketMap } from "../server.js";
import mongoose from "mongoose";
import cloudinary from "../libs/cloudinary.js";

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
