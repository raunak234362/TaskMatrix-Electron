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
  Bell,
  X
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
const ProjectDetailsModal = lazy(() => import('./components/ProjectDetailsModal'))

// Detail Components for Modals
const GetRFIByID = lazy(() => import('../rfi/GetRFIByID'))
const GetSubmittalByID = lazy(() => import('../submittals/GetSubmittalByID'))
const GetCOByID = lazy(() => import('../co/GetCOByID'))
const GetRFQByID = lazy(() => import('../rfq/GetRFQByID'))

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
  const [selectedProject, setSelectedProject] = useState(null)

  // Detail Modal States
  const [detailModal, setDetailModal] = useState({
    isOpen: false,
    type: null, // 'RFI', 'SUBMITTAL', 'CO', 'RFQ'
    id: null
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

  const handleItemSelect = (item) => {
    // If it's a project object (has projectNumber or similar unique project fields)
    if (item.projectNumber || item.fabricator) {
      setSelectedProject(item)
      return
    }

    // Determine type based on item properties if not explicitly passed
    let type = null
    if (item.rfiresponse !== undefined || item.subject) type = 'RFI' // Simple heuristic, might need refinement
    // Better approach: use the actionModal type to determine what we are clicking

    // However, DashboardListModal knows the type. Let's pass it from there.
    // For now, let's look at the actionModal.type which is currently open
    if (actionModal.isOpen) {
      switch (actionModal.type) {
        case 'PENDING_RFI': type = 'RFI'; break;
        case 'PENDING_SUBMITTALS': type = 'SUBMITTAL'; break;
        case 'CHANGE_ORDERS': type = 'CO'; break;
        case 'PENDING_RFQ': type = 'RFQ'; break;
      }
    }

    if (type && (item.id || item._id)) {
      setDetailModal({
        isOpen: true,
        type,
        id: item.id || item._id
      })
    }
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
            onProjectSelect={(project) => setSelectedProject(project)}
          />
        )}

        {/* Admin Dashboard Actions List Modal */}
        {actionModal.isOpen && (
          <DashboardListModal
            isOpen={actionModal.isOpen}
            onClose={() => setActionModal({ ...actionModal, isOpen: false })}
            type={actionModal.type}
            data={actionModal.data}
            onItemSelect={handleItemSelect}
          />
        )}

        {/* Project Details Modal */}
        {selectedProject && (
          <ProjectDetailsModal
            project={selectedProject}
            onClose={() => setSelectedProject(null)}
          />
        )}

        {/* Item Detail Modal Wrapper */}
        {detailModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-[95%] max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-700">
                  {detailModal.type === 'RFI' && 'RFI Details'}
                  {detailModal.type === 'SUBMITTAL' && 'Submittal Details'}
                  {detailModal.type === 'CO' && 'Change Order Details'}
                  {detailModal.type === 'RFQ' && 'RFQ Details'}
                </h3>
                <button
                  onClick={() => setDetailModal({ isOpen: false, type: null, id: null })}
                  className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                <Suspense fallback={<div className="p-8 text-center">Loading details...</div>}>
                  {detailModal.type === 'RFI' && <GetRFIByID id={detailModal.id} />}
                  {detailModal.type === 'SUBMITTAL' && <GetSubmittalByID id={detailModal.id} />}
                  {detailModal.type === 'CO' && <GetCOByID id={detailModal.id} />}
                  {detailModal.type === 'RFQ' && <GetRFQByID id={detailModal.id} />}
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

export default WBTDashboard
