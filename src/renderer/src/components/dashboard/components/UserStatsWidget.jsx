/* eslint-disable react/prop-types */
import { Briefcase, Clock, TrendingUp, CalendarCheck, Hourglass } from 'lucide-react'

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  colorClass,
  trend,
  trendColor = 'bg-black/20'
}) => (
  <div
    className={`p-5 rounded-xl border border-gray-300 shadow-[0_10px_10px_rgba(22,163,74,0.02),0_10px_30px_rgba(0,0,0,0.01)] transition-all duration-700 group hover:shadow-[0_30px_70px_rgba(22,163,74,0.1),0_20px_40px_rgba(0,0,0,0.05)] hover:-translate-y-1 relative overflow-hidden bg-green-100/20`}
  >
    <div className="flex flex-col h-full justify-between gap-5 relative z-10">
      <div className="flex items-start justify-between">
        <div className="p-5 bg-white rounded-3xl shadow-lg group-hover:bg-primary group-hover:text-white transition-all duration-500 scale-110">
          <Icon className="w-8 h-8 text-primary group-hover:text-green-700 transition-colors duration-500" />
        </div>
        {trend && (
          <span
            className={`text-xs font-black px-5 py-2 rounded-2xl ${trendColor} bg-green-100 text-black uppercase tracking-widest shadow-lg`}
          >
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-sm font-black text-black/40 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-2xl font-semibold text-black mt-3 tracking-tighter">
          {value}
        </h3>
        {subtext && (
          <div className="mt-6 pt-5 border-t border-black/10">
            <p className="text-xs text-black font-black uppercase tracking-wide">
              {subtext}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

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
          <div key={i} className="h-40 bg-white border border-gray-100 rounded-[4px] animate-pulse"></div>
        ))}
      </div>
    )
  }

  const {
    totalTasks = 0,
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
        trend="Active"
        trendColor="bg-primary"
      />

      {/* Allocated Hours */}
      <StatCard
        title="Allocated Hours"
        value={formatHours(allocatedHours)}
        subtext="Total Estimated Time"
        icon={Hourglass}
        trend="Planned"
        trendColor="bg-primary"
      />

      {/* Worked Hours */}
      <StatCard
        title="Worked Hours"
        value={formatHours(workedHours)}
        subtext={`${formatHours(Math.max(0, allocatedHours - workedHours))} Remaining`}
        icon={Clock}
        trend={workedHours > allocatedHours ? 'Overtime' : 'On Track'}
        trendColor={workedHours > allocatedHours ? 'bg-red-500' : 'bg-primary'}
      />

      {/* Efficiency */}
      {totalTasks > 0 ? (
        <StatCard
          title="Efficiency"
          value={`${efficiency}%`}
          subtext="Performance Score"
          icon={CalendarCheck}
          trend={efficiency >= 100 ? 'Optimal' : 'Improving'}
          trendColor="bg-primary"
        />
      ) : (
        <div className="p-6 rounded-3xl shadow-sm border border-dashed border-gray-300 bg-gray-50/50 flex flex-col items-center justify-center text-center gap-3 group hover:border-indigo-300 transition-colors duration-500">
          <div className="p-3 bg-gray-100 rounded-2xl group-hover:bg-indigo-50 transition-colors">
            <CalendarCheck className="w-6 h-6 text-gray-400 group-hover:text-indigo-500" />
          </div>
          <p className="text-[10px]  text-gray-500 uppercase tracking-widest leading-relaxed max-w-[150px]">
            YOU&apos;RE NOT ASSIGNED WITH ANY TASK TILL NOW
          </p>
        </div>
      )}
    </div>
  )
}

export default UserStatsWidget
