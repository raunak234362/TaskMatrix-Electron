import { useEffect, useState, useMemo } from "react";
import { formatSeconds } from "../../utils/timeUtils";
import {
  Loader2,
  AlertCircle,
  FileText,
  Settings,
  FolderOpenDot,
  Users,
  Clock,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  Activity,
  X
} from "lucide-react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import AllMileStone from "./mileStone/AllMileStone";
import AllDocument from "./projectDocument/AllDocument";
import WBS from "./wbs/WBS";
import WbsBreakdownPanel from "./wbs/WbsBreakdownPanel";
import AllRFI from "../rfi/AllRfi";
import AddRFI from "../rfi/AddRFI";
import AllSubmittals from "../submittals/AllSubmittals";
import AllNotes from "./notes/AllNotes";
import EditProject from "./EditProject";
import AddSubmittal from "../submittals/AddSubmittals";
import RenderFiles from "../ui/RenderFiles";
import AllCO from "../co/AllCO";
import AddCO from "../co/AddCO";
import CoTable from "../co/CoTable";
import ProjectAnalyticsDashboard from "./ProjectAnalyticsDashboard";
import ProjectMilestoneMetrics from "./mileStone/ProjectMilestoneMetrics";
import TeamsAnalytics from "./TeamsAnalytics";

