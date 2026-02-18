/* eslint-disable react/prop-types */
import { useState, Suspense, lazy, useMemo, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { setModalOpen } from '../../store/userSlice'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'

// Hooks and Views
import { useDashboardData } from './hooks/useDashboardData'
import AdminDashboardView from './AdminDashboardView'
import StaffDashboardView from './StaffDashboardView'
import UpcomingSubmittals from './components/UpcomingSubmittals'
import UpcomingDeadlinesWidget from './components/UpcomingDeadlinesWidget'
import PersonalNotesWidget from './components/PersonalNotesWidget'

// Lazy load components
const FetchTaskByID = lazy(() => import('../task/FetchTaskByID'))
const ProjectListModal = lazy(() => import('./components/ProjectListModal'))
const DashboardListModal = lazy(() => import('./components/DashboardListModal'))
const ProjectDetailsModal = lazy(() => import('./components/ProjectDetailsModal'))

// Detail Components for Modals
const GetRFIByID = lazy(() => import('../rfi/GetRFIByID'))
const GetSubmittalByID = lazy(() => import('../submittals/GetSubmittalByID'))
const GetCOByID = lazy(() => import('../co/GetCOByID'))
const GetRFQByID = lazy(() => import('../rfq/GetRFQByID'))
const GetMilestoneByID = lazy(() => import('../project/mileStone/GetMilestoneByID'))

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

  // Use Custom Hook for Data
  const {
    loading,
    tasks,
    projectNotes,
    userRole,
    isAdminRole,
    userStats,
    adminData,
    fetchData
  } = useDashboardData()

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

  const [detailTaskId, setDetailTaskId] = useState(null)
  const [selectedMilestone, setSelectedMilestone] = useState(null) // New state for wrapper

  // Popup States for Widgets
  const [showSubmittalsPopup, setShowSubmittalsPopup] = useState(false)
  const [showDeadlinesPopup, setShowDeadlinesPopup] = useState(false)
  const [showNotesPopup, setShowNotesPopup] = useState(false)

  // Sync Modal State with Redux
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

  const currentTask = useMemo(() => tasks.find((t) => t.status === 'IN_PROGRESS'), [tasks])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  // Handlers
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
      case 'PENDING_SUBMITTALS': data = adminData.pendingSubmittals; break;
      case 'CHANGE_ORDERS': data = adminData.pendingChangeOrders; break;
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
        setActionModal({ ...actionModal, isOpen: false })
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

    // 3. Last resort heuristic
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
          </div>
          <div className="flex items-center gap-3 text-xs font-black text-primary bg-green-50 px-4 py-2 rounded-xl border border-primary/10 shadow-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="uppercase tracking-widest">{format(new Date(), 'MMMM dd, yyyy')}</span>
          </div>
        </div>

        {/* Dashboard Views */}
        {isAdminRole ? (
          <AdminDashboardView
            adminData={adminData}
            userStats={userStats}
            loading={loading}
            tasks={tasks}
            projectNotes={projectNotes}
            userRole={userRole}
            currentTask={currentTask}
            handlers={{
              handleProjectStatClick,
              handleActionClick,
              setDetailTaskId,
              setShowSubmittalsPopup,
              setShowDeadlinesPopup,
              setShowNotesPopup
            }}
          />
        ) : (
          <StaffDashboardView
            userStats={userStats}
            loading={loading}
            tasks={tasks}
            projectNotes={projectNotes}
            currentTask={currentTask}
            handlers={{
              setDetailTaskId,
              setShowDeadlinesPopup,
              setShowNotesPopup
            }}
          />
        )}

        {/* --- Modals & Popups --- */}

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
                    onSubmittalClick={(submittal) => {
                      setSelectedMilestone(submittal);
                      setShowSubmittalsPopup(false);
                    }}
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
        {selectedMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-[95%] max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
              <Suspense fallback={<div className="p-8 text-center text-xs font-bold uppercase tracking-widest text-gray-400">Loading milestone...</div>}>
                <GetMilestoneByID
                  row={selectedMilestone}
                  close={() => setSelectedMilestone(null)}
                />
              </Suspense>
            </div>
          </div>
        )}
      </Suspense>
    </div>
  )
}

export default WBTDashboard
