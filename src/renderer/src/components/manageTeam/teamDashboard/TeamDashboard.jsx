/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  incrementModalCount,
  decrementModalCount,
} from "../../../store/uiSlice";
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
  const dispatch = useDispatch();
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

  useEffect(() => {
    const isAnyModal =
      isModalOpen || isViewModalOpen || isReportModalOpen || !!selectedEmployee;
    if (isAnyModal) {
      dispatch(incrementModalCount());
      return () => {
        dispatch(decrementModalCount());
      };
    }
  }, [
    isModalOpen,
    isViewModalOpen,
    isReportModalOpen,
    selectedEmployee,
    dispatch,
  ]);
  const [allMemberStats, setAllMemberStats] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  // Analytics State
  const [selectedComparisonTeams, setSelectedComparisonTeams] = useState([]);
  const [efficiencyData, setEfficiencyData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("1M");
  const [analyticsDateRange, setAnalyticsDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30))
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [dateFilter, setDateFilter] = useState({
    type: "all",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    weekStart: new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay()),
    ).getTime(),
    weekEnd: new Date(
      new Date().setDate(new Date().getDate() - new Date().getDay() + 6),
    ).getTime(),
    startMonth: 0,
    endMonth: new Date().getMonth(),
    startDate: new Date(
      new Date().setDate(new Date().getDate() - 30),
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
        const teamsData = response?.data || [];
        setTeams(teamsData);
        setFilteredTeams(teamsData);

        // Auto-select first team if available
        if (teamsData.length > 0 && !selectedTeam) {
          // setSelectedTeam(teamsData[0].id); // Optional: Auto select logic
        }

        setLoading(false);
      } catch (error) {
        console.error(error.message);
        setLoading(false);
      }
    };
    fetchTeams();
  }, []);

  // useCallback(() => {
  //   const fetchAnalyticsScore = async () => {
  //     try {
  //       const response = await Service.GetAnalyticsScore();
  //       console.log("Analytics Score:", response.data);
  //     } catch (error) {
  //       console.error("Error fetching analytics score:", error);
  //     }
  //   };
  //   fetchAnalyticsScore();
  // }, []);

  // Fetch all tasks once on mount to populate the dashboard faster
  useEffect(() => {
    const fetchInitialTasks = async () => {
      try {
        const taskResponse = await Service.GetAllTask();
        let taskData = taskResponse?.data || taskResponse || [];
        if (typeof taskData === "object" && !Array.isArray(taskData)) {
          taskData = Object.values(taskData);
        }
        if (Array.isArray(taskData)) {
          setAllTasks(taskData);
        }
      } catch (error) {
        console.error("Error fetching initial tasks:", error);
      }
    };
    fetchInitialTasks();
  }, []);

  // Sync selectedComparisonTeams with selectedTeam (initial selection)
  useEffect(() => {
    if (selectedTeam && !selectedComparisonTeams.includes(selectedTeam)) {
      setSelectedComparisonTeams([selectedTeam]);
    }
  }, [selectedTeam]);

  // Fetch team stats (Reusable & Caching)
  const fetchTeamStats = useCallback(
    async (teamId) => {
      if (teamStatsCache.has(teamId)) {
        return teamStatsCache.get(teamId);
      }

      try {
        const response = await Service.GetTeamByID(teamId);
        if (!response?.data) return null;

        const teamData = response.data;
        const activeMembers = (teamData.members || []).filter(
          (member) => !member.is_disabled && !member.member?.is_disabled,
        );

        // Fetch all tasks if not already available
        let currentTasks = allTasks;
        if (currentTasks.length === 0) {
          const taskResponse = await Service.GetAllTask();
          // Handle various response formats
          currentTasks = taskResponse?.data || taskResponse || [];
          if (
            typeof currentTasks === "object" &&
            !Array.isArray(currentTasks)
          ) {
            currentTasks = Object.values(currentTasks);
          }

          if (!Array.isArray(currentTasks)) {
            currentTasks = [];
          }
          setAllTasks(currentTasks);
        }

        const memberStats = activeMembers.map((member) => {
          const userId = member.userId || member.member?.id || member.id;

          // Filter tasks for this user from the global task list
          const userTasks = currentTasks.filter((task) => {
            const taskUserId =
              task.user_id || task.user?.id || task.userId || task.assignedToId;
            return String(taskUserId) === String(userId);
          });

          // We assume Service.getUsersStats mostly returned tasks.
          // If there were other stats, we might need to adjust,
          // but currently the dashboard calculates everything from the task array.
          return {
            ...member,
            tasks: userTasks,
            id: userId,
            // Extract basic user info from the first task if member info is sparse
            firstName:
              member.member?.firstName ||
              userTasks[0]?.user?.firstName ||
              member.firstName,
            lastName:
              member.member?.lastName ||
              userTasks[0]?.user?.lastName ||
              member.lastName,
          };
        });

        const data = { members: activeMembers, memberStats };

        // Update cache
        setTeamStatsCache((prev) => new Map(prev).set(teamId, data));

        return data;
      } catch (error) {
        console.error("Error fetching team stats:", error);
        return null;
      }
    },
    [allTasks, teamStatsCache],
  );

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
        dateFilter,
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
      await Promise.all(
        selectedComparisonTeams.map(async (tid) => {
          const data = await fetchTeamStats(tid);
          if (data) teamDataMap[tid] = data;
        }),
      );

      // 2. Prepare date points based on timeFilter/DateRange
      const { start, end, format } = getDateRangeParams(
        timeFilter,
        analyticsDateRange,
      );
      const dataPoints = generateDatePoints(start, end, format);

      // 3. Compute efficiency per team per point
      const chartData = dataPoints.map((point) => {
        const pointData = { date: point.label, fullDate: point.date };

        selectedComparisonTeams.forEach((tid) => {
          const fetched = teamDataMap[tid];
          if (fetched) {
            const eff = calculateEfficiencyForPeriod(
              fetched.memberStats,
              point.start,
              point.end,
            );
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

  const getDateRangeParams = (
    filter,
    range,
  ) => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let format = "daily";

    if (filter === "1D") {
      start.setDate(now.getDate() - 1);
    } else if (filter === "1W") {
      start.setDate(now.getDate() - 7);
    } else if (filter === "1M") {
      start.setDate(now.getDate() - 30);
    } else if (filter === "1Y") {
      start.setFullYear(now.getFullYear() - 1);
      format = "monthly";
    } else if (filter === "ALL") {
      start = new Date("2023-01-01"); // Arbitrary start for 'ALL'
      format = "monthly";
    }

    // Override with state (which buttons should update)
    start = new Date(range.start);
    endDateToEndOfDay(start); // Start of day actually
    start.setHours(0, 0, 0, 0);

    end = new Date(range.end);
    endDateToEndOfDay(end);

    // Heuristic for format
    const diffDays = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    if (diffDays > 60) format = "monthly";

    return { start, end, format };
  };

  const endDateToEndOfDay = (date) => {
    date.setHours(23, 59, 59, 999);
  };

  const generateDatePoints = (start, end, format) => {
    const points = [];
    const current = new Date(start);

    while (current <= end) {
      if (format === "monthly") {
        // Logic for monthly buckets
        const monthStart = new Date(
          current.getFullYear(),
          current.getMonth(),
          1,
        );
        const monthEnd = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0,
        );
        points.push({
          label: monthStart.toLocaleString("default", {
            month: "short",
            year: "2-digit",
          }),
          date: monthStart.toISOString(), // Sortable/Key
          start: monthStart,
          end: monthEnd > end ? end : monthEnd,
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
          end: dayEnd,
        });
        // Next day
        current.setDate(current.getDate() + 1);
      }
    }
    return points;
  };

  const calculateEfficiencyForPeriod = (
    memberStats,
    periodStart,
    periodEnd,
  ) => {
    let totalAssigned = 0;
    let totalWorked = 0;

    memberStats?.forEach((member) => {
      const tasks = member.tasks || [];
      tasks.forEach((task) => {
        // Using Task Start Date for attribution as noted in Plan
        const taskDate = new Date(task.start_date || task.startDate);

        if (taskDate >= periodStart && taskDate <= periodEnd) {
          if (["COMPLETE", "VALIDATE_COMPLETED"].includes(task.status)) {
            // Only completed tasks count for efficiency? usually yes
            // --- Support for both old and new data structures ---
            const assigned = task.allocationLog?.allocatedHours
              ? parseFloat(task.allocationLog.allocatedHours)
              : task.hours
                ? parseFloat(task.hours)
                : parseDurationToMinutes(task.duration || "00:00:00") / 60;

            totalAssigned += assigned;

            // --- Support for duration_seconds (preferred) or duration (fallback) ---
            const worked = (task.workingHourTask || []).reduce(
              (sum, entry) => {
                if (entry.duration_seconds)
                  return sum + entry.duration_seconds / 3600;
                return sum + (entry.duration || 0) / 60;
              },
              0,
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

    if (tf === "1D") start.setDate(now.getDate() - 1);
    if (tf === "1W") start.setDate(now.getDate() - 7);
    if (tf === "1M") start.setDate(now.getDate() - 30);
    if (tf === "1Y") start.setFullYear(now.getFullYear() - 1);
    if (tf === "ALL") start = new Date("2023-01-01");

    setAnalyticsDateRange({
      start: start.toISOString().split("T")[0],
      end: now.toISOString().split("T")[0],
    });
  };

  // --- End New Logic ---

  const calculateTeamSummary = (filteredStats) => {
    try {
      const allFilteredTasks = filteredStats.flatMap((m) => {
        const userName =
          `${m.firstName || m.member?.firstName || ""} ${m.lastName || m.member?.lastName || ""}`.trim() ||
          "Unknown";
        return (m.tasks || []).map((t) => ({ ...t, userName }));
      });

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
          (sum, task) => {
            const h = task.allocationLog?.allocatedHours
              ? parseFloat(task.allocationLog.allocatedHours)
              : task.hours
                ? parseFloat(task.hours)
                : parseDurationToMinutes(task.duration || "00:00:00") / 60;
            return sum + h;
          },
          0,
        );
        return total + memberAssignedHours;
      }, 0);

      const totalWorkedHours = filteredStats.reduce((total, member) => {
        const memberWorkedHours = (member.tasks || [])
          .flatMap((task) => task.workingHourTask || [])
          .reduce((sum, entry) => {
            if (entry.duration_seconds)
              return sum + entry.duration_seconds / 3600;
            return sum + (entry.duration || 0) / 60;
          }, 0);
        return total + memberWorkedHours;
      }, 0);

      const totalTasks = filteredStats.reduce(
        (total, member) => total + (member.tasks?.length || 0),
        0,
      );

      const projectCount = uniqueProjects.length;

      // ── Task Type Counts ──
      const taskTypeCounts = {
        modelling: 0,
        modeling_checking: 0,
        detailing: 0,
        detail_checking: 0,
        erection: 0,
        erection_checking: 0,
      };

      const taskTypeDetails = {
        modelling: [],
        modeling_checking: [],
        detailing: [],
        detail_checking: [],
        erection: [],
        erection_checking: [],
      };

      allFilteredTasks.forEach((task) => {
        // Determine type based on wbsType (priority), wbsTemplate name, or task name/title
        const typeString = (
          task.wbsType ||
          task.wbsData?.name ||
          task.wbsTemplate?.name ||
          task.name ||
          task.title ||
          ""
        ).toLowerCase();

        if (
          typeString.includes("model checking") ||
          typeString.includes("checking model") ||
          typeString.includes("modeling_checking") ||
          typeString.includes("model_checking")
        ) {
          taskTypeCounts.modeling_checking++;
          taskTypeDetails.modeling_checking.push(task);
        } else if (
          typeString.includes("modelling") ||
          typeString.includes("modeling")
        ) {
          taskTypeCounts.modelling++;
          taskTypeDetails.modelling.push(task);
        } else if (
          typeString.includes("detailing_checking") ||
          typeString.includes("detail checking") ||
          typeString.includes("checking detailing")
        ) {
          taskTypeCounts.detail_checking++;
          taskTypeDetails.detail_checking.push(task);
        } else if (typeString.includes("detailing")) {
          taskTypeCounts.detailing++;
          taskTypeDetails.detailing.push(task);
        } else if (
          typeString.includes("erection_checking") ||
          typeString.includes("erection checking") ||
          typeString.includes("checking erection")
        ) {
          taskTypeCounts.erection_checking++;
          taskTypeDetails.erection_checking.push(task);
        } else if (typeString.includes("erection")) {
          taskTypeCounts.erection++;
          taskTypeDetails.erection.push(task);
        }
      });

      const completedTasks = filteredStats.reduce(
        (total, member) =>
          total +
          (member.tasks || []).filter((task) => task.status === "COMPLETE")
            .length,
        0,
      );

      const inProgressTasks = filteredStats.reduce(
        (total, member) =>
          total +
          (member.tasks || []).filter(
            (task) => task.status === "IN_PROGRESS",
          ).length,
        0,
      );

      const completedTasksList = filteredStats.flatMap((m) =>
        (m.tasks || []).filter((task) => task.status === "COMPLETE"),
      );

      const efficiencyAssignedHours = completedTasksList.reduce((sum, task) => {
        const h = task.allocationLog?.allocatedHours
          ? parseFloat(task.allocationLog.allocatedHours)
          : task.hours
            ? parseFloat(task.hours)
            : parseDurationToMinutes(task.duration || "00:00:00") / 60;
        return sum + h;
      }, 0);

      const efficiencyWorkedHours = completedTasksList
        .flatMap((task) => task.workingHourTask || [])
        .reduce((sum, entry) => {
          if (entry.duration_seconds)
            return sum + entry.duration_seconds / 3600;
          return sum + (entry.duration || 0) / 60;
        }, 0);

      let efficiency = 0;
      if (efficiencyWorkedHours > 0) {
        efficiency = Math.round(
          (efficiencyAssignedHours / efficiencyWorkedHours) * 100,
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
        taskTypeDetails,
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
        team.name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTeams(filtered);
  }, [searchTerm, teams]);

  const handleTeamSelect = (teamId) => setSelectedTeam(teamId);
  const handleMemberClick = (memberId) => setSelectedEmployee(memberId);
  const handleCloseModal = () => setSelectedEmployee(null);

  const getEfficiencyColorClass = (efficiency) => {
    if (efficiency >= 90) return "bg-green-100 text-black border-green-200";
    if (efficiency >= 70) return "bg-blue-100 text-black border-blue-200";
    if (efficiency >= 50) return "bg-yellow-100 text-black border-yellow-200";
    return "bg-red-100 text-black border-red-200";
  };

  const tableData = useMemo(() => {
    if (!teamMembers || !teamStats.memberStats) return [];

    return teamMembers
      .filter((member) => !member.is_disabled && !member.member?.is_disabled)
      .map((member, index) => {
        const user = member.member || {};
        const memberStat = teamStats.memberStats?.find(
          (stat) => stat.id === (member.userId || user.id || member.id),
        );

        const assignedHours =
          (memberStat?.tasks || []).reduce((sum, task) => {
            const h = task.allocationLog?.allocatedHours
              ? parseFloat(task.allocationLog.allocatedHours)
              : task.hours
                ? parseFloat(task.hours)
                : parseDurationToMinutes(task.duration || "00:00:00") / 60;
            return sum + h;
          }, 0) || 0;

        const workedHours =
          (memberStat?.tasks || [])
            .flatMap((task) => task.workingHourTask || [])
            .reduce((sum, entry) => {
              if (entry.duration_seconds)
                return sum + entry.duration_seconds / 3600;
              return sum + (entry.duration || 0) / 60;
            }, 0) || 0;

        const totalTasks = memberStat?.tasks?.length || 0;
        const completedTasks =
          (memberStat?.tasks || []).filter((task) =>
            [
              "COMPLETE",
              "USER_FAULT",
              "VALIDATE_COMPLETED",
              "VALIDATE_COMPLETED",
            ].includes(task.status?.toUpperCase()),
          ).length || 0;

        const memberCompletedTasks = (memberStat?.tasks || []).filter(
          (task) => task.status === "COMPLETE",
        );

        const efficiencyAssigned =
          memberCompletedTasks?.reduce((sum, task) => {
            const h = task.allocationLog?.allocatedHours
              ? parseFloat(task.allocationLog.allocatedHours)
              : task.hours
                ? parseFloat(task.hours)
                : parseDurationToMinutes(task.duration || "00:00:00") / 60;
            return sum + h;
          }, 0) || 0;

        const efficiencyWorked =
          memberCompletedTasks
            ?.flatMap((task) => task.workingHourTask || [])
            .reduce((sum, entry) => {
              if (entry.duration_seconds)
                return sum + entry.duration_seconds / 3600;
              return sum + (entry.duration || 0) / 60;
            }, 0) || 0;

        let efficiency = 0;
        if (efficiencyWorked > 0) {
          efficiency = Math.round(
            (efficiencyAssigned / efficiencyWorked) * 100,
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
      "PDF generation is currently being set up. Please try again later.",
    );
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-gray-50/50">
      <div className="bg-white rounded-md p-10 shadow-sm border border-black/20 min-h-full">
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
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
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
                {/* Premium Header Bar */}
                <div className="w-full bg-green-50/70 rounded-lg p-5 border border-[#6bbd45]/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">


                  <div className="relative z-10">
                    <h1 className="text-2xl font-semibold text-black tracking-tight uppercase">
                      {teams?.find((t) => t.id === selectedTeam)?.name ||
                        "Team Detail"}
                    </h1>
                  </div>

                  <div className="flex items-center gap-4 relative z-10">
                    <span className="px-6 py-2 bg-green-100 text-black font-semibold text-xs uppercase tracking-widest rounded-xl cursor-pointer hover:bg-black/10 transition-all border border-black">
                      Overview
                    </span>
                    <button
                      onClick={() => setIsViewModalOpen(true)}
                      className="px-6 py-2 bg-white text-black font-semibold text-xs uppercase tracking-widest rounded-xl cursor-pointer hover:bg-black/10 transition-all border border-black">
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
      </div>

      {/* Modals */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[98%] max-w-[95vw] h-[95vh] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative border border-white/20">
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[98%] max-w-[95vw] h-[95vh] rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-[98%] max-w-[95vw] h-[95vh] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden relative">

            <div className="max-h-[95vh] overflow-y-auto custom-scrollbar">
              <GetEmployeeByID id={selectedEmployee} />
            </div>
          </div>
        </div>
      )}

      <DailyWorkReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        members={teamStats.memberStats || []}
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
      case "week": {
        const weekStart = new Date(filter.weekStart);
        const weekEnd = new Date(filter.weekEnd);
        return taskStartDate <= weekEnd && taskEndDate >= weekStart;
      }
      case "month": {
        const monthStart = new Date(filter.year, filter.month, 1);
        const monthEnd = new Date(filter.year, filter.month + 1, 0);
        return taskStartDate <= monthEnd && taskEndDate >= monthStart;
      }
      case "year": {
        const yearStart = new Date(filter.year, 0, 1);
        const yearEnd = new Date(filter.year, 11, 31);
        return taskStartDate <= yearEnd && taskEndDate >= yearStart;
      }
      case "range": {
        const rangeStart = new Date(filter.year, filter.startMonth, 1);
        const rangeEnd = new Date(filter.year, filter.endMonth + 1, 0);
        return taskStartDate <= rangeEnd && taskEndDate >= rangeStart;
      }
      case "dateRange": {
        const startDate = new Date(filter.startDate);
        const endDate = new Date(filter.endDate);
        return taskStartDate <= endDate && taskEndDate >= startDate;
      }
      case "specificDate": {
        const specificDate = new Date(filter.date);
        return taskStartDate.toDateString() === specificDate.toDateString();
      }
      default:
        return true;
    }
  });
};

export default TeamDashboard;
