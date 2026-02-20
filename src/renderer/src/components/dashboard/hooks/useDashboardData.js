import { useState, useCallback, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Service from '../../../api/Service'

export const useDashboardData = () => {
  const user = useSelector((state) => state.userInfo?.userDetail)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])

  // Role Based Logic
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const isAdminRole = [
    'admin',
    'dept_manager',
    'operation_executive',
    'project_manager',
    'department_manager',
    'project_manager_officer'
  ].includes(userRole)

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
    cos: [],
    rfqs: [],
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

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      if (isAdminRole) {
        // Fetch Admin Data
        let projectsRes, rfiRes, subRes, pendingSubRes, coRes, rfqRes, pmDashboardRes, myTasksRes

        if (
          userRole === 'project_manager' ||
          userRole === 'assistant_project_manager' ||
          userRole === 'project_manager_officer'
        ) {
          // Use specialized PM APIs
          ;[
            projectsRes,
            rfiRes,
            subRes,
            pendingSubRes,
            coRes,
            rfqRes,
            pmDashboardRes,
            myTasksRes
          ] = await Promise.all([
            Service.GetAllProjects(),
            Service.pendingRFIsForProjectManager(), // Specialized
            Service.GetPendingSubmittalForPM(), // Specialized
            Service.PendingSubmittalForProjectManager(), // Specialized
            Service.PendingCoForProjectManager(), // Specialized
            Service.RFQRecieved(),
            Service.GetPMDashboard(),
            Service.GetMyTask()
          ])
        } else {
          // Use Standard Admin APIs
          ;[projectsRes, rfiRes, subRes, pendingSubRes, coRes, rfqRes, pmDashboardRes, myTasksRes] =
            await Promise.all([
              Service.GetAllProjects(),
              Service.pendingRFIs(),
              Service.GetPendingSubmittal(),
              Service.PendingSubmittal(),
              Service.PendingCo(),
              Service.RFQRecieved(),
              Promise.resolve(null),
              Service.GetMyTask()
            ])
        }

        // Robust data extraction helper
        const extractData = (res) => {
          if (!res) return []
          if (Array.isArray(res)) return res
          if (res?.data && Array.isArray(res.data)) return res.data
          return []
        }

        const projects = extractData(projectsRes)
        const rfis = extractData(rfiRes)
        const submittals = extractData(subRes)
        const pendingSubmittals = extractData(pendingSubRes)
        const cos = extractData(coRes)
        const rfqs = extractData(rfqRes)

        // Merge pmDashboard root stats (like completedTasks) with nested .data stats
        const pmDashboard =
          pmDashboardRes?.data && typeof pmDashboardRes.data === 'object'
            ? { ...pmDashboardRes, ...pmDashboardRes.data }
            : pmDashboardRes || {}

        setAdminData({
          projects,
          rfis,
          submittals,
          pendingSubmittals,
          cos,
          pmDashboard,
          rfqs,
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
            pendingRFI: pmDashboard?.pendingRFI ?? rfis.length ?? 0,
            newRFI: pmDashboard?.newRFI || 0,
            pendingSubmittals: pmDashboard?.pendingSubmittals ?? pendingSubmittals.length ?? 0,
            pendingChangeOrders: pmDashboard?.pendingChangeOrders ?? cos.length ?? 0,
            newChangeOrders: pmDashboard?.newChangeOrders || 0,
            pendingRFQ: pmDashboard?.pendingRFQ ?? rfqs.length ?? 0,
            newRFQ: pmDashboard?.newRFQ || 0
          },
          invoices: []
        })

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
      console.error('Failed to fetch dashboard data', error)
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }, [isAdminRole])

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
    fetchData
  }
}
