import { Provider, useDispatch, useSelector } from 'react-redux'
import store from './store/store'
import Layout from './layout/DashboardLayout'
import Service from './api/Service'
import { setUserData, showStaff } from './store/userSlice'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import socket, { connectSocket } from './socket'
import { loadFabricator } from './store/fabricatorSlice'
import { setRFQData } from './store/rfqSlice'
import { setProjectData } from './store/projectSlice'
import useNotifications from './hooks/useNotifications'
import NotificationReceiver from './utils/NotificationReceiver'
import GlobalModalManager from './components/common/GlobalModalManager'

const AppContent = () => {
  const dispatch = useDispatch()
  const userDetail = useSelector((state) => state.userData?.userData ?? state.userInfo?.userDetail)
  useNotifications()
  const userType = sessionStorage.getItem('userRole')

  // Connect socket when userDetail is available
  useEffect(() => {
    if (userDetail?.id) {
      connectSocket()
    }
  }, [userDetail?.id])

  // Listen for auto-update events from the main process
  useEffect(() => {
    if (window?.electron?.ipcRenderer) {
      const handleUpdateAvailable = (_, info) => {
        toast.info(`📢 A new version (${info?.version || ''}) is available! Downloading update...`, {
          autoClose: 8000,
          toastId: 'update-available'
        })
      }

      const handleUpdateDownloaded = (_, info) => {
        toast.success(
          <div className="flex flex-col gap-2">
            <span>🎉 Update version ${info?.version || ''} downloaded successfully!</span>
            <button
              onClick={() => window.electron.ipcRenderer.send('restart_app')}
              className="mt-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-xs transition cursor-pointer"
            >
              Restart & Apply Update
            </button>
          </div>,
          {
            position: "top-right",
            autoClose: false,
            closeOnClick: false,
            draggable: false,
            closeButton: true,
            toastId: 'update-downloaded'
          }
        )
      }

      window.electron.ipcRenderer.on('update-available', handleUpdateAvailable)
      window.electron.ipcRenderer.on('update-downloaded', handleUpdateDownloaded)

      return () => {
        window.electron.ipcRenderer.removeListener('update-available', handleUpdateAvailable)
        window.electron.ipcRenderer.removeListener('update-downloaded', handleUpdateDownloaded)
      }
    }
  }, [])

  /*
  // Electron IPC test handler
  const ipcHandle = () => {
    if (window?.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('ping')
      toast.info('📡 Sent IPC Ping to main process')
    } else {
      toast.warn('Electron IPC not available')
    }
  }
  */

  // Fetch current user
  const fetchSignedinUser = async () => {
    try {
      const response = await Service.GetUserByToken()
      const fetchedUser = response?.data?.user
      if (!fetchedUser?.id) throw new Error('Invalid user')

      sessionStorage.setItem('userId', fetchedUser.id)
      sessionStorage.setItem('username', fetchedUser.username)
      sessionStorage.setItem('firstName', fetchedUser.firstName)
      sessionStorage.setItem('lastName', fetchedUser.lastName)
      sessionStorage.setItem('userRole', fetchedUser.role)
      sessionStorage.setItem('designation', fetchedUser.designation)
      dispatch(setUserData(fetchedUser))
    } catch (err) {
      console.error('User fetch failed:', err)
      // toast.error('Failed to load user')
    }
  }

  useEffect(() => {
    // Fetch user once on mount
    fetchSignedinUser()

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission()
    }

    const fetchAllEmployee = async () => {
      try {
        const response = await Service.FetchAllEmployee()
        const data = response?.data?.employees || []
        dispatch(showStaff(data))
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        toast.error('Failed to load employees')
      }
    }

    const fetchAllFabricator = async () => {
      try {
        const response = await Service.GetAllFabricators()
        const data = response.data || []
        dispatch(loadFabricator(data))
      } catch (err) {
        console.error('Failed to fetch fabricators:', err)
        toast.error('Failed to load fabricators')
      }
    }

    const fetchInboxRFQ = async () => {
      try {
        let rfqs = []
        if (userType === 'CLIENT') {
          const res = await Service.RfqSent()
          rfqs = (res?.data || []).map((r) => ({ ...r, rfqType: 'Sent' }))
        } else {
          // Fetch both Received and All RFQs
          const [receivedRes, allRes] = await Promise.all([
            Service.RFQRecieved(),
            Service.FetchAllRFQ()
          ])

          const receivedData = (receivedRes?.data || []).map((r) => ({ ...r, rfqType: 'Received' }))
          const allData = (allRes?.data || []).map((r) => ({ ...r, rfqType: 'All' }))

          // Combine with differentiation: prioritize 'Received' status
          const combined = [...receivedData]
          const receivedIds = new Set(combined.map((r) => r.id))

          allData.forEach((item) => {
            if (!receivedIds.has(item.id)) {
              combined.push(item)
            }
          })
          rfqs = combined
        }
        dispatch(setRFQData(rfqs))
      } catch (error) {
        console.error('Error fetching RFQ:', error)
      }
    }

    const fetchAllProjects = async () => {
      try {
        const response = await Service.GetAllProjects()
        const data = response.data || []
        dispatch(setProjectData(data))
      } catch (err) {
        console.error('Failed to fetch projects:', err)
        toast.error('Failed to load projects')
      }
    }

    fetchAllFabricator()
    fetchAllEmployee()
    fetchInboxRFQ()
    fetchAllProjects()

    return () => {
      if (socket.connected) {
        socket.disconnect()
        console.log('🧹 Socket disconnected on unmount')
      }
    }
  }, [dispatch])

  return (
    <>
      <NotificationReceiver />

      {/* Main Layout */}
      <Layout />
      <GlobalModalManager />

      {/* IPC Trigger Button */}
      {/* <div className="fixed bottom-6 right-6 flex flex-col items-center z-50">
        <button
          onClick={ipcHandle}
          className="bg-[#6bbd45] hover:bg-[#5aa33a] text-white font-semibold rounded-2xl shadow-lg px-5 py-2 transition-transform hover:scale-105"
        >
          Send IPC
        </button>
      </div> */}
    </>
  )
}

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
)

export default App
