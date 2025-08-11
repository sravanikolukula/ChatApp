import React, { useState } from "react";
import { useChatContext } from "../context/ChatContext";
import assets from "../assets/assets";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";

const CreateGroup = () => {
  const { axios } = useAuthContext();
  const { users, setIsCreatingGroup, selectedGroup, selectedUser } =
    useChatContext();
  const [input, setInput] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      toast.error("Please enter group name");
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error("Please select atlest one group member");
      return;
    }
    try {
      const { data } = await axios.post("/api/group/create", {
        name: groupName.trim(),
        groupMembers: selectedMembers.map((user) => user._id),
      });

      if (data.success) {
        toast.success(data.message);
        setIsCreatingGroup(false);
        setGroupName("");
        setSelectedMembers([]);
        setInput("");
      }
    } catch (error) {
      console.log(error);
      toast.error(error.message);
    }
  };

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  return (
    <div
      className={`bg-[#818582]/10 h-full p-5 rounded-r-xl text-white ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
    >
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            src={assets.arrow_icon}
            alt="arrow icon"
            onClick={() => {
              setIsCreatingGroup(false),
                setSelectedMembers([]),
                setGroupName(""),
                setInput("");
            }}
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
            alt="search-icon"
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
          className="w-full p-2 pr-20 border border-gray-500 rounded bg-transparent text-white placeholder-gray-400 outline-none"
        />
        <button
          onClick={handleCreateGroup}
          className="absolute top-1/2 right-2 -translate-y-1/2 py-1 px-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded"
        >
          Create
        </button>
      </div>

      {/* added members */}
      {selectedMembers.length > 0 && (
        <div className="p-2 flex  border-b border-gray-400 gap-3">
          {selectedMembers.map((user, index) => (
            <div key={user._id} className="relative">
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
          const alreadyAdded = selectedMembers.some((u) => u._id === user._id);
          return (
            <div
              key={user._id}
              className={`relative flex items-center justify-between gap-2 p-2 pl-4 rounded cursor-pointer max-sm:text-sm  hover:bg-[#282142]`}
              onClick={() => {
                if (alreadyAdded) {
                  setSelectedMembers((prev) =>
                    prev.filter((u) => u._id !== user._id)
                  );
                } else {
                  setSelectedMembers((prev) => [...prev, user]);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={user?.profilePic || assets.avatar_icon}
                  alt="profile"
                  className="w-[35px] aspect-[1/1] rounded-full object-cover"
                />
                <p className="text-gray-200">{user?.fullName}</p>
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
  );
};

export default CreateGroup;
