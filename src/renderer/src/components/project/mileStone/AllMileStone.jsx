import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Button from "../../fields/Button";
import AddMileStone from "./AddMileStone";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import GetMilestoneByID from "./GetMilestoneByID";
import { formatDate } from "../../../utils/dateUtils";

import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../../store/milestoneSlice";

const AllMileStone = ({ project, onUpdate }) => {
  const [addMileStoneModal, setAddMileStoneModal] = useState(false);
  const dispatch = useDispatch();
  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {},
  );
  const milestones = milestonesByProject[project.id] || [];
  console.log(milestones);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const isClient = userRole === "client" || userRole === "client_admin";

  const fetchMileStone = async () => {
    try {
      const response = await Service.GetProjectMilestoneById(project.id);
      if (response && response.data) {
        dispatch(
          setMilestonesForProject({
            projectId: project.id,
            milestones: response.data,
          }),
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    // Always fetch fresh data on mount to avoid stale Redux cache
    fetchMileStone();
  }, [project.id]);

  const handleOpenAddMileStone = () => setAddMileStoneModal(true);
  const handleCloseAddMileStone = () => setAddMileStoneModal(false);

  const handleSuccess = () => {
    fetchMileStone();
    if (onUpdate) onUpdate();
  };

  const STATUS_MAP = {
    ACTIVE:    { label: "Active",       color: "text-blue-700" },
    COMPLETE:  { label: "Complete",     color: "text-green-700" },
    COMPLETED: { label: "Complete",     color: "text-green-700" },
    PENDING:   { label: "Pending",      color: "text-yellow-700" },
    APPROVED:  { label: "Approved",     color: "text-emerald-700" },
    ONHOLD:    { label: "On Hold",      color: "text-orange-600" },
    DELAY:     { label: "Delay",        color: "text-red-600" },
  };

  const columns = [
    { accessorKey: "subject", header: "Milestone" },
    { accessorKey: "subSubject", header: "Subject" },
    { accessorKey: "stage", header: "Stage" },
    {
      accessorKey: "approvalDate",
      header: "Approval Date",
      cell: ({ row }) => formatDate(row.original.approvalDate),
    },
    {
      accessorKey: "CDApprovalDate",
      header: "CD Approval Date",
      cell: ({ row }) => formatDate(row.original.CDApprovalDate),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const raw = (row.original.status || "").toUpperCase();
        const cfg = STATUS_MAP[raw] || { label: row.original.status || "—", color: "text-gray-600" };
        return <span className={`font-semibold uppercase text-xs ${cfg.color}`}>{cfg.label}</span>;
      },
    },
  ];
  const handleRowClick = (row) => {
    const milestonesId = row.id ?? row.fabId ?? "";
    console.debug("Selected milestones:", milestonesId);
  };

  return (
    <div className="p-2">
      {!isClient && (
        <div className="flex justify-between items-center mb-4">
          <Button
            onClick={handleOpenAddMileStone}
            className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            + Add Milestone
          </Button>
        </div>
      )}
      {milestones && milestones.length > 0 ? (
        <DataTable
          columns={columns}
          data={milestones}
          onRowClick={handleRowClick}
          detailComponent={(props) => (
            <GetMilestoneByID {...props} onUpdate={fetchMileStone} />
          )}
          pageSizeOptions={[10, 25, 35]}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-8 text-gray-700">
          <Clock className="w-8 h-8 mb-2 text-gray-300" />
          <p>No milestones added yet.</p>
        </div>
      )}

      {addMileStoneModal && (
        <AddMileStone
          projectId={project.id}
          fabricatorId={project.fabricator?.id || ""}
          onClose={handleCloseAddMileStone}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default AllMileStone;
