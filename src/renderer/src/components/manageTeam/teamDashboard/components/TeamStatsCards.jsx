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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-[2.5rem] border border-black/5 shadow-soft hover:shadow-medium transition-all duration-500 relative overflow-hidden group"
        >
          {/* Decorative Gradient Blob */}
          <div className={`absolute -right-8 -top-8 w-32 h-32 ${stat.bg} rounded-full opacity-40 blur-2xl group-hover:scale-125 transition-transform duration-700`} />
          <div className="flex justify-between items-start mb-8 relative z-10">
            <div>
              <p className="text-black text-xl uppercase tracking-widest mb-1.5">{stat.label}</p>
              <h3 className="text-2xl font-black text-black tracking-tight">{stat.value}</h3>
            </div>
            <div className={`p-4 rounded-[1.25rem] ${stat.bg} ${stat.color} border border-black/5 shadow-sm group-hover:bg-[#6bbd45] group-hover:text-white group-hover:border-transparent transition-all duration-500`}>
              {stat.icon}
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end">
              <span className="text-sm font-black text-black/60 uppercase tracking-tight">{stat.subValue}</span>
              {stat.label !== "Projects" && (
                <span className="text-base font-black text-black">{Math.round(stat.progress)}%</span>
              )}
            </div>
            <div className="h-3 w-full bg-gray-50 rounded-full border border-black/5 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stat.progress}%` }}
                transition={{ duration: 1, delay: index * 0.1 }}
                className="h-full bg-[#6bbd45] rounded-full shadow-[0_0_10px_rgba(107,189,69,0.3)]"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default TeamStatsCards;
