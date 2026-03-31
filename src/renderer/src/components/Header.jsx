import { useState, useEffect, useRef } from 'react'
import { Menu, ChevronLeft, Bell, X, Check } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { navItems } from '../constants/navigation'
import Service from '../api/Service'
import { toast } from 'react-toastify'
import { setActiveDetail } from '../store/uiSlice'
import { setModalOpen } from '../store/userSlice'

const Header = ({ isMinimized, toggleSidebar, isMobileOpen }) => {
  const location = useLocation()
  const dispatch = useDispatch()
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
    const payload = notification.payload || {}
    const type = notification.type || payload.type || ''
    const severity = notification.severity || payload.severity || ''

    let title = notification.title || payload.title || ''
    let body = notification.message || payload.message || ''
    let color = 'text-primary'

    // 1. Task Conflict / Duplicate Detection
    if (notification.reason || payload.reason) {
      const reason = notification.reason || payload.reason
      const taskName = notification.taskName || payload.taskName
      const projectName = notification.projectName || payload.projectName
      const userName = notification.userName || payload.userName

      title = title || (severity === 'HIGH' ? 'Critical conflict' : 'Task Conflict')
      body = body || `${reason}${projectName ? ` in ${projectName}` : ''}${taskName ? ` (${taskName})` : ''}${userName ? ` assigned to ${userName}` : ''}`

      if (severity === 'HIGH') color = 'text-red-600'
      else if (severity === 'MEDIUM') color = 'text-orange-500'
    }
    // 2. Submittal / RFI Notifications
    else if (type.includes('SUBMITTAL') || type.includes('RFI')) {
      title = title || (type.includes('SUBMITTAL') ? 'Submittal Update' : 'RFI Update')
      body = body || notification.message || payload.message || 'New document activity.'
      color = 'text-emerald-500'
    }
    // 3. Project Timeline Changes
    else if (type === 'PROJECT_END_DATE_CHANGED') {
      title = title || 'Schedule Update'
      body = body || notification.message || payload.message || 'Project end date has been updated.'
      color = 'text-blue-500'
    }

    // Fallback if body is still missing but exists in a body object nested in payload
    if (!body && payload.body) {
      if (typeof payload.body === 'string') body = payload.body
      else body = payload.body.message || payload.body.reason || JSON.stringify(payload.body)
    }

    return {
      title: title || 'Notification',
      body: body || 'You have a new update.',
      color
    }
  }

  // Helper to extract entity info for redirection
  const extractEntityInfo = (notification) => {
    const payload = notification.payload || {}
    let type = notification.type || payload.type || ''
    let id = notification.id || payload.id || notification.itemId || payload.itemId

    if (notification.submittalId || payload.submittalId) {
      type = 'submittal'
      id = notification.submittalId || payload.submittalId
    } else if (notification.rfiId || payload.rfiId) {
      type = 'rfi'
      id = notification.rfiId || payload.rfiId
    } else if (notification.rfqId || payload.rfqId) {
      type = 'rfq'
      id = notification.rfqId || payload.rfqId
    } else if (notification.taskId || payload.taskId) {
      type = 'task'
      id = notification.taskId || payload.taskId
    } else if (notification.projectId || payload.projectId) {
      type = 'project'
      id = notification.projectId || payload.projectId
    } else if (notification.milestoneId || payload.milestoneId) {
      type = 'milestone'
      id = notification.milestoneId || payload.milestoneId
    } else if (type?.startsWith('SUBMITTAL')) {
      type = 'submittal'
    } else if (type?.startsWith('RFI')) {
      type = 'rfi'
    } else if (type?.startsWith('RFQ')) {
      type = 'rfq'
    } else if (type?.startsWith('TASK')) {
      type = 'task'
    } else if (type?.startsWith('PROJECT')) {
      type = 'project'
    } else if (type?.startsWith('MILESTONE')) {
      type = 'milestone'
    }

    return { type, id }
  }

  const handleNotificationClick = (notification) => {
    const { type, id } = extractEntityInfo(notification)
    console.log('🔗 Redirecting from Header:', type, id)
    if (type && id) {
      dispatch(setActiveDetail({ type, id }))
      dispatch(setModalOpen(true))
      setShowNotifications(false)
    }
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

  // Handle sync of previous notifications for unread count, but don't show toasts here
  // (NotificationReceiver.jsx handles real-time toasts via socket)
  useEffect(() => {
    if (notifications === null) return
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
        prev ? prev.map((n) => (n.id === id ? { ...n, read: true } : n)) : prev
      )
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const safeNotifications = notifications || []
  const unreadCount = safeNotifications.filter((n) => n.read === false).length

  return (
    <header className="flex flex-row justify-between items-center w-full min-h-[72px] px-8 bg-transparent relative z-50">
      {/* Left Area: Toggle & Page Title */}
      <div className="flex items-center gap-6">
        <button
          onClick={toggleSidebar}
          onMouseEnter={() => {
            if (window.innerWidth < 768) {
              if (!isMobileOpen) toggleSidebar()
            } else {
              if (isMinimized) toggleSidebar()
            }
          }}
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
                      const { title, body, color } = getNotificationContent(notification)
                      const isUnread = notification.read === false
                      return (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-3 group relative cursor-pointer ${isUnread ? 'bg-blue-50/30' : ''
                            }`}
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${isUnread ? 'bg-blue-500' : 'bg-transparent'
                            }`} />

                          <div className="flex-1 pr-6 text-left">
                            <p className={`text-[10px] font-black uppercase mb-1 ${isUnread ? color : 'text-gray-400'}`}>
                              {title}
                            </p>
                            <p className={`text-xs leading-relaxed ${isUnread ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
                              {body}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-2 block font-medium">
                              {new Date(notification.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {isUnread && (
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
