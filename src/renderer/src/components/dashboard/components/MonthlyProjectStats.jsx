import React, { useMemo } from "react";
import { Briefcase, Info, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { motion } from "framer-motion";

const MonthlyProjectStats = ({
  tasks,
  projects,
  selectedMonth,
  selectedYear,
}) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const workloadData = useMemo(() => {
    if (selectedMonth === null || selectedYear === null)
      return { projects: [], count: 0 };

    const startOfMonth = new Date(selectedYear, selectedMonth, 1);
    const endOfMonth = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);

    const activeProjectIds = new Set();

    tasks.forEach((task) => {
      if (!task.start_date || !task.due_date || !task.project_id) return;

      const taskStart = new Date(task.start_date);
      const taskEnd = new Date(task.due_date);

      // Overlap check: task starts before month end AND task ends after month start
      if (taskStart <= endOfMonth && taskEnd >= startOfMonth) {
        activeProjectIds.add(task.project_id);
      }
    });

    const activeProjects = projects.filter((p) => activeProjectIds.has(p.id));

    return {
      projects: activeProjects,
      count: activeProjects.length,
    };
  }, [tasks, projects, selectedMonth, selectedYear]);

  if (selectedMonth === null || selectedYear === null) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-xl">
          <Info className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-700">
            Monthly Workload Insight
          </h3>
          <p className="text-xs text-gray-700">
            Select a specific month to see projects with active tasks during
            that period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-50 rounded-xl">
            <Briefcase className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-700">
              Workload for {months[selectedMonth]} {selectedYear}
            </h3>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Projects with active tasks
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-2xl font-black text-green-600 leading-none">
            {workloadData.count}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase">
            Active Projects
          </span>
        </div>
      </div>

      {workloadData.count > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workloadData.projects.map((project) => (
            <div
              key={project.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-green-200 hover:bg-green-50/30 transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[10px] font-bold text-green-600 shadow-sm group-hover:scale-110 transition-transform">
                {project.projectNumber.slice(-3)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-700 truncate group-hover:text-green-700 transition-colors">
                  {project.name}
                </h4>
                <p className="text-[10px] font-medium text-gray-400 truncate">
                  {project.projectNumber}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <p className="text-sm font-medium text-orange-700">
            No projects have tasks assigned for this month.
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default MonthlyProjectStats;
