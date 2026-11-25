import { useState, useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Service from '../../../api/Service'
import SelfTaskService from '../../../api/services/selftask.service'
import {
  initialAdminData,
  initialUserStats,
  patchWbtAdminData,
  patchWbtDashboard,
  setWbtDashboardData
} from '../../../store/dashboardSlice'

const extractDataList = (res) => {
  if (!res) return []
  if (Array.isArray(res)) return res
  if (res?.data) {
    if (Array.isArray(res.data)) return res.data
    const keys = Object.keys(res.data)
    for (const key of keys) {
      if (Array.isArray(res.data[key])) return res.data[key]
    }
  }
  const keys = Object.keys(res)
  for (const key of keys) {
    if (Array.isArray(res[key])) return res[key]
  }
  return []
}

const parseDurationToHours = (duration) => {
  if (!duration) return 0
  if (typeof duration === 'number') return duration

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

const buildPersonalTaskMetrics = async (rawTasksData) => {
  if (!rawTasksData) {
    return {
      tasks: [],
      userStats: { ...initialUserStats },
      projectNotes: []
    }
  }

  const fetchedTasks = Array.isArray(rawTasksData)
    ? rawTasksData
    : typeof rawTasksData === 'object'
      ? Object.values(rawTasksData || {})
      : []

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

  const stats = {
    totalTasks: fetchedTasks.length,
    completedTasks: completed,
    pendingTasks: fetchedTasks.length - completed,
    allocatedHours: totalAllocated,
    workedHours: totalWorked,
    projectsCount: projectIds.size,
    efficiency: totalWorked > 0 ? Math.round((totalAllocated / totalWorked) * 100) : 0
  }

  const notesPromises = Array.from(projectIds).map((id) =>
    Service.GetProjectNotes(id).catch(() => [])
  )
  const allNotesResponses = await Promise.all(notesPromises)
  const flattenedNotes = allNotesResponses.flat().filter(Boolean)

  return {
    tasks: fetchedTasks,
    userStats: stats,
    projectNotes: flattenedNotes
  }
}

export const useDashboardData = () => {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.userInfo?.userDetail)
  const cachedDashboard = useSelector((state) => state.dashboardInfo?.wbtDashboard)

  // Role Based Logic
  const userRoleRaw = sessionStorage.getItem('userRole')
  const userRole = (userRoleRaw || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
  const userId = sessionStorage.getItem('userId') || user?.id || ''
  const cacheKey = `${userId}:${userRole}`
  const isAdminRole = [
    'admin',
    'dept_manager',
    'operation_executive',
    'project_manager',
    'deputy_manager',
    'project_manager_officer',
    'human_resource'
  ].includes(userRole)

  const isCacheValid = Boolean(
    cachedDashboard?.initialized && cachedDashboard?.cacheKey === cacheKey
  )
  const isStale = Boolean(cachedDashboard?.stale)

  const [loading, setLoading] = useState(!isCacheValid)
  const [memberLoading, setMemberLoading] = useState(false)

  const isCacheValidRef = useRef(isCacheValid)
  isCacheValidRef.current = isCacheValid
  const inFlightRef = useRef(false)
  const queuedRefreshRef = useRef(false)

  const tasks = isCacheValid ? cachedDashboard.tasks : []
  const selfTasks = isCacheValid ? cachedDashboard.selfTasks : []
  const projectNotes = isCacheValid ? cachedDashboard.projectNotes : []
  const unreadComments = isCacheValid ? cachedDashboard.unreadComments : []
  const unapprovedListsCount = isCacheValid ? cachedDashboard.unapprovedListsCount : 0
  const userStats = isCacheValid ? cachedDashboard.userStats : initialUserStats
  const adminData = isCacheValid ? cachedDashboard.adminData : initialAdminData
  const memberStats = isCacheValid ? cachedDashboard.memberStats : []

  const fetchData = useCallback(async (options) => {
    const isBackground = Boolean(options?.background) || isCacheValidRef.current

    if (inFlightRef.current) {
      queuedRefreshRef.current = true
      return
    }

    inFlightRef.current = true
    if (!isBackground) {
      setLoading(true)
    }

    // Fetch Unread Comments async without blocking other data
    const fetchUnread = ['admin', 'deputy_manager', 'dept_manager', 'project_manager'].includes(userRole)
      ? Service.FetchUnreadCommentsMyTeam()
      : Service.FetchUnreadCommentsMyTasks()

    fetchUnread
      .then((res) => {
        const comments = res?.data || res || []
        dispatch(patchWbtDashboard({ unreadComments: comments }))
      })
      .catch((err) => console.error('Failed to fetch unread comments', err))

    try {
      if (isAdminRole) {
        let resolvedUnapprovedCount = 0

        // Fetch Dashboard Number for Pending Approvals
        Service.GetDashboardNumber()
          .then((res) => {
            const data = res?.data ?? res ?? {}
            let finalCount = 0
            if (typeof data === 'number') {
              finalCount = data
            } else if (typeof data === 'object' && data !== null) {
              if (data.total !== undefined) {
                finalCount = data.total
              } else {
                finalCount = Object.values(data).reduce((acc, val) => {
                  if (Array.isArray(val)) return acc + val.length
                  if (typeof val === 'number') return acc + val
                  return acc
                }, 0)
              }
            }
            resolvedUnapprovedCount = finalCount
            dispatch(patchWbtDashboard({ unapprovedListsCount: finalCount }))
            dispatch(patchWbtAdminData({
              unapprovedListsData: typeof data === 'object' ? data : {}
            }))
          })
          .catch((err) => console.error('Failed to fetch unapproved lists count', err))

        // Fetch Admin Data
        let computedPMStats = {}
        let projectsRes, rfiRes, subRes, coRes, rfqRes, pmDashboardRes, myTasksRes, invoicesRes, allRfqsRes
        let clientRfiRes, clientSubRes, clientCoRes, clientRfqRes, pendingSubRes

        const requests = [
          Service.GetAllProjects(1, 10000),
          Service.FetchAllRFQ(),
          Service.GetAllInvoice(),
          Service.GetMyTask()
        ]

        if (userRole === 'project_manager' || userRole === 'assistant_project_manager') {
          requests.push(
            Service.pendingRFIsForProjectManager(),
            Service.PendingSubmittalForProjectManager(),
            Service.GetPendingSubmittalForPM(),
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
            Service.GetPendingSubmittal(),
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
            Service.GetPendingSubmittal(),
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
            Service.GetPendingSubmittal(),
            Service.GetPendingChangeOrders(),
            Service.GetPendingRfq(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingRfiClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingSubmittalClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingChangeOrdersClientSide(),
            userRole === 'project_manager_officer' ? Promise.resolve(null) : Service.GetPendingRfqClientSide(),
            Service.GetDashboardData()
          )
        }

        const fetchUnapprovedCO = [
          'admin',
          'deputy_manager',
          'operation_executive',
          'project_manager_officer',
          'project_manager',
          'dept_manager'
        ].includes(userRole)
        if (fetchUnapprovedCO) {
          requests.push(
            Service.GetUnapprovedChangeOrders().catch((e) => {
              console.error('Failed to fetch unapproved COs', e)
              return []
            })
          )
        }

        const responses = await Promise.all(requests)

        projectsRes = responses[0]
        allRfqsRes = responses[1]
        invoicesRes = responses[2]
        myTasksRes = responses[3]

        rfiRes = responses[4]
        subRes = responses[5]
        pendingSubRes = responses[6]
        coRes = responses[7]
        if (['project_manager', 'assistant_project_manager', 'dept_manager', 'operation_executive'].includes(userRole)) {
          clientRfiRes = responses[8]
          clientSubRes = responses[9]
          clientCoRes = responses[10]
          clientRfqRes = responses[11]
          rfqRes = responses[12]
          pmDashboardRes = responses[13]
        } else {
          rfqRes = responses[8]
          clientRfiRes = responses[9]
          clientSubRes = responses[10]
          clientCoRes = responses[11]
          clientRfqRes = responses[12]
          pmDashboardRes = responses[13]
        }

        let nextMemberStats

        // Fetch member workload if needed
        if (['dept_manager', 'project_manager', 'deputy_manager', 'admin', 'project_manager_officer'].includes(userRole)) {
          if (!isBackground) setMemberLoading(true)
          try {
            const [employeesRes, allTasksRes] = await Promise.all([
              Service.FetchAllEmployee(),
              Service.GetAllTask()
            ])

            const employees =
              employeesRes?.data?.employees || employeesRes?.employees || employeesRes?.data || employeesRes || []
            const allGlobalTasks =
              allTasksRes?.data?.tasks || allTasksRes?.tasks || allTasksRes?.data || allTasksRes || []

            const excludedRoles = [
              'admin',
              'operation_executive',
              'project_manager_officer',
              'dept_manager',
              'deputy_manager'
            ]
            let filteredEmployees = Array.isArray(employees)
              ? employees.filter(
                  (e) =>
                    e &&
                    e.isActive === true &&
                    !e.is_disabled &&
                    !excludedRoles.includes((e.role || '').toLowerCase())
                )
              : []

            if (userRole === 'project_manager') {
              const myTeamName = (user?.team?.name || sessionStorage.getItem('teamName') || '').toLowerCase().trim()
              if (myTeamName) {
                filteredEmployees = filteredEmployees.filter(
                  (e) => (e.team?.name || '').toLowerCase().trim() === myTeamName
                )
              }
            } else if (userRole === 'dept_manager') {
              const myDeptName = (user?.department?.name || sessionStorage.getItem('deptName') || '').toLowerCase().trim()
              if (myDeptName) {
                filteredEmployees = filteredEmployees.filter(
                  (e) => (e.department?.name || '').toLowerCase().trim() === myDeptName
                )
              }
            }

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(today.getDate() + 1)

            nextMemberStats = filteredEmployees.map((emp) => {
              const empTasks = allGlobalTasks.filter((t) => {
                const tUserId = t.user_id || t.user?.id || t.userId || t.assignedToId
                if (String(tUserId) !== String(emp.id)) return false

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
                assignedHours,
                isActive: emp.isActive
              }
            })

            if (['dept_manager', 'project_manager'].includes(userRole)) {
              const teamMemberIds = new Set(filteredEmployees.map((e) => String(e.id)))
              const teamTasks = allGlobalTasks.filter((t) => {
                const tUserId = t.user_id || t.user?.id || t.userId || t.assignedToId
                return teamMemberIds.has(String(tUserId))
              })

              const completed = teamTasks.filter((t) =>
                ['COMPLETED', 'VALIDATE_COMPLETED'].includes((t.status || '').toUpperCase())
              ).length

              const overdue = teamTasks.filter((t) => {
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

        const projects = extractDataList(projectsRes)
        const rfis = extractDataList(rfiRes)
        const submittals = extractDataList(subRes)
        const pendingSubmittals = extractDataList(pendingSubRes)
        const coList = extractDataList(coRes)
        const rfqList = extractDataList(rfqRes)
        const invoices = extractDataList(invoicesRes)
        const allRfqs = extractDataList(allRfqsRes)

        const clientRfis = extractDataList(clientRfiRes)
        const clientSubmittals = extractDataList(clientSubRes)
        const clientCos = extractDataList(clientCoRes)
        const clientRfqs = extractDataList(clientRfqRes)

        const unapprovedCOList = fetchUnapprovedCO ? extractDataList(responses[responses.length - 1]) : []

        const pmDataObj = pmDashboardRes?.data || pmDashboardRes || {}
        const pmDashboardFromAPI = {
          ...(typeof pmDataObj === 'object' ? pmDataObj : {}),
          ...(typeof pmDataObj.data === 'object' ? pmDataObj.data : {})
        }

        const pmDashboard = {
          ...pmDashboardFromAPI,
          ...computedPMStats
        }

        const seenUpcomingMilestoneIds = new Set()
        const finalPendingSubmittals = []
        if (Array.isArray(pendingSubmittals)) {
          pendingSubmittals.forEach((m) => {
            if (!m) return
            const mId = String(m.id || m._id || m.milestoneId || m.mileStoneId || '')
            if (mId) {
              if (seenUpcomingMilestoneIds.has(mId)) return
              seenUpcomingMilestoneIds.add(mId)
            }
            finalPendingSubmittals.push({
              ...m,
              id: m.id || m._id || m.milestoneId || m.mileStoneId,
              isPlaceholderSubmittal: true,
              subject: m.subject || m.name || 'Unknown Milestone',
              subSubject: m.subSubject && m.subSubject !== 'string' ? m.subSubject : '',
              approvalDate: m.approvalDate || m.date,
              project: m.project || projects.find((p) => String(p.id) === String(m.project_id || m.projectId))
            })
          })
        }

        const opExecPendingApprovals =
          (pmDashboard?.unapprovedRFIsCount || 0) +
          (pmDashboard?.unapprovedSubmittalsCount || 0) +
          (pmDashboard?.unapprovedChangeOrdersCount || 0)

        const nextAdminData = {
          projects,
          rfis,
          submittals,
          pendingSubmittals: submittals,
          upcomingMilestones: finalPendingSubmittals,
          pendingChangeOrders: coList,
          rfqs: rfqList,
          pendingRFI: rfis,
          pendingRFQ: rfqList,
          pendingCO: coList,
          clientSidePendingRFI: clientRfis,
          clientSidePendingSubmittals: clientSubmittals,
          clientSidePendingCO: clientCos,
          clientSidePendingRFQ: clientRfqs,
          unapprovedCO: unapprovedCOList,
          pmDashboard,
          projectTrackingActions: pmDashboard?.projectTrackingActions || {},
          allRfqs,
          projectStats: {
            ...pmDashboard?.projectStats,
            totalProjects:
              pmDashboard?.projectStats?.totalProjects ||
              pmDashboard?.totalProjects ||
              projects.length,
            activeProjects:
              pmDashboard?.projectStats?.ACTIVE ||
              pmDashboard?.projectStats?.activeProjects ||
              pmDashboard?.totalActiveProjects ||
              projects.filter(
                (p) => p.status?.toUpperCase() === 'ACTIVE' || p.status?.toUpperCase() === 'IN_PROGRESS'
              ).length,
            completedProjects:
              pmDashboard?.projectStats?.COMPLETE ||
              pmDashboard?.projectStats?.completedProjects ||
              pmDashboard?.totalCompleteProject ||
              projects.filter(
                (p) => p.status?.toUpperCase() === 'COMPLETED' || p.status?.toUpperCase() === 'COMPLETE'
              ).length,
            onHoldProjects:
              pmDashboard?.projectStats?.ONHOLD ||
              pmDashboard?.projectStats?.onHoldProjects ||
              pmDashboard?.totalOnHoldProject ||
              projects.filter(
                (p) => p.status?.toUpperCase() === 'ON_HOLD' || p.status?.toUpperCase() === 'ON-HOLD'
              ).length
          },
          dashboardStats: {
            pendingRFI: (pmDashboard?.pendingRFI ?? rfis.length) + (pmDashboard?.clientSidePendingActions?.rfi ?? clientRfis.length),
            pendingRfiWbt: pmDashboard?.pendingRFI ?? rfis.length,
            pendingRfiClient: pmDashboard?.clientSidePendingActions?.rfi ?? clientRfis.length,
            newRFI: pmDashboard?.newRFI ?? 0,
            pendingSubmittals:
              (pmDashboard?.pendingSubmittals ?? submittals.length) +
              (pmDashboard?.clientSidePendingActions?.submittals ?? clientSubmittals.length),
            pendingSubmittalsWbt: pmDashboard?.pendingSubmittals ?? submittals.length,
            pendingSubmittalsClient: pmDashboard?.clientSidePendingActions?.submittals ?? clientSubmittals.length,
            pendingChangeOrders:
              (pmDashboard?.pendingChangeOrders ?? coList.length) +
              (pmDashboard?.clientSidePendingActions?.changeOrders ?? clientCos.length),
            pendingChangeOrdersWbt: pmDashboard?.pendingChangeOrders ?? coList.length,
            pendingChangeOrdersClient: pmDashboard?.clientSidePendingActions?.changeOrders ?? clientCos.length,
            newChangeOrders: pmDashboard?.newChangeOrders ?? 0,
            unapprovedChangeOrders: pmDashboard?.unapprovedChangeOrdersCount ?? unapprovedCOList.length,
            pendingRFQ: (pmDashboard?.pendingRFQ ?? rfqList.length) + (pmDashboard?.clientSidePendingActions?.rfq ?? clientRfqs.length),
            pendingRfqWbt: pmDashboard?.pendingRFQ ?? rfqList.length,
            pendingRfqClient: pmDashboard?.clientSidePendingActions?.rfq ?? clientRfqs.length,
            newRFQ: pmDashboard?.newRFQ ?? 0
          },
          invoices
        }

        const personalTaskState = await buildPersonalTaskMetrics(myTasksRes?.data ?? myTasksRes)

        dispatch(
          setWbtDashboardData({
            cacheKey,
            adminData: nextAdminData,
            ...(nextMemberStats !== undefined ? { memberStats: nextMemberStats } : {}),
            ...(opExecPendingApprovals > 0 && !resolvedUnapprovedCount
              ? { unapprovedListsCount: opExecPendingApprovals }
              : {}),
            ...personalTaskState
          })
        )
      } else {
        // Fetch Staff Data
        const [response, selfTaskResponse] = await Promise.all([
          Service.GetMyTask(),
          SelfTaskService.getSelfAssignedNotCompletedTasks().catch((error) => {
            console.error('Failed to load dashboard self tasks:', error)
            return []
          })
        ])
        const selfTaskPayload = selfTaskResponse?.data ?? selfTaskResponse
        const selfTaskList = Array.isArray(selfTaskPayload)
          ? selfTaskPayload
          : Array.isArray(selfTaskPayload?.tasks)
            ? selfTaskPayload.tasks
            : Array.isArray(selfTaskPayload?.result)
              ? selfTaskPayload.result
              : []
        const mappedSelfTasks = selfTaskList.map((task) => ({ ...task, taskType: 'SELF_TASK' }))

        const personalTaskState = await buildPersonalTaskMetrics(response?.data)

        dispatch(
          setWbtDashboardData({
            cacheKey,
            selfTasks: mappedSelfTasks,
            ...personalTaskState
          })
        )
      }
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error)
      console.log('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
    } finally {
      inFlightRef.current = false
      setLoading(false)
      if (queuedRefreshRef.current) {
        queuedRefreshRef.current = false
        fetchData({ background: true })
      }
    }
  }, [cacheKey, dispatch, isAdminRole, user?.department?.name, user?.team?.name, userRole])

  useEffect(() => {
    if (!isCacheValid) {
      fetchData()
    } else {
      setLoading(false)
      if (isStale) {
        fetchData({ background: true })
      }
    }
  }, [isCacheValid, isStale, fetchData])

  useEffect(() => {
    const handleRefresh = () => {
      fetchData({ background: true })
    }
    window.addEventListener('task-updated', handleRefresh)
    window.addEventListener('dashboard-refresh', handleRefresh)
    window.addEventListener('rfq-updated', handleRefresh)
    window.addEventListener('rfi-updated', handleRefresh)
    window.addEventListener('submittal-updated', handleRefresh)
    window.addEventListener('co-updated', handleRefresh)

    return () => {
      window.removeEventListener('task-updated', handleRefresh)
      window.removeEventListener('dashboard-refresh', handleRefresh)
      window.removeEventListener('rfq-updated', handleRefresh)
      window.removeEventListener('rfi-updated', handleRefresh)
      window.removeEventListener('submittal-updated', handleRefresh)
      window.removeEventListener('co-updated', handleRefresh)
    }
  }, [fetchData])

  return {
    user,
    loading,
    tasks,
    selfTasks,
    projectNotes,
    userRole,
    isAdminRole,
    userStats,
    adminData,
    fetchData,
    memberStats,
    memberLoading,
    unreadComments,
    unapprovedListsCount
  }
}
