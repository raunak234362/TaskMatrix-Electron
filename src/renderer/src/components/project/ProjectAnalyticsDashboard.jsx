/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useMemo, useRef } from "react";
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

  const startRef = useRef(null);
  const endRef = useRef(null);

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
      (sum, entry) => sum + ((entry.duration_seconds) || 0),
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

  // Group filtered tasks by WBS Bundle (keyed by bundleKey — the shared field)
  const tasksByBundle = useMemo(() => {
    const grouped = {};
    filteredTasks.forEach((task) => {
      const key =
        task.projectBundle?.bundleKey ||
        task.projectBundle?.bundle?.bundleKey ||
        task.bundleKey ||
        "Uncategorised";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
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

  const COLORS = ["#6bbd45", "#374151", "#FFBB28", "#FF8042", "#8884d8"];

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
        <Loader2 className="w-8 h-8 animate-spin text-[#6bbd45] mb-4" />
        <p className="text-lg font-medium">Calculating project statistics...</p>
      </div>
    );
  }

  const renderTaskRow = (task) => {
    const workedSeconds = calculateWorkedSeconds(task);
    const assignedHours = task.allocationLog?.allocatedHours
      ? parseTimeToDecimal(task.allocationLog.allocatedHours)
      : parseFloat(task.hours) || 0;
    const workedHours = workedSeconds / 60;
    const isOverrun = workedHours > assignedHours && assignedHours > 0;

    return (
      <div
        key={task.id}
        className="grid grid-cols-6 gap-4 p-4 border-b border-black/10 hover:bg-gray-50/50 transition-colors"
      >
        <div className="col-span-2 flex items-center gap-3">
          <div
            className={`p-1.5 rounded-none border border-black ${isOverrun ? "bg-red-50 text-black" : "bg-green-50 text-black"}`}
          >
            <CheckCircle2 size={16} />
          </div>
          <div>
            <p className="text-sm font-normal text-black">{task.name}</p>
            <p className="text-xs text-black font-normal uppercase tracking-wider">
              {task.wbsType || "Task"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-none border border-black bg-slate-50 flex items-center justify-center">
            <User size={12} className="text-black" />
          </div>
          <span className="text-sm font-normal text-black truncate">
            {task.user?.firstName} {task.user?.lastName}
          </span>
        </div>
        <div className="flex items-center justify-center">
          <span className="px-2.5 py-1 bg-blue-50 text-black rounded-none border border-black text-xs font-normal">
            {assignedHours.toFixed(2)}h Assigned
          </span>
        </div>
        <div className="flex items-center justify-center">
          <span
            className={`px-2.5 py-1 rounded-none text-xs font-normal border border-black ${isOverrun ? "bg-red-50 text-black" : "bg-slate-50 text-black"}`}
          >
            {formatSeconds(workedSeconds || 0)} Worked
          </span>
        </div>
        <div className="flex items-center justify-end">
          <span
            className={`text-xs font-normal px-2 py-0.5 rounded-none uppercase tracking-wider border border-black ${task.status === "COMPLETED"
              ? "bg-green-50 text-black"
              : task.status === "ASSIGNED"
                ? "bg-blue-50 text-black"
                : "bg-amber-50 text-black"
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
      <div className="bg-white py-3 px-6 rounded-none border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-6">
          
          {/* Start Date Selector */}
          <div 
            onClick={() => {
              try { startRef.current?.showPicker(); } catch (e) { startRef.current?.focus(); }
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <Calendar size={18} className="text-black" />
            <div className="relative flex items-center">
              <input
                ref={startRef}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="clean-date-input text-sm border-0 bg-transparent focus:ring-0 focus:outline-none text-black font-bold cursor-pointer p-0 w-28 uppercase"
                placeholder="Start Date"
              />
            </div>
          </div>

          {/* End Date Selector */}
          <div 
            onClick={() => {
              try { endRef.current?.showPicker(); } catch (e) { endRef.current?.focus(); }
            }}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <Calendar size={18} className="text-black" />
            <span className="text-black font-bold text-sm uppercase tracking-wider">TO</span>
            <div className="relative flex items-center">
              <input
                ref={endRef}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                className="clean-date-input text-sm border-0 bg-transparent focus:ring-0 focus:outline-none text-black font-bold cursor-pointer p-0 w-28 uppercase"
                placeholder="End Date"
              />
            </div>
            {/* The third calendar icon from reference image */}
            <Calendar size={18} className="text-black" />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-black" />
            <div className="relative flex items-center">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm border-0 bg-transparent focus:ring-0 focus:outline-none text-black font-bold cursor-pointer p-0 pr-5 appearance-none"
              >
                <option value="ALL">All Status</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="COMPLETED">Completed</option>
                <option value="REWORK">Rework</option>
              </select>
              <ChevronDown size={14} className="text-black pointer-events-none ml-1" />
            </div>
          </div>

        </div>

        <button
          onClick={handleDownload}
          className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-wider shadow-sm inline-flex items-center justify-center cursor-pointer gap-2"
        >
          <Download size={18} />
          Download Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Briefcase className="text-black" size={20} />}
          label="Filtered Tasks"
          value={filteredTasks.length}
          color="green"
        />
        <SummaryCard
          icon={<Flag className="text-black" size={20} />}
          label="Active Milestones"
          value={Object.keys(tasksByMilestone).filter(id => id !== "unassigned").length}
          color="green"
        />
        <SummaryCard
          icon={<Layers className="text-black" size={20} />}
          label="Worked Hours"
          value={`${Math.round(filteredTasks.reduce((sum, t) => sum + calculateWorkedSeconds(t) / 3600, 0))}h`}
          color="green"
        />
        <SummaryCard
          icon={<TrendingUp className="text-black" size={20} />}
          label="Completion Rate"
          value={`${Math.round((filteredTasks.filter((t) => t.status === "COMPLETED").length / (filteredTasks.length || 1)) * 100)}%`}
          color="green"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-none border border-black shadow-sm">
          <h3 className="text-sm font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-wider">
            <TrendingUp size={20} className="text-black" />
            Hours by Milestone
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tick={{ fill: "#000000" }} />
                <YAxis fontSize={10} tick={{ fill: "#000000" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "0", border: "1px solid black", boxShadow: "none" }}
                />
                <Legend />
                <Bar dataKey="assigned" name="Assigned Hours" fill="#374151" radius={[0, 0, 0, 0]} />
                <Bar dataKey="worked" name="Worked Hours" fill="#6bbd45" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-none border border-black shadow-sm">
          <h3 className="text-sm font-bold text-black mb-6 flex items-center gap-2 uppercase tracking-wider">
            <CheckCircle2 size={20} className="text-black" />
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
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="square" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Group by Milestone */}
      <section className="bg-white rounded-none border border-black shadow-sm overflow-hidden">
        <div className="bg-slate-100 px-6 py-4 border-b border-black flex items-center justify-between">
          <div className="flex items-center gap-2 text-black">
            <Flag size={18} className="text-black" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">
              Tasks by Milestone
            </h3>
          </div>
          <span className="text-sm font-bold text-black bg-white px-2 py-1 rounded-none shadow-sm border border-black uppercase tracking-wider text-center">
            {Object.keys(tasksByMilestone).length} Sections
          </span>
        </div>

        <div className="divide-y divide-black/10">
          {milestones.length > 0 ? (
            milestones.map((ms) => (
              <div key={ms.id}>
                <button
                  onClick={() => toggleSection(`ms-${ms.id}`)}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-colors group"
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="p-2 bg-green-50 rounded-none border border-black">
                      {expandedSections[`ms-${ms.id}`] ? (
                        <ChevronDown size={18} className="text-black" />
                      ) : (
                        <ChevronRight size={18} className="text-black" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-normal text-black text-sm uppercase tracking-wider">
                        {ms.subject}
                      </h4>
                      <p className="text-sm text-black font-normal mt-0.5">
                        Due:{" "}
                        {ms.approvalDate
                          ? new Date(ms.approvalDate).toLocaleDateString()
                          : "TBD"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-normal text-black uppercase tracking-wider">
                        {tasksByMilestone[ms.id]?.length || 0} Tasks
                      </p>
                      <p className="text-xs text-black font-normal uppercase tracking-widest mt-0.5">
                        In this section
                      </p>
                    </div>
                  </div>
                </button>

                {expandedSections[`ms-${ms.id}`] && (
                  <div className="bg-slate-50 p-2">
                    <div className="bg-white rounded-none border border-black overflow-hidden shadow-sm">
                      {tasksByMilestone[ms.id] &&
                        tasksByMilestone[ms.id].length > 0 ? (
                        <div>
                          {/* Table Header */}
                          <div className="grid grid-cols-6 gap-4 p-4 bg-slate-100 border-b border-black">
                            <p className="col-span-2 text-sm font-bold text-black uppercase tracking-wider">
                              Task Details
                            </p>
                            <p className="text-sm font-bold text-black uppercase tracking-wider">
                              Assigned To
                            </p>
                            <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-center">
                              Estimated
                            </p>
                            <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-center">
                              Worked
                            </p>
                            <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-end">
                              Status
                            </p>
                          </div>
                          {tasksByMilestone[ms.id].map(renderTaskRow)}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-black text-xs font-bold">
                          No tasks match the filters for this milestone.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-black text-xs font-bold">
              No milestones found for this project.
            </div>
          )}
        </div>
      </section>

      {/* Group by WBS Bundle */}
      <section className="bg-white rounded-none border border-black shadow-sm overflow-hidden">
        <div className="bg-slate-100 px-6 py-4 border-b border-black flex items-center justify-between">
          <div className="flex items-center gap-2 text-black">
            <Layers size={18} className="text-black" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">
              Tasks by WBS Bundle
            </h3>
          </div>
          <span className="text-sm font-bold text-black bg-white px-2 py-1 rounded-none shadow-sm border border-black uppercase tracking-wider text-center">
            {Object.keys(tasksByBundle).length} Sections
          </span>
        </div>

        <div className="divide-y divide-black/10">
          {bundles.length > 0 ? (
            bundles.map((bundle) => {
              // Resolve the shared bundleKey — present on both bundle objects and tasks
              const bundleKey =
                bundle.bundleKey ||
                bundle.name ||
                (bundle.wbs && bundle.wbs[0]?.bundleKey) ||
                bundle.id;
              const bundleTasks = tasksByBundle[bundleKey] || [];
              return (
                <div key={bundle.id || bundleKey}>
                  <button
                    onClick={() => toggleSection(`bundle-${bundleKey}`)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4 text-left">
                      <div className="p-2 bg-green-50 rounded-none border border-black">
                        {expandedSections[`bundle-${bundleKey}`] ? (
                          <ChevronDown size={18} className="text-black" />
                        ) : (
                          <ChevronRight size={18} className="text-black" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-normal text-black text-sm uppercase tracking-wider">
                          {bundle.bundleKey || bundle.name || "Unnamed Bundle"}
                        </h4>
                        <p className="text-sm text-black font-normal mt-0.5">
                          Stage: {bundle.stage || "—"} {"\u00A0"}·{"\u00A0"} {bundleTasks.length} task{bundleTasks.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-6">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                        <p className="text-sm font-bold text-black uppercase tracking-wider">
                          Exec
                        </p>
                        <p className="text-sm font-bold text-black uppercase tracking-wider">
                          Check
                        </p>
                        <p className="text-sm font-normal text-black">
                          {((bundle.totalExecHr) / 60 || 0).toFixed(2)}h
                        </p>
                        <p className="text-sm font-normal text-black">
                          {((bundle.totalCheckHr) / 60 || 0).toFixed(2)}h
                        </p>
                      </div>
                      <div className="flex flex-col items-end justify-center min-w-[100px]">
                        {(() => {
                          const totalWorkedSeconds = bundleTasks.reduce((sum, t) => sum + calculateWorkedSeconds(t), 0);
                          const totalWorkedHours = totalWorkedSeconds / 3600;
                          const totalAllocatedHours = (Number(bundle.totalExecHr / 60) || 0) + (Number(bundle.totalCheckHr / 60) || 0);
                          const percentage = totalAllocatedHours > 0 ? Math.min(100, (totalWorkedHours / totalAllocatedHours) * 100) : 0;
                          return (
                            <>
                              <div className="flex items-center gap-2 mb-1 justify-end">
                                <span className="text-sm font-normal text-black">{percentage.toFixed(0)}%</span>
                                <span className="text-sm text-black font-normal">Completed</span>
                              </div>
                              <div className="flex items-center gap-2 mb-1 justify-end">
                                <span className="text-sm font-normal text-black">{(totalAllocatedHours - totalWorkedHours).toFixed(1)}h</span>
                                <span className="text-sm text-black font-normal">Remaining</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-200 rounded-none overflow-hidden border border-black">
                                <div
                                  className={`h-full rounded-none ${percentage >= 100 ? 'bg-[#6bbd45]' : 'bg-blue-500'}`}
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </button>
                  {expandedSections[`bundle-${bundleKey}`] && (
                    <div className="bg-slate-50 p-2">
                      <div className="bg-white rounded-none border border-black overflow-hidden shadow-sm">
                        {bundleTasks.length > 0 ? (
                          <div>
                            <div className="grid grid-cols-6 gap-4 p-4 bg-slate-100 border-b border-black">
                              <p className="col-span-2 text-sm font-bold text-black uppercase tracking-wider">
                                Task Details
                              </p>
                              <p className="text-sm font-bold text-black uppercase tracking-wider">
                                Assigned To
                              </p>
                              <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-center">
                                Estimated
                              </p>
                              <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-center">
                                Worked
                              </p>
                              <p className="text-sm font-bold text-black uppercase tracking-wider flex justify-end">
                                Status
                              </p>
                            </div>
                            {bundleTasks.map(renderTaskRow)}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-black text-xs font-bold">
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
            <div className="p-8 text-center text-black text-xs font-bold">
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
    blue: "bg-blue-50 text-black border border-black",
    purple: "bg-purple-50 text-black border border-black",
    amber: "bg-amber-50 text-black border border-black",
    green: "bg-green-50 text-black border border-black",
  };

  return (
    <div className="bg-white p-6 rounded-none border border-black shadow-sm flex flex-row justify-between items-center gap-4 group transition-shadow">
      <div className="flex flex-row justify-between items-center gap-4">
        <div
          className={`p-3 rounded-none ${colorMap[color]} group-hover:scale-105 transition-transform w-fit mt-2`}
        >
          {icon}
        </div>
        <div>
          <p className="text-lg font-bold text-black uppercase tracking-wider">
            {label}
          </p>
        </div>
      </div>
      <div>
        <p className="text-xl font-bold text-black tracking-tight text-right">
          {value}
        </p>
      </div>
    </div>
  );
};

export default ProjectAnalyticsDashboard;
