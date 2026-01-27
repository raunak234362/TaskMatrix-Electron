
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

  // Define columns for DataTable
  const columns = [
    { accessorKey: "name", header: "Project Name" },
    { accessorKey: "stage", header: "Stage" },
    { accessorKey: "status", header: "Status" },
  ];

  return (
    <div className=" bg-white p-4 rounded-2xl shadow-sm laptop-fit">
      <DataTable
        columns={columns}
        data={projects}
        onRowClick={handleRowClick}
        detailComponent={ProjectDetailComponent}
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default AllProjects;
