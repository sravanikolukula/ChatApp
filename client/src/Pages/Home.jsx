import React, { useEffect, useState } from "react";
import Sidebar from "../Components/Sidebar.jsx";
import ChatContainer from "../Components/ChatContainer.jsx";
import RightSidebar from "../Components/RightSidebar.jsx";
import { useChatContext } from "../context/ChatContext.jsx";
import CreateGroup from "../Components/CreateGroup.jsx";
import AddGrpMembers from "../Components/AddGrpMembers.jsx";

const Home = () => {
  const {
    selectedUser,
    selectedGroup,
    isCreatingGroup,
    showAddMem,
    showRightSidebar,
    setShowRightSidebar,
  } = useChatContext();
  // const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="border w-full h-screen sm:py-[1%] sm:px-[1%] overflow-hidden">
      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full relative grid ${
          selectedUser || selectedGroup
            ? "grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]"
            : "grid-cols-1 md:grid-cols-2"
        }`}
      >
        {isCreatingGroup ? <CreateGroup /> : <Sidebar />}

        {/* ChatContainer logic */}
        {/* On desktop: always show ChatContainer */}
        {!isMobile && (
          <ChatContainer onHeaderClick={() => setShowRightSidebar(true)} />
        )}

        {/* On mobile: show ChatContainer only if user or group is selected */}
        {isMobile && (selectedUser || selectedGroup) && !showRightSidebar && (
          <ChatContainer onHeaderClick={() => setShowRightSidebar(true)} />
        )}

        {(selectedUser || selectedGroup) &&
          (isMobile ? (
            (showRightSidebar || showAddMem) &&
            (showAddMem ? (
              <AddGrpMembers isMobile />
            ) : (
              <RightSidebar
                isMobile
                onClose={() => setShowRightSidebar(false)}
              />
            ))
          ) : showAddMem ? (
            <AddGrpMembers isMobile={false} />
          ) : (
            <RightSidebar isMobile={false} />
          ))}
      </div>
    </div>
  );
};

export default Home;
