/* eslint-disable react/prop-types */
import { useEffect, useState, Suspense, lazy, useMemo } from 'react'
import Service from '../../api/Service'
import { useSelector } from 'react-redux'
import { format } from 'date-fns'
import {
  Calendar,
  LayoutDashboard,
  Clock,
  CheckCircle2,
  Briefcase,
  Bell
} from 'lucide-react'
import FetchTaskByID from '../task/FetchTaskByID'

// Lazy load components
const UserStatsWidget = lazy(() => import('./components/UserStatsWidget'))
const CurrentTaskWidget = lazy(() => import('./components/CurrentTaskWidget'))
const UpcomingDeadlinesWidget = lazy(() => import('./components/UpcomingDeadlinesWidget'))
const PersonalNotesWidget = lazy(() => import('./components/PersonalNotesWidget'))
// const EfficiencyLineChart = lazy(() => import('./components/EfficiencyLineChart'))
const GetTaskByID = lazy(() => import('../task/GetTaskByID'))

// Admin Dashboard Components
const ProjectStats = lazy(() => import('./components/ProjectStats'))
const PendingActions = lazy(() => import('./components/PendingActions'))
const InvoiceTrends = lazy(() => import('./components/InvoiceTrends'))
const UpcomingSubmittals = lazy(() => import('./components/UpcomingSubmittals'))
const ProjectListModal = lazy(() => import('./components/ProjectListModal'))
const DashboardListModal = lazy(() => import('./components/DashboardListModal'))

const DashboardSkeleton = () => (
  <div className="animate-pulse space-y-8 p-6 bg-white min-h-screen">
    <div className="flex justify-between items-center">
      <div className="h-10 w-1/3 bg-gray-100 rounded-lg"></div>
      <div className="h-10 w-24 bg-gray-100 rounded-lg"></div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-2xl"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-8">
        <div className="h-64 bg-gray-100 rounded-2xl"></div>
        <div className="h-96 bg-gray-100 rounded-2xl"></div>
      </div>
      <div className="h-full bg-gray-100 rounded-2xl"></div>
    </div>
  </div>
)

