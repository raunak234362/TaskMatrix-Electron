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
import GetTaskByID from "./GetTaskByID";

const AllActiveTask = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                const response = await Service.GetNonCompletedTasks();
                console.log(response.data);
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
    }, []);

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
                return "bg-[#eef7e9] text-[#2d501d] border-[#d4e9c8]";
            case "PENDING":
                return "bg-yellow-100 text-yellow-700 border-yellow-200";
            default:
                return "bg-gray-100 text-gray-700 border-gray-200";
        }
    };

    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 1:
                return { label: "High", color: "text-red-600" };
            case 2:
                return { label: "Medium", color: "text-orange-500" };
            case 3:
                return { label: "Low", color: "text-blue-500" };
            default:
                return { label: "Normal", color: "text-gray-500" };
        }
    };

    const columns = useMemo(
        () => [
            {
                accessorKey: "name",
                header: "Task Details",
                cell: ({ row }) => (
                    <div className="flex flex-col">
                        <span className="font-semibold text-gray-800">
                            {row.original.name}
                        </span>
                        <span className="text-xs text-gray-400 mt-1 line-clamp-1">
                            {row.original.description || "No description"}
                        </span>
                    </div>
                ),
            },
            {
                accessorKey: "project.name",
                header: "Project & Stage",
                cell: ({ row }) => (
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                            <span className="font-medium">
                                {row.original.project?.name || "N/A"}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Tag className="w-3.5 h-3.5 text-gray-400" />
                            <span>Stage: {row.original.Stage || "N/A"}</span>
                        </div>
                    </div>
                ),
            },
            {
                accessorKey: "user.firstName",
                header: "Assigned To",
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#6bbd45] flex items-center justify-center text-white text-xs font-bold shadow-sm">
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
                cell: ({ row }) => (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(
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
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {formatDate(row.original.due_date)}
                    </div>
                ),
            },
        ],
        []
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-[#6bbd45]">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="font-medium animate-pulse">Fetching active tasks...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 p-6 bg-red-50 rounded-xl border border-red-100 mx-4">
                <AlertCircle className="w-12 h-12 mb-4" />
                <h3 className="text-lg font-bold mb-2">Failed to Load Active Tasks</h3>
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
                <div className="flex items-center gap-2 bg-[#f7fbf3] px-4 py-2 rounded-full border border-[#eef7e9]">
                    <span className="w-2 h-2 bg-[#6bbd45] rounded-full animate-pulse"></span>
                    <span className="text-sm font-semibold text-[#2d501d]">
                        {tasks.length} Active Tasks
                    </span>
                </div>
            </div>

            {tasks.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ClipboardList className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No Active Tasks Found
                    </h3>
                    <p className="text-gray-500">
                        You don't have any active tasks at the moment.
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-4">
                    <DataTable
                        columns={columns}
                        data={tasks}
                        detailComponent={({ row, close }) => (
                            <GetTaskByID id={row.id} onClose={close} />
                        )}
                        searchPlaceholder="Search active tasks..."
                        pageSizeOptions={[10, 25, 50]}
                    />
                </div>
            )}
        </div>
    );
};

export default AllActiveTask;
