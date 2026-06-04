
import React, { useState, useEffect } from 'react'
import {
    Clock,
    Briefcase,
    Calendar,
    Bell,
    FileText,
    Activity,
    CheckCircle2,
    Loader2,
    RefreshCw,
    MessageCircleWarning
} from 'lucide-react'
import UserStatsWidget from './components/UserStatsWidget'
import ProjectStats from './components/ProjectStats'
import PendingActions from './components/PendingActions'
import InvoiceTrends from './components/InvoiceTrends'
import LiveTaskTimer from './components/LiveTaskTimer'
import AdminInvoiceGraph from './components/AdminInvoiceGraph'
import AdminRFQGraph from './components/AdminRFQGraph'
import WorkloadAlerts from './components/WorkloadAlerts'

// ─── StatCard ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon: Icon, onClick, iconPadding = 'p-3', valueSize = 'text-2xl' }) => (
    <div
        onClick={onClick}
        className="p-5 rounded-2xl flex items-center justify-between group transition-all duration-300 cursor-pointer bg-white relative overflow-hidden border border-black border-l-8 border-l-primary shadow-sm hover:shadow-md hover:bg-gray-50"
    >
        <div className="flex items-center gap-4 z-10">
            <div className={`${iconPadding} rounded-xl bg-gray-50 group-hover:bg-green-50 transition-colors text-black`}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <span className="font-black text-black uppercase tracking-widest text-xs">{label}</span>
        </div>
        <span className={`${valueSize} font-semibold text-black tracking-tighter z-10`}>{value}</span>
    </div>
)

