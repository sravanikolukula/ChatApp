import React, { useState, useEffect, useRef } from "react";
import assets from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext.jsx";

import ContactCard from "./ContactCard.jsx";
import Logo from "./Logo.jsx";

const Sidebar = () => {
  const navigate = useNavigate();
  const { logout, onlineUsers } = useAuthContext();
  const {
    users,
    getUsers,
    unseenMessages,
    selectedUser,
    setSelectedUser,
    setUnseenMessages,
    getGroups,
    groups,
    selectedGroup,
    setSelectedGroup,
    unseenGroupMessages,
    setUnseenGroupMessages,
    setIsCreatingGroup,
    setShowAddMem,
  } = useChatContext();
  const [input, setInput] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [isGroups, setIsGroups] = useState(false);

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
    getGroups();
  }, []);

  return (
    <div
      onClick={() => {
        showMenu && setShowMenu(false);
      }}
      className={`bg-[#0E0E0E]/50 h-full p-5 rounded-r-xl text-white ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5">
        {/* Header section */}
        <div className="flex items-center justify-between ">
          <div className="flex items-baseline space-x-1">
            <img
              src={assets.logo}
              alt="Talkify logo"
              className="h-7 w-7 sm:h-9 sm:w-9 md:h-10 md:w-10"
            />

            <Logo text={"text-2xl sm:text-2xl md:text-3xl"} />
          </div>
          <div className="relative py-2 ">
            <img
              src={assets.menu_icon}
              alt="menu-icon"
              onClick={(e) => {
                e.stopPropagation(); // prevent parent click
                setShowMenu(true);
              }}
              className="max-h-5 cursor-pointer"
            />

            {showMenu && (
              <div className=" absolute top-full right-0 z-20  w-32 p-5 rounded-md bg-[#1c1b1b] border border-gray-600 shadow-lg">
                <p
                  className="text-sm cursor-pointer "
                  onClick={() => {
                    setIsCreatingGroup(true), setShowMenu(false);
                  }}
                >
                  New group
                </p>
                <hr className="my-2 border-t border-gray-500" />
                <p
                  onClick={() => {
                    navigate("/profile"), setShowMenu(false);
                  }}
                  className="cursor-pointer text-sm"
                >
                  Edit profile
                </p>
                <hr className=" my-2 border-t border-gray-500 " />
                <p
                  onClick={() => {
                    setSelectedGroup(null);
                    setSelectedUser(null);
                    setShowMenu(false);
                    logout();
                  }}
                  className=" cursor-pointer text-sm"
                >
                  Logout
                </p>
              </div>
            )}
          </div>
        </div>
        {/* ----Search engine---- */}
        <div
          className="  
        bg-[#1E1E1E] rounded-full  flex items-center  gap-2 px-4 py-3 mt-5 shadow-inner"
        >
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            type="text"
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none border-none text-[#EAEAEA] placeholder-[#707070]"
            placeholder="Search User..."
          />
        </div>
        <div className="grid grid-cols-2 text-center py-3">
          <div
            onClick={() => setIsGroups(false)}
            className="flex flex-col items-center gap-1"
          >
            <p>Users</p>
            <div
              className={`${
                isGroups ? "hidden" : "block"
              } w-16 md:w-24 h-1  bg-gradient-to-r from-[#9E8CFF] to-[#CFC8FF] text-black hover:shadow-[0_0_10px_2px_rgba(255,255,255,0.4)] px-4 rounded-full`}
            ></div>
          </div>
          <div
            onClick={() => setIsGroups(true)}
            className="flex flex-col items-center gap-1"
          >
            <p>Groups</p>
            <div
              className={`${
                !isGroups ? "hidden" : "block"
              } w-16 md:w-24 h-1 bg-gradient-to-r from-[#9E8CFF] to-[#CFC8FF] text-black hover:shadow-[0_0_10px_2px_rgba(255,255,255,0.4)] px-4 rounded-full`}
            ></div>
          </div>
        </div>
        {/* ----Contacts List---- */}
        <div className="hide-scrollbar flex flex-col overflow-y-auto max-h-[calc(100vh-250px)]">
          {!isGroups
            ? filteredUsers.map((user, index) => (
                <ContactCard
                  key={user._id}
                  id={user._id}
                  name={user.fullName}
                  image={user.profilePic || assets.avatar_icon}
                  isOnline={onlineUsers.includes(user._id)}
                  unseenCount={unseenMessages[user._id] || 0}
                  isSelected={selectedUser?._id === user._id}
                  onClick={() => {
                    if (showMenu) return;
                    setSelectedGroup(null);
                    setSelectedUser(user);
                    setShowAddMem(false);
                    setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                  }}
                />
              ))
            : /* Group list */
              groups.length > 0 &&
              groups.map((group) => (
                <ContactCard
                  key={group._id}
                  id={group._id}
                  name={group.name}
                  image={group.profilePic || assets.groupIcon}
                  unseenCount={unseenGroupMessages[group._id] || 0}
                  isSelected={selectedGroup?._id === group._id}
                  onClick={() => {
                    if (showMenu) return;
                    setSelectedUser(null);
                    setShowAddMem(false);
                    setSelectedGroup(group);
                    setUnseenGroupMessages((prev) => ({
                      ...prev,
                      [group._id]: 0,
                    }));
                  }}
                />
              ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
