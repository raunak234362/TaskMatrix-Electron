import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { Loader2, X, Clock, User, FileText, CheckCircle2, AlertCircle, Timer, ChevronDown, ChevronRight, Search, BarChart2, Activity, Info } from "lucide-react";
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
                            {(task.description || (task.taskcomment && task.taskcomment.length > 0)) ? (
                                <div
                                    style={{
                                        background: "#f9fafb",
                                        border: "1px solid #000000",
                                        borderRadius: "0px",
                                        padding: "14px 16px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "12px",
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 800,
                                            color: GREEN,
                                            letterSpacing: "1.5px",
                                            textTransform: "uppercase",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        <FileText size={12} /> Description / Comments
                                    </div>
                                    {task.description && (
                                        <div
                                            style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }}
                                            dangerouslySetInnerHTML={{ __html: task.description }}
                                        />
                                    )}
                                    {task.taskcomment && task.taskcomment.length > 0 && (
                                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: task.description ? "8px" : "0", borderTop: task.description ? "1px dashed #000" : "none", paddingTop: task.description ? "8px" : "0" }}>
                                            {task.taskcomment.map(comment => (
                                                <div key={comment.id} style={{ fontSize: "14px", color: "#000000", lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: comment.data }} />
                                            ))}
                                        </div>
                                    )}
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

                            {/* Due date / Created / Created By */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                                    gap: "10px",
                                }}
                            >
                                {task.due_date && (
                                    <div style={{ background: "#f9fafb", border: "1px solid #000000", borderRadius: "0px", padding: "10px 12px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>Due Date</div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{formatDate(task.due_date)}</div>
                                    </div>
                                )}
                                {(task.created_on || task.createdAt) && (
                                    <div style={{ background: "#f9fafb", border: "1px solid #000000", borderRadius: "0px", padding: "10px 12px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>Created At</div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827" }}>{formatDate(task.created_on || task.createdAt)}</div>
                                    </div>
                                )}
                                {task.credatedByUser && (
                                    <div style={{ background: "#f9fafb", border: "1px solid #000000", borderRadius: "0px", padding: "10px 12px" }}>
                                        <div style={{ fontSize: "12px", fontWeight: 700, color: "#000000", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>Created By</div>
                                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", textTransform: "uppercase" }}>
                                            {task.credatedByUser.firstName} {task.credatedByUser.lastName}
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


function calculateEPS(taskList) {
    if (!taskList || taskList.length === 0) return { eps: 0, details: null };

    let completedTasks = 0;
    let overrunCount = 0;
    let underutilizedCount = 0;
    let reworkTasks = 0;
    let flagsCount = 0;
    let totalIdlePercent = 0;
    let validSessionTasks = 0;

    const completedStatuses = ["COMPLETED", "VALIDATE_COMPLETE", "COMPLETE_OTHER"];

    taskList.forEach(t => {
        const isCompleted = completedStatuses.includes(String(t.status).toUpperCase());
        if (isCompleted) completedTasks++;

        const allocated = t.allocationLog?.allocatedHours
            ? parseTimeToDecimal(t.allocationLog.allocatedHours)
            : parseFloat(t.hours) || 0;
        const worked = calculateWorkedSeconds(t) / 3600;

        if (isCompleted && worked > allocated && allocated > 0) overrunCount++;
        if (isCompleted && worked < (allocated * 0.6) && allocated > 0) underutilizedCount++;

        // Rework frequency 
        const hasRework = String(t.status).toUpperCase() === "REWORK" || (t.workingHourTask || []).some(w => String(w.type).toUpperCase() === "REWORK");
        if (hasRework) reworkTasks++;

        // Time discipline flags
        if (t.autoCloseActionTaken) flagsCount += 5;
        if (t.workingHourTask && t.workingHourTask.length > 5) flagsCount += 1;

        // Session quality
        if (t.workingHourTask && t.workingHourTask.length > 0) {
            const sessions = [...t.workingHourTask].sort((a, b) => new Date(a.started_at) - new Date(b.started_at));
            const firstStart = new Date(sessions[0].started_at).getTime();
            const lastEnd = sessions[sessions.length - 1].ended_at ? new Date(sessions[sessions.length - 1].ended_at).getTime() : new Date().getTime();
            const wallTime = (lastEnd - firstStart) / 1000;
            const activeTime = sessions.reduce((s, wh) => s + (Number(wh.duration_seconds) || 0), 0);
            if (wallTime > 0 && activeTime > 0) {
                const idle = Math.max(0, wallTime - activeTime);
                const idlePct = idle / wallTime;
                totalIdlePercent += idlePct;
                validSessionTasks++;
            }
        }
    });

    const completionScore = taskList.length > 0 ? (completedTasks / taskList.length) * 100 : 0;
    const overrunScore = completedTasks > 0 ? Math.max(0, 100 - ((overrunCount / completedTasks) * 100)) : 100;
    const underutilizedScore = completedTasks > 0 ? Math.max(0, 100 - ((underutilizedCount / completedTasks) * 100)) : 100;
    const reworkScore = taskList.length > 0 ? Math.max(0, 100 - ((reworkTasks / taskList.length) * 100)) : 100;
    const disciplineScore = Math.max(0, 100 - flagsCount); 
    const avgIdlePercentage = validSessionTasks > 0 ? totalIdlePercent / validSessionTasks : 0;
    const sessionScore = Math.max(0, 100 - (avgIdlePercentage * 100));

    const eps = (
        completionScore * 0.25 +
        overrunScore * 0.20 +
        underutilizedScore * 0.10 +
        reworkScore * 0.20 +
        disciplineScore * 0.15 +
        sessionScore * 0.10
    );

    return {
        eps,
        details: {
            completionScore,
            overrunScore,
            underutilizedScore,
            reworkScore,
            disciplineScore,
            sessionScore
        }
    };
}

function EPSDetailPanel({ empName, epsData, onClose }) {
    if (!epsData) return null;
    const { eps, details } = epsData;
    
    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end" }} onClick={onClose}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", backdropFilter: "blur(2px)" }} />
            <div
                style={{
                    position: "relative",
                    width: "500px",
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
                <div style={{ background: "#f0fdf4", borderBottom: "1px solid #bbf7d0", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "#16a34a", padding: "8px", display: "flex" }}>
                            <Activity size={16} color="#fff" />
                        </div>
                        <div>
                            <div style={{ fontSize: "14px", color: "#16a34a", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "2px" }}>
                                Performance Overview
                            </div>
                            <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827", textTransform: "uppercase" }}>
                                {empName}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "#fee2e2", border: "1px solid #dc2626", padding: "6px", cursor: "pointer", display: "flex", borderRadius: "0px" }}>
                        <X size={16} color="#dc2626" />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                    <div style={{ background: "#f9fafb", border: "1px solid #000", padding: "20px", textAlign: "center" }}>
                        <div style={{ fontSize: "12px", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "8px" }}>
                            Overall EPS Score
                        </div>
                        <div style={{ fontSize: "48px", fontWeight: 900, color: "#111827", lineHeight: 1 }}>
                            {eps.toFixed(1)}<span style={{ fontSize: "24px", color: "#9ca3af" }}>/100</span>
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 800, color: "#111827", textTransform: "uppercase", borderBottom: "2px solid #000", paddingBottom: "8px", marginBottom: "4px" }}>
                            Score Breakdown (6 Pillars)
                        </div>
                        
                        {[
                            { label: "Task Completion Rate", weight: "25%", score: details.completionScore, color: "#3b82f6" },
                            { label: "Overrun Behavior", weight: "20%", score: details.overrunScore, color: "#ef4444" },
                            { label: "Underutilization Behavior", weight: "10%", score: details.underutilizedScore, color: "#f59e0b" },
                            { label: "Rework Frequency", weight: "20%", score: details.reworkScore, color: "#8b5cf6" },
                            { label: "Time Discipline", weight: "15%", score: details.disciplineScore, color: "#14b8a6" },
                            { label: "Session Quality", weight: "10%", score: details.sessionScore, color: "#ec4899" }
                        ].map((pillar, idx) => (
                            <div key={idx} style={{ background: "#fff", border: "1px solid #e5e7eb", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                    <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", textTransform: "uppercase" }}>
                                        {pillar.label} <span style={{ color: "#9ca3af", fontSize: "11px" }}>({pillar.weight})</span>
                                    </div>
                                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#111827" }}>
                                        {pillar.score.toFixed(1)}
                                    </div>
                                </div>
                                <div style={{ width: "100%", height: "6px", background: "#f3f4f6", overflow: "hidden", borderRadius: "0px" }}>
                                    <div style={{ width: `${Math.min(100, Math.max(0, pillar.score))}%`, height: "100%", background: pillar.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ─── EPS Info Modal ─── */
function EPSInfoModal({ onClose }) {
    return createPortal(
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", justifyContent: "flex-end", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
            <div style={{ width: "800px", maxWidth: "90vw", background: "#fff", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                <div style={{ background: "#eff6ff", borderBottom: "1px solid #bfdbfe", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ background: "#3b82f6", padding: "8px", display: "flex" }}>
                            <Info size={16} color="#fff" />
                        </div>
                        <div style={{ fontSize: "16px", fontWeight: 800, color: "#111827", textTransform: "uppercase" }}>
                            How we calculate EPS & TES
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: "#fee2e2", border: "1px solid #dc2626", padding: "6px", cursor: "pointer", display: "flex" }}>
                        <X size={16} color="#dc2626" />
                    </button>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "30px", fontSize: "14px", lineHeight: "1.6", color: "#374151" }}>
                    <h3 className="text-xl font-bold mb-4 text-black uppercase">EMPLOYEE PERFORMANCE SCORE (EPS) — Complete Overview</h3>
                    <p className="mb-4">EPS ensures employees are evaluated only based on transparent, system-tracked data, NOT: <br/> ✘ Fake efficiency ✘ Manual edits ✘ Incorrect allocations ✘ Manager favoritism ✘ Subjective reviews</p>
                    <p className="mb-4 font-bold text-black">EPS = Weighted score derived from 6 pillars.</p>
                    
                    <table className="w-full text-left border-collapse border border-gray-300 mb-8">
                        <thead>
                            <tr className="bg-gray-100 text-black">
                                <th className="border border-gray-300 p-2 uppercase text-xs font-bold">Pillar</th>
                                <th className="border border-gray-300 p-2 uppercase text-xs font-bold">Meaning</th>
                                <th className="border border-gray-300 p-2 uppercase text-xs font-bold">Weight</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td className="border border-gray-300 p-2">1. Task Completion Rate</td><td className="border border-gray-300 p-2">Completed vs assigned tasks</td><td className="border border-gray-300 p-2 font-bold">25%</td></tr>
                            <tr><td className="border border-gray-300 p-2">2. Overrun Behavior</td><td className="border border-gray-300 p-2">Exceeding allocated hours</td><td className="border border-gray-300 p-2 font-bold">20%</td></tr>
                            <tr><td className="border border-gray-300 p-2">3. Underutilization Behavior</td><td className="border border-gray-300 p-2">Finishing too fast (&lt;60% of time)</td><td className="border border-gray-300 p-2 font-bold">10%</td></tr>
                            <tr><td className="border border-gray-300 p-2">4. Rework Frequency</td><td className="border border-gray-300 p-2">Number of tasks needing rework</td><td className="border border-gray-300 p-2 font-bold">20%</td></tr>
                            <tr><td className="border border-gray-300 p-2">5. Time Discipline</td><td className="border border-gray-300 p-2">Forgot stop, auto-closings, breaks</td><td className="border border-gray-300 p-2 font-bold">15%</td></tr>
                            <tr><td className="border border-gray-300 p-2">6. Session Quality</td><td className="border border-gray-300 p-2">Idle vs active time</td><td className="border border-gray-300 p-2 font-bold">10%</td></tr>
                        </tbody>
                    </table>
                    
                    <h4 className="text-lg font-bold mb-3 text-black uppercase">⭐ Final EPS Score Formula</h4>
                    <pre className="bg-slate-100 border border-slate-300 p-4 rounded-none text-sm text-slate-800 font-mono mb-8 whitespace-pre-wrap">
EPS =
  completionScore * 0.25 +
  overrunScore * 0.20 +
  underutilizedScore * 0.10 +
  reworkScore * 0.20 +
  disciplineScore * 0.15 +
  sessionScore * 0.10
                    </pre>

                    <h4 className="text-lg font-bold mb-3 text-black uppercase">⭐ EPS Interpretation</h4>
                    <table className="w-full text-left border-collapse border border-gray-300 mb-8">
                        <thead>
                            <tr className="bg-gray-100 text-black"><th className="border border-gray-300 p-2 uppercase text-xs font-bold">Score</th><th className="border border-gray-300 p-2 uppercase text-xs font-bold">Meaning</th></tr>
                        </thead>
                        <tbody>
                            <tr><td className="border border-gray-300 p-2 font-bold">90–100</td><td className="border border-gray-300 p-2 text-green-600 font-bold uppercase">Outstanding performer</td></tr>
                            <tr><td className="border border-gray-300 p-2 font-bold">75–89</td><td className="border border-gray-300 p-2 text-blue-600 font-bold uppercase">Strong and reliable</td></tr>
                            <tr><td className="border border-gray-300 p-2 font-bold">60–74</td><td className="border border-gray-300 p-2 text-yellow-600 font-bold uppercase">Average — needs guidance</td></tr>
                            <tr><td className="border border-gray-300 p-2 font-bold">40–59</td><td className="border border-gray-300 p-2 text-orange-600 font-bold uppercase">Needs improvement</td></tr>
                            <tr><td className="border border-gray-300 p-2 font-bold">&lt; 40</td><td className="border border-gray-300 p-2 text-red-600 font-bold uppercase">Serious performance issue</td></tr>
                        </tbody>
                    </table>

                    <hr className="my-8 border-gray-300" />
                    
                    <h3 className="text-xl font-bold mb-4 text-black uppercase">Team Efficiency Score (TES)</h3>
                    <p className="mb-4">TES is a monthly team-level score (0..100) that combines employee execution quality and delivery outcomes.</p>
                    <p className="mb-4 text-black"><strong>TES components:</strong><br/>
                    • <b>avgEps</b>: average employee EPS of team members for the month.<br/>
                    • <b>measScore</b>: average MEAS for the team manager across projects mapped to that team.<br/>
                    • <b>onTimeCompletion</b>: percentage of completed tasks finished on/before due date.<br/>
                    • <b>throughput</b>: completed-in-month tasks / assigned-in-month tasks.<br/>
                    • <b>reworkRate</b>: percentage of completed tasks with rework segments.</p>

                    <h4 className="text-lg font-bold mb-3 text-black uppercase">TES Formulas</h4>
                    <pre className="bg-slate-100 border border-slate-300 p-4 rounded-none text-sm text-slate-800 font-mono whitespace-pre-wrap">
When MEAS exists for the team context:
TES = avgEps * 0.35 + measScore * 0.20 + onTimeCompletion * 0.20 + throughput * 0.15 + reworkScore * 0.10

When MEAS is unavailable:
TES = avgEps * 0.40 + onTimeCompletion * 0.25 + throughput * 0.20 + reworkScore * 0.15
                    </pre>
                </div>
            </div>
        </div>,
        document.body
    );
}

/* ─── Main Component ─── */
export default function MeasDashboard({ projectId, tasks = [], view, setView }) {
    const userRole = useSelector((state) => state.auth?.user?.role || "");
    const canViewEPS = ["admin", "deputy_manager", "human_resource", "operation_executive"].includes(String(userRole).toLowerCase());
    
    const [searchQuery, setSearchQuery] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [taskSortOrder, setTaskSortOrder] = useState("newest");
    const [selectedEPSEmp, setSelectedEPSEmp] = useState(null);
    const [showEPSInfo, setShowEPSInfo] = useState(false);

    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [expandedEmployees, setExpandedEmployees] = useState({});

    const toggleEmployee = (empName) => {
        setExpandedEmployees((prev) => ({
            ...prev,
            [empName]: !prev[empName],
        }));
    };

    const projectTasks = useMemo(() => {
        let pt = tasks.filter((t) => t.project_id === projectId);
        if (startDate) {
            pt = pt.filter(t => new Date(t.created_on) >= new Date(startDate));
        }
        if (endDate) {
            pt = pt.filter(t => new Date(t.created_on) <= new Date(endDate + 'T23:59:59.999Z'));
        }
        return pt;
    }, [tasks, projectId, startDate, endDate]);

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
                const epsData = calculateEPS(empTasks);
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
                return { name: emp, tasks: empTasks, meas, epsData, totalAllocated, totalWorked, overrun };
            })
            .sort((a, b) => b.meas - a.meas);
    }, [employees, projectTasks]);

    const filteredEmployeeStats = useMemo(() => {
        if (!searchQuery) return employeeStats;
        return employeeStats.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [employeeStats, searchQuery]);

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


            {selectedEPSEmp && (
                <EPSDetailPanel 
                    empName={selectedEPSEmp.name}
                    epsData={selectedEPSEmp.epsData}
                    onClose={() => setSelectedEPSEmp(null)}
                />
            )}
            {showEPSInfo && <EPSInfoModal onClose={() => setShowEPSInfo(false)} />}
            <div style={{ padding: "28px 36px", background: "#f9fafb" }}>
                {/* BY EMPLOYEE */}
                {view === "by employee" && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                            <div className="relative flex-1 w-full">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-black rounded-none leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm transition duration-150 ease-in-out uppercase tracking-wide"
                                    placeholder="Search employees..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                {canViewEPS && (
                                    <button 
                                        onClick={() => setShowEPSInfo(true)}
                                        className="border border-blue-600 text-blue-700 bg-blue-50 px-3 py-2 flex items-center gap-2 text-sm uppercase font-bold hover:bg-blue-100 transition-colors"
                                    >
                                        <Info size={16} /> How is this calculated?
                                    </button>
                                )}
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border border-black px-3 py-2 text-sm uppercase bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                />
                                <span className="font-bold text-gray-500">to</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border border-black px-3 py-2 text-sm uppercase bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                />
                                <select 
                                    value={taskSortOrder} 
                                    onChange={(e) => setTaskSortOrder(e.target.value)}
                                    className="border border-black px-3 py-2 text-sm uppercase bg-white focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:ml-2 mt-2 sm:mt-0"
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                        {filteredEmployeeStats.map((emp) => {
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
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-base font-semibold text-black uppercase tracking-wider">
                                                    {emp.name}
                                                </h4>
                                                {canViewEPS && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setSelectedEPSEmp(emp); }}
                                                        className="flex items-center gap-1 text-[10px] px-2 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 uppercase font-bold tracking-wider rounded-none transition-colors"
                                                    >
                                                        <BarChart2 size={12} /> View EPS
                                                    </button>
                                                )}
                                            </div>

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
                                                    {[...emp.tasks].sort((a, b) => {
                                                        const dateA = new Date(a.created_on || 0).getTime();
                                                        const dateB = new Date(b.created_on || 0).getTime();
                                                        return taskSortOrder === "newest" ? dateB - dateA : dateA - dateB;
                                                    }).map((t) => {
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
                                                                className="flex flex-col border-b border-black/10 hover:bg-gray-50/50 transition-colors cursor-pointer"
                                                                onClick={() => setSelectedTaskId(t.id)}
                                                            >
                                                              <div className="grid grid-cols-7 gap-4 p-4 items-center text-sm font-normal text-black">
                                                                <div className="col-span-2">
                                                                    <p className="font-normal text-black truncate">{t.name || "—"}</p>
                                                                    <p className="text-xs text-black/60 uppercase mt-0.5">
                                                                        {t.wbsType || "Task"} {t.created_on ? ` • ${new Date(t.created_on).toLocaleDateString()}` : ""}
                                                                    </p>
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
