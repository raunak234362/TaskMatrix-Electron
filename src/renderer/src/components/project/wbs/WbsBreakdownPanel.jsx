import { useState, useEffect } from "react";
import { ClipboardList, Clock } from "lucide-react";

const WBS_CATEGORY_META = [
    {
        key: "modelling",
        label: "Modelling",
        color: "#2563eb",
        bg: "#eff6ff",
        border: "#bfdbfe",
        dot: "bg-blue-500",
        badge: "bg-blue-100 text-blue-700 border-blue-200",
        isChecking: false,
    },
    {
        key: "modelling_checking",
        label: "Modelling Checking",
        color: "#7c3aed",
        bg: "#f5f3ff",
        border: "#ddd6fe",
        dot: "bg-violet-500",
        badge: "bg-violet-100 text-violet-700 border-violet-200",
        isChecking: true,
    },
    {
        key: "detailing",
        label: "Detailing",
        color: "#0891b2",
        bg: "#ecfeff",
        border: "#a5f3fc",
        dot: "bg-cyan-500",
        badge: "bg-cyan-100 text-cyan-700 border-cyan-200",
        isChecking: false,
    },
    {
        key: "detailing_checking",
        label: "Detailing Checking",
        color: "#c026d3",
        bg: "#fdf4ff",
        border: "#f0abfc",
        dot: "bg-fuchsia-500",
        badge: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
        isChecking: true,
    },
    {
        key: "erection",
        label: "Erection",
        color: "#d97706",
        bg: "#fffbeb",
        border: "#fde68a",
        dot: "bg-amber-500",
        badge: "bg-amber-100 text-amber-700 border-amber-200",
        isChecking: false,
    },
    {
        key: "erection_checking",
        label: "Erection Checking",
        color: "#ea580c",
        bg: "#fff7ed",
        border: "#fed7aa",
        dot: "bg-orange-500",
        badge: "bg-orange-100 text-orange-700 border-orange-200",
        isChecking: true,
    },
    {
        key: "others",
        label: "Others",
        color: "#6b7280",
        bg: "#f9fafb",
        border: "#e5e7eb",
        dot: "bg-gray-400",
        badge: "bg-gray-100 text-gray-600 border-gray-200",
        isChecking: false,
    },
];

const STATUS_COLORS = {
    completed: "bg-green-100 text-green-700 border-green-200",
    complete: "bg-green-100 text-green-700 border-green-200",
    validate_complete: "bg-green-100 text-green-700 border-green-200",
    complete_other: "bg-green-100 text-green-700 border-green-200",
    assigned: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    rework: "bg-orange-100 text-orange-700 border-orange-200",
    break: "bg-red-100 text-red-700 border-red-200",
    in_review: "bg-purple-100 text-purple-700 border-purple-200",
};

function getStatusBadge(status) {
    return STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-100 text-gray-500 border-gray-200";
}

function getAssignee(task) {
    const src = task.user || task.assignedTo || task.assignee || null;
    if (!src) return "Unassigned";
    return `${src.firstName || ""} ${src.lastName || ""}`.trim() || "Unassigned";
}

function getTaskSeconds(task) {
    return (task.workingHourTask || []).reduce((s, w) => s + (Number(w.duration_seconds) || 0), 0);
}

