import DataTable from "../ui/table";

import GetRFQByID from "./GetRFQByID";

const AllRFQ = ({ rfq }) => {
  const userType = localStorage.getItem("userType");

  let columns = [
    {
      accessorKey: "projectName",
      header: "Project Name",
      enableColumnFilter: true,
      filterType: "text",
    },
    {
      accessorKey: "projectNumber",
      header: "RFQ #",
      enableColumnFilter: true,
      filterType: "text",
    },
  ];

  // ➕ Only Admin / Staff see Fabricator
  if (userType !== "CLIENT") {
    columns.push({
      accessorKey: "fabricator",
      header: "Fabricator",
      cell: ({ row }) => (row.original)?.fabricator?.fabName || "—",
    });
  }

  columns.push(
    {
      accessorKey: "sender",
      header: "Requested By",
      cell: ({ row }) => {
        const sender = row.original?.sender;
        const s = sender;
        return sender
          ? `${s.firstName ?? ""} ${s.middleName ?? ""} ${s.lastName ?? ""}`
          : "—";
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      enableColumnFilter: true,
      filterType: "select",
      filterOptions: [
        { label: "In Review", value: "IN_REVIEW" },
        { label: "Completed", value: "COMPLETED" },
        { label: "Pending", value: "PENDING" },
      ],
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${row.original.status === "IN_REVIEW"
            ? "bg-yellow-100 text-yellow-700"
            : row.original.status === "COMPLETED"
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: "estimationDate",
      header: "Due Date",
      cell: ({ row }) =>
        row.original.estimationDate
          ? new Date(row.original.estimationDate).toLocaleDateString()
          : "—",
    },
  );

  return (
    <div className=" bg-white p-4 rounded-2xl shadow-sm">
      <DataTable
        columns={columns}
        data={rfq || []}
        detailComponent={({ row }) => <GetRFQByID id={row.id} />}
        // onDelete={handleDelete}
        pageSizeOptions={[5, 10, 25]}
      />
    </div>
  );
};

export default AllRFQ;
