/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Layers,
  X,
} from "lucide-react";
import Service from "../../../api/Service";

import { Button } from "../../ui/button";
import GetWBSByIDsHours from "./GetWBSByIDsHours";

// Helper function to convert decimal hours to hh:mm format
const formatDecimalHoursToTime = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return "00:00";
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const GetWBSByID = ({
  id,
  projectId,
  stage,
  onClose,
  initialData,
}) => {
  console.log(initialData);

  const wbsData = initialData || null;
  const [wbs, setWbs] = useState(wbsData);
  const [lineItems, setLineItems] = useState(
    initialData?.wbs ||
    initialData?.bundle?.wbsTemplates ||
    initialData?.wbsTemplates ||
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWbsId, setSelectedWbsId] = useState(null);

  useEffect(() => {
    if (initialData) {
      setWbs(initialData);
      setLineItems(
        initialData?.wbs ||
        initialData?.bundle?.wbsTemplates ||
        initialData?.wbsTemplates ||
        []
      );
    }
  }, [initialData]);

  useEffect(() => {
    // Only fetch if we don't have templates in initialData
    if (!lineItems || lineItems.length === 0) {
      if (id) fetchWBSById(id);
    }
  }, [id, projectId, stage]);

  const fetchWBSById = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await Service.GetWBSLineItemById(projectId, id, stage);
      console.log("WBS Detail Response:", response);
      // Handle potential different response structures from the new endpoint
      if (response && response.data) {
        setLineItems(response.data || []);
      } else if (response && Array.isArray(response.data)) {
        // If it returns { lineItems: [...] } but no wbs metadata, we might need to handle it
        // For now assume it has the metadata or it's the old structure
        setWbs(response);
      } else {
        setWbs(response || null);
      }
    } catch (err) {
      console.error("Error fetching WBS:", err);
      setError("Failed to load WBS details");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <p className="text-sm font-semibold text-gray-700 line-clamp-2">
          {row.original.name ||
            row.original.wbsTemplate?.name ||
            row.original.description ||
            row.original.wbsTemplateKey ||
            "—"}
        </p>
      ),
      enableColumnFilter: true,
    },
    {
      accessorKey: "discipline",
      header: "Discipline",
      cell: ({ row }) => (
        <span className="text-xs font-medium text-gray-500 uppercase">
          {row.original.discipline || "—"}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: "qtyNo",
      accessorFn: (row) => row.qtyNo ?? row.totalQtyNo ?? 0,
      header: "Qty",
      cell: ({ row }) => (
        <span className="text-sm  text-green-700 bg-green-50 px-2 py-1 rounded-md">
          {row.getValue("qtyNo")}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "execHr",
      header: "Exec Total",
      cell: ({ row }) => (
        <span className="text-sm  text-gray-700">
          {formatDecimalHoursToTime(row.original.execHr ?? row.original.totalExecHr ?? 0)}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "checkHr",
      header: "Check Total",
      cell: ({ row }) => (
        <span className="text-sm  text-gray-700">
          {formatDecimalHoursToTime(row.original.checkHr ?? row.original.totalCheckHr ?? 0)}
        </span>
      ),
      enableSorting: true,
    },
  ];

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
      : "—";

  if (loading && !wbs)
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 border border-white/20">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
            <Loader2 className="w-6 h-6 text-green-600 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-green-900 font-medium animate-pulse">
            Fetching WBS details...
          </p>
        </div>
      </div>
    );

  if (error || !wbs)
    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4 max-w-md text-center border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl  text-gray-700">Oops!</h3>
          <p className="text-gray-700">{error || "WBS data not found"}</p>
          <Button
            onClick={onClose}
            className="mt-2 bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-200"
          >
            Close Window
          </Button>
        </div>
      </div>
    );

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl border border-gray-100 flex flex-col animate-in fade-in zoom-in duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Section */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-green-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-100">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl  text-gray-700 tracking-tight">
                {wbsData?.bundle?.bundleKey ||
                  wbsData?.bundleKey ||
                  "Bundle Details"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px]  uppercase rounded-md tracking-wider">
                  {wbsData?.stage || "—"}
                </span>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-gray-600 text-xs">Project Bundle</span>
              </div>
            </div>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <GetWBSByIDsHours
          wbsData={wbsData}
          lineItems={lineItems}
          loading={loading}
          columns={columns}
          selectedWbsId={selectedWbsId}
          setSelectedWbsId={setSelectedWbsId}
          formatDate={formatDate}
        />
      </div>
    </div>
  );
};

export default GetWBSByID;