const WBTDashboard = () => {
  const user = useSelector((state) => state.userInfo?.userDetail)
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])
  const [detailTaskId, setDetailTaskId] = useState(null)

  // Role Based Logic
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const isAdminRole = ['admin', 'dept_manager', 'operation_executive', 'project_manager', 'department_manager', 'project_manager_officer'].includes(userRole)

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
    cos: [],
    rfqs: [],
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

  // Modal States
  const [projectModal, setProjectModal] = useState({ isOpen: false, status: '', data: [] })
  const [actionModal, setActionModal] = useState({ isOpen: false, type: '', data: [] })


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

  const fetchData = async () => {
    setLoading(true)
    try {
      if (isAdminRole) {
        // Fetch Admin Data
        const [projectsRes, rfiRes, subRes, coRes, rfqRes] = await Promise.all([
          Service.GetAllProjects(),
          Service.pendingRFIs(),
          Service.PendingSubmittal(),
          Service.PendingCo(),
          Service.RFQRecieved() // Using Recieved as 'Pending' pool for now
        ])

        const projects = projectsRes?.data || []
        const rfis = rfiRes?.data || []
        const submittals = subRes?.data || []
        const cos = coRes?.data || []
        const rfqs = rfqRes?.data || []

        setAdminData({
          projects,
          rfis,
          submittals,
          cos,
          rfqs,
          projectStats: {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => !p.status || p.status.toUpperCase() === 'ACTIVE').length,
            completedProjects: projects.filter(p => p.status?.toUpperCase() === 'COMPLETED').length,
            onHoldProjects: projects.filter(p => p.status?.toUpperCase() === 'ON_HOLD').length
          },
          dashboardStats: {
            pendingRFI: rfis.length,
            newRFI: 0, // Placeholder as 'new' logic needs specific criteria
            pendingSubmittals: submittals.length,
            pendingChangeOrders: cos.length,
            newChangeOrders: 0,
            pendingRFQ: rfqs.length,
            newRFQ: 0
          },
          invoices: [] // Placeholder until invoice API is confirmed
        })

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const currentTask = useMemo(() => tasks.find((t) => t.status === 'IN_PROGRESS'), [tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Admin Modal Handlers
  const handleProjectStatClick = (status) => {
    const filteredProjects = adminData.projects.filter(p => {
      if (status === 'ACTIVE') return !p.status || p.status.toUpperCase() === 'ACTIVE'
      return p.status?.toUpperCase() === status
    })
    setProjectModal({ isOpen: true, status, data: filteredProjects })
  }

  const handleActionClick = (type) => {
    let data = []
    switch (type) {
      case 'PENDING_RFI': data = adminData.rfis; break;
      case 'PENDING_SUBMITTALS': data = adminData.submittals; break;
      case 'CHANGE_ORDERS': data = adminData.cos; break;
      case 'PENDING_RFQ': data = adminData.rfqs; break;
      default: data = [];
    }
    setActionModal({ isOpen: true, type, data })
  }

  return (
    <div className="flex flex-col gap-8 p-1">
      <Suspense fallback={<DashboardSkeleton />}>
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">
              {getGreeting()}, {sessionStorage.getItem('username')?.split(' ')[0]}
            </h2>
            <p className="text-base text-gray-500 mt-1 font-medium">
              Here is what&apos;s happening with your projects today.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm font-black text-primary bg-green-50 px-5 py-2.5 rounded-xl border border-primary/10 shadow-sm">
            <Calendar className="w-5 h-5 text-primary" />
            <span className="uppercase tracking-widest">{format(new Date(), 'MMMM dd, yyyy')}</span>
          </div>
        </div>

        {isAdminRole ? (
          /* ---------- ADMIN DASHBOARD LAYOUT ---------- */
          <div className="flex flex-col gap-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <ProjectStats stats={adminData.projectStats} onCardClick={handleProjectStatClick} />
              <PendingActions dashboardStats={adminData.dashboardStats} onActionClick={handleActionClick} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {userRole === 'project_manager_officer' && (
                <InvoiceTrends invoices={adminData.invoices} />
              )}
              <UpcomingSubmittals
                pendingSubmittals={adminData.submittals}
                invoices={adminData.invoices}
              />
            </div>
          </div>
        ) : (
          /* ---------- STAFF DASHBOARD LAYOUT ---------- */
          <div className="flex flex-col gap-8">
            {/* Stats Overview */}
            <UserStatsWidget stats={userStats} loading={loading} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column (Focus) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 bg-green-50 rounded-[4px]">
                    <Clock className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Current Focus
                  </h3>
                </div>
                <CurrentTaskWidget
                  task={currentTask}
                  onTaskUpdate={() => setDetailTaskId(currentTask?.id)}
                />
              </div>

              {/* Middle Column (Deadlines) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 bg-blue-50 rounded-[4px]">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Upcoming Deadlines
                  </h3>
                </div>
                <UpcomingDeadlinesWidget
                  tasks={tasks}
                  onTaskClick={(id) => setDetailTaskId(id)}
                />
              </div>

              {/* Right Column (Notes) */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <div className="p-1.5 bg-amber-50 rounded-[4px]">
                    <Briefcase className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Notes & Updates
                  </h3>
                </div>
                <PersonalNotesWidget projectNotes={projectNotes} />
              </div>
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {detailTaskId && (
          <FetchTaskByID
            id={detailTaskId}
            onClose={() => setDetailTaskId(null)}
            refresh={fetchData}
          />
        )}

        {/* Admin Dashboard Project List Modal */}
        {projectModal.isOpen && (
          <ProjectListModal
            isOpen={projectModal.isOpen}
            onClose={() => setProjectModal({ ...projectModal, isOpen: false })}
            status={projectModal.status}
            projects={projectModal.data}
          />
        )}

        {/* Admin Dashboard Actions List Modal */}
        {actionModal.isOpen && (
          <DashboardListModal
            isOpen={actionModal.isOpen}
            onClose={() => setActionModal({ ...actionModal, isOpen: false })}
            type={actionModal.type}
            data={actionModal.data}
          />
        )}
      </Suspense>
    </div>
  )
}

export default WBTDashboard
