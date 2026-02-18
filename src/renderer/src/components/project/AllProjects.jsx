
import DataTable from "../ui/table";
import React, { Suspense, useState } from "react";
import { useSelector } from "react-redux";
import Modal from "../ui/Modal";
const GetProjectById = React.lazy(() =>
  import("./GetProjectById").then((module) => ({ default: module.default }))
);


const AllProjects = () => {
  const [selectedProject, setSelectedProject] = useState(null);

  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );
  console.log(projects)
  // Handle row click
  const handleRowClick = (row) => {
    setSelectedProject(row);
  };

  // Define columns for DataTable with premium styling (Name / Subtext)
  const columns = [
    {
      accessorKey: "name",
      header: "Project Name",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-gray-900">{row.original.name}</span>
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{row.original.fabricator?.fabName || 'N/A'}</span>
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
          ACTIVE: 'bg-green-100 text-green-800',
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
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Projects</h2>
          <p className="text-sm text-gray-500 font-medium">
            Total Projects: <span className="text-gray-900 font-bold">{projects.length}</span>
          </p>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={projects}
        onRowClick={handleRowClick}
        disablePagination={true}
      />

      {selectedProject && (
        <Modal
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          title="Project Details"
          width="max-w-7xl"
          hideHeader={true}
        >
          <Suspense fallback={<div className="p-4 text-center">Loading project details...</div>}>
            <GetProjectById 
              id={selectedProject.id ?? selectedProject.fabId ?? ""} 
              onClose={() => setSelectedProject(null)}
            />
          </Suspense>
        </Modal>
      )}
    </div>
  );
};

export default AllProjects;
