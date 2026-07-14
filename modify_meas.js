const fs = require('fs');
const path = './src/renderer/src/components/project/MeasDashboard.jsx';

let content = fs.readFileSync(path, 'utf8');

// 1. Imports
content = content.replace(
    'import { createPortal } from "react-dom";',
    'import { createPortal } from "react-dom";\nimport { useSelector } from "react-redux";'
);
content = content.replace(
    'import { Loader2, X, Clock, User, FileText, CheckCircle2, AlertCircle, Timer, ChevronDown, ChevronRight } from "lucide-react";',
    'import { Loader2, X, Clock, User, FileText, CheckCircle2, AlertCircle, Timer, ChevronDown, ChevronRight, Search, BarChart2, Activity } from "lucide-react";'
);

// 2. Helper functions
const helpers = `
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
        const hasRework = (t.workingHourTask || []).some(w => String(w.type).toUpperCase() === 'REWORK');
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
                                    <div style={{ width: \`\${Math.min(100, Math.max(0, pillar.score))}%\`, height: "100%", background: pillar.color }} />
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

/* ─── Main Component ─── */
export default function MeasDashboard({ projectId, tasks = [], view, setView }) {
    const userRole = useSelector((state) => state.auth?.user?.role || "");
    const canViewEPS = ["admin", "deputy_manager", "human_resource", "operation_executive"].includes(String(userRole).toLowerCase());
    
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEPSEmp, setSelectedEPSEmp] = useState(null);
`;

content = content.replace(
    '/* ─── Main Component ─── */\nexport default function MeasDashboard({ projectId, tasks = [], view, setView }) {',
    helpers
);

// 3. Modifying employeeStats
const oldEmployeeStats = `
    const employeeStats = useMemo(() => {
        return employees
            .map((emp) => {
                const empTasks = projectTasks.filter(
                    (t) => \`\${t.user?.firstName} \${t.user?.lastName}\` === emp,
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
`;

const newEmployeeStats = `
    const employeeStats = useMemo(() => {
        return employees
            .map((emp) => {
                const empTasks = projectTasks.filter(
                    (t) => \`\${t.user?.firstName} \${t.user?.lastName}\` === emp,
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
`;

content = content.replace(oldEmployeeStats, newEmployeeStats);

// 4. Updating JSX rendering
const oldJSXTop = `
            <div style={{ padding: "28px 36px", background: "#f9fafb" }}>
                {/* BY EMPLOYEE */}
                {view === "by employee" && (
                    <div className="space-y-4">
                        {employeeStats.map((emp) => {
`;

const newJSXTop = `
            {selectedEPSEmp && (
                <EPSDetailPanel 
                    empName={selectedEPSEmp.name}
                    epsData={selectedEPSEmp.epsData}
                    onClose={() => setSelectedEPSEmp(null)}
                />
            )}
            <div style={{ padding: "28px 36px", background: "#f9fafb" }}>
                {/* BY EMPLOYEE */}
                {view === "by employee" && (
                    <div className="space-y-4">
                        <div className="relative mb-6">
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
                        {filteredEmployeeStats.map((emp) => {
`;

content = content.replace(oldJSXTop, newJSXTop);

const oldNameRender = `
                                            {/* Employee Name */}
                                            <h4 className="text-base font-semibold text-black uppercase tracking-wider mb-2">
                                                {emp.name}
                                            </h4>
`;

const newNameRender = `
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
`;

content = content.replace(oldNameRender, newNameRender);

fs.writeFileSync(path, content);
console.log("Updated MeasDashboard.jsx");
