import React, { useState } from "react";
import { useChatContext } from "../context/ChatContext";
import assets from "../assets/assets.js";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AddGrpMembers = () => {
  const {
    users,
    selectedGroup,
    selectedUser,
    addMembersToGroup,
    setShowAddMem,
    showAddMem,
  } = useChatContext();
  const [input, setInput] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const navigate = useNavigate();

  const handleAddGrpMem = async (e) => {
    e.preventDefault();
    try {
      if (selectedMembers.length === 0) {
        toast.error("No members selected!");
        return;
      }

      for (const member of selectedMembers) {
        await addMembersToGroup(selectedGroup?._id, member._id);
      }
      // toast.success("Members added successfully!");
      navigate("/");
      setSelectedMembers([]);
      setInput("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const filteredUsers = input
    ? users.filter((user) => {
        const inSearch = user.fullName
          .toLowerCase()
          .includes(input.toLowerCase());
        const alreadyInGroup = selectedGroup?.members?.some(
          (member) => member._id === user._id
        );

        const alreadySelected = selectedMembers.some(
          (member) => member._id === user._id
        );

        return inSearch && !alreadyInGroup && !alreadySelected;
      })
    : users.filter((user) => {
        const alreadyInGroup = selectedGroup?.members?.some(
          (member) => member._id === user._id
        );

        const alreadySelected = selectedMembers.some(
          (member) => member._id === user._id
        );

        return !alreadyInGroup && !alreadySelected;
      });

  return (
    showAddMem && (
      <div
        className={`bg-[#818582]/10 p-5 rounded-r-xl text-white  h-screen ${
          selectedUser || selectedGroup ? "max-md:hidden" : ""
        }`}
      >
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              onClick={() => {
                console.log("btn clicked");
                setShowAddMem(false);
              }}
              src={assets.arrow_icon}
              alt="arrow icon"
              className="max-w-7 max-h-7"
            />
            <div className="flex flex-col">
              <h1 className="font-medium text-gray-200">
                {selectedGroup?.name || "Group Name"}
              </h1>
              <p className="text-sm text-gray-400">Add members</p>
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
        {/* added members */}
        {selectedMembers.length > 0 && (
          <div className="relative p-2 flex  border-b border-gray-400 gap-3">
            {selectedMembers.map((user, index) => (
              <div key={user._id} className="relative">
                <img
                  src={user.profilePic || assets.avatar_icon}
                  className="max-w-7 rounded-full"
                />

                <p className="text-xs text-gray-400">{user.fullName}</p>
              </div>
            ))}
            <button
              onClick={handleAddGrpMem}
              className="absolute top-1/2 right-2 -translate-y-1/2 py-1 px-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded"
            >
              Add
            </button>
          </div>
        )}

        <div>
          {filteredUsers.map((user) => {
            const alreadyAdded = selectedMembers.some(
              (u) => u._id === user._id
            );
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
    )
  );
};

export default AddGrpMembers;
