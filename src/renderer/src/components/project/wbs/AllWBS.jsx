/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useDispatch } from "react-redux";

import DataTable from "../../ui/table";
import { Button } from "../../ui/button";

import Service from "../../../api/Service";
import GetWBSByID from "./GetWBSByID";
import FetchWBSTemplate from "./FetchWBSTemplate";
import { setWBSForProject } from "../../../store/wbsSlice";

const AllWBS = ({ id, stage }) => {
  const dispatch = useDispatch();

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const projectId = id;
  const canViewDetails = ["admin", "operation_executive", "deputy_manager", "estimation_head"].includes(userRole);
  console.log(userRole);

  const [wbsBundles, setWbsBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWBS, setSelectedWBS] = useState(null);
  const [showFetchTemplate, setShowFetchTemplate] = useState(false);

  // ✅ Convert MINUTES → HH:mm (NO seconds)
  const formatMinutesToTime = (totalMinutes) => {
    if (!totalMinutes) return "00:00";

    // Ensure it's a number and handle any string inputs
    const numMinutes = Number(totalMinutes);
    if (isNaN(numMinutes) || numMinutes <= 0) return "00:00";

    const hours = Math.floor(numMinutes / 60);
    const minutes = Math.round(numMinutes % 60);

    // Handle edge case where rounding minutes gives 60
    if (minutes === 60) {
      return `${String(hours + 1).padStart(2, "0")}:00`;
    }

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  };

  // ✅ Fetch all WBS bundles
  const fetchAllWBS = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await Service.GetBundleByProjectId(projectId);
      const data = response?.data || [];

      setWbsBundles(data);
      dispatch(setWBSForProject({ projectId, wbs: data }));
    } catch (err) {
      console.error("Error fetching WBS:", err);
      setError("Failed to load WBS data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllWBS();
  }, [id, stage]);

  // ✅ Table columns
  const columns = [
    {
      accessorKey: "bundleKey",
      header: "Bundle Name",
      cell: ({ row }) => (
        <span className="text-black font-normal">
          {row.original.name ||
            row.original.bundle?.name ||
            row.original.bundleKey ||
            "—"}
        </span>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => (
        <span className="text-sm font-normal text-black tracking-tight uppercase">
          {row.original.stage || "—"}
        </span>
      ),
    },
    // {
    //   accessorKey: "totalQtyNo",
    //   header: "Quantity",
    //   cell: ({ row }) => (
    //     <span className="text-sm font-bold text-gray-700">
    //       {row.original.totalQtyNo || 0}
    //     </span>
    //   ),
    // },
    {
      accessorKey: "totalExecHr",
      header: "Exec Time",
      cell: ({ row }) => (
        <span className="text-sm font-normal text-black">
          {formatMinutesToTime(row.original.totalExecHr)} hrs
        </span>
      ),
    },
    {
      accessorKey: "totalCheckHr",
      header: "Check Time",
      cell: ({ row }) => (
        <span className="text-sm font-normal text-black">
          {formatMinutesToTime(row.original.totalCheckHr)} hrs
        </span>
      ),
    },
  ];

  // ✅ Row click handler
  const handleRowClick = (row) => {
    setSelectedWBS(row);
  };

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2 opacity-20" />
        <span className="text-sm font-black uppercase tracking-widest opacity-40">Loading WBS...</span>
      </div>
    );
  }

  // ✅ Error state
  if (error) {
    return (
      <div className="flex justify-center items-center py-20 text-red-400">
        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-sm font-black uppercase tracking-widest opacity-60">{error}</span>
      </div>
    );
  }

  // ✅ Table configuration update
  return (
    <div className="bg-[#fcfdfc] min-h-[400px] p-2 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-6">
        

        {(userRole === "admin" ||
          userRole === "operation_executive" ||
          userRole === "estimation_head") && (
            <Button
              onClick={() => setShowFetchTemplate(true)}
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
            >
              Add New Bundle
            </Button> 
          )}
      </div>

      <DataTable
        columns={columns}
        data={wbsBundles}
        onRowClick={canViewDetails ? handleRowClick : undefined}
        disablePagination={true}
        initialSorting={[
          { id: "totalQtyNo", desc: true },
          { id: "bundleKey", desc: false },
        ]}
      />

      {/* ✅ Selected WBS Modal */}
      {selectedWBS && (
        <GetWBSByID
          projectId={projectId}
          id={selectedWBS.id || selectedWBS.fabId || ""}
          stage={selectedWBS.stage || ""}
          initialData={selectedWBS}
          onClose={() => setSelectedWBS(null)}
        />
      )}

      {/* ✅ Fetch Template Modal */}
      {showFetchTemplate && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full">
            <FetchWBSTemplate
              id={projectId}
              onClose={() => setShowFetchTemplate(false)}
              onSelect={() => {
                setShowFetchTemplate(false);
                fetchAllWBS();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllWBS;
