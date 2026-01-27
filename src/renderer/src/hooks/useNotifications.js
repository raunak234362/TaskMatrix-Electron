import { useEffect } from 'react'
import socket from '../socket'
import { useSelector } from 'react-redux'

const useNotifications = () => {
  const userInfo = useSelector((s) => s.userData?.userData ?? s.userInfo?.userDetail ?? {})

  useEffect(() => {
    const handleMessage = (msg) => {
      // Don't notify if it's our own message
      if (msg.senderId === userInfo?.id) return

      const isChatsPage = window.location.pathname.includes('/chats')

      // Notify if:
      // 1. Document is hidden (user is in another tab)
      // 2. User is NOT on the chats page
      // (If they are on the chats page, they'll see the message in real-time)
      if (document.hidden || !isChatsPage) {
        const title = 'New Chat Message'
        const options = {
          body: msg.content,
          icon: '/pwa-192x192.png',
          tag: msg.groupId
        }

        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, options)
          })
        } else if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, options)
        }
      }
    }

    socket.on('receiveGroupMessage', handleMessage)
    return () => {
      socket.off('receiveGroupMessage', handleMessage)
    }
  }, [userInfo?.id])
}

export default useNotifications
