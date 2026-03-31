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
import "jspdf-autotable";
import { toast } from "react-toastify";
import Button from "../../fields/Button";
import EditEmployee from "./EditEmployee";
import { formatDateTime } from "../../../utils/dateUtils";

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

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="relative bg-white rounded-2xl border border-black/5 p-5 shadow-sm overflow-hidden">
    <p className="text-sm font-black text-black/40 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-black text-black tracking-tight">{value}</p>
    {sub && <p className="text-sm text-black/30 font-bold mt-1 uppercase tracking-wide">{sub}</p>}
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
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${isOverrun ? "border-red-200 bg-red-50/20" : "border-black/5 bg-white"
        }`}
    >
      {/* Main Row */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-black/20 transition-colors gap-4"
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Left */}
        <div className="flex-1 min-w-0">
          <p className="text-md font-semibold text-black tracking-widest leading-snug">
            {task.name || "Untitled Task"}
          </p>
          {task.description && task.description !== task.name && (
            <p className="text-sm text-black/40 font-medium mt-0.5 line-clamp-1">{task.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {task.created_on && (
              <span className="inline-flex items-center gap-1 text-sm text-black/30 font-bold uppercase tracking-widest">
                <CalendarDays className="w-3 h-3" />
                {new Date(task.created_on).toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </span>
            )}
            {task.project?.name && (
              <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest truncate max-w-[200px]">
                📁 {task.project.name}
              </span>
            )}
            {task.wbsType && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-black/30 uppercase tracking-widest">
                <Layers className="w-3 h-3" />
                {task.wbsType}
              </span>
            )}
            {task.Stage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                <Tag className="w-3 h-3" />
                {task.Stage}
              </span>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span
            className={`text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full border ${meta.color}`}
          >
            {meta.label}
          </span>

          <div className="text-right space-y-0.5">
            <p className="text-sm text-black/40 font-bold uppercase tracking-widest">
              Assigned:{" "}
              <span className="text-black/60">{secToHms(assignedSec)}</span>
            </p>
            <p className={`text-sm font-bold uppercase tracking-widest ${isOverrun ? "text-red-500" : "text-black/40"}`}>
              Worked:{" "}
              <span className={` ${isOverrun ? "text-red-600" : "text-black/60"}`}>
                {secToHms(workedSec)}
              </span>
            </p>
            {/* {efficiency !== null && (
              <p className={`text-[10px] font-black uppercase tracking-widest ${efficiency > 100 ? "text-red-500" : efficiency >= 80 ? "text-green-600" : "text-yellow-600"
                }`}>
                {efficiency}% efficiency
              </p>
            )} */}
          </div>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-black/20 mt-1" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-black/20 mt-1" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-black/5 bg-gray-50/60 animate-in slide-in-from-top-1 fade-in duration-150">
          {/* Meta Grid */}
          <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-black/5">
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
              <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-2">
                Work Sessions ({sessions.length})
              </p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {sessions.map((s, i) => (
                  <div
                    key={s.id || i}
                    className="flex items-center justify-between bg-white rounded-xl px-3 py-2 border border-black/5 text-[11px]"
                  >
                    <div className="flex items-center gap-2 text-black/50 font-bold">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-black shrink-0">
                        {i + 1}
                      </span>
                      <span>
                        {s.started_at
                          ? new Date(s.started_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })
                          : "—"}
                      </span>
                      <span className="text-black/20">→</span>
                      <span>
                        {s.ended_at
                          ? new Date(s.ended_at).toLocaleString("en-GB", {
                            day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
                          })
                          : "In Progress"}
                      </span>
                    </div>
                    <span className="font-black text-black/70 shrink-0 ml-4">
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
    <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-0.5">{label}</p>
    <p className="text-xs font-bold text-black">{value}</p>
  </div>
);

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

  // Tasks
  const [allTasks, setAllTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("ALL");
  const [taskDateFrom, setTaskDateFrom] = useState("");
  const [taskDateTo, setTaskDateTo] = useState("");
  const [taskPage, setTaskPage] = useState(1);
  const TASKS_PER_PAGE = 10;

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

  const handleExport = (format, scope) => {
    let dataToExport = [...allTasks];
    const now = new Date();

    if (scope === "month") {
      dataToExport = allTasks.filter(t => {
        const d = new Date(t.created_on || t.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (scope === "year") {
      dataToExport = allTasks.filter(t => {
        const d = new Date(t.created_on || t.createdAt);
        return d.getFullYear() === now.getFullYear();
      });
    }

    if (dataToExport.length === 0) {
      toast.error("No data found for the selected period");
      return;
    }

    const exportRows = dataToExport.map(t => ({
      Project: t.project?.name || "—",
      Task: t.name || t.title || "—",
      Status: t.status || "—",
      Estimate: `${Math.floor(allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours) / 3600)}h`,
      Worked: secToHms(calcWorkedSec(t.workingHourTask)),
      Date: new Date(t.created_on || t.createdAt).toLocaleDateString()
    }));

    if (format === "excel") {
      const ws = XLSX.utils.json_to_sheet(exportRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Task Report");
      XLSX.writeFile(wb, `${employee.firstName}_Task_Report_${scope}.xlsx`);
      toast.success("Excel report generated successfully!");
    } else {
      try {
        const doc = new jsPDF();
        const employeeName = `${employee.firstName || ""} ${employee.lastName || ""}`.trim();
        const reportTitle = "Employee Task Performance Report";
        const generatedDate = new Date().toLocaleDateString();

        // Header Section
        doc.setFontSize(22);
        doc.setTextColor(20, 184, 166); // Teal-500
        doc.text(reportTitle, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Employee: ${employeeName}`, 14, 32);
        doc.text(`Designation: ${employee.designation || "N/A"}`, 14, 38);
        doc.text(`Generated on: ${generatedDate}`, 14, 44);

        let filterText = `Period: ${scope.charAt(0).toUpperCase() + scope.slice(1)}`;
        if (scope === "month") {
          filterText += ` (${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()})`;
        } else if (scope === "year") {
          filterText += ` (${new Date().getFullYear()})`;
        }
        doc.text(filterText, 14, 50);

        // Table preparation
        const tableColumn = ["Project Name", "Task Name", "Status", "Estimate", "Worked", "Date"];
        const tableRows = dataToExport.map(t => [
          t.project?.name || "N/A",
          t.name || t.title || "N/A",
          t.status || "N/A",
          `${Math.floor(allocToSec(t.allocatedHours || t.allocationLog?.allocatedHours) / 3600)}h`,
          secToHms(calcWorkedSec(t.workingHourTask)),
          new Date(t.created_on || t.createdAt).toLocaleDateString()
        ]);

        doc.autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 60,
          theme: "grid",
          headStyles: {
            fillColor: [20, 184, 166], // Teal-500
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: "bold",
          },
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          alternateRowStyles: {
            fillColor: [240, 253, 250], // Teal-50
          },
        });

        // Save PDF
        const fileName = `Report_${employeeName.replace(/\s+/g, "_")}_${scope}_${generatedDate.replace(/\//g, "-")}.pdf`;
        doc.save(fileName);
        toast.success("PDF report generated successfully!");
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF report");
      }
    }
    setShowExportMenu(false);
  };

  // ── Filtered tasks ───────────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    let list = [...allTasks];
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
    return list;
  }, [allTasks, taskSearch, taskStatusFilter, taskDateFrom, taskDateTo]);

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
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex items-center justify-center p-12 text-black bg-white rounded-2xl border border-gray-200 shadow-xl">
          <Loader2 className="w-8 h-8 animate-spin mr-3 text-[#6bbd45]" />
          <span className="text-sm font-black uppercase tracking-widest text-[#6bbd45]">Loading employee details...</span>
        </div>
      </div>
    );
  }
  if (error || !employee) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="flex flex-col items-center justify-center p-12 text-red-600 bg-white rounded-2xl border border-gray-200 shadow-xl gap-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 mr-3" />
            <span className="text-sm font-black uppercase tracking-widest">{error || "Employee not found"}</span>
          </div>
          {onClose && (
            <button onClick={onClose} className="px-6 py-2 bg-red-50 border border-red-600 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all">Close</button>
          )}
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[95vw] mx-auto flex flex-col h-[95vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-black tracking-tight uppercase">
                {employee.firstName} {employee.middleName} {employee.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-black text-black uppercase tracking-[0.2em]">
                  {employee.designation || "EMPLOYEE PROFILE"}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${employee.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"
                    }`}
                >
                  {employee.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(userRole === "admin" || userRole === "deputy_manager" || userRole === "operation_executive") && (
              <button
                onClick={() => handleModel(employee)}
                className="flex items-center gap-2 px-6 py-2 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95"
              >
                <Edit2 className="w-4 h-4 text-[#6bbd45]" />
                Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        </header>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
          {/* ── Profile Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-6">
            <div className="space-y-4">
              <InfoRow label="Username" value={employee.username} />
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
                <h3 className="text-xl text-black uppercase tracking-tight">Employee Performance Score</h3>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
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
                    className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    {[2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {epsLoading ? (
                <div className="flex items-center justify-center py-10 bg-white/50 rounded-2xl border border-dashed border-black/5">
                  <Loader2 className="w-6 h-6 animate-spin text-black/20" />
                </div>
              ) : epsData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <div className="col-span-2 md:col-span-3 lg:col-span-4 bg-linear-to-br from-green-50 to-emerald-100/50 p-6 rounded-2xl border border-black/5 shadow-sm">
                    <span className="text-[10px] font-black text-black/40 uppercase tracking-widest block mb-2">Overall Score</span>
                    <span className="text-4xl font-black text-green-700">
                      {epsData.score !== undefined ? Number(epsData.score).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  {[
                    ["Completion Score", epsData.components?.completionScore],
                    ["Discipline Score", epsData.components?.disciplineScore],
                    ["Session Quality", epsData.components?.sessionQualityScore],
                    ["Underutilized", epsData.components?.underutilizedScore],
                    ["Rework Score", epsData.components?.reworkScore],
                    ["Overrun Score", epsData.components?.overrunScore],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-widest block mb-2">{label}</span>
                      <span className="text-2xl font-black text-black">
                        {val !== undefined ? Number(val).toFixed(2) : "0"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/50 rounded-2xl border border-dashed border-black/5 p-10 text-center">
                  <p className="text-black/40 font-bold text-sm tracking-tight">No EPS data for selected period</p>
                </div>
              )}
            </div>
          )}

          {/* ── Task Performance Report ── */}
          {userRole !== "client" && userRole !== "client_admin" && (
            <div className="pt-8 border-t border-black/5">

              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl text-black uppercase tracking-tight">Task Performance Report</h3>
                    <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mt-0.5" title={(stats.projectNames || []).join(", ")}>
                      {allTasks.length} tasks · {stats.projectCount} project{stats.projectCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 relative">
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Generate Report
                    <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? "rotate-180" : ""}`} />
                  </button>

                  {showExportMenu && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl border border-black/5 shadow-xl z-50 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="px-3 py-2 text-[10px] font-black text-black/20 uppercase tracking-widest border-b border-black/5 flex items-center justify-between">
                        Format & Period
                        <X size={10} className="cursor-pointer" onClick={() => setShowExportMenu(false)} />
                      </div>
                      {["Excel", "PDF"].map((fmt) => (
                        <div key={fmt} className="space-y-1 mt-2 mb-2 p-1 border-b border-black/5 last:border-0 pb-2">
                          <div className="flex items-center gap-2 px-2 py-1">
                            {fmt === "Excel" ? <FileSpreadsheet size={12} className="text-green-600" /> : <FilePdf size={12} className="text-red-600" />}
                            <span className="text-[11px] font-black uppercase tracking-widest">{fmt} Report</span>
                          </div>
                          {["all", "month", "year"].map((scope) => (
                            <button
                              key={scope}
                              onClick={() => handleExport(fmt.toLowerCase(), scope)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[10px] font-bold text-black/60 hover:text-black rounded-lg transition-all capitalize"
                            >
                              Export by {scope}
                            </button>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={fetchAllTasks}
                    disabled={tasksLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-black uppercase tracking-widest text-black/40 hover:bg-gray-50 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${tasksLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
              </div>

              {tasksLoading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-black/5 gap-2">
                  <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                  <p className="text-[11px] font-black text-black/20 uppercase tracking-widest">Loading tasks…</p>
                </div>
              ) : allTasks.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-black/5 p-12 text-center">
                  <ListTodo className="w-10 h-10 text-black/10 mx-auto mb-3" />
                  <p className="text-black/40 font-bold text-sm uppercase tracking-tight">No tasks found for this employee</p>
                </div>
              ) : (
                <>
                  {/* ── Stat Cards ── */}
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                    <StatCard icon={ListTodo} label="Total Tasks" value={allTasks.length} accent="bg-indigo-500" />
                    <StatCard icon={Clock} label="Assigned" value={`${Math.floor(stats.totalAssignedSec / 3600)}h`} sub={secToHms(stats.totalAssignedSec)} accent="bg-blue-500" />
                    <StatCard icon={TrendingUp} label="Worked" value={`${Math.floor(stats.totalWorkedSec / 3600)}h`} sub={secToHms(stats.totalWorkedSec)} accent="bg-violet-500" />
                    <StatCard
                      icon={CheckCircle2}
                      label="Completed"
                      value={stats.completed}
                      sub={`${allTasks.length > 0 ? Math.round((stats.completed / allTasks.length) * 100) : 0}% of total`}
                      accent="bg-green-500"
                    />
                    <StatCard
                      icon={AlertTriangle}
                      label="Overrun"
                      value={stats.overrunCount}
                      sub={stats.overrunCount > 0 ? "needs attention" : "all good"}
                      accent={stats.overrunCount > 0 ? "bg-red-500" : "bg-green-500"}
                    />
                  </div>

                  {/* Project Names List */}
                  {stats.projectNames?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-8">
                      {stats.projectNames.map((name) => (
                        <span
                          key={name}
                          className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100"
                        >
                          📁 {name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* ── Filter Bar ── */}
                  <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 mb-5 flex flex-col md:flex-row gap-3 items-start md:items-center flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20" />
                      <input
                        type="text"
                        placeholder="Search tasks or projects…"
                        value={taskSearch}
                        onChange={(e) => { setTaskSearch(e.target.value); setTaskPage(1); }}
                        className="w-full pl-9 pr-4 py-2.5 text-xs font-bold rounded-xl border border-black/5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                      />
                    </div>

                    {/* Status */}
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-black/20 pointer-events-none" />
                      <select
                        value={taskStatusFilter}
                        onChange={(e) => { setTaskStatusFilter(e.target.value); setTaskPage(1); }}
                        className="pl-9 pr-4 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer"
                      >
                        {uniqueStatuses.map((s) => (
                          <option key={s} value={s}>
                            {s === "ALL" ? "All Statuses" : (STATUS_META[s]?.label || s)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* From */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">From</span>
                      <input
                        type="date"
                        value={taskDateFrom}
                        onChange={(e) => { setTaskDateFrom(e.target.value); setTaskPage(1); }}
                        className="px-3 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">To</span>
                      <input
                        type="date"
                        value={taskDateTo}
                        onChange={(e) => { setTaskDateTo(e.target.value); setTaskPage(1); }}
                        className="px-3 py-2.5 bg-gray-50 border border-black/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>

                    {/* Clear */}
                    {(taskSearch || taskStatusFilter !== "ALL" || taskDateFrom || taskDateTo) && (
                      <button
                        onClick={() => {
                          setTaskSearch(""); setTaskStatusFilter("ALL");
                          setTaskDateFrom(""); setTaskDateTo(""); setTaskPage(1);
                        }}
                        className="px-4 py-2.5 bg-red-50 text-red-500 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors whitespace-nowrap"
                      >
                        Clear
                      </button>
                    )}

                    {/* Result count */}
                    <span className="text-[10px] font-black text-black/20 uppercase tracking-widest ml-auto">
                      {filteredTasks.length} result{filteredTasks.length !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* ── Task List ── */}
                  <div className="space-y-2 mb-5">
                    {filteredTasks.length === 0 ? (
                      <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-black/5">
                        <p className="text-black/30 font-bold text-sm uppercase tracking-tight">No tasks match your filters</p>
                      </div>
                    ) : (
                      pagedTasks.map((task, idx) => <TaskRow key={task.id || idx} task={task} />)
                    )}
                  </div>

                  {/* ── Pagination ── */}
                  {filteredTasks.length > TASKS_PER_PAGE && (
                    <div className="flex items-center justify-between pt-4 border-t border-black/5">
                      <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest">
                        {(taskPage - 1) * TASKS_PER_PAGE + 1}–{Math.min(taskPage * TASKS_PER_PAGE, filteredTasks.length)} of {filteredTasks.length}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTaskPage((p) => Math.max(1, p - 1))}
                          disabled={taskPage === 1}
                          className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-black text-black/50 hover:bg-gray-50 disabled:opacity-30 transition-all"
                        >
                          ← Prev
                        </button>
                        <span className="px-3 py-1.5 bg-black text-white text-xs font-black rounded-lg">
                          {taskPage} / {totalPages}
                        </span>
                        <button
                          onClick={() => setTaskPage((p) => Math.min(totalPages, p + 1))}
                          disabled={taskPage === totalPages}
                          className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-black text-black/50 hover:bg-gray-50 disabled:opacity-30 transition-all"
                        >
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
          {/* ── Address ── */}
          {(employee.address || employee.city || employee.state || employee.country || employee.zipCode) && (
            <div className="pt-8 border-t border-black/5">
              <h4 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-4">Address Information</h4>
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
        </div>
      </div>
    </div>
  );
};

// ─── InfoRow ──────────────────────────────────────────────────────────────────

const InfoRow = ({ label, value, href }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-black font-semibold uppercase tracking-[0.15em] text-xs">{label}</span>
    {href ? (
      <a href={href} className="text-black font-semibold text-sm tracking-tight hover:underline">
        {value}
      </a>
    ) : (
      <span className="text-black text-sm tracking-tight">{value}</span>
    )}
  </div>
);

export default GetEmployeeByID;
