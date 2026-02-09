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
} from "lucide-react";

import DataTable from "../ui/table";
import FetchTaskByID from "./FetchTaskByID";
import GetTaskByID from "./GetTaskByID";

const TaskDetailWrapper = ({ row, close }) => {
  return <GetTaskByID id={row.id} onClose={close} />;
};

const AllTasks = () => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        return "bg-green-100 text-green-700 border-green-200";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "ASSIGNED":
        return "bg-green-100 text-green-700 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
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
  const { projectOptions, stageOptions, statusOptions, userOptions } =
    useMemo(() => {
      const projects = new Set();
      const stages = new Set();
      const statuses = new Set();
      const users = new Set();

      tasks.forEach((task) => {
        if (task.project?.name) projects.add(task.project.name);
        if (task.Stage) stages.add(task.Stage);
        if (task.status) statuses.add(task.status);
        const userName = task.user
          ? `${task.user.firstName} ${task.user.lastName}`
          : "Unassigned";
        users.add(userName);
      });

      return {
        projectOptions: Array.from(projects).map((p) => ({
          label: p,
          value: p,
        })),
        stageOptions: Array.from(stages).map((s) => ({ label: s, value: s })),
        statusOptions: Array.from(statuses).map((s) => ({
          label: s,
          value: s,
        })),
        userOptions: Array.from(users).map((u) => ({ label: u, value: u })),
      };
    }, [tasks]);

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
            <div
              className="text-xs text-gray-400 mt-1 line-clamp-1 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: row.original.description || "No description",
              }}
            />
          </div>
        ),
      },
      {
        accessorKey: "project.name",
        header: "Project",
        enableColumnFilter: true,
        filterType: "select",
        filterOptions: projectOptions,
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
        accessorKey: "Stage",
        header: "Stage",
        enableColumnFilter: true,
        filterType: "select",
        filterOptions: stageOptions,
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <Tag className="w-3.5 h-3.5 text-gray-400" />
            <span>{row.original.Stage || "N/A"}</span>
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
        enableColumnFilter: userRole !== "staff",
        filterType: "select",
        filterOptions: userOptions,
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
              <span className="text-xs text-gray-400">
                {row.original.department?.name || "General"}
              </span>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        enableColumnFilter: true,
        filterType: "select",
        filterOptions: statusOptions,
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
    [projectOptions, stageOptions, statusOptions, userOptions, userRole]
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
    <div className="p-4 md:p-2 w-full mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full border border-green-100">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-semibold text-green-700">
            {tasks.length} Total Tasks
          </span>
        </div>
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
            data={tasks}
            detailComponent={TaskDetailWrapper}
            pageSizeOptions={[10, 25, 50]}
          />
        </div>
      )}
    </div>
  );
};

export default AllTasks;
