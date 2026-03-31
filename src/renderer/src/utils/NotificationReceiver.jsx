/* eslint-disable no-unused-vars */
// src/renderer/src/utils/NotificationReceiver.jsx
import { useEffect } from "react";
import socket from "../socket";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { setActiveDetail } from "../store/uiSlice";

const NotificationReceiver = () => {
    const staffData = useSelector((state) => state?.userData?.staffData);

    const dispatch = useDispatch();

    // Send a native OS desktop notification via Electron main process IPC.
    // This works even when the app is minimized or not in focus.
    const sendDesktopNotification = async (title, message) => {
        try {
            if (window?.electron?.ipcRenderer) {
                const result = await window.electron.ipcRenderer.invoke('show-notification', { title, body: message });
                console.log('[NotificationReceiver] Desktop notification result:', result);
            } else {
                console.warn('[NotificationReceiver] window.electron.ipcRenderer not available');
            }
        } catch (err) {
            console.error('[NotificationReceiver] Failed to send desktop notification:', err);
        }
    };

    useEffect(() => {
        socket.on("customNotification", (payload) => {
            console.log("📥 Notification received:", payload);

            const title = payload.title || "🔔 New Alert";
            const message = payload.message || "You have a new notification.";

            // Normalize type and extract ID based on payload structure
            let type = payload.type;
            let id = payload.id || payload.itemId;

            // Mapping for specific notification types - prioritize specific ID fields
            if (payload.submittalId) {
                type = "submittal";
                id = payload.submittalId;
            } else if (payload.rfiId) {
                type = "rfi";
                id = payload.rfiId;
            } else if (payload.rfqId) {
                type = "rfq";
                id = payload.rfqId;
            } else if (payload.taskId) {
                type = "task";
                id = payload.taskId;
            } else if (payload.projectId) {
                type = "project";
                id = payload.projectId;
            } else if (payload.milestoneId) {
                type = "milestone";
                id = payload.milestoneId;
            } else if (type?.startsWith("SUBMITTAL")) {
                type = "submittal";
            } else if (type?.startsWith("RFI")) {
                type = "rfi";
            } else if (type?.startsWith("RFQ")) {
                type = "rfq";
            } else if (type?.startsWith("TASK")) {
                type = "task";
            } else if (type?.startsWith("PROJECT")) {
                type = "project";
            } else if (type?.startsWith("MILESTONE")) {
                type = "milestone";
            }
            console.log(type, "===========Type");
            console.log(id, "===========ID");

            sendDesktopNotification(title, message);

            toast.info(
                <div
                    className="flex flex-col gap-2 p-1 cursor-pointer select-none"
                    onClick={() => {
                        console.log("🔗 Notification Toast Clicked:", type, id);
                        if (type && id) {
                            dispatch(setActiveDetail({ type, id }));
                        }
                    }}
                >
                    <div className="flex flex-col gap-1">
                        <p className="font-bold text-sm tracking-tight text-gray-900">{title}</p>
                        <p className="text-xs text-gray-600 leading-normal">{message}</p>
                    </div>
                    {type && id && (
                        <div
                            className="mt-1 w-full bg-[#6bbd45] hover:bg-[#5aa33a] text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-lg transition-all shadow-sm text-center"
                        >
                            View Details
                        </div>
                    )}
                </div>,
                {
                    position: "bottom-right", // Changed to bottom-right sometimes it's more accessible
                    autoClose: 10000,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                }
            );
        });

        socket.on("receivePrivateMessage", (msg) => {
            console.log("📩 Private message received:", msg);

            const title = "📩 Private Message";
            const message = typeof msg === "string" ? msg : msg?.content || "New private message.";

            sendDesktopNotification(title, message);
            toast.info(message, { position: "top-right" });
            // update your chat UI with this message
        });

        socket.on("receiveGroupMessage", (msg) => {
            console.log("👥 Group message received:", msg);

            const title = "👥 Group Message";
            const message = msg?.content || "New group message.";

            sendDesktopNotification(title, message);
            toast.info(message, { position: "top-right" });
            // update your group chat UI
        });

        return () => {
            socket.off("customNotification");
            socket.off("receivePrivateMessage");
            socket.off("receiveGroupMessage");
        };
    }, []);

    return null;
};

export default NotificationReceiver;
