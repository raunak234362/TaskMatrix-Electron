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
      cell: ({ row }) => {
        const rawDescription = row.original.description || row.original.Description || "";
        // If it's the literal dash, treat it as empty
        const effectiveDescription = (rawDescription === "-" || !rawDescription) ? "No description provided" : rawDescription;

        // Strip HTML tags for table view
        const plainText = effectiveDescription.replace(/<[^>]*>?/gm, '');

        return (
          <p className="text-sm font-bold text-black/60 truncate max-w-[300px] italic">
            {plainText}
          </p>
        );
      }
    },
    {
      accessorKey: "date",
      header: "Target Date",
      cell: ({ row }) => (
        <span className="text-[13px] font-black text-black uppercase tracking-tight">
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
          <span className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest border-2 border-black bg-emerald-50 text-black shadow-sm`}>
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
    <div className="bg-[#fcfdfc] min-h-[400px] p-4 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-black tracking-tight uppercase leading-none">Milestones</h2>
          <p className="text-[11px] font-black text-black/40 uppercase tracking-widest mt-2">Managing {milestones.length} project goals</p>
        </div>
        {!(userRole === "staff" || userRole === "client" || userRole === "vendor") && (
          <Button
            onClick={handleOpenAddMileStone}
            className="text-[11px] text-black font-black uppercase tracking-widest py-3 px-6 bg-green-200 hover:bg-green-300 border-2 border-black rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all"
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
