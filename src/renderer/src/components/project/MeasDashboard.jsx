import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Loader2, X, Clock, User, FileText, CheckCircle2, AlertCircle, Timer } from "lucide-react";
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
    borderRadius: "8px",
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
        : { bg: "#f3f4f6", color: "#6b7280" };

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
                                borderRadius: "8px",
                                padding: "8px",
                                display: "flex",
                            }}
                        >
                            <FileText size={16} color="#fff" />
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "10px",
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
                            border: "none",
                            borderRadius: "8px",
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
                            <span style={{ fontSize: "13px", fontWeight: 600 }}>
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
                            <div style={{ fontSize: "13px", fontWeight: 600 }}>
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
                                        borderRadius: "999px",
                                        fontSize: "11px",
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
                                            borderRadius: "999px",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            background: "#f3f4f6",
                                            color: "#374151",
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
                                            border: "1px solid #f3f4f6",
                                            borderRadius: "10px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "5px",
                                                color: "#9ca3af",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {s.icon}
                                            <span
                                                style={{
                                                    fontSize: "10px",
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
                                                fontSize: "15px",
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
                                        border: "1px solid #f3f4f6",
                                        borderRadius: "12px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "10px",
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
                                        style={{ fontSize: "13px", color: "#374151", lineHeight: 1.7 }}
                                        dangerouslySetInnerHTML={{ __html: task.description }}
                                    />
                                </div>
                            ) : (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px dashed #e5e7eb",
                                        borderRadius: "12px",
                                        padding: "20px",
                                        textAlign: "center",
                                        color: "#9ca3af",
                                        fontSize: "12px",
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
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            color: "#6b7280",
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
                                                        border: `1px solid ${isActive ? GREEN_BORDER : "#f3f4f6"}`,
                                                        borderRadius: "10px",
                                                        padding: "10px 14px",
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <div>
                                                        <div
                                                            style={{
                                                                fontSize: "11px",
                                                                fontWeight: 700,
                                                                color: "#111827",
                                                            }}
                                                        >
                                                            Session #{idx + 1}
                                                            {isActive && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: "8px",
                                                                        fontSize: "9px",
                                                                        background: GREEN,
                                                                        color: "#fff",
                                                                        padding: "1px 7px",
                                                                        borderRadius: "999px",
                                                                        fontWeight: 800,
                                                                    }}
                                                                >
                                                                    ACTIVE
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize: "10px",
                                                                color: "#9ca3af",
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
                                                            fontSize: "13px",
                                                            color: isActive ? GREEN : "#374151",
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
                                        border: "1px solid #bfdbfe",
                                        borderRadius: "12px",
                                        padding: "14px 16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "10px",
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
                                            border: "1px solid #f3f4f6",
                                            borderRadius: "10px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color: "#9ca3af",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            Due Date
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
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
                                            border: "1px solid #f3f4f6",
                                            borderRadius: "10px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 700,
                                                color: "#9ca3af",
                                                textTransform: "uppercase",
                                                letterSpacing: "0.5px",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            Created At
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
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
export default function MeasDashboard({ projectId, tasks = [] }) {
    const [view, setView] = useState("by employee");
    const [selectedTaskId, setSelectedTaskId] = useState(null);

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
        <div
            style={{
                fontFamily: "inherit",
                background: "#ffffff",
                borderRadius: "24px",
                color: "#111827",
                padding: "0",
                overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.06)",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}
        >
            {/* Header */}
            <div
                style={{
                    background: `linear-gradient(135deg, ${GREEN_LIGHT} 0%, #ffffff 100%)`,
                    borderBottom: `1px solid ${GREEN_BORDER}`,
                    padding: "28px 36px 20px",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
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
                <div style={{ position: "relative" }}>
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "4px",
                        }}
                    >
                        <div
                            style={{
                                background: `linear-gradient(135deg, ${GREEN}, #4ade80)`,
                                borderRadius: "10px",
                                width: "38px",
                                height: "38px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "18px",
                                flexShrink: 0,
                                boxShadow: `0 4px 12px ${GREEN}40`,
                            }}
                        >
                            🎯
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "10px",
                                    letterSpacing: "3px",
                                    color: GREEN,
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                }}
                            >
                                Manager Estimation Accuracy
                            </div>
                            <div
                                style={{
                                    fontSize: "22px",
                                    fontWeight: 800,
                                    letterSpacing: "-0.5px",
                                    lineHeight: 1.2,
                                    color: "#111827",
                                }}
                            >
                                MEAS Dashboard
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav Tabs */}
                <div style={{ display: "flex", gap: "6px", marginTop: "20px" }}>
                    {["by employee", "by task"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setView(tab)}
                            style={{
                                padding: "7px 18px",
                                borderRadius: "8px",
                                border: view === tab ? `2px solid ${GREEN}` : "2px solid #e5e7eb",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 700,
                                letterSpacing: "0.5px",
                                textTransform: "uppercase",
                                background: view === tab ? GREEN : "#ffffff",
                                color: view === tab ? "#fff" : "#6b7280",
                                transition: "all 0.15s",
                            }}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ padding: "28px 36px", background: "#f9fafb" }}>
                {/* BY EMPLOYEE */}
                {view === "by employee" && (
                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                            gap: "14px",
                        }}
                    >
                        {employeeStats.map((emp) => (
                            <div
                                key={emp.name}
                                style={{
                                    background: "#ffffff",
                                    border: `1px solid ${getMEASBg(emp.meas) === "#dcfce7" ? GREEN_BORDER : "rgba(0,0,0,0.07)"}`,
                                    borderRadius: "20px",
                                    padding: "22px",
                                    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "flex-start",
                                        marginBottom: "14px",
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 800,
                                                color: "#111827",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            {emp.name}
                                        </div>
                                        <div style={{ fontSize: "11px", color: "#9ca3af" }}>
                                            {emp.tasks.length} task{emp.tasks.length !== 1 ? "s" : ""}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <div
                                            style={{
                                                fontSize: "30px",
                                                fontWeight: 900,
                                                color: getMEASColor(emp.meas),
                                                lineHeight: 1,
                                            }}
                                        >
                                            {emp.meas.toFixed(1)}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "9px",
                                                color: "#9ca3af",
                                                letterSpacing: "1.5px",
                                                textTransform: "uppercase",
                                                marginTop: "2px",
                                            }}
                                        >
                                            MEAS
                                        </div>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div
                                    style={{
                                        background: "#f3f4f6",
                                        borderRadius: "8px",
                                        height: "7px",
                                        marginBottom: "16px",
                                    }}
                                >
                                    <div
                                        style={{
                                            height: "7px",
                                            borderRadius: "8px",
                                            width: `${Math.min(100, emp.meas)}%`,
                                            background: `linear-gradient(90deg, ${getMEASColor(emp.meas)}, ${getMEASColor(emp.meas)}99)`,
                                            transition: "width 0.6s ease",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        fontSize: "10px",
                                        fontWeight: 800,
                                        color: "#9ca3af",
                                        letterSpacing: "1px",
                                        marginBottom: "8px",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Tasks{" "}
                                    <span
                                        style={{
                                            color: "#b0b8c1",
                                            fontWeight: 500,
                                            letterSpacing: 0,
                                        }}
                                    >
                                        · click to view details
                                    </span>
                                </div>
                                <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                                    {emp.tasks.map((t) => {
                                        const allocated = t.allocationLog?.allocatedHours
                                            ? parseTimeToDecimal(t.allocationLog.allocatedHours)
                                            : parseFloat(t.hours) || 0;
                                        const worked = calculateWorkedSeconds(t) / 3600;
                                        const acc = calcAccuracy(allocated, worked);
                                        const dev =
                                            allocated > 0
                                                ? (((worked - allocated) / allocated) * 100).toFixed(0)
                                                : "0";
                                        const over = worked > allocated;
                                        return (
                                            <div
                                                key={t.id}
                                                style={taskRowBaseStyle}
                                                onClick={() => setSelectedTaskId(t.id)}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.background = "#f0fce8";
                                                    e.currentTarget.style.borderColor = GREEN_BORDER;
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.background = "#f9fafb";
                                                    e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)";
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div
                                                        style={{
                                                            fontSize: "11px",
                                                            fontWeight: 600,
                                                            color: "#111827",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                            whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        {t.name}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: "10px",
                                                            color: "#9ca3af",
                                                            marginTop: "1px",
                                                        }}
                                                    >
                                                        {allocated.toFixed(2)}h → {worked.toFixed(2)}h
                                                    </div>
                                                </div>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        gap: "6px",
                                                        alignItems: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            fontWeight: 700,
                                                            color: over ? "#d97706" : "#2563eb",
                                                            background: over ? "#fef3c7" : "#eff6ff",
                                                            padding: "1px 6px",
                                                            borderRadius: "4px",
                                                        }}
                                                    >
                                                        {over ? "+" : ""}
                                                        {dev}%
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "11px",
                                                            fontWeight: 800,
                                                            color: getMEASColor(acc),
                                                            background: getMEASBg(acc),
                                                            padding: "1px 7px",
                                                            borderRadius: "4px",
                                                        }}
                                                    >
                                                        {acc.toFixed(0)}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div
                                    style={{
                                        marginTop: "12px",
                                        padding: "8px 12px",
                                        borderRadius: "8px",
                                        background: getMEASBg(emp.meas),
                                        border: `1px solid ${getMEASColor(emp.meas)}33`,
                                        fontSize: "11px",
                                        color: getMEASColor(emp.meas),
                                        fontWeight: 700,
                                        textAlign: "center",
                                    }}
                                >
                                    {getMEASEmoji(emp.meas)} {getMEASLabel(emp.meas)}
                                </div>
                            </div>
                        ))}

                        {employeeStats.length === 0 && (
                            <div
                                style={{
                                    gridColumn: "1/-1",
                                    textAlign: "center",
                                    padding: "60px",
                                    color: "#9ca3af",
                                    fontSize: "13px",
                                    fontWeight: 600,
                                    background: "#ffffff",
                                    borderRadius: "16px",
                                    border: "1px dashed #e5e7eb",
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
                            borderRadius: "16px",
                            border: "1px solid rgba(0,0,0,0.06)",
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
                                fontSize: "9px",
                                letterSpacing: "1.5px",
                                color: "#9ca3af",
                                fontWeight: 800,
                                borderBottom: "1px solid #f3f4f6",
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
                                            borderBottom: "1px solid #f9fafb",
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
                                                    fontSize: "12px",
                                                    fontWeight: 600,
                                                    color: "#111827",
                                                }}
                                            >
                                                {t.name || "—"}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "10px",
                                                    color: "#9ca3af",
                                                    marginTop: "2px",
                                                }}
                                            >
                                                Click to view comments
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "11px",
                                                color: "#6b7280",
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
                                                fontSize: "11px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            {t.allocatedHours.toFixed(2)}h
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "11px",
                                                fontWeight: 600,
                                                color: "#111827",
                                            }}
                                        >
                                            {t.workedHours.toFixed(2)}h
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "11px",
                                                fontWeight: 700,
                                                color: over ? "#d97706" : "#2563eb",
                                            }}
                                        >
                                            {over ? "+" : ""}
                                            {t.deviation}%
                                        </div>
                                        <div
                                            style={{
                                                textAlign: "right",
                                                fontSize: "13px",
                                                fontWeight: 900,
                                                color: getMEASColor(t.accuracy),
                                            }}
                                        >
                                            {t.accuracy.toFixed(1)}
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "center" }}>
                                            <span
                                                style={{
                                                    padding: "3px 8px",
                                                    borderRadius: "999px",
                                                    fontSize: "9px",
                                                    fontWeight: 700,
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
                                    color: "#9ca3af",
                                    fontSize: "13px",
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
                                borderTop: `1px solid ${GREEN_BORDER}`,
                                display: "flex",
                                gap: "32px",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div
                                    style={{
                                        fontSize: "9px",
                                        color: "#4b7a2e",
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
                                style={{ flex: 1, fontSize: "11px", color: "#4b7a2e", lineHeight: 1.7 }}
                            >
                                Formula:{" "}
                                <span
                                    style={{
                                        fontFamily: "monospace",
                                        fontSize: "10px",
                                        background: "#d1f0bb",
                                        padding: "1px 6px",
                                        borderRadius: "4px",
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
