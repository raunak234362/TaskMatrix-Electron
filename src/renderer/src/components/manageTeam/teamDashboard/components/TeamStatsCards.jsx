import { Clock, CheckCircle2, Zap, Layout } from "lucide-react";
import { motion } from "framer-motion";

const TeamStatsCards = ({ teamStats }) => {
  const stats = [
    {
      label: "Hours",
      value: `${teamStats.totalWorkedHours || 0} hrs`,
      subValue: `Assigned: ${teamStats.totalAssignedHours || 0} hrs`,
      icon: <Clock size={24} />,
      color: "text-green-600",
      bg: "bg-green-50",
      progress: Math.min(100, (teamStats.totalWorkedHours / teamStats.totalAssignedHours) * 100) || 0,
    },
    {
      label: "Tasks",
      value: teamStats.totalTasks || 0,
      subValue: `Completed: ${teamStats.completedTasks || 0}`,
      icon: <CheckCircle2 size={24} />,
      color: "text-green-600",
      bg: "bg-green-50",
      progress: (teamStats.completedTasks / teamStats.totalTasks) * 100 || 0,
    },
    {
      label: "Efficiency",
      value: `${teamStats.efficiency || 0}%`,
      subValue: "Performance Score based on completion of Tasks",
      icon: <Zap size={24} />,
      color: "text-green-600",
      bg: "bg-green-50",
      progress: teamStats.efficiency || 0,
    },
    // {
    //   label: "Projects",
    //   value: teamStats.projectCount || 0,
    //   subValue: "Active Projects",
    //   icon: <Layout size={24} />,
    //   color: "text-green-700",
    //   bg: "bg-green-100",
    //   progress: 100,
    // },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-4 sm:p-5 rounded-none border border-green-400 shadow-soft hover:shadow-medium transition-all duration-500 relative overflow-hidden group"
        >
          {/* Decorative Gradient Blob */}
          <div className={`absolute -right-8 -top-8 w-32 h-32 ${stat.bg} rounded-none opacity-40 blur-2xl group-hover:scale-125 transition-transform duration-700`} />
          <div className="flex justify-between items-center mb-4 sm:mb-6 relative z-10 w-full gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1 rounded-none bg-green-50 text-green-700 transition-all duration-500 shrink-0">
                {stat.icon}
              </div>
              <span className="text-black text-xs sm:text-sm font-bold uppercase tracking-wider shrink-0">{stat.label}</span>
            </div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold text-black tracking-normal whitespace-nowrap shrink-0">{stat.value}</h3>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-end gap-2">
              <span className="text-[9px] sm:text-xs font-semibold text-black uppercase tracking-normal truncate" title={stat.subValue}>{stat.subValue}</span>
              {stat.label !== "Projects" && (
                <span className="text-xs sm:text-sm font-bold text-black shrink-0">{Math.round(stat.progress)}%</span>
              )}
            </div>
            <div className="h-2.5 w-full bg-gray-50 rounded-none border border-green-800 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.progress}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full bg-green-600 rounded-none shadow-[0_0_10px_rgba(107,189,69,0.3)]"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TeamStatsCards;
