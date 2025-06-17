import React, { useState } from "react";
import Sidebar from "../Components/Sidebar.jsx";
import ChatContainer from "../Components/ChatContainer.jsx";
import RightSidebar from "../Components/RightSidebar.jsx";
import { useChatContext } from "../context/ChatContext.jsx";

const Home = () => {
  const { selectedUser } = useChatContext();
  return (
    <div className="border w-full h-screen  sm:py-[1%] sm:px-[1%] overflow-hidden">
      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full relative ${
          selectedUser
            ? "grid md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
            : "grid grid-cols-2"
        }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
