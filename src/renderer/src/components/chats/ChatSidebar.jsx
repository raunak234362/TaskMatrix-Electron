// src/components/chat/ChatSidebar.tsx
import { useEffect } from "react";
import { MdGroupAdd } from "react-icons/md";
import { TiUserAdd } from "react-icons/ti";
import Button from "../fields/Button";
import Service from "../../api/Service";


const ChatSidebar = ({
  recentChats,
  activeChat,
  unreadChatIds,
  setActiveChat,
  setUnreadChatIds,
  onAddGroupClick,
  setRecentChats,
  refreshKey,
}) => {
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await Service.AllChats();
        const rawList = Array.isArray(response)
          ? response
          : response?.data;
        const normalized = (Array.isArray(rawList) ? rawList : [])
          .map((chat) => {
            if (!chat?.group?.id || !chat?.group?.name) {
              return null;
            }
            const fallbackTimestamp =
              chat?.updatedAt ||
              chat?.timestamp ||
              chat?.createdAt ||
              chat?.group?.updatedAt ||
              chat?.group?.createdAt ||
              new Date().toISOString();
            const unread =
              typeof chat?.unread === "number"
                ? chat.unread
                : typeof chat?.unreadCount === "number"
                  ? chat.unreadCount
                  : undefined;

            return {
              id: chat?.id ?? chat.group.id,
              group: {
                id: chat.group.id,
                name: chat.group.name,
              },
              lastMessage: chat?.lastMessage ?? undefined,
              unread,
              updatedAt: fallbackTimestamp,
            };
          })
          .filter((chat) => Boolean(chat))
          .sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

        setRecentChats(normalized);
      } catch (error) {
        console.error("Failed to fetch chats", error);
      }
    };

    fetchChats();
  }, [setRecentChats, refreshKey]);

  const selectChat = (chat) => {
    setActiveChat(chat);
    setUnreadChatIds((prev) => prev.filter((id) => id !== chat.group.id));
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200 rounded-l-2xl">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Chats</h2>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {recentChats.map((chat) => {
          const isActive = activeChat?.group?.id === chat.group.id;
          const hasUnread =
            unreadChatIds.includes(chat.group.id) || (chat.unread ?? 0) > 0;

          return (
            <div
              key={chat.id}
              onClick={() => selectChat(chat)}
              className={`p-3 rounded-lg cursor-pointer transition ${isActive ? "bg-[#eef7e9]" : "hover:bg-gray-100"
                }`}
            >
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">{chat.group.name}</h3>
                <span className="text-xs text-gray-600">
                  {new Date(chat.updatedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-600 truncate max-w-[140px]">
                  {chat.lastMessage || "No messages"}
                </p>
                {hasUnread && !isActive && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Buttons */}
      <div className="p-3 border-t flex gap-2">
        <Button
        //   onClick={() => setPrivateChatOpen(true)}
        >
          <TiUserAdd className="w-5 h-5" />
        </Button>
        <Button onClick={onAddGroupClick}>
          <MdGroupAdd className="w-5 h-5" />
        </Button>
      </div>

      {/* Modals */}
      {/* {addGroupOpen && <AddGroupModal onClose={() => setAddGroupOpen(false)} />}
      {privateChatOpen && (
        <AddGroupModal onClose={() => setPrivateChatOpen(false)} isPrivate />
      )} */}
    </div>
  );
};

export default ChatSidebar;
