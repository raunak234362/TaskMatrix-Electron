import { useState, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Service from '../../../api/Service'

export const useDashboardData = () => {
  const user = useSelector((state) => state.userInfo?.userDetail)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])

  // Role Based Logic
  const userRoleRaw = sessionStorage.getItem('userRole')
  const userRole = (userRoleRaw || '').toLowerCase().trim()
  const isAdminRole = [
    'admin',
    'dept_manager',
    'operation_executive',
    'project_manager',
    'deputy_manager',
    'project_manager_officer'
  ].includes(userRole)

  console.log('🏁 useDashboardData Hook Init:', { userRoleRaw, userRole, isAdminRole })

  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    allocatedHours: 0,
    workedHours: 0,
    projectsCount: 0,
    efficiency: 0
  })

  // Admin Dashboard State
  const [adminData, setAdminData] = useState({
    projects: [],
    rfis: [],
    submittals: [],
    pendingSubmittals: [],
    pendingChangeOrders: [],
    pendingRFI: [],
    pendingRFQ: [],
    clientSidePendingSubmittals: [],
    clientSidePendingRFI: [],
    clientSidePendingRFQ: [],
    clientSidePendingCO: [],
    pmDashboard: [],
    projectStats: {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      onHoldProjects: 0
    },
    dashboardStats: {
      pendingRFI: 0,
      newRFI: 0,
      pendingSubmittals: 0,
      pendingChangeOrders: 0,
      newChangeOrders: 0,
      pendingRFQ: 0,
      newRFQ: 0
    },
    invoices: []
  })

  const parseDurationToHours = (duration) => {
    if (!duration) return 0
    if (typeof duration === 'number') return duration

    // Handle formats like "10:30", "10h 30m", "10"
    const parts = String(duration).split(/[:\s]+/)
    let hours = 0
    let minutes = 0

    if (parts.length >= 1) {
      hours = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
    }
    if (parts.length >= 2) {
      minutes = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
    }

    return hours + minutes / 60
  }

  const calculateHours = (task) => {
    // Try allocationLog first as it's the source for planned hours
    let allocated = 0
    if (task.allocationLog?.allocatedHours) {
      allocated = parseDurationToHours(task.allocationLog.allocatedHours)
    } else if (task.duration) {
      allocated = parseDurationToHours(task.duration)
    } else if (task.hours) {
      allocated = Number(task.hours) || 0
    }

    const worked =
      (task.workingHourTask || []).reduce(
        (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
        0
      ) / 3600
    return { allocated, worked }
  }

  const [memberStats, setMemberStats] = useState([])
  const [memberLoading, setMemberLoading] = useState(false)

  const fetchData = useCallback(async () => {
    console.log('🔍 fetchData called:', { userRole, isAdminRole })
    setLoading(true)
    try {
      if (isAdminRole) {
        // Fetch Admin Data
        let pmDashboardFromAPI = {}
        let computedPMStats = {}
        let projectsRes, rfiRes, subRes, coRes, rfqRes, pmDashboardRes, myTasksRes, invoicesRes, allRfqsRes
        let clientRfiRes, clientSubRes, clientCoRes, clientRfqRes, pendingSubRes

        const requests = [
          Service.GetAllProjects(),
          Service.FetchAllRFQ(),
          Service.GetAllInvoice(),
          Service.GetMyTask()
        ]

        if (userRole === 'project_manager' || userRole === 'assistant_project_manager') {
          requests.push(
            Service.pendingRFIsForProjectManager(),
            Service.GetPendingSubmittalForPM(),
            Service.PendingSubmittalForProjectManager(),
            Service.PendingCoForProjectManager(),
            Service.GetPendingRfiClientSide(),
            Service.GetPendingSubmittalClientSide(),
            Service.GetPendingChangeOrdersClientSide(),
            Service.GetPendingRfqClientSide(),
            Service.RFQRecieved(),
            Service.GetPMDashboard()
          )
        } else if (userRole === 'dept_manager') {
          requests.push(
            Service.GetPendingRfiDeptManager(),
            Service.GetPendingSubmittalDeptManager(),
            Service.GetPendingSubmittalDeptManager(),
            Service.GetPendingChangeOrdersDeptManager(),
            Service.GetPendingRfiClientSide(),
            Service.GetPendingSubmittalClientSide(),
            Service.GetPendingChangeOrdersClientSide(),
            Service.GetPendingRfqClientSide(),
            Service.RFQRecieved(),
            Service.DashboardDataProjectManager()
          )
        } else if (userRole === 'operation_executive') {
          requests.push(
            Service.GetPendingRfiOperationExecutive(),
            Service.GetPendingSubmittalOperationExecutive(),
            Service.GetPendingSubmittalOperationExecutive(),
            Service.GetPendingChangeOrdersOperationExecutive(),
            Service.GetPendingRfiClientSide(),
            Service.GetPendingSubmittalClientSide(),
            Service.GetPendingChangeOrdersClientSide(),
            Service.GetPendingRfqClientSide(),
            Service.GetPendingRfqOperationExecutive(),
            Service.getOperationExecutiveDashboard()
          )
        } else {
          // Admin, PMO, Deputy Manager
          requests.push(
            Service.pendingRFIs(),
            Service.PendingSubmittal(),
            Service.GetPendingChangeOrders(),
            Service.GetPendingRfq(),

            // Skip client-side APIs for PMO
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingRfiClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingSubmittalClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingChangeOrdersClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingRfqClientSide(),

            Service.GetDashboardData()
          )
        }

        const responses = await Promise.all(requests)
        console.log('✅ Responses received:', responses.length)

        // Map responses based on the order they were added
        projectsRes = responses[0]
        allRfqsRes = responses[1]
        invoicesRes = responses[2]
        myTasksRes = responses[3]

        if (userRole === 'project_manager' || userRole === 'assistant_project_manager' || userRole === 'dept_manager' || userRole === 'operation_executive') {
          rfiRes = responses[4]
          subRes = responses[5]
          pendingSubRes = responses[6] // Extra submittal for PM/Dept
          coRes = responses[7]
          clientRfiRes = responses[8]
          clientSubRes = responses[9]
          clientCoRes = responses[10]
          clientRfqRes = responses[11]
          rfqRes = responses[12]
          pmDashboardRes = responses[13]
        } else {
          // Admin, PMO, Deputy Manager mapping (indices 4-12)
          rfiRes = responses[4]
          subRes = responses[5]
          coRes = responses[6]
          rfqRes = responses[7]
          clientRfiRes = responses[8]
          clientSubRes = responses[9]
          clientCoRes = responses[10]
          clientRfqRes = responses[11]
          pmDashboardRes = responses[12]
        }

        // Fetch member workload if needed
        if (['dept_manager', 'project_manager', 'deputy_manager', 'admin', 'project_manager_officer'].includes(userRole)) {
          setMemberLoading(true)
          try {
            const [employeesRes, allTasksRes] = await Promise.all([
              Service.FetchAllEmployee(),
              Service.GetAllTask()
            ])

            // Robust data extraction for nested structures
            const employees = employeesRes?.data?.employees || employeesRes?.employees || employeesRes?.data || employeesRes || []
            const allGlobalTasks = allTasksRes?.data?.tasks || allTasksRes?.tasks || allTasksRes?.data || allTasksRes || []

            // Filter employees based on role (exclude admins and management roles from workload alerts)
            const excludedRoles = ['admin', 'operation_executive', 'project_manager_officer', 'dept_manager', 'deputy_manager']
            let filteredEmployees = Array.isArray(employees)
              ? employees.filter(e => e && !e.is_disabled && !excludedRoles.includes((e.role || '').toLowerCase()))
              : []

            if (userRole === 'project_manager') {
              const myTeamName = (user?.team?.name || sessionStorage.getItem('teamName') || '').toLowerCase().trim()
              if (myTeamName) {
                filteredEmployees = filteredEmployees.filter(e =>
                  (e.team?.name || '').toLowerCase().trim() === myTeamName
                )
              }
            } else if (userRole === 'dept_manager') {
              const myDeptName = (user?.department?.name || sessionStorage.getItem('deptName') || '').toLowerCase().trim()
              if (myDeptName) {
                filteredEmployees = filteredEmployees.filter(e =>
                  (e.department?.name || '').toLowerCase().trim() === myDeptName
                )
              }
            }
            // deputy_manager and admin see all

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1)

            const stats = filteredEmployees.map(emp => {
              const empTasks = allGlobalTasks.filter(t => {
                const tUserId = t.user_id || t.user?.id || t.userId || t.assignedToId
                if (String(tUserId) !== String(emp.id)) return false

                // Filter for today
                const tDateStr = t.start_date || t.startDate || t.date
                if (!tDateStr) return false
                const tDate = new Date(tDateStr)
                return tDate >= today && tDate < tomorrow
              })

              const assignedHours = empTasks.reduce((sum, task) => {
                const { allocated } = calculateHours(task)
                return sum + allocated
              }, 0)

              return {
                id: emp.id,
                name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || 'Unknown',
                assignedHours
              }
            })

            setMemberStats(stats)

            // Compute aggregate team stats for the dashboard overview
            if (['dept_manager', 'project_manager'].includes(userRole)) {
              const teamMemberIds = new Set(filteredEmployees.map(e => String(e.id)))
              const teamTasks = allGlobalTasks.filter(t => {
                const tUserId = t.user_id || t.user?.id || t.userId || t.assignedToId
                return teamMemberIds.has(String(tUserId))
              })

              const completed = teamTasks.filter(t =>
                ['COMPLETED', 'VALIDATE_COMPLETED'].includes((t.status || '').toUpperCase())
              ).length

              const overdue = teamTasks.filter(t => {
                if (['COMPLETED', 'VALIDATE_COMPLETED'].includes((t.status || '').toUpperCase())) return false
                const endDate = new Date(t.end_date || t.endDate || t.deadline)
                return endDate < today
              }).length

              const total = teamTasks.length
              const pending = total - completed
              const rate = total > 0 ? Math.round((completed / total) * 100) : 0

              computedPMStats = {
                completedTasks: completed,
                overdueTasks: overdue,
                pendingTasks: pending,
                totalTasks: total,
                taskCompletionRate: `${rate}%`,
                totalTeamMembers: filteredEmployees.length
              }
            }
          } catch (err) {
            console.error('Error fetching member workload:', err)
          } finally {
            setMemberLoading(false)
          }
        }

        // Robust data extraction helper
        const extractData = (res) => {
          if (!res) return []
          if (Array.isArray(res)) return res
          if (res?.data) {
            if (Array.isArray(res.data)) return res.data
            // Handle { data: { someKey: [...] } }
            const keys = Object.keys(res.data)
            for (const key of keys) {
              if (Array.isArray(res.data[key])) return res.data[key]
            }
          }
          // Handle { someKey: [...] }
          const keys = Object.keys(res)
          for (const key of keys) {
            if (Array.isArray(res[key])) return res[key]
          }
          return []
        }

        const projects = extractData(projectsRes)
        const rfis = extractData(rfiRes)
        const submittals = extractData(subRes)
        const pendingSubmittals = extractData(pendingSubRes) // Extra for PM/Dept
        const coList = extractData(coRes)
        const rfqList = extractData(rfqRes)
        const invoices = extractData(invoicesRes)
        const allRfqs = extractData(allRfqsRes)

        // Client Side
        const clientRfis = extractData(clientRfiRes)
        const clientSubmittals = extractData(clientSubRes)
        const clientCos = extractData(clientCoRes)
        const clientRfqs = extractData(clientRfqRes)

        // Merge pmDashboard root stats with nested .data stats
        const pmDataObj = pmDashboardRes?.data || pmDashboardRes || {}
        pmDashboardFromAPI = {
          ...(typeof pmDataObj === 'object' ? pmDataObj : {}),
          ...(typeof pmDataObj.data === 'object' ? pmDataObj.data : {})
        }

        const pmDashboard = {
          ...pmDashboardFromAPI,
          ...computedPMStats
        }

        setAdminData({
          projects,
          rfis,
          submittals,
          pendingSubmittals: (userRole === 'admin' || userRole === 'deputy_manager' || userRole === 'project_manager_officer') ? submittals : pendingSubmittals,
          pendingChangeOrders: coList,
          rfqs: rfqList,
          pendingRFI: rfis,
          pendingRFQ: rfqList,
          pendingCO: coList,
          clientSidePendingRFI: clientRfis,
          clientSidePendingSubmittals: clientSubmittals,
          clientSidePendingCO: clientCos,
          clientSidePendingRFQ: clientRfqs,
          pmDashboard,
          allRfqs,
          projectStats: {
            totalProjects: pmDashboard?.totalProjects ?? projects.length,
            activeProjects:
              pmDashboard?.totalActiveProjects ??
              projects.filter((p) => !p.status || p.status.toUpperCase() === 'ACTIVE').length,
            completedProjects:
              pmDashboard?.totalCompleteProject ??
              projects.filter((p) => p.status?.toUpperCase() === 'COMPLETED').length,
            onHoldProjects:
              pmDashboard?.totalOnHoldProject ??
              projects.filter((p) => p.status?.toUpperCase() === 'ON_HOLD').length
          },
          dashboardStats: {
            pendingRFI: (rfis.length + clientRfis.length) || pmDashboard?.pendingRFI || 0,
            pendingRfiWbt: rfis.length,
            pendingRfiClient: clientRfis.length,
            newRFI: pmDashboard?.newRFI ?? 0,
            pendingSubmittals: (
              (userRole === 'admin' || userRole === 'deputy_manager' || userRole === 'project_manager_officer')
                ? submittals.length
                : pendingSubmittals.length
            ) + clientSubmittals.length,
            pendingSubmittalsWbt: (userRole === 'admin' || userRole === 'deputy_manager' || userRole === 'project_manager_officer')
              ? submittals.length
              : pendingSubmittals.length,
            pendingSubmittalsClient: clientSubmittals.length,
            pendingChangeOrders: coList.length + clientCos.length,
            pendingChangeOrdersWbt: coList.length,
            pendingChangeOrdersClient: clientCos.length,
            newChangeOrders: pmDashboard?.newChangeOrders ?? 0,
            pendingRFQ: rfqList.length + clientRfqs.length,
            pendingRfqWbt: rfqList.length,
            pendingRfqClient: clientRfqs.length,
            newRFQ: pmDashboard?.newRFQ ?? 0
          },
          invoices: invoices
        })

        if (['dept_manager', 'operation_executive', 'admin', 'deputy_manager', 'project_manager_officer'].includes(userRole)) {
          console.log(`📊 ${userRole.toUpperCase()} Dashboard Data:`, {
            pmDashboard,
            projectStats: {
              totalProjects: pmDashboard?.totalProjects ?? projects.length,
              activeProjects: pmDashboard?.totalActiveProjects,
              completedProjects: pmDashboard?.totalCompleteProject,
              onHoldProjects: pmDashboard?.totalOnHoldProject
            },
            dashboardStats: {
              pendingRFI: pmDashboard?.pendingRFI ?? rfis.length,
              pendingSubmittals: pmDashboard?.pendingSubmittals ?? pendingSubmittals.length,
              pendingChangeOrders: pmDashboard?.pendingChangeOrders ?? pendingChangeOrders.length,
              pendingRFQ: pmDashboard?.pendingRFQ ?? rfqs.length
            }
          })
        }

        // Process Personal Tasks for Admin
        const myTasksData = myTasksRes?.data ?? myTasksRes
        if (myTasksData) {
          const fetchedTasks = Array.isArray(myTasksData)
            ? myTasksData
            : typeof myTasksData === 'object'
              ? Object.values(myTasksData || {})
              : []

          setTasks(fetchedTasks)

          // Calculate Stats
          let totalAllocated = 0
          let totalWorked = 0
          const completed = fetchedTasks.filter((t) => t.status === 'COMPLETED').length
          const projectIds = new Set()

          fetchedTasks.forEach((t) => {
            const { allocated, worked } = calculateHours(t)
            totalAllocated += allocated
            totalWorked += worked
            if (t.project?.id) projectIds.add(t.project.id)
          })

          setUserStats({
            totalTasks: fetchedTasks.length,
            completedTasks: completed,
            pendingTasks: fetchedTasks.length - completed,
            allocatedHours: totalAllocated,
            workedHours: totalWorked,
            projectsCount: projectIds.size,
            efficiency: totalWorked > 0 ? Math.round((totalAllocated / totalWorked) * 100) : 0
          })

          // Fetch Notes for unique projects
          const notesPromises = Array.from(projectIds).map((id) => Service.GetProjectNotes(id))
          const allNotesResponses = await Promise.all(notesPromises)
          const flattenedNotes = allNotesResponses.flat().filter(Boolean)
          setProjectNotes(flattenedNotes)
        }
      } else {
        // Fetch Staff Data
        const response = await Service.GetMyTask()

        if (response?.data) {
          const fetchedTasks = Array.isArray(response.data)
            ? response.data
            : Object.values(response.data || {})

          setTasks(fetchedTasks)

          // Calculate Stats
          let totalAllocated = 0
          let totalWorked = 0
          const completed = fetchedTasks.filter((t) => t.status === 'COMPLETED').length
          const projectIds = new Set()

          fetchedTasks.forEach((t) => {
            const { allocated, worked } = calculateHours(t)
            totalAllocated += allocated
            totalWorked += worked
            if (t.project?.id) projectIds.add(t.project.id)
          })

          setUserStats({
            totalTasks: fetchedTasks.length,
            completedTasks: completed,
            pendingTasks: fetchedTasks.length - completed,
            allocatedHours: totalAllocated,
            workedHours: totalWorked,
            projectsCount: projectIds.size,
            efficiency: totalWorked > 0 ? Math.round((totalAllocated / totalWorked) * 100) : 0
          })

          // Fetch Notes for unique projects
          const notesPromises = Array.from(projectIds).map((id) => Service.GetProjectNotes(id))
          const allNotesResponses = await Promise.all(notesPromises)
          const flattenedNotes = allNotesResponses.flat().filter(Boolean)
          setProjectNotes(flattenedNotes)
        }
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error)
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }, [isAdminRole, user?.team?.name, user?.department?.name, userRole])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    user,
    loading,
    tasks,
    projectNotes,
    userRole,
    isAdminRole,
    userStats,
    adminData,
    fetchData,
    memberStats,
    memberLoading
  }
}