function fmtSecs(totalSecs) {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseAllocSecs(timeStr) {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const [h, m] = timeStr.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return 0;
    return h * 3600 + m * 60;
}

export default function WbsBreakdownPanel({ wbsTasksByBundle }) {
    const bundleKeys = Object.keys(wbsTasksByBundle).sort();
    const [selectedBundle, setSelectedBundle] = useState(bundleKeys[0] || "");

    useEffect(() => {
        if (!selectedBundle && bundleKeys.length > 0) setSelectedBundle(bundleKeys[0]);
    }, [bundleKeys, selectedBundle]);

    if (bundleKeys.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 rounded-2xl border border-dashed border-gray-200 bg-gray-50">
                <ClipboardList className="w-10 h-10 text-gray-300" />
                <p className="text-xs font-black uppercase tracking-widest">No WBS task data found for this project</p>
            </div>
        );
    }

    const bundleData = wbsTasksByBundle[selectedBundle] || {};

    // Stats per bundle
    const bundleTotals = bundleKeys.map((key) => {
        const allTasks = Object.values(wbsTasksByBundle[key] || {}).flat();
        const seconds = allTasks.reduce((s, t) => s + getTaskSeconds(t), 0);
        const allocSecs = allTasks.reduce((s, t) => s + parseAllocSecs(t.allocationLog?.allocatedHours), 0);
        const count = allTasks.length;
        return { key, seconds, allocSecs, count };
    });

    return (
        <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm bg-white animate-in fade-in duration-300">
            {/* Panel Header */}
            <div className="px-5 py-3 bg-slate-50 border-b border-gray-200 flex items-center gap-3">
                <ClipboardList className="w-4 h-4 text-[#6bbd45]" />
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-700 flex-1">
                    WBS Task Breakdown
                </h4>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
                    {Object.values(wbsTasksByBundle).flatMap(Object.values).flat().length} total tasks
                </span>
            </div>

            <div className="flex min-h-[500px]">
                {/* Left Sidebar — Bundle list */}
                <div className="w-64 shrink-0 bg-slate-50 border-r border-gray-200 overflow-y-auto">
                    <div className="px-4 pt-4 pb-2">
                        <p className="text-sm font-black uppercase tracking-widest text-slate-800">WBS Bundles</p>
                    </div>
                    <ul className="flex flex-col gap-0.5 p-2">
                        {bundleTotals.map(({ key, seconds, allocSecs, count }) => (
                            <li key={key}>
                                <button
                                    onClick={() => setSelectedBundle(key)}
                                    className={`w-full flex flex-col px-3 py-2.5 rounded-xl text-left transition-all ${selectedBundle === key
                                        ? "bg-white border border-[#6bbd45]/50 shadow-sm"
                                        : "hover:bg-white text-slate-600 hover:shadow-sm"
                                        }`}
                                >
                                    <span className={`text-sm uppercase tracking-tight ${selectedBundle === key ? "text-black" : "text-slate-600"
                                        }`}>
                                        {key}
                                    </span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-sm font-bold px-1.5 py-0.5 rounded-full ${selectedBundle === key
                                            ? "bg-[#6bbd45]/20 text-[#3a8a1a]"
                                            : "bg-slate-200 text-slate-500"
                                            }`}>
                                            {count} task{count !== 1 ? "s" : ""}
                                        </span>
                                        <div className="flex items-center gap-1.5 ml-auto">
                                            <span className="text-sm text-slate-500 font-bold"><span className="text-sm text-slate-400 pr-0.5">W-</span>{fmtSecs(seconds)}</span>
                                            <span className="text-sm text-slate-500 font-bold"><span className="text-sm text-slate-400 pr-0.5">A-</span>{fmtSecs(allocSecs)}</span>
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Right Panel — WBS Type categories */}
                <div className=" overflow-y-auto p-5 bg-white">
                    <h3 className="text-sm font-black uppercase tracking-tight text-black mb-5 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#6bbd45] inline-block" />
                        {selectedBundle}
                    </h3>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        {WBS_CATEGORY_META.map((cat) => {
                            const tasks = bundleData[cat.key] || [];
                            const totalSecs = tasks.reduce((s, t) => s + getTaskSeconds(t), 0);
                            const totalAllocSecs = tasks.reduce((s, t) => s + parseAllocSecs(t.allocationLog?.allocatedHours), 0);

                            return (
                                <div
                                    key={cat.key}
                                    style={{
                                        border: `1px solid ${cat.border}`,
                                        borderRadius: "16px",
                                        overflow: "hidden",
                                        background: cat.bg,
                                    }}
                                >
                                    {/* Category Header */}
                                    <div
                                        style={{
                                            padding: "10px 14px",
                                            borderBottom: `1px solid ${cat.border}`,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: "8px",
                                                height: "8px",
                                                borderRadius: "50%",
                                                background: cat.color,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <span
                                            style={{
                                                fontSize: "10px",
                                                fontWeight: 800,
                                                textTransform: "uppercase",
                                                letterSpacing: "1.5px",
                                                color: cat.color,
                                                flex: 1,
                                            }}
                                        >
                                            {cat.label}
                                            {cat.isChecking && (
                                                <span
                                                    style={{
                                                        marginLeft: "6px",
                                                        fontSize: "8px",
                                                        padding: "1px 5px",
                                                        borderRadius: "999px",
                                                        background: cat.color,
                                                        color: "#fff",
                                                        fontWeight: 800,
                                                    }}
                                                >
                                                    CHECKING
                                                </span>
                                            )}
                                        </span>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
                                            <span className="text-sm" style={{ fontWeight: 800, color: cat.color }}>
                                                {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
                                            </span>
                                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                                <span className="text-sm" style={{ fontWeight: 800, color: cat.color, opacity: 0.8 }}><span style={{ opacity: 0.6 }}>W</span> {fmtSecs(totalSecs)}</span>
                                                <span className="text-sm" style={{ fontWeight: 800, color: cat.color, opacity: 0.8 }}><span style={{ opacity: 0.6 }}>A</span> {fmtSecs(totalAllocSecs)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Task rows */}
                                    <div style={{ maxHeight: "260px", overflowY: "auto" }}>
                                        {tasks.length === 0 ? (
                                            <div className="py-4 text-center">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-black/30">
                                                    No {cat.label} tasks
                                                </span>
                                            </div>
                                        ) : (
                                            tasks.map((task, idx) => {
                                                const assignee = getAssignee(task);
                                                const initials = assignee
                                                    .split(" ")
                                                    .filter(Boolean)
                                                    .map((n) => n[0])
                                                    .slice(0, 2)
                                                    .join("")
                                                    .toUpperCase();
                                                const secs = getTaskSeconds(task);
                                                const sc = getStatusBadge(task.status);

                                                return (
                                                    <div
                                                        key={task.id || idx}
                                                        style={{
                                                            padding: "8px 14px",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "10px",
                                                            borderBottom: idx < tasks.length - 1 ? `1px solid ${cat.border}` : "none",
                                                            background: "rgba(255,255,255,0.7)",
                                                            transition: "background 0.12s",
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fff")}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.7)")}
                                                    >
                                                        {/* Avatar */}
                                                        <div
                                                            style={{
                                                                width: "26px",
                                                                height: "26px",
                                                                borderRadius: "50%",
                                                                background: `linear-gradient(135deg, ${cat.color}33, ${cat.color}66)`,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "9px",
                                                                fontWeight: 800,
                                                                color: cat.color,
                                                                flexShrink: 0,
                                                                border: `1px solid ${cat.border}`,
                                                            }}
                                                        >
                                                            {initials || "?"}
                                                        </div>

                                                        {/* Name + task name */}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <p className="text-sm text-slate-800"
                                                                style={{
                                                                    fontWeight: 700,
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                    lineHeight: 1.3,
                                                                }}
                                                            >
                                                                {task.name || task.title || `Task #${idx + 1}`}
                                                            </p>
                                                            <p className="text-sm text-slate-600"
                                                                style={{
                                                                    marginTop: "1px",
                                                                    overflow: "hidden",
                                                                    textOverflow: "ellipsis",
                                                                    whiteSpace: "nowrap",
                                                                }}
                                                            >
                                                                👤 {assignee}
                                                            </p>
                                                        </div>

                                                        {/* Status */}
                                                        <span
                                                            className={`text-sm font-bold px-1.5 py-0.5 rounded-full border uppercase tracking-wide shrink-0 ${sc}`}
                                                        >
                                                            {(task.status || "—").replace(/_/g, " ")}
                                                        </span>

                                                        {/* Logged & Allocated time */}
                                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <span className="text-xs font-bold text-slate-600 uppercase" >Work</span>
                                                                <Clock className="w-2.5 h-2.5 text-gray-400" />
                                                                <span
                                                                    className="text-sm font-bold text-slate-800"
                                                                    style={{
                                                                        minWidth: "38px",
                                                                        textAlign: "right",
                                                                    }}
                                                                >
                                                                    {secs > 0 ? fmtSecs(secs) : "00:00"}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                <span className="text-xs font-bold text-slate-600 uppercase" >Alloc</span>
                                                                <span
                                                                    className="text-sm font-bold text-slate-800"
                                                                    style={{
                                                                        minWidth: "38px",
                                                                        textAlign: "right",
                                                                        paddingRight: "1px" // slight align adjustment with the clock icon above
                                                                    }}
                                                                >
                                                                    {task.allocationLog?.allocatedHours || "00:00"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Empty state for this bundle */}
                    {Object.values(bundleData).flat().length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
                            <ClipboardList className="w-8 h-8 text-gray-300" />
                            <p className="text-xs font-black uppercase tracking-widest">No tasks for this bundle</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
