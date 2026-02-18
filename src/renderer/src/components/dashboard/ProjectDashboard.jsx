import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import Service from "../../api/Service";
import { Calendar, Loader2 } from "lucide-react";
import { setProjectData, updateProject } from "../../store/projectSlice";
import { setMilestonesForProject } from "../../store/milestoneSlice";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import MonthlyProjectStats from "./components/MonthlyProjectStats";
import ProjectListModal from "./components/ProjectListModal";

import { Button } from "../ui/button";

const ProjectDashboard = () => {
  const dispatch = useDispatch();
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || [],
  );

  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedProjectForModal, setSelectedProjectForModal] =
    useState(null);
  const [allTeams, setAllTeams] = useState([]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [projectsRes, tasksRes, teamsRes] = await Promise.all([
        Service.GetAllProjects(),
        Service.GetAllTask(),
        Service.AllTeam(),
      ]);

      if (teamsRes) {
        setAllTeams(Array.isArray(teamsRes) ? teamsRes : teamsRes.data || []);
      }

      if (tasksRes?.data) {
        setAllTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
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
                }),
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

  const projectsWithStats = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = allTasks.filter(
        (task) => task.project_id === project.id,
      );

      const workedSeconds = projectTasks.reduce((sum, task) => {
        const taskSeconds = (task.workingHourTask || []).reduce(
          (tSum, wht) => tSum + (wht.duration_seconds || 0),
          0,
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
    status,
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
      {/* Filters Header */}
      <div className="bg-white p-3 md:p-4 rounded-2xl border border-green-500/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedYear === null ? "all" : selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "all" ? null : parseInt(e.target.value),
                )
              }
              className="pl-10 pr-8 py-2 bg-white border border-green-500/20 rounded-xl text-sm md:text-lg font-medium text-gray-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-green-50 transition-colors w-full md:w-auto"
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
                    e.target.value === "all" ? null : parseInt(e.target.value),
                  )
                }
                className="pl-10 pr-8 py-2 bg-white border border-green-500/20 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-green-50 transition-colors w-full"
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
                    : "bg-green-50 text-gray-700 hover:bg-green-100"
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
                      : "bg-green-50 text-gray-700 hover:bg-green-100"
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
