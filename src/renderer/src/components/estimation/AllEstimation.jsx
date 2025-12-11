import { useState } from "react";
import DataTable from "../ui/table";
import GetEstimationByID from "./GetEstimationByID";

const AllEstimation = ({ estimations }) => {
  console.log(estimations);

  const [selectedEstimationId, setSelectedEstimationId] = useState(null);

  const handleRowClick = (row) => {
    // setSelectedEstimationId(row.id); // Assuming id exists in payload or response
    console.log("Clicked row:", row);
  };

  const columns = [
    { accessorKey: "estimationNumber", header: "Est. Number" },
    { accessorKey: "projectName", header: "Project Name" },
    { accessorKey: "fabricator.fabName", header: "Fabricator" }, // Assuming fabricator is populated
    { accessorKey: "status", header: "Status" },
    { 
      accessorKey: "estimateDate", 
      header: "Date",
      cell: ({ row }) => row.original.estimateDate ? new Date(row.original.estimateDate).toLocaleDateString() : "-"
    }
  ];

  return (
    <div className="bg-white p-2 rounded-2xl">
      <DataTable
        columns={columns}
        data={estimations || []}
        onRowClick={handleRowClick}
           detailComponent={({ row }) => {
          const estimationUniqueId =
            row.id ?? row.fabId ?? "";
          return <GetEstimationByID id={estimationUniqueId} />;
        }}
        searchPlaceholder="Search estimations..."
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default AllEstimation;