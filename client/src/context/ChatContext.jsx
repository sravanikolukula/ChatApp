import { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";
import { setupChatSocketEvents } from "../lib/socketUtils.js";
import { useNavigate } from "react-router-dom";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [unseenGroupMessages, setUnseenGroupMessages] = useState({});
  const [isTypingGrp, setIsTypingGrp] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showAddMem, setShowAddMem] = useState(false);
  const [draftMessages, setDraftMessages] = useState({});

  const { axios, socket, authUser } = useAuthContext();
  const navigate = useNavigate();

  //function to get users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      if (data.success) {
        setUsers(data.filteredUsers);
        setUnseenMessages(data.unseenMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to get messages for a particular user

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/message/${userId}`);
      if (data.success) {
        setMessages(data.message);
      } else {
        toast.error(data.message);
      }

      //Get all the message which are new
      const newSeenMessages = data.message.filter(
        (msg) => msg.sender_id === userId && !msg.seen
      );

      const newSeenMessageIds = newSeenMessages.map((msg) => msg._id);

      if (newSeenMessageIds.length > 0) {
        if (newSeenMessageIds.length > 0) {
          socket.emit("message-seen", {
            messageIds: newSeenMessageIds,
            senderId: userId,
            receiverId: authUser._id,
          });
        }
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //send msg to particular user
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/message/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  //function to fetch grops
  const getGroups = async () => {
    try {
      const { data } = await axios.get("/api/group/my-groups");
      if (data.success) {
        setGroups(data.groups);
        setUnseenGroupMessages(data.unseenMessages);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getGroupMessages = async (groupId) => {
    try {
      const { data } = await axios.get(`/api/message/group/${groupId}`);
      if (data.success) {
        setGroupMessages(data.messages);
        setUnseenGroupMessages[groupId] = 0;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendGroupMessage = async (messageData) => {
    try {
      if (!selectedGroup || !selectedGroup._id) {
        toast.error("No group selected");
        return;
      }

      const { data } = await axios.post(
        `/api/message/group/send/${selectedGroup._id}`,
        messageData
      );

      if (data.success) {
        setGroupMessages((prevMessages) => [
          ...(Array.isArray(prevMessages) ? prevMessages : []),
          data.newMessage,
        ]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const updateGroup = async (groupId, updatedData) => {
    try {
      const { data } = await axios.put(
        `/api/group/update/${groupId}`,
        updatedData
      );
      if (data.success) {
        setSelectedGroup(data.group);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  //add members to group
  const addMembersToGroup = async (groupId, userId) => {
    try {
      const { data } = await axios.post(`/api/group/${groupId}/add-member`, {
        userId,
      });

      if (data.success) {
        toast.success(data.message);
        setShowAddMem(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);

      toast.error(error.message);
    }
  };

  const handleExitGroup = async () => {
    if (!selectedGroup) return;

    try {
      const temp = selectedGroup;
      setSelectedGroup(null);
      const { data } = await axios.post(`/api/group/${selectedGroup._id}/exit`);

      if (data.success) {
        toast.success(data.message);
        getGroups();
      } else {
        setSelectedGroup(temp);
        toast.error(data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  //function to subscribe to messages for selected user
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.sender_id === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);

        //Emit seen acknowledgment to sender
        socket.emit("message-seen", {
          messageId: newMessage._id,
          senderId: newMember.sender_id,
          receiverId: authUser,
          _id,
        });
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.sender_id]: prevUnseenMessages[newMessage.sender_id]
            ? prevUnseenMessages[newMessage.sender_id] + 1
            : 1,
        }));
      }
    });
    socket.on("newGroupMessage", (newMessage) => {
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        //Add curr userId to seenBy  if not already there

        if (!newMessage.seenBy.includes(authUser._id)) {
          newMessage.seenBy.push(authUser._id);

          // Emit to backend to update seenBy in DB
          socket.emit("mark-groupMessage-seen", {
            messageId: newMessage._id,
            userId: authUser._id,
            senderId: newMessage.senderId,
          });
        }

        setGroupMessages((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          newMessage,
        ]);
      } else {
        console.log(
          "Received group message for another group:",
          newMessage.groupId
        );
      }
    });

    socket.on("group-Msgseen-update", ({ messageId, seenBy }) => {
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, seenBy: [...msg.seenBy, seenBy] }
            : msg
        )
      );
    });
  };

  //function to unsubscribe to message
  const unSubScribeToMessage = async () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    if (!socket) return; // socket not ready yet

    socket.on("group-Msgseen-update", ({ messageId, seenBy }) => {
      setGroupMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? msg.seenBy.includes(seenBy)
              ? msg
              : { ...msg, seenBy: [...msg.seenBy, seenBy] }
            : msg
        )
      );
    });

    return () => {
      socket.off("group-Msgseen-update");
    };
  }, [socket]);

  useEffect(() => {
    if (!socket) return;
    // subscribeToMessages();

    const cleanup = setupChatSocketEvents(socket, {
      selectedUser,
      selectedGroup,
      authUser,
      setMessages,
      setGroupMessages,
      setUnseenMessages,
      setUnseenGroupMessages,
      setIsTyping,
      setIsTypingGrp,
      axios,
    });

    socket.on("user-joined", (newUser) => {
      setUsers((prevUsers) => {
        const alreadyExists = prevUsers.some(
          (user) => user._id === newUser._id
        );

        if (!alreadyExists) return prevUsers;
        return [...prevUsers, newUser.user];
      });
    });

    socket.on("group-created", (newGroup) => {
      setGroups((prevGroups) => {
        const alreadyExists = prevGroups.some(
          (group) => group._id === newGroup._id
        );
        if (alreadyExists) return prevGroups;
        return [...prevGroups, newGroup];
      });
    });

    socket.on("profile-update", (updatedUser) => {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === updatedUser._id ? { ...user, ...updatedUser } : user
        )
      );
      if (selectedUser?._id === updatedUser._id) {
        setSelectedUser(updatedUser);
      }
    });

    socket.on("group-profile-update", (updatedGroup) => {
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === updatedGroup._id ? { ...group, ...updatedGroup } : group
        )
      );
      if (selectedGroup?._id === updatedGroup._id) {
        setSelectedGroup(updatedGroup);
      }
    });

    socket.on("message-seen", ({ messageId, userId }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === messageId && !msg.seenBy.includes(userId)
            ? { ...msg, seenBy: [...msg.seenBy, userId] }
            : msg
        )
      );
    });

    return () => {
      if (cleanup) cleanup(); //cleanup on unmount or dependency change
      socket.off("group-created");
      socket.off("profile-update");
      socket.off("message-seen");
    };
  }, [socket, selectedUser, selectedGroup]);

  useEffect(() => {
    if (!socket) return;
    socket.on("message-seen-update", ({ messageIds }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          messageIds.includes(msg._id) ? { ...msg, seen: true } : msg
        )
      );
    });

    socket.on("addedToGroup", (newGroup) => {
      setGroups((prevGroup) => [...prevGroup, newGroup]);
    });

    return () => {
      socket.off("message-seen-update");
      socket.off("addedToGroup");
    };
  }, [socket]);

  useEffect(() => {
    if (socket && selectedGroup) {
      const unseenIds = groupMessages
        .filter((msg) => !msg.seen && msg.sender_id !== authUser._id)
        .map((msg) => msg._id);

      if (unseenIds.length > 0) {
        socket.emit("group-message-seen", {
          messageIds: unseenIds,
          senderId: null,
          groupId: selectedGroup._id,
        });
      }
    }
  }, [selectedGroup, groupMessages]);

  useEffect(() => {
    if (!socket) return;
    socket.on("member-added", ({ groupId, newMember, message }) => {
      setMessages((prev) => [...prev, message]);

      if (selectedGroup?._id === groupId) {
        setSelectedGroup((prev) => ({
          ...prev,
          members: [
            ...prev.members,
            { user: newMember, joinedAt: new Date().toISOString() },
          ],
        }));
      }
    });

    socket.on("member-exited", ({ groupId, userId, exitMessage }) => {
      setMessages((prev) => [...prev, exitMessage]);

      setSelectedGroup((prevGroup) => {
        if (!prevGroup || prevGroup._id !== groupId) return prevGroup;
        return {
          ...prevGroup,
          members: prevGroup.members.filter(
            (member) => member.user._id !== userId
          ),
        };
      });
    });

    return () => {
      socket.off("member-added");
      socket.off("member-exited");
    };
  }, [selectedGroup]);
  /* 
  useEffect(() => {
    if (!socket) return;

    socket.on("member-added", ({ groupId, newMember, message }) => {
      if (selectedGroup?._id === groupId) {
        setGroupMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      socket.off("member-added");
    };
  }, [socket, selectedGroup]);
 */
  useEffect(() => {
    if (socket && selectedGroup?._id) {
      socket.emit("joinGroup", selectedGroup._id);
    }
  }, [socket, selectedGroup]);

  const value = {
    users,
    messages,
    unseenMessages,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setMessages,
    setSelectedUser,
    setUnseenMessages,
    isTyping,
    getGroups,
    groups,
    selectedGroup,
    setSelectedGroup,
    setGroupMessages,
    groupMessages,
    getGroupMessages,
    sendGroupMessage,
    unseenGroupMessages,
    setUnseenGroupMessages,
    updateGroup,
    isTypingGrp,
    isCreatingGroup,
    setIsCreatingGroup,
    addMembersToGroup,
    handleExitGroup,
    showRightSidebar,
    setShowRightSidebar,
    showAddMem,
    setShowAddMem,
    draftMessages,
    setDraftMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => useContext(ChatContext);
