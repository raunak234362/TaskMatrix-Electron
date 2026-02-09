import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Layout,
  CalendarIcon,
} from "lucide-react";


const TeamCalendar = ({
  members,
  selectedTeamName,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("user");
  const [selectedMember, setSelectedMember] = useState("all");

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const padding = Array.from({ length: firstDayOfMonth }, () => null);

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 text-green-600 rounded-lg">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h3 className="text-lg  text-gray-700">
              Team Calendar - {selectedTeamName}
            </h3>
            <p className="text-xs text-gray-700">
              Schedule and task distribution
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("user")}
              className={`px-3 py-1.5 rounded-lg text-xs  flex items-center gap-2 transition-all ${viewMode === "user"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-700 hover:text-gray-700"
                }`}
            >
              <User size={14} />
              User View
            </button>
            <button
              onClick={() => setViewMode("project")}
              className={`px-3 py-1.5 rounded-lg text-xs  flex items-center gap-2 transition-all ${viewMode === "project"
                  ? "bg-white text-green-600 shadow-sm"
                  : "text-gray-700 hover:text-gray-700"
                }`}
            >
              <Layout size={14} />
              Project View
            </button>
          </div>

          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          >
            <option value="all" className="text-gray-700">
              Select Team Member
            </option>
            {members.map((m) => {
              const user = m.member || {};
              const name =
                `${user.firstName || ""} ${user.lastName || ""}`.trim() || []
              m.f_name || []
              "Unknown";
              return (
                <option key={m.id} value={m.id} className="text-gray-700">
                  {name}
                </option>
              );
            })}
          </select>

          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-2 py-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <span className="text-xs  text-gray-700 min-w-[100px] text-center">
              {monthName} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-[10px]  text-gray-400"
          >
            {day}
          </div>
        ))}
        {[...padding, ...days].map((day, idx) => {
          const date = new Date(year, currentDate.getMonth(), day || 1);
          date.setHours(0, 0, 0, 0);

          const peopleWorkingCount = day
            ? members.filter((member) => {
              return (member.tasks || []).some((task) => {
                if (!task.start_date || !task.due_date) return false;
                const start = new Date(task.start_date);
                const end = new Date(task.due_date);
                start.setHours(0, 0, 0, 0);
                end.setHours(0, 0, 0, 0);
                return date >= start && date <= end;
              });
            }).length
            : 0;

          return (
            <div
              key={idx}
              className={`bg-white min-h-[100px] p-2 transition-colors hover:bg-gray-50/50 ${day === null ? "bg-gray-50/30" : ""
                }`}
            >
              {day && (
                <>
                  <span className="text-xs  text-gray-400">{day}</span>
                  <div className="mt-2 flex flex-col gap-1">
                    {peopleWorkingCount > 0 ? (
                      <div className="px-2 py-1 bg-green-50 text-green-700 text-[10px]  rounded-lg border border-green-100 flex items-center justify-center gap-1">
                        <User size={10} />
                        <span>{peopleWorkingCount} Working</span>
                      </div>
                    ) : (
                      <div className="px-2 py-1 bg-gray-50 text-gray-400 text-[10px] font-medium rounded-lg border border-gray-100 text-center">
                        No Active Tasks
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[10px]  text-gray-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-blue-400"></div>
          <span>Tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span>Projects</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-rose-400"></div>
          <span>On Leave (Weekdays)</span>
        </div>
      </div>
    </div>
  );
};

export default TeamCalendar;
