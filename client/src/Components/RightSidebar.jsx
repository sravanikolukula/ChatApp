import React, { useEffect, useState } from "react";
import assets, { imagesDummyData } from "../assets/assets.js";
import { useChatContext } from "../context/ChatContext";
import { useAuthContext } from "../context/AuthContext";

const RightSidebar = ({ isMobile, onClose }) => {
  const { onlineUsers, logout } = useAuthContext();
  const {
    selectedUser,
    setSelectedUser,
    messages,
    selectedGroup,
    groupMessages,
    setSelectedGroup,
  } = useChatContext();
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    if (selectedUser) {
      setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
    } else {
      console.log(groupMessages);
      console.log(
        groupMessages.filter((msg) => msg.image).map((msg) => msg.image)
      );
      setMsgImages(
        groupMessages.filter((msg) => msg.image).map((msg) => msg.image)
      );
    }
  }, [messages, groupMessages]);
  return (
    (selectedUser || selectedGroup) && (
      <div
        className={`bg-[#818582]/10 text-white w-full relative overflow-y-scroll hide-scrollbar ${
          isMobile ? "block md:hidden" : "hidden md:block"
        }`}
      >
        {isMobile && (
          <img
            src={assets.arrow_icon}
            alt="arrow-icon"
            onClick={onClose}
            className="absolute top-2 left-2  md:hidden invert max-w-7"
          />
        )}
        <div className="pt-6 flex flex-col items-center justify-center text-xs font-light gap-2">
          <img
            src={
              selectedUser
                ? selectedUser.profilePic || assets.avatar_icon
                : selectedGroup.profilePic || assets.groupIcon
            }
            alt="profileIcon"
            className="w-20 aspect-[1/1] rounded-full cursor-pointer"
          />

          <h1 className="px-10 text-md font-medium mx-auto  flex items-center gap-2">
            {selectedUser && onlineUsers.includes(selectedUser._id) && (
              <p className="w-2 h-2 rounded-full bg-green-500"></p>
            )}
            {selectedUser && selectedUser.fullName}
            {selectedGroup && selectedGroup.name}
          </h1>
          <p className="px-10 m-auto">
            {(selectedUser && selectedUser.bio) || "No bio"}
          </p>
        </div>
        <hr className="border-[#ffffff50] my-4" />
        <div className="px-5 text-xs">
          <p>Media</p>
          <div className="mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-4 opacity-80">
            {msgImages.map((url, index) => (
              <div
                key={index}
                onClick={() => window.open(url)}
                className="cursor:pointer rounded "
              >
                <img src={url} alt="" className="w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
        {selectedGroup && (
          <div className="mt-5 p-2">
            <p className="px-5 text-xs"> Group Members</p>

            {selectedGroup.members.map((user, index) => (
              <div
                key={index}
                className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm   hover:bg-[#282142]`}
              >
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt="profile"
                  className=" w-[35px] aspect-[1/1]  rounded-full  object-cover"
                />
                <div className="flex  flex-col leading-5">
                  <p>{user.fullName}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
            logout();
          }}
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer "
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
