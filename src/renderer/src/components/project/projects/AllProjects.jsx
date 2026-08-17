/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DataTable from "../../ui/table";
import Modal from "../../ui/Modal";
import { Search, FileText, ChevronDown, Loader2 } from "lucide-react";
import Service from "../../../api/Service";
import DateFilter from "../../common/DateFilter";
import { matchesDateFilter } from "../../../utils/dateFilter";
import RenderFiles from "../../common/RenderFiles";

const GetProjectById = React.lazy(() =>
  import("../GetProjectById").then((module) => ({ default: module.default }))
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

  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [projectList, setProjectList] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  const [fabricatorDetails, setFabricatorDetails] = useState(null);
  const [loadingFab, setLoadingFab] = useState(false);

  const [managerOptions, setManagerOptions] = useState(["All Managers"]);
  const [fabricatorOptions, setFabricatorOptions] = useState(["All Fabricators"]);
  const stageOptions = ["All Stages", "IFA", "IFC", "RIFA", "RIFC", "COR"];

  const [fabSearchQuery, setFabSearchQuery] = useState("");
  const [isFabDropdownOpen, setIsFabDropdownOpen] = useState(false);
  const fabDropdownRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (fabDropdownRef.current && !fabDropdownRef.current.contains(event.target)) {
        setIsFabDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  // Fetch Filter Options
  useEffect(() => {
    const fetchManagerOptions = async () => {
      try {
        const roles = ["ADMIN", "PROJECT_MANAGER", "OPERATION_EXECUTIVE", "DEPUTY_MANAGER", "DEPT_MANAGER"];
        const responses = await Promise.all(roles.map(r => Service.FetchEmployeeByRole(r)));
        
        const managersSet = new Set();
        responses.forEach(res => {
          let arr = [];
          if (Array.isArray(res)) arr = res;
          else if (res?.employees && Array.isArray(res.employees)) arr = res.employees;
          else if (res?.data?.employees && Array.isArray(res.data.employees)) arr = res.data.employees;
          else if (res?.data && Array.isArray(res.data)) arr = res.data;

          arr.forEach(p => {
             const name = `${p.firstName || ""} ${p.lastName || ""}`.trim();
             if (name) managersSet.add(name);
          });
        });
        setManagerOptions(["All Managers", ...Array.from(managersSet)]);
      } catch (err) {
        console.error("Failed to fetch managers", err);
      }
    };

    fetchManagerOptions();
    handleFetchFabricatorOptions();
  }, []);

  const handleFetchFabricatorOptions = async (search = "") => {
    try {
      const res = await Service.GetAllFabricators(1, 100, search);
      let fabs = [];
      if (Array.isArray(res)) fabs = res;
      else if (res?.data && Array.isArray(res.data)) fabs = res.data;
      else if (res?.data?.data && Array.isArray(res.data.data)) fabs = res.data.data;
      else if (res?.fabricators && Array.isArray(res.fabricators)) fabs = res.fabricators;

      const fabNames = fabs.map(f => f.fabName || f.name).filter(Boolean);
      setFabricatorOptions(["All Fabricators", ...new Set(fabNames)]);
    } catch (err) {
      console.error("Failed to fetch fabricators", err);
    }
  };

  const filteredFabricatorOptions = useMemo(() => {
    if (!fabSearchQuery.trim()) return fabricatorOptions;
    return fabricatorOptions.filter((f) =>
      f.toLowerCase().includes(fabSearchQuery.toLowerCase())
    );
  }, [fabricatorOptions, fabSearchQuery]);

  // Fetch paginated projects
  useEffect(() => {
    setIsLoadingProjects(true);
    const fetchPaginatedProjects = async () => {
      try {

        let startDateStr = "";
        let endDateStr = "";

        if (dateFilter && dateFilter.type !== "all") {
          const type = dateFilter.type;
          
          const formatLocal = (d) => {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          };

          if (type === "month") {
            const y = dateFilter.year;
            const m = dateFilter.month;
            if (y && m !== undefined) {
              startDateStr = formatLocal(new Date(y, m, 1));
              endDateStr = formatLocal(new Date(y, m + 1, 0));
            }
          } else if (type === "year") {
            const y = dateFilter.year;
            if (y) {
              startDateStr = `${y}-01-01`;
              endDateStr = `${y}-12-31`;
            }
          } else if (type === "week") {
            if (dateFilter.weekStart && dateFilter.weekEnd) {
              startDateStr = formatLocal(new Date(dateFilter.weekStart));
              endDateStr = formatLocal(new Date(dateFilter.weekEnd));
            }
          } else if (type === "range") {
            const y = dateFilter.year;
            const startM = dateFilter.startMonth;
            const endM = dateFilter.endMonth;
            if (y && startM !== undefined && endM !== undefined) {
              startDateStr = formatLocal(new Date(y, startM, 1));
              endDateStr = formatLocal(new Date(y, endM + 1, 0));
            }
          } else if (type === "dateRange") {
            if (dateFilter.startDate && dateFilter.endDate) {
              startDateStr = formatLocal(new Date(dateFilter.startDate));
              endDateStr = formatLocal(new Date(dateFilter.endDate));
            }
          } else if (type === "specificDate") {
            if (dateFilter.date) {
              startDateStr = formatLocal(new Date(dateFilter.date));
              endDateStr = startDateStr;
            }
          }
        }

        const response = await Service.GetAllProjects(
          currentPage, 
          limit, 
          filters.searchTerm, 
          filters.manager, 
          filters.fabricator, 
          filters.stage, 
          startDateStr,
          endDateStr
        );
        if (response) {
          let list = [];
          let totalP = 1;

          if (response.status === "success" && Array.isArray(response.data)) {
            list = response.data;
            const meta = response.meta || {};
            totalP = meta.totalPages || Math.ceil((meta.total || list.length) / limit) || 1;
          } else if (Array.isArray(response)) {
            list = response;
            totalP = list.length === limit ? currentPage + 1 : currentPage;
          } else if (response.data && Array.isArray(response.data.data)) {
            list = response.data.data;
            const meta = response.data.pagination || response.data.meta || response.meta || response.pagination || {};
            totalP = meta.totalPages || (list.length === limit ? currentPage + 1 : currentPage);
          } else if (response.data && Array.isArray(response.data)) {
            list = response.data;
            const meta = response.meta || response.pagination || {};
            totalP = meta.totalPages || (list.length === limit ? currentPage + 1 : currentPage);
          }

          setProjectList(list);
          setTotalPages(totalP);
        }
      } catch (error) {
        console.error("Error fetching paginated projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchPaginatedProjects();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [currentPage, limit, filters.searchTerm, filters.manager, filters.fabricator, filters.stage, dateFilter]);

  // --- Derived filters removed as they are now state/constants ---

  // --- Filter Logic ---
  const filteredProjects = useMemo(() => {
    return projectList.map(project => {
      // Calculate worked hours for this project
      const projectTasks = tasks.filter(t => {
        const taskProjectId = t.project?.id || t.project_id || (typeof t.project === 'string' ? t.project : null);
        return taskProjectId === project.id;
      });
      const workedHours = projectTasks.reduce((total, task) => {
        const taskStatus = (task.status || '').toLowerCase().trim();
        if (taskStatus === 'wrong_allocation' || taskStatus === 'absent') {
          return total;
        }

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

      // Other filters are handled by API
      if (
        statusFilter !== "All Statuses" &&
        project.status !== statusFilter
      )
        return false;
      if (filters.overrunOnly && !isOverrun) return false;
 
      return true;
    });
  }, [projectList, filters, tasks, statusFilter]);

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
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let colorClasses = "bg-gray-100 text-gray-700 border-gray-300";
        if (status === 'ACTIVE') {
          colorClasses = "bg-[#dbeafe] text-blue-700 border-blue-300";
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
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, searchTerm: e.target.value }));
                  setCurrentPage(1);
                }}
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
              onChange={(e) => {
                setFilters(prev => ({ ...prev, manager: e.target.value }));
                setCurrentPage(1);
              }}
            >
              {managerOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          )}
          {/* Fabricator Filter with Search */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[220px] relative" ref={fabDropdownRef}>
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Fabricator</label>
            <div
              onClick={() => setIsFabDropdownOpen((prev) => !prev)}
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none hover:border-gray-400 transition-all shadow-sm flex items-center justify-between"
            >
              <span className="truncate">{filters.fabricator || "All Fabricators"}</span>
              <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
            </div>

            {isFabDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-hidden flex flex-col max-h-60 min-w-[220px]">
                <div className="p-2 border-b border-gray-200 bg-gray-50 sticky top-0">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search fabricator..."
                      className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-green-600"
                      value={fabSearchQuery}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFabSearchQuery(val);
                        handleFetchFabricatorOptions(val);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-48 py-1">
                  {filteredFabricatorOptions.length > 0 ? (
                    filteredFabricatorOptions.map((f) => (
                      <div
                        key={f}
                        onClick={() => {
                          setFilters((prev) => ({ ...prev, fabricator: f }));
                          setCurrentPage(1);
                          setIsFabDropdownOpen(false);
                        }}
                        className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors ${
                          filters.fabricator === f ? "bg-green-100 text-green-800 font-semibold" : "text-gray-700"
                        }`}
                      >
                        {f}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-gray-400 italic">No fabricators found</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stage Filter */}
          <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[200px]">
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Stage</label>
            <select
              className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
              value={filters.stage}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, stage: e.target.value }));
                setCurrentPage(1);
              }}
            >
              {stageOptions.map(s => <option key={s} value={s}>{s}</option>)}
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
            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">Start Date</label>
            <DateFilter 
              dateFilter={dateFilter} 
              setDateFilter={(val) => {
                setDateFilter(val);
                setCurrentPage(1);
              }} 
            />
          </div>
        </div>

        {/* Fabricator Detailing Standards Section */}
        {filters.fabricator !== "All Fabricators" && (
          loadingFab ? (
            <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-green-600 mr-2" />
              <span className="text-xs font-semibold text-gray-500 uppercase">Loading detailing standards...</span>
            </div>
          ) : fabricatorDetails && (
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
          )
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProjects}
        onRowClick={handleRowClick}
        manualPagination={true}
        pageCount={totalPages}
        pageIndex={currentPage - 1}
        onPageChange={(index) => setCurrentPage(index + 1)}
        pageSizeOptions={[limit]}
        isLoading={isLoadingProjects}
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
