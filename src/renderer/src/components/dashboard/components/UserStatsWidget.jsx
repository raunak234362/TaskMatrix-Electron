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
    className="p-3 lg:p-4 rounded-none border border-gray-200 border-l-4 border-l-green-600 shadow-sm transition-all duration-700 group hover:shadow-md hover:-translate-y-1 relative overflow-hidden bg-white rounded-xl"
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
        <p className="text-[12px] lg:text-[14px] font-semibold text-black/40 uppercase tracking-[0.15em]">{title}</p>
        <h3 className="text-lg lg:text-xl font-black text-black mt-1 tracking-tighter">
          {value}
        </h3>
        {subtext && (
          <div className="mt-2 pt-2 border-t border-black/10">
            <p className="text-[11px] lg:text-[12px] text-black uppercase tracking-wider truncate">
              {subtext}
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
);

const UserStatsWidget = ({ stats, loading, userRole }) => {
  const formatHours = (decimalHours) => {
    const totalMinutes = Math.round(decimalHours * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const isPMO = userRole?.toUpperCase() === 'PROJECT_MANAGER_OFFICER'

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 ${isPMO ? 'lg:grid-cols-1' : 'lg:grid-cols-4'} gap-3 lg:gap-4`}>
        {[...Array(isPMO ? 0 : 4)].map((_, i) => (
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

  // If PMO and everything is hidden, return null or an empty div with no height
  if (isPMO) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
      {/* Active Projects */}
      {!isPMO && (
        <StatCard
          title="Active Projects"
          value={projectsCount}
          subtext={`${totalTasks} Total Tasks`}
          icon={Briefcase}
          trend="Active"
          trendColor="bg-primary"
        />
      )}

      {/* Allocated Hours */}
      {!isPMO && (
        <StatCard
          title="Allocated Hours"
          value={formatHours(allocatedHours)}
          subtext="Total Estimated Time"
          icon={Hourglass}
          trend="Planned"
          trendColor="bg-primary"
        />
      )}

      {/* Worked Hours */}
      {!isPMO && (
        <StatCard
          title="Worked Hours"
          value={formatHours(workedHours)}
          subtext={`${formatHours(Math.max(0, allocatedHours - workedHours))} Remaining`}
          icon={Clock}
          trend={workedHours > allocatedHours ? 'Overtime' : 'On Track'}
          trendColor={workedHours > allocatedHours ? 'bg-red-500' : 'bg-primary'}
        />
      )}
    </div>
  )
}

export default UserStatsWidget
