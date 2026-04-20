
import React from 'react'
import {
    Clock,
    Briefcase,
    Calendar,
    Bell
} from 'lucide-react'
import UserStatsWidget from './components/UserStatsWidget'
import ProjectStats from './components/ProjectStats'
import PendingActions from './components/PendingActions'
import InvoiceTrends from './components/InvoiceTrends'
import LiveTaskTimer from './components/LiveTaskTimer'
import AdminInvoiceGraph from './components/AdminInvoiceGraph'
import AdminRFQGraph from './components/AdminRFQGraph'

const AdminDashboardView = ({
    adminData,
    userStats,
    loading,
    tasks,
    projectNotes,
    userRole,
    currentTask,
    handlers
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

    return (
        <div className="flex flex-col gap-4 lg:gap-6 transition-all duration-300 ease-in-out">

            {/* Row 1: Project Overview & Pending Actions */}
            <div className={`grid grid-cols-1 ${userRole === 'project_manager_officer' ? 'lg:grid-cols-1' : 'lg:grid-cols-2'} gap-4 lg:gap-5 transition-all duration-300`}>
                {userRole !== 'project_manager_officer' && (
                    <ProjectStats stats={adminData.projectStats} onCardClick={handleProjectStatClick} />
                )}
                <PendingActions dashboardStats={adminData.dashboardStats} onActionClick={handleActionClick} />
            </div>

            {/* Row 2: Priority Header Row */}
            <div className="relative">
                <div className="bg-linear-to-br from-gray-50/50 to-white/50 p-6 rounded-3xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 relative z-10`}>

                        {/* 3. Upcoming Submittals Trigger */}
                        <div
                            className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                            onClick={() => setShowSubmittalsPopup(true)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-green-100/60 rounded-xl border border-green-200 shadow-sm group-hover:scale-110 transition-transform">
                                        <Briefcase className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[15px] font-black text-gray-700 uppercase tracking-[0.1em]">Upcoming Submittal</span>
                                </div>
                                <span className="text-3xl font-black text-green-600 tracking-tighter">
                                    {adminData?.submittals?.length || 0}
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
                                    <div className="p-2.5 bg-green-100/60 rounded-xl border border-green-200 shadow-sm group-hover:scale-110 transition-transform">
                                        <Bell className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-[15px] font-black text-gray-700 uppercase tracking-[0.1em]">Notes & Updates</span>
                                </div>
                                <span className="text-3xl font-black text-green-600 tracking-tighter">
                                    {projectNotes.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AdminInvoiceGraph invoices={adminData.invoices} onInvoiceClick={handleInvoiceClick} />
                </div>
                <div className="lg:col-span-1">
                    <AdminRFQGraph rfqs={adminData.allRfqs || []} />
                </div>
            </div>

            {userRole === 'project_manager' && (
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

            {userRole === 'project_manager_officer' && (
                <div className="grid grid-cols-1 gap-6">
                    <InvoiceTrends invoices={adminData.invoices} />
                </div>
            )}
        </div>
    )
}

export default AdminDashboardView
