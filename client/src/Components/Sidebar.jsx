import React, { useState, useEffect } from "react";
import assets from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext";

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
  } = useChatContext();
  const [input, setInput] = useState("");

  const [showMenu, setShowMenu] = useState(false);

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, []);

  return (
    <div
      className={` bg-[#818582]/10 h-full p-5 ronuded-r-xl  text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5">
        {/* Header section */}
        <div className="flex items-center justify-between ">
          <img src={assets.logo} alt="logo" className=" max-w-40" />
          <div className="relative py-2 ">
            <img
              src={assets.menu_icon}
              alt="menu-icon"
              onClick={() => setShowMenu(true)}
              className="max-h-5 cursor-pointer"
            />

            {showMenu && (
              <div className=" absolute top-full right-0 z-20  w-32 p-5 rounded-md bg-[#282142] border border-gray-600 shadow-lg">
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
        {/* ----Serch engine---- */}
        <div className=" bg-[#282142] rounded-full  flex items-center  gap-2 px-4 py-3 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-3" />
          <input
            type="text"
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent outline-none border-none  text-white placeholder-[#c8c8c8]"
            placeholder="Search User..."
          />
        </div>
      </div>
      {/* ----Contacts List---- */}
      <div className="flex flex-col overflow-y-auto">
        {filteredUsers.map((user, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedUser(user),
                setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            className={`relative flex items-center gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm  ${
              selectedUser?.id === user._id && "bg-[#282142]/50"
            } hover:bg-[#282142]`}
          >
            <img
              src={user?.profilePic || assets.avatar_icon}
              alt="profile"
              className=" w-[35px] aspect-[1/1]  rounded-full  object-cover"
            />
            <div className="flex  flex-col leading-5">
              <p>{user.fullName}</p>
              <span
                className={`text-xs ${
                  onlineUsers.includes(user._id)
                    ? "text-green-500 "
                    : "text-amber-500"
                }`}
              >
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </span>
            </div>

            {unseenMessages[user._id] > 0 && (
              <p className=" absolute top-4 right-4 h-5 w-5 text-xs flex justify-center items-center rounded-full bg-violet-500/50">
                {unseenMessages[user._id]}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
