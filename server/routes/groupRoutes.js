import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  addMembersToGroup,
  createGroup,
  exitGroup,
  getGroupUnreadCounts,
  getUserGroups,
  markGroupAsSeen,
  updateGroup,
} from "../controllers/groupController.js";

export const groupRouter = express.Router();

groupRouter.post("/create", protectRoute, createGroup);
groupRouter.get("/my-groups", protectRoute, getUserGroups);
groupRouter.get("/unread-count", protectRoute, getGroupUnreadCounts);
groupRouter.put("/:groupId/mark-seen", protectRoute, markGroupAsSeen);
groupRouter.put("/update/:groupId", protectRoute, updateGroup);
groupRouter.post("/:groupId/add-member", protectRoute, addMembersToGroup);
groupRouter.post("/:groupId/exit", protectRoute, exitGroup);
