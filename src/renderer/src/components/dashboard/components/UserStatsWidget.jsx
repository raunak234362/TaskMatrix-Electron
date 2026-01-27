/* eslint-disable react/prop-types */
import { CheckCircle2, Briefcase, Clock, TrendingUp, CalendarCheck, Hourglass } from 'lucide-react'

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, trend, trendColor = 'bg-white/20' }) => (
  <div
    className={`p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group relative overflow-hidden ${colorClass} text-white`}
  >
    {/* Decorative Background Elements */}
    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
    <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-24 h-24 bg-black opacity-5 rounded-full blur-2xl"></div>

    <div className="relative z-10 flex flex-col h-full justify-between gap-6">
      <div className="flex items-start justify-between">
        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 group-hover:rotate-12 transition-transform duration-500">
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${trendColor} text-white backdrop-blur-md flex items-center gap-1 border border-white/20 uppercase tracking-wider`}>
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-white/70 uppercase tracking-widest">{title}</p>
        <h3 className="text-4xl font-black text-white mt-2 tracking-tight group-hover:translate-x-1 transition-transform duration-500">{value}</h3>
        {subtext && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-[11px] text-white/80 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
              {subtext}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
)

const UserStatsWidget = ({ stats, loading }) => {
  const formatHours = (decimalHours) => {
    const totalMinutes = Math.round(decimalHours * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-44 bg-gray-100 rounded-3xl animate-pulse"></div>
        ))}
      </div>
    )
  }

  const {
    totalTasks = 0,
    completedTasks = 0,
    pendingTasks = 0,
    allocatedHours = 0,
    workedHours = 0,
    projectsCount = 0,
    efficiency = 0
  } = stats || {}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Active Projects */}
      <StatCard
        title="Active Projects"
        value={projectsCount}
        subtext={`${totalTasks} Total Tasks`}
        icon={Briefcase}
        colorClass="bg-gradient-to-br from-green-400 via-green-600 to-green-700"
        trend="Active"
      />

      {/* Allocated Hours */}
      <StatCard
        title="Allocated Hours"
        value={formatHours(allocatedHours)}
        subtext="Total Estimated Time"
        icon={Hourglass}
        colorClass="bg-gradient-to-br from-green-400 via-green-600 to-green-700"
        trend="Planned"
      />

      {/* Worked Hours */}
      <StatCard
        title="Worked Hours"
        value={formatHours(workedHours)}
        subtext={`${formatHours(Math.max(0, allocatedHours - workedHours))} Remaining`}
        icon={Clock}
        colorClass="bg-gradient-to-br from-green-400 via-green-500 to-green-600"
        trend={workedHours > allocatedHours ? 'Overtime' : 'On Track'}
        trendColor={workedHours > allocatedHours ? 'bg-red-500/40' : 'bg-white/20'}
      />

      {/* Efficiency */}
      {totalTasks > 0 ? (
        <StatCard
          title="Efficiency"
          value={`${efficiency}%`}
          subtext="Performance Score"
          icon={CalendarCheck}
          colorClass="bg-gradient-to-br from-green-400 via-green-500 to-green-600"
          trend={efficiency >= 100 ? 'Optimal' : 'Improving'}
        />
      ) : (
        <div className="p-6 rounded-3xl shadow-sm border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-center gap-3 group hover:border-indigo-300 transition-colors duration-500">
          <div className="p-3 bg-gray-100 rounded-2xl group-hover:bg-indigo-50 transition-colors">
            <CalendarCheck className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed max-w-[150px]">
            YOU'RE NOT ASSIGNED WITH ANY TASK TILL NOW
          </p>
        </div>
      )}
    </div>
  )
}

export default UserStatsWidget
