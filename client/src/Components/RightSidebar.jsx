import React, { useEffect, useState } from "react";
import assets, { imagesDummyData } from "../assets/assets.js";
import { useChatContext } from "../context/ChatContext";
import { useAuthContext } from "../context/AuthContext";

const RightSidebar = ({ isMobile, onClose }) => {
  const { onlineUsers, logout } = useAuthContext();
  const { selectedUser, setSelectedUser, messages } = useChatContext();
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages]);
  return (
    selectedUser && (
      <div
        className={`bg-[#818582]/10 text-white w-full relative overflow-y-scroll ${
          isMobile ? "block md:hidden" : "hidden md:block"
        }`}
      >
        {/*  {isMobile && (
           <button
            onClick={onClose}
            className="absolute top-2 left-2 z-50 bg-red-600 text-white px-2 py-1 rounded"
          >
            
          </button> 
        )} */}

        {isMobile && (
          <img
            src={assets.arrow_icon}
            alt="arrow-icon"
            /*     className="absolute top-2 left-2 z-50 w-3 h-3 text-white px-2 py-1 rounded" */
            onClick={onClose}
            className="absolute top-2 left-2  md:hidden invert max-w-7"
          />
        )}
        <div className="pt-6 flex flex-col items-center justify-center text-xs font-light gap-2">
          <img
            src={selectedUser?.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 aspect-[1/1] rounded-full cursor-pointer"
          />

          <h1 className="px-10 text-md font-medium mx-auto  flex items-center gap-2">
            {onlineUsers.includes(selectedUser._id) && (
              <p className="w-2 h-2 rounded-full bg-green-500"></p>
            )}
            {selectedUser.fullName}
          </h1>
          <p className="px-10 m-auto">{selectedUser.bio}</p>
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
        <button
          onClick={() => {
            setSelectedUser(null);
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
