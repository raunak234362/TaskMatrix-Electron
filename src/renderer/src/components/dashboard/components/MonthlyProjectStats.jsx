import React, { useMemo } from "react";
import { Users, Clock, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { formatSeconds } from "../../../utils/timeUtils";


const MonthlyProjectStats = ({
  tasks,
  projects,
  selectedMonth,
  selectedYear,
  teams = [],
  projectsByTeam,
  handleStatClick,
}) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const isFiltered = selectedMonth !== null || selectedYear !== null;

  const teamSummary = useMemo(() => {
    const summary = {};

    // Initialize with all teams
    teams.forEach((team) => {
      summary[team.id] = {
        teamName: team.name,
        id: team.id,
        totalSeconds: 0,
        projectCount: 0,
        monthlyBreakdown: {},
        stats: {
          IFA: { active: 0, onHold: 0, completed: 0, total: 0 },
          IFC: { active: 0, onHold: 0, completed: 0, total: 0 },
          COR: { active: 0, onHold: 0, completed: 0, total: 0 },
        },
      };
    });

    // Merge data from projectsByTeam
    Object.entries(projectsByTeam).forEach(([teamId, data]) => {
      if (!summary[teamId]) {
        summary[teamId] = {
          teamName: data.teamName,
          id: teamId,
          totalSeconds: 0,
          projectCount: 0,
          monthlyBreakdown: {},
          stats: data.stats,
        };
      } else {
        summary[teamId].stats = data.stats;
      }
      summary[teamId].projectCount = data.projects.length;
      // We will compute totalSeconds below by filtering tasks dynamically
      summary[teamId].totalSeconds = 0;
    });

    // Calculate monthly breakdown and totalSeconds if filtered
    tasks.forEach((task) => {
      const project = projects.find((p) => p.id === task.project_id);
      const teamId = project?.team?.id || "unassigned";

      if (summary[teamId] && task.start_date) {
        const date = new Date(task.start_date);
        const m = date.getMonth();
        const y = date.getFullYear();

        const matchesYear =
          selectedYear === null ||
          selectedYear === undefined ||
          y === selectedYear;
        const matchesMonth =
          selectedMonth === null ||
          selectedMonth === undefined ||
          m === selectedMonth;

        const hours = (task.workingHourTask || []).reduce(
          (sum, wht) => sum + (wht.duration_seconds || 0),
          0,
        );

        if (matchesYear && matchesMonth) {
          const monthYear = `${months[m]} ${y}`;
          summary[teamId].monthlyBreakdown[monthYear] =
            (summary[teamId].monthlyBreakdown[monthYear] || 0) + hours;

          // Add to total seconds for the month!
          summary[teamId].totalSeconds += hours;
        }
      }
    });

    const teamOrder = [
      "Tekla",
      "SDS/2",
      "SDS/2 Team 2",
      "PEMB",
      "PEMB Designing",
    ];

    const normalizeTeamName = (name) =>
      name.replace(/-/g, " ").replace(/\s+/g, " ").trim().toUpperCase();

    const normalizedTeamOrder = teamOrder.map(normalizeTeamName);

    const validTeams = Object.values(summary).filter((item) =>
      normalizedTeamOrder.includes(normalizeTeamName(item.teamName)),
    );

    return validTeams.sort((a, b) => {
      return (
        normalizedTeamOrder.indexOf(normalizeTeamName(a.teamName)) -
        normalizedTeamOrder.indexOf(normalizeTeamName(b.teamName))
      );
    });
  }, [projects, tasks, teams, projectsByTeam, selectedMonth, selectedYear]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
      {teamSummary.map((team) => (
        <motion.div
          key={team.teamName}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-black/5 overflow-hidden hover:border-black/20 transition-all group"
        >
          {/* Team Header */}
          <div className="bg-green-100/50 p-2 sm:p-3 border-b border-black/5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/60" />
              <h3 className="text-sm sm:text-base font-bold text-black uppercase tracking-widest truncate">
                {team.teamName}
              </h3>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <button
                onClick={() => {
                  const teamProjects = projectsByTeam[team.id]?.projects || [];
                  handleStatClick(teamProjects, "ALL", "TOTAL");
                }}
                className="flex items-center gap-1.5 hover:opacity-70 transition-opacity cursor-pointer group/headerprojects"
              >
                <span className="text-[10px] sm:text-[11px] text-gray-500 uppercase tracking-widest">
                  Awarded Projects:
                </span>
                <span className="text-sm sm:text-base font-bold text-gray-800">
                  {team.projectCount}
                </span>
              </button>
              
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] text-black/50 uppercase tracking-widest">
                  Work Done:
                </span>
                <span className="text-sm sm:text-base font-bold text-black">
                  {formatSeconds(team.totalSeconds)}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            {/* IFA/IFC/COR Grid */}
            <div className="border border-black/5 rounded-lg overflow-hidden bg-white">
              <div className="grid grid-cols-3 divide-x divide-black/5">
                {["IFA", "IFC", "COR"].map((stage) => (
                  <div key={stage} className="flex flex-col">
                    {/* Header */}
                    <div className="bg-gray-50/80 border-b border-black/5 py-1 text-center text-xs font-bold tracking-widest text-black/60 uppercase">
                      {stage}
                    </div>
                    {/* Content */}
                    <div className="p-1 space-y-0.5">
                      {[
                        {
                          label: "Active",
                          key: "active",
                          color: "green",
                          status: "ACTIVE",
                        },
                        {
                          label: "On-Hold",
                          key: "onHold",
                          color: "orange",
                          status: "ONHOLD",
                        },
                        {
                          label: "Completed",
                          key: "completed",
                          color: "blue",
                          status: "COMPLETED",
                        },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() =>
                            handleStatClick(
                              projectsByTeam[team.id]?.projects || [],
                              stage,
                              item.status,
                            )
                          }
                          className={`w-full flex items-center justify-between px-1.5 py-0.5 rounded-md hover:bg-gray-50 transition-all cursor-pointer group/btn`}
                        >
                          <span className="text-xs font-semibold text-gray-600 uppercase truncate">
                            {item.label}
                          </span>
                          <span
                            className={`text-sm font-bold ${item.key === "active"
                              ? "text-green-600"
                              : item.key === "onHold"
                                ? "text-orange-500"
                                : "text-blue-500"
                              }`}
                          >
                            {(team.stats[stage])?.[item.key] || 0}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monthly Breakdown Section (Only when filtered) */}
            {isFiltered && (
              <div className="space-y-1.5 pt-2 border-t border-black/5">
                <h4 className="text-[9px] font-bold text-black/40 uppercase tracking-widest px-1">
                  Monthly Breakdown
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(team.monthlyBreakdown)
                    .sort((a, b) => {
                      const [monthA, yearA] = a[0].split(" ");
                      const [monthB, yearB] = b[0].split(" ");
                      const dateA = new Date(`${monthA} 1, ${yearA}`);
                      const dateB = new Date(`${monthB} 1, ${yearB}`);
                      return dateB.getTime() - dateA.getTime();
                    })
                    .map(([monthYear, seconds]) => (
                      <div
                        key={monthYear}
                        className="flex items-center justify-between py-0.5 px-1.5 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-[10px] font-medium text-gray-600">
                          {monthYear}
                        </span>
                        <span className="text-[10px] font-bold text-black">
                          {formatSeconds(seconds)}
                        </span>
                      </div>
                    ))}
                  {Object.keys(team.monthlyBreakdown).length === 0 && (
                    <p className="text-[9px] text-gray-400 italic text-center py-1">
                      No task data
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MonthlyProjectStats;
