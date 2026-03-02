import React, { useState, useEffect } from "react";
import { ClipboardList, User } from "lucide-react";

const WBS_CATEGORY_META = [
    { key: "modelling", label: "Modeling", color: "#2563eb", bg: "#eff6ff", border: "#bfdbfe", dot: "bg-blue-500", isChecking: false },
    { key: "modelling_checking", label: "Modeling Checking", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", dot: "bg-violet-500", isChecking: true },
    { key: "detailing", label: "Detailing", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc", dot: "bg-cyan-500", isChecking: false },
    { key: "detailing_checking", label: "Detailing Checking", color: "#c026d3", bg: "#fdf4ff", border: "#f0abfc", dot: "bg-fuchsia-500", isChecking: true },
    { key: "erection", label: "Erection", color: "#d97706", bg: "#fffbeb", border: "#fde68a", dot: "bg-amber-500", isChecking: false },
    { key: "erection_checking", label: "Erection Checking", color: "#ea580c", bg: "#fff7ed", border: "#fed7aa", dot: "bg-orange-500", isChecking: true },
    { key: "others", label: "Others", color: "#6b7280", bg: "#f9fafb", border: "#e5e7eb", dot: "bg-gray-400", isChecking: false },
];

const STATUS_COLORS = {
    completed: "bg-green-100 text-green-700 border-green-200",
    complete: "bg-green-100 text-green-700 border-green-200",
    validate_complete: "bg-green-100 text-green-700 border-green-200",
    assigned: "bg-blue-100 text-blue-700 border-blue-200",
    in_progress: "bg-yellow-100 text-yellow-700 border-yellow-200",
    rework: "bg-orange-100 text-orange-700 border-orange-200",
    break: "bg-red-100 text-red-700 border-red-200",
    in_review: "bg-purple-100 text-purple-700 border-purple-200",
};

// --- HELPERS ---
const getStatusBadge = (status) => STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-100 text-gray-500 border-gray-200";
const fmtSecs = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;

const getAssigneeName = (task) => {
    // Checks multiple common paths for user data
    const u = task.user || task.assignedTo || task.assignee;
    if (!u) return "Unassigned";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return name || u.username || "Unassigned";
};

const getInitials = (name) => {
    if (name === "Unassigned") return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const getTaskSeconds = (t) => (t.workingHourTask || []).reduce((s, w) => s + (Number(w.duration_seconds) || 0), 0);
const parseAllocSecs = (str) => {
    if (!str || typeof str !== "string") return 0;
    const [h, m] = str.split(":").map(Number);
    return (h || 0) * 3600 + (m || 0) * 60;
};

export default function WbsBreakdownPanel({ wbsTasksByBundle }) {
    const bundleKeys = Object.keys(wbsTasksByBundle).sort();
    const [selectedBundle, setSelectedBundle] = useState(bundleKeys[0] || "");

    useEffect(() => {
        if (!selectedBundle && bundleKeys.length > 0) setSelectedBundle(bundleKeys[0]);
    }, [bundleKeys, selectedBundle]);

    if (bundleKeys.length === 0) return null;

    const currentBundleData = wbsTasksByBundle[selectedBundle] || {};

    return (
        <div className="flex flex-col h-[750px] rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm font-sans">
            {/* 1. TOP HEADER */}
            <header className="px-5 py-3 bg-slate-50 border-b border-gray-200 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-black" />
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-700">WBS Task Breakdown</h4>
                </div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">
                    {Object.values(wbsTasksByBundle).flat().length} Total Tasks
                </span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 2. STICKY SIDEBAR */}
                <aside className="w-72 border-r max-h-10/12 border-gray-200 bg-slate-50 overflow-y-auto shrink-0 scrollbar-thin">
                    <div className="p-4 sticky top-0 bg-slate-50 z-10 border-b border-gray-100">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">WBS Bundles</p>
                    </div>
                    <nav className="p-2 space-y-1">
                        {bundleKeys.map((key) => {
                            const tasks = Object.values(wbsTasksByBundle[key] || {}).flat();
                            const wSecs = tasks.reduce((s, t) => s + getTaskSeconds(t), 0);
                            const aSecs = tasks.reduce((s, t) => s + parseAllocSecs(t.allocationLog?.allocatedHours), 0);
                            const isActive = selectedBundle === key;

                            return (
                                <button
                                    key={key}
                                    onClick={() => setSelectedBundle(key)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                                        isActive ? "bg-white border-[#6bbd45] shadow-sm" : "border-transparent hover:bg-white/60 hover:border-gray-200"
                                    }`}
                                >
                                    <p className={`text-[11px] font-black uppercase leading-tight mb-2 ${isActive ? "text-black" : "text-slate-600"}`}>
                                        {key.replace(/_/g, " ")}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-[#6bbd45]/10 text-black" : "bg-slate-200 text-slate-600"}`}>
                                            {tasks.length} tasks
                                        </span>
                                        <div className="flex gap-2 text-[12px] font-bold text-slate-500">
                                            <span><span className="text-slate-400">W-</span>{fmtSecs(wSecs)}h</span>
                                            <span><span className="text-slate-400">A-</span>{fmtSecs(aSecs)}h</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* 3. SCROLLABLE GRID AREA */}
                <main className="flex-1 overflow-y-auto bg-white p-6 scroll-smooth">
                    <div className="sticky top-[-24px] bg-white/95 backdrop-blur-md pb-4 mb-4 z-10 flex items-center gap-2 border-b border-gray-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#6bbd45]" />
                        <h3 className="text-sm font-black uppercase tracking-tight text-slate-800">{selectedBundle.replace(/_/g, " ")}</h3>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {WBS_CATEGORY_META.map((cat) => {
                            const tasks = currentBundleData[cat.key] || [];
                            const totalW = tasks.reduce((s, t) => s + getTaskSeconds(t), 0);
                            const totalA = tasks.reduce((s, t) => s + parseAllocSecs(t.allocationLog?.allocatedHours), 0);

                            return (
                                <section
                                    key={cat.key}
                                    className="flex flex-col border rounded-2xl overflow-hidden transition-all h-full"
                                    style={{ backgroundColor: cat.bg, borderColor: cat.border }}
                                >
                                    {/* Sub-Header */}
                                    <header className="p-3 border-b flex items-center justify-between bg-white/50" style={{ borderColor: cat.border }}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${cat.dot}`} />
                                            <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: cat.color }}>
                                                {cat.label}
                                            </span>
                                            {cat.isChecking && (
                                                <span className="text-xs font-semibold px-1.5 py-0.5 rounded text-inherit uppercase ml-1">Checking</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black" style={{ color: cat.color }}>{tasks.length} tasks</p>
                                            <p className="text-xs font-bold opacity-70" style={{ color: cat.color }}>
                                                W {fmtSecs(totalW)}h | A {fmtSecs(totalA)}h
                                            </p>
                                        </div>
                                    </header>

                                    {/* Task Row List */}
                                    <div className="flex-1 max-h-[350px] overflow-y-auto bg-white/40">
                                        {tasks.length === 0 ? (
                                            <div className="py-10 text-center opacity-30 text-[10px] font-bold uppercase tracking-widest">No Tasks</div>
                                        ) : (
                                            tasks.map((task, i) => {
                                                const userName = getAssigneeName(task);
                                                const initials = getInitials(userName);
                                                const worked = getTaskSeconds(task);
                                                const assigned = task.allocationLog?.allocatedHours || "00:00";

                                                return (
                                                    <div 
                                                        key={task.id || i} 
                                                        className="p-3 flex items-center gap-3 border-b last:border-0 bg-white/60 hover:bg-white transition-colors"
                                                        style={{ borderColor: cat.border }}
                                                    >
                                                        {/* Circle Initials Avatar */}
                                                        <div 
                                                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-[10px] font-black shadow-sm"
                                                            style={{ 
                                                                backgroundColor: `${cat.color}15`, 
                                                                borderColor: cat.border, 
                                                                color: cat.color 
                                                            }}
                                                        >
                                                            {initials}
                                                        </div>

                                                        {/* Task Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-slate-800 truncate leading-tight uppercase">
                                                                {task.name || task.title || "Untitled Task"}
                                                            </p>
                                                            <p className="text-sm text-slate-500 font-bold truncate mt-0.5">
                                                                👤 {userName}
                                                            </p>
                                                        </div>

                                                        {/* Status & Time */}
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full border uppercase tracking-tighter shadow-sm ${getStatusBadge(task.status)}`}>
                                                                {(task.status || "N/A").replace(/_/g, " ")}
                                                            </span>
                                                            <div className="flex gap-2 text-[13px] font-semibold text-slate-700">
                                                                <span><span className="text-slate-400">W-</span>{fmtSecs(worked)}h</span>
                                                                <span><span className="text-slate-400">A-</span>{assigned}h</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </main>
            </div>
        </div>
    );
}