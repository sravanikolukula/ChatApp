import { Group } from "../models/Group.js";
import { groupSeenStatus } from "../models/groupSeenStatusSchema.js";
import { Messages } from "../models/Messages.js";
import { v2 as cloudinary } from "cloudinary";
import { userSocketMap } from "../server.js";
import { io } from "../server.js";
import { User } from "../models/User.js";

export const createGroup = async (req, res) => {
  const { name, groupMembers } = req.body;
  const createdBy = req.user.id;
  if (!name || !groupMembers || groupMembers.length < 1) {
    return res.json({ success: false, message: "Invalid data" });
  }

  try {
    const newGroup = await Group.create({
      name,
      members: [...groupMembers, createdBy], // ...groupMembers spreads the existing members into a new array
      createdBy,
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
    const groups = await Group.find({ members: userId }).populate(
      "members",
      "fullName profilePic"
    );

    const unseenMessages = {};

    //For each group:calculating unseen msges
    const promises = groups.map(async (group) => {
      //find the last seen for this user in this group
      const seen = await groupSeenStatus.findOne({
        groupId: group._id,
        userId,
      });

      const lastSeenAt = seen?.lastSeenAt || new Date(0); // if not found, assume never seen

      //count how many messages are created after last seen time
      const count = await Messages.countDocuments({
        groupId: group._id,
        createdAt: { $gt: lastSeenAt },
        sender_id: { $ne: userId }, //exclused users own message.
      });

      //store unseen message count
      unseenMessages[group._id] = count;
    });

    await Promise.all(promises);

    res.json({ success: true, groups, unseenMessages });
  } catch (error) {
    console.log(error);
    res.json({ success });
  }
};

//unread messages
export const getGroupUnreadCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await Group.find({ members: userId });

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
      await Group.findByIdAndUpdate(groupId, { bio, name }, { new: true });
    } else {
      //if an image,upload to cloudinary
      const upload = await cloudinary.uploader.upload(profilePic);
      await Group.findByIdAndUpdate(
        groupId,
        {
          profilePic: upload.secure_url,
          bio,
          name,
        },
        { new: true }
      );
    }
    res.json({
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

    /*     if (!group.admins.includes(currentUserId)) {
      return res.json({
        success: false,
        message: "Only Admins can add members",
      });
    }
 */
    if (group.members.includes(userId)) {
      return res.json({
        success: false,

        message: "User is already a member of the group",
      });
    }

    //Add user
    group.members.push(userId);
    await group.save();

    const newMember = await User.findById(userId).select("-password");

    const socketId = userSocketMap[userId];
    if (socketId) {
      io.to(socketId).emit("joinGroup", groupId);
    }

    io.to(groupId).emit("member-added", { groupId, newUserId: userId });

    return res.json({
      success: true,
      newMember,
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
    if (!group.members.includes(userId)) {
      return res.json({
        success: false,
        message: "You're not a member of this group",
      });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    /*    group.admins = group.admins.filter(
      (adminId) => adminId.toString() !== userId.toString()
    ); */

    await group.save();

    io.to(groupId).emit("member-exited", { groupId, userId });

    return res.json({ success: true, message: "You have exited the group." });
  } catch (error) {
    console.log(error);
    return res.json({ success: false, message: error.message });
  }
};
