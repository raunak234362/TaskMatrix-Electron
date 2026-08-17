/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { Loader2, AlertCircle, RotateCw } from "lucide-react";
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
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncWBS = async () => {
    if (!projectId) return;
    try {
      setIsSyncing(true);
      await Service.SyncWBS(projectId);
      await fetchAllWBS();
    } catch (err) {
      console.error("Error syncing WBS:", err);
    } finally {
      setIsSyncing(false);
    }
  };

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

      const [bundleRes, taskRes] = await Promise.all([
        Service.GetBundleByProjectId(projectId).catch(() => null),
        Service.GetAllTask().catch(() => null),
      ]);

      let data = [];
      if (Array.isArray(bundleRes)) {
        data = bundleRes;
      } else if (Array.isArray(bundleRes?.data)) {
        data = bundleRes.data;
      } else if (Array.isArray(bundleRes?.data?.data)) {
        data = bundleRes.data.data;
      }

      // If backend returned empty bundles, synthesize bundle entries from project tasks
      if (data.length === 0 && taskRes) {
        const allTasks = Array.isArray(taskRes)
          ? taskRes
          : Array.isArray(taskRes?.data)
          ? taskRes.data
          : [];

        const projectTasks = allTasks.filter(
          (t) =>
            t.project_id === projectId ||
            t.project?.id === projectId ||
            (typeof t.project === "string" && t.project === projectId)
        );

        const bundleMap = {};
        projectTasks.forEach((t) => {
          const key =
            t.projectBundle?.bundleKey ||
            t.projectBundle?.name ||
            t.projectBundle?.bundle?.bundleKey ||
            t.bundleKey;
          if (!key) return;

          if (!bundleMap[key]) {
            bundleMap[key] = {
              id: t.projectBundle?.id || key,
              bundleKey: key,
              name: key,
              stage: t.Stage || t.stage || stage || "IFA",
              totalExecHr: 0,
              totalCheckHr: 0,
            };
          }

          const type = (t.wbsType || "").toLowerCase();
          const workedSecs = (t.workingHourTask || []).reduce(
            (s, w) => s + (Number(w.duration_seconds) || 0),
            0
          );
          const workedMins = Math.round(workedSecs / 60);

          if (type.includes("checking")) {
            bundleMap[key].totalCheckHr += workedMins;
          } else {
            bundleMap[key].totalExecHr += workedMins;
          }
        });

        data = Object.values(bundleMap);
      }

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
        <span className="text-black font-semibold">
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
        <span className="text-sm font-semibold text-black tracking-tight uppercase">
          {row.original.stage || "—"}
        </span>
      ),
    },
    {
      accessorKey: "totalExecHr",
      header: "Exec Time",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-black">
          {formatMinutesToTime(row.original.totalExecHr)} hrs
        </span>
      ),
    },
    {
      accessorKey: "totalCheckHr",
      header: "Check Time",
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-[#3a8a1a]">
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
        <div className="flex items-center gap-3">
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

          <Button
            onClick={handleSyncWBS}
            disabled={isSyncing}
            className="px-6 py-1.5 bg-blue-50 text-black border-2 border-blue-700/80 rounded-none hover:bg-blue-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer gap-2 disabled:opacity-50"
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-700" />
                Syncing WBS...
              </>
            ) : (
              <>
                <RotateCw className="w-4 h-4 text-blue-700" />
                Sync WBS
              </>
            )}
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={wbsBundles}
        onRowClick={canViewDetails ? handleRowClick : undefined}
        disablePagination={true}
        initialSorting={[
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
