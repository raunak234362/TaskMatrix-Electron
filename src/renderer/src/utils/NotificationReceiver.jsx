/* eslint-disable no-unused-vars */
// src/renderer/src/utils/NotificationReceiver.jsx
import { useEffect } from "react";
import socket from "../socket";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

const NotificationReceiver = () => {
    const staffData = useSelector((state) => state?.userData?.staffData);

    const showBrowserNotification = (title, message) => {
        if (Notification.permission !== "granted") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, { body: message });
                }
            });
        } else {
            new Notification(title, { body: message });
        }
    };

    useEffect(() => {
        socket.on("customNotification", (payload) => {
            console.log("📥 Notification received:", payload);

            const title = payload.title || "🔔 New Alert";
            const message = payload.message || "You have a new notification.";

            showBrowserNotification(title, message);
            toast.info(message, { position: "top-right" });
        });

        socket.on("receivePrivateMessage", (msg) => {
            console.log("📩 Private message received:", msg);

            const title = "📩 Private Message";
            const message = typeof msg === "string" ? msg : msg?.content || "New private message.";

            showBrowserNotification(title, message);
            toast.info(message, { position: "top-right" });
            // update your chat UI with this message
        });

        socket.on("receiveGroupMessage", (msg) => {
            console.log("👥 Group message received:", msg);

            const title = "👥 Group Message";
            const message = msg?.content || "New group message.";

            showBrowserNotification(title, message);
            // Fixed: changed toast.toString to toast.info
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
