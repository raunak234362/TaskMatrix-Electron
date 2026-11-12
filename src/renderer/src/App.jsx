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
import AppUpdateCenter from './components/common/AppUpdateCenter'
import { buildTimerPayload } from './hooks/useFloatingTimer'

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

  // ── Restore floating timer widget on app load / refresh ───────────────────
  useEffect(() => {
    if (!window.electronAPI) return  // running in browser — skip
    const restoreWidget = async () => {
      try {
        const response = await Service.GetNonCompletedTasks()
        const tasks = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Object.values(response?.data || response || {})
        const activeTask = tasks.find((t) => String(t.status || '').toUpperCase() === 'IN_PROGRESS') ||
          tasks.find((t) => ['BREAK', 'PAUSED', 'PAUSE'].includes(String(t.status || '').toUpperCase()))
        if (!activeTask) return

        // Fetch full task detail for workingHourTask
        const fullRes = await Service.GetTaskById(activeTask.id.toString())
        const fullTask = fullRes?.data || fullRes || activeTask
        const payload = buildTimerPayload(fullTask)
        if (payload) window.electronAPI.startTaskTimer(payload)
      } catch (err) {
        console.warn('Widget restore failed:', err)
      }
    }
    restoreWidget()
  }, []) // once on mount

  // Keep widget controls working while the task detail modal is closed.
  useEffect(() => {
    if (!window.electronAPI?.onWidgetAction) return

    const unsubscribe = window.electronAPI.onWidgetAction(async ({ action } = {}) => {
      if (!['pause', 'resume', 'stop'].includes(action)) return

      try {
        const response = await Service.GetNonCompletedTasks()
        const tasks = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Object.values(response?.data || response || {})
        const activeTask = tasks.find((task) => String(task.status || '').toUpperCase() === 'IN_PROGRESS') ||
          tasks.find((task) => ['BREAK', 'PAUSED', 'PAUSE'].includes(String(task.status || '').toUpperCase()))
        if (!activeTask?.id) {
          toast.info('No active task was found for the timer widget.')
          return
        }

        if (action === 'stop') {
          sessionStorage.setItem('widgetPendingStopTaskId', String(activeTask.id))
          window.dispatchEvent(new CustomEvent('taskmatrix:open-task', { detail: { taskId: activeTask.id } }))
          return
        }

        const detailResponse = await Service.GetTaskById(String(activeTask.id))
        const task = detailResponse?.data || detailResponse || activeTask
        if (action === 'resume') {
          await Service.TaskResume(String(task.id))
        } else {
          const activeSession = (task.workingHourTask || []).find((session) => !session.ended_at)
          const workId = activeSession?.id || activeSession?._id
          if (!workId) throw new Error('No active work session was found to pause.')
          await Service.TaskPause(String(task.id), { whId: workId })
        }
        window.dispatchEvent(new Event('task-updated'))
      } catch (error) {
        console.error('Floating timer action failed:', error)
        toast.error(error?.message || 'Could not update the active task from the timer widget.')
      }
    })

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  // Listen for system-lock events from the main process.
  useEffect(() => {
    if (window.api?.onSystemLocked) {
      const handleSystemLocked = async () => {
        toast.info("System Lock Detected: Checking for active tasks...", { autoClose: 10000 })
        console.log("System lock detected")
        try {
          const response = await Service.GetNonCompletedTasks()
          // Handle cases where response itself is the array, or response.data is the array
          const tasks = Array.isArray(response) ? response : (Array.isArray(response?.data) ? response.data : Object.values(response?.data || response || {}))
          const activeTask = tasks.find(t => t.status === 'IN_PROGRESS')
          
          if (activeTask) {
            toast.info(`Found active task: ${activeTask.id}. Fetching details...`, { autoClose: 10000 })

            // Fetch full task details to ensure we have workingHourTask
            const fullTaskRes = await Service.GetTaskById(activeTask.id.toString())
            const fullTask = fullTaskRes?.data || fullTaskRes || activeTask
            
            let active = fullTask.workingHourTask?.find((wh) => {
              return wh.ended_at === null || wh.ended_at === undefined || String(wh.ended_at).toLowerCase() === 'null' || !wh.ended_at
            })
            if (!active && fullTask.workingHourTask && fullTask.workingHourTask.length > 0) {
              const sorted = [...fullTask.workingHourTask].sort((a, b) => {
                const dateA = a.started_at ? new Date(a.started_at).getTime() : 0
                const dateB = b.started_at ? new Date(b.started_at).getTime() : 0
                return dateB - dateA
              })
              active = sorted[0]
            }
            const activeWorkID = active ? (active.id || active._id || null) : null
            if (activeWorkID) {
              toast.info(`Sending pause request for task ${activeTask.id}...`, { autoClose: 10000 })
              await Service.TaskPause(activeTask.id.toString(), { whId: activeWorkID })
              toast.success(`Task paused automatically due to system lock.`, { autoClose: 10000 })
              // Dispatch an event so any open modal can refresh. 
              // Add a delay to avoid race condition where DB hasn't committed yet.
              setTimeout(() => {
                window.dispatchEvent(new Event('task-updated'))
              }, 1500)
            } else {
              toast.warn(`Could not find an active working session (whId) for task ${activeTask.id}`, { autoClose: 10000 })
            }
          }

          const estResponse = await Service.GetEstimationTaskForME()
          const estTasks = Array.isArray(estResponse) ? estResponse : (Array.isArray(estResponse?.data) ? estResponse.data : Object.values(estResponse?.data || estResponse || {}))
          const activeEstTask = estTasks.find(t => t.status === 'IN_PROGRESS')
          if (activeEstTask) {
            const fullEstTaskRes = await Service.GetEstimationTaskById(activeEstTask.id.toString())
            const fullEstTask = fullEstTaskRes?.data || fullEstTaskRes || activeEstTask

            const activeEstWorkID = fullEstTask.workinghours?.find((wh) => wh.ended_at === null)?.id

            if (activeEstWorkID) {
              toast.info(`Sending pause request for est task ${activeEstTask.id}...`, { autoClose: 10000 })
              await Service.PauseEstimationTaskById(activeEstTask.id.toString(), { whId: activeEstWorkID })
              toast.success(`Estimation task paused automatically due to system lock.`, { autoClose: 10000 })
              setTimeout(() => {
                window.dispatchEvent(new Event('task-updated'))
              }, 1500)
            }
          }
        } catch (error) {
          toast.error(`Error pausing task: ${error?.message || error}`, { autoClose: 10000 })
          console.error('Error pausing active task on lock', error)
        }
      }

      return window.api.onSystemLocked(handleSystemLocked)
    }
  }, [])

  // Fetch current user
  const fetchSignedinUser = async () => {
    try {
      const response = await Service.GetUserByToken()
      const fetchedUser = response?.data?.user || response?.user || response?.data
      if (!fetchedUser?.id) throw new Error('Invalid user')

      sessionStorage.setItem('userId', fetchedUser.id)
      sessionStorage.setItem('username', fetchedUser.username)
      sessionStorage.setItem('firstName', fetchedUser.firstName)
      sessionStorage.setItem('lastName', fetchedUser.lastName)
      sessionStorage.setItem('userRole', fetchedUser.role)
      if (fetchedUser.designation) {
        sessionStorage.setItem('designation', fetchedUser.designation)
      }

      const fabId =
        response?.data?.FabricatorPointOfContacts?.[0]?.id ||
        response?.data?.data?.FabricatorPointOfContacts?.[0]?.id ||
        response?.data?.FabricatorPointOfContacts?.[0]?.fabricatorId ||
        response?.data?.data?.FabricatorPointOfContacts?.[0]?.fabricatorId ||
        fetchedUser?.fabricatorID ||
        fetchedUser?.fabricatorId

      if (fabId) {
        sessionStorage.setItem('fabricatorID', fabId)
      }

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

        // Also sync designation for current user if missing
        const currentUserId = sessionStorage.getItem('userId')
        const currentUsername = sessionStorage.getItem('username')?.toUpperCase()
        const currentDesig = sessionStorage.getItem('designation')
        if (data.length > 0 && (!currentDesig || currentDesig === 'undefined' || currentDesig === 'null')) {
          const matched = data.find(emp =>
            (currentUserId && (String(emp.id) === String(currentUserId) || String(emp._id) === String(currentUserId))) ||
            (currentUsername && String(emp.username || '').toUpperCase() === currentUsername)
          )
          if (matched?.designation) {
            sessionStorage.setItem('designation', matched.designation)
          }
        }
      } catch (err) {
        console.error('Failed to fetch employees:', err)
        toast.error('Failed to load employees')
      }
    }

    const fetchAllFabricator = async () => {
      try {
        const response = await Service.GetAllFabricators(1, 100)
        let data = []
        if (Array.isArray(response)) {
          data = response
        } else if (response?.data?.data && Array.isArray(response.data.data)) {
          data = response.data.data
        } else if (response?.data && Array.isArray(response.data)) {
          data = response.data
        } else if (response?.fabricators && Array.isArray(response.fabricators)) {
          data = response.fabricators
        }
        dispatch(loadFabricator(data))
      } catch (err) {
        console.error('Failed to fetch fabricators:', err)
        toast.error('Failed to load fabricators')
      }
    }

    const fetchInboxRFQ = async () => {
      try {
        const extractRfqList = (res) => {
          if (!res) return []
          if (Array.isArray(res)) return res
          if (Array.isArray(res.data)) return res.data
          if (Array.isArray(res.data?.data)) return res.data.data
          if (Array.isArray(res.data?.rfqs)) return res.data.rfqs
          if (Array.isArray(res.data?.result)) return res.data.result
          if (Array.isArray(res.rfqs)) return res.rfqs
          if (res.data && typeof res.data === 'object') {
            const arr = Object.values(res.data).find(Array.isArray)
            if (arr) return arr
          }
          if (typeof res === 'object') {
            const arr = Object.values(res).find(Array.isArray)
            if (arr) return arr
          }
          return []
        }

        let rfqs = []
        if (userType === 'CLIENT') {
          const res = await Service.RfqSent(1, 100)
          rfqs = extractRfqList(res).map((r) => ({ ...r, rfqType: 'Sent' }))
        } else {
          // Fetch both Received and All RFQs
          const [receivedRes, allRes] = await Promise.all([
            Service.RFQRecieved(1, 100),
            Service.FetchAllRFQ(1, 100)
          ])

          const receivedData = extractRfqList(receivedRes).map((r) => ({ ...r, rfqType: 'Received' }))
          const allData = extractRfqList(allRes).map((r) => ({ ...r, rfqType: 'All' }))

          // Combine with differentiation: prioritize 'Received' status
          const combined = [...receivedData]
          const receivedIds = new Set(combined.map((r) => String(r.id || r._id)))

          allData.forEach((item) => {
            const id = String(item.id || item._id)
            if (!receivedIds.has(id)) {
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
      <AppUpdateCenter />

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
