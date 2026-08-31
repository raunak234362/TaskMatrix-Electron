// components/employee/GetEmployeeByID.jsx
import { useEffect, useState, useCallback, useMemo } from "react";
import Service from "../../../api/Service";
import {
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListTodo,
  Zap,
  TrendingUp,
  CalendarDays,
  Filter,
  BarChart3,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Tag,
  Layers,
  Edit2,
  Download,
  FileSpreadsheet,
  FileText as FilePdf,
  X,
  FileText
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import Button from "../../fields/Button";
import EditEmployee from "./EditEmployee";
import { formatDateTime } from "../../../utils/dateUtils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  AreaChart,
  Area
} from "recharts";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const secToHms = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds === 0) return "0 hrs 00 mins";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h} hrs ${String(m).padStart(2, "0")} mins`;
};

// Total worked seconds from workingHourTask[]
const calcWorkedSec = (workingHourTask) => {
  if (!Array.isArray(workingHourTask) || workingHourTask.length === 0) return 0;
  return workingHourTask.reduce((sum, s) => sum + (Number(s.duration_seconds) || 0), 0);
};

// Allocated hours (string "5") → seconds
const allocToSec = (allocatedHours) => {
  const h = parseFloat(allocatedHours);
  return isNaN(h) ? 0 : h * 3600;
};

// Calculate EPS Score breakdown for any list of tasks (used for custom date range reports)
const calculateEPSForTasks = (taskList) => {
  if (!taskList || taskList.length === 0) {
    return {
      score: 0,
      completionScore: 0,
      disciplineScore: 0,
      sessionQualityScore: 0,
      underutilizedScore: 0,
      reworkScore: 0,
      overrunScore: 0
    };
  }

  let completedTasks = 0;
  let overrunCount = 0;
  let underutilizedCount = 0;
  let reworkTasks = 0;
  let flagsCount = 0;
  let totalIdlePercent = 0;
  let validSessionTasks = 0;

  const completedStatuses = ["COMPLETED", "VALIDATE_COMPLETE", "COMPLETE", "COMPLETE_OTHER"];

  taskList.forEach((t) => {
    const statusUpper = String(t.status || "").toUpperCase();
    const isCompleted = completedStatuses.includes(statusUpper);
    if (isCompleted) completedTasks++;

    const allocatedSec = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
    const workedSec = calcWorkedSec(t.workingHourTask);

    if (isCompleted && allocatedSec > 0 && workedSec > allocatedSec) overrunCount++;
    if (isCompleted && allocatedSec > 0 && workedSec < allocatedSec * 0.6) underutilizedCount++;

    const hasRework = statusUpper === "REWORK" || (t.workingHourTask || []).some(w => String(w.type || "").toUpperCase() === "REWORK");
    if (hasRework) reworkTasks++;

    if (t.autoCloseActionTaken) flagsCount += 5;
    if (t.workingHourTask && t.workingHourTask.length > 5) flagsCount += 1;

    if (t.workingHourTask && t.workingHourTask.length > 0) {
      const sessions = [...t.workingHourTask].filter(s => s.started_at).sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
      if (sessions.length > 0) {
        const firstStart = new Date(sessions[0].started_at).getTime();
        const lastEnd = sessions[sessions.length - 1].ended_at ? new Date(sessions[sessions.length - 1].ended_at).getTime() : Date.now();
        const wallTime = (lastEnd - firstStart) / 1000;
        const activeTime = sessions.reduce((s, wh) => s + (Number(wh.duration_seconds) || 0), 0);
        if (wallTime > 0 && activeTime > 0) {
          const idle = Math.max(0, wallTime - activeTime);
          totalIdlePercent += idle / wallTime;
          validSessionTasks++;
        }
      }
    }
  });

  const completionScore = taskList.length > 0 ? (completedTasks / taskList.length) * 100 : 0;
  const overrunScore = completedTasks > 0 ? Math.max(0, 100 - (overrunCount / completedTasks) * 100) : 100;
  const underutilizedScore = completedTasks > 0 ? Math.max(0, 100 - (underutilizedCount / completedTasks) * 100) : 100;
  const reworkScore = taskList.length > 0 ? Math.max(0, 100 - (reworkTasks / taskList.length) * 100) : 100;
  const disciplineScore = Math.max(0, 100 - flagsCount);
  const avgIdlePct = validSessionTasks > 0 ? totalIdlePercent / validSessionTasks : 0;
  const sessionQualityScore = Math.max(0, 100 - avgIdlePct * 100);

  const score = (
    completionScore * 0.25 +
    overrunScore * 0.20 +
    underutilizedScore * 0.10 +
    reworkScore * 0.20 +
    disciplineScore * 0.15 +
    sessionQualityScore * 0.10
  );

  return {
    score,
    completionScore,
    disciplineScore,
    sessionQualityScore,
    underutilizedScore,
    reworkScore,
    overrunScore
  };
};

const COMPLETION_LABEL = {
  RANGE_0_10: "0–10%",
  RANGE_11_25: "11–25%",
  RANGE_26_50: "26–50%",
  RANGE_51_75: "51–75%",
  RANGE_76_90: "76–90%",
  RANGE_91_100: "91–100%",
};

const STATUS_META = {
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200" },
  VALIDATE_COMPLETE: { label: "Validate Complete", color: "bg-teal-100 text-teal-700 border-teal-200" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200" },
  PAUSED: { label: "Paused", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  PENDING: { label: "Pending", color: "bg-gray-100 text-gray-600 border-gray-200" },
  OVERRUN: { label: "Overrun", color: "bg-red-100 text-red-600 border-red-200" },
  REJECTED: { label: "Rejected", color: "bg-rose-100 text-rose-600 border-rose-200" },
  COMPLETE: { label: "Complete", color: "bg-green-100 text-green-700 border-green-200" },
};

const statusMeta = (s) =>
  STATUS_META[s] || { label: s || "Unknown", color: "bg-gray-100 text-gray-500 border-gray-200" };

// ─── StatCard ────────────────────────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, sub, accentColor = "bg-green-600" }) => (
  <div className="flex items-center gap-3 px-4 py-3 group">
    <div className={`w-1 self-stretch rounded-full ${accentColor} opacity-70 shrink-0`} />
    <div className="min-w-0">
      <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold text-black leading-none">{value}</p>
      {sub && <p className="text-[10px] text-black/40 font-medium mt-1">{sub}</p>}
    </div>
  </div>
);

// ─── TaskRow ─────────────────────────────────────────────────────────────────

const TaskRow = ({ task }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = statusMeta(task.status);

  const assignedSec = allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
  const workedSec = calcWorkedSec(task.workingHourTask);
  const efficiency = assignedSec > 0 ? Math.round((workedSec / assignedSec) * 100) : null;
  const isOverrun = assignedSec > 0 && workedSec > assignedSec;

  const sessions = task.workingHourTask || [];

  return (
    <div
      className={`border rounded-none overflow-hidden transition-all duration-200 ${isOverrun ? "border-red-700 bg-red-50/10" : "border-black bg-white"
        }`}
    >
      {/* Main Row */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-green-50/20 transition-colors gap-4"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p className="text-md font-bold text-black leading-snug">
            {task.name || "Untitled Task"}
          </p>
          {task.description && task.description !== task.name && (
            <p className="text-sm text-black font-medium mt-0.5 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.created_on && (
              <span className="inline-flex items-center gap-1 text-sm text-black font-bold uppercase">
                <CalendarDays className="w-3 h-3 text-black" />
                {new Date(task.created_on).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            )}
            {task.project?.name && (
              <span className="text-sm font-bold text-black uppercase truncate max-w-[200px]">
                📁 {task.project.name}
              </span>
            )}
            {task.wbsType && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-black uppercase">
                <Layers className="w-3 h-3 text-black" />
                {task.wbsType}
              </span>
            )}
            {task.Stage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 uppercase">
                <Tag className="w-3 h-3 text-purple-700" />
                {task.Stage}
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-bold uppercase px-3 py-0.5 rounded-none border ${meta.color.replace(/rounded-full/g, 'rounded-none')}`}
          >
            {meta.label}
          </span>

          <div className="text-right space-y-0.5">
            <p className="text-sm text-black font-bold uppercase">
              Assigned:{" "}
              <span className="text-black">{secToHms(assignedSec)}</span>
            </p>
            <p className={`text-sm font-bold uppercase ${isOverrun ? "text-red-700" : "text-black"}`}>
              Worked:{" "}
              <span className={` ${isOverrun ? "text-red-700" : "text-black"}`}>
                {secToHms(workedSec)}
              </span>
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-black mt-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-black mt-1" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-black bg-gray-50/60 animate-in slide-in-from-top-1 fade-in duration-150">
          {/* Meta Grid */}
          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-black">
            <DetailCell label="Priority" value={task.priority != null ? `P${task.priority}` : "—"} />
            <DetailCell
              label="Completion"
              value={COMPLETION_LABEL[task.LineItemCompletion] || task.LineItemCompletion || "—"}
            />
            {task.due_date && (
              <DetailCell
                label="Due Date"
                value={new Date(task.due_date).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              />
            )}
            {task.updatedAt && (
              <DetailCell
                label="Last Updated"
                value={new Date(task.updatedAt).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              />
            )}
            {task.project?.manager && (
              <DetailCell
                label="Manager"
                value={`${task.project.manager.firstName || ""} ${task.project.manager.lastName || ""}`.trim() || "—"}
              />
            )}
          </div>

          {/* Work Sessions */}
          {sessions.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[9px] font-bold text-black uppercase mb-2">
                Work Sessions ({sessions.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {sessions.map((s, i) => (
                  <div
                    key={s.id || i}
                    className="flex items-center justify-between bg-white rounded-none px-3 py-2 border border-black text-[11px]"
                  >
                    <div className="flex items-center gap-2 text-black font-bold">
                      <span className="w-5 h-5 rounded-none bg-green-50 text-black border border-black flex items-center justify-center text-[9px] font-bold shrink-0">
                        {i + 1}
                      </span>
                      <span>
                        {s.started_at
                          ? new Date(s.started_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })
                          : "—"}
                      </span>
                      <span className="text-black/40">→</span>
                      <span>
                        {s.ended_at
                          ? new Date(s.ended_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })
                          : "In Progress"}
                      </span>
                    </div>
                    <span className="font-bold text-black shrink-0 ml-4">
                      {secToHms(Number(s.duration_seconds) || 0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DetailCell = ({ label, value }) => (
  <div>
    <p className="text-[9px] font-bold text-black uppercase mb-0.5">{label}</p>
    <p className="text-xs font-medium text-black">{value}</p>
  </div>
);

import { createPortal } from "react-dom";

// ─── Main Component ───────────────────────────────────────────────────────────

const GetEmployeeByID = ({ id, onClose }) => {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editModel, setEditModel] = useState(null);

  // EPS
  const [epsData, setEpsData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [epsLoading, setEpsLoading] = useState(false);

  // EPS Trend
  const [trendData, setTrendData] = useState([]);
  const [showTrend, setShowTrend] = useState(false);
  const [trendLoading, setTrendLoading] = useState(false);

  // Tasks
  const [allTasks, setAllTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskDateFrom, setTaskDateFrom] = useState("");
  const [taskDateTo, setTaskDateTo] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const [taskProjectFilter, setTaskProjectFilter] = useState("ALL");
  const [selectedTask, setSelectedTask] = useState(null);
  const TASKS_PER_PAGE = 15;

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

  // ── Fetchers ────────────────────────────────────────────────────────────────

  const fetchEmployee = useCallback(async () => {
    if (!id) { setError("Invalid employee ID"); setLoading(false); return; }
    try {
      setLoading(true); setError(null);
      const res = await Service.FetchEmployeeByID(id);
      setEmployee(res?.data?.user || null);
    } catch (err) {
      setError("Failed to load employee");
      console.error(err);
    } finally { setLoading(false); }
  }, [id]);

  const fetchEPS = useCallback(async () => {
    if (!id) return;
    try {
      setEpsLoading(true);
      const res = await Service.GetEmployeeEPS({ employeeId: id, year: selectedYear, month: selectedMonth });
      setEpsData(res?.data || res);
    } catch (err) {
      console.error(err); setEpsData(null);
    } finally { setEpsLoading(false); }
  }, [id, selectedYear, selectedMonth]);

  const fetchMonthlyTrend = useCallback(async () => {
    if (!id) return;
    try {
      setTrendLoading(true);
      setShowTrend(true);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      let monthsToFetch = 12;
      if (selectedYear === currentYear) {
        monthsToFetch = currentMonth;
      } else if (selectedYear > currentYear) {
        monthsToFetch = 0;
      }

      const months = Array.from({ length: monthsToFetch }, (_, i) => i + 1);

      const promises = months.map(m =>
        Service.GetEmployeeEPS({ employeeId: id, year: selectedYear, month: m })
          .then(res => ({
            month: new Date(0, m - 1).toLocaleString("default", { month: "short" }),
            score: Number(res?.score || res?.data?.score || 0)
          }))
          .catch(() => ({
            month: new Date(0, m - 1).toLocaleString("default", { month: "short" }),
            score: 0
          }))
      );

      const results = await Promise.all(promises);
      setTrendData(results);
    } catch (err) {
      console.error("Trend fetch error:", err);
      toast.error("Failed to fetch efficiency trend");
    } finally {
      setTrendLoading(false);
    }
  }, [id, selectedYear]);

  const fetchAllTasks = useCallback(async () => {
    if (!id) return;
    try {
      setTasksLoading(true);
      const res = await Service.GetAllTaskByUserID(id);
      // API returns { status: "success", data: [...] }
      const list = res?.data ?? res;
      setAllTasks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err); setAllTasks([]);
    } finally { setTasksLoading(false); }
  }, [id]);

  useEffect(() => { fetchEmployee(); }, [fetchEmployee]);
  useEffect(() => { fetchEPS(); }, [fetchEPS]);
  useEffect(() => { fetchAllTasks(); }, [fetchAllTasks]);

  // ── Derived stats (all tasks) ────────────────────────────────────────────────

  const stats = useMemo(() => {
    const projNames = new Set();
    const projectSet = new Set();

    allTasks.forEach((t) => {
      if (t.project_id) projectSet.add(t.project_id);
      if (t.project?.name) projNames.add(t.project.name);
    });

    const totalAssignedSec = allTasks.reduce(
      (s, t) => s + allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours), 0
    );
    const totalWorkedSec = allTasks.reduce(
      (s, t) => s + calcWorkedSec(t.workingHourTask), 0
    );
    const completed = allTasks.filter(
      (t) => t.status === "COMPLETED" || t.status === "COMPLETE" || t.status === "VALIDATE_COMPLETE"
    ).length;
    const inProgress = allTasks.filter((t) => t.status === "IN_PROGRESS").length;
    const overrunCount = allTasks.filter((t) => {
      const a = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
      const w = calcWorkedSec(t.workingHourTask);
      return a > 0 && w > a;
    }).length;
    const efficiency = totalAssignedSec > 0
      ? Math.round((totalWorkedSec / totalAssignedSec) * 100)
      : 0;

    return {
      totalAssignedSec,
      totalWorkedSec,
      completed,
      inProgress,
      overrunCount,
      efficiency,
      projectCount: projectSet.size,
      projectNames: Array.from(projNames)
    };
  }, [allTasks]);

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRangeExportFormat, setDateRangeExportFormat] = useState("pdf");

  const computeStatsForExport = (taskList) => {
    const totalAssignedSec = taskList.reduce(
      (s, t) => s + allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours), 0
    );
    const totalWorkedSec = taskList.reduce(
      (s, t) => s + calcWorkedSec(t.workingHourTask), 0
    );
    const completedCount = taskList.filter(
      (t) => t.status === "COMPLETED" || t.status === "COMPLETE" || t.status === "VALIDATE_COMPLETE"
    ).length;
    const overrunCount = taskList.filter((t) => {
      const a = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
      const w = calcWorkedSec(t.workingHourTask);
      return a > 0 && w > a;
    }).length;

    const epsObj = calculateEPSForTasks(taskList);

    return {
      totalAssignedSec,
      totalWorkedSec,
      completedCount,
      overrunCount,
      totalTasks: taskList.length,
      eps: epsObj
    };
  };

  const generatePdfReport = (dataToExport, scope, fromDate = "", toDate = "", includeTaskList = true) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const employeeName = `${employee.firstName || ""} ${employee.middleName || ""} ${employee.lastName || ""}`.trim();
      const generatedDateStr = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      let periodText = "All Time";
      if (scope === "range" || scope === "custom") {
        const fromStr = fromDate || taskDateFrom;
        const toStr = toDate || taskDateTo;
        if (fromStr && toStr) {
          periodText = `${fromStr} to ${toStr}`;
        } else if (fromStr) {
          periodText = `From ${fromStr}`;
        } else if (toStr) {
          periodText = `Until ${toStr}`;
        } else {
          periodText = "Filtered Date Range";
        }
      } else if (scope === "month") {
        periodText = `${new Date(0, selectedMonth - 1).toLocaleString("default", { month: "long" })} ${selectedYear}`;
      } else if (scope === "year") {
        periodText = `Year ${selectedYear}`;
      }

      const exportStats = computeStatsForExport(dataToExport);

      const eps = (epsData && (scope === "month" || scope === "year"))
        ? {
          score: Number(epsData.score || 0),
          completionScore: Number(epsData.components?.completionScore || 0),
          disciplineScore: Number(epsData.components?.disciplineScore || 0),
          sessionQualityScore: Number(epsData.components?.sessionQualityScore || 0),
          underutilizedScore: Number(epsData.components?.underutilizedScore || 0),
          reworkScore: Number(epsData.components?.reworkScore || 0),
          overrunScore: Number(epsData.components?.overrunScore || 0)
        }
        : exportStats.eps;

      // Header Banner
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, 210, 24, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(15);
      doc.setFont("helvetica", "bold");
      doc.text("TASKMATRIX", 14, 14);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(includeTaskList ? "FULL PERFORMANCE REPORT" : "PERFORMANCE SUMMARY REPORT", 58, 14);

      doc.setFontSize(8);
      doc.text(`Generated: ${generatedDateStr}`, 196, 14, { align: "right" });

      let y = 30;

      // Employee Info Box (Matching Image 1)
      doc.setDrawColor(22, 163, 74);
      doc.setFillColor(240, 253, 244);
      doc.roundedRect(14, y, 182, 32, 2, 2, "FD");

      doc.setTextColor(17, 24, 39);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(employeeName.toUpperCase(), 18, y + 8);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 163, 74);
      doc.text(`${(employee.designation || "EMPLOYEE").toUpperCase()}  •  STATUS: ${employee.isActive ? "ACTIVE" : "INACTIVE"}`, 18, y + 14);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(75, 85, 99);
      doc.text(`Username: ${employee.username || "—"}   |   Email: ${employee.email || "—"}   |   Phone: ${employee.phone || "—"}`, 18, y + 21);
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text(`REPORT PERIOD: ${periodText.toUpperCase()}`, 18, y + 27);

      y += 38;

      // Section 1: EPS Scores (Image 1)
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("1. EMPLOYEE PERFORMANCE SCORE (EPS)", 14, y);
      y += 4;

      const epsColumns = ["Score Pillar", "Score / 100", "Weight / Type"];
      const epsRows = [
        ["OVERALL EPS SCORE", eps.score.toFixed(2), "Composite Score (100%)"],
        ["Completion Score", eps.completionScore.toFixed(2), "25% Weight"],
        ["Discipline Score", eps.disciplineScore.toFixed(2), "15% Weight"],
        ["Session Quality Score", eps.sessionQualityScore.toFixed(2), "10% Weight"],
        ["Underutilized Score", eps.underutilizedScore.toFixed(2), "10% Weight"],
        ["Rework Score", eps.reworkScore.toFixed(2), "20% Weight"],
        ["Overrun Score", eps.overrunScore.toFixed(2), "20% Weight"],
      ];

      autoTable(doc, {
        head: [epsColumns],
        body: epsRows,
        startY: y,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold" },
        didParseCell: (data) => {
          if (data.section === "body" && data.row.index === 0) {
            data.cell.styles.fontStyle = "bold";
            data.cell.styles.fillColor = [240, 253, 244];
            if (data.column.index === 1) {
              data.cell.styles.textColor = [22, 163, 74];
            }
          }
        },
        margin: { left: 14, right: 14 },
      });

      y = (doc.lastAutoTable?.finalY || y + 50) + 8;

      // Section 2: Task Summary KPIs (Image 1)
      doc.setFontSize(10.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(17, 24, 39);
      doc.text("2. TASK PERFORMANCE SUMMARY", 14, y);
      y += 4;

      const kpiHeaders = ["Total Tasks", "Assigned Hours", "Worked Hours", "Completed Tasks", "Overrun Tasks"];
      const kpiBody = [[
        `${exportStats.totalTasks}`,
        `${Math.floor(exportStats.totalAssignedSec / 3600)}H (${secToHms(exportStats.totalAssignedSec)})`,
        `${Math.floor(exportStats.totalWorkedSec / 3600)}H (${secToHms(exportStats.totalWorkedSec)})`,
        `${exportStats.completedCount} (${exportStats.totalTasks > 0 ? Math.round((exportStats.completedCount / exportStats.totalTasks) * 100) : 0}%)`,
        `${exportStats.overrunCount}`
      ]];

      autoTable(doc, {
        head: [kpiHeaders],
        body: kpiBody,
        startY: y,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3, halign: "center" },
        headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontStyle: "bold" },
        margin: { left: 14, right: 14 },
      });

      y = (doc.lastAutoTable?.finalY || y + 20) + 8;

      // Section 3: Task Details Table (Only if includeTaskList is true)
      if (includeTaskList) {
        doc.setFontSize(10.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(17, 24, 39);
        doc.text(`3. TASK DETAILS (${dataToExport.length} TASKS)`, 14, y);
        y += 4;

        const taskHead = [["S.No", "Task Name", "Project Name", "WBS Type", "Created Date", "Est. Hours", "Worked Hours", "Overrun", "Status"]];

        const taskRowsData = dataToExport.map((t, idx) => {
          const assignedSec = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
          const workedSec = calcWorkedSec(t.workingHourTask);
          const isOverrun = assignedSec > 0 && workedSec > assignedSec;
          const statusMetaInfo = statusMeta(t.status);

          return [
            idx + 1,
            t.name || t.title || "—",
            t.project?.name || "—",
            t.wbsType || "—",
            t.created_on ? new Date(t.created_on).toLocaleDateString("en-GB") : (t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-GB") : "—"),
            secToHms(assignedSec),
            secToHms(workedSec),
            isOverrun ? "Overrun" : "Normal",
            statusMetaInfo.label,
          ];
        });

        autoTable(doc, {
          head: taskHead,
          body: taskRowsData,
          startY: y,
          theme: "striped",
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: "bold" },
          columnStyles: {
            0: { cellWidth: 10, halign: "center" },
            1: { cellWidth: 42 },
            2: { cellWidth: 32 },
            3: { cellWidth: 18 },
            4: { cellWidth: 20 },
            5: { cellWidth: 18 },
            6: { cellWidth: 18 },
            7: { cellWidth: 16, halign: "center" },
            8: { cellWidth: 16, halign: "center" },
          },
          didParseCell: (data) => {
            if (data.section === "body") {
              if (data.column.index === 7) {
                if (data.cell.raw === "Overrun") {
                  data.cell.styles.textColor = [220, 38, 38];
                  data.cell.styles.fontStyle = "bold";
                } else {
                  data.cell.styles.textColor = [37, 99, 235];
                }
              }
            }
          },
          margin: { left: 14, right: 14 },
        });
      }

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text(`Page ${i} of ${pageCount}`, 196, 290, { align: "right" });
        doc.text(`TaskMatrix Performance Report — ${employeeName}`, 14, 290);
      }

      const reportPrefix = includeTaskList ? "Detailed_Report" : "Performance_Summary";
      const fileName = `${reportPrefix}_${employeeName.replace(/\s+/g, "_")}_${periodText.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      doc.save(fileName);
      toast.success(`${includeTaskList ? "Full Detailed" : "Performance Summary"} PDF generated successfully!`);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      toast.error("Failed to generate PDF report");
    }
  };

  const generateExcelReport = (dataToExport, scope, fromDate = "", toDate = "") => {
    try {
      const employeeName = `${employee.firstName || ""} ${employee.middleName || ""} ${employee.lastName || ""}`.trim();
      const exportStats = computeStatsForExport(dataToExport);

      const eps = (epsData && (scope === "month" || scope === "year"))
        ? {
          score: Number(epsData.score || 0),
          completionScore: Number(epsData.components?.completionScore || 0),
          disciplineScore: Number(epsData.components?.disciplineScore || 0),
          sessionQualityScore: Number(epsData.components?.sessionQualityScore || 0),
          underutilizedScore: Number(epsData.components?.underutilizedScore || 0),
          reworkScore: Number(epsData.components?.reworkScore || 0),
          overrunScore: Number(epsData.components?.overrunScore || 0)
        }
        : exportStats.eps;

      let periodText = scope;
      if (fromDate || toDate) periodText = `${fromDate || "Start"} to ${toDate || "End"}`;

      const summaryRows = [
        { Field: "EMPLOYEE PERFORMANCE & TASK REPORT", Value: "" },
        { Field: "Employee Name", Value: employeeName },
        { Field: "Designation", Value: employee.designation || "N/A" },
        { Field: "Email", Value: employee.email || "N/A" },
        { Field: "Phone", Value: employee.phone || "N/A" },
        { Field: "Report Period", Value: periodText },
        { Field: "", Value: "" },
        { Field: "EMPLOYEE PERFORMANCE SCORES (EPS)", Value: "" },
        { Field: "Overall EPS Score", Value: eps.score.toFixed(2) },
        { Field: "Completion Score", Value: eps.completionScore.toFixed(2) },
        { Field: "Discipline Score", Value: eps.disciplineScore.toFixed(2) },
        { Field: "Session Quality Score", Value: eps.sessionQualityScore.toFixed(2) },
        { Field: "Underutilized Score", Value: eps.underutilizedScore.toFixed(2) },
        { Field: "Rework Score", Value: eps.reworkScore.toFixed(2) },
        { Field: "Overrun Score", Value: eps.overrunScore.toFixed(2) },
        { Field: "", Value: "" },
        { Field: "TASK PERFORMANCE SUMMARY", Value: "" },
        { Field: "Total Tasks", Value: exportStats.totalTasks },
        { Field: "Assigned Hours", Value: secToHms(exportStats.totalAssignedSec) },
        { Field: "Worked Hours", Value: secToHms(exportStats.totalWorkedSec) },
        { Field: "Completed Tasks", Value: exportStats.completedCount },
        { Field: "Overrun Tasks", Value: exportStats.overrunCount },
      ];

      const taskRows = dataToExport.map((t, idx) => {
        const assignedSec = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
        const workedSec = calcWorkedSec(t.workingHourTask);
        const isOverrun = assignedSec > 0 && workedSec > assignedSec;
        return {
          "S.No": idx + 1,
          "Project Name": t.project?.name || "—",
          "Task Name": t.name || t.title || "—",
          "WBS Type": t.wbsType || "—",
          "Created Date": t.created_on ? new Date(t.created_on).toLocaleDateString("en-GB") : "—",
          "Est. Hours": secToHms(assignedSec),
          "Worked Hours": secToHms(workedSec),
          "Overrun": isOverrun ? "Overrun" : "Normal",
          "Status": statusMeta(t.status).label,
        };
      });

      const wb = XLSX.utils.book_new();
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Performance Summary");

      const wsTasks = XLSX.utils.json_to_sheet(taskRows);
      XLSX.utils.book_append_sheet(wb, wsTasks, "Task Details");

      const fileName = `Performance_Report_${employeeName.replace(/\s+/g, "_")}_${periodText.replace(/[^a-zA-Z0-9]/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success("Excel report generated successfully!");
    } catch (err) {
      console.error("Excel Generation Error:", err);
      toast.error("Failed to generate Excel report");
    }
  };

  const handleExport = (format, scope, customFrom = "", customTo = "") => {
    let dataToExport = [...allTasks];

    if (scope === "range" || scope === "custom") {
      const fromStr = customFrom || taskDateFrom;
      const toStr = customTo || taskDateTo;

      if (fromStr) {
        const from = new Date(fromStr);
        dataToExport = listFilterFrom(dataToExport, from);
      }
      if (toStr) {
        const to = new Date(toStr + "T23:59:59.999");
        dataToExport = listFilterTo(dataToExport, to);
      }

      if (taskProjectFilter !== "ALL") {
        dataToExport = dataToExport.filter((t) => (t.project?.name || "") === taskProjectFilter);
      }
      if (taskStatusFilter !== "ALL") {
        dataToExport = dataToExport.filter((t) => t.status === taskStatusFilter);
      }
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        dataToExport = dataToExport.filter(
          (t) =>
            (t.name || "").toLowerCase().includes(q) ||
            (t.description || "").toLowerCase().includes(q) ||
            (t.project?.name || "").toLowerCase().includes(q)
        );
      }
    } else if (scope === "month") {
      dataToExport = allTasks.filter(t => {
        const d = new Date(t.created_on || t.createdAt);
        return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear;
      });
    } else if (scope === "year") {
      dataToExport = allTasks.filter(t => {
        const d = new Date(t.created_on || t.createdAt);
        return d.getFullYear() === selectedYear;
      });
    }

    if (dataToExport.length === 0) {
      toast.error("No task data found for the selected period");
      setShowExportMenu(false);
      return;
    }

    if (format === "excel") {
      generateExcelReport(dataToExport, scope, customFrom || taskDateFrom, customTo || taskDateTo);
    } else if (format === "pdf_summary" || format === "pdf_overview") {
      generatePdfReport(dataToExport, scope, customFrom || taskDateFrom, customTo || taskDateTo, false);
    } else {
      generatePdfReport(dataToExport, scope, customFrom || taskDateFrom, customTo || taskDateTo, true);
    }
    setShowExportMenu(false);
  };

  const listFilterFrom = (arr, fromDateObj) =>
    arr.filter((t) => {
      const d = new Date(t.created_on || t.createdAt);
      return !isNaN(d) && d >= fromDateObj;
    });

  const listFilterTo = (arr, toDateObj) =>
    arr.filter((t) => {
      const d = new Date(t.created_on || t.createdAt);
      return !isNaN(d) && d <= toDateObj;
    });

  // ── Filtered tasks ───────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let list = [...allTasks];
    if (taskProjectFilter !== "ALL") {
      list = list.filter((t) => (t.project?.name || "") === taskProjectFilter);
    }
    if (taskSearch.trim()) {
      const q = taskSearch.toLowerCase();
      list = list.filter(
        (t) =>
          (t.name || "").toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q) ||
          (t.project?.name || "").toLowerCase().includes(q) ||
          (t.wbsType || "").toLowerCase().includes(q)
      );
    }
    if (taskStatusFilter !== "ALL") {
      list = list.filter((t) => t.status === taskStatusFilter);
    }
    if (taskDateFrom) {
      const from = new Date(taskDateFrom);
      list = list.filter((t) => t.created_on && new Date(t.created_on) >= from);
    }
    if (taskDateTo) {
      const to = new Date(taskDateTo + "T23:59:59");
      list = list.filter((t) => t.created_on && new Date(t.created_on) <= to);
    }
    list.sort((a, b) => new Date(b.created_on || b.createdAt || 0) - new Date(a.created_on || a.createdAt || 0));
    return list;
  }, [allTasks, taskSearch, taskStatusFilter, taskDateFrom, taskDateTo, taskProjectFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / TASKS_PER_PAGE));
  const pagedTasks = filteredTasks.slice((taskPage - 1) * TASKS_PER_PAGE, taskPage * TASKS_PER_PAGE);

  const uniqueStatuses = useMemo(() => {
    const s = new Set(allTasks.map((t) => t.status).filter(Boolean));
    return ["ALL", ...Array.from(s).sort()];
  }, [allTasks]);

  const handleModel = (emp) => setEditModel(emp);
  const handleModelClose = () => setEditModel(null);

  // ── Guards ───────────────────────────────────────────────────────────────────

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex items-center justify-center p-12 text-black bg-white rounded-none border-2 border-black shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin mr-3 text-black" />
          <span className="text-sm font-bold uppercase text-black">Loading employee details...</span>
        </div>
      </div>,
      document.body
    );
  }
  if (error || !employee) {
    return createPortal(
      <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex flex-col items-center justify-center p-12 text-red-600 bg-white rounded-none border-2 border-black shadow-xl gap-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 mr-3 text-black" />
            <span className="text-sm font-bold uppercase text-black">{error || "Employee not found"}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase shadow-sm cursor-pointer">Close</button>
          )}
        </div>
      </div>,
      document.body
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-none shadow-2xl border border-black overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[95vw] mx-auto flex flex-col h-[95vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-black bg-green-200 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 rounded-none text-black border border-black shadow-sm">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black uppercase">
                {employee.firstName} {employee.middleName} {employee.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-bold text-black uppercase">
                  {employee.designation || "EMPLOYEE PROFILE"}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-none text-[8px] font-bold uppercase border ${employee.isActive ? "bg-green-50 text-black border-green-700" : "bg-red-50 text-black border-red-700"
                    }`}
                >
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(userRole === "admin" || userRole === "deputy_manager" || userRole === "operation_executive" || userRole === "human_resource") && (
              <button
                onClick={() => handleModel(employee)}
                className="flex items-center gap-2 px-5 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              >
                <Edit2 className="w-4 h-4 text-black" />
                Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="px-5 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
            >
              Close
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
          {/* ── Profile Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-6">
            <div className="space-y-4">
              <InfoRow label="Username" value={employee.username ? String(employee.username).toUpperCase() : "—"} />
              <InfoRow label="Email" value={employee.email} href={`mailto:${employee.email}`} />
              <InfoRow
                label="Phone"
                value={
                  <span>
                    {employee.phone}
                    {employee.extension && (
                      <span className="text-xs ml-1 font-bold">(Ext: {employee.extension})</span>
                    )}
                  </span>
                }
                href={`tel:${employee.phone}`}
              />
            </div>
            <div className="space-y-4">
              <InfoRow label="Alt Phone" value={employee.altPhone || "—"} />
              <InfoRow label="Landline" value={employee.landline || "—"} />
              <InfoRow label="Alt Landline" value={employee.altLandline || "—"} />
            </div>
            <div className="space-y-4">
              <InfoRow label="Designation" value={employee.designation} />
              <InfoRow label="Created" value={formatDateTime(employee.createdAt)} />
              <InfoRow label="Updated" value={formatDateTime(employee.updatedAt)} />
            </div>
          </div>
          {/* ── EPS ── */}
          {employee?.role !== "CLIENT" && employee?.role !== "CLIENT_ADMIN" && (
            <div className="pt-8 border-t border-black/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-lg font-bold text-black uppercase">Employee Performance Score</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-1.5 bg-white border border-black rounded-none text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString("default", { month: "long" })}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-4 py-1.5 bg-white border border-black rounded-none text-xs font-bold focus:outline-none focus:ring-4 focus:ring-green-500/10 cursor-pointer"
                  >
                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>

                  <button
                    onClick={fetchMonthlyTrend}
                    className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer ml-2"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Generate Efficiency Graph
                  </button>
                </div>
              </div>

              {trendLoading || showTrend ? (
                <div className="mt-8 mb-8 bg-white p-8 rounded-none border border-black shadow-sm animate-in slide-in-from-top-2 fade-in">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h4 className="text-lg font-bold text-black uppercase">Efficiency Trendline</h4>
                      <p className="text-[10px] font-bold text-black uppercase mt-1">
                        Monthly Performance Score for {selectedYear}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowTrend(false)}
                      className="px-5 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  {trendLoading ? (
                    <div className="h-64 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-[#6bbd45]" />
                      <span className="text-[10px] font-bold text-black uppercase">Analyzing Trend Data...</span>
                    </div>
                  ) : (
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                          <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: "#000000" }}
                            dy={10}
                          />
                          <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fontWeight: 700, fill: "#000000" }}
                            domain={[0, 100]}
                            dx={-10}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '0px',
                              border: '2px solid black',
                              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                              fontSize: '11px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              padding: '12px'
                            }}
                            cursor={{ stroke: '#6bbd45', strokeWidth: 1, strokeDasharray: '4 4' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="#6bbd45"
                            strokeWidth={4}
                            dot={{ r: 6, fill: "#6bbd45", strokeWidth: 3, stroke: "#fff" }}
                            activeDot={{ r: 8, fill: "#000", strokeWidth: 0 }}
                            animationDuration={1500}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              ) : null}

              {epsLoading ? (
                <div className="flex items-center justify-center py-10 bg-white/50 rounded-none border border-dashed border-black">
                  <Loader2 className="w-6 h-6 animate-spin text-black" />
                </div>
              ) : epsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Overall Score */}
                  <div className="flex items-center justify-between p-4 bg-white border border-black border-l-8 border-l-green-600 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-3">
                      
                      <span className="font-semibold text-black uppercase tracking-widest text-md">Overall Score</span>
                    </div>
                    <span className="text-xl font-semibold text-green-700 tracking-tighter">
                      {epsData.score !== undefined ? Number(epsData.score).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  {[
                    ["Completion Score", epsData.components?.completionScore, CheckCircle2],
                    ["Discipline Score", epsData.components?.disciplineScore, TrendingUp],
                    ["Session Quality", epsData.components?.sessionQualityScore, Clock],
                    ["Underutilized", epsData.components?.underutilizedScore, AlertTriangle],
                    ["Rework Score", epsData.components?.reworkScore, RefreshCw],
                    ["Overrun Score", epsData.components?.overrunScore, AlertTriangle],
                  ].map(([label, val, Icon]) => (
                    <div key={label} className="flex items-center justify-between p-4 bg-white border border-black border-l-8 border-l-green-600 rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all">
                      <div className="flex items-center gap-3">
                       
                        <span className="font-semibold text-black uppercase tracking-widest text-md">{label}</span>
                      </div>
                      <span className="text-xl font-semibold text-black tracking-tighter">
                        {val !== undefined ? Number(val).toFixed(2) : "0"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/50 rounded-none border border-dashed border-black p-10 text-center">
                  <p className="text-black font-bold text-sm tracking-tight">No EPS data for selected period</p>
                </div>
              )}
            </div>
          )}

          {/* ── Task Performance Report ── */}
          {![
            "client",
            "client_admin",
            "connection_designer_engineer",
            "connection_designer_admin",
          ].includes(userRole) && (
              <div className="pt-8 border-t border-black/5">

                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                
                    <div>
                      <h3 className="text-lg font-bold text-black uppercase">Task Performance Report</h3>
                     
                    </div>
                  </div>
                  <div className="flex items-center gap-2 relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Generate Report
                      <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
                    </button>

                    {showExportMenu && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-lg border border-black/15 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="px-3 py-2 text-[10px] font-bold text-black uppercase border-b border-black/10 flex items-center justify-between">
                          Report Type & Scope
                          <X size={12} className="cursor-pointer text-black hover:text-red-600" onClick={() => setShowExportMenu(false)} />
                        </div>

                        {[
                          { id: "pdf_summary", label: "PDF Summary (EPS & KPIs)", subtitle: "Overview Only (1st Image)", icon: FilePdf, color: "text-green-700" },
                          { id: "pdf_detailed", label: "PDF Full Report", subtitle: "Summary + Detailed Task List", icon: FilePdf, color: "text-red-700" },
                          { id: "excel", label: "Excel Spreadsheet", subtitle: "Full Data Workbook", icon: FileSpreadsheet, color: "text-emerald-700" },
                        ].map((fmtObj) => (
                          <div key={fmtObj.id} className="space-y-1 mt-2 mb-2 p-1 border-b border-black/10 last:border-0 pb-1.5">
                            <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border border-black/5 rounded">
                              <div className="flex items-center gap-1.5">
                                <fmtObj.icon size={13} className={fmtObj.color} />
                                <span className="text-[10.5px] font-bold uppercase">{fmtObj.label}</span>
                              </div>
                              <span className="text-[8.5px] font-bold text-gray-500">{fmtObj.subtitle}</span>
                            </div>
                            {[
                              { label: "Date Range (From - To)", scope: "range" },
                              { label: "Current Month", scope: "month" },
                              { label: "Current Year", scope: "year" },
                              { label: "All Time", scope: "all" },
                            ].map((item) => (
                              <button
                                key={item.scope}
                                onClick={() => {
                                  setShowExportMenu(false);
                                  if (item.scope === "range" && !taskDateFrom && !taskDateTo) {
                                    setDateRangeExportFormat(fmtObj.id);
                                    setShowDateRangeModal(true);
                                  } else {
                                    handleExport(fmtObj.id, item.scope);
                                  }
                                }}
                                className="w-full text-left px-3 py-1 hover:bg-green-50 text-[10px] font-bold text-black hover:text-green-700 rounded-md transition-all cursor-pointer flex items-center justify-between"
                              >
                                <span>{item.label}</span>
                                {item.scope === "range" && (taskDateFrom || taskDateTo) && (
                                  <span className="text-[8px] bg-green-100 text-green-800 px-1 py-0.5 rounded font-mono">
                                    {taskDateFrom ? taskDateFrom.slice(5) : "start"} → {taskDateTo ? taskDateTo.slice(5) : "end"}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        ))}

                        <div className="pt-1 border-t border-black/10">
                          <button
                            onClick={() => {
                              setShowExportMenu(false);
                              setDateRangeExportFormat("pdf_summary");
                              setShowDateRangeModal(true);
                            }}
                            className="w-full text-center py-1.5 bg-green-50 hover:bg-green-100 text-green-800 text-[10px] font-black uppercase rounded border border-green-300 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <CalendarDays size={12} />
                            Select Custom Date Range...
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={fetchAllTasks}
                      disabled={tasksLoading}
                      className="flex items-center gap-2 px-4 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm disabled:opacity-40 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${tasksLoading ? "animate-spin" : ""}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {tasksLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 bg-white rounded-none border border-dashed border-black gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-black" />
                    <p className="text-[11px] font-bold text-black uppercase">Loading tasks…</p>
                  </div>
                ) : allTasks.length === 0 ? (
                  <div className="bg-white rounded-none border border-dashed border-black p-12 text-center">
                    <ListTodo className="w-10 h-10 text-black mx-auto mb-3" />
                    <p className="text-black font-bold text-sm uppercase">No tasks found for this employee</p>
                  </div>
                ) : (
                  <>
                    {/* ── Stat Cards — dashboard style ── */}
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
                      {[
                        { label: "Total Tasks", value: allTasks.length, icon: ListTodo, accent: "border-l-indigo-500" },
                        { label: "Assigned", value: `${Math.floor(stats.totalAssignedSec / 3600)}H`, sub: secToHms(stats.totalAssignedSec), icon: Clock, accent: "border-l-blue-500" },
                        { label: "Worked", value: `${Math.floor(stats.totalWorkedSec / 3600)}H`, sub: secToHms(stats.totalWorkedSec), icon: TrendingUp, accent: "border-l-violet-500" },
                        { label: "Completed", value: stats.completed, sub: `${allTasks.length > 0 ? Math.round((stats.completed / allTasks.length) * 100) : 0}% of total`, icon: CheckCircle2, accent: "border-l-green-600" },
                        { label: "Overrun", value: stats.overrunCount, sub: stats.overrunCount > 0 ? "needs attention" : "all good", icon: AlertTriangle, accent: stats.overrunCount > 0 ? "border-l-red-500" : "border-l-green-600" },
                      ].map(({ label, value, sub, icon: Icon, accent }) => (
                        <div key={label} className={`flex items-center justify-between p-4 bg-white border border-black border-l-8 ${accent} rounded-lg shadow-sm hover:shadow-md hover:bg-gray-50 transition-all`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="min-w-0">
                              <span className="font-semibold text-black uppercase tracking-widest text-md block">{label}</span>
                             
                            </div>
                          </div>
                          <span className="text-md font-semibold text-black tracking-tighter shrink-0 ml-2">{value}</span>
                        </div>
                      ))}
                    </div>

                    {/* ── Filter Bar (project pills + search in same area) ── */}
                    <div className="bg-gray-50/70 rounded-lg p-4 mb-4 border border-black/5">
                      <div className="flex flex-wrap gap-4 items-end">
                        {/* Search Task */}
                        <div className="flex-1 min-w-[200px]">
                          <span className="text-[10px] font-black text-black/60 uppercase tracking-wider block mb-1">Search Task</span>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/40" />
                            <input
                              type="text"
                              placeholder="Search by name..."
                              value={taskSearch}
                              onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                              className="w-full pl-9 pr-3 py-1.5 bg-white text-xs font-semibold rounded-md border border-black/15 focus:outline-none focus:ring-1 focus:ring-green-600/30 text-black shadow-sm"
                            />
                          </div>
                        </div>

                        {/* Project Filter */}
                        <div className="min-w-[160px]">
                          <span className="text-[10px] font-black text-black/60 uppercase tracking-wider block mb-1">Project</span>
                          <select
                            value={taskProjectFilter}
                            onChange={(e) => { setTaskProjectFilter(e.target.value); setTaskPage(1); }}
                            className="w-full px-3 py-1.5 bg-white border border-black/15 rounded-md text-xs font-semibold focus:outline-none cursor-pointer shadow-sm text-black"
                          >
                            <option value="ALL">All Projects</option>
                            {(stats.projectNames || []).map((name) => (
                              <option key={name} value={name}>{name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status Filter */}
                        <div className="min-w-[120px]">
                          <span className="text-[10px] font-black text-black/60 uppercase tracking-wider block mb-1">Status</span>
                          <select
                            value={taskStatusFilter}
                            onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }}
                            className="w-full px-3 py-1.5 bg-white border border-black/15 rounded-md text-xs font-semibold focus:outline-none cursor-pointer shadow-sm text-black"
                          >
                            {uniqueStatuses.map((s) => (
                              <option key={s} value={s}>{s === "ALL" ? "All Statuses" : (STATUS_META[s]?.label || s)}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date From */}
                        <div className="w-[130px]">
                          <span className="text-[10px] font-black text-black/60 uppercase tracking-wider block mb-1">From</span>
                          <input
                            type="date"
                            value={taskDateFrom}
                            onChange={(e) => { setTaskDateFrom(e.target.value); setTaskPage(1); }}
                            className="w-full px-2.5 py-1.5 bg-white border border-black/15 rounded-md text-xs font-semibold focus:outline-none shadow-sm text-black"
                          />
                        </div>

                        {/* Date To */}
                        <div className="w-[130px]">
                          <span className="text-[10px] font-black text-black/60 uppercase tracking-wider block mb-1">To</span>
                          <input
                            type="date"
                            value={taskDateTo}
                            onChange={(e) => { setTaskDateTo(e.target.value); setTaskPage(1); }}
                            className="w-full px-2.5 py-1.5 bg-white border border-black/15 rounded-md text-xs font-semibold focus:outline-none shadow-sm text-black"
                          />
                        </div>

                        {/* Clear All & Count */}
                        <div className="flex items-center gap-3 ml-auto shrink-0 pb-1">
                          {(taskSearch || taskStatusFilter !== "ALL" || taskDateFrom || taskDateTo || taskProjectFilter !== "ALL") && (
                            <button
                              onClick={() => {
                                setTaskSearch("");
                                setTaskStatusFilter("ALL");
                                setTaskDateFrom("");
                                setTaskDateTo("");
                                setTaskProjectFilter("ALL");
                                setTaskPage(1);
                              }}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-md text-[10px] font-bold hover:bg-red-100 transition-colors whitespace-nowrap cursor-pointer"
                            >
                              Clear All
                            </button>
                          )}
                          <span className="text-[10px] font-bold text-black/50 uppercase">
                            {filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ── Task Table ── */}
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-16 text-black/30">
                        <ListTodo className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No tasks match your filters</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-black/10 shadow-sm mb-4">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-[#f2f7f0] border-b border-black/8">
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider w-[5%]">S.No</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider w-[25%]">Task</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider w-[18%]">Project Name</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider w-[10%]">WBS Type</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider">Created Date</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider">Est. Hours</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider">Worked Hours</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider">Overrun</th>
                                <th className="text-left px-4 py-3 text-[10px] font-bold text-black uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-black/5 bg-white">
                              {pagedTasks.map((task, idx) => {
                                const meta = statusMeta(task.status);
                                const assignedSec = allocToSec(task.allocatedHours || task.allocationLog?.allocatedHours);
                                const workedSec = calcWorkedSec(task.workingHourTask);
                                const isOverrun = assignedSec > 0 && workedSec > assignedSec;
                                const serialNumber = (taskPage - 1) * TASKS_PER_PAGE + idx + 1;
                                return (
                                  <tr
                                    key={task.id || idx}
                                    onClick={() => setSelectedTask(task)}
                                    className="cursor-pointer transition-colors hover:bg-green-50/50 border-b border-black/5 last:border-0"
                                  >
                                    <td className="px-4 py-3 text-xs text-black/50 font-bold">
                                      {serialNumber}
                                    </td>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-black text-xs leading-snug line-clamp-1">{task.name || "Untitled"}</p>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-black/80 font-semibold line-clamp-1">{task.project?.name || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-black/60 font-semibold uppercase">{task.wbsType || "—"}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs text-black/80 font-semibold whitespace-nowrap">
                                        {task.created_on ? new Date(task.created_on).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : (task.createdAt ? new Date(task.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—")}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className="text-xs font-semibold text-black/70 whitespace-nowrap">{secToHms(assignedSec)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`text-xs font-bold whitespace-nowrap ${isOverrun ? "text-red-600" : "text-black/70"}`}>{secToHms(workedSec)}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                      {isOverrun ? (
                                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200 uppercase tracking-tight">
                                          Overrun
                                        </span>
                                      ) : (
                                        <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-tight">
                                          Normal
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <span className={`inline-block text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-tight ${meta.color}`}>
                                        {meta.label}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Pagination */}
                        {filteredTasks.length > TASKS_PER_PAGE && (
                          <div className="flex items-center justify-between pt-3 border-t border-black/5">
                            <span className="text-[10px] font-medium text-black/40">
                              {(taskPage - 1) * TASKS_PER_PAGE + 1}–{Math.min(taskPage * TASKS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                                disabled={taskPage === 1}
                                className="px-3 py-1.5 bg-white border border-black/10 rounded-md text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-30 transition-all cursor-pointer shadow-sm"
                              >← Prev</button>
                              <span className="px-3 py-1.5 bg-green-700 text-white text-xs font-semibold rounded-md">
                                {taskPage} / {totalPages}
                              </span>
                              <button
                                onClick={() => setTaskPage((p) => Math.min(totalPages, p + 1))}
                                disabled={taskPage === totalPages}
                                className="px-3 py-1.5 bg-white border border-black/10 rounded-md text-xs font-medium text-black hover:bg-gray-50 disabled:opacity-30 transition-all cursor-pointer shadow-sm"
                              >Next →</button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    {/* ── Task Detail Drawer (with fresh fetch) ── */}
                    {selectedTask && (
                      <EmployeeTaskDrawer 
                        taskId={selectedTask.id} 
                        onClose={() => setSelectedTask(null)} 
                      />
                    )}
                  </>
                )}
              </div>
            )}
          {/* ── Address ── */}
          {(employee.address || employee.city || employee.state || employee.country || employee.zipCode) && (
            <div className="pt-8 border-t border-black/5">
              <h4 className="text-[10px] font-bold text-black uppercase mb-4">Address Information</h4>
              <div className="text-sm space-y-2 text-black font-bold tracking-tight">
                {employee.address && <p>{employee.address}</p>}
                <p>{[employee.city, employee.state, employee.zipCode].filter(Boolean).join(", ") || "—"}</p>
                {employee.country && <p>{employee.country}</p>}
              </div>
            </div>
          )}


          {editModel && (
            <EditEmployee employeeData={employee} onClose={handleModelClose} onSuccess={fetchEmployee} />
          )}

          {showDateRangeModal && (
            <DateRangeExportModal
              defaultFrom={taskDateFrom}
              defaultTo={taskDateTo}
              defaultFormat={dateRangeExportFormat}
              onClose={() => setShowDateRangeModal(false)}
              onExport={handleExport}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, href }) => (
  <div className="flex justify-between items-center py-1.5 border-b border-black/5 last:border-0">
    <span className="text-black font-bold uppercase text-xs tracking-wider">{label}</span>
    {href ? (
      <a href={href} className="text-black text-sm font-bold hover:underline">
        {value}
      </a>
    ) : (
      <span className="text-black text-sm font-bold">{value}</span>
    )}
  </div>
);

// ─── DateRangeExportModal ───────────────────────────────────────────────────
const DateRangeExportModal = ({ defaultFrom, defaultTo, defaultFormat, onClose, onExport }) => {
  const [fromDate, setFromDate] = useState(defaultFrom || "");
  const [toDate, setToDate] = useState(defaultTo || "");
  const [format, setFormat] = useState(defaultFormat || "pdf");

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none border-2 border-black shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 border border-black">
              <CalendarDays className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black uppercase">Date Range Performance Report</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase">
                Download performance report for custom date period
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-black hover:bg-gray-100 border border-black cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black text-xs font-bold focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-black text-xs font-bold focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">Report Format & Content</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setFormat("pdf_summary")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "pdf_summary" || format === "pdf" ? "bg-green-700 text-white border-green-800 shadow" : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FilePdf size={14} /> PDF Summary (EPS & KPIs Only)
                </span>
                <span className="text-[9px] font-normal opacity-80">(Overview Page)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf_detailed")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "pdf_detailed" ? "bg-green-700 text-white border-green-800 shadow" : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FilePdf size={14} /> PDF Full Report
                </span>
                <span className="text-[9px] font-normal opacity-80">(With Task List Table)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "excel" ? "bg-green-700 text-white border-green-800 shadow" : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={14} /> Excel Workbook
                </span>
                <span className="text-[9px] font-normal opacity-80">(.XLSX)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-black border border-black font-bold text-xs uppercase hover:bg-gray-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!fromDate && !toDate) {
                toast.warn("Please select at least a From or To date");
                return;
              }
              onExport(format, "range", fromDate, toDate);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white border border-black font-bold text-xs uppercase hover:bg-green-700 shadow cursor-pointer"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GetEmployeeByID;

// ─── EmployeeTaskDrawer (Fetches fresh task data) ──────────────────────────────
const EmployeeTaskDrawer = ({ taskId, onClose }) => {
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!taskId) return;
    setLoading(true);
    Service.GetTaskById(taskId)
      .then(res => setTask(res?.data || null))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [taskId]);

  if (!task) {
    if (loading) {
       return (
          <div className="fixed inset-0 z-[11500] flex" onClick={onClose}>
            <div className="ml-auto w-full max-w-lg h-full bg-white shadow-2xl border-l border-black/10 flex flex-col justify-center items-center animate-in slide-in-from-right duration-200" onClick={e => e.stopPropagation()}>
               <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            </div>
          </div>
       );
    }
    return null;
  }

  const t = task;
  const meta = statusMeta(t.status);
  const assignedSec = allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours);
  const workedSec = calcWorkedSec(t.workingHourTask);
  const isOverrun = assignedSec > 0 && workedSec > assignedSec;
  const sessions = t.workingHourTask || [];

  return (
    <div
      className="fixed inset-0 z-[11500] flex"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ml-auto w-full max-w-lg h-full bg-white shadow-2xl border-l border-black/10 flex flex-col animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Drawer Header — WBT card style: green left border + black border bottom */}
        <div className="flex items-start gap-4 p-5 border-b border-black/8 border-l-4 border-l-green-600">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${meta?.color || ''}`}>{meta?.label || t.status}</span>
              {isOverrun && <span className="inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Overrun</span>}
            </div>
            <h3 className="text-base font-bold text-black leading-snug">{t.name || "Untitled Task"}</h3>
            {t.description && t.description !== t.name && (
              <p className="text-xs text-black/50 mt-1 line-clamp-2">{t.description}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 text-black/40 hover:text-black transition-colors cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Time Stats — WBT card style */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Assigned", value: secToHms(assignedSec), accent: "border-l-blue-500" },
              { label: "Worked", value: secToHms(workedSec), accent: isOverrun ? "border-l-red-500" : "border-l-green-600" },
            ].map(({ label, value, accent }) => (
              <div key={label} className={`bg-gray-50 rounded-lg p-4 border border-black/8 border-l-4 ${accent}`}>
                <p className="text-[10px] font-semibold text-black/40 uppercase tracking-wider mb-1">{label}</p>
                <p className={`text-sm font-bold ${isOverrun && label === "Worked" ? "text-red-600" : "text-black"}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Meta Details */}
          <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-black/5">
              <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Task Details</p>
            </div>
            <div className="divide-y divide-black/5">
              {[
                { label: "Project", value: t.project?.name || "—" },
                { label: "WBS Type", value: t.wbsType || "—" },
                { label: "Stage", value: t.Stage || "—" },
                { label: "Priority", value: t.priority != null ? `P${t.priority}` : "—" },
                { label: "Completion", value: COMPLETION_LABEL?.[t.LineItemCompletion] || t.LineItemCompletion || "—" },
                { label: "Created", value: t.created_on ? new Date(t.created_on).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Created By", value: t.credatedByUser ? `${t.credatedByUser.firstName || ""} ${t.credatedByUser.lastName || ""}`.trim() : "—" },
                { label: "Due Date", value: t.due_date ? new Date(t.due_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—" },
                { label: "Manager", value: t.project?.manager ? `${t.project.manager.firstName || ""} ${t.project.manager.lastName || ""}`.trim() || "—" : "—" },
              ].filter(r => r.value && r.value !== "—").map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-[10px] font-semibold text-black/40 uppercase tracking-wider">{label}</span>
                  <span className="text-xs font-medium text-black text-right max-w-[55%] truncate" title={value}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Work Sessions */}
          {sessions.length > 0 && (
            <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-black/5 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Work Sessions</p>
                <span className="text-[10px] font-semibold text-black/30">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
                {sessions.map((s, i) => (
                  <div key={s.id || i} className="flex items-center justify-between px-4 py-2.5 text-xs">
                    <div className="flex items-center gap-2 text-black/60">
                      <span className="w-5 h-5 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</span>
                      <span>
                        {s.started_at ? new Date(s.started_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—"}
                        {" → "}
                        {s.ended_at ? new Date(s.ended_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : <span className="text-green-600 font-semibold">Active</span>}
                      </span>
                    </div>
                    <span className="font-semibold text-black shrink-0 ml-3">{secToHms(Number(s.duration_seconds) || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {t.taskcomment && t.taskcomment.length > 0 && (
            <div className="border border-black/8 border-l-4 border-l-green-600 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-gray-50 border-b border-black/5 flex items-center justify-between">
                <p className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Comments</p>
                <span className="text-[10px] font-semibold text-black/30">{t.taskcomment.length} comment{t.taskcomment.length !== 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-black/5 max-h-48 overflow-y-auto">
                {t.taskcomment.map((c, i) => (
                  <div key={c.id || i} className="px-4 py-3 text-xs flex flex-col gap-1.5">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-black">{c.user?.firstName || "User"} {c.user?.lastName || ""}</span>
                      <span className="text-[9px] text-black/40 font-semibold uppercase tracking-widest">{c.created_on || c.createdAt ? new Date(c.created_on || c.createdAt).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}</span>
                    </div>
                    <div className="text-black/80 font-medium whitespace-pre-wrap text-[11px]" dangerouslySetInnerHTML={{ __html: c.data || c.comment || "" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
