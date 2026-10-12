// src/pages/Chats.tsx
import { useState, useCallback, useEffect } from "react";
import ChatMain from "./ChatMain";
import ChatSidebar from "./ChatSidebar";
import useGroupMessages from "../../hooks/userGroupMessages";

import AddChatGroup from "./AddChatGroup";

const Chats = ({ projectName, project }) => {
  const [recentChats, setRecentChats] = useState([]);
  const [activeChat, setActiveChat] = useState(() => {
    if (projectName) return null;
    try {
      const saved = sessionStorage.getItem('activeChat');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    if (projectName) return;
    if (activeChat) {
      sessionStorage.setItem('activeChat', JSON.stringify(activeChat));
    } else {
      sessionStorage.removeItem('activeChat');
    }
  }, [activeChat, projectName]);

  const [unreadIds, setUnreadIds] = useState([]);
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Real‑time updates
  const handleGroupMessage = useCallback(
    (msg) => {
      setRecentChats((prev) => {
        const updated = prev.map((c) =>
          c.group.id === msg.groupId
            ? { ...c, lastMessage: msg.content, updatedAt: msg.createdAt }
            : c,
        );
        const target = updated.find((c) => c.group.id === msg.groupId);
        if (!target) return prev;

        const filtered = updated.filter((c) => c.group.id !== msg.groupId);
        return [target, ...filtered];
      });

      if (msg.groupId !== activeChat?.group?.id) {
        setUnreadIds((prev) =>
          prev.includes(msg.groupId) ? prev : [...prev, msg.groupId],
        );
      }
    },
    [activeChat?.group?.id, recentChats],
  );

  useGroupMessages(handleGroupMessage);

  useEffect(() => {
    const projectChat = recentChats[0];
    if (
      projectName &&
      projectChat &&
      activeChat?.group?.id !== projectChat.group.id
    ) {
      setActiveChat(projectChat);
    }
  }, [projectName, recentChats, activeChat?.group?.id]);

  const handleMessageSent = (content, groupId) => {
    setRecentChats((prev) => {
      const updated = prev.map((c) =>
        c.group.id === groupId
          ? { ...c, lastMessage: content, updatedAt: new Date().toISOString() }
          : c,
      );
      const target = updated.find((c) => c.group.id === groupId);
      if (!target) return prev;

      const filtered = updated.filter((c) => c.group.id !== groupId);
      return [target, ...filtered];
    });
  };

  const handleAddGroupClick = () => {
    setActiveChat(null);
    setIsAddGroupOpen(true);
  };

  const handleCloseAddGroup = () => setIsAddGroupOpen(false);
  const handleGroupCreated = () => {
    setRefreshKey((prev) => prev + 1);
    setIsAddGroupOpen(false);
  };

  return (
    <div
      className={`flex w-full ${projectName ? "h-[min(65vh,600px)] min-h-[360px]" : "h-full"} overflow-y-hidden bg-gray-50 rounded-2xl`}
    >
      {/* Desktop */}
      <div className="hidden md:flex w-full h-full rounded-2xl">
        <div className={projectName ? "hidden" : "w-80 border-r h-full"}>
          <ChatSidebar
            recentChats={recentChats}
            activeChat={activeChat}
            unreadChatIds={unreadIds}
            setActiveChat={setActiveChat}
            setUnreadChatIds={setUnreadIds}
            onAddGroupClick={handleAddGroupClick}
            setRecentChats={setRecentChats}
            refreshKey={refreshKey}
            projectName={projectName}
          />
        </div>
        <div className={`${projectName ? "w-full" : "flex-1"} h-full`}>
          {!projectName && isAddGroupOpen ? (
            <AddChatGroup
              onClose={handleCloseAddGroup}
              onCreated={handleGroupCreated}
            />
          ) : activeChat ? (
            <ChatMain
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              recentChats={recentChats}
              onMessageSent={handleMessageSent}
              project={project}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-700">
              {projectName ? "No project chat group found" : "Select a chat to start messaging"}
            </div>
          )}
        </div>
      </div>

      {/* Mobile */}
      <div className="md:hidden w-full h-full">
        {projectName ? (
          activeChat ? (
            <ChatMain
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              recentChats={recentChats}
              onMessageSent={handleMessageSent}
              project={project}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-700">
              No project chat group found
            </div>
          )
        ) : isAddGroupOpen ? (
          <AddChatGroup
            onClose={handleCloseAddGroup}
            onCreated={handleGroupCreated}
          />
        ) : !activeChat ? (
          <ChatSidebar
            recentChats={recentChats}
            activeChat={activeChat}
            unreadChatIds={unreadIds}
            setActiveChat={setActiveChat}
            setUnreadChatIds={setUnreadIds}
            onAddGroupClick={handleAddGroupClick}
            setRecentChats={setRecentChats}
            refreshKey={refreshKey}
            projectName={projectName}
          />
        ) : (
          <ChatMain
            activeChat={activeChat}
            setActiveChat={setActiveChat}
            recentChats={recentChats}
            onMessageSent={handleMessageSent}
            project={project}
          />
        )}
      </div>
    </div>
  );
};

export default Chats;
