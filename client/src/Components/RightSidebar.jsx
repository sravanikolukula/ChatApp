import React, { useEffect, useState } from "react";
import assets from "../assets/assets.js";
import { useChatContext } from "../context/ChatContext";
import { useAuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const RightSidebar = ({ isMobile, onClose }) => {
  const { onlineUsers, logout, authUser } = useAuthContext();
  const {
    selectedUser,
    setSelectedUser,
    messages,
    selectedGroup,
    groupMessages,
    setSelectedGroup,
    handleExitGroup,
    showAddMem,
    setShowAddMem,
    showRightSidebar,
    setShowRightSidebar,
  } = useChatContext();
  const [msgImages, setMsgImages] = useState([]);
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (selectedUser) {
      setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
    } else {
      setMsgImages(
        groupMessages.filter((msg) => msg.image).map((msg) => msg.image)
      );
    }
  }, [messages, groupMessages]);

  return (
    (selectedUser || selectedGroup) && (
      <div
        className={` text-white w-full relative overflow-y-scroll hide-scrollbar ${
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
        {selectedGroup && (
          <div className="absolute top-4 right-4">
            <img
              src={assets.menu_icon}
              onClick={() => setShowMenu((prev) => !prev)}
              alt="menu-icon"
              className="max-h-5 cursor-pointer "
            />

            {showMenu && (
              <div
                className="absolute right-4  mt-2 w-32 p-4 z-20 
              bg-[#1c1b1b] border border-gray-600 rounded-md shadow-lg "
              >
                <p
                  className="text-sm cursor-pointer "
                  onClick={() => {
                    if (selectedGroup) {
                      navigate(`/group-profile/${selectedGroup._id}`);
                      setShowMenu(false);
                    }
                  }}
                >
                  Edit profile
                </p>
                <hr className="my-2 border-t border-gray-500" />

                <p
                  className="text-sm cursor-pointer  "
                  onClick={() => {
                    setShowMenu(false);
                    setShowAddMem(true);
                    if (isMobile) {
                      setShowRightSidebar(true);
                    }
                  }}
                >
                  Add members
                </p>
                <hr className="my-2 border-t border-gray-500" />
                <p
                  className="text-sm cursor-pointer "
                  onClick={() => {
                    handleExitGroup();
                    setShowMenu(false);
                  }}
                >
                  Exit group
                </p>
              </div>
            )}
          </div>
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
              <p className="w-2 h-2 rounded-full bg-purple-400"></p>
            )}
            {selectedUser && selectedUser.fullName}
            {selectedGroup && selectedGroup.name}
          </h1>
          <p className="px-10 m-auto">
            {selectedGroup
              ? selectedGroup.bio
              : selectedUser
              ? selectedUser.bio
              : ""}
          </p>
        </div>
        <hr className="border-[#ffffff50] my-4" />
        <div className="px-5 text-xs">
          <p>Media</p>
          {msgImages.length > 0 ? (
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
          ) : (
            <p className="mt-2 text-[#9B9B9B]">No shared media</p>
          )}
        </div>
        {selectedGroup && (
          <div className="mt-5 p-2">
            <p className="px-5 text-xs"> Group Members</p>

            {selectedGroup.members.map((member, index) => {
              const user = member.user;

              if (user._id != authUser._id) {
                return (
                  <div
                    key={index}
                    className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm   hover:bg-[#2E2E2E]`}
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
                );
              }
            })}
          </div>
        )}
        <button
          onClick={() => {
            setSelectedUser(null);
            setSelectedGroup(null);
            logout();
          }}
          className="absolute bottom-5 left-1/2 transform -translate-x-1/2 
        
          bg-gradient-to-r from-[#9E8CFF] to-gray-200 text-black 
          border-none text-sm font-light py-2 px-20 rounded-full cursor-pointer "
        >
          Logout
        </button>
      </div>
    )
  );
};

export default RightSidebar;
