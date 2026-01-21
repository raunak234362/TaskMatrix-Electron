/* eslint-disable react/prop-types */

import { CheckCircle2, Briefcase, Clock, TrendingUp, CalendarCheck } from 'lucide-react'

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend }) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${colorClass} text-white`}
  >
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black opacity-5 rounded-full blur-2xl"></div>

    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
      <div className="flex items-start justify-between">
        <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/10">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-bold px-2 py-1 rounded-lg bg-white/20 text-white backdrop-blur-sm flex items-center gap-1 border border-white/10">
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-medium text-white/80">{title}</p>
        <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</h3>
        {subtext && <p className="text-xs text-white/60 mt-2 font-medium">{subtext}</p>}
      </div>
    </div>
  </div>
)

const UserStatsWidget = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl"></div>
        ))}
      </div>
    )
  }

  const {
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    totalHours = 0,
    projectsCount = 0,
    efficiency = 0
  } = stats || {}

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Projects */}
        <StatCard
          title="Active Projects"
          value={projectsCount}
          subtext="Currently Involved"
          icon={Briefcase}
          colorClass="bg-gradient-to-br from-violet-500 to-purple-600"
        />

        {/* Tasks Progress */}
        <StatCard
          title="Tasks Completed"
          value={completedTasks}
          subtext={`${pendingTasks} Pending Tasks`}
          icon={CheckCircle2}
          colorClass="bg-gradient-to-br from-emerald-400 to-teal-600"
          trend={totalTasks > 0 ? `${Math.round((completedTasks / totalTasks) * 100)}% Rate` : null}
        />

        {/* Hours Logged */}
        <StatCard
          title="Hours Logged"
          value={totalHours.toFixed(1)}
          subtext="Total Work Time"
          icon={Clock}
          colorClass="bg-gradient-to-br from-amber-400 to-orange-600"
        />

        {/* Efficiency */}
        <StatCard
          title="Efficiency"
          value={`${efficiency}%`}
          subtext="Performance Score"
          icon={CalendarCheck}
          colorClass="bg-gradient-to-br from-blue-400 to-indigo-600"
          trend="Excellent"
        />
      </div>
    </div>
  )
}

export default UserStatsWidget