// ─── Operation Executive MTO Section ─────────────────────────────────────────
const OperationExecutiveMTOSection = ({ allRfqs = [], invoices = [], onRFQClick }) => {
    const [stats, setStats] = useState({
        totalMTO: 0, awardedMTO: 0, pendingMTO: 0,
        totalRfqsSent: 0, rfqsAwarded: 0, pendingEstimates: 0
    })
    const [recentRFQs, setRecentRFQs] = useState([])
    const [modalState, setModalState] = useState({ open: false, title: '', data: [] })

    useEffect(() => {
        const rfqs = Array.isArray(allRfqs) ? allRfqs : []

        // Upcoming MTOs — not yet awarded/closed
        const upcomingMTOs = rfqs
            .filter(r => {
                const isMTO = r.MTOManual || r.mtoStickModelEnabled || r.MTOStickModel
                const status = (r.status || '').toUpperCase()
                const wbtStatus = (r.wbtStatus || '').toUpperCase()
                return isMTO && status !== 'AWARDED' && status !== 'CLOSED' && wbtStatus !== 'AWARDED' && wbtStatus !== 'CLOSED'
            })
            .sort((a, b) => {
                const dA = a.estimationDate ? new Date(a.estimationDate).getTime() : Infinity
                const dB = b.estimationDate ? new Date(b.estimationDate).getTime() : Infinity
                return dA - dB
            })
        setRecentRFQs(upcomingMTOs)

        // MTO Stats
        const mtoRfqs = rfqs.filter(r => r.MTOManual || r.mtoStickModelEnabled || r.MTOStickModel)
        const totalMTO = mtoRfqs.length
        const awardedMTO = mtoRfqs.filter(r => r.status === 'AWARDED' || r.wbtStatus === 'AWARDED').length
        const pendingMTO = mtoRfqs.filter(r => r.status !== 'AWARDED' && r.wbtStatus !== 'AWARDED').length

        setStats({ totalMTO, awardedMTO, pendingMTO })
    }, [allRfqs])

    const openModal = (type) => {
        const rfqs = Array.isArray(allRfqs) ? allRfqs : []
        let data = []
        let title = ''
        if (type === 'ALL_MTO') { data = rfqs.filter(r => r.MTOManual || r.mtoStickModelEnabled || r.MTOStickModel); title = 'All MTO RFQs' }
        else if (type === 'COMPLETED_MTO') { data = rfqs.filter(r => (r.MTOManual || r.mtoStickModelEnabled || r.MTOStickModel) && (r.status === 'AWARDED' || r.wbtStatus === 'AWARDED')); title = 'Completed MTOs' }
        else if (type === 'PENDING_MTO') { data = rfqs.filter(r => (r.MTOManual || r.mtoStickModelEnabled || r.MTOStickModel) && r.status !== 'AWARDED' && r.wbtStatus !== 'AWARDED'); title = 'Ongoing MTOs' }
        else if (type === 'ALL_RFQ') { data = rfqs.filter(r => r.connectionDesign || r.customerDesign || r.detailingMain || r.detailingMisc || r.miscDesign); title = 'All Detailing RFQs' }
        else if (type === 'AWARDED_RFQ') { data = rfqs.filter(r => (r.connectionDesign || r.customerDesign || r.detailingMain || r.detailingMisc || r.miscDesign) && (r.status === 'AWARDED' || r.wbtStatus === 'AWARDED')); title = 'Awarded RFQs' }
        else if (type === 'PENDING_RFQ') { data = rfqs.filter(r => (r.connectionDesign || r.customerDesign || r.detailingMain || r.detailingMisc || r.miscDesign) && r.status !== 'AWARDED' && r.wbtStatus !== 'AWARDED'); title = 'Pending RFQs' }
        setModalState({ open: true, title, data })
    }

    const closeModal = () => setModalState({ open: false, title: '', data: [] })

    const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—'

    const statusBadge = (row) => {
        const s = (row.status || row.wbtStatus || 'PENDING').toUpperCase()
        let cls = 'bg-gray-50 text-gray-700 border-gray-200'
        if (s === 'AWARDED') cls = 'bg-green-50 text-green-700 border-green-200'
        else if (['PENDING', 'IN_REVIEW'].includes(s)) cls = 'bg-yellow-50 text-yellow-700 border-yellow-200'
        else if (['CLOSED', 'NOT SELECTED'].includes(s)) cls = 'bg-red-50 text-red-700 border-red-200'
        const label = s === 'IN_REVIEW' ? 'ESTIMATION IN PROGRESS' : s.replace('_', ' ')
        return <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>{label}</span>
    }

    const dueDateCell = (row) => {
        const d = row.estimationDate ? new Date(row.estimationDate) : null
        if (!d) return <span className="text-xs font-bold text-gray-400">—</span>
        const today = new Date(); today.setHours(0, 0, 0, 0); d.setHours(0, 0, 0, 0)
        let cls = 'text-gray-500'
        if (d < today) cls = 'bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-lg'
        else if (d.getTime() === today.getTime()) cls = 'bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded-lg'
        return <span className={`text-xs font-black uppercase ${cls}`}>{d.toLocaleDateString()}</span>
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Overview Cards */}
            <div className="bg-white rounded-2xl shadow-sm border border-primary/20 p-4">
                <span className="text-sm font-black text-black uppercase tracking-widest block mb-4">Material Take-off RFQ Overview</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard onClick={() => openModal('ALL_MTO')} icon={FileText} label="Total MTO" value={stats.totalMTO} iconPadding="p-2" />
                    <StatCard onClick={() => openModal('COMPLETED_MTO')} icon={CheckCircle2} label="Completed" value={stats.awardedMTO} iconPadding="p-2" />
                    <StatCard onClick={() => openModal('PENDING_MTO')} icon={Clock} label="Ongoing" value={stats.pendingMTO} iconPadding="p-2" />
                </div>
            </div>

            {/* Upcoming MTO Table */}
            <div className="bg-white rounded-2xl border border-primary/20 shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-primary/10 bg-gray-50/70">
                    <h2 className="text-sm font-black text-black uppercase tracking-widest">Upcoming Material Take-off</h2>
                </div>
                {recentRFQs.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Project</th>
                                    <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Requested By</th>
                                    <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Created</th>
                                    <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Due Date</th>
                                    <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentRFQs.map((row, i) => {
                                    const sender = row.sender
                                    const senderName = sender
                                        ? (`${sender.firstName || ''} ${sender.lastName || ''}`).trim() || sender.username
                                        : row.customerName || row.clientName || '—'
                                    const projectName = row.project?.name || row.project?.projectName || row.projectName || '—'
                                    return (
                                        <tr
                                            key={row.id || row._id || i}
                                            onClick={() => onRFQClick && onRFQClick(row.id || row._id)}
                                            className="border-b border-gray-50 hover:bg-green-50/40 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 font-bold text-black uppercase truncate max-w-[180px]">{projectName}</td>
                                            <td className="px-4 py-3 font-bold text-gray-700 uppercase">{senderName}</td>
                                            <td className="px-4 py-3 font-bold text-gray-500">{formatDate(row.createdAt)}</td>
                                            <td className="px-4 py-3">{dueDateCell(row)}</td>
                                            <td className="px-4 py-3">{statusBadge(row)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center border border-primary/20 mb-2 animate-pulse">
                            <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest">No Upcoming MTOs</p>
                    </div>
                )}
            </div>

            {/* Quick List Modal */}
            {modalState.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={closeModal}>
                    <div className="bg-white w-full max-w-3xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-sm font-black text-black uppercase tracking-widest">{modalState.title}</h3>
                            <button onClick={closeModal} className="px-4 py-1 bg-red-50 text-black border border-red-200 rounded-lg text-xs font-bold uppercase">Close</button>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {modalState.data.length === 0 ? (
                                <p className="p-6 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">No items found</p>
                            ) : (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-gray-50">
                                        <tr className="border-b border-gray-100">
                                            <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Project</th>
                                            <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Subject</th>
                                            <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Due Date</th>
                                            <th className="px-4 py-2.5 text-left font-black text-gray-500 uppercase tracking-widest">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {modalState.data.map((row, i) => (
                                            <tr
                                                key={row.id || row._id || i}
                                                onClick={() => { closeModal(); onRFQClick && onRFQClick(row.id || row._id) }}
                                                className="border-b border-gray-50 hover:bg-green-50/40 cursor-pointer transition-colors"
                                            >
                                                <td className="px-4 py-3 font-bold text-black uppercase truncate max-w-[180px]">{row.project?.name || row.projectName || '—'}</td>
                                                <td className="px-4 py-3 font-bold text-gray-700">{row.subject || '—'}</td>
                                                <td className="px-4 py-3">{dueDateCell(row)}</td>
                                                <td className="px-4 py-3">{statusBadge(row)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const AdminDashboardView = ({
    adminData,
    userStats,
    loading,
    tasks,
    projectNotes,
    userRole,
    currentTask,
    handlers,
    unreadComments,
    memberStats = []
}) => {
    const {
        handleProjectStatClick,
        handleActionClick,
        setDetailTaskId,
        setShowSubmittalsPopup,
        setShowDeadlinesPopup,
        setShowNotesPopup,
        handleInvoiceClick
    } = handlers

    const showWorkloadAlerts = ['dept_manager', 'project_manager', 'deputy_manager'].includes(userRole?.toLowerCase())

    return (
        <div className="flex flex-col gap-8 lg:gap-10 transition-all duration-300 ease-in-out">
            {/* Row 1: Project Overview & Pending Actions */}
            <div className={`grid grid-cols-1 ${userRole === 'project_manager_officer' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-4 lg:gap-5 transition-all duration-300`}>
                {userRole !== 'project_manager_officer' && (
                    <ProjectStats stats={adminData.projectStats} onCardClick={handleProjectStatClick} />
                )}
                <PendingActions dashboardStats={adminData.dashboardStats} onActionClick={handleActionClick} />
            </div>

            {/* Operation Executive — MTO & Detailing RFQ Overview */}
            {userRole === 'operation_executive' && (
                <OperationExecutiveMTOSection
                    allRfqs={adminData.allRfqs || []}
                    invoices={adminData.invoices || []}
                    onRFQClick={handlers.onRFQClick}
                />
            )}

            {/* Workload Alerts Section */}
            {showWorkloadAlerts && memberStats.length > 0 && (
                <div>
                    <WorkloadAlerts
                        memberStats={memberStats}
                        onFilterChange={() => { }} // Navigation or filtering logic can be added here
                    />
                </div>
            )}

            {/* Row 2: Priority Header Row */}
            <div className="relative">
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${userRole === 'project_manager_officer' || userRole === 'operation_executive' ? 'lg:grid-cols-2' : 'lg:grid-cols-2 2xl:grid-cols-4'} gap-4 lg:gap-6 relative z-10`}>
                        {/* 1. Priority Focus - Hidden for PMO, OE, and Admin */}
                        {userRole !== 'project_manager_officer' && userRole !== 'operation_executive' && userRole !== 'admin' && (
                            <div
                                className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group"
                                onClick={() => currentTask && setDetailTaskId(currentTask.id)}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-green-100 rounded-xl border border-primary/20 shadow-sm transition-transform group-hover:scale-110">
                                            <Clock className="w-5 h-5 text-primary" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px] font-black text-primary uppercase tracking-widest">Priority Focus</span>
                                    </div>
                                    {currentTask && (
                                        <div className="flex items-center gap-2">
                                            <LiveTaskTimer task={currentTask} />
                                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-primary/50"></span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 mt-auto">
                                    <h3 className="text-base font-black text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">
                                        {currentTask?.project?.name || 'No Active Task'}
                                    </h3>
                                    <p className="text-[12px] text-gray-500 font-bold uppercase mt-1">
                                        {currentTask?.name || 'Ready to start'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* 2. Upcoming Deadlines Trigger - Hidden for PMO, OE, and Admin */}
                        {userRole !== 'project_manager_officer' && userRole !== 'operation_executive' && userRole !== 'admin' && (
                            <div
                                className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                                onClick={() => setShowDeadlinesPopup(true)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-100/60 rounded-xl border border-blue-200 shadow-sm group-hover:scale-110 transition-transform">
                                            <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700 uppercase tracking-wide">Upcoming Assigned Task Deadlines</span>
                                    </div>
                                    <span className="text-3xl font-black text-blue-600 tracking-tighter">
                                        {tasks.filter(t => t.status === 'ASSIGNED' || t.status === 'REWORK').length}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* 3. Upcoming Submittals Trigger */}
                        <div
                            className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                            onClick={() => setShowSubmittalsPopup(true)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-indigo-100/60 rounded-xl border border-indigo-200 shadow-sm group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-5 h-5 text-indigo-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[15px] font-black text-gray-700 uppercase tracking-widest">Upcoming Submittal</span>
                                </div>
                                <span className="text-3xl font-black text-indigo-600 tracking-tighter">
                                    {adminData?.upcomingMilestones?.length || 0}
                                </span>
                            </div>
                        </div>

                        {/* 4. Notes & Updates Trigger */}
                        <div
                            className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                            onClick={() => setShowNotesPopup(true)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-amber-100/60 rounded-xl border border-amber-200 shadow-sm group-hover:scale-110 transition-transform">
                                        <Bell className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[15px] font-black text-gray-700 uppercase tracking-widest">Notes & Updates</span>
                                </div>
                                    <span className="text-3xl font-black text-amber-600 tracking-tighter">
                                        {projectNotes.length}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Unread Comments Trigger */}
                            <div
                                className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                                onClick={() => handlers.setShowUnreadCommentsPopup?.(true)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-red-100/60 rounded-xl border border-red-200 shadow-sm group-hover:scale-110 transition-transform">
                                            <MessageCircleWarning className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[15px] font-black text-gray-700 uppercase tracking-widest">Unread Comments</span>
                                    </div>
                                    <span className="text-3xl font-black text-red-600 tracking-tighter">
                                        {unreadComments?.length || 0}
                                    </span>
                                </div>
                            </div>

                            {/* 5. Unapproved Change Orders */}
                            {['admin', 'deputy_manager', 'operation_executive', 'project_manager_officer', 'project_manager', 'dept_manager'].includes(userRole?.toLowerCase()) && (
                                <div
                                    className="bg-green-50/60 p-4 rounded-lg border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                                    onClick={() => handlers.handleActionClick && handlers.handleActionClick('UNAPPROVED_CHANGE_ORDERS')}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-red-100/60 rounded-xl border border-red-200 shadow-sm group-hover:scale-110 transition-transform">
                                                <RefreshCw className="w-5 h-5 text-red-600" strokeWidth={2.5} />
                                            </div>
                                            <span className="text-[15px] font-black text-gray-700 uppercase tracking-widest">Unapproved Change Orders</span>
                                        </div>
                                        <span className="text-3xl font-black text-red-600 tracking-tighter">
                                            {adminData?.dashboardStats?.unapprovedChangeOrders || 0}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
            {
                (userRole === 'admin' || userRole === 'project_manager_officer' || userRole === 'deputy_manager') && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <AdminInvoiceGraph
                                invoices={adminData.invoices}
                                projects={adminData.projects}
                                rfqs={adminData.allRfqs}
                                onInvoiceClick={handleInvoiceClick}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <AdminRFQGraph rfqs={adminData.allRfqs || []} />
                        </div>
                    </div>
                )
            }


            {/* Row 3: User Stats (Compressed) - Hidden for OE */}
            {userRole !== 'operation_executive' && (
                <UserStatsWidget stats={userStats} loading={loading} userRole={userRole} />
            )}


            {(userRole === 'project_manager' || userRole === 'dept_manager') && (
                <div className="bg-white p-6 rounded-3xl border border-gray-200">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">
                        Team & Task Overview
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                        <div className="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl">
                            <span className="text-sm font-bold text-black uppercase tracking-wider">Completed Tasks</span>
                            <span className="text-2xl font-black text-slate-700">{adminData.pmDashboard?.completedTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-red-50 rounded-2xl">
                            <span className="text-sm font-bold text-red-500 uppercase tracking-wider">Overdue Tasks</span>
                            <span className="text-2xl font-black text-red-600">{adminData.pmDashboard?.overdueTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-amber-50 rounded-2xl">
                            <span className="text-sm font-bold text-black uppercase tracking-wider">Pending Tasks</span>
                            <span className="text-2xl font-black text-amber-600">{adminData.pmDashboard?.pendingTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-blue-50 rounded-2xl">
                            <span className="text-sm font-bold text-black uppercase tracking-wider">Total Tasks</span>
                            <span className="text-2xl font-black text-blue-600">{adminData.pmDashboard?.totalTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-blue-50 rounded-2xl">
                            <span className="text-sm font-bold text-black uppercase tracking-wider">Task Completion Rate</span>
                            <span className="text-2xl font-black text-blue-600">{adminData.pmDashboard?.taskCompletionRate || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-indigo-50 rounded-2xl">
                            <span className="text-sm font-bold text-black uppercase tracking-wider">Total Team Members</span>
                            <span className="text-2xl font-black text-indigo-600">{adminData.pmDashboard?.totalTeamMembers || 0}</span>
                        </div>
                    </div>
                </div>
            )}

            {(userRole === 'project_manager_officer' || userRole === 'admin' || userRole === 'deputy_manager') && (
                <div className="grid grid-cols-1 gap-6">
                    <InvoiceTrends invoices={adminData.invoices} />
                </div>
            )}
        </div>
    )
}

export default AdminDashboardView
