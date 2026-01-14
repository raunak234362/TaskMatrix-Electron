
import { useEffect, useState } from "react";

import { Loader2, AlertCircle } from "lucide-react";
import DataTable from "../../ui/table";
import Service from "../../../api/Service";
import GetWBSByID from "./GetWBSByID";
import { Button } from "../../ui/button";
import FetchWBSTemplate from "./FetchWBSTemplate";

import { useDispatch } from "react-redux";
import { setWBSForProject } from "../../../store/wbsSlice";

const AllWBS = ({ id, stage }) => {
  const dispatch = useDispatch();
  const [wbsBundles, setWbsBundles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWBS, setSelectedWBS] = useState(null);
  const [showFetchTemplate, setShowFetchTemplate] = useState(false);
  const projectId = id;

  // ✅ Fetch all WBS items
  const fetchAllWBS = async () => {
    console.log("fetchAllWBS called for project:", projectId, "stage:", stage);
    try {
      setLoading(true);
      setError(null);

      const wbsBundlesResponse = await Service.GetBundleByProjectId(projectId);
      setWbsBundles(wbsBundlesResponse.data);
      console.log("Fetched WBS Bundle:", wbsBundlesResponse.data);
      dispatch(
        setWBSForProject({ projectId, wbs: wbsBundlesResponse.data || [] })
      );
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

  // ✅ Define table columns for bundles
  const columns = [
    {
      accessorKey: "bundleKey",
      header: "Bundle Name",
      cell: ({ row }) => (
        <span className="font-medium text-gray-700">
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
        <span className="text-gray-700">{row.original.stage || "—"}</span>
      ),
    },
    {
      accessorKey: "totalQtyNo",
      header: "Total Quantity",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.totalQtyNo || 0}</span>
      ),
    },
    {
      accessorKey: "totalExecHr",
      header: "Total Exec Hrs",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.totalExecHr || 0}</span>
      ),
    },
    {
      accessorKey: "totalCheckHr",
      header: "Total Check Hrs",
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.totalCheckHr || 0}</span>
      ),
    },
  ];

  // ✅ Handle row click — open details
  const handleRowClick = (row) => {
    setSelectedWBS(row);
  };

  // ✅ Render loading/error states
  if (loading)
    return (
      <div className="flex justify-center items-center py-10 text-gray-700">
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
          <h2 className="text-lg font-semibold text-gray-700 mb-3">
            Work Breakdown Structure (WBS)
          </h2>
          <p className="text-sm text-gray-700 mb-4">
            Total Bundles:{" "}
            <span className="font-semibold text-gray-700">
              {wbsBundles?.length || 0}
            </span>
          </p>
        </div>
        <div>
          <Button onClick={() => setShowFetchTemplate(true)}>
            Add New Bundle
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={wbsBundles || []}
        onRowClick={handleRowClick}
        detailComponent={({ row, close }) => (
          <GetWBSByID
            projectId={projectId}
            id={row.id || row.fabId || ""}
            stage={row.stage || ""}
            onClose={close}
            initialData={row}
          />
        )}
        searchPlaceholder="Search bundles by name..."
        pageSizeOptions={[10, 25, 50, 100]}
        initialSorting={[
          { id: "totalQtyNo", desc: true },
          { id: "bundleKey", desc: false },
        ]}
      />

      {/* ✅ Modal for WBS Details */}
      {selectedWBS && (
        <GetWBSByID
          projectId={projectId}
          id={selectedWBS.id || selectedWBS.fabId || ""}
          stage={selectedWBS.stage || ""}
          initialData={selectedWBS}
          onClose={() => setSelectedWBS(null)}
        />
      )}

      {/* ✅ Modal for Fetching WBS Templates */}
      {showFetchTemplate && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <FetchWBSTemplate
              id={id}
              onClose={() => setShowFetchTemplate(false)}
              onSelect={() => {
                setShowFetchTemplate(false);
                fetchAllWBS(); // Refresh the list after selection
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AllWBS;
