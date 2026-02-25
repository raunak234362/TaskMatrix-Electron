/* eslint-disable react/prop-types */
import { Briefcase, Clock, TrendingUp, CalendarCheck, Hourglass } from 'lucide-react'

const StatCard = ({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
}) => (
  <div
    className="p-3 lg:p-4 rounded-none border border-gray-200 border-l-4 border-l-green-600 shadow-sm transition-all duration-700 group hover:shadow-md hover:-translate-y-1 relative overflow-hidden bg-white"
  >
    <div className="flex flex-col h-full justify-between gap-2 lg:gap-3 relative z-10">
      <div className="flex items-start justify-between">
        <div className="p-2 lg:p-3 bg-white border border-gray-100 rounded-none shadow-sm group-hover:bg-green-600 transition-all duration-500">
          <Icon className="w-5 h-5 lg:w-6 lg:h-6 text-black group-hover:text-white transition-colors duration-500" />
        </div>
        {trend && (
          <span
            className="text-[10px] font-black px-3 py-1 rounded-full bg-white border border-black text-black uppercase tracking-widest shadow-sm"
          >
            {trend}
          </span>
        )}
      </div>

      <div>
        <p className="text-[12px] lg:text-[14px] font-black text-black/40 uppercase tracking-[0.15em]">{title}</p>
        <h3 className="text-lg lg:text-xl font-black text-black mt-1 tracking-tighter">
          {value}
        </h3>
        {subtext && (
          <div className="mt-2 pt-2 border-t border-black/10">
            <p className="text-[11px] lg:text-[12px] text-black font-black uppercase tracking-tight truncate">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-white border border-gray-200 rounded-none animate-pulse"></div>
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
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
      {/* {totalTasks > 0 ? (
        <StatCard
          title="Efficiency"
          value={`${efficiency}%`}
          subtext="Performance Score"
          icon={CalendarCheck}
          trend={efficiency >= 100 ? 'Optimal' : 'Improving'}
          trendColor="bg-primary"
        />
      ) : (
        <div className="p-4 rounded-xl shadow-sm border border-dashed border-gray-400 bg-gray-50/50 flex flex-col items-center justify-center text-center gap-2 group hover:border-indigo-300 transition-colors duration-500">
          <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-indigo-50 transition-colors">
            <CalendarCheck className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
          </div>
          <p className="text-[8px] text-gray-500 uppercase tracking-widest leading-relaxed max-w-[120px]">
            NO ASSIGNED TASKS
          </p>
        </div>
      )} */}
    </div>
  )
}

export default UserStatsWidget
