/* eslint-disable react/prop-types */
import { useEffect, useState, Suspense, lazy, useMemo } from 'react'
import Service from '../../api/Service'
import { useSelector, useDispatch } from 'react-redux'
import { setModalOpen } from '../../store/userSlice'
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
  const dispatch = useDispatch()
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
    id: null,
    projectId: null
  })

  // Popup States for Widgets
  const [showSubmittalsPopup, setShowSubmittalsPopup] = useState(false)
  const [showDeadlinesPopup, setShowDeadlinesPopup] = useState(false)
  const [showNotesPopup, setShowNotesPopup] = useState(false)

  useEffect(() => {
    const isAnyModalOpen =
      projectModal.isOpen ||
      actionModal.isOpen ||
      detailModal.isOpen ||
      detailTaskId !== null ||
      selectedProject !== null ||
      showSubmittalsPopup ||
      showDeadlinesPopup ||
      showNotesPopup
    dispatch(setModalOpen(isAnyModalOpen))
  }, [
    projectModal.isOpen,
    actionModal.isOpen,
    detailModal.isOpen,
    detailTaskId,
    selectedProject,
    showSubmittalsPopup,
    showDeadlinesPopup,
    showNotesPopup,
    dispatch
  ])

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
        const [projectsRes, rfiRes, subRes, pendingSubRes, coRes, rfqRes, pmDashboardRes, myTasksRes] = await Promise.all([
          Service.GetAllProjects(),
          Service.pendingRFIs(),
          Service.GetPendingSubmittal(),
          Service.PendingSubmittal(),
          Service.PendingCo(),
          Service.RFQRecieved(),
          Service.GetPMDashboard(),
          Service.GetMyTask() // Fetch personal tasks for Admin too
        ])

        const projects = projectsRes?.data || []
        const rfis = rfiRes?.data || []
        const submittals = subRes?.data || []
        const pendingSubmittals = pendingSubRes?.data || []
        const cos = coRes?.data || []
        const rfqs = rfqRes?.data || []
        const pmDashboard = pmDashboardRes?.data || []

        setAdminData({
          projects,
          rfis,
          submittals,
          pendingSubmittals,
          cos,
          pmDashboard,
          rfqs,
          projectStats: {
            totalProjects: projects.length,
            activeProjects: projects.filter(p => !p.status || p.status.toUpperCase() === 'ACTIVE').length,
            completedProjects: projects.filter(p => p.status?.toUpperCase() === 'COMPLETED').length,
            onHoldProjects: projects.filter(p => p.status?.toUpperCase() === 'ON_HOLD').length
          },
          
          invoices: []
        })

        // Process Personal Tasks for Admin
        if (myTasksRes?.data) {
          const fetchedTasks = Array.isArray(myTasksRes.data)
            ? myTasksRes.data
            : Object.values(myTasksRes.data || {})

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
    // 1. If Action Modal is open, determining type is explicit
    if (actionModal.isOpen) {
      let type = null
      switch (actionModal.type) {
        case 'PENDING_RFI': type = 'RFI'; break;
        case 'PENDING_SUBMITTALS': type = 'SUBMITTAL'; break;
        case 'CHANGE_ORDERS': type = 'CO'; break;
        case 'PENDING_RFQ': type = 'RFQ'; break;
      }

      if (type && (item.id || item._id)) {
        setActionModal({ ...actionModal, isOpen: false }) // Close list modal before opening detail

        // Extract Project ID safely - try various common patterns
        const projectId = item.projectId || item.project?.id || item.project?._id || (typeof item.project === 'string' ? item.project : null);

        setDetailModal({
          isOpen: true,
          type,
          id: item.id || item._id,
          projectId
        })
        return
      }
    }

    // 2. If it's a project object (has projectNumber) - fallback for ProjectListModal
    if (item.projectNumber || item.fabricator) {
      setSelectedProject(item)
      return
    }

    // 3. Last resort heuristic (Fallback if modal wasn't open for some reason)
    let type = null
    if (item.rfiresponse !== undefined) type = 'RFI'

    if (type && (item.id || item._id)) {
      setDetailModal({
        isOpen: true,
        type,
        id: item.id || item._id,
        projectId: item.projectId || item.project?.id || item.project?._id
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
          <div className="flex items-center gap-3 text-xs font-black text-primary bg-green-50 px-4 py-2 rounded-xl border border-primary/10 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="uppercase tracking-widest">{format(new Date(), 'MMMM dd, yyyy')}</span>
          </div>
        </div>

        {isAdminRole ? (
          /* ---------- ADMIN DASHBOARD LAYOUT ---------- */
          <div className="flex flex-col gap-4 lg:gap-6 transition-all duration-300 ease-in-out">
            {/* Row 1: Priority Header Row */}
            <div className="relative">
              <div className="bg-linear-to-br from-gray-50/50 to-white/50 p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 relative z-10">
                  {/* 1. Priority Focus (Highest Priority) */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group"
                    onClick={() => currentTask && setDetailTaskId(currentTask.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 rounded-xl border border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                          <Clock className="w-5 h-5 text-primary" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-primary uppercase tracking-[0.1em]">Priority Focus</span>
                      </div>
                      {currentTask && (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-primary/50"></span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {currentTask?.project?.name || 'No Active Task'}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">
                        {currentTask?.name || 'Ready to start'}
                      </p>
                    </div>
                  </div>

                  {/* 2. Upcoming Submittals Trigger */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                    onClick={() => setShowSubmittalsPopup(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100/60 rounded-xl border border-indigo-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Briefcase className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-[0.1em]">Upcoming Submittal</span>
                      </div>
                      <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                        {adminData.submittals.length}
                      </span>
                    </div>
                  </div>

                  {/* 3. Upcoming Deadlines Trigger */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                    onClick={() => setShowDeadlinesPopup(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100/60 rounded-xl border border-blue-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-[0.1em]">Upcoming Deadlines</span>
                      </div>
                      <span className="text-3xl font-black text-blue-600 tracking-tighter">
                        {tasks.filter(t => t.status !== 'COMPLETED').length}
                      </span>
                    </div>
                  </div>

                  {/* 4. Notes & Updates Trigger */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                    onClick={() => setShowNotesPopup(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Bell className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-[0.1em]">Notes & Updates</span>
                      </div>
                      <span className="text-3xl font-black text-amber-600 tracking-tighter">
                        {projectNotes.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: User Stats (Compressed) */}
            <UserStatsWidget stats={userStats} loading={loading} />

            {/* Row 3: Project Overview & Pending Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 transition-all duration-300">
              <ProjectStats stats={adminData.projectStats} onCardClick={handleProjectStatClick} />
              <PendingActions dashboardStats={adminData.dashboardStats} onActionClick={handleActionClick} />
            </div>

            {userRole === 'project_manager_officer' && (
              <div className="grid grid-cols-1 gap-6">
                <InvoiceTrends invoices={adminData.invoices} />
              </div>
            )}
          </div>
        ) : (
          /* ---------- STAFF DASHBOARD LAYOUT ---------- */
          <div className="flex flex-col gap-4 lg:gap-5 transition-all duration-300 ease-in-out">
            {/* Row 1: Priority Header Row */}
            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50/50 to-white/50 p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 relative z-10">
                  {/* 1. Priority Focus */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group"
                    onClick={() => currentTask && setDetailTaskId(currentTask.id)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 rounded-xl border border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                          <Clock className="w-5 h-5 text-primary" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-primary uppercase tracking-[0.1em]">Priority Focus</span>
                      </div>
                      {currentTask && (
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(22,163,74,0.5)]"></span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-black text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                        {currentTask?.project?.name || 'No Active Task'}
                      </h3>
                      <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">
                        {currentTask?.name || 'Ready to start'}
                      </p>
                    </div>
                  </div>

                  {/* 2. Deadlines Trigger */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                    onClick={() => setShowDeadlinesPopup(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100/60 rounded-xl border border-blue-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-[0.1em]">Upcoming Deadlines</span>
                      </div>
                      <span className="text-3xl font-black text-blue-600 tracking-tighter">
                        {tasks.filter(t => t.status !== 'COMPLETED').length}
                      </span>
                    </div>
                  </div>

                  {/* 3. Notes Trigger */}
                  <div
                    className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                    onClick={() => setShowNotesPopup(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 shadow-sm group-hover:scale-110 transition-transform">
                          <Bell className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-[0.1em]">Notes & Updates</span>
                      </div>
                      <span className="text-3xl font-black text-amber-600 tracking-tighter">
                        {projectNotes.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Stats */}
            <UserStatsWidget stats={userStats} loading={loading} />
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

        {/* Widget Popups */}
        {showSubmittalsPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-6xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex-1 overflow-auto">
                <div className="sticky top-0 right-0 p-3 flex justify-end z-20 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setShowSubmittalsPopup(false)}
                    className="px-4 py-1.5 bg-red-100 border border-red-600 text-black font-bold rounded-xl transition-all hover:bg-red-200 active:scale-95 uppercase text-[10px] tracking-widest shadow-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="px-6 pb-6">
                  <UpcomingSubmittals
                    pendingSubmittals={adminData.submittals}
                    invoices={adminData.invoices}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {showDeadlinesPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex-1 overflow-auto">
                <div className="sticky top-0 right-0 p-3 flex justify-end z-20 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setShowDeadlinesPopup(false)}
                    className="px-4 py-1.5 bg-red-100 border border-red-600 text-black font-bold rounded-xl transition-all hover:bg-red-200 active:scale-95 uppercase text-[10px] tracking-widest shadow-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="px-6 pb-6">
                  <UpcomingDeadlinesWidget tasks={tasks} onTaskClick={(id) => { setDetailTaskId(id); setShowDeadlinesPopup(false); }} />
                </div>
              </div>
            </div>
          </div>
        )}

        {showNotesPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="flex-1 overflow-auto">
                <div className="sticky top-0 right-0 p-3 flex justify-end z-20 bg-white/80 backdrop-blur-sm">
                  <button
                    onClick={() => setShowNotesPopup(false)}
                    className="px-4 py-1.5 bg-red-100 border border-red-600 text-black font-bold rounded-xl transition-all hover:bg-red-200 active:scale-95 uppercase text-[10px] tracking-widest shadow-sm"
                  >
                    Close
                  </button>
                </div>
                <div className="px-6 pb-6">
                  <PersonalNotesWidget projectNotes={projectNotes} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Item Detail Modal Wrapper */}
        {detailModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-[95%] max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-widest">
                  {detailModal.type === 'RFI' && 'RFI Details'}
                  {detailModal.type === 'SUBMITTAL' && 'Submittal Details'}
                  {detailModal.type === 'CO' && 'Change Order Details'}
                  {detailModal.type === 'RFQ' && 'RFQ Details'}
                </h3>
                <button
                  onClick={() => setDetailModal({ isOpen: false, type: null, id: null })}
                  className="px-4 py-2 bg-red-100 border border-red-600 text-black font-bold rounded-xl transition-all hover:bg-red-200 active:scale-95 uppercase text-xs tracking-widest"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50/30">
                <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading details...</div>}>
                  {detailModal.type === 'RFI' && <GetRFIByID id={detailModal.id} />}
                  {detailModal.type === 'SUBMITTAL' && <GetSubmittalByID id={detailModal.id} />}
                  {detailModal.type === 'CO' && <GetCOByID id={detailModal.id} projectId={detailModal.projectId} />}
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
