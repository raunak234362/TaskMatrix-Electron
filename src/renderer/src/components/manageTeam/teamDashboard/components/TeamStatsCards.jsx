import React from "react";
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
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      progress: (teamStats.completedTasks / teamStats.totalTasks) * 100 || 0,
    },
    {
      label: "Efficiency",
      value: `${teamStats.efficiency || 0}%`,
      subValue: "Performance Score",
      icon: <Zap size={24} />,
      color: "text-teal-600",
      bg: "bg-teal-50",
      progress: teamStats.efficiency || 0,
    },
    {
      label: "Projects",
      value: teamStats.projectCount || 0,
      subValue: "Active Projects",
      icon: <Layout size={24} />,
      color: "text-green-700",
      bg: "bg-green-100",
      progress: 100,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
        >
          {/* Decorative Blob */}
          <div className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500`} />

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <p className="text-black/40 text-[11px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
              <h3 className="text-2xl font-black text-black tracking-tight">{stat.value}</h3>
            </div>
            <div className={`p-3.5 rounded-2xl border border-gray-200 ${stat.bg} ${stat.color} shadow-sm group-hover:bg-green-500 group-hover:text-white transition-colors duration-300`}>
              {stat.icon}
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="flex justify-between text-[10px] font-black text-black/40 uppercase tracking-widest">
              <span>{stat.subValue}</span>
              {stat.label !== "Projects" && <span>{Math.round(stat.progress)}%</span>}
            </div>
            <div className="h-2.5 w-full bg-gray-100 border border-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full bg-green-500 rounded-full transition-all duration-500`}
                style={{ width: `${stat.progress}%` }}
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TeamStatsCards;
