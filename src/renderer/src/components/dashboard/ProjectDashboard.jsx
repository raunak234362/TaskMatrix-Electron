import { useEffect, useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import Service from "../../api/Service";
import { Calendar, Loader2, ChevronLeft } from "lucide-react";
import { setProjectData, updateProject } from "../../store/projectSlice";
import { setMilestonesForProject } from "../../store/milestoneSlice";
import ProjectDetailsModal from "./components/ProjectDetailsModal";
import MonthlyProjectStats from "./components/MonthlyProjectStats";
import ProjectListModal from "./components/ProjectListModal";

import { Button } from "../ui/button";

const ProjectDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  const projectStats = useMemo(() => {
    return projects.reduce(
      (acc, p) => {
        acc.total++;
        if (p.status === "ACTIVE") acc.active++;
        else if (p.status === "COMPLETED") acc.completed++;
        else if (p.status === "ONHOLD") acc.onHold++;
        return acc;
      },
      { total: 0, active: 0, completed: 0, onHold: 0 },
    );
  }, [projects]);

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
      const projectDate = new Date(project.startDate);

      const matchesYear =
        selectedYear === null ||
        selectedYear === undefined ||
        projectDate.getFullYear() === selectedYear;

      const matchesMonth =
        selectedMonth === null ||
        selectedMonth === undefined ||
        projectDate.getMonth() === selectedMonth;

      return matchesYear && matchesMonth;
    });
  }, [projectsWithStats, selectedYear, selectedMonth]);

  // Group projects by Team
  const projectsByTeam = useMemo(() => {
    const stages = ["IFA", "IFC", "COR"];
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
            COR: { active: 0, onHold: 0, completed: 0, total: 0 },
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
        else if (project.status === "ONHOLD")
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
    let filtered = stage === "ALL" ? projects : projects.filter((p) => p.stage === stage);
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
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      {/* Filters Header */}
      <div className="shrink-0 mb-2 bg-white p-2 md:p-3 rounded-xl border border-black/5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-2 md:gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4 flex-1">
          <div className="relative min-w-[140px]">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <select
              value={selectedYear === null ? "all" : selectedYear}
              onChange={(e) =>
                setSelectedYear(
                  e.target.value === "all" ? null : parseInt(e.target.value),
                )
              }
              className="pl-8 pr-6 py-1.5 bg-white border border-black/10 rounded-lg text-xs md:text-sm font-bold text-black focus:ring-1 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-green-50 transition-colors w-full"
            >
              <option value="all">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Mobile Month Dropdown */}
            <div className="md:hidden relative w-full">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <select
                value={selectedMonth === null ? "all" : selectedMonth}
                onChange={(e) =>
                  setSelectedMonth(
                    e.target.value === "all" ? null : parseInt(e.target.value),
                  )
                }
                className="pl-8 pr-6 py-1.5 bg-white border border-black/10 rounded-lg text-xs font-bold text-black focus:ring-1 focus:ring-green-500 outline-none appearance-none cursor-pointer hover:bg-green-50 transition-colors w-full"
              >
                <option value="all">All Months</option>
                {months.map((month, index) => (
                  <option key={month} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5 pointer-events-none" />
            </div>

            {/* Desktop Month Buttons */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              <Button
                onClick={() => setSelectedMonth(null)}
                className={`px-3 py-1 rounded-lg text-xs lg:text-sm font-bold transition-all whitespace-nowrap h-8 ${selectedMonth === null
                  ? "bg-green-200 text-black border border-black/10"
                  : "bg-gray-50 text-gray-600 border border-transparent hover:bg-green-50"
                  }`}
              >
                All Months
              </Button>
              {months.map((month, index) => (
                <Button
                  key={month}
                  onClick={() => setSelectedMonth(index)}
                  className={`px-3 py-1 rounded-lg text-xs lg:text-sm font-bold transition-all whitespace-nowrap h-8 ${selectedMonth === index
                    ? "bg-green-200 text-black border border-black/10"
                    : "bg-gray-50 text-gray-600 border border-transparent hover:bg-green-50"
                    }`}
                >
                  {month}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
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
      </div>

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
