import React, { useState, useEffect } from "react";
import assets from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { useChatContext } from "../context/ChatContext.jsx";
import toast from "react-hot-toast";
import axios from "axios";

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
  } = useChatContext();
  const [input, setInput] = useState("");
  const [isCreateGroup, setIsCreateGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [isGroups, setIsGroups] = useState(false);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter group name");
      return;
    }
    if (groupMembers.length === 0) {
      toast.error("Please select atlest one group member");
    }
    try {
      const { data } = await axios.post("/api/group/create", {
        name: groupName,
        groupMembers: groupMembers.map((user) => user._id),
      });

      if (data.success) {
        toast.success(data.message);
        setGroupName("");
        setGroupMembers([]);
        setIsCreateGroup(false);
        setInput("");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const getUnseenMsges = async () => {
    const { data } = await axios.get("/api/group/unread-count");
    if (data.success) {
      setUnseenGroupMessages(data.unseenMessages);
    }
  };

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
    getGroups();
    getUnseenMsges();
  }, []);

  return (
    <div
      className={`bg-[#818582]/10 h-full p-5 rounded-r-xl text-white ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
    >
      {!isCreateGroup ? (
        <>
          <div className="pb-5">
            {/* Header section */}
            <div className="flex items-center justify-between ">
              <img src={assets.logo} alt="logo" className=" max-w-40" />
              <div className="relative py-2 ">
                <img
                  src={assets.menu_icon}
                  alt="menu-icon"
                  onClick={() => setShowMenu(!showMenu)}
                  className="max-h-5 cursor-pointer"
                />

                {showMenu && (
                  <div className=" absolute top-full right-0 z-20  w-32 p-5 rounded-md bg-[#282142] border border-gray-600 shadow-lg">
                    <p
                      className="text-sm cursor-pointer hover:backdrop-blur"
                      onClick={() => setIsCreateGroup(true)}
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
            <div className=" bg-[#282142] rounded-full  flex items-center  gap-2 px-4 py-3 mt-5">
              <img src={assets.search_icon} alt="Search" className="w-3" />
              <input
                type="text"
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent outline-none border-none  text-white placeholder-[#c8c8c8]"
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
                  } w-16 md:w-24 h-1 bg-purple-400 px-4 rounded-full`}
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
                  } w-16 md:w-24 h-1 bg-purple-400 px-4 rounded-full`}
                ></div>
              </div>
            </div>
          </div>
          {/* ----Contacts List---- */}
          <div className="flex flex-col overflow-y-auto">
            {!isGroups
              ? filteredUsers.map((user, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setSelectedGroup(null);
                      setSelectedUser(user),
                        setUnseenMessages((prev) => ({
                          ...prev,
                          [user._id]: 0,
                        }));
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
                ))
              : /* Group list */
                groups.length > 0 &&
                groups.map((group) => (
                  <div
                    key={group._id}
                    onClick={() => {
                      setSelectedUser(null);
                      setSelectedGroup(group);
                    }}
                    className={`p-2 pl-4 relative  rounded flex  gap-4 cursor-pointer hover:bg-[#282142] ${
                      selectedGroup?._id === group._id ? "bg-[#282142]/50" : ""
                    }`}
                  >
                    <img
                      src={group?.profilePic || assets.groupIcon}
                      alt="groupIcon"
                      className="w-[32px] h-[32px] aspect-[1/1] rounded-full "
                    />
                    <div className="flex flex-col leading-5">
                      <p>{group.name}</p>
                      <p>groupchat</p>
                    </div>
                    {unseenGroupMessages[group._id] > 0 && (
                      <p className=" absolute top-4 right-4 h-5 w-5 text-xs flex justify-center items-center rounded-full bg-violet-500/50">
                        {unseenGroupMessages[group._id]}
                      </p>
                    )}
                  </div>
                ))}
          </div>
        </>
      ) : (
        <div>
          {/* Header section */}
          <div className="flex items-center justify-between">
            <div className="flex   items-center gap-4">
              <img
                src={assets.arrow_icon}
                alt="arrow icon"
                onClick={() => setIsCreateGroup(false)}
                className="max-w-7 max-h-7"
              />
              <div className="flex flex-col">
                <h1 className="font-medium text-gray-200">New Group</h1>
                <p className="text-sm text-gray-400 ">Add members</p>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="search user.."
                className="p-1 px-2 border border-gray-500 rounded outline-none text-md text-gray-300"
                onChange={(e) => setInput(e.target.value)}
              />
              <img
                src={assets.search_icon}
                alt=""
                className="max-w-3 absolute right-3 bottom-3 "
              />
            </div>
          </div>
          <hr className="my-2 border-t border-gray-400" />

          <div className="relative w-full mt-4">
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full p-2 pr-20 border border-gray-500 rounded bg-transparent text-white placeholder-gray-400"
            />
            <button
              onClick={handleCreateGroup}
              className="absolute top-1/2 right-2 -translate-y-1/2 py-1 px-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded"
            >
              Create
            </button>
          </div>

          {/* added members */}
          {groupMembers.length > 0 && (
            <div className="p-2 flex  border-b border-gray-400 gap-3">
              {groupMembers.map((user, index) => (
                <div className="relative">
                  <img
                    src={user.profilePic || assets.avatar_icon}
                    className="max-w-7 rounded-full"
                  />

                  <p className="text-xs text-gray-400">{user.fullName}</p>
                </div>
              ))}
            </div>
          )}

          {/* allcontacts */}
          <div>
            {filteredUsers.map((user) => {
              const alreadyAdded = groupMembers.some((u) => u._id === user._id);
              return (
                <div
                  key={user._id}
                  className={`relative flex items-center justify-between gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm  hover:bg-[#282142]`}
                  onClick={() => {
                    if (alreadyAdded) {
                      setGroupMembers((prev) =>
                        prev.filter((u) => u._id !== user._id)
                      );
                    } else {
                      setGroupMembers((prev) => [...prev, user]);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user?.profilePic || assets.avatar_icon}
                      alt="profile"
                      className="w-[35px] aspect-[1/1] rounded-full object-cover"
                    />
                    <p>{user.fullName}</p>
                  </div>
                  {alreadyAdded && (
                    <div className="mr-2 border border-gray-400 w-3 h-3 flex items-center justify-center rounded-full">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
