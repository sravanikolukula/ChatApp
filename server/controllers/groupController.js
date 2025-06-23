import { Groups } from "../models/Group.js";
import { groupSeenStatus } from "../models/groupSeenStatusSchema.js";
import { Messages } from "../models/Messages.js";

export const createGroup = async (req, res) => {
  const { name, groupMembers } = req.body;
  const createdBy = req.user.id;
  if (!name || !groupMembers || groupMembers.length < 1) {
    return res.json({ success: false, message: "Invalid data" });
  }

  try {
    const newGroup = await Groups.create({
      name,
      members: [...groupMembers, createdBy],
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
    const groups = await Groups.find({ members: userId }).populate({
      path: "members",
      select: "fullName profilePic",
    });

    const unseenMessages = {};
    const promises = groups.map(async (group) => {
      const seen = await groupSeenStatus.find({
        groupId: group._id,
        userId,
      });
      const count = await Messages.countDocuments({
        groupId: group._id,
        createdAt: { $gt: seen?.lastSeenAt || new Date(0) },
        sender_id: { $ne: userId },
      });
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
    const groups = await Groups.find({ members: userId });

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

    await groupSeenStatus.findOneAndUpdate(
      { userId, groupId },
      { lastSeenAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true, message: "group marked as seen" });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
