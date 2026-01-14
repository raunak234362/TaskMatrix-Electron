
import DataTable from "../ui/table";
import React, { Suspense, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Service from "../../api/Service";
import { setProjectData } from "../../store/projectSlice";
import { Loader2 } from "lucide-react";

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
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const projects = useSelector(
    (state) => state.projectInfo?.projectData || []
  );

  useEffect(() => {
    const fetchProjects = async () => {
      if (projects.length === 0) {
        try {
          setLoading(true);
          const res = await Service.GetAllProjects();
          dispatch(setProjectData(res.data || []));
        } catch (error) {
          console.error("Error fetching projects:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchProjects();
  }, [dispatch, projects.length]);

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

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700 bg-white p-4 rounded-2xl shadow-sm">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading projects...
      </div>
    );
  }

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
  );
};

export default AllProjects;
