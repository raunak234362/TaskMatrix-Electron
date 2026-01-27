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



const ChatMain = ({
  activeChat,
  setActiveChat,
  onMessageSent,
}) => {
  const userInfo = useSelector(
    (s) => (s.userData?.userData ?? s.userInfo?.userDetail ?? {}),
  );
  const staffData = useSelector(
    (s) =>
      (s.userData?.staffData ?? s.userInfo?.staffData ?? []),
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [oldestId, setOldestId] = useState(null);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);
  const isInitialLoad = useRef(true);

  const groupId = activeChat?.group?.id ?? null;

  useEffect(() => {
    console.log("[ChatMain] Component State:", {
      groupId,
      userId: userInfo?.id,
      socketConnected: socket.connected,
      activeChatId: activeChat?.id,
    });
  }, [groupId, userInfo?.id, activeChat]);

  const sendMessage = () => {
    const content = input.trim();
    if (!content || !groupId) return;

    const payload = {
      senderId: userInfo?.id,
      groupId,
      content,
      taggedUserIds: [],
    };
    console.log("[ChatMain] Emitting groupMessages:", payload);
    socket.emit("groupMessages", payload);

    // Optimistic update
    const tempMsg = {
      id: Date.now().toString(), // Temporary ID
      text: content,
      time: new Date().toISOString(),
      sender: "me",
      senderName: `${userInfo?.firstName} ${userInfo?.lastName}`,
    };
    setMessages((prev) => [...prev, tempMsg]);
    onMessageSent?.(content, groupId);

    setInput("");
  };

  const fetchMessages = useCallback(
    async (lastId = null) => {
      if (!groupId) return;
      console.log("[ChatMain] Fetching messages...", { groupId, lastId });
      setLoading(true);
      try {
        const res = await Service.ChatByGroupID(groupId, lastId ?? undefined);
        console.log("[ChatMain] Fetch result:", res);
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
            ? res.data
            : [];
        const newMsgs = list.map((m) => ({
          id: m.id,
          text: m.content,
          time: m.createdAt,
          sender: m.senderId === userInfo?.id ? "me" : "other",
          senderName:
            m.senderId !== userInfo?.id
              ? `${m.sender?.firstName ?? ""} ${m.sender?.lastName ?? ""}`.trim()
              : undefined,
        }));

        if (newMsgs.length === 0) {
          setHasMore(false);
          return;
        }

        const reversed = newMsgs.reverse();
        setMessages((prev) => {
          const existing = new Set(prev.map((m) => m.id));
          const filtered = reversed.filter((m) => !existing.has(m.id));
          return [...filtered, ...prev];
        });

        setOldestId(reversed[0].id);
        if (newMsgs.length < 20) setHasMore(false);
      } catch (err) {
        console.error("[ChatMain] Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [groupId, userInfo.id],
  );

  // Load initial
  useEffect(() => {
    if (!groupId) return;
    setMessages([]);
    setOldestId(null);
    setHasMore(true);
    isInitialLoad.current = true;
    fetchMessages();
  }, [groupId, fetchMessages]);

  // Real‑time incoming
  useEffect(() => {
    const handler = (msg) => {
      console.log("[ChatMain] Socket received 'receiveGroupMessage':", msg);
      if (!groupId || msg.groupId !== groupId) {
        console.warn(
          "[ChatMain] Message ignored - Group mismatch or no GroupID",
          {
            currentGroupId: groupId,
            msgGroupId: msg.groupId,
          },
        );
        return;
      }

      // Check if message already exists to prevent duplicates
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) {
          console.log("[ChatMain] Duplicate message ignored:", msg.id);
          return prev;
        }

        const sender = staffData.find((s) => s?.id === msg.senderId);
        const newMsg = {
          id: msg.id,
          text: msg.content,
          time: msg.createdAt,
          sender: msg.senderId === userInfo?.id ? "me" : "other",
          senderName: sender
            ? `${sender.firstName} ${sender.lastName}`
            : undefined,
        };
        console.log("[ChatMain] Adding new real-time message:", newMsg);
        return [...prev, newMsg];
      });
    };
    console.log("[ChatMain] Setting up 'receiveGroupMessage' listener");
    socket.on("receiveGroupMessage", handler);
    return () => {
      console.log("[ChatMain] Removing 'receiveGroupMessage' listener");
      socket.off("receiveGroupMessage", handler);
    };
  }, [groupId, userInfo?.id, staffData]);

  // Scroll to bottom
  useEffect(() => {
    if (!bottomRef.current) return;
    
    // On initial load, scroll to bottom immediately without animation
    if (isInitialLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
      isInitialLoad.current = false;
    } else if (!isInitialLoad.current) {
      // For new incoming messages, scroll smoothly
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Infinite scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      if (container.scrollTop < 100 && hasMore && !loading) {
        fetchMessages(oldestId);
      }
    };
    container.addEventListener("scroll", onScroll);
    return () => container.removeEventListener("scroll", onScroll);
  }, [oldestId, hasMore, loading, groupId, fetchMessages]);

  const formatMessage = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      const words = line.split(" ");
      return (
        <p key={i} className="wrap-break-word">
          {words.map((w, j) =>
            w.startsWith("@") ? (
              <span key={j} className="text-blue-600 font-medium">
                {w}{" "}
              </span>
            ) : (
              w + " "
            ),
          )}
        </p>
      );
    });
  };

  if (!groupId || !activeChat?.group) {
    return (
      <div className="flex flex-col h-full bg-white rounded-2xl items-center justify-center text-gray-700 text-sm">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="chat-main-bg flex flex-col h-full">
      <ChatHead contact={activeChat} onBack={() => setActiveChat(null)} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
        {loading && (
          <div className="text-center text-sm text-gray-700">Loading...</div>
        )}
        {messages.map((msg) => {
          const time = new Date(msg.time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg?.id}
              className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"
                } mb-3`}
            >
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.sender === "me"
                  ? "bg-white/80 rounded-tr-none"
                  : "bg-green-100/90 rounded-tl-none"
                  }`}
              >
                {msg.sender === "other" && msg.senderName && (
                  <p className="text-xs font-semibold text-gray-700 mb-1">
                    {msg.senderName}
                  </p>
                )}
                <div className="text-sm">{formatMessage(msg.text)}</div>
                <p className="text-right text-xs text-gray-700 mt-1">{time}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white border-t">
        <div className="flex gap-2">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Button onClick={sendMessage} className="bg-green-600 text-white">
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatMain;
