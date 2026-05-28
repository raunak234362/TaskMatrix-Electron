/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DataTable from "../ui/table";
import Modal from "../ui/Modal";
import { Filter, Search, FileText, File } from "lucide-react";
import Service from "../../api/Service";
import DateFilter from "../common/DateFilter";
import { matchesDateFilter } from "../../utils/dateFilter";
import RenderFiles from "../common/RenderFiles";

const GetProjectById = React.lazy(() =>
  import("./GetProjectById").then((module) => ({ default: module.default }))
);

const AllProjects = ({ statusFilter: statusFilterProp, setStatusFilter: setStatusFilterProp }) => {
  const [selectedProject, setSelectedProject] = useState(null);
  const [localStatusFilter, localSetStatusFilter] = useState("All Statuses");
  const statusFilter = statusFilterProp !== undefined ? statusFilterProp : localStatusFilter;
  const setStatusFilter = setStatusFilterProp || localSetStatusFilter;
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({
    manager: "All Managers",
    fabricator: "All Fabricators",
    stage: "All Stages",
    overrunOnly: false,
    searchTerm: "",
  });
const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [dateFilter, setDateFilter] = useState({
    type: "all",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  const [fabricatorDetails, setFabricatorDetails] = useState(null);
  const [loadingFab, setLoadingFab] = useState(false);

  const fabricatorList = useSelector(
    (state) => state.fabricatorInfo?.fabricatorData || []
  );

  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETE").length,
    onHold: projects.filter((p) => p.status === "ONHOLD").length,
    inActive: projects.filter((p) => p.status === "INACTIVE").length,
  }), [projects]);

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

  useEffect(() => {
    const fetchFabricatorDetails = async () => {
      if (filters.fabricator && filters.fabricator !== "All Fabricators") {
        const fab = fabricatorList.find(f => f.fabName === filters.fabricator);
        if (fab) {
          try {
            setLoadingFab(true);
            const response = await Service.GetFabricatorByID(fab.id || fab._id);
            setFabricatorDetails(response?.data || null);
          } catch (error) {
            console.error("Error fetching fabricator details:", error);
            setFabricatorDetails(null);
          } finally {
            setLoadingFab(false);
          }
        } else {
          setFabricatorDetails(null);
        }
      } else {
        setFabricatorDetails(null);
      }
    };
    fetchFabricatorDetails();
  }, [filters.fabricator, fabricatorList]);

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
        filters.searchTerm &&
        !project.name?.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
        return false;

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
      if (
        statusFilter !== "All Statuses" &&
        project.status !== statusFilter
      )
        return false;
      if (filters.overrunOnly && !isOverrun) return false;

      // Filter by Date (assuming created_on as default)
      if (!matchesDateFilter(project.created_on, dateFilter)) return false;

      return true;
    });
  }, [projects, filters, tasks, dateFilter, statusFilter]);

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
        <span className="font-medium text-gray-600 uppercase">
          {row.original.fabricator?.fabName || "N/A"}
        </span>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="text-gray-600 font-medium">
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
            className={`text-xs uppercase font-bold tracking-wide px-2 py-1 rounded-sm ${isOverrun ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-700"
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
      cell: ({ row }) => {
        const status = row.original.status;
        let colorClasses = "bg-gray-100 text-gray-700 border-gray-300";
        if (status === 'ACTIVE') {
          colorClasses = "bg-blue-100 text-blue-700 border-blue-300";
        } else if (status === 'COMPLETE' || status === 'COMPLETED') {
          colorClasses = "bg-green-100 text-green-700 border-green-300";
        } else if (status === 'ONHOLD') {
          colorClasses = "bg-red-100 text-red-900 border-red-300";
        } else if (status === 'INACTIVE') {
          colorClasses = "bg-yellow-100 text-yellow-700 border-yellow-300";
        }

        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide border shadow-sm ${colorClasses}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  const handleRowClick = (row) => {
    setSelectedProject(row);
  };

  return (
    <div className="bg-[#fcfdfc] min-h-[600px] animate-in fade-in duration-700 flex flex-col gap-4 pt-6">
      {/* Filters Section */}
      <div className="mb-2">

        <div className="flex flex-wrap items-end gap-5">
          {/* Search Project Name */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[250px]">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Search Project</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all placeholder:text-gray-500 placeholder:font-normal shadow-sm"
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              />
            </div>
          </div>

          {/* Manager Filter */}
          {userRole !== "project_manager" && (
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Manager</label>
            <select
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
              value={filters.manager}
              onChange={(e) => setFilters(prev => ({ ...prev, manager: e.target.value }))}
            >
              {managers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          )}
          {/* Fabricator Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Fabricator</label>
            <select
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
              value={filters.fabricator}
              onChange={(e) => setFilters(prev => ({ ...prev, fabricator: e.target.value }))}
            >
              {fabricators.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Stage Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Stage</label>
            <select
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
              value={filters.stage}
              onChange={(e) => setFilters(prev => ({ ...prev, stage: e.target.value }))}
            >
              {stages.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Overrun Checkbox */}
          <div className="flex items-center gap-2 pb-2 pl-1">
            <input
              type="checkbox"
              id="overrunOnly"
              checked={filters.overrunOnly}
              onChange={(e) => setFilters(prev => ({ ...prev, overrunOnly: e.target.checked }))}
              className="w-4 h-4 text-green-600 rounded focus:ring-green-600 border-gray-300 cursor-pointer"
            />
            <label htmlFor="overrunOnly" className="text-sm font-semibold text-gray-900 cursor-pointer select-none">
              Overrun Only
            </label>
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Date Period</label>
            <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
          </div>
        </div>

        {/* Fabricator Detailing Standards Section */}
        {filters.fabricator !== "All Fabricators" && fabricatorDetails && (
          <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <FileText size={16} className="text-green-600" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                  {filters.fabricator}'s Detailing Standards
                </h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                  Reference documents for technical compliance
                </p>
              </div>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {fabricatorDetails.files && fabricatorDetails.files.length > 0 ? (
                <RenderFiles 
                  files={fabricatorDetails.files} 
                  table="fabricator" 
                  parentId={fabricatorDetails.id || fabricatorDetails._id} 
                  hideHeader={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest italic">
                    No detailing standards uploaded for this partner
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
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
