import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./libs/db.js";
import { Server } from "socket.io";
import { userRouter } from "./routes/userRoutes.js";
import { messageRouter } from "./routes/messageRoutes.js";
import { groupRouter } from "./routes/groupRoutes.js";
import { Group } from "./models/Group.js";
import { userInfo } from "os";
import { User } from "./models/User.js";
import { Messages } from "./models/Messages.js";
import { getGroupMessages } from "./controllers/messageController.js";

//create express app  and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

//Store online users
export const userSocketMap = {}; //{userId,socketId}

//socket io connectino Handler
io.on("connection", async (socket) => {
  const userId = socket.handshake.query.userId;

  if (userId) {
    //add user
    userSocketMap[userId] = socket.id;

    const user = await User.findById(userId).select("-password");

    if (user) {
      io.emit("user-joined", { user });
    }

    io.emit("update-user-list", Object.keys(userInfo));

    //Emit to all clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  }

  //Join all groups the user belongs to.
  try {
    const groups = await Group.find({ "members.user": userId }).select("_id");

    groups.forEach((group) => {
      socket.join(group._id.toString());
    });
  } catch (error) {
    console.error("Error joining grp");
  }

  //Emit online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing", ({ toUserId }) => {
    const toSocketId = userSocketMap[toUserId];

    if (toSocketId) {
      io.to(toSocketId).emit("typing", { fromUserId: userId });
    }
  });

  socket.on("stopTyping", ({ toUserId }) => {
    const toSocketId = userSocketMap[toUserId];
    if (toSocketId) {
      io.to(toSocketId).emit("stopTyping", { fromUserId: userId });
    }
  });

  //Group typing
  socket.on("group-typing", ({ groupId, fromUserId, fullName }) => {
    socket.to(groupId).emit("group-typing", {
      fromUserId,
      fullName,
      groupId,
    });
  });

  socket.on("group-stopTyping", ({ groupId, fromUserId }) => {
    socket.to(groupId).emit("group-stopTyping", {
      fromUserId,
      groupId,
    });
  });

  //if user joins a new grp after connection
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
  });

  socket.on("message-seen", ({ messageIds, senderId, receiverId }) => {
    const senderSocketId = userSocketMap[senderId];
    if (senderSocketId) {
      io.to(senderSocketId).emit("message-seen-update", {
        messageIds,
        receiverId,
      });
    }
  });
  socket.on(
    "mark-groupMessage-seen",
    async ({ messageId, userId, senderId }) => {
      try {
        await Messages.updateOne(
          { _id: messageId },
          { $addToSet: { seenBy: userId } }
        );

        //emit to sender
        const senderSocketId = userSocketMap[senderId];
        if (senderSocketId) {
          io.to(senderSocketId).emit("group-Msgseen-update", {
            messageId,
            seenBy: userId,
          });
        }
      } catch (error) {
        console.error("Error marking group message as seen:", error);
      }
    }
  );

  socket.on("group-message-seen", async ({ messageIds, groupId, userId }) => {
    try {
      const updatedMessages = [];

      for (const messageId of messageIds) {
        const message = await Messages.findById(messageId);

        if (message && !message.seenBy.includes(userId)) {
          message.seenBy.push(userId);
          await message.save();
          updatedMessages.push({
            _id: message._id,
            seenBy: message.seenBy, // Only send what frontend needs
          });
        }
      }

      // Emit updated messages to the group
      io.to(groupId).emit("group-seen-update", {
        groupId,
        userId,
        messages: updatedMessages,
      });
    } catch (error) {
      console.error("Group seen update error:", error.message);
    }
  });

  socket.on("disconnect", () => {
    delete userSocketMap[userId];
    io.emit("update-user-list", Object.keys(userSocketMap));
    io.emit("getOnlineUsers", Object.keys(userSocketMap)); //emit updated online users list
  });
});

//Middleware setup

app.use(express.json({ limit: "10mb" })); //Parses incoming requests with JSON payloads
app.use(express.urlencoded({ extended: true, limit: "10mb" })); // Parses incoming requests with URL-encoded payloads (like HTML form data)
// extended: true → allows nested objects in form data

app.use(cors()); //allows backend to accept req from different origins

app.use("/api/server", (req, res) => {
  res.send("Server is live");
});
app.use("/api/auth", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/group", groupRouter);
//connect to MongoDB
await connectDB();

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log("server listening on port : " + PORT);
  });
}

//Export Server for vercel
export default server;
