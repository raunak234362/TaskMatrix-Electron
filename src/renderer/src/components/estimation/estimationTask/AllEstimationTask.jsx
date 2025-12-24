import { X } from "lucide-react";
import { useState } from "react";
import Button from "../../fields/Button";
import AddEstimationTask from "./AddEstimationTask";
import DataTable from "../../ui/table";
import { format } from "date-fns";
import EstimationTaskByID from "./EstimationTaskByID";

const AllEstimationTask = ({ estimations, onClose }) => {
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  console.log(estimations);

  // const EstimationTasks = estimations

  const handleOpenAddTask = () => setAddTaskModal(true);

  // ─────────────── Columns for DataTable ───────────────
  const columns = [

    {
      header: "Project Name",
      accessorFn: (row) => row.estimation?.projectName || "—",
    },
    {
      header: "Fabricator Name",
      accessorFn: (row) => row.estimation?.fabricators?.fabName || "—",
    },
    {
      header: "Assigned To",
      accessorFn: (row) =>
        `${row.assignedTo?.firstName ?? ""} ${row.assignedTo?.middleName ?? ""
          } ${row.assignedTo?.lastName ?? ""}`.trim() || "—",
    },
    {
      header: "Assigned By",
      accessorFn: (row) =>
        `${row.assignedBy?.firstName ?? ""} ${row.assignedBy?.middleName ?? ""
          } ${row.assignedBy?.lastName ?? ""}`.trim() || "—",
    },

    {
      header: "End Date",
      accessorFn: (row) =>
        row.endDate ? format(new Date(row.endDate), "dd MMM yyyy") : "—",
    },
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


  ];

  const handleRowClick = (row) => {
    console.log("Task clicked:", row.id);
  };

  return (
    <div className="flex items-center justify-center">
      <div className="w-full bg-white rounded-xl p-4 shadow-lg">
        {/* Task Table */}
        <div className="mt-4 border rounded-lg">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600 mr-2"></div>
              Loading tasks...
            </div>
          ) : estimations?.length > 0 ? (
            <DataTable
              columns={columns}
              data={estimations}
              onRowClick={handleRowClick}
              detailComponent={({ row, close }) => {
                console.log("Detail Component Row:", row);
                const estimationUniqueId =
                  row.id ?? row.estimationId ?? "";
                return <EstimationTaskByID id={estimationUniqueId} onClose={close} />;
              }}
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
                // estimationId={estimations?.id} // estimations is an array, so this is undefined
                files={[]}
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
