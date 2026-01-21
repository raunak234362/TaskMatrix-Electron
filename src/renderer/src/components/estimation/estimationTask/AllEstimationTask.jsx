import { X } from "lucide-react";
import { useState } from "react";
import Button from "../../fields/Button";
import AddEstimationTask from "./AddEstimationTask";
import DataTable from "../../ui/table";
import { format } from "date-fns";
import EstimationTaskByID from "./EstimationTaskByID";
import Modal from "../../ui/Modal";

const AllEstimationTask = ({ estimations, estimationId, onClose }) => {
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();
  const [addTaskModal, setAddTaskModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenAddTask = () => setAddTaskModal(true);

  // ─────────────── Columns for DataTable ───────────────
  const columns = [
    {
      header: "Project Name",
      accessorFn: (row) => row.estimation?.projectName || "—",
    },
    {
      header: "Fabricator Name",
      accessorFn: (row) => row.estimation?.fabricators?.fabName || row.estimation?.fabricator?.fabName || row.estimation?.fabricatorName || "—",
    },
    {
      header: "Assigned To",
      accessorFn: (row) =>
        `${row.assignedTo?.firstName ?? ""} ${row.assignedTo?.middleName ?? ""
          } ${row.assignedTo?.lastName ?? ""}`.trim() || "—",
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
      header: "Status",
      accessorFn: (row) => row.status,
      cell: ({ getValue }) => {
        const status = getValue();
        const color =
          status === "COMPLETED"
            ? "bg-emerald-100 text-emerald-800"
            : status === "ASSIGNED"
              ? "bg-amber-100 text-amber-800"
              : "bg-blue-100 text-blue-800";
        return (
          <span
            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${color}`}
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
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">Estimation Tasks</h3>
        {(userRole === "ESTIMATION_HEAD" || userRole === "ADMIN") && (
          <Button onClick={handleOpenAddTask} className="bg-teal-600 text-white hover:bg-teal-700 shadow-md shadow-teal-100">
            Add Task
          </Button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
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
              const estimationUniqueId = row.id ?? row.estimationId ?? "";
              return <EstimationTaskByID id={estimationUniqueId} onClose={close} />;
            }}
            searchPlaceholder="Search tasks..."
            pageSizeOptions={[5, 10, 25]}
          />
        ) : (
          <div className="text-center text-gray-500 py-16 bg-gray-50/50">
            <p className="text-sm font-medium italic">No estimation tasks found.</p>
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      {addTaskModal && (
        <Modal
          isOpen={addTaskModal}
          onClose={() => setAddTaskModal(false)}
          title="Add Estimation Task"
          width="max-w-3xl"
        >
          <AddEstimationTask
            estimationId={estimationId}
            onClose={() => setAddTaskModal(false)}
            onSuccess={() => {
              setAddTaskModal(false);
              // In a real app, we'd trigger a refresh here
            }}
          />
        </Modal>
      )}
    </div>
  );
};

export default AllEstimationTask;
