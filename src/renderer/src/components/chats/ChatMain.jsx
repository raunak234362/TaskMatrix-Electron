/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/chat/ChatMain.tsx
import { Send } from "lucide-react";
import Button from "../fields/Button";
import ChatHead from "./ChatHead";
import socket from "../../socket";
import { useSelector } from "react-redux";
import { useCallback, useEffect, useRef, useState } from "react";
import Service from "../../api/Service";

import "./chatMain.css";



const ChatMain = ({ activeChat, setActiveChat, onMessageSent }) => {
  const userInfo = useSelector((state) => state.userData?.userData ?? state.userInfo?.userDetail ?? {});
  const staffData = useSelector((state) => state.userData?.staffData ?? state.userInfo?.staffData ?? []);

  const [currentConversation, setCurrentConversation] = useState({ messages: [] });
  const groupID = activeChat?.group?.id;
  const bottomRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [oldestMessageId, setOldestMessageId] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [isPaginating, setIsPaginating] = useState(false);
  const [isLiveMessage, setIsLiveMessage] = useState(false);

  const handleMessage = async () => {
    const content = inputValue.trim();
    if (!content || !groupID) return;

    const MessageData = {
      senderId: userInfo?.id,
      groupId: groupID,
      content,
      taggedUserIds: [],
    };
    socket.emit("groupMessages", MessageData);

    // Optimistic update
    const newMessage = {
      id: `${Date.now()}`,
      text: content,
      time: new Date().toISOString(),
      sender: "me",
      senderName: null,
    };

    setCurrentConversation((prev) => ({
      messages: [...(prev?.messages || []), newMessage],
    }));

    onMessageSent?.(content, groupID);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleMessage();
    }
  };

  const formatMessage = (text) => {
    if (!text) return "";
    const words = text.split(" ");
    let lines = [];
    let currentLine = [];

    words.forEach((word) => {
      currentLine.push(word);
      if (currentLine.length >= 20) {
        lines.push(currentLine.join(" "));
        currentLine = [];
      }
    });
    if (currentLine.length) lines.push(currentLine.join(" "));

    return lines.map((line, idx) => {
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="list-disc ml-4">
            {line.trim().slice(2)}
          </li>
        );
      }
      return (
        <p key={idx}>
          {line.split(" ").map((word, wIdx) => {
            if (word.startsWith("@") && word.length > 1) {
              return (
                <span key={wIdx} className="text-blue-600 font-semibold">
                  {word}{" "}
                </span>
              );
            }
            return word + " ";
          })}
        </p>
      );
    });
  };

  const fetchChatsByGroupID = async (targetGroupID, lastMsgId = null) => {
    try {
      const container = scrollContainerRef.current;
      const prevScrollHeight = container?.scrollHeight;

      setIsLoading(true);
      const response = await Service.ChatByGroupID(targetGroupID, lastMsgId ?? undefined);
      const list = Array.isArray(response) ? response : response?.data ?? [];

      if (list.length > 0) {
        const chatData = list.map((chat) => ({
          id: chat.id,
          text: chat.content,
          time: chat.createdAt,
          sender: chat.senderId === userInfo?.id ? "me" : "other",
          senderName:
            chat.senderId !== userInfo?.id
              ? `${chat.sender?.firstName ?? ""} ${chat.sender?.lastName ?? ""}`.trim()
              : null,
        }));

        const reversedChatData = chatData.reverse();
        setCurrentConversation((prev) => {
          const existingIds = new Set(prev?.messages.map((m) => m.id));
          const newMessages = reversedChatData.filter((m) => !existingIds.has(m.id));
          return {
            messages: [...newMessages, ...(prev?.messages || [])],
          };
        });

        setOldestMessageId(reversedChatData[0].id);
        if (list.length < 20) setHasMore(false);

        if (lastMsgId) {
          setIsPaginating(true);
          setTimeout(() => {
            if (container) {
              const newScrollHeight = container.scrollHeight;
              container.scrollTop = newScrollHeight - prevScrollHeight;
            }
            setIsPaginating(false);
          }, 0);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching chats by group ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (groupID) {
      setOldestMessageId(null);
      setHasMore(true);
      setCurrentConversation({ messages: [] });
      setIsFirstLoad(true);
      fetchChatsByGroupID(groupID, null);
    }
  }, [groupID]);

  useEffect(() => {
    const handleIncomingMessage = (msg) => {
      if (msg.groupId === groupID) {
        // Prevent duplicate if optimistically added
        setCurrentConversation((prev) => {
          if (prev.messages.some((m) => m.id === msg.id)) return prev;

          setIsLiveMessage(true);
          const isSenderMe = msg.senderId === userInfo?.id;
          const sender = staffData?.find((staff) => staff.id === msg.senderId);

          const newMessage = {
            id: msg.id,
            text: msg.content,
            time: msg.createdAt || new Date().toISOString(),
            sender: isSenderMe ? "me" : "other",
            senderName: sender ? `${sender.firstName} ${sender.lastName}` : "Unknown Sender",
          };

          return {
            messages: [...(prev?.messages || []), newMessage],
          };
        });
      }
    };

    socket.on("receiveGroupMessage", handleIncomingMessage);
    return () => socket.off("receiveGroupMessage", handleIncomingMessage);
  }, [groupID, userInfo?.id, staffData]);

  useEffect(() => {
    if (isFirstLoad && currentConversation?.messages?.length) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      setIsFirstLoad(false);
    } else if (isLiveMessage) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setIsLiveMessage(false);
    }
  }, [currentConversation?.messages, isFirstLoad, isLiveMessage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMore && !isLoading && !isPaginating) {
        fetchChatsByGroupID(groupID, oldestMessageId);
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [groupID, oldestMessageId, hasMore, isLoading, isPaginating]);

  if (!groupID || !activeChat?.group) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl items-center justify-center text-gray-700 text-sm">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div
      className="chat-main-bg flex flex-col h-full overflow-hidden"
    >
      <div className="shrink-0 py-2">
        <ChatHead contact={activeChat} onBack={() => setActiveChat(null)} />
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 min-h-0"
      >
        <div className="space-y-4">
          {isLoading && <div className="text-center text-gray-500 text-sm">Loading...</div>}
          {(() => {
            let lastMessageDate = null;
            return [...(currentConversation?.messages || [])]
              .sort((a, b) => new Date(a.time) - new Date(b.time))
              .map((msg) => {
                const messageDate = new Date(msg.time).toDateString();
                let showDateLabel = false;

                if (lastMessageDate !== messageDate) {
                  lastMessageDate = messageDate;
                  showDateLabel = true;
                }

                const today = new Date().toDateString();
                const yesterday = new Date(Date.now() - 86400000).toDateString();
                const dateLabel =
                  messageDate === today
                    ? "Today"
                    : messageDate === yesterday
                      ? "Yesterday"
                      : new Date(msg.time).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });

                return (
                  <div key={msg.id}>
                    {showDateLabel && (
                      <div className="flex justify-center mb-4 mt-2">
                        <span className="bg-gray-200/80 text-gray-600 text-[10px] font-bold uppercase tracking-widest py-1 px-3 rounded-full backdrop-blur-sm">
                          {dateLabel}
                        </span>
                      </div>
                    )}
                    <div className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"} mb-1`}>
                      <div
                        className={`max-w-[85%] md:max-w-[70%] p-3 rounded-2xl shadow-sm ${msg.sender === "me"
                          ? "bg-white/90 text-gray-800 rounded-tr-none"
                          : "bg-teal-50/90 text-gray-800 rounded-tl-none border border-teal-100"
                          }`}
                      >
                        {msg.sender !== "me" && msg.senderName && (
                          <p className="text-[10px] text-teal-600 font-black uppercase tracking-wider mb-1">
                            {msg.senderName}
                          </p>
                        )}
                        <div className="text-sm whitespace-pre-wrap wrap-break-word leading-relaxed">
                          {formatMessage(msg.text)}
                        </div>
                        <p className={`text-right text-[10px] mt-1 font-medium ${msg.sender === 'me' ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(msg.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              });
          })()}
          <div ref={bottomRef}></div>
        </div>
      </div>

      <div className="shrink-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-3">
        <div className="flex items-center space-x-2 w-full">
          <textarea
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 resize-none border-none bg-gray-100/50 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
          />
          <button
            onClick={handleMessage}
            className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 active:scale-95 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;
