/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DataTable from "../ui/table";
import Modal from "../ui/Modal";
import { Filter } from "lucide-react";
import Service from "../../api/Service";
import DateFilter from "../common/DateFilter";
import { matchesDateFilter } from "../../utils/dateFilter";

const GetProjectById = React.lazy(() =>
  import("./GetProjectById").then((module) => ({ default: module.default }))
);

const AllProjects = () => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    manager: "All Managers",
    fabricator: "All Fabricators",
    stage: "All Stages",
    overrunOnly: false,
  });
const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [dateFilter, setDateFilter] = useState({
    type: "all",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await Service.GetAllTask();
        if (data) {
          const taskList = Array.isArray(data) ? data : (data.data || []);
          setTasks(taskList);
        }
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, []);

  // --- Derive Unique Filter Options ---
  const managers = useMemo(() => {
    const list = projects
      .map((p) =>
        p.manager
          ? `${p.manager.firstName || ""} ${p.manager.lastName || ""}`.trim()
          : "Unassigned"
      )
      .filter(Boolean);
    return ["All Managers", ...new Set(list)];
  }, [projects]);

  const fabricators = useMemo(() => {
    const list = projects
      .map((p) => p.fabricator?.fabName || "Unassigned")
      .filter(Boolean);
    return ["All Fabricators", ...new Set(list)];
  }, [projects]);

  const stages = useMemo(() => {
    const list = projects
      .map((p) => p.stage || "Unknown")
      .filter(Boolean);
    return ["All Stages", ...new Set(list)];
  }, [projects]);

  // --- Filter Logic ---
  const filteredProjects = useMemo(() => {
    return projects.map(project => {
      // Calculate worked hours for this project
      const projectTasks = tasks.filter(t => {
        const taskProjectId = t.project?.id || t.project_id || (typeof t.project === 'string' ? t.project : null);
        return taskProjectId === project.id;
      });
      const workedHours = projectTasks.reduce((total, task) => {
        const taskWorked = (task.workingHourTask || []).reduce(
          (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
          0
        ) / 3600;
        return total + taskWorked;
      }, 0);

      return {
        ...project,
        workedHours // Add calculated worked hours to the project object
      };
    }).filter((project) => {
      const managerName = project.manager
        ? `${project.manager.firstName || ""} ${project.manager.lastName || ""}`.trim()
        : "Unassigned";
      const fabName = project.fabricator?.fabName || "Unassigned";
      const stage = project.stage || "Unknown";

      const estHours = Number(project.estimatedHours) || 0;
      const workedHours = Number(project.workedHours) || 0;
      const isOverrun = workedHours > estHours && estHours > 0;

      if (
        filters.manager !== "All Managers" &&
        managerName !== filters.manager
      )
        return false;
      if (
        filters.fabricator !== "All Fabricators" &&
        fabName !== filters.fabricator
      )
        return false;
      if (filters.stage !== "All Stages" && stage !== filters.stage)
        return false;
      if (filters.overrunOnly && !isOverrun) return false;

      // Filter by Date (assuming created_on as default)
      if (!matchesDateFilter(project.created_on, dateFilter)) return false;

      return true;
    });
  }, [projects, filters, tasks, dateFilter]);

  // --- Column Definitions ---
  const columns = [

    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <span className="font-semibold text-gray-800">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "fabricator",
      header: "Fabricator Name",
      cell: ({ row }) => (
        <span className="text-sm font-medium text-gray-600 uppercase">
          {row.original.fabricator?.fabName || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="text-gray-600 text-sm font-medium">
          {row.original.stage || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "estimatedHours",
      header: "Est. Hours",
      cell: ({ row }) => (
        <span className="text-gray-800 font-semibold">
          {row.original.estimatedHours ? `${row.original.estimatedHours}h` : "0h"}
        </span>
      ),
    },
    {
      id: "workedHours",
      header: "Worked Hours",
      cell: ({ row }) => {
        const worked = row.original.workedHours || 0;
        const hours = Math.floor(worked);
        const minutes = Math.round((worked - hours) * 60);
        const display = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        return (
          <span className={`font-black ${worked > (row.original.estimatedHours || 0) ? "text-red-600" : "text-black"}`}>
            {display}
          </span>
        );
      },
    },
    {
      id: "overrun",
      header: "Overrun",
      cell: ({ row }) => {
        const est = Number(row.original.estimatedHours) || 0;
        const worked = Number(row.original.workedHours) || 0;
        const isOverrun = worked > est && est > 0;
        return (
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-sm ${isOverrun ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
              }`}
          >
            {isOverrun ? "OVERRUN" : "NORMAL"}
          </span>
        );
      },
    },
    // {
    //   id: "progress",
    //   header: "Progress",
    //   cell: ({ row }) => {
    //     const est = Number(row.original.estimatedHours) || 0;
    //     const worked = Number(row.original.workedHours) || 0;
    //     let percent = est > 0 ? (worked / est) * 100 : 0;
    //     if (percent > 100) percent = 100;

    //     return (
    //       <div className="w-24">
    //         <div className="flex justify-between text-[10px] mb-1 font-bold text-gray-400">
    //           <span>{Math.round(percent)}% UTILIZED</span>
    //         </div>
    //         <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
    //           <div
    //             className={`h-full rounded-full ${worked > est ? "bg-red-500" : "bg-orange-500"}`}
    //             style={{ width: `${percent}%` }}
    //           />
    //         </div>
    //       </div>
    //     )
    //   }
    // },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${row.original.status === 'ACTIVE'
            ? 'bg-green-100 text-black'
            : row.original.status === 'COMPLETED'
              ? 'bg-blue-100 text-black shadow-sm'
              : 'bg-orange-100 text-black shadow-sm'
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
  ];

  const handleRowClick = (row) => {
    setSelectedProject(row);
  };

  return (
    <div className="bg-[#fcfdfc] min-h-[600px] animate-in fade-in duration-700 flex flex-col gap-4">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Filters</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Manager Filter */}
          {userRole !== "project_manager" && (
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manager</label>
            <select
              className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              value={filters.manager}
              onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
            >
              {managers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          )}
          {/* Fabricator Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fabricator</label>
            <select
              className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              value={filters.fabricator}
              onChange={(e) => setFilters(prev => ({ ...prev, fabricator: e.target.value }))}
            >
              {fabricators.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stage</label>
            <select
              className="w-full text-sm font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
              value={filters.stage}
              onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Overrun Checkbox */}
          <div className="flex items-center gap-2 pb-2 pl-2">
            <input
              type="checkbox"
              id="overrunOnly"
              checked={filters.overrunOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, overrunOnly: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-500 border-gray-300 cursor-pointer"
            />
            <label htmlFor="overrunOnly" className="text-sm font-bold text-gray-600 cursor-pointer select-none">
              Overrun Only
            </label>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Period</label>
            <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProjects}
        onRowClick={handleRowClick}
        disablePagination={true}
      />

      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title="Project Details"
          width="max-w-7xl"
          hideHeader={true}
        >
          <Suspense fallback={<div className="p-4 text-center">Loading project details...</div>}>
            <GetProjectById
              id={selectedProject.id ?? selectedProject.fabId ?? ""}
              onClose={() => setSelectedProject(null)}
            />
          </Suspense>
        </Modal>
      )}
    </div>
  );
};

export default AllProjects;
