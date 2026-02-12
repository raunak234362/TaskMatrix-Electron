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
    {
      accessorKey: "subject",
      header: "Subject",
      cell: ({ row }) => (
        <span className="font-black text-gray-900">{row.original.subject}</span>
      )
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="text-sm font-bold text-gray-600 truncate max-w-[250px]">{row.original.description || "—"}</p>
      )
    },
    {
      accessorKey: "date",
      header: "Target Date",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-600">
          {row.original.date ? new Date(row.original.date).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || 'PENDING';
        return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
            {status}
          </span>
        );
      }
    },
  ];

  const handleRowClick = (row) => {
    const milestonesId = (row).id ?? (row).fabId ?? "";
    console.debug("Selected milestones:", milestonesId);
  };

  return (
    <div className="bg-[#fcfdfc] min-h-[400px] p-2 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase">Milestones <span className="text-primary/40 ml-2">{milestones.length}</span></h2>
        {!(userRole === "staff" || userRole === "client" || userRole === "vendor") && (
          <Button
            onClick={handleOpenAddMileStone}
            className="text-[10px] font-black uppercase tracking-widest py-2 px-4 bg-gray-900 text-white rounded-xl shadow-md hover:bg-gray-800 transition-all"
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
          disablePagination={true}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Clock className="w-12 h-12 mb-4 opacity-10" />
          <p className="text-sm font-black uppercase tracking-widest opacity-40">No milestones yet</p>
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
