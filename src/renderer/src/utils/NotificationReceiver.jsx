/* eslint-disable no-unused-vars */
// src/renderer/src/utils/NotificationReceiver.jsx
import { useEffect } from "react";
import socket from "../socket";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const NotificationReceiver = () => {
    const staffData = useSelector((state) => state?.userData?.staffData);

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

            sendDesktopNotification(title, message);
            toast.info(message, { position: "top-right" });
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
