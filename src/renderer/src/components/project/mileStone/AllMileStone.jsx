/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import Button from "../../fields/Button";
import AddMileStone from "./AddMileStone";
import Service from "../../../api/Service";
import DataTable from "../../ui/table";
import GetMilestoneByID from "./GetMilestoneByID";


import { useDispatch, useSelector } from "react-redux";
import { setMilestonesForProject } from "../../../store/milestoneSlice";


const AllMileStone = ({ project, onUpdate }) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const [addMileStoneModal, setAddMileStoneModal] = useState(false);
  const dispatch = useDispatch();
  const milestonesByProject = useSelector(
    (state) => state.milestoneInfo?.milestonesByProject || {}
  );
  const milestones = milestonesByProject[project.id] || [];

  const fetchMileStone = async () => {
    try {
      const response = await Service.GetProjectMilestoneById(project.id);
      if (response && response.data) {
        dispatch(
          setMilestonesForProject({
            projectId: project.id,
            milestones: response.data,
          })
        );
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!milestonesByProject[project.id]) {
      fetchMileStone();
    }
  }, [project.id, milestonesByProject, dispatch]);

  const handleOpenAddMileStone = () => setAddMileStoneModal(true);
  const handleCloseAddMileStone = () => setAddMileStoneModal(false);

  const handleSuccess = () => {
    fetchMileStone();
    if (onUpdate) onUpdate();
  };

  const columns = [
    { accessorKey: "subject", header: "Subject" },
    { accessorKey: "description", header: "Description" },
    { accessorKey: "date", header: "Target Date" },
    { accessorKey: "approvalDate", header: "Approval Date" },
    { accessorKey: "status", header: "Status" },
  ];
  const handleRowClick = (row) => {
    const milestonesId = (row).id ?? (row).fabId ?? "";
    console.debug("Selected milestones:", milestonesId);
  };

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4">

        {!(userRole === "staff" || userRole === "client" || userRole === "vendor") && (
          <Button
            onClick={handleOpenAddMileStone}
            className="text-sm py-1 px-3 bg-green-600 text-white"
          >
            + Add Milestone
          </Button>
        )}
      </div>
      {milestones && milestones.length > 0 ? (
        <DataTable
          columns={columns}
          data={milestones}
          onRowClick={handleRowClick}
          detailComponent={GetMilestoneByID}
          pageSizeOptions={[5, 10, 25]}
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