const GetProjectById = ({ id, onClose }) => {
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [rfiView, setRfiView] = useState("list");
  const [submittalView, setSubmittalView] = useState("list");
  const [editModel, setEditModel] = useState(null);
  const [changeOrderView, setChangeOrderView] = useState("list");
  const [selectedCoId, setSelectedCoId] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

  const fetchProjectTasks = async () => {
    try {
      const response = await Service.GetAllTask();
      if (response && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : [];
        setProjectTasks(allTasks.filter((t) => t.project_id === id));
      }
    } catch (error) {
      console.error("Error fetching project tasks:", error);
    }
  };

  const projectStats = useMemo(() => {
    if (!project) return { assigned: 0, completed: 0, overrun: 0, completedStr: "00:00", overrunStr: "00:00" };

    const assigned = Number(project.estimatedHours) || 0;
    const totalSeconds = projectTasks.reduce((sum, task) => {
      return sum + (task.workingHourTask || []).reduce((tSum, entry) => tSum + (entry.duration_seconds || 0), 0);
    }, 0);

    const completedHours = totalSeconds / 3600;
    const overrunHours = Math.max(0, completedHours - assigned);

    const formatSecondsToHHMM = (totalSecs) => {
      const h = Math.floor(totalSecs / 3600);
      const m = Math.floor((totalSecs % 3600) / 60);
      return `${h}:${m.toString().padStart(2, "0")}`;
    };

    return {
      assigned,
      completed: completedHours,
      overrun: overrunHours,
      completedStr: formatSecondsToHHMM(totalSeconds),
      overrunStr: formatSecondsToHHMM(Math.max(0, totalSeconds - (assigned * 3600)))
    };
  }, [project, projectTasks]);

  // Group "others" wbsType tasks by their projectBundle.bundleKey
  const otherTasksByBundle = useMemo(() => {
    const grouped = {};
    projectTasks.forEach((task) => {
      if (String(task.wbsType || "").toLowerCase() !== "others") return;
      const key =
        task.projectBundle?.bundleKey ||
        task.projectBundle?.bundle?.bundleKey ||
        task.bundleKey ||
        "Uncategorised";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(task);
    });
    return grouped;
  }, [projectTasks]);

  // Alias map: every possible API spelling → canonical category key
  // Handles: single/double-l (modeling/modelling), spaces, hyphens, mixed case
  const WBS_TYPE_ALIAS = {
    // Modelling
    "modeling": "modelling",
    "modelling": "modelling",
    // Modelling Checking
    "modeling_checking": "modelling_checking",
    "modelling_checking": "modelling_checking",
    "modeling checking": "modelling_checking",
    "modelling checking": "modelling_checking",
    "modeling-checking": "modelling_checking",
    "modelling-checking": "modelling_checking",
    "modelingchecking": "modelling_checking",
    "modellingchecking": "modelling_checking",
    // Detailing
    "detailing": "detailing",
    // Detailing Checking
    "detailing_checking": "detailing_checking",
    "detailing checking": "detailing_checking",
    "detailing-checking": "detailing_checking",
    "detailingchecking": "detailing_checking",
    // Erection
    "erection": "erection",
    "erection_plan": "erection",
    // Erection Checking
    "erection_checking": "erection_checking",
    "erection checking": "erection_checking",
    "erection-checking": "erection_checking",
    "erectionchecking": "erection_checking",
    // Others
    "others": "others",
    "other": "others",
  };

  const normaliseWbsType = (raw) => {
    if (!raw) return "others";
    // Collapse whitespace & lowercase
    const key = String(raw).toLowerCase().trim().replace(/\s+/g, " ");
    return WBS_TYPE_ALIAS[key] ?? "others";
  };

  const wbsTasksByBundle = useMemo(() => {
    const grouped = {};
    projectTasks.forEach((task) => {
      const bundleKey =
        task.projectBundle?.bundleKey ||
        task.projectBundle?.bundle?.bundleKey ||
        task.bundleKey ||
        "Uncategorised";
      if (!grouped[bundleKey]) grouped[bundleKey] = {};

      const typeKey = normaliseWbsType(task.wbsType);

      if (!grouped[bundleKey][typeKey]) grouped[bundleKey][typeKey] = [];
      grouped[bundleKey][typeKey].push(task);
    });
    return grouped;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks]);

  // Aggregate total seconds for primary WBS categories across the entire project
  const wbsCategoryTotals = useMemo(() => {
    const totals = {
      modelling: 0,
      modelling_checking: 0,
      detailing: 0,
      detailing_checking: 0,
      erection: 0,
      erection_checking: 0,
    };

    projectTasks.forEach((task) => {
      const typeKey = normaliseWbsType(task.wbsType);
      if (totals[typeKey] !== undefined) {
        const taskSeconds = (task.workingHourTask || []).reduce((s, w) => s + (w.duration_seconds || 0), 0);
        totals[typeKey] += taskSeconds;
      }
    });

    return totals;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectTasks]);

  const rfiData = useMemo(() => {
    return project?.rfi || [];
  }, [project]);

  const changeOrderData = useMemo(() => {
    return project?.changeOrders || [];
  }, [project]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      setError(null);
      const [projRes] = await Promise.all([
        Service.GetProjectById(id),
        fetchProjectTasks()
      ]);
      setProject(projRes?.data || null);
    } catch (err) {
      setError("Failed to load project details");
      console.error("Error fetching project:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditModel = (project) => {
    setEditModel(project);
  };

  const submittalData = useMemo(() => {
    return project?.submittals || [];
  }, [project]);

  useEffect(() => {
    if (id) fetchProject();
  }, [id]);

  const handleCoSuccess = (createdCO) => {
    const coId = createdCO?.id || createdCO?._id;
    if (coId) {
      setSelectedCoId(coId);
      setChangeOrderView("table");
      fetchProject();
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "—";

  if (loading)
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading project details...
      </div>
    );

  if (error || !project)
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Project not found"}
      </div>
    );

  return (
    <>
      <div className="w-full relative laptop:fit">
        <div className="sticky top-0 bg-white z-50 pb-2">
          {/* Header */}
          <div className="flex justify-between items-start pr-4 pt-2">
            <div className="flex flex-col">
              <h2 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tight leading-none">
                {project.name}
              </h2>
              <p className="text-black/60 text-[12px] font-bold uppercase tracking-widest mt-1">
                Project No: {project.projectCode || project.serialNo}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest border-2 transition-all ${project.status === "ACTIVE"
                  ? "bg-green-100 text-black"
                  : "bg-red-100 text-black "
                  }`}
              >
                {project.status}
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-red-200 border-2 border-black text-black font-black uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all text-xs shadow-sm hover:shadow-md active:scale-95"
                >
                  Close
                </button>
              )}
            </div>
          </div>
          {/* Tabs */}
          <div className="mb-4 mt-4">
            <div className="hidden md:flex gap-3 overflow-x-auto custom-scrollbar pb-3 pt-1">
              {[
                { key: "overview", label: "Overview", icon: ClipboardList },
                { key: "analytics", label: "Analytics", icon: TrendingUp },
                { key: "teamAnalytics", label: "Team Analytics", icon: Users },
                { key: "details", label: "Details", icon: FileText },
                { key: "files", label: "Files", icon: FolderOpenDot },
                { key: "wbs", label: "WBS", icon: ClipboardList },
                { key: "milestones", label: "Milestones", icon: Clock },
                { key: "notes", label: "Notes", icon: FileText },
                { key: "rfi", label: "RFI", icon: FileText },
                { key: "CDrfi", label: "CD RFI", icon: FileText },
                { key: "submittals", label: "Submittals", icon: FileText },
                { key: "CDsubmittals", label: "CD Submittals", icon: FileText },
                { key: "changeOrder", label: "Change Order", icon: Settings },
              ]
                .filter(
                  (tab) =>
                    !(
                      userRole === "staff" &&
                      ["wbs", "changeOrder", "milestones", "analytics", "teamAnalytics", "CDrfi", "CDsubmittals"].includes(tab.key)
                    )
                )
                .map(({ key, label, icon: TabIcon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex items-center gap-2 border-1 px-5 py-2 text-[12px] rounded-lg font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm hover:shadow-md active:scale-95 ${activeTab === key
                      ? "bg-green-50 text-black border-[#6bbd45]"
                      : "text-black bg-white border-black hover:border-black"
                      }`}
                  >
                    <TabIcon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="pt-2 p-1">
          {/* Overview TabContent */}
          {activeTab === "overview" && (
            <div className="space-y-6 animate-in slide-in-from-top-2 duration-500">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-row items-center justify-between bg-white p-6 rounded-2xl border-1 border-black bg-blue-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6 text-black">
                    <Clock size={20} strokeWidth={3} />
                    <span className="text-sm font-black uppercase tracking-widest opacity-60">Hours Estimated</span>
                  </div>
                  <h3 className="text-4xl text-black tracking-tighter">{projectStats.assigned}h</h3>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                <div className="flex flex-row items-center justify-between bg-white p-6 rounded-2xl border-1 border-black bg-emerald-400 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6 text-emerald-500">
                    <CheckCircle2 size={20} strokeWidth={3} />
                    <span className="textsms font-black uppercase tracking-widest opacity-60">Hours Completed</span>
                  </div>
                  <h3 className="text-4xl  text-black tracking-tighter">{projectStats.completedStr}</h3>

                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
                </div>

                <div className={`flex flex-row items-center justify-between p-6 rounded-2xl border border-black bg-white relative overflow-hidden group hover:shadow-md transition-all ${projectStats.overrun > 0 ? "bg-white border-red-400" : "bg-white"}`}>
                  <div className={`flex items-center gap-3 mb-6 ${projectStats.overrun > 0 ? "text-red-500" : "text-slate-400"}`}>
                    <AlertCircle size={20} strokeWidth={3} />
                    <span className="text-sm font-black text-black uppercase tracking-widest opacity-60">Overrun / Delay</span>
                  </div>
                  <h3 className={`text-4xl tracking-tighter ${projectStats.overrun > 0 ? "text-red-600" : "text-black"}`}>
                    {projectStats.overrunStr}
                  </h3>
                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500 ${projectStats.overrun > 0 ? "bg-red-500/5" : "bg-slate-500/5"}`}></div>
                </div>
              </div>

              {/* Progress and Milestones */}
              <div className="bg-white rounded-3xl border-1 border-slate-50 p-6">
                <ProjectMilestoneMetrics projectId={id} />
              </div>

              {/* ✅ Other Tasks — Logged Time (grouped by bundleKey) */}
              {Object.keys(otherTasksByBundle).length > 0 && (
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  {/* Section header */}
                  <div className="px-5 py-3 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-slate-500" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">
                      Other Tasks &mdash; Logged Time
                    </h4>
                    <span className="ml-auto text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                      {Object.values(otherTasksByBundle).reduce((s, t) => s + t.length, 0)} tasks
                    </span>
                  </div>

                  {/* Grouped by bundleKey */}
                  <div className="divide-y divide-gray-100">
                    {Object.entries(otherTasksByBundle).map(([bundleKey, tasks]) => {
                      const bundleTotalSeconds = tasks.reduce(
                        (sum, t) =>
                          sum +
                          (t.workingHourTask || []).reduce(
                            (s, w) => s + (w.duration_seconds || 0),
                            0,
                          ),
                        0,
                      );

                      const statusMap = {
                        completed: "bg-green-100 text-green-700 border-green-200",
                        complete: "bg-green-100 text-green-700 border-green-200",
                        validate_complete: "bg-green-100 text-green-700 border-green-200",
                        complete_other: "bg-green-100 text-green-700 border-green-200",
                        assigned: "bg-blue-100 text-blue-700 border-blue-200",
                        in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
                        rework: "bg-orange-100 text-orange-700 border-orange-200",
                      };

                      return (
                        <div key={bundleKey}>
                          {/* Bundle key header row */}
                          <div className="flex items-center gap-3 px-5 py-2 bg-slate-50/80 border-b border-gray-100">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#6bbd45] shrink-0" />
                            <span className="flex-1 text-xs font-black uppercase tracking-widest text-slate-600">
                              {bundleKey}
                            </span>
                            <span className="text-xs font-bold text-slate-500">
                              {tasks.length} task{tasks.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs font-black text-[#3a8a1a] min-w-[52px] text-right">
                              {formatSeconds(bundleTotalSeconds)}
                            </span>
                          </div>

                          {/* Task rows */}
                          <div className="divide-y divide-gray-50">
                            {tasks.map((task, idx) => {
                              const assignee = task.user
                                ? `${task.user.firstName || ""} ${task.user.lastName || ""}`.trim()
                                : task.assignedTo
                                  ? `${task.assignedTo.firstName || ""} ${task.assignedTo.lastName || ""}`.trim()
                                  : "Unassigned";

                              const initials = assignee
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase();

                              const taskSeconds = (task.workingHourTask || []).reduce(
                                (s, w) => s + (w.duration_seconds || 0),
                                0,
                              );

                              const sc =
                                statusMap[(task.status || "").toLowerCase()] ||
                                "bg-gray-100 text-gray-500 border-gray-200";

                              return (
                                <div
                                  key={task.id || idx}
                                  className="flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 transition-colors"
                                >
                                  {/* Avatar */}
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                                    {initials || "?"}
                                  </div>

                                  {/* Assignee + task name */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-gray-800 truncate leading-tight">
                                      {assignee}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate leading-tight mt-0.5">
                                      {task.name || task.title || `Task #${idx + 1}`}
                                    </p>
                                  </div>

                                  {/* Status badge */}
                                  <span
                                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide shrink-0 ${sc}`}
                                  >
                                    {task.status || "—"}
                                  </span>

                                  {/* Logged time */}
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs font-black text-gray-700 min-w-[42px] text-right">
                                      {taskSeconds > 0 ? formatSeconds(taskSeconds) : "—"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ✅ Core WBS Categories — Total Time Overview */}
              <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white">
                <div className="px-5 py-3 bg-slate-50 border-b border-gray-200 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-700">
                    Primary WBS &mdash; Total Logged Time
                  </h4>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100">
                  {[
                    { key: "modelling", label: "Modelling", color: "text-blue-600", bg: "bg-blue-50" },
                    { key: "modelling_checking", label: "Modeling C.", color: "text-violet-600", bg: "bg-violet-50" },
                    { key: "detailing", label: "Detailing", color: "text-cyan-600", bg: "bg-cyan-50" },
                    { key: "detailing_checking", label: "Detailing C.", color: "text-fuchsia-600", bg: "bg-fuchsia-50" },
                    { key: "erection", label: "Erection", color: "text-amber-600", bg: "bg-amber-50" },
                    { key: "erection_checking", label: "Erection C.", color: "text-orange-600", bg: "bg-orange-50" },
                  ].map((cat) => (
                    <div key={cat.key} className="p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 truncate w-full">
                        {cat.label}
                      </span>
                      <div className={`px-3 py-1.5 rounded-xl ${cat.bg}`}>
                        <span className={`text-sm font-black ${cat.color}`}>
                          {wbsCategoryTotals[cat.key] > 0 ? formatSeconds(wbsCategoryTotals[cat.key]) : "00:00"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Overview & Project Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border-2 border-slate-50 shadow-sm hover:shadow-md transition-all">
                  <h4 className="text-[12px] font-black uppercase tracking-widest flex items-center gap-3 mb-8">
                    <Clock className="w-5 h-5 text-blue-500" strokeWidth={3} /> Timeline Overview
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-4 border-b border-slate-100">
                      <span className="text-[14px] font-black uppercase tracking-widest">Start Date</span>
                      <span className="text-[14px] font-black tracking-tight">{formatDate(project.startDate)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-8 rounded-2xl border-2 border-slate-50 shadow-sm hover:shadow-md transition-all flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg border border-slate-100 mb-6 group">
                    <Activity className="w-8 h-8 text-[#6bbd45] group-hover:scale-110 transition-transform" strokeWidth={3} />
                  </div>
                  <h4 className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-2">Project Status</h4>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-6 px-6 py-2 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm">{project.status}</span>
                  <p className="text-[10px] font-extrabold text-black/40 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6bbd45] animate-pulse"></span>
                    Current Phase: <span className="text-black">{project.stage || "IFA"}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ Details */}
          {activeTab === "details" && (
            <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="md:col-span-2 mt-6">
                <h4 className=" text-black uppercase tracking-widest mb-3 flex items-center gap-2 text-">
                  <FolderOpenDot className="w-5 h-5" />
                  Project Scope
                </h4>
                <div
                  className="text-black bg-green-100 p-4 rounded-xl border border-black shadow-sm prose prose-sm max-w-none font-medium"
                  dangerouslySetInnerHTML={{
                    __html: project.description || "No description available."
                  }}
                />
              </div>
              <div className="space-y-3">
                {!["staff", "project_manager", "department_manager"].includes(userRole) && (
                  <InfoRow
                    label="Estimated Hours"
                    value={project.estimatedHours || 0}
                  />
                )}
                <InfoRow
                  label="Department"
                  value={project.department?.name || "—"}
                />
                <InfoRow label="Team" value={project.team?.name || "—"} />
                <InfoRow
                  label="Manager"
                  value={
                    project.manager
                      ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                      : "—"
                  }
                />
                <InfoRow
                  label="Fabricator"
                  value={project.fabricator?.fabName || "—"}
                />
                <InfoRow label="Tools" value={project.tools || "—"} />
              </div>

              <div className="space-y-3">
                <InfoRow label="Stage" value={project.stage || "—"} />
                <InfoRow
                  label="Start Date"
                  value={formatDate(project.startDate)}
                />
                <InfoRow
                  label="Approval Date"
                  value={formatDate(project.approvalDate)}
                />
                <InfoRow
                  label="Fabrication Date"
                  value={formatDate(project.fabricationDate)}
                />
                <InfoRow label="End Date" value={formatDate(project.endDate)} />
              </div>

              <div className="p-4 bg-green-200 rounded-xl border border-black text-sm">
                <h4 className="text-md font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Connection Design Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag
                    label="Connection Design"
                    active={project.connectionDesign}
                  />
                  <ScopeTag label="Misc Design" active={project.miscDesign} />
                  <ScopeTag
                    label="Customer Design"
                    active={project.customerDesign}
                  />
                </div>
              </div>
              <div className="p-4 bg-green-200 rounded-xl border border-black text-sm">
                <h4 className="text-md font-black text-black uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" /> Detailing Scope
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <ScopeTag
                    label="Detailing Main"
                    active={project.detailingMain}
                  />
                  <ScopeTag
                    label="Detailing Misc"
                    active={project.detailingMisc}
                  />
                </div>
              </div>

              {userRole === "admin" && (
                <div className="pt-2 flex flex-wrap gap-3">
                  <Button
                    className="py-1 px-3 text-sm bg-green-100 text-black border border-black font-black uppercase tracking-widest hover:bg-green-200 transition-all"
                    onClick={() => handleEditModel(project)}
                  >
                    Edit Project
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* ✅ Files */}
          {activeTab === "files" && (
            <div className="space-y-4">
              <AllDocument projectId={id} />
              <RenderFiles
                files={project.files || []}
                table="project"
                parentId={id}
                formatDate={formatDate}
              />
              <AllDocument />
            </div>
          )}
          {activeTab === "milestones" && (
            <AllMileStone project={project} onUpdate={fetchProject} />
          )}

          {/* ✅ Team */}
          {activeTab === "team" && (
            <div className="text-gray-700 text-sm">
              <h4 className="font-black text-black mb-2 flex items-center gap-1 uppercase tracking-widest">
                <Users className="w-4 h-4" /> Assigned Team
              </h4>
              <p className="font-medium">Team: {project.team?.name || "No team assigned."}</p>
              <p>
                Manager:{" "}
                {project.manager
                  ? `${project.manager.firstName} ${project.manager.lastName} (${project.manager.username})`
                  : "Not assigned."}
              </p>
            </div>
          )}

          {/* ✅ Notes */}
          {activeTab === "notes" && <AllNotes projectId={id} />}
          {activeTab === "wbs" && userRole !== "staff" && (
            <div className="space-y-6">
              <WBS id={id} stage={project.stage || ""} />
              <WbsBreakdownPanel wbsTasksByBundle={wbsTasksByBundle} />
            </div>
          )}
          {activeTab === "rfi" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${rfiView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${rfiView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create RFI
                    </button>
                  )}
                </nav>
              </div>

              {/* RFI Content */}
              {rfiView === "list" ? (
                <AllRFI rfiData={rfiData} />
              ) : (
                <AddRFI
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setRfiView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "submittals" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${submittalView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${submittalView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create Submittal
                    </button>
                  )}
                </nav>
              </div>

              {/* Submittal Content */}
              {submittalView === "list" ? (
                <AllSubmittals submittalData={submittalData} />
              ) : (
                <AddSubmittal
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setSubmittalView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "CDrfi" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setRfiView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${rfiView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All RFIs
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setRfiView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${rfiView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create RFI
                    </button>
                  )}
                </nav>
              </div>

              {/* RFI Content */}
              {rfiView === "list" ? (
                <AllRFI rfiData={rfiData} />
              ) : (
                <AddRFI
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setRfiView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "CDsubmittals" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setSubmittalView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${submittalView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Submittals
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setSubmittalView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${submittalView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Create Submittal
                    </button>
                  )}
                </nav>
              </div>

              {/* Submittal Content */}
              {submittalView === "list" ? (
                <AllSubmittals submittalData={submittalData} />
              ) : (
                <AddSubmittal
                  project={project}
                  onSuccess={() => {
                    fetchProject();
                    setSubmittalView("list");
                  }}
                />
              )}
            </div>
          )}
          {activeTab === "changeOrder" && userRole !== "staff" && (
            <div className="space-y-4">
              {/* Sub-tabs for RFI */}
              <div className="flex justify-start mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                  <button
                    onClick={() => setChangeOrderView("list")}
                    className={`
                      whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                      ${changeOrderView === "list"
                        ? "bg-green-100 text-black"
                        : "bg-gray-50 text-black hover:bg-green-50"
                      }
                    `}
                  >
                    All Change Order
                  </button>
                  {!["client", "staff", "estimator"].includes(userRole) && (
                    <button
                      onClick={() => setChangeOrderView("add")}
                      className={`
                        whitespace-nowrap py-3 px-6 border border-black font-black text-xs uppercase tracking-widest rounded-lg transition-all
                        ${changeOrderView === "add"
                          ? "bg-green-100 text-black"
                          : "bg-gray-50 text-black hover:bg-green-50"
                        }
                    `}
                    >
                      Raise Change Order
                    </button>
                  )}
                </nav>
              </div>

              {/* Change Order Content */}
              {changeOrderView === "list" ? (
                <AllCO changeOrderData={changeOrderData} />
              ) : changeOrderView === "add" ? (
                <AddCO project={project} onSuccess={handleCoSuccess} />
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-semibold text-black">
                      Change Order Table
                    </h4>
                    <button
                      onClick={() => setChangeOrderView("list")}
                      className="text-sm text-black hover:text-black font-medium"
                    >
                      &larr; Back to List
                    </button>
                  </div>
                  {selectedCoId && <CoTable coId={selectedCoId} />}
                </div>
              )}
            </div>
          )}
          {activeTab === "analytics" && (
            <ProjectAnalyticsDashboard projectId={id} />
          )}
          {activeTab === "teamAnalytics" && (
            <TeamsAnalytics
              projectId={id}
              managerId={project.managerID}
              tasks={projectTasks}
            />
          )}
        </div>
      </div >
      {editModel && (
        <EditProject
          projectId={id}
          onCancel={() => setEditModel(null)}
          onSuccess={() => {
            setEditModel(null);
            fetchProject();
          }}
        />
      )
      }
    </>
  );
};

/* ─────────────────────────────────────────────
   WBS Breakdown Panel imported above
───────────────────────────────────────────── */

// ✅ InfoRow Component
const InfoRow = ({
  label,
  value,
}) => (
  <div className="flex justify-between md:text-md text-sm pb-1">
    <span className="font-black text-black/50 uppercase tracking-widest text-[10px]">{label}:</span>
    <span className="text-black font-black uppercase tracking-tight">{value}</span>
  </div>
);

// ✅ ScopeTag Component
const ScopeTag = ({ label, active }) => (
  <span
    className={`px-4 py-1.5 text-sm font-black uppercase tracking-widest rounded-full border border-black ${active
      ? "bg-green-100 text-black shadow-sm"
      : "bg-gray-100 text-black/50"
      }`}
  >
    {label}
  </span>
);

export default GetProjectById;
