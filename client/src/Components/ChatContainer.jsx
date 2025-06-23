import React, { useEffect, useRef, useState } from "react";
import assets, { messagesDummyData } from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { useChatContext } from "../context/ChatContext.jsx";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import RightSidebar from "./RightSidebar.jsx";
import { Socket } from "socket.io-client";

const ChatContainer = ({ onHeaderClick }) => {
  const {
    selectedUser,
    setSelectedUser,
    messages,
    getMessages,
    sendMessage,
    isTyping,
    selectedGroup,
    groupMessages,
    getGroupMessages,
    sendGroupMessage,
    setSelectedGroup,
    getUnseenMsges,
    isTypingGrp,
  } = useChatContext();

  const { authUser, onlineUsers, socket, axios } = useAuthContext();

  const scrollEnd = useRef();

  const [input, setInput] = useState("");

  const typingTimeoutRef = useRef(null);

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    if (selectedUser) {
      await sendMessage({ text: input.trim() });
    } else if (selectedGroup) {
      await sendGroupMessage({
        text: input.trim(),
        groupId: selectedGroup._id,
      });
    }

    setInput("");
  };

  //handle sending a image
  const handleSendImage = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("select valid image file");
    }
    const reader = new FileReader();

    reader.onloadend = async () => {
      if (selectedUser) {
        await sendMessage({ image: reader.result });
      } else if (selectedGroup) {
        await sendGroupMessage({
          image: reader.result,
          groupId: selectedGroup._id,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  //handle typing
  const handleTyping = () => {
    if (!(selectedUser || selectedGroup) || !socket) return;
    if (selectedUser && socket) {
      socket.emit("typing", { toUserId: selectedUser._id });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("stopTyping", { toUserId: selectedUser._id });
      }, 2000); //2 seconds after last keystroke
    }

    if (selectedGroup && socket) {
      socket.emit("group-typing", {
        groupId: selectedGroup._id,
        fromUserId: authUser._id,
        fullName: authUser.fullName,
      });
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("group-stopTyping", {
          groupId: selectedGroup._id,
          fromUserId: authUser._id,
        });
      }, 2000);
    }
  };

  const markGroupSeen = async () => {
    try {
      const { data } = await axios.put(
        `/api/group/${selectedGroup._id}/mark-seen`
      );
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    } else if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      markGroupSeen();
      getUnseenMsges;
    }
  }, [selectedUser, selectedGroup]);

  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessages]);

  return !(selectedUser || selectedGroup) ? (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 ">
      <img src={assets.logo_icon} alt="logo" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime,anywhere</p>
    </div>
  ) : (
    <div className="hide-scrollbar realtive h-full backdrop-blur-lg overflow-y-scroll">
      <div
        onClick={() => {
          onHeaderClick();
        }}
        className="flex items-center gap-3 mx-4 py-2 border-b  border-stone-500 "
      >
        <img
          src={
            selectedUser
              ? selectedUser.profilePic || assets.avatar_icon
              : selectedGroup.profilePic || assets.groupIcon
          }
          alt="profilePic"
          className="w-8 rounded-full"
        />

        <div className="flex-1 items-center justify-center  ">
          <p className="text-lg text-white flex items-center gap-2">
            {selectedUser?.fullName || selectedGroup?.name}
            {selectedUser && onlineUsers.includes(selectedUser._id) && (
              <span className=" w-2 h-2 bg-green-500 rounded-full"></span>
            )}
          </p>

          {isTyping && selectedUser && (
            <p className="text-sm text-green-400 ">typing...</p>
          )}

          {isTypingGrp && selectedGroup && (
            <p className="text-sm text-green-400">
              {isTypingGrp} is typing...{" "}
            </p>
          )}
        </div>

        <img
          src={assets.arrow_icon}
          alt="arrow-icon"
          className="md:hidden invert max-w-7"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedUser(null);
            setSelectedGroup(null);
          }}
        />
        <img
          src={assets.help_icon}
          alt="help-icon"
          className="max-md:hidden max-w-5"
        />
      </div>
      {/* Chat area*/}
      <div className="flex flex-col h-[calc(100%-120px)]  p-3 pb-6 overflow-y-scroll hide-scrollbar">
        {(selectedUser ? messages || [] : groupMessages || []).map(
          (msg, index) => {
            const senderId =
              typeof msg.sender_id === "object"
                ? msg.sender_id._id
                : msg.sender_id;

            return (
              <div
                key={index}
                className={`flex items-end gap-2 justify-end ${
                  senderId !== authUser._id && "flex-row-reverse"
                }`}
              >
                {msg.image ? (
                  <img
                    src={msg.image}
                    className="max-w-[230px] border border-gray-700 rounded-lg mb-8 overflow-hidden "
                  />
                ) : (
                  <p
                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                      senderId === authUser._id
                        ? "rounded-br-none"
                        : "rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </p>
                )}

                <div className="text-center text-xs">
                  <img
                    src={
                      senderId === authUser._id
                        ? authUser.profilePic || assets.avatar_icon
                        : msg.sender_id?.profilePic || assets.avatar_icon
                    }
                    alt="profile-pic"
                    className="w-7 rounded-full"
                  />
                  <p className="text-gray-500">
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          }
        )}

        <div ref={scrollEnd}></div>
      </div>{" "}
      {/* ---bottom area---- */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            onChange={(e) => {
              setInput(e.target.value);
              handleTyping();
              console.log("handle typing");
            }}
            onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
            value={input}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image/png,image/jpg,image.jpeg"
            hidden
          />
          <label htmlFor="image">
            <img
              src={assets.gallery_icon}
              alt=""
              className="w-5 mr-2 cursor-pointer"
            />
          </label>
        </div>
        <img
          onClick={handleSendMessage}
          src={assets.send_button}
          alt=""
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default ChatContainer;
