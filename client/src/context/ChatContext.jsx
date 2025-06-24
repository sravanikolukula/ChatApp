import { createContext, useContext, useEffect, useState } from "react";
import { useAuthContext } from "./AuthContext.jsx";
import toast, { useToasterStore } from "react-hot-toast";

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

  const { axios, socket, authUser } = useAuthContext();

  //function to get users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/message/users");
      if (data.success) {
        setUsers(data.filteredUsers);
        setUnseenMessages(data.unseenMessages);
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

  //function to subscribe to messages for selected user
  const subscribeToMessages = async () => {
    if (!socket) return;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.sender_id === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
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
  };

  //function to unsubscribe to message
  const unSubScribeToMessage = async () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    if (!socket) return;
    // subscribeToMessages();

    const handleNewGroupMessage = (newMessage) => {
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        setGroupMessages((prev) => [
          ...(Array.isArray(prev) ? prev : []),
          newMessage,
        ]);
      }
    };

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.sender_id === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prev) => [...prev, newMessage]);
        axios.put(`/api/message/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseen) => ({
          ...prevUnseen,
          [newMessage.sender_id]: (prevUnseen[newMessage.sender_id] || 0) + 1,
        }));
      }
    };

    const handleTyping = ({ fromUserId }) => {
      if (selectedUser && selectedUser._id === fromUserId) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ fromUserId }) => {
      if (selectedUser && selectedUser._id === fromUserId) {
        setIsTyping(false);
      }
    };

    const handleGroupTyping = ({ fromUserId, fullName, groupId }) => {
      if (
        selectedGroup &&
        selectedGroup._id === groupId &&
        fromUserId !== authUser._id
      ) {
        setIsTypingGrp(fullName);
      }
    };

    const handleGroupStopTyping = ({ fromUserId, groupId }) => {
      if (
        selectedGroup &&
        selectedGroup._id === groupId &&
        fromUserId !== authUser._id
      ) {
        setIsTypingGrp("");
      }
    };
    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);
    socket.on("newGroupMessage", handleNewGroupMessage);
    socket.on("newMessage", handleNewMessage);
    socket.on("group-typing", handleGroupTyping);
    socket.on("group-stopTyping", handleGroupStopTyping);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
      socket.off("newGroupMessage", handleNewGroupMessage);
      socket.off("newMessage", handleNewMessage);
      socket.off("group-typing", handleGroupTyping);
      socket.off("group-stopTyping", handleGroupStopTyping);
      unSubScribeToMessage();
    };
  }, [socket, selectedUser, selectedGroup]);

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
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChatContext = () => useContext(ChatContext);
