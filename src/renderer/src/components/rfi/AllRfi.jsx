/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import DataTable from "../ui/table";


import GetRFIByID from "./GetRFIByID";
import { Loader2, Inbox } from "lucide-react";


const AllRFI = ({ rfiData = [] }) => {
  const [rfis, setRFIs] = useState([]);
  const [loading, setLoading] = useState(true);
  // const [selectedRfiID, setSelectedRfiID] = useState(null);
  console.log(rfiData);

  const userRole = sessionStorage.getItem("userRole");


  useEffect(() => {
    if (rfiData && rfiData.length > 0) {
      const normalized = rfiData.map((item) => ({
        ...item,
        createdAt: item.createdAt || item.date || null,
      }));
      setRFIs(normalized);
      setLoading(false);
    } else {
      setRFIs([]);
      setLoading(false);
    }
  }, [rfiData]);

  // const handleRowClick = (row) => {
  //   // setSelectedRfiID(row.id);
  // };

  // ✅ Define columns
  const columns = [
    { accessorKey: "subject", header: "Subject" },
    {
      accessorKey: "sender",
      header: "Sender",
      cell: ({ row }) => {
        const s = row.original.sender;
        return s
          ? `${s.firstName ?? ""} ${s.middleName ?? ""} ${s.lastName ?? ""}`.trim() ||
          s.username ||
          "—"
          : "—";
      },
    },
  ];



  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 text-xs rounded-full ${row.original.status === true
            ? "bg-yellow-100 text-yellow-700"
            : "bg-green-100 text-green-700"
            }`}
        >
          {row.original.status ? "PENDING" : "RESPONDED"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          : "—",
    }
  );

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading RFIs...
      </div>
    );
  }

  // ✅ Empty state
  if (!loading && (!rfis || rfis.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-700">
        <Inbox className="w-10 h-10 mb-3 text-gray-400" />
        <p className="text-lg font-medium">No RFIs Available</p>
        <p className="text-sm text-gray-400">
          {userRole === "CLIENT"
            ? "You haven’t sent any RFIs yet."
            : "No RFIs have been received yet."}
        </p>
      </div>
    );
  }

  // ✅ Render DataTable
  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <DataTable
        columns={columns}
        data={rfis}

        detailComponent={({ row }) => <GetRFIByID id={row.id} />}
        pageSizeOptions={[5, 10, 25]}
      />

    </div>
  );
};

export default AllRFI;
