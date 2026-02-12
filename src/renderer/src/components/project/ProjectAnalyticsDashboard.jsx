/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo } from "react";
import {
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Layers,
  Flag,
  User,
  Briefcase,
  TrendingUp,
  Download,
  Calendar,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Service from "../../api/Service";
import { formatSeconds } from "../../utils/timeUtils";

const parseTimeToDecimal = (timeStr) => {
  if (!timeStr || typeof timeStr !== "string") return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours + minutes / 60;
};

const ProjectAnalyticsDashboard = ({ projectId }) => {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [expandedSections, setExpandedSections] = useState({});

  // Filtering State
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, milestonesRes, bundlesRes] = await Promise.all([
        Service.GetAllTask(),
        Service.GetProjectMilestoneById(projectId),
        Service.GetBundleByProjectId(projectId),
      ]);

      if (tasksRes?.data) {
        const allTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
        setTasks(allTasks.filter((t) => t.project_id === projectId));
      }

      setMilestones(milestonesRes?.data || []);
      setBundles(bundlesRes?.data || []);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) fetchData();
  }, [projectId]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const calculateWorkedSeconds = (task) => {
    return (task.workingHourTask || []).reduce(
      (sum, entry) => sum + (entry.duration_seconds || 0),
      0,
    );
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const taskDate = task.created_at ? new Date(task.created_at) : null;
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const dateMatch =
        (!start || (taskDate && taskDate >= start)) &&
        (!end || (taskDate && taskDate <= end));
      const statusMatch = statusFilter === "ALL" || task.status === statusFilter;

      return dateMatch && statusMatch;
    });
  }, [tasks, startDate, endDate, statusFilter]);

  // Group filtered tasks by Milestone
  const tasksByMilestone = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach((task) => {
      const msId = task.mileStone_id || "unassigned";
      if (!grouped[msId]) grouped[msId] = [];
      grouped[msId].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Group filtered tasks by WBS Bundle
  const tasksByBundle = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach((task) => {
      const bundleId = task.project_bundle_id || task.wbs_id || "unassigned";
      if (!grouped[bundleId]) grouped[bundleId] = [];
      grouped[bundleId].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  // Analytics for Charts
  const chartData = useMemo(() => {
    return milestones.map((ms) => {
      const msTasks = tasksByMilestone[ms.id] || [];
      const assigned = msTasks.reduce((sum, t) => {
        const hours = t.allocationLog?.allocatedHours
          ? parseTimeToDecimal(t.allocationLog.allocatedHours)
          : parseFloat(t.hours) || 0;
        return sum + hours;
      }, 0);
      const worked = msTasks.reduce((sum, t) => sum + calculateWorkedSeconds(t) / 3600, 0);

      return {
        name: ms.subject,
        assigned: parseFloat(assigned.toFixed(2)),
        worked: parseFloat(worked.toFixed(2)),
      };
    });
  }, [milestones, tasksByMilestone]);

  const statusData = useMemo(() => {
    const statusCounts = filteredTasks.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  const handleDownload = () => {
    const headers = ["Task Name", "Type", "Assigned To", "Assigned Hours", "Worked Hours", "Status", "Created At"];
    const rows = filteredTasks.map((t) => [
      t.name,
      t.wbsType || "Task",
      `${t.user?.firstName || ""} ${t.user?.lastName || ""}`,
      t.allocationLog?.allocatedHours
        ? parseTimeToDecimal(t.allocationLog.allocatedHours)
        : parseFloat(t.hours) || 0,
      (calculateWorkedSeconds(t) / 3600).toFixed(2),
      t.status,
      t.created_at ? new Date(t.created_at).toLocaleDateString() : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `project_analytics_${projectId}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-700">
        <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
        <p className="text-lg font-medium">Calculating project statistics...</p>
      </div>
    );
  }

  const renderTaskRow = (task) => {
    const workedSeconds = calculateWorkedSeconds(task);
    const assignedHours = task.allocationLog?.allocatedHours
      ? parseTimeToDecimal(task.allocationLog.allocatedHours)
      : parseFloat(task.hours) || 0;
    const workedHours = workedSeconds / 3600;
    const isOverrun = workedHours > assignedHours && assignedHours > 0;

    return (
      <div
        key={task.id}
        className="grid grid-cols-6 gap-4 p-4 border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
      >
        <div className="col-span-2 flex items-center gap-3">
          <div
            className={`p-1.5 rounded-lg ${isOverrun ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
          >
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{task.name}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
              {task.wbsType || "Task"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
            <User size={12} className="text-slate-500" />
          </div>
          <span className="text-sm text-gray-700 truncate">
            {task.user?.firstName} {task.user?.lastName}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
            {assignedHours.toFixed(2)}h Assigned
          </span>
        </div>
        <div className="flex items-center justify-center">
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-semibold ${isOverrun ? "bg-red-50 text-red-700" : "bg-slate-100 text-slate-700"}`}
          >
            {formatSeconds(workedSeconds || 0)} Worked
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter ${task.status === "COMPLETED"
                ? "bg-green-100 text-green-700"
                : task.status === "ASSIGNED"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
              }`}
          >
            {task.status}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header with Filters and Actions */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="Start Date"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="End Date"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border-gray-200 rounded-lg focus:ring-green-500 focus:border-green-500"
            >
              <option value="ALL">All Status</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="COMPLETED">Completed</option>
              <option value="REWORK">Rework</option>
            </select>
          </div>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-green-200 active:scale-95"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Briefcase className="text-blue-600" size={20} />}
          label="Filtered Tasks"
          value={filteredTasks.length}
          color="blue"
        />
        <SummaryCard
          icon={<Flag className="text-purple-600" size={20} />}
          label="Active Milestones"
          value={Object.keys(tasksByMilestone).filter(id => id !== "unassigned").length}
          color="purple"
        />
        <SummaryCard
          icon={<Layers className="text-amber-600" size={20} />}
          label="Worked Hours"
          value={`${Math.round(filteredTasks.reduce((sum, t) => sum + calculateWorkedSeconds(t) / 3600, 0))}h`}
          color="amber"
        />
        <SummaryCard
          icon={<TrendingUp className="text-green-600" size={20} />}
          label="Success Rate"
          value={`${Math.round((filteredTasks.filter((t) => t.status === "COMPLETED").length / (filteredTasks.length || 1)) * 100)}%`}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Hours by Milestone
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: "#6b7280" }} />
                <YAxis fontSize={10} tick={{ fill: "#6b7280" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                />
                <Legend />
                <Bar dataKey="assigned" name="Assigned Hours" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="worked" name="Worked Hours" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-600" />
            Task Status Distribution
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Group by Milestone */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Flag size={18} className="text-purple-600" />
            <h3 className="text-lg font-bold tracking-tight">
              Tasks by Milestone
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-200 uppercase tracking-widest text-center">
            {Object.keys(tasksByMilestone).length} Sections
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {milestones.length > 0 ? (
            milestones.map((ms) => (
              <div key={ms.id}>
                <button
                  onClick={() => toggleSection(`ms-${ms.id}`)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2 bg-purple-50 rounded-xl group-hover:scale-110 transition-transform">
                      {expandedSections[`ms-${ms.id}`] ? (
                        <ChevronDown size={18} className="text-purple-600" />
                      ) : (
                        <ChevronRight size={18} className="text-purple-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg">
                        {ms.subject}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        Due:{" "}
                        {ms.approvalDate
                          ? new Date(ms.approvalDate).toLocaleDateString()
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex -space-x-2">
                      {tasksByMilestone[ms.id]?.slice(0, 3).map((_, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center"
                        >
                          <User size={14} className="text-slate-500" />
                        </div>
                      ))}
                      {tasksByMilestone[ms.id]?.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                          +{tasksByMilestone[ms.id].length - 3}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-700">
                        {tasksByMilestone[ms.id]?.length || 0} Tasks
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        In this section
                      </p>
                    </div>
                  </div>
                </button>

                {expandedSections[`ms-${ms.id}`] && (
                  <div className="bg-gray-50/30 p-2">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                      {tasksByMilestone[ms.id] &&
                        tasksByMilestone[ms.id].length > 0 ? (
                        <div>
                          {/* Table Header */}
                          <div className="grid grid-cols-6 gap-4 p-4 bg-slate-50/50 border-b border-gray-100">
                            <p className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Task Details
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Assigned To
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-center">
                              Estimated
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-center">
                              Worked
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-end">
                              Status
                            </p>
                          </div>
                          {tasksByMilestone[ms.id].map(renderTaskRow)}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-500 italic text-sm">
                          No tasks match the filters for this milestone.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 italic text-sm">
              No milestones found for this project.
            </div>
          )}
        </div>
      </section>

      {/* Group by WBS Bundle */}
      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <Layers size={18} className="text-amber-600" />
            <h3 className="text-lg font-bold tracking-tight">
              Tasks by WBS Bundle
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-200 uppercase tracking-widest text-center">
            {Object.keys(tasksByBundle).length} Sections
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {bundles.length > 0 ? (
            bundles.map((bundle) => {
              const bundleId =
                bundle.id || bundle._id || (bundle.wbs && bundle.wbs[0]?.id);
              return (
                <div key={bundleId}>
                  <button
                    onClick={() => toggleSection(`bundle-${bundleId}`)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2 bg-amber-50 rounded-xl group-hover:scale-110 transition-transform">
                        {expandedSections[`bundle-${bundleId}`] ? (
                          <ChevronDown size={18} className="text-amber-600" />
                        ) : (
                          <ChevronRight size={18} className="text-amber-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">
                          {bundle.name || bundle.bundleKey || "Unnamed Bundle"}
                        </h4>
                        <p className="text-xs text-gray-500 font-medium">
                          Stage: {bundle.stage || "—"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Exec
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Check
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {bundle.totalExecHr || 0}h
                        </p>
                        <p className="text-sm font-bold text-slate-700">
                          {bundle.totalCheckHr || 0}h
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {tasksByBundle[bundleId]?.length || 0} Tasks
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
                          Matched
                        </p>
                      </div>
                    </div>
                  </button>
                  {expandedSections[`bundle-${bundleId}`] && (
                    <div className="bg-gray-50/30 p-2">
                      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        {tasksByBundle[bundleId] &&
                          tasksByBundle[bundleId].length > 0 ? (
                          <div>
                            <div className="grid grid-cols-6 gap-4 p-4 bg-slate-50/50 border-b border-gray-100">
                              <p className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Task Details
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Assigned To
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-center">
                                Estimated
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-center">
                                Worked
                              </p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-end">
                                Status
                              </p>
                            </div>
                            {tasksByBundle[bundleId].map(renderTaskRow)}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-gray-500 italic text-sm">
                            No tasks found matching these filters.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-gray-400 italic text-sm">
              No WBS bundles found for this project.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

const SummaryCard = ({
  icon,
  label,
  value,
  color,
}) => {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4 group hover:shadow-md transition-shadow">
      <div
        className={`p-3 rounded-2xl ${colorMap[color]} group-hover:scale-110 transition-transform`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <p className="text-2xl font-black text-gray-800 tracking-tight">
          {value}
        </p>
      </div>
    </div>
  );
};

export default ProjectAnalyticsDashboard;
