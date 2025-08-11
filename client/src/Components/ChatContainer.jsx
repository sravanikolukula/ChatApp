import React, { useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { useChatContext } from "../context/ChatContext.jsx";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckDouble } from "@fortawesome/free-solid-svg-icons";
import MessageInfoModel from "./MessageInfoModel.jsx";

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
    setGroupMessages,
    getGroupMessages,
    sendGroupMessage,
    setSelectedGroup,
    getUnseenMsges,
    isTypingGrp,
    draftMessages,
    setDraftMessages,
  } = useChatContext();

  const { authUser, onlineUsers, socket, axios } = useAuthContext();

  const [selectedMsg, setSelectedMsg] = useState(null);
  const [showMsgInfo, setShowMsgInfo] = useState(false);

  const scrollEnd = useRef(); //Ref to auto-scroll to  the latest message
  // const [input, setInput] = useState("");
  const typingTimeoutRef = useRef(null); //Ref to bounce "typing" event

  const chatId = selectedUser?._id || selectedGroup?._id;
  const message = draftMessages[chatId] || "";

  const inputRef = useRef();

  // Handle sending a message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    if (selectedUser) {
      await sendMessage({ text: message.trim() });
    } else if (selectedGroup) {
      await sendGroupMessage({
        text: message.trim(),
        groupId: selectedGroup._id,
      });
    }
    setDraftMessages((prev) => ({ ...prev, [chatId]: "" }));
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
        setDraftMessages((prev) => ({ ...prev, [chatId]: "" }));
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

  //Emit typing and stopTyping events with 2s delay
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

  //Mark group messages as seen
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

  //Fetch messages when a user or group is slected
  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedGroup) return;
    getGroupMessages(selectedGroup._id);
    markGroupSeen();
  }, [selectedGroup]);

  //Auto scroll to the bottom when new msg arrive
  useEffect(() => {
    if (scrollEnd.current) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, groupMessages]);

  //auto-focus on input field on chat change
  useEffect(() => {
    if (inputRef.current) inputRef.current.focus();
  }, [selectedGroup, selectedUser]);

  useEffect(() => {
    if (!socket) return;
    const handleSeenUpdate = (msgIds, seenByUser, groupId) => {
      setGroupMessages((prev) =>
        prev.map((msg) => {
          if (msgIds.includes(msg._id)) {
            if (!msg.seenBy.includes(seenByUser)) {
              return {
                ...msg,
                seenBy: [...msg.seenBy, seenByUser],
              };
            }
          }
          return msg;
        })
      );
    };

    socket.on("update-msg-seenBy", handleSeenUpdate);

    return () => {
      socket.off("update-msg-seenBy", handleSeenUpdate);
    };
  }, [socket]);

  // UI: Placeholder when no chat is selected
  return !(selectedUser || selectedGroup) ? (
    <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 ">
      <img src={assets.logo_icon} alt="logo" className="max-w-16" />
      <p className="text-lg font-medium text-white">Chat anytime,anywhere</p>
    </div>
  ) : (
    <div className=" hide-scrollbar relative h-full backdrop-blur-lg overflow-y-scroll">
      {/* Chat header */}
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
      {/* Chat messages*/}
      <div className="flex flex-col h-[calc(100%-120px)]  p-3 pb-6 overflow-y-scroll hide-scrollbar">
        {(selectedUser ? messages || [] : groupMessages || []).map(
          (msg, index) => {
            if (msg.type === "system") {
              return (
                <div
                  key={index}
                  className="text-center text-gray-400 my-1 text-xs"
                >
                  {msg.text}
                </div>
              );
            }

            const senderId =
              typeof msg.sender_id === "object"
                ? msg.sender_id._id
                : msg.sender_id;

            const isSelf = senderId === authUser._id;

            const senderProfilePic = isSelf
              ? authUser.profilePic
              : selectedGroup
              ? typeof msg.sender_id === "object"
                ? msg.sender_id.profilePic
                : assets.avatar_icon
              : selectedUser?.profilePic;

            return (
              <div
                key={index}
                className={`flex items-end gap-2 justify-end ${
                  senderId !== authUser._id && "flex-row-reverse"
                }`}
              >
                {/* IMage message */}
                {msg.image ? (
                  <img
                    src={msg.image}
                    className="max-w-[230px] border border-gray-700 rounded-lg mb-8 overflow-hidden "
                    onClick={() => {
                      if (isSelf && selectedGroup) {
                        setSelectedMsg(msg);
                        setShowMsgInfo(true);
                      }
                    }}
                  />
                ) : (
                  /* Text messsage */
                  <p
                    className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white ${
                      senderId === authUser._id
                        ? "rounded-br-none "
                        : "rounded-bl-none "
                    }`} //break-all= Forces line breaks anywhere within words if necessary to prevent overflow.
                    onClick={() => {
                      if (isSelf && selectedGroup) {
                        setSelectedMsg(msg);
                        setShowMsgInfo(true);
                      }
                    }}
                  >
                    {/*   {selectedGroup && senderId !== authUser._id && (
                      <span className="font-semibold text-xs text-blue-300 block mb-1">
                        {typeof msg.sender_id === "object"
                          ? msg.sender_id.fullName
                          : "Unknown User"}
                      </span>
                    )} */}
                    {selectedGroup && senderId !== authUser._id && (
                      <span className="font-semibold text-xs text-purple-300 block mb-1">
                        {typeof msg.sender_id === "object"
                          ? msg.sender_id.fullName
                          : "Unknown User"}
                      </span>
                    )}
                    {msg.text}
                  </p>
                )}

                {showMsgInfo && selectedMsg && selectedGroup && (
                  <MessageInfoModel
                    message={selectedMsg}
                    members={selectedMsg.membersAtSendTime}
                    onClose={() => {
                      setShowMsgInfo(false);
                    }}
                  />
                )}

                {/* Sender info and timestamp */}
                <div className="text-center text-xs">
                  <img
                    src={senderProfilePic || assets.avatar_icon}
                    alt="profile-pic"
                    className="w-7 h-7 rounded-full mx-auto"
                  />
                  <div className={`flex items-center justify-center gap-2 `}>
                    <p className="text-gray-500">
                      {formatMessageTime(msg.createdAt)}{" "}
                    </p>
                    {senderId === authUser._id && (
                      <FontAwesomeIcon
                        icon={faCheckDouble}
                        className={
                          !selectedGroup
                            ? msg.seen
                              ? "text-blue-400"
                              : "text-gray-400"
                            : msg.seenBy?.filter(Boolean).length >=
                              (msg.membersAtSendTime?.length || 0) - 1
                            ? "text-blue-400"
                            : "text-gray-400"
                        }
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          }
        )}

        <div ref={scrollEnd}></div>
      </div>{" "}
      {/* ---Input area---- */}m, \
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3">
        <div className="flex-1 flex items-center bg-gray-100/12 px-3 rounded-full">
          <input
            ref={inputRef}
            onChange={(e) => {
              setDraftMessages((prev) => ({
                ...prev,
                [chatId]: e.target.value,
              }));
              handleTyping();
            }}
            onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
            //value={input}
            value={message}
            type="text"
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400"
          />
          {/* Image upload input */}
          <input
            onChange={handleSendImage}
            type="file"
            id="image"
            accept="image.png,image.jpg,image.jpeg"
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

        {/* Send button */}
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
