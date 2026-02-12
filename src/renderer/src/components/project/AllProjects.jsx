
import DataTable from "../ui/table";
import React, { Suspense } from "react";
import { useSelector } from "react-redux";
const GetProjectById = React.lazy(() =>
  import("./GetProjectById").then((module) => ({ default: module.default }))
);

const ProjectDetailComponent = ({ row }) => {
  const fabricatorUniqueId = row.id ?? row.fabId ?? "";
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GetProjectById id={fabricatorUniqueId} />
    </Suspense>
  );
};

const AllProjects = () => {
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );

  // Handle row click (optional)
  const handleRowClick = (row) => {
    const projectUniqueId = (row).id ?? (row).fabId ?? "";
    console.debug("Selected project:", projectUniqueId);
  };

  // Define columns for DataTable with premium styling (Name / Subtext)
  const columns = [
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-black text-gray-900">{row.original.name}</span>
          <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-0.5">{row.original.clientName || 'N/A'}</span>
        </div>
      )
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-black uppercase tracking-wider">
          {row.original.stage || 'N/A'}
        </span>
      )
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || 'UNKNOWN';
        const colors = {
          ACTIVE: 'bg-green-100 text-green-700',
          COMPLETED: 'bg-blue-100 text-blue-700',
          ON_HOLD: 'bg-orange-100 text-orange-700',
          AWARDED: 'bg-purple-100 text-purple-700',
          UNKNOWN: 'bg-gray-100 text-gray-600'
        };
        return (
          <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest ${colors[status] || colors.UNKNOWN}`}>
            {status}
          </span>
        );
      }
    },
  ];

  return (
    <div className="bg-[#fcfdfc] min-h-[600px] animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-10 px-1">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Projects <span className="text-primary/40 ml-2">{projects.length}</span></h1>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        onRowClick={handleRowClick}
        detailComponent={ProjectDetailComponent}
        disablePagination={true}
      />
    </div>
  );
};

export default AllProjects;
