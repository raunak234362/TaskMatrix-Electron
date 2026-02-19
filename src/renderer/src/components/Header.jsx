import { useState, useEffect, useRef } from 'react'
import { Menu, ChevronLeft, Bell, X, Check } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { navItems } from '../constants/navigation'
import Service from '../api/Service'
import { toast } from 'react-toastify'

const Header = ({ isMinimized, toggleSidebar }) => {
  const location = useLocation()
  const [notifications, setNotifications] = useState(null)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef(null)
  const isFirstLoad = useRef(true)
  const prevNotifications = useRef([])

  const getPageTitle = () => {
    const currentPath = location.pathname
    const activeItem = navItems.find((item) => {
      if (item.to === '/dashboard') {
        return currentPath === '/dashboard'
      }
      return currentPath.includes(item.to)
    })
    return activeItem ? activeItem.label : 'Whiteboard Technologies'
  }

  const getNotificationContent = (notification) => {
    // Handle different payload structures
    const payload = notification.payload || {}
    let title = payload.title || 'Notification'
    let body = notification.message || payload.message || ''

    if (payload.type === 'DUPLICATE_TASK_ASSIGNMENT' && payload.body) {
      if (!title) title = 'Duplicate Task'
      body = payload.body.reason || 'Duplicate task assignment detected.'
    } else if (payload.body && typeof payload.body === 'object') {
      // Fallback for other types with body object
      body = payload.body.message || payload.body.reason || JSON.stringify(payload.body)
    }

    return { title, body }
  }

  const fetchNotifications = async () => {
    try {
      const responseData = await Service.Notifications()
      if (responseData) {
        let currentNotifications = Array.isArray(responseData)
          ? responseData
          : responseData.data || []

        // Sort by CreatedAt Descending
        currentNotifications = currentNotifications.sort((a, b) =>
          new Date(b.createdAt) - new Date(a.createdAt)
        )

        setNotifications(currentNotifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  // Handle Toasts for new notifications
  useEffect(() => {
    if (notifications === null) return

    if (isFirstLoad.current) {
      isFirstLoad.current = false
    } else {
      const newNotifs = notifications.filter(
        (n) => !prevNotifications.current.some((p) => p.id === n.id)
      )
      newNotifs.forEach((n) => {
        const { title, body } = getNotificationContent(n)
        toast.info(
          <div>
            <p className="font-bold text-sm">{title}</p>
            <p className="text-xs">{body}</p>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        )
      })
    }
    prevNotifications.current = notifications
  }, [notifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id, event) => {
    event.stopPropagation()
    try {
      await Service.MarkNotificationAsRead(id)
      setNotifications((prev) =>
        prev ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : prev
      )
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const safeNotifications = notifications || []
  const unreadCount = safeNotifications.filter((n) => !n.isRead).length

  return (
    <header className="flex flex-row justify-between items-center w-full min-h-[72px] px-8 bg-transparent relative z-50">
      {/* Left Area: Toggle & Page Title */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          className="p-2.5 text-black bg-[#ebf5ea] hover:bg-[#dcecdb] rounded-xl transition-all shadow-sm border border-black"
        >
          {isMinimized ? (
            <Menu size={20} className="stroke-[2.5]" />
          ) : (
            <ChevronLeft size={20} className="stroke-[2.5]" />
          )}
        </button>

        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gray-900 tracking-tight uppercase">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Right Area: Notifications Area Only */}
      <div className="flex items-center gap-6" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-2.5 transition-all group border border-black shadow-sm rounded-xl ${showNotifications ? 'bg-primary text-white' : 'text-black bg-white hover:bg-[#ebf5ea]'
              }`}
          >
            <Bell size={20} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900">Notifications</h3>
                <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-md border border-gray-200">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications === null && (
                  <div className="p-4 text-center">Loading...</div>
                )}
                {notifications !== null && notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-3">
                    <Bell className="w-8 h-8 text-gray-300" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {safeNotifications.map((notification) => {
                      const { title, body } = getNotificationContent(notification)
                      return (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 group relative ${!notification.isRead ? 'bg-blue-50/30' : ''
                            }`}
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-transparent'
                            }`} />

                          <div className="flex-1 pr-6">
                            <p className={`text-xs font-bold uppercase mb-1 ${!notification.isRead ? 'text-primary' : 'text-gray-500'}`}>
                              {title}
                            </p>
                            <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                              {body}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {!notification.isRead && (
                            <button
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              className="absolute right-2 top-4 p-1.5 text-blue-600 hover:bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Mark as read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
