import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  User,
  Layout,
  X,
  FileText,
} from "lucide-react";
import FetchTaskByID from "../../../task/FetchTaskByID";


const TeamCalendar = ({
  members,
  selectedTeamName,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("user");
  const [selectedMember, setSelectedMember] = useState("all");
  const [selectedProject, setSelectedProject] = useState("all");
  const [selectedDateModal, setSelectedDateModal] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const getTaskHours = (task) => {
    const parseDurationToMinutes = (durationStr) => {
      if (!durationStr || durationStr === "00:00:00") return 0;
      const parts = String(durationStr).split(":");
      if (parts.length === 3) {
        return (
          parseInt(parts[0]) * 60 + parseInt(parts[1]) + parseInt(parts[2]) / 60
        );
      }
      return 0;
    };

    const assigned = task.allocationLog?.allocatedHours
      ? parseFloat(task.allocationLog.allocatedHours)
      : task.hours
        ? parseFloat(task.hours)
        : task.duration
          ? parseDurationToMinutes(task.duration) / 60
          : 0;

    const worked = (task.workingHourTask || []).reduce(
      (sum, entry) => {
        if (entry.duration_seconds) return sum + entry.duration_seconds / 3600;
        return sum + (entry.duration || 0) / 60;
      },
      0,
    );

    return { assigned, worked };
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return "00h 00m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m`;
  };

  const userTotalHoursMap = useMemo(() => {
    if (!selectedDateModal) return {};
    const map = {};
    (selectedDateModal.tasks || []).forEach((task) => {
      const { worked } = getTaskHours(task);
      const userName = task.userName || "Unknown";
      if (!map[userName]) map[userName] = 0;
      map[userName] += worked;
    });
    return map;
  }, [selectedDateModal]);

  const allProjects = useMemo(() => {
    const projectsMap = new Map();
    members.forEach((m) => {
      (m.tasks || []).forEach((t) => {
        const pId = t.project?.id || t.project_id;
        const pName =
          t.project?.name ||
          t.project?.title ||
          t.projectName ||
          `Project ${pId}`;
        if (pId) {
          projectsMap.set(pId, pName);
        }
      });
    });
    return Array.from(projectsMap.entries()).map(([id, name]) => ({
      id,
      name,
    }));
  }, [members]);

  const getDayTasks = (date) => {
    const dayTasks = [];
    members.forEach((m) => {
      const user = m.member || {};
      const memberId = m.id || m.userId || user.id;
      if (
        viewMode === "user" &&
        selectedMember !== "all" &&
        String(memberId) !== String(selectedMember)
      ) {
        return;
      }

      const userName =
        `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        m.f_name ||
        m.firstName ||
        "Unknown";

      (m.tasks || []).forEach((task) => {
        const pId = task.project?.id || task.project_id;
        if (
          viewMode === "project" &&
          selectedProject !== "all" &&
          String(pId) !== String(selectedProject)
        ) {
          return;
        }

        if (!task.start_date || !task.due_date) return;
        const start = new Date(task.start_date);
        const end = new Date(task.due_date);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        if (date >= start && date <= end) {
          dayTasks.push({ ...task, userName });
        }
      });
    });
    return dayTasks;
  };

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0,
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1,
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, () => null);

  return (
    <>
      <div className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-soft mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-200 text-black border border-black/5 rounded-2xl shadow-sm">
              <CalendarIcon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">
                Team Calendar - {selectedTeamName}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-black/5">
              <button
                onClick={() => setViewMode("user")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "user"
                  ? "bg-white text-black shadow-medium border border-black/5"
                  : "text-black/40 hover:text-black"
                  }`}
              >
                <User size={14} strokeWidth={2.5} />
                User View
              </button>
              <button
                onClick={() => setViewMode("project")}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "project"
                  ? "bg-white text-black shadow-medium border border-black/5"
                  : "text-black/40 hover:text-black"
                  }`}
              >
                <Layout size={14} strokeWidth={2.5} />
                Project View
              </button>
            </div>

            {viewMode === "user" ? (
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="px-5 py-3 bg-white border border-black/10 rounded-2xl text-xs font-black text-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all cursor-pointer shadow-sm min-w-[200px]"
              >
                <option value="all">Select Team Member</option>
                {members.map((m) => {
                  const user = m.member || {};
                  const name =
                    `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                    m.f_name ||
                    m.firstName ||
                    "Unknown";
                  const memberId = m.id || m.userId || user.id;
                  return (
                    <option key={memberId} value={memberId}>
                      {name}
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="px-5 py-3 bg-white border border-black/10 rounded-2xl text-xs font-black text-black uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-green-500/10 transition-all cursor-pointer shadow-sm min-w-[200px]"
              >
                <option value="all">Select Project</option>
                {allProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-3 bg-white border border-black/10 rounded-2xl px-4 py-1.5 shadow-sm">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-black"
              >
                <ChevronLeft size={20} strokeWidth={2.5} />
              </button>
              <span className="text-sm font-black text-black uppercase tracking-widest min-w-[140px] text-center">
                {monthName} {year}
              </span>
              <button
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-xl transition-colors text-black"
              >
                <ChevronRight size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
        <div className="mb-8 flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
            <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
              Normal Hours
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
            <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
              Stretching
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
            <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
              Absent
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500 shadow-sm"></div>
            <span className="text-[10px] font-black text-black/60 uppercase tracking-widest">
              Not Assigned
            </span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-px bg-black/20 border-2 border-black/20 rounded-4xl overflow-hidden shadow-inner">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div
              key={day}
              className="bg-gray-100 py-3 text-center text-[10px] font-black text-black uppercase tracking-[0.2em]"
            >
              {day}
            </div>
          ))}
          {[...padding, ...days].map((day, idx) => {
            const date = new Date(year, currentDate.getMonth(), day || 1);
            date.setHours(0, 0, 0, 0);

            let dayTasks = [];
            let userTotalHoursMapDay = {};

            if (day) {
              dayTasks = getDayTasks(date);
              dayTasks.forEach((task) => {
                const { worked } = getTaskHours(task);
                const userName = task.userName || "Unknown";
                if (!userTotalHoursMapDay[userName])
                  userTotalHoursMapDay[userName] = 0;
                userTotalHoursMapDay[userName] += worked;
              });
            }

            return (
              <div
                key={idx}
                onClick={() =>
                  day &&
                  dayTasks.length > 0 &&
                  setSelectedDateModal({ date, tasks: dayTasks })
                }
                className={`bg-white min-h-[140px] p-2 transition-all duration-300 hover:bg-gray-50 group flex flex-col ${day === null
                  ? "bg-gray-50/50"
                  : dayTasks.length > 0
                    ? "cursor-pointer"
                    : ""
                  }`}
              >
                {day && (
                  <>
                    <span className="text-sm font-black text-black/40 group-hover:text-black transition-colors px-2 pt-1">
                      {day}
                    </span>
                    <div className="mt-2 flex flex-col gap-1 overflow-y-auto custom-scrollbar flex-1 max-h-[100px] pb-1">
                      {dayTasks.map((t, tIdx) => (
                        <div
                          key={tIdx}
                          className={`px-2 py-1.5 rounded-lg border flex flex-col gap-0.5 shadow-sm transition-colors ${userTotalHoursMapDay[t.userName || "Unknown"] > 8.5
                            ? "bg-blue-100/80 border-blue-200 hover:bg-blue-200/80"
                            : t.status === "ABSENT" ||
                              (t.name || t.title || "")
                                .toUpperCase()
                                .includes("ABSENT")
                              ? "bg-red-50 border-red-200 hover:bg-red-100"
                              : userTotalHoursMapDay[
                                t.userName || "Unknown"
                              ] === 0 &&
                                (t.name || t.title || "")
                                  .toUpperCase()
                                  .includes("NOT ASSIGNED")
                                ? "bg-orange-50 border-orange-200 hover:bg-orange-100"
                                : "bg-green-50 border-green-200 hover:bg-green-100"
                            }`}
                          title={t.name || t.title}
                        >
                          <span
                            className={`text-[10px] font-semibold truncate tracking-tight ${userTotalHoursMapDay[t.userName || "Unknown"] >
                              8.5
                              ? "text-blue-900"
                              : t.status === "ABSENT" ||
                                (t.name || t.title || "")
                                  .toUpperCase()
                                  .includes("ABSENT")
                                ? "text-red-900"
                                : userTotalHoursMapDay[
                                  t.userName || "Unknown"
                                ] === 0 &&
                                  (t.name || t.title || "")
                                    .toUpperCase()
                                    .includes("NOT ASSIGNED")
                                  ? "text-orange-900"
                                  : "text-green-900"
                              }`}
                          >
                            {t.name || t.title || "Task"}
                          </span>
                          <span
                            className={`text-[9px] font-bold truncate tracking-wider uppercase ${userTotalHoursMapDay[t.userName || "Unknown"] >
                              8.5
                              ? "text-blue-700/80"
                              : t.status === "ABSENT" ||
                                (t.name || t.title || "")
                                  .toUpperCase()
                                  .includes("ABSENT")
                                ? "text-red-700/80"
                                : userTotalHoursMapDay[
                                  t.userName || "Unknown"
                                ] === 0 &&
                                  (t.name || t.title || "")
                                    .toUpperCase()
                                    .includes("NOT ASSIGNED")
                                  ? "text-orange-700/80"
                                  : "text-green-700/80"
                              }`}
                          >
                            {t.userName}
                          </span>
                        </div>
                      ))}
                      {dayTasks.length === 0 && (
                        <div className="px-2 py-4 bg-gray-50/50 text-black/30 text-[9px] font-black uppercase tracking-widest rounded-lg border border-dashed border-black/5 text-center h-full flex items-center justify-center">
                          No Tasks
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Tasks Modal */}
      {selectedDateModal && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-[90%] max-w-2xl max-h-[85vh] rounded-4xl shadow-2xl overflow-hidden flex flex-col border border-black/10 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-black/5 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-black uppercase tracking-tight">
                  Tasks on{" "}
                  {selectedDateModal.date.toLocaleDateString("default", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm font-bold text-black/40 uppercase tracking-widest mt-1">
                  {selectedDateModal.tasks.length}{" "}
                  {selectedDateModal.tasks.length === 1 ? "Task" : "Tasks"}{" "}
                  Scheduled
                </p>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-3 hover:bg-red-50 hover:text-red-500 text-black/40 rounded-full transition-colors"
                title="Close Modal"
              >
                <X size={24} strokeWidth={2.5} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/20">
              <div className="space-y-4">
                {selectedDateModal.tasks.map((task, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedTaskId(task.id || task._id)}
                    className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm hover:border-black/10 transition-colors cursor-pointer"
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 shrink-0 rounded-2xl border border-blue-100/50">
                          <FileText size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-base font-black text-black leading-tight mb-1">
                            {task.name || task.title || "Untitled Task"}
                          </h4>
                          <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">
                            {task.project?.name ||
                              task.projectName ||
                              `Project ${task.project_id || ""}` ||
                              "Project"}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl border ${task.status === "COMPLETE"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                      >
                        {task.status || "Pending"}
                      </span>
                    </div>

                    <div className="flex items-center gap-5 mt-5 pt-5 border-t border-black/5">
                      <div
                        className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-colors ${userTotalHoursMap[task.userName || "Unknown"] > 8.5
                          ? "bg-blue-100/80 border-blue-200 shadow-sm"
                          : task.status === "ABSENT" ||
                            (task.name || task.title || "")
                              .toUpperCase()
                              .includes("ABSENT")
                            ? "bg-red-50 border-red-200 shadow-sm"
                            : userTotalHoursMap[
                              task.userName || "Unknown"
                            ] === 0 &&
                              (task.name || task.title || "")
                                .toUpperCase()
                                .includes("NOT ASSIGNED")
                              ? "bg-orange-50 border-orange-200 shadow-sm"
                              : "bg-green-50 border-green-200 shadow-sm"
                          }`}
                        title={
                          userTotalHoursMap[task.userName || "Unknown"] > 8.5
                            ? "User is stretching (> 8 hrs 30 mins)"
                            : ""
                        }
                      >
                        <div
                          className={`w-6 h-6 rounded-full border flex items-center justify-center ${userTotalHoursMap[task.userName || "Unknown"] > 8.5
                            ? "bg-white border-blue-200 text-blue-600"
                            : task.status === "ABSENT" ||
                              (task.name || task.title || "")
                                .toUpperCase()
                                .includes("ABSENT")
                              ? "bg-white border-red-200 text-red-600"
                              : userTotalHoursMap[
                                task.userName || "Unknown"
                              ] === 0 &&
                                (task.name || task.title || "")
                                  .toUpperCase()
                                  .includes("NOT ASSIGNED")
                                ? "bg-white border-orange-200 text-orange-600"
                                : "bg-white border-green-200 text-green-600"
                            }`}
                        >
                          <User size={12} />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`text-xs font-black uppercase tracking-wider ${userTotalHoursMap[task.userName || "Unknown"] >
                              8.5
                              ? "text-blue-900"
                              : task.status === "ABSENT" ||
                                (task.name || task.title || "")
                                  .toUpperCase()
                                  .includes("ABSENT")
                                ? "text-red-900"
                                : userTotalHoursMap[
                                  task.userName || "Unknown"
                                ] === 0 &&
                                  (task.name || task.title || "")
                                    .toUpperCase()
                                    .includes("NOT ASSIGNED")
                                  ? "text-orange-900"
                                  : "text-green-900"
                              }`}
                          >
                            {task.userName}
                          </span>
                          {userTotalHoursMap[task.userName || "Unknown"] >
                            8.5 && (
                              <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none mt-0.5 animate-pulse">
                                Stretching
                              </span>
                            )}
                          {(task.status === "ABSENT" ||
                            (task.name || task.title || "")
                              .toUpperCase()
                              .includes("ABSENT")) && (
                              <span className="text-[9px] font-black text-red-600 uppercase tracking-widest leading-none mt-0.5">
                                Absent
                              </span>
                            )}
                          {userTotalHoursMap[task.userName || "Unknown"] ===
                            0 &&
                            (task.name || task.title || "")
                              .toUpperCase()
                              .includes("NOT ASSIGNED") && (
                              <span className="text-[9px] font-black text-orange-600 uppercase tracking-widest leading-none mt-0.5">
                                Not Assigned
                              </span>
                            )}
                        </div>
                      </div>
                      <div className="h-6 w-px bg-black/5"></div>
                      <div className="flex flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                            A: {formatHours(getTaskHours(task).assigned)}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-gray-100 px-2 py-0.5 rounded">
                            W: {formatHours(getTaskHours(task).worked)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <CalendarIcon size={14} className="text-black/40" />
                          <span className="text-[11px] font-bold text-black/60 tracking-wide">
                            {new Date(
                              task.start_date || new Date(),
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                            <span className="mx-2 text-black/20">-</span>
                            {new Date(
                              task.due_date || new Date(),
                            ).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTaskId && (
        <FetchTaskByID
          id={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </>
  );
};

export default TeamCalendar;
