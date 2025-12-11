import { useEffect, useState } from "react";
import Service from "../../api/Service";

import DataTable from "../ui/table";
import GetProjectById from "./GetProjectById";

const ProjectDetailComponent = ({ row }) => {
  const fabricatorUniqueId = row.id ?? row.fabId ?? "";
  return <GetProjectById id={fabricatorUniqueId} />;
};

const AllProjects = () => {
  const [projects, setProjects] = useState([]);
  const fetchAllProjects = async () => {
    const projects = await Service.GetAllProjects();
    setProjects(projects.data);
    console.log(projects);
  };

  useEffect(() => {
    fetchAllProjects();
  }, []);

  // Handle row click (optional)
  const handleRowClick = (row) => {
    const projectUniqueId = row.id ?? row.fabId ?? "";
    console.debug("Selected project:", projectUniqueId);
  };

  // Define columns for DataTable
  const columns = [
    { accessorKey: "name", header: "Project Name" },
    { accessorKey: "stage", header: "Stage" },
    { accessorKey: "status", header: "Status" },
  ];

  return (
    <div className=" bg-white p-4 rounded-2xl shadow-sm">
      <DataTable
        columns={columns}
        data={projects}
        onRowClick={handleRowClick}
        detailComponent={ProjectDetailComponent}
        searchPlaceholder="Search projects..."
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  )
}

export default AllProjects