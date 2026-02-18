
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
        setShowNotesPopup
    } = handlers

    return (
        <div className="flex flex-col gap-4 lg:gap-6 transition-all duration-300 ease-in-out">

            {/* Row 1: Project Overview & Pending Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 transition-all duration-300">
                <ProjectStats stats={adminData.projectStats} onCardClick={handleProjectStatClick} />
                <PendingActions dashboardStats={adminData.dashboardStats} onActionClick={handleActionClick} />
            </div>

            {/* Row 2: Priority Header Row */}
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

                        {/* 2. Upcoming Deadlines Trigger */}
                        <div
                            className="bg-green-50/60 p-4 rounded-2xl border border-gray-300 shadow-sm flex flex-col justify-center hover:shadow-md transition-all cursor-pointer hover:-translate-y-1 group min-h-[100px]"
                            onClick={() => setShowDeadlinesPopup(true)}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-blue-100/60 rounded-xl border border-blue-200 shadow-sm group-hover:scale-110 transition-transform">
                                        <Calendar className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-xs font-black text-gray-700 uppercase tracking-wide">Upcoming Assigned Task Deadlines</span>
                                </div>
                                <span className="text-3xl font-black text-blue-600 tracking-tighter">
                                    {tasks.filter(t => t.status !== 'COMPLETED').length}
                                </span>
                            </div>
                        </div>

                        {/* 3. Upcoming Submittals Trigger */}
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

            {/* Row 3: User Stats (Compressed) */}
            <UserStatsWidget stats={userStats} loading={loading} />

            {userRole === 'project_manager' && (
                <div className="bg-white p-6 rounded-3xl border border-gray-200">
                    <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6">
                        Team & Task Overview
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
                        <div className="flex flex-col gap-1 p-4 bg-slate-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Completed Tasks</span>
                            <span className="text-2xl font-black text-slate-700">{adminData.pmDashboard?.completedTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-red-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-red-300 uppercase tracking-wider">Overdue Tasks</span>
                            <span className="text-2xl font-black text-red-600">{adminData.pmDashboard?.overdueTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-amber-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Pending Tasks</span>
                            <span className="text-2xl font-black text-amber-600">{adminData.pmDashboard?.pendingTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-blue-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Total Tasks</span>
                            <span className="text-2xl font-black text-blue-600">{adminData.pmDashboard?.totalTasks || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-blue-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider">Task Completion Rate</span>
                            <span className="text-2xl font-black text-blue-600">{adminData.pmDashboard?.taskCompletionRate || 0}</span>
                        </div>
                        <div className="flex flex-col gap-1 p-4 bg-indigo-50 rounded-2xl">
                            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Total Team Members</span>
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
