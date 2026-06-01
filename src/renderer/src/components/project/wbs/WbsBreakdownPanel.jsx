import React, { useState, useEffect } from "react";
import { ClipboardList } from "lucide-react";

const WBS_CATEGORY_META = [
    { key: "modelling", label: "Modeling", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-green-600", isChecking: false },
    { key: "modelling_checking", label: "Modeling Checking", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-gray-400", isChecking: true },
    { key: "detailing", label: "Detailing", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-green-600", isChecking: false },
    { key: "detailing_checking", label: "Detailing Checking", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-gray-400", isChecking: true },
    { key: "erection", label: "Erection", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-green-600", isChecking: false },
    { key: "erection_checking", label: "Erection Checking", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-gray-400", isChecking: true },
    { key: "others", label: "Others", color: "#000000", bg: "#ffffff", border: "#e5e7eb", dot: "bg-gray-400", isChecking: false },
];

const STATUS_COLORS = {
    completed: "bg-green-50 text-green-800 border-green-600/60 font-bold text-sm",
    complete: "bg-green-50 text-green-800 border-green-600/60 font-bold text-sm",
    validate_complete: "bg-green-50 text-green-800 border-green-600/60 font-bold text-sm",
    assigned: "bg-gray-50 text-black border-gray-300 font-bold text-sm",
    in_progress: "bg-gray-50 text-black border-gray-300 font-bold text-sm",
    rework: "bg-gray-50 text-black border-gray-300 font-bold text-sm",
    break: "bg-gray-50 text-black border-gray-300 font-bold text-sm",
    in_review: "bg-gray-50 text-black border-gray-300 font-bold text-sm",
};

// --- HELPERS ---
const getStatusBadge = (status) => STATUS_COLORS[(status || "").toLowerCase()] || "bg-gray-50 text-black border-gray-300 font-bold text-sm";
const fmtSecs = (s) => `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}`;

const getAssigneeName = (task) => {
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
            <header className="pr-5 pl-3 py-3 bg-zinc-100 border-b border-b-gray-200 border-l-4 border-l-green-600 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-2">
                    <h4 className="text-lg font-bold uppercase tracking-wider text-black">WBS Task Breakdown</h4>
                </div>
                <span className="text-sm font-bold text-black uppercase">
                    {Object.values(wbsTasksByBundle).flat().length} Total Tasks
                </span>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* 2. STICKY SIDEBAR */}
                <aside className="w-72 border-r border-gray-200 bg-zinc-100 overflow-y-auto shrink-0 scrollbar-thin">
                    <div className="p-4 sticky top-0 bg-zinc-100 z-10 border-b border-gray-100">
                        <p className="text-sm font-bold uppercase tracking-wider text-black">WBS Bundles</p>
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
                                        isActive ? "bg-white border-green-600 shadow-sm" : "border-transparent hover:bg-white/60 hover:border-gray-200"
                                    }`}
                                >
                                    <p className="text-sm font-bold uppercase leading-tight mb-2 text-black">
                                        {key.replace(/_/g, " ")}
                                    </p>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm font-semibold px-2 py-0.5 border border-black bg-yellow-50 text-black`}>
                                            {tasks.length} tasks
                                        </span>
                                        <div className="flex gap-2 text-sm font-semibold text-black">
                                            <span>W-{fmtSecs(wSecs)}h</span>
                                            <span>A-{fmtSecs(aSecs)}h</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                {/* 3. SCROLLABLE GRID AREA */}
                <main className="flex-1 overflow-y-auto bg-white p-6 scroll-smooth">
                    <div className="sticky top-[-24px] bg-white/95 backdrop-blur-md pb-4 mb-4 z-10 flex items-center border-l-4 border-l-green-600 pl-3 border-b border-b-gray-200">
                        <h3 className="text-lg font-bold uppercase tracking-tight text-black">{selectedBundle.replace(/_/g, " ")}</h3>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {WBS_CATEGORY_META.map((cat) => {
                            const tasks = currentBundleData[cat.key] || [];
                            const totalW = tasks.reduce((s, t) => s + getTaskSeconds(t), 0);
                            const totalA = tasks.reduce((s, t) => s + parseAllocSecs(t.allocationLog?.allocatedHours), 0);

                            return (
                                <section
                                    key={cat.key}
                                    className="flex flex-col border border-gray-200 rounded-2xl overflow-hidden transition-all h-full bg-white"
                                >
                                    {/* Sub-Header */}
                                    <header className="p-3 border-b flex items-center justify-between bg-white/50 border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${cat.dot}`} />
                                            <span className="text-sm font-bold uppercase tracking-widest text-black">
                                                {cat.label}
                                            </span>
                                            {cat.isChecking && (
                                                <span className="text-sm font-semibold px-2 py-0.5 rounded border border-black bg-white text-black uppercase ml-2">Checking</span>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-black">{tasks.length} tasks</p>
                                            <p className="text-sm font-bold text-black">
                                                W {fmtSecs(totalW)}h | A {fmtSecs(totalA)}h
                                            </p>
                                        </div>
                                    </header>

                                    {/* Task Row List */}
                                    <div className="flex-1 max-h-[350px] overflow-y-auto bg-white/40">
                                        {tasks.length === 0 ? (
                                            <div className="py-10 text-center opacity-30 text-sm font-bold uppercase tracking-widest text-black">No Tasks</div>
                                        ) : (
                                            tasks.map((task, i) => {
                                                const userName = getAssigneeName(task);
                                                const initials = getInitials(userName);
                                                const worked = getTaskSeconds(task);
                                                const assigned = task.allocationLog?.allocatedHours || "00:00";

                                                return (
                                                    <div 
                                                        key={task.id || i} 
                                                        className="p-3 flex items-center gap-3 border-b last:border-0 bg-white/60 hover:bg-white transition-colors border-gray-200"
                                                    >
                                                        {/* Circle Initials Avatar */}
                                                        <div 
                                                            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-gray-200 bg-white text-sm font-bold text-black shadow-sm"
                                                        >
                                                            {initials}
                                                        </div>

                                                        {/* Task Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-bold text-black truncate leading-tight uppercase">
                                                                {task.name || task.title || "Untitled Task"}
                                                            </p>
                                                            <p className="text-sm text-black font-semibold truncate mt-0.5">
                                                                👤 {userName}
                                                            </p>
                                                        </div>

                                                        {/* Status & Time */}
                                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                                            <span className={`text-sm px-2 py-0.5 rounded-full border uppercase tracking-tighter shadow-sm ${getStatusBadge(task.status)}`}>
                                                                {(task.status || "N/A").replace(/_/g, " ")}
                                                            </span>
                                                            <div className="flex gap-2 text-sm font-semibold text-black">
                                                                <span>W-{fmtSecs(worked)}h</span>
                                                                <span>A-{assigned}h</span>
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