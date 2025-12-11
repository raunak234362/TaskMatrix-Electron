/* eslint-disable @typescript-eslint/no-explicit-any */
import { X } from "lucide-react";
import { useState } from "react";
import Button from "../../fields/Button";
import AddEstimationTask from "./AddEstimationTask";
import DataTable from "../../ui/table";
import { format } from "date-fns";

const AllEstimationTask = ({ estimation, onClose }) => {
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const EstimationTasks = estimation?.tasks ?? [];

  const handleOpenAddTask = () => setAddTaskModal(true);

  // ─────────────── Columns for DataTable ───────────────
  const columns = [
    {
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ getValue }) => {
        const status = getValue();
        const color =
          status === "COMPLETED"
            ? "bg-green-100 text-green-800"
            : status === "ASSIGNED"
            ? "bg-yellow-100 text-yellow-800"
            : "bg-blue-100 text-blue-800";
        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}
          >
            {status}
          </span>
        );
      },
    },
    {
      header: "Assigned To",
      accessorFn: (row) =>
        `${row.assignedTo?.firstName ?? ""} ${
          row.assignedTo?.middleName ?? ""
        } ${row.assignedTo?.lastName ?? ""}`.trim() || "—",
    },
    {
      header: "Assigned By",
      accessorFn: (row) =>
        `${row.assignedBy?.firstName ?? ""} ${
          row.assignedBy?.middleName ?? ""
        } ${row.assignedBy?.lastName ?? ""}`.trim() || "—",
    },
    {
      header: "Start Date",
      accessorFn: (row) =>
        row.startDate ? format(new Date(row.startDate), "dd MMM yyyy") : "—",
    },
    {
      header: "End Date",
      accessorFn: (row) =>
        row.endDate ? format(new Date(row.endDate), "dd MMM yyyy") : "—",
    },
    {
      header: "Notes",
      accessorFn: (row) => row.notes || "—",
      cell: ({ getValue }) => (
        <span className="text-gray-700 text-sm line-clamp-2">
          {getValue()}
        </span>
      ),
    },
    {
      header: "Created At",
      accessorFn: (row) =>
        format(new Date(row.createdAt), "dd MMM yyyy, hh:mm a"),
    },
  ];

  const handleRowClick = (row) => {
    console.log("Task clicked:", row.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-6xl bg-white rounded-xl p-4 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">Estimation Tasks</h2>
          <button onClick={onClose} aria-label="Close">
            <X className="w-6 h-6 text-gray-600 hover:text-black" />
          </button>
        </div>

        {/* Estimation Info */}
        <div className="mb-4 text-sm">
          <p className="text-gray-700 font-semibold">
            Project Name:{" "}
            <span className="text-blue-700">{estimation.projectName}</span>
          </p>
          <p className="text-gray-700 font-semibold">
            Fabricator Name:{" "}
            <span className="text-blue-700">
              {estimation.fabricators?.fabName ?? "N/A"}
            </span>
          </p>
        </div>

        {/* Add Task Button */}
        <div className="mb-4">
          <Button onClick={handleOpenAddTask} className="text-sm">
            + Add Estimation Task
          </Button>
        </div>

        {/* Task Table */}
        <div className="mt-4 border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
              Loading tasks...
            </div>
          ) : EstimationTasks.length > 0 ? (
            <DataTable
              columns={columns}
              data={EstimationTasks}
              onRowClick={handleRowClick}
              searchPlaceholder="Search tasks..."
              pageSizeOptions={[5, 10, 25]}
            />
          ) : (
            <div className="text-center text-gray-500 py-10">
              No estimation tasks found.
            </div>
          )}
        </div>

        {/* Add Task Modal */}
        {addTaskModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
            <div className="w-full max-w-3xl bg-white rounded-xl shadow-2xl p-6 overflow-y-auto max-h-[80vh]">
              <AddEstimationTask
                estimationId={estimation.id}
                files={estimation.files}
                onClose={() => setAddTaskModal(false)}
                onSuccess={() => {
                  // Refresh tasks list if needed
                  setAddTaskModal(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllEstimationTask;
