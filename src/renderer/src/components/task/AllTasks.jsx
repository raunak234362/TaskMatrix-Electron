import { useEffect, useState, useMemo } from "react";
import Service from "../../api/Service";
import {
  Loader2,
  AlertCircle,
  ClipboardList,
  Calendar,
  User,
  Briefcase,
  Tag,
  Clock,
  Trash2,
  Filter,
} from "lucide-react";
import DateFilter from "../common/DateFilter";
import { matchesDateFilter } from "../../utils/dateFilter";

import DataTable from "../ui/table";
import FetchTaskByID from "./FetchTaskByID";
import GetTaskByID from "./GetTaskByID";
import BulkUpdateStatusModal from "./components/BulkUpdateStatusModal";
import Select from "../fields/Select";

const TaskDetailWrapper = ({ row, close }) => {
  return <GetTaskByID id={row.id} onClose={close} />;
};

const AllTasks = () => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    projectName: "All Projects",
    stage: "All Stages",
    status: "All Status",
    assignedUser: "All Users",
    wbsType: "All Types",
  });

  const [dateFilter, setDateFilter] = useState({
    type: "all",
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const response =
          userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" || userRole === "deputy_manager"
            ? await Service.GetAllTask()
            : await Service.GetMyTask();

        // Ensure tasks is an array
        const taskData = Array.isArray(response.data)
          ? response.data
          : response.data
            ? Object.values(response.data)
            : [];

        setTasks(taskData);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchTasks();
  }, [userRole]);

  const [rowSelection, setRowSelection] = useState({});
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);

  const refreshTasks = async () => {
    try {
      setLoading(true);
      const response =
        userRole === "admin" || userRole === "operation_executive" || userRole === "project_manager" || userRole === "department_manager" || userRole === "deputy_manager"
          ? await Service.GetAllTask()
          : await Service.GetMyTask();

      const taskData = Array.isArray(response.data)
        ? response.data
        : response.data
          ? Object.values(response.data)
          : [];

      setTasks(taskData);
      setRowSelection({});
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      : "—";

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ASSIGNED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return { label: "Low", color: "text-green-600" };
      case 2:
        return { label: "Medium", color: "text-yellow-500" };
      case 3:
        return { label: "High", color: "text-orange-500" };
      default:
        return { label: "Critical", color: "text-red-500" };
    }
  };

  /* -------------------- Filters Options -------------------- */
  const { projectOptions, stageOptions, statusOptions, userOptions, wbsTypeOptions } =
    useMemo(() => {
      const projects = new Set();
      const stages = new Set();
      const statuses = new Set();
      const users = new Set();
      const wbsTypes = new Set();

      tasks.forEach((task) => {
        if (task.project?.name) projects.add(task.project.name);
        if (task.Stage) stages.add(task.Stage);
        if (task.status) statuses.add(task.status);
        if (task.wbsType) wbsTypes.add(task.wbsType);
        const userName = task.user
          ? `${task.user.firstName} ${task.user.lastName}`
          : "Unassigned";
        users.add(userName);
      });

      return {
        projectOptions: [
          { label: "All Projects", value: "All Projects" },
          ...Array.from(projects).map((p) => ({ label: p, value: p })),
        ],
        stageOptions: [
          { label: "All Stages", value: "All Stages" },
          ...Array.from(stages).map((s) => ({ label: s, value: s })),
        ],
        statusOptions: [
          { label: "All Status", value: "All Status" },
          ...Array.from(statuses).map((s) => ({ label: s, value: s })),
        ],
        userOptions: [
          { label: "All Users", value: "All Users" },
          ...Array.from(users).map((u) => ({ label: u, value: u })),
        ],
        wbsTypeOptions: [
          { label: "All Types", value: "All Types" },
          ...Array.from(wbsTypes).map((w) => ({ label: w, value: w })),
        ],
      };
    }, [tasks]);

  // --- Filter Logic ---
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const projectName = task.project?.name || "Unassigned";
      const stage = task.Stage || "Unknown";
      const status = task.status || "Unknown";

      if (
        filters.projectName !== "All Projects" &&
        projectName !== filters.projectName
      )
        return false;
      if (
        filters.stage !== "All Stages" &&
        stage !== filters.stage
      )
        return false;
      if (
        filters.status !== "All Status" &&
        status !== filters.status
      )
        return false;

      const userName = task.user
        ? `${task.user.firstName} ${task.user.lastName}`
        : "Unassigned";
      if (
        filters.assignedUser !== "All Users" &&
        userName !== filters.assignedUser
      )
        return false;

      const wbsType = task.wbsType || "N/A";
      if (
        filters.wbsType !== "All Types" &&
        wbsType !== filters.wbsType
      )
        return false;

      // Filter by Date (using created_on)
      if (!matchesDateFilter(task.created_on, dateFilter)) return false;

      return true;
    });
  }, [tasks, filters, dateFilter]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Task Details",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-700 group-hover:text-green-700 transition-colors">
              {row.original.name}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "project.name",
        header: "Project",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">
              {row.original.project?.name || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorFn: (row) =>
          row.user
            ? `${row.user.firstName} ${row.user.lastName}`
            : "Unassigned",
        id: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-linear-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs  shadow-sm">
              {row.original.user?.firstName?.charAt(0) || (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-700">
                {row.original.user
                  ? `${row.original.user.firstName} ${row.original.user.lastName}`
                  : "Unassigned"}
              </span>
              {/* <span className="text-xs text-gray-400">
                {row.original.department?.name || "General"}
              </span> */}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <span
            className={`px-3 py-1 rounded-full text-xs  border ${getStatusColor(
              row.original.status
            )}`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
          const priority = getPriorityLabel(row.original.priority);
          return (
            <div
              className={`flex items-center gap-1.5 text-sm font-semibold ${priority.color}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${priority.color.replace(
                  "text",
                  "bg"
                )}`}
              ></span>
              {priority.label}
            </div>
          );
        },
      },
      {
        accessorFn: (row) => row.allocationLog?.allocatedHours || "—",
        id: "assignedHours",
        header: "Assigned Hrs",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="font-medium">
              {row.original.allocationLog?.allocatedHours || "—"}
            </span>
          </div>
        ),
      },
      {
        id: "workingHours",
        header: "Working Hrs",
        cell: ({ row }) => {
          const totalSeconds = row.original.workingHourTask?.reduce(
            (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
            0
          ) || 0;

          const formatSecondsToHHMM = (totalSeconds) => {
            if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
          };

          return (
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-bold text-gray-700">
                {formatSecondsToHHMM(totalSeconds)}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            {formatDate(row.original.due_date)}
          </div>
        ),
      },
    ],
    [userRole]
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-green-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium animate-pulse">Fetching your tasks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 p-6 bg-red-50 rounded-xl border border-red-100 mx-4">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h3 className="text-lg  mb-2">Failed to Load Tasks</h3>
        <p className="text-center max-w-md">
          {error.message ||
            "An unexpected error occurred while fetching tasks. Please try again later."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-2 w-full mx-auto animate-in fade-in duration-700 flex flex-col gap-4">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-400" />
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Filters</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          {/* Project Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Project</label>
            <Select
              options={projectOptions}
              value={filters.projectName}
              onChange={(_, val) => setFilters(prev => ({ ...prev, projectName: val }))}
              placeholder="Select Project"
              className="font-semibold text-gray-700 bg-gray-50"
            />
          </div>

          {/* Stage Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Stage</label>
            <Select
              options={stageOptions}
              value={filters.stage}
              onChange={(_, val) => setFilters(prev => ({ ...prev, stage: val }))}
              placeholder="Select Stage"
              className="font-semibold text-gray-700 bg-gray-50"
            />
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Status</label>
            <Select
              options={statusOptions}
              value={filters.status}
              onChange={(_, val) => setFilters(prev => ({ ...prev, status: val }))}
              placeholder="Select Status"
              className="font-semibold text-gray-700 bg-gray-50"
            />
          </div>
          {["admin", "project_manager", "operation_executive", "department_manager", "human_resource", "deputy_manager"].includes(userRole) && (
            <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned User</label>
              <Select
                options={userOptions}
                value={filters.assignedUser}
                onChange={(_, val) => setFilters(prev => ({ ...prev, assignedUser: val }))}
                placeholder="Select User"
                className="font-semibold text-gray-700 bg-gray-50"
              />
            </div>
          )}

          {/* WBS Type Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto min-w-[200px]">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">WBS Type</label>
            <Select
              options={wbsTypeOptions}
              value={filters.wbsType}
              onChange={(_, val) => setFilters(prev => ({ ...prev, wbsType: val }))}
              placeholder="Select Type"
              className="font-semibold text-gray-700 bg-gray-50"
            />
          </div>

          {/* Date Filter */}
          <div className="flex flex-col gap-1 w-full sm:w-auto">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Period</label>
            <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-green-700">
            {tasks.length} Total Tasks
          </span>
        </div> */}

        {Object.keys(rowSelection).length > 0 && (
          <button
            onClick={() => setShowBulkUpdateModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-black  hover:bg-gray-200 text-black rounded-lg transition-colors shadow-sm"
          >
            <ClipboardList size={16} />
            <span>Update Status ({Object.keys(rowSelection).length})</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Tasks Found
          </h3>
          <p className="text-gray-700">
            You don't have any tasks assigned at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-4">
          <DataTable
            columns={columns}
            data={filteredTasks}
            detailComponent={TaskDetailWrapper}
            enableRowSelection={true}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            getRowId={(row) => row.id}
            getRowClassName={(task) => {
              const allocatedStr = task.allocationLog?.allocatedHours || "00:00";
              const [h, m] = allocatedStr.split(":").map(Number);
              const allocatedSeconds = (h || 0) * 3600 + (m || 0) * 60;

              const workedSeconds = task.workingHourTask?.reduce(
                (acc, wh) => acc + (Number(wh.duration_seconds) || 0),
                0
              ) || 0;

              // Buffer of 20 minutes (1200 seconds)
              const bufferSeconds = 20 * 60;

              return workedSeconds > (allocatedSeconds + bufferSeconds) && allocatedSeconds > 0
                ? "bg-red-50 hover:bg-red-100!"
                : "";
            }}
          />
        </div>
      )}
      {showBulkUpdateModal && (
        <BulkUpdateStatusModal
          selectedIds={Object.keys(rowSelection)}
          onClose={() => setShowBulkUpdateModal(false)}
          refresh={refreshTasks}
        />
      )}
    </div>
  );
};

export default AllTasks;
