import { useEffect, useState, useMemo, Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import Service from "../../api/Service";
import { Calendar, Loader2, Clock, CheckCircle2, Briefcase } from "lucide-react";
import { setProjectData, updateProject } from "../../store/projectSlice";
import { setMilestonesForProject } from "../../store/milestoneSlice";

import ProjectDetailsModal from "./components/ProjectDetailsModal";
import MonthlyProjectStats from "./components/MonthlyProjectStats";
import ProjectListModal from "./components/ProjectListModal";

import { Button } from "../ui/button";
import FetchTaskByID from '../task/FetchTaskByID';

// Lazy load widgets
const UserStatsWidget = lazy(() => import('./components/UserStatsWidget'))
const CurrentTaskWidget = lazy(() => import('./components/CurrentTaskWidget'))
const UpcomingDeadlinesWidget = lazy(() => import('./components/UpcomingDeadlinesWidget'))
const PersonalNotesWidget = lazy(() => import('./components/PersonalNotesWidget'))

const ProjectDashboard = () => {
  const dispatch = useDispatch();
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );
  // const milestonesByProject = useSelector(
  //   (state) => state.milestoneInfo?.milestonesByProject || {}
  // ) <string, ProjectMilestone>;

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedProjectForModal, setSelectedProjectForModal] =
    useState(null);
  const [allTeams, setAllTeams] = useState([]);

  // Personal Stats State
  const [myTasks, setMyTasks] = useState([])
  const [projectNotes, setProjectNotes] = useState([])
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [userStats, setUserStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    allocatedHours: 0,
    workedHours: 0,
    projectsCount: 0,
    efficiency: 0
  })

  // List Modal State
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [listModalProjects, setListModalProjects] = useState([]);
  const [listModalStatus, setListModalStatus] = useState("");

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

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, []);

  const parseDurationToHours = (duration) => {
    if (!duration) return 0
    if (typeof duration === 'number') return duration

    // Handle formats like "10:30", "10h 30m", "10"
    const parts = String(duration).split(/[:\s]+/)
    let hours = 0
    let minutes = 0

    if (parts.length >= 1) {
      hours = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
    }
    if (parts.length >= 2) {
      minutes = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
    }

    return hours + minutes / 60
  }

  const calculateHours = (task) => {
    // Try allocationLog first as it's the source for planned hours
    let allocated = 0
    if (task.allocationLog?.allocatedHours) {
      allocated = parseDurationToHours(task.allocationLog.allocatedHours)
    } else if (task.duration) {
      allocated = parseDurationToHours(task.duration)
    } else if (task.hours) {
      allocated = Number(task.hours) || 0
    }

    const worked =
      (task.workingHourTask || []).reduce(
        (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
        0
      ) / 3600
    return { allocated, worked }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes, teamsRes, pmDashboardRes, myTasksRes] = await Promise.all([
        Service.GetAllProjects(),
        Service.GetAllTask(),
        Service.AllTeam(),
        Service.GetPMDashboard(),
        Service.GetMyTask(),
      ]);

      console.log("PM Dashboard Data Integration:", pmDashboardRes);

      if (teamsRes) {
        setAllTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes.data || []);
      }

      if (tasksRes?.data) {
        setAllTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      }

      // Process My Tasks for Widgets
      if (myTasksRes?.data) {
        const fetchedTasks = Array.isArray(myTasksRes.data)
          ? myTasksRes.data
          : Object.values(myTasksRes.data || {})

        setMyTasks(fetchedTasks)

        // Calculate Stats
        let totalAllocated = 0
        let totalWorked = 0
        const completed = fetchedTasks.filter((t) => t.status === 'COMPLETED').length
        const projectIds = new Set()

        fetchedTasks.forEach((t) => {
          const { allocated, worked } = calculateHours(t)
          totalAllocated += allocated
          totalWorked += worked
          if (t.project?.id) projectIds.add(t.project.id)
        })

        setUserStats({
          totalTasks: fetchedTasks.length,
          completedTasks: completed,
          pendingTasks: fetchedTasks.length - completed,
          allocatedHours: totalAllocated,
          workedHours: totalWorked,
          projectsCount: projectIds.size,
          efficiency: totalWorked > 0 ? Math.round((totalAllocated / totalWorked) * 100) : 0
        })

        // Fetch Notes for unique projects
        const notesPromises = Array.from(projectIds).map((id) => Service.GetProjectNotes(id))
        const allNotesResponses = await Promise.all(notesPromises)
        const flattenedNotes = allNotesResponses.flat().filter(Boolean)
        setProjectNotes(flattenedNotes)
      }

      if (projectsRes?.data) {
        dispatch(setProjectData(projectsRes.data));

        // Fetch full details and milestones for each project to get submittals and accurate progress
        const detailPromises = projectsRes.data.map(async (p) => {
          try {
            const [milestonesRes, projectRes] = await Promise.all([
              Service.GetProjectMilestoneById(p.id),
              Service.GetProjectById(p.id),
            ]);

            if (milestonesRes?.data) {
              dispatch(
                setMilestonesForProject({
                  projectId: p.id,
                  milestones: milestonesRes.data,
                })
              );
            }

            if (projectRes?.data) {
              dispatch(updateProject(projectRes.data));
            }
          } catch (err) {
            console.error(`Error fetching details for project ${p.id}:`, err);
          }
        });

        await Promise.all(detailPromises);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const currentTask = useMemo(() => myTasks.find((t) => t.status === 'IN_PROGRESS'), [myTasks])

  const projectsWithStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = allTasks.filter(
        (task) => task.project_id === project.id
      );

      const workedSeconds = projectTasks.reduce((sum, task) => {
        const taskSeconds = (task.workingHourTask || []).reduce(
          (tSum, wht) => tSum + (wht.duration_seconds || 0),
          0
        );
        return sum + taskSeconds;
      }, 0);

      const estimatedHours = project.estimatedHours || 0;
      const workedHours = workedSeconds / 3600;
      const isOverrun = workedHours > estimatedHours && estimatedHours > 0;

      return {
        ...project,
        workedSeconds,
        workedHours, // Keep for backward compatibility if needed
        isOverrun,
      };
    });
  }, [projects, allTasks]);

  const filteredProjects = useMemo(() => {
    return projectsWithStats.filter((project) => {
      if (selectedYear === null) return true;

      const projectDate = new Date(project.startDate);
      const matchesYear = projectDate.getFullYear() === selectedYear;
      const matchesMonth =
        selectedMonth === null || projectDate.getMonth() === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }, [projectsWithStats, selectedYear, selectedMonth]);

  // Group projects by Team
  const projectsByTeam = useMemo(() => {
    const stages = ["IFA", "IFC", "CO#"];
    const grouped = {};

    filteredProjects.forEach((project) => {
      const teamId = project.team?.id || "unassigned";
      const teamName = project.team?.name || "Unassigned";

      if (!grouped[teamId]) {
        grouped[teamId] = {
          teamName,
          projects: [],
          totalSeconds: 0,
          stats: {
            IFA: { active: 0, onHold: 0, completed: 0, total: 0 },
            IFC: { active: 0, onHold: 0, completed: 0, total: 0 },
            "CO#": { active: 0, onHold: 0, completed: 0, total: 0 },
          },
        };
      }

      grouped[teamId].projects.push(project);
      grouped[teamId].totalSeconds += project.workedSeconds || 0;

      const stage = project.stage;
      if (stages.includes(stage)) {
        const s = stage;
        grouped[teamId].stats[s].total += 1;
        if (project.status === "ACTIVE") grouped[teamId].stats[s].active += 1;
        else if (project.status === "ON_HOLD")
          grouped[teamId].stats[s].onHold += 1;
        else if (project.status === "COMPLETED")
          grouped[teamId].stats[s].completed += 1;
      }
    });

    return grouped;
  }, [filteredProjects]);

  const handleStatClick = (
    projects,
    stage,
    status
  ) => {
    let filtered = projects.filter((p) => p.stage === stage);
    if (status !== "TOTAL") {
      filtered = filtered.filter((p) => p.status === status);
    }
    setListModalProjects(filtered);
    setListModalStatus(`${stage} - ${status.replace("_", " ")}`);
    setIsListModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-700">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-green-600" />
        <p className="text-lg font-medium">Loading Dashboard Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 laptop-fit">
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-100 rounded-xl" />}>
        {/* Personal Stats Section */}
        <div className="flex flex-col gap-8">
          {/* Stats Overview */}
          <UserStatsWidget stats={userStats} loading={loading} />

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Left Column (Focus) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-green-50 rounded-[4px]">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Current Focus
                </h3>
              </div>
              <CurrentTaskWidget
                task={currentTask}
                onTaskUpdate={() => setDetailTaskId(currentTask?.id)}
              />
            </div>

            {/* Middle Column (Deadlines) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-blue-50 rounded-[4px]">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Upcoming Deadlines
                </h3>
              </div>
              <UpcomingDeadlinesWidget
                tasks={myTasks}
                onTaskClick={(id) => setDetailTaskId(id)}
              />
            </div>

            {/* Right Column (Notes) */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-1">
                <div className="p-1.5 bg-amber-50 rounded-[4px]">
                  <Briefcase className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Notes & Updates
                </h3>
              </div>
              <PersonalNotesWidget projectNotes={projectNotes} />
            </div>
          </div>
        </div>
      </Suspense>

      {/* Task Detail Modal */}
      {detailTaskId && (
        <FetchTaskByID
          id={detailTaskId}
          onClose={() => setDetailTaskId(null)}
          refresh={fetchDashboardData}
        />
      )}

      {/* Filters Header */}
      <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mt-8">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedYear === null ? "all" : selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "all" ? null : parseInt(e.target.value)
                )
              }
              className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm md:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors w-full md:w-auto"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          </div>
          <div className="flex-1 w-full md:w-auto min-w-0">
            {/* Mobile Month Dropdown */}
            <div className="md:hidden relative w-full">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={selectedMonth === null ? "all" : selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value === "all" ? null : parseInt(e.target.value)
                  )
                }
                className="pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-gray-100 transition-colors w-full"
              >
                <option value="all">All Months</option>
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Desktop Month Buttons */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              <Button
                onClick={() => setSelectedMonth(null)}
                className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap h-auto ${selectedMonth === null
                  ? "bg-green-600 text-white shadow-md shadow-green-100 hover:bg-green-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-none"
                  }`}
              >
                All Months
              </Button>
              {months.map((month, index) => (
                <Button
                  key={month}
                  onClick={() => setSelectedMonth(index)}
                  className={`px-3 md:px-4 py-1 md:py-1.5 rounded-full text-sm md:text-base font-semibold transition-all whitespace-nowrap h-auto ${selectedMonth === index
                    ? "bg-green-600 text-white shadow-md shadow-green-100 hover:bg-green-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-none"
                    }`}
                >
                  {month}
                </Button>
              ))}
            </div>
          </div>
        </div>


      </div>

      {/* Monthly Workload Stats */}
      <MonthlyProjectStats
        tasks={allTasks}
        projects={projectsWithStats}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        teams={allTeams}
        projectsByTeam={projectsByTeam}
        handleStatClick={handleStatClick}
      />

      {/* Project Timeline Calendar */}
      {/* <ProjectCalendar projects={projects} tasks={allTasks} /> */}

      <ProjectListModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        status={listModalStatus}
        projects={listModalProjects}
        onProjectSelect={(project) => {
          setSelectedProjectForModal(project);
          // setIsListModalOpen(false); // Optional: close list modal when opening details
        }}
      />

      <ProjectDetailsModal
        project={selectedProjectForModal}
        onClose={() => setSelectedProjectForModal(null)}
      />
    </div>
  );
};
//added
export default ProjectDashboard;

const ChevronDown = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 9l-7 7-7-7"
    />
  </svg>
);
