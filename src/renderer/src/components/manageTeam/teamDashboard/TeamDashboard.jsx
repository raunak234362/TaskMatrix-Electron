
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Service from "../../../api/Service";
import AddTeam from "../team/AddTeam";
import GetTeamById from "../team/GetTeamById";
import GetEmployeeByID from "../employee/GetEmployeeByID";
import DashboardHeader from "./components/DashboardHeader";
import TeamsList from "./components/TeamsList";
import TeamStatsCards from "./components/TeamStatsCards";
import EfficiencyAnalytics from "./components/EfficiencyAnalytics";
import TeamMembersTable from "./components/TeamMembersTable";
import TaskDistribution from "./components/TaskDistribution";
import DailyWorkReportModal from "./components/DailyWorkReportModal";
import TeamCalendar from "./components/TeamCalendar";
import { toast } from "react-toastify";

const TeamDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState([]);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [teamStats, setTeamStats] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [allMemberStats, setAllMemberStats] = useState([]);

  // Analytics State
  const [selectedComparisonTeams, setSelectedComparisonTeams] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("1M");
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });

  const [dateFilter, setDateFilter] = useState({
    type: "all",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    weekStart: new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay())
    ).getTime(),
    weekEnd: new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay() + 6)
    ).getTime(),
    startMonth: 0,
    endMonth: new Date().getMonth(),
    startDate: new Date(
      new Date().setDate(new Date().getDate() - 30)
    ).toISOString(),
    endDate: new Date().toISOString(),
  });

  // Cache for fetched team stats to avoid refetching
  const [teamStatsCache, setTeamStatsCache] = useState(new Map());

  // Fetch all teams
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await Service.AllTeam();
        const teamsData = response?.data || []
        setTeams(teamsData);
        setFilteredTeams(teamsData);

        // Auto-select first team if available
        if (teamsData.length > 0 && !selectedTeam) {
          // setSelectedTeam(teamsData[0].id); // Optional select logic
        }

        setLoading(false);
      } catch (error) {
        console.error(error.message);
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // Sync selectedComparisonTeams with selectedTeam (initial selection)
  useEffect(() => {
    if (selectedTeam && !selectedComparisonTeams.includes(selectedTeam)) {
      setSelectedComparisonTeams([selectedTeam]);
    }
  }, [selectedTeam]);


  // Fetch team stats (Reusable & Caching)
  const fetchTeamStats = useCallback(async (teamId) => {
    if (teamStatsCache.has(teamId)) {
      return teamStatsCache.get(teamId);
    }

    try {
      const response = await Service.GetTeamByID(teamId);
      if (!response?.data) return null;

      const teamData = response.data;
      const activeMembers = (teamData.members || []).filter(
        (member) => !member.is_disabled && !member.member?.is_disabled
      );

      const memberStats = await Promise.all(
        activeMembers.map(async (member) => {
          try {
            const userId = member.userId || member.member?.id || member.id;
            const response = await Service.getUsersStats(userId);
            return { ...member, ...response.data, id: userId };
          } catch (error) {
            console.error(
              `Error fetching stats for member ${member.id}:`,
              error
            );
            return {
              ...member,
              tasks: [],
              id: member.userId || member.member?.id || member.id,
            };
          }
        })
      );

      const data = { members: activeMembers, memberStats };

      // Update cache
      setTeamStatsCache(prev => new Map(prev).set(teamId, data));

      return data;
    } catch (error) {
      console.error("Error fetching team stats:", error);
      return null;
    }
  }, [teamStatsCache]);

  // Handle main dashboard team selection (Project Stats etc)
  useEffect(() => {
    if (!selectedTeam) return;

    const loadTeamData = async () => {
      setLoading(true);
      const data = await fetchTeamStats(selectedTeam);
      if (data) {
        setTeamMembers(data.members);
        setAllMemberStats(data.memberStats);
      }
      setLoading(false);
    };

    loadTeamData();
  }, [selectedTeam, fetchTeamStats]);

  // Apply filters and calculate stats (existing logic for stats cards)
  useEffect(() => {
    if (!allMemberStats || allMemberStats.length === 0) return;

    const filteredStats = allMemberStats.map((memberStat) => {
      const filteredTasks = filterTasksByDateRange(
        memberStat.tasks || [],
        dateFilter
      );
      return {
        ...memberStat,
        tasks: filteredTasks,
      };
    });

    calculateTeamSummary(filteredStats);
  }, [allMemberStats, dateFilter]);


  // --- New Logic for Efficiency Analytics ---

  useEffect(() => {
    const generateAnalytics = async () => {
      if (selectedComparisonTeams.length === 0) {
        setEfficiencyData([]);
        return;
      }

      const teamDataMap = {};

      // 1. Ensure fetched stats for all selected comparison teams
      await Promise.all(selectedComparisonTeams.map(async (tid) => {
        const data = await fetchTeamStats(tid);
        if (data) teamDataMap[tid] = data;
      }));

      // 2. Prepare date points based on timeFilter/DateRange
      const { start, end, format } = getDateRangeParams(timeFilter, analyticsDateRange);
      const dataPoints = generateDatePoints(start, end, format);

      // 3. Compute efficiency per team per point
      const chartData = dataPoints.map(point => {
        const pointData = { date: point.label, fullDate: point.date };

        selectedComparisonTeams.forEach(tid => {
          const fetched = teamDataMap[tid];
          if (fetched) {
            const eff = calculateEfficiencyForPeriod(fetched.memberStats, point.start, point.end);
            pointData[tid] = eff;
          } else {
            pointData[tid] = 0;
          }
        });
        return pointData;
      });

      setEfficiencyData(chartData);
    };

    generateAnalytics();

  }, [selectedComparisonTeams, timeFilter, analyticsDateRange, fetchTeamStats]);

  const getDateRangeParams = (filter, range) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let format = 'daily';

    if (filter === '1D') {
      start.setDate(now.getDate() - 1);
    } else if (filter === '1W') {
      start.setDate(now.getDate() - 7);
    } else if (filter === '1M') {
      start.setDate(now.getDate() - 30);
    } else if (filter === '1Y') {
      start.setFullYear(now.getFullYear() - 1);
      format = 'monthly';
    } else if (filter === 'ALL') {
      start = new Date('2023-01-01'); // Arbitrary start for 'ALL'
      format = 'monthly';
    }
    // Use custom range strictly if provided? Or date pickers should just update range state?
    // Component logic: date pickers update `analyticsDateRange`. Time Filter buttons update `analyticsDateRange` and `timeFilter`.
    // So here rely on passed range IF filter is "Custom" (implied). 
    // Actually, buttons invoke logic to set range. 
    // Let's use `analyticsDateRange` as truth. But buttons set presets.

    // Override with state (which buttons should update)
    start = new Date(range.start);
    endDateToEndOfDay(start); // Start of day actually
    start.setHours(0, 0, 0, 0);

    end = new Date(range.end);
    endDateToEndOfDay(end);

    // Heuristic for format
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    if (diffDays > 60) format = 'monthly';

    return { start, end, format };
  };

  const endDateToEndOfDay = (date) => {
    date.setHours(23, 59, 59, 999);
  };

  const generateDatePoints = (start, end, format) => {
    const points = [];
    let current = new Date(start);

    while (current <= end) {
      if (format === 'monthly') {
        // Logic for monthly buckets
        const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        points.push({
          label: monthStart.toLocaleString('default', { month: 'short', year: '2-digit' }),
          date: monthStart.toISOString(), // Sortable/Key
          start: monthStart,
          end: monthEnd > end ? end : monthEnd
        });
        // Next month
        current.setMonth(current.getMonth() + 1);
      } else {
        // Daily buckets
        const dayStart = new Date(current);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        points.push({
          label: dayStart.toLocaleDateString(), // Or format nicely
          date: dayStart.toISOString(),
          start: dayStart,
          end: dayEnd
        });
        // Next day
        current.setDate(current.getDate() + 1);
      }
    }
    return points;
  };

  const calculateEfficiencyForPeriod = (memberStats, periodStart, periodEnd) => {
    let totalAssigned = 0;
    let totalWorked = 0;

    memberStats?.forEach(member => {
      const tasks = member.tasks || [];
      tasks.forEach((task) => {
        // Using Task Start Date for attribution as noted in Plan
        const taskDate = new Date(task.start_date || task.startDate);

        if (taskDate >= periodStart && taskDate <= periodEnd) {
          if (["COMPLETE", "VALIDATE_COMPLETED"].includes(task.status)) { // Only completed tasks count for efficiency? usually yes
            totalAssigned += parseDurationToMinutes(task.duration || "00:00:00") / 60;

            // Sum worklogs for this task? Or just check if worklogs fall in range?
            // Simplification task starts in range, sum ALL its worklogs (ProjectStation logic often does this)
            // Or iterate worklogs. But `workingHourTask` might not have dates? 
            // Assuming standard attribution to task.
            const worked = (task.workingHourTask || []).reduce(
              (sum, entry) => sum + (entry.duration || 0) / 60,
              0
            );
            totalWorked += worked;
          }
        }
      });
    });

    if (totalWorked === 0) return 0;
    return Math.round((totalAssigned / totalWorked) * 100);
  };

  const handleTimeFilterChange = (tf) => {
    setTimeFilter(tf);
    const now = new Date();
    let start = new Date();

    if (tf === '1D') start.setDate(now.getDate() - 1);
    if (tf === '1W') start.setDate(now.getDate() - 7);
    if (tf === '1M') start.setDate(now.getDate() - 30);
    if (tf === '1Y') start.setFullYear(now.getFullYear() - 1);
    if (tf === 'ALL') start = new Date('2023-01-01');

    setAnalyticsDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  };

  // --- End New Logic ---

  const calculateTeamSummary = (filteredStats) => {
    try {
      const allFilteredTasks = filteredStats.flatMap((m) => m.tasks || []);

      const uniqueProjects = [];
      const projectIds = new Set();
      for (const t of allFilteredTasks) {
        const p = t?.project;
        if (p && p.id != null && !projectIds.has(p.id)) {
          projectIds.add(p.id);
          uniqueProjects.push(p);
        }
      }

      const totalAssignedHours = filteredStats.reduce((total, member) => {
        const memberAssignedHours = (member.tasks || []).reduce(
          (sum, task) =>
            sum + parseDurationToMinutes(task.duration || "00:00:00") / 60,
          0
        );
        return total + memberAssignedHours;
      }, 0);

      const totalWorkedHours = filteredStats.reduce((total, member) => {
        const memberWorkedHours = (member.tasks || [])
          .flatMap((task) => task.workingHourTask || [])
          .reduce(
            (sum, entry) => sum + (entry.duration || 0) / 60,
            0
          );
        return total + memberWorkedHours;
      }, 0);

      const totalTasks = filteredStats.reduce(
        (total, member) => total + (member.tasks?.length || 0),
        0
      );

      const projectCount = uniqueProjects.length;

      // ── Task Type Counts ──
      const taskTypeCounts = {
        modelling: 0,
        modelChecking: 0,
        detailing: 0,
        detailChecking: 0,
        erection: 0,
        erectionChecking: 0,
      };

      allFilteredTasks.forEach((task) => {
        // Determine type based on wbsTemplate name (priority) or task name/title
        const typeString = (
          task.wbsData?.name ||
          task.wbsTemplate?.name ||
          task.name ||
          task.title ||
          ""
        ).toLowerCase();

        if (typeString.includes("model checking") || typeString.includes("checking model")) {
          taskTypeCounts.modelChecking++;
        } else if (typeString.includes("modelling") || typeString.includes("modeling")) {
          taskTypeCounts.modelling++;
        } else if (typeString.includes("detail checking") || typeString.includes("checking detail")) {
          taskTypeCounts.detailChecking++;
        } else if (typeString.includes("detailing")) {
          taskTypeCounts.detailing++;
        } else if (typeString.includes("erection checking") || typeString.includes("checking erection")) {
          taskTypeCounts.erectionChecking++;
        } else if (typeString.includes("erection")) {
          taskTypeCounts.erection++;
        }
      });

      const completedTasks = filteredStats.reduce(
        (total, member) =>
          total +
          (member.tasks || []).filter((task) => task.status === "COMPLETE")
            .length,
        0
      );

      const inProgressTasks = filteredStats.reduce(
        (total, member) =>
          total +
          (member.tasks || []).filter(
            (task) => task.status === "IN_PROGRESS"
          ).length,
        0
      );

      const completedTasksList = filteredStats.flatMap((m) =>
        (m.tasks || []).filter((task) => task.status === "COMPLETE")
      );

      const efficiencyAssignedHours = completedTasksList.reduce(
        (sum, task) =>
          sum + parseDurationToMinutes(task.duration || "00:00:00") / 60,
        0
      );

      const efficiencyWorkedHours = completedTasksList
        .flatMap((task) => task.workingHourTask || [])
        .reduce((sum, entry) => sum + (entry.duration || 0) / 60, 0);

      let efficiency = 0;
      if (efficiencyWorkedHours > 0) {
        efficiency = Math.round(
          (efficiencyAssignedHours / efficiencyWorkedHours) * 100
        );
      }

      const completionRate =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setTeamStats({
        totalAssignedHours: totalAssignedHours.toFixed(2),
        totalWorkedHours: totalWorkedHours.toFixed(2),
        totalTasks,
        completedTasks,
        inProgressTasks,
        efficiency,
        completionRate,
        memberStats: filteredStats,
        projects: uniqueProjects,
        projectCount,
        taskTypeCounts,
      });

    } catch (error) {
      console.error("Error calculating team stats:", error);
    }
  };

  useEffect(() => {
    if (!teams) return;

    let filtered = [...teams];

    if (searchTerm) {
      filtered = filtered.filter((team) =>
        team.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredTeams(filtered);
  }, [searchTerm, teams]);

  const handleTeamSelect = (teamId) => setSelectedTeam(teamId);
  const handleMemberClick = (memberId) => setSelectedEmployee(memberId);
  const handleCloseModal = () => setSelectedEmployee(null);

  const getEfficiencyColorClass = (efficiency) => {
    if (efficiency >= 90) return "bg-green-100 text-green-800";
    if (efficiency >= 70) return "bg-blue-100 text-blue-800";
    if (efficiency >= 50) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const tableData = useMemo(() => {
    if (!teamMembers || !teamStats.memberStats) return [];

    return teamMembers
      .filter((member) => !member.is_disabled && !member.member?.is_disabled)
      .map((member, index) => {
        const user = member.member || {};
        const memberStat = teamStats.memberStats?.find(
          (stat) => stat.id === (member.userId || user.id || member.id)
        );

        const assignedHours =
          (memberStat?.tasks || []).reduce(
            (sum, task) =>
              sum + parseDurationToMinutes(task.duration || "00:00:00") / 60,
            0
          ) || 0;

        const workedHours =
          (memberStat?.tasks || [])
            .flatMap((task) => task.workingHourTask || [])
            .reduce(
              (sum, entry) => sum + (entry.duration || 0) / 60,
              0
            ) || 0;

        const totalTasks = memberStat?.tasks?.length || 0;
        const completedTasks =
          (memberStat?.tasks || []).filter((task) =>
            ["COMPLETE", "USER_FAULT", "VALIDATE_COMPLETED"].includes(
              task.status
            )
          ).length || 0;

        const memberCompletedTasks = (memberStat?.tasks || []).filter(
          (task) => task.status === "COMPLETE"
        );

        const efficiencyAssigned =
          memberCompletedTasks?.reduce(
            (sum, task) =>
              sum + parseDurationToMinutes(task.duration || "00:00:00") / 60,
            0
          ) || 0;

        const efficiencyWorked =
          memberCompletedTasks
            ?.flatMap((task) => task.workingHourTask || [])
            .reduce(
              (sum, entry) => sum + (entry.duration || 0) / 60,
              0
            ) || 0;

        let efficiency = 0;
        if (efficiencyWorked > 0) {
          efficiency = Math.round(
            (efficiencyAssigned / efficiencyWorked) * 100
          );
        }

        return {
          sno: index + 1,
          id: member.userId || user.id || member.id,
          name:
            `${user.firstName || ""} ${user.middleName || ""} ${user.lastName || ""
              }`.trim() || "Unknown",
          role: member.role || "Member",
          assignedHours: assignedHours.toFixed(2),
          workedHours: workedHours.toFixed(2),
          totalTasks,
          completedTasks,
          efficiency,
        };
      });
  }, [teamMembers, teamStats.memberStats]);

  const formatToHoursMinutes = (val) => {
    if (!val && val !== 0) return "00 hrs 00 mins";
    const hrs = Math.floor(val);
    const mins = Math.round((val - hrs) * 60);
    return `${hrs.toString().padStart(2, "0")} hrs ${mins
      .toString()
      .padStart(2, "0")} mins`;
  };

  const handleGenerateReport = () => {
    toast.info(
      "PDF generation is currently being set up. Please try again later."
    );
  };

  return (
    <div className="h-full p-6 overflow-y-auto custom-scrollbar">
      <DashboardHeader
        onAddTeam={() => setIsModalOpen(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        onGenerateReport={handleGenerateReport}
        onDailyReport={() => setIsReportModalOpen(true)}
      />

      {loading && !selectedTeam ? (
        <div className="flex items-center justify-center h-full min-h-[60vh]">
          <div className="w-12 h-12 border border-green-200 border-t-green-600 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          <TeamsList
            filteredTeams={filteredTeams}
            selectedTeam={selectedTeam}
            onTeamSelect={handleTeamSelect}
          />

          {selectedTeam && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Team Header Bar */}
              <div className="w-full bg-green-100 border border-black rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-black text-black uppercase tracking-tight">
                    {teams?.find((t) => t.id === selectedTeam)?.name || "Team Detail"}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="px-6 py-2.5 bg-white/50 text-black border border-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-white transition-all active:translate-y-[1px] active:shadow-none"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-white text-black border border-black font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-gray-50 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#000] active:translate-x-[0px] active:translate-y-[0px] active:shadow-[2px_2px_0px_#000]"
                  >
                    View Details
                  </button>
                </div>
              </div>

              <TeamStatsCards teamStats={teamStats} />

              <TeamCalendar
                members={allMemberStats}
                selectedTeamName={
                  teams?.find((t) => t.id === selectedTeam)?.name
                }
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <EfficiencyAnalytics
                    data={efficiencyData}
                    teams={teams}
                    selectedTeams={selectedComparisonTeams}
                    onTeamSelectionChange={setSelectedComparisonTeams}
                    timeFilter={timeFilter}
                    onTimeFilterChange={handleTimeFilterChange}
                    dateRange={analyticsDateRange}
                    onDateRangeChange={setAnalyticsDateRange}
                  />
                </div>
                <div>
                  <TaskDistribution teamStats={teamStats} />
                </div>
              </div>

              <TeamMembersTable
                tableData={tableData}
                onMemberClick={handleMemberClick}
                formatToHoursMinutes={formatToHoursMinutes}
                getEfficiencyColorClass={getEfficiencyColorClass}
              />
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative border border-white/20">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-red-50 hover:text-red-500 rounded-full z-10 transition-colors"
            >
              <XIcon />
            </button>
            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
              <AddTeam />
            </div>
          </div>
        </div>
      )}

      {isViewModalOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="absolute top-6 right-6 p-2 hover:bg-red-50 hover:text-red-500 rounded-full z-10 transition-colors"
            >
              <XIcon />
            </button>
            <div className="max-h-[80vh] overflow-y-auto p-8 custom-scrollbar">
              <GetTeamById id={selectedTeam} />
            </div>
          </div>
        </div>
      )}

      {selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-6 right-6 p-2 hover:bg-red-50 hover:text-red-500 rounded-full z-10 transition-colors"
            >
              <XIcon />
            </button>
            <div className="max-h-[80vh] overflow-y-auto p-8 custom-scrollbar">
              <GetEmployeeByID id={selectedEmployee} />
            </div>
          </div>
        </div>
      )}

      <DailyWorkReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        members={allMemberStats}
      />
    </div>
  );
};

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const parseDurationToMinutes = (duration) => {
  if (!duration) return 0;
  if (typeof duration === "number") return duration;
  if (typeof duration === "string" && !duration.includes(":")) {
    return parseFloat(duration);
  }
  const [hours, minutes, seconds] = duration.split(":").map(Number);
  return hours * 60 + (minutes || 0) + Math.floor((seconds || 0) / 60);
};

const filterTasksByDateRange = (tasks, filter) => {
  if (!tasks || !Array.isArray(tasks)) return [];
  if (filter.type === "all") return tasks;

  return tasks.filter((task) => {
    const taskStartDate = new Date(task.start_date || task.startDate);
    const taskEndDate = new Date(task.due_date || task.endDate);

    switch (filter.type) {
      case "week":
        const weekStart = new Date(filter.weekStart);
        const weekEnd = new Date(filter.weekEnd);
        return taskStartDate <= weekEnd && taskEndDate >= weekStart;

      case "month":
        const monthStart = new Date(filter.year, filter.month, 1);
        const monthEnd = new Date(filter.year, filter.month + 1, 0);
        return taskStartDate <= monthEnd && taskEndDate >= monthStart;

      case "year":
        const yearStart = new Date(filter.year, 0, 1);
        const yearEnd = new Date(filter.year, 11, 31);
        return taskStartDate <= yearEnd && taskEndDate >= yearStart;

      case "range":
        const rangeStart = new Date(filter.year, filter.startMonth, 1);
        const rangeEnd = new Date(filter.year, filter.endMonth + 1, 0);
        return taskStartDate <= rangeEnd && taskEndDate >= rangeStart;

      case "dateRange":
        const startDate = new Date(filter.startDate);
        const endDate = new Date(filter.endDate);
        return taskStartDate <= endDate && taskEndDate >= startDate;

      case "specificDate":
        const specificDate = new Date(filter.date);
        return taskStartDate.toDateString() === specificDate.toDateString();

      default:
        return true;
    }
  });
};

export default TeamDashboard;
