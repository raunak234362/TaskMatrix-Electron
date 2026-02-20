import { useEffect } from 'react'
import socket from '../socket'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

const useNotifications = () => {
  const userInfo = useSelector((s) => s.userData?.userData ?? s.userInfo?.userDetail ?? {})
  const staffData = useSelector((s) => s.userData?.staffData ?? s.userInfo?.staffData ?? [])

  useEffect(() => {
    const handleMessage = (msg) => {
      // Don't notify if it's our own message
      if (msg.senderId === userInfo?.id) return

      // Accurate path check for HashRouter
      const currentHash = window.location.hash
      const isChatsPage = currentHash.includes('/chats')

      // Get active chat from sessionStorage to check if we are currently viewing this group
      let activeGroupId = null
      try {
        const saved = sessionStorage.getItem('activeChat')
        if (saved) {
          const parsed = JSON.parse(saved)
          activeGroupId = parsed?.group?.id
        }
      } catch (e) {
        console.error('Error parsing activeChat for notification:', e)
      }

      const isCurrentGroup = activeGroupId === msg.groupId

      // Notify if:
      // 1. Tab is hidden
      // 2. Not on chats page
      // 3. On chats page but viewing a DIFFERENT group
      if (document.hidden || !isChatsPage || !isCurrentGroup) {
        const sender = staffData?.find((s) => s.id === msg.senderId)
        const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'New Message'

        const title = `Chat: ${senderName}`
        const options = {
          body: msg.content,
          icon: '/pwa-192x192.png',
          tag: msg.groupId,
          renotify: true
        }

        // 1. Browser/System Notification
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, options)
              })
            } else {
              new Notification(title, options)
            }
          } catch (err) {
            console.error('Notification error:', err)
          }
        }

        // 2. In-app Toast Notification
        toast.info(
          <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{title}</span>
            <span className="text-xs line-clamp-1 opacity-90">{msg.content}</span>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            toastId: `msg-${msg.id}` // Prevent duplicate toasts
          }
        )
      }
    }

    socket.on('receiveGroupMessage', handleMessage)
    return () => {
      socket.off('receiveGroupMessage', handleMessage)
    }
  }, [userInfo?.id, staffData])
}

export default useNotifications
