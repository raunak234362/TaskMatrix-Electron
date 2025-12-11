/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";

import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import DataTable from "../../ui/table";
import Service from "../../../api/Service";
import GetWBSByID from "./GetWBSByID";
import Button from "../../fields/Button";

const AllWBS = ({ id }) => {
  const [wbsList, setWbsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWBS, setSelectedWBS] = useState(null);

  // ✅ Fetch all WBS items
  const fetchAllWBS = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await Service.GetWBSByProjectId(id);
      console.log("Fetched WBS:", response);
      setWbsList(response || []);
    } catch (err) {
      console.error("Error fetching WBS:", err);
      setError("Failed to load WBS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWBS();
  }, []);

  // ✅ Define table columns
  const columns = [
    {
      accessorKey: "name",
      header: "WBS Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-800">{row.original.name}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm text-teal-700 font-semibold">
          {row.original.type}
        </span>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.stage || "—"}</span>
      ),
    },
    {
      accessorKey: "totalExecHr",
      header: "Total Exec Hrs",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.totalExecHr || "—"}</span>
      ),
    },
    {
      accessorKey: "totalCheckHr",
      header: "Total Check Hrs",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.totalCheckHr || "—"}</span>
      ),
    },

    {
      accessorKey: "createdAt",
      header: "Created On",
      cell: ({ row }) =>
        format(new Date(row.original.createdAt), "dd MMM yyyy, HH:mm"),
    },
  ];

  // ✅ Handle row click — open details
  const handleRowClick = (row) => {
    const wbsId = row.id ?? row.fabId ?? "";
    if (wbsId) setSelectedWBS(wbsId);
  };

  // ✅ Render loading/error states
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading WBS data...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center py-10 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" /> {error}
      </div>
    );

  // ✅ Render table
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-4">

        <div>

          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Work Breakdown Structure (WBS)
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Total Items:{" "}
            <span className="font-semibold text-gray-700">{wbsList.length}</span>
          </p>
        </div>
        <div><Button>Add New Line Item</Button></div>
      </div>

      <DataTable
        columns={columns}
        data={wbsList}
        onRowClick={handleRowClick}
        searchPlaceholder="Search WBS by name or type..."
        pageSizeOptions={[10, 25, 50, 100]}
      />

      {/* ✅ Modal for WBS Details */}
      {selectedWBS && (
        <GetWBSByID id={selectedWBS} onClose={() => setSelectedWBS(null)} />
      )}
    </div>
  );
};

export default AllWBS;
