import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Clock, User, FileText, CheckCircle2, AlertCircle, Timer, ChevronDown, ChevronRight } from "lucide-react";
import Service from "../../api/Service";

/* ─── Pure helper functions ─── */

const parseTimeToDecimal = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0;
    return hours + minutes / 60;
};

const calculateWorkedSeconds = (task) => {
    return (task.workingHourTask || []).reduce(
        (sum, entry) => sum + (entry.duration_seconds || 0),
        0,
    );
};

function calcAccuracy(allocated, worked) {
    if (allocated === 0) return worked === 0 ? 100 : 0;
    const deviation = Math.abs(worked - allocated) / allocated;
    return Math.max(0, 100 - deviation * 100);
}

function getMEAS(taskList) {
    if (!taskList.length) return 0;
    const scores = taskList.map((t) => {
        const allocated = t.allocationLog?.allocatedHours
            ? parseTimeToDecimal(t.allocationLog.allocatedHours)
            : parseFloat(t.hours) || 0;
        const worked = calculateWorkedSeconds(t) / 3600;
        return calcAccuracy(allocated, worked);
    });
    return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function getMEASColor(score) {
    if (score >= 80) return "#16a34a";
    if (score >= 60) return "#d97706";
    return "#dc2626";
}

function getMEASBg(score) {
    if (score >= 80) return "#dcfce7";
    if (score >= 60) return "#fef3c7";
    return "#fee2e2";
}

function getMEASLabel(score) {
    if (score >= 80) return "Good — Reliable Estimation";
    if (score >= 60) return "Moderate — Needs Improvement";
    return "Poor — Requires Oversight";
}

function getMEASEmoji(score) {
    if (score >= 80) return "✅";
    if (score >= 60) return "⚠️";
    return "🚨";
}

function getStatusStyle(status) {
    const map = {
        COMPLETED: { bg: "#dcfce7", color: "#16a34a" },
        IN_REVIEW: { bg: "#fef9c3", color: "#a16207" },
        BREAK: { bg: "#fee2e2", color: "#dc2626" },
        IN_PROGRESS: { bg: "#dbeafe", color: "#1d4ed8" },
        ASSIGNED: { bg: "#e0e7ff", color: "#4338ca" },
    };
    return map[status] || { bg: "#f3f4f6", color: "#6b7280" };
}

const GREEN = "#6bbd45";
const GREEN_LIGHT = "#f0fce8";
const GREEN_BORDER = "#d1f0bb";

/* ─── Shared task row base style ─── */
const taskRowBaseStyle = {
    padding: "8px 10px",
    borderRadius: "0px",
    marginBottom: "6px",
    background: "#f9fafb",
    border: "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    transition: "all 0.15s",
};

/* ─── Task Detail Side Panel ─── */
function TaskDetailPanel({ taskId, onClose }) {
    const [task, setTask] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!taskId) return;
        setLoading(true);
        Service.GetTaskById(taskId)
            .then((res) => setTask(res?.data || null))
            .catch(() => setTask(null))
            .finally(() => setLoading(false));
    }, [taskId]);

    const totalSeconds = (task?.workingHourTask || []).reduce(
        (sum, wh) => sum + (Number(wh.duration_seconds) || 0),
        0,
    );

    const formatSecs = (s) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
    };

    const formatDate = (d) =>
        d
            ? new Date(d).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
            })
            : "—";

    const st = task
        ? getStatusStyle(task.status)
        : { bg: "#f3f4f6", color: "#000000" };

    return createPortal(
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                justifyContent: "flex-end",
            }}
            onClick={onClose}
        >
            {/* Backdrop */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.35)",
                    backdropFilter: "blur(2px)",
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: "relative",
                    width: "440px",
                    maxWidth: "95vw",
                    height: "100%",
                    background: "#fff",
                    boxShadow: "-8px 0 40px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Panel Header */}
                <div
                    style={{
                        background: GREEN_LIGHT,
                        borderBottom: `1px solid ${GREEN_BORDER}`,
                        padding: "20px 24px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div
                            style={{
                                background: GREEN,
                                borderRadius: "0px",
                                padding: "8px",
                                display: "flex",
                            }}
                        >
                            <FileText size={16} color="#fff" />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    color: GREEN,
                                    fontWeight: 800,
                                    letterSpacing: "1.5px",
                                    textTransform: "uppercase",
                                    marginBottom: "2px",
                                }}
                            >
                                Task Details &amp; Comments
                            </div>
                            <div
                                style={{
                                    fontSize: "14px",
                                    fontWeight: 800,
                                    color: "#111827",
                                    lineHeight: 1.3,
                                }}
                            >
                                {loading ? "Loading..." : task?.name || "—"}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: "#fee2e2",
                            border: "1px solid #dc2626",
                            borderRadius: "0px",
                            padding: "6px",
                            cursor: "pointer",
                            display: "flex",
                        }}
                    >
                        <X size={16} color="#dc2626" />
                    </button>
                </div>

                {/* Panel Body */}
                <div
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        padding: "20px 24px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                    }}
                >
                    {loading ? (
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                flex: 1,
                                gap: "12px",
                                color: "#9ca3af",
                            }}
                        >
                            <Loader2
                                size={32}
                                style={{ animation: "spin 1s linear infinite" }}
                                color={GREEN}
                            />
                            <span style={{ fontSize: "14px", fontWeight: 600 }}>
                                Loading task details...
                            </span>
                        </div>
                    ) : !task ? (
                        <div
                            style={{
                                textAlign: "center",
                                color: "#9ca3af",
                                padding: "40px 0",
                            }}
                        >
                            <AlertCircle size={32} style={{ margin: "0 auto 10px" }} />
                            <div style={{ fontSize: "14px", fontWeight: 600 }}>
                                Could not load task details.
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Status + Assignee */}
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                <span
                                    style={{
                                        padding: "4px 12px",
                                        borderRadius: "0px",
                                        border: `1px solid ${st.color}`,
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        background: st.bg,
                                        color: st.color,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                    }}
                                >
                                    {task.status?.replace("_", " ")}
                                </span>
                                {task.user && (
                                    <span
                                        style={{
                                            padding: "4px 12px",
                                            borderRadius: "0px",
                                            border: "1px solid #000000",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            background: "#f3f4f6",
                                            color: "#000000",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "5px",
                                        }}
                                    >
                                        <User size={11} /> {task.user.firstName} {task.user.lastName}
                                    </span>
                                )}
                            </div>

                            {/* Key Stats */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr 1fr",
                                    gap: "10px",
                                }}
                            >
                                {[
                                    {
                                        icon: <Clock size={14} />,
                                        label: "Allocated",
                                        value: (() => {
                                            const h = task.allocationLog?.allocatedHours
                                                ? parseTimeToDecimal(task.allocationLog.allocatedHours)
                                                : parseFloat(task.hours) || 0;
                                            return `${h.toFixed(2)}h`;
                                        })(),
                                    },
                                    {
                                        icon: <Timer size={14} />,
                                        label: "Worked",
                                        value: formatSecs(totalSeconds),
                                    },
                                    {
                                        icon: <CheckCircle2 size={14} />,
                                        label: "Sessions",
                                        value: String(task.workingHourTask?.length || 0),
                                    },
                                ].map((s) => (
                                    <div
                                        key={s.label}
                                        style={{
                                            background: "#f9fafb",
                                            border: "1px solid #000000",
                                            borderRadius: "0px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                color: "#000000",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {s.icon}
                                            <span
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: 700,
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.5px",
                                                }}
                                            >
                                                {s.label}
                                            </span>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 800,
                                                color: "#111827",
                                            }}
                                        >
                                            {s.value}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description / Comments */}
                            {task.description ? (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px solid #000000",
                                        borderRadius: "0px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: GREEN,
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            marginBottom: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <FileText size={12} /> Description / Comments
                                    </div>
                                    <div
                                        style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }}
                                        dangerouslySetInnerHTML={{ __html: task.description }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px dashed #000000",
                                        borderRadius: "0px",
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#000000",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                    }}
                                >
                                    No description or comments for this task.
                                </div>
                            )}

                            {/* Work Sessions */}
                            {task.workingHourTask && task.workingHourTask.length > 0 && (
                                <div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: "#000000",
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            marginBottom: "10px",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <Timer size={12} /> Work Sessions
                                    </div>
                                    <div
                                        style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                                    >
                                        {task.workingHourTask.map((wh, idx) => {
                                            const secs = Number(wh.duration_seconds) || 0;
                                            const isActive = wh.ended_at === null;
                                            return (
                                                <div
                                                    key={wh.id || idx}
                                                    style={{
                                                        background: isActive ? GREEN_LIGHT : "#f9fafb",
                                                        border: "1px solid #000000",
                                                        borderRadius: "0px",
                                                        padding: "10px 14px",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontSize: "14px",
                                                                fontWeight: 700,
                                                                color: "#111827",
                                                            }}
                                                        >
                                                            Session #{idx + 1}
                                                            {isActive && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: "8px",
                                                                        fontSize: "14px",
                                                                        background: GREEN,
                                                                        color: "#fff",
                                                                        padding: "1px 7px",
                                                                        borderRadius: "0px",
                                                                        border: "1px solid #ffffff",
                                                                        fontWeight: 800,
                                                                    }}
                                                                >
                                                                    ACTIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "14px",
                                                                color: "#000000",
                                                                marginTop: "2px",
                                                            }}
                                                        >
                                                            {wh.started_at
                                                                ? `Started: ${formatDate(wh.started_at)}`
                                                                : ""}
                                                            {wh.ended_at
                                                                ? ` · Ended: ${formatDate(wh.ended_at)}`
                                                                : ""}
                                                        </div>
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontWeight: 800,
                                                            fontSize: "14px",
                                                            color: isActive ? GREEN : "#000000",
                                                        }}
                                                    >
                                                        {formatSecs(secs)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* lineItemCompletion */}
                            {task.lineItemCompletion && (
                                <div
                                    style={{
                                        background: "#eff6ff",
                                        border: "1px solid #000000",
                                        borderRadius: "0px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: "#2563eb",
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        Completion Range
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: "#1d4ed8",
                                        }}
                                    >
                                        {task.lineItemCompletion?.replace("_", " – ")}
                                    </div>
                                </div>
                            )}

                            {/* Due date / Created */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "10px",
                                }}
                            >
                                {task.due_date && (
                                    <div
                                        style={{
                                            background: "#f9fafb",
                                            border: "1px solid #000000",
                                            borderRadius: "0px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "#000000",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            Due Date
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "#111827",
                                            }}
                                        >
                                            {formatDate(task.due_date)}
                                        </div>
                                    </div>
                                )}
                                {task.createdAt && (
                                    <div
                                        style={{
                                            background: "#f9fafb",
                                            border: "1px solid #000000",
                                            borderRadius: "0px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "#000000",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            Created At
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "#111827",
                                            }}
                                        >
                                            {formatDate(task.createdAt)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>,
        document.body,
    );
}

/* ─── Main Component ─── */
export default function MeasDashboard({ projectId, tasks = [], view, setView }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [expandedEmployees, setExpandedEmployees] = useState({});

    const toggleEmployee = (empName) => {
        setExpandedEmployees((prev) => ({
            ...prev,
            [empName]: !prev[empName],
        }));
    };

    const projectTasks = useMemo(() => {
        return tasks.filter((t) => t.project_id === projectId);
    }, [tasks, projectId]);

    const overallMEAS = useMemo(() => getMEAS(projectTasks), [projectTasks]);

    const employees = useMemo(() => {
        return [
            ...new Set(
                projectTasks.map((t) => `${t.user?.firstName} ${t.user?.lastName}`),
            ),
        ];
    }, [projectTasks]);

    const employeeStats = useMemo(() => {
        return employees
            .map((emp) => {
                const empTasks = projectTasks.filter(
                    (t) => `${t.user?.firstName} ${t.user?.lastName}` === emp,
                );
                const meas = getMEAS(empTasks);
                const totalAllocated = empTasks.reduce((s, t) => {
                    const hours = t.allocationLog?.allocatedHours
                        ? parseTimeToDecimal(t.allocationLog.allocatedHours)
                        : parseFloat(t.hours) || 0;
                    return s + hours;
                }, 0);
                const totalWorked = empTasks.reduce(
                    (s, t) => s + calculateWorkedSeconds(t) / 3600,
                    0,
                );
                const overrun = totalWorked > totalAllocated;
                return { name: emp, tasks: empTasks, meas, totalAllocated, totalWorked, overrun };
            })
            .sort((a, b) => b.meas - a.meas);
    }, [employees, projectTasks]);

    const taskScores = useMemo(() => {
        return projectTasks.map((t) => {
            const allocated = t.allocationLog?.allocatedHours
                ? parseTimeToDecimal(t.allocationLog.allocatedHours)
                : parseFloat(t.hours) || 0;
            const worked = calculateWorkedSeconds(t) / 3600;
            const accuracy = calcAccuracy(allocated, worked);
            const deviation =
                allocated > 0
                    ? ((((worked - allocated) / allocated) * 100).toFixed(1))
                    : worked > 0
                        ? "100"
                        : "0";
            return { ...t, accuracy, deviation, allocatedHours: allocated, workedHours: worked };
        });
    }, [projectTasks]);

    return (
        <div>

            
                <div
                    style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(ellipse at 10% 50%, ${GREEN}14 0%, transparent 60%)`,
                        pointerEvents: "none",
                    }}
                />


            <div style={{ padding: "28px 36px", background: "#f9fafb" }}>
                {/* BY EMPLOYEE */}
                {view === "by employee" && (
                    <div className="space-y-4">
                        {employeeStats.map((emp) => {
                            const isExpanded = !!expandedEmployees[emp.name];
                            const statusColor = getMEASColor(emp.meas);
                            const statusLabel = getMEASLabel(emp.meas);
                            const statusBg = getMEASBg(emp.meas);
                            const emoji = getMEASEmoji(emp.meas);

                            return (
                                <div
                                    key={emp.name}
                                    className="bg-white border border-black rounded-none shadow-sm overflow-hidden"
                                >
                                    {/* Header / Clickable Card Area */}
                                    <button
                                        onClick={() => toggleEmployee(emp.name)}
                                        className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors text-left"
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            {/* Badges */}
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-xs font-normal px-2 py-0.5 rounded-none uppercase tracking-wider border border-black bg-slate-100 text-black">
                                                    MEAS: {emp.meas.toFixed(1)}
                                                </span>
                                                <span
                                                    className="text-xs font-normal px-2 py-0.5 rounded-none uppercase tracking-wider border"
                                                    style={{
                                                        backgroundColor: statusBg,
                                                        color: "#000000",
                                                        borderColor: statusColor,
                                                    }}
                                                >
                                                    {emoji} {statusLabel}
                                                </span>
                                            </div>

                                            {/* Employee Name */}
                                            <h4 className="text-base font-semibold text-black uppercase tracking-wider mb-2">
                                                {emp.name}
                                            </h4>

                                            {/* Info & Progress bar */}
                                            <div className="flex flex-wrap items-center gap-6">
                                                <p className="text-sm text-black font-normal uppercase tracking-wider">
                                                    {emp.tasks.length} Task{emp.tasks.length !== 1 ? "s" : ""}
                                                </p>
                                                <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                                                    <div className="w-full h-2 bg-slate-200 rounded-none border border-black overflow-hidden">
                                                        <div
                                                            className="h-full rounded-none"
                                                            style={{
                                                                width: `${Math.min(100, emp.meas)}%`,
                                                                backgroundColor: statusColor,
                                                                transition: "width 0.6s ease",
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Chevron Toggle Button */}
                                        <div className="p-2 bg-green-50 rounded-none border border-black shrink-0">
                                            {isExpanded ? (
                                                <ChevronDown size={18} className="text-black" />
                                            ) : (
                                                <ChevronRight size={18} className="text-black" />
                                            )}
                                        </div>
                                    </button>

                                    {/* Expanded Task list */}
                                    {isExpanded && (
                                        <div className="bg-slate-50 p-4 border-t border-black">
                                            <div className="bg-white rounded-none border border-black overflow-hidden shadow-sm">
                                                {/* Header Column Titles */}
                                                <div className="grid grid-cols-7 gap-4 p-4 bg-slate-100 border-b border-black text-xs font-bold text-black uppercase tracking-wider">
                                                    <div className="col-span-2">Task Details</div>
                                                    <div className="text-right">Allocated</div>
                                                    <div className="text-right">Worked</div>
                                                    <div className="text-right">Deviation</div>
                                                    <div className="text-right">MEAS Score</div>
                                                    <div className="text-end">Status</div>
                                                </div>

                                                {/* Task Rows */}
                                                <div className="divide-y divide-black/10">
                                                    {emp.tasks.map((t) => {
                                                        const allocated = t.allocationLog?.allocatedHours
                                                            ? parseTimeToDecimal(t.allocationLog.allocatedHours)
                                                            : parseFloat(t.hours) || 0;
                                                        const worked = calculateWorkedSeconds(t) / 3600;
                                                        const acc = calcAccuracy(allocated, worked);
                                                        const dev = allocated > 0
                                                            ? (((worked - allocated) / allocated) * 100).toFixed(0)
                                                            : "0";
                                                        const over = worked > allocated;

                                                        return (
                                                            <div
                                                                key={t.id}
                                                                onClick={() => setSelectedTaskId(t.id)}
                                                                className="grid grid-cols-7 gap-4 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer items-center text-sm font-normal text-black"
                                                            >
                                                                <div className="col-span-2">
                                                                    <p className="font-normal text-black truncate">{t.name || "—"}</p>
                                                                    <p className="text-xs text-black/60 uppercase mt-0.5">{t.wbsType || "Task"}</p>
                                                                </div>
                                                                <div className="text-right">{allocated.toFixed(2)}h</div>
                                                                <div className="text-right font-normal">{worked.toFixed(2)}h</div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs border"
                                                                        style={{
                                                                            backgroundColor: over ? "#fef3c7" : "#eff6ff",
                                                                            color: over ? "#d97706" : "#2563eb",
                                                                            borderColor: over ? "#d97706" : "#2563eb",
                                                                        }}
                                                                    >
                                                                        {over ? "+" : ""}{dev}%
                                                                    </span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <span
                                                                        className="px-2 py-0.5 rounded-none text-xs font-normal border"
                                                                        style={{
                                                                            backgroundColor: getMEASBg(acc),
                                                                            color: getMEASColor(acc),
                                                                            borderColor: getMEASColor(acc),
                                                                        }}
                                                                    >
                                                                        {acc.toFixed(0)}
                                                                    </span>
                                                                </div>
                                                                <div className="text-end">
                                                                    <span className="px-2 py-0.5 rounded-none text-xs uppercase tracking-wider border border-black bg-slate-50 text-black font-normal">
                                                                        {t.status}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {employeeStats.length === 0 && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "60px",
                                    color: "#000000",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    background: "#ffffff",
                                    borderRadius: "0px",
                                    border: "1px dashed #000000",
                                }}
                            >
                                No task data available for this project yet.
                            </div>
                        )}
                    </div>
                )}

                {/* BY TASK */}
                {view === "by task" && (
                    <div
                        style={{
                            background: "#ffffff",
                            borderRadius: "0px",
                            border: "1px solid #000000",
                            overflow: "hidden",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                        }}
                    >
                        {/* Table Header */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px 95px",
                                padding: "10px 16px",
                                fontSize: "14px",
                                letterSpacing: "1.5px",
                                color: "#000000",
                                fontWeight: 800,
                                borderBottom: "1px solid #000000",
                                background: "#f9fafb",
                                textTransform: "uppercase",
                            }}
                        >
                            <div>Task</div>
                            <div>Assignee</div>
                            <div style={{ textAlign: "right" }}>Alloc</div>
                            <div style={{ textAlign: "right" }}>Worked</div>
                            <div style={{ textAlign: "right" }}>Dev%</div>
                            <div style={{ textAlign: "right" }}>Score</div>
                            <div style={{ textAlign: "center" }}>Status</div>
                        </div>

                        {[...taskScores]
                            .sort((a, b) => b.accuracy - a.accuracy)
                            .map((t, i) => {
                                const rowSt = getStatusStyle(t.status);
                                const over = t.workedHours > t.allocatedHours;
                                const rowBg = i % 2 === 0 ? "#ffffff" : "#fafafa";
                                return (
                                    <div
                                        key={t.id}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "2fr 1fr 80px 80px 80px 80px 95px",
                                            padding: "12px 16px",
                                            borderBottom: "1px solid rgba(0,0,0,0.1)",
                                            background: rowBg,
                                            alignItems: "center",
                                            cursor: "pointer",
                                            transition: "background 0.12s",
                                        }}
                                        onClick={() => setSelectedTaskId(t.id)}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = "#f0fce8";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = rowBg;
                                        }}
                                    >
                                        <div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    fontWeight: 400,
                                                    color: "#111827",
                                                }}
                                            >
                                                {t.name || "—"}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "14px",
                                                    color: "#000000",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                Click to view comments
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                color: "#000000",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                            }}
                                        >
                                            {t.user?.firstName} {t.user?.lastName}
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "14px",
                                                color: "#000000",
                                            }}
                                        >
                                            {t.allocatedHours.toFixed(2)}h
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "14px",
                                                fontWeight: 400,
                                                color: "#111827",
                                            }}
                                        >
                                            {t.workedHours.toFixed(2)}h
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "14px",
                                                fontWeight: 400,
                                                color: over ? "#d97706" : "#2563eb",
                                            }}
                                        >
                                            {over ? "+" : ""}
                                            {t.deviation}%
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "14px",
                                                fontWeight: 400,
                                                color: getMEASColor(t.accuracy),
                                            }}
                                        >
                                            {t.accuracy.toFixed(1)}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "center" }}>
                                            <span
                                                style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "0px",
                                                    border: `1px solid ${rowSt.color}`,
                                                    fontSize: "14px",
                                                    fontWeight: 400,
                                                    letterSpacing: "0.5px",
                                                    background: rowSt.bg,
                                                    color: rowSt.color,
                                                    textTransform: "uppercase",
                                                }}
                                            >
                                                {t.status?.replace("_", " ")}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                        {taskScores.length === 0 && (
                            <div
                                style={{
                                    textAlign: "center",
                                    padding: "40px",
                                    color: "#000000",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                }}
                            >
                                No task data available for this project yet.
                            </div>
                        )}

                        {/* Footer */}
                        <div
                            style={{
                                padding: "16px 20px",
                                background: GREEN_LIGHT,
                                borderTop: "1px solid #000000",
                                display: "flex",
                                gap: "32px",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "14px",
                                        color: "#000000",
                                        letterSpacing: "1.5px",
                                        fontWeight: 800,
                                        textTransform: "uppercase",
                                        marginBottom: "2px",
                                    }}
                                >
                                    Overall MEAS
                                </div>
                                <div
                                    style={{
                                        fontSize: "26px",
                                        fontWeight: 900,
                                        color: getMEASColor(overallMEAS),
                                    }}
                                >
                                    {overallMEAS.toFixed(1)}
                                </div>
                            </div>
                            <div
                                style={{ flex: 1, fontSize: "14px", color: "#000000", lineHeight: 1.7 }}
                            >
                                Formula:{" "}
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: "14px",
                                        background: "#d1f0bb",
                                        border: "1px solid #4b7a2e",
                                        padding: "1px 6px",
                                        borderRadius: "0px",
                                    }}
                                >
                                    accuracy = max(0, 100 − |actual − allocated| / allocated × 100)
                                </span>
                                <br />
                                Click any row to view task details &amp; comments.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Task Detail Side Panel */}
            {selectedTaskId && (
                <TaskDetailPanel
                    taskId={selectedTaskId}
                    onClose={() => setSelectedTaskId(null)}
                />
            )}
        </div>
    );
}
