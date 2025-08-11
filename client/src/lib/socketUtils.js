export const setupChatSocketEvents = (
  socket,
  {
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
  }
) => {
  if (!socket) return;

  const handleNewMessage = (newMessage) => {
    if (selectedUser && newMessage.sender_id === selectedUser._id) {
      newMessage.seen = true;
      setMessages((prev) => [...prev, newMessage]);
      axios.put(`/api/message/mark/${newMessage._id}`);

      //Emit seen acknowledgment to sender

      socket.emit("message-seen", {
        messageIds: newMessage._id,
        senderId: newMessage.sender_id,
        receiverId: authUser._id,
      });
    } else {
      setUnseenMessages((prevUnseen) => ({
        ...prevUnseen,
        [newMessage.sender_id]: (prevUnseen[newMessage.sender_id] || 0) + 1,
      }));
    }
  };

  const handleNewGroupMessage = (newMessage) => {
    if (selectedGroup && newMessage.groupId === selectedGroup._id) {
      setGroupMessages((prev) => [
        ...(Array.isArray(prev) ? prev : []),
        newMessage,
      ]);
      //Add curr userId to seenBy  if not already there
      if (!newMessage.seenBy.includes(authUser._id)) {
        newMessage.seenBy.push(authUser._id);

        // Emit to backend to update seenBy in DB
        socket.emit("mark-groupMessage-seen", {
          messageId: newMessage._id,
          userId: authUser._id,
          senderId: newMessage.sender_id._id,
        });
      }

      socket.on("group-Msgseen-update", ({ messageId, seenBy }) => {
        setGroupMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId
              ? { ...msg, seenBy: [...msg.seenBy, seenBy] }
              : msg
          )
        );
      });
      socket.emit("group-message-seen", {
        messageIds: [newMessage._id],
        senderId: newMessage.sender_id._id,
        groupId: selectedGroup._id,
      });
    } else {
      setUnseenGroupMessages((prevUnseen) => ({
        ...prevUnseen,
        [newMessage.groupId]: (prevUnseen[newMessage.groupId] || 0) + 1,
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

  /* Register events */
  socket.on("typing", handleTyping);
  socket.on("stopTyping", handleStopTyping);
  socket.on("newGroupMessage", handleNewGroupMessage);
  socket.on("newMessage", handleNewMessage);
  socket.on("group-typing", handleGroupTyping);
  socket.on("group-stopTyping", handleGroupStopTyping);

  //Return cleanup function to be used in useEffect
  return () => {
    socket.off("typing", handleTyping);
    socket.off("stopTyping", handleStopTyping);
    socket.off("newGroupMessage", handleNewGroupMessage);
    socket.off("newMessage", handleNewMessage);
    socket.off("group-typing", handleGroupTyping);
    socket.off("group-stopTyping", handleGroupStopTyping);
  };
};
