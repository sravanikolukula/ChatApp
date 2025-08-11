import { Group } from "../models/Group.js";
import { groupSeenStatus } from "../models/groupSeenStatusSchema.js";
import { Messages } from "../models/Messages.js";
import { v2 as cloudinary } from "cloudinary";
import { userSocketMap } from "../server.js";
import { io } from "../server.js";
import { User } from "../models/User.js";
import { text } from "express";

export const createGroup = async (req, res) => {
  const { name, groupMembers } = req.body;
  const createdBy = req.user.id;
  if (!name || !groupMembers || groupMembers.length < 1) {
    return res.json({ success: false, message: "Invalid data" });
  }

  try {
    const now = new Date();

    const membersWithJoinDate = groupMembers.map((id) => ({
      user: id,
      joinedAt: now,
    }));

    // add creator too
    membersWithJoinDate.push({
      user: createdBy,
      joinedAt: now,
    });

    const newGroup = await Group.create({
      name,
      members: membersWithJoinDate, // ...groupMembers spreads the existing members into a new array
      createdBy,
      admins: req.user.id,
    });

    groupMembers.map((userId) => {
      const socketId = userSocketMap[userId];
      if (socketId) {
        io.to(socketId).emit("group-created", newGroup);
      }
    });

    return res.json({
      success: true,
      newGroup,
      message: "Group created successfully",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

export const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    //find all the groups where current user is a member
    const groups = await Group.find({ "members.user": userId }).populate(
      "members.user",
      "fullName profilePic"
    );
    const unseenMessages = {};

    //For each group:calculating unseen msges
    const promises = groups.map(async (group) => {
      const memberData = group.members.find(
        (m) => m.user._id.toString() === userId.toString()
      );
      const joinedAt = memberData?.joinedAt || new Date(0);

      //find the last seen for this user in this group
      const seen = await groupSeenStatus.findOne({
        groupId: group._id,
        userId,
      });

      const lastSeenAt = seen?.lastSeenAt || new Date(0); // if not found, assume never seen

      const cutoffTime = lastSeenAt > joinedAt ? lastSeenAt : joinedAt;

      //count how many messages are created after last seen time
      const count = await Messages.countDocuments({
        groupId: group._id,
        createdAt: { $gt: cutoffTime },
        sender_id: { $ne: userId }, //exclused users own message.
      });

      //store unseen message count
      unseenMessages[group._id] = count;
    });

    await Promise.all(promises);

    res.json({ success: true, groups, unseenMessages });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//unread messages
export const getGroupUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ "members.user": userId });

    const unseenMessages = {};
    await Promise.all(
      groups.map(async (group) => {
        const seen = await groupSeenStatus.findOne({
          groupId: group._id,
          userId,
        });
        const count = await Messages.countDocuments({
          groupId: group._id,
          createdAt: { $gt: seen?.lastSeenAt || new Date(0) },
          sender_id: { $ne: userId }, //exclude users own image
        });
        unseenMessages[group._id] = count;
      })
    );
    res.json({ success: true, unseenMessages });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

//mark all messages in a group as read

export const markGroupAsSeen = async (req, res) => {
  try {
    const userId = req.user._id;
    const groupId = req.params.groupId;

    //updates the users lastseen time for this group
    await groupSeenStatus.findOneAndUpdate(
      { userId, groupId },
      { lastSeenAt: new Date() },
      { upsert: true, new: true }
    );
    //upsert:true-> if matching document occurs updates it otherwise insert new document with this data
    res.json({ success: true, message: "group marked as seen" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

//update Group details
export const updateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, bio, profilePic } = req.body;

    let updatedGroup;
    if (!profilePic) {
      updateGroup = await Group.findByIdAndUpdate(
        groupId,
        { bio, name },
        { new: true }
      );
    } else {
      //if an image,upload to cloudinary
      const upload = await cloudinary.uploader.upload(profilePic);
      updatedGroup = await Group.findByIdAndUpdate(
        groupId,
        {
          profilePic: upload.secure_url,
          bio,
          name,
        },
        { new: true }
      );
    }
    io.emit("group-profile-update", updatedGroup);
    return res.json({
      success: true,
      group: updatedGroup,
      message: "Profile updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export const addMembersToGroup = async (req, res) => {
  const { userId } = req.body;
  const { groupId } = req.params;
  const currentUserId = req.user._id;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.json({ success: false, message: "Group doesnt exist" });
    }

    // if (!group.admins.includes(currentUserId)) {
    //   return res.json({
    //     success: false,
    //     message: "Only Admins can add members",
    //   });
    // }

    if (
      group.members.some(
        (member) => member.user.toString() === userId.toString()
      )
    ) {
      return res.json({
        success: false,
        message: "User is already a member of the group",
      });
    }

    //Add user
    group.members.push({ user: userId, joinedAt: Date.now() });
    await group.save();

    const newMember = await User.findById(userId).select("-password");

    const joinMessage = new Messages({
      sender_id: userId,
      groupId: groupId,
      text: `${newMember.fullName} joined the group`,
      type: "system",
      membersAtSendTime: group.members.map((m) => m.user),
    });

    await joinMessage.save();

    const socketId = userSocketMap[userId];
    if (socketId) {
      io.to(socketId).emit("joinGroup", groupId);
      io.to(socketId).emit("addedToGroup", group);
    }

    io.to(groupId).emit("member-added", {
      groupId,
      newMember: newMember,
      message: joinMessage,
    });

    return res.json({
      success: true,
      newMember: { user: newMember, joinedAt: Date.now(0) },
      message: "user Added to group successfully",
    });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};

export const exitGroup = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.user._id;
  try {
    const group = await Group.findById(groupId);

    if (!group) {
      return res.json({ success: false, message: "Group not found" });
    }

    //If user is not in the group
    if (
      !group.members.some(
        (member) => member.user.toString() === userId.toString()
      )
    ) {
      return res.json({
        success: false,
        message: "You're not a member of this group",
      });
    }

    group.members = group.members.filter(
      (m) => m.user.toString() !== userId.toString()
    );

    await group.save();

    const user = await User.findById(userId);

    const exitMessage = new Messages({
      sender_id: userId,
      groupId: groupId,
      text: `${user.fullName} left`,
      type: "system",
      membersAtSendTime: group.members.map((m) => m.user),
    });

    await exitMessage.save();

    io.to(groupId).emit("member-exited", { groupId, userId, exitMessage });

    return res.json({ success: true, message: "You have exited the group." });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
