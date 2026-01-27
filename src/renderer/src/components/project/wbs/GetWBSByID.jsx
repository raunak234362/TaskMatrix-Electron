/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Loader2,
  AlertCircle,
  Layers,
  ListChecks,
  Clock,
  X,
} from "lucide-react";
import Service from "../../../api/Service";

import { Button } from "../../ui/button";
import DataTable from "../../ui/table";
import GetWBSLineItem from "./GetWBSLineItem";

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
        <span className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded-md">
          {row.getValue("qtyNo")}
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "execHr",
      header: "Exec Total",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-700">
          {(row.original.execHr ?? row.original.totalExecHr ?? 0).toFixed(1)}h
        </span>
      ),
      enableSorting: true,
    },
    {
      accessorKey: "checkHr",
      header: "Check Total",
      cell: ({ row }) => (
        <span className="text-sm font-bold text-gray-700">
          {(row.original.checkHr ?? row.original.totalCheckHr ?? 0).toFixed(1)}h
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
          <h3 className="text-xl font-bold text-gray-700">Oops!</h3>
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
              <h2 className="text-2xl font-bold text-gray-700 tracking-tight">
                {wbsData?.bundle?.bundleKey ||
                  wbsData?.bundleKey ||
                  "Bundle Details"}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md tracking-wider">
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

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {/* Summary Grid */}

          <div className="bg-gray-900 rounded-2xl p-2 text-white shadow-xl shadow-gray-200 flex flex-col justify-between">
            <div>
              <DetailCard
                label="Stage"
                value={wbsData.stage}
                icon={<Layers className="w-4 h-4" />}
              />
              <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-1">
                Total Quantity
              </p>
              <h3 className="text-2xl font-bold text-white">
                {wbsData?.totalQtyNo || 0}
              </h3>
            </div>
            <div className="pt-4 border-t border-gray-800 mt-4 flex justify-between items-end">
              <div>
                <p className="text-gray-700 text-[10px] uppercase font-bold">
                  Last Updated
                </p>
                <p className="text-xs text-gray-300">
                  {formatDate(wbsData?.updatedAt)}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-green-400" />
              </div>
            </div>
          </div>

          {/* Hours Overview */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-green-600 rounded-full"></div>
              <h3 className="text-lg font-bold text-gray-700">
                Hours Overview
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Execution Hours"
                value={wbsData?.totalExecHr || 0}
                subValue={wbsData?.execHrWithRework}
                subLabel="w/ Rework"
                color="green"
              />
              <StatCard
                label="Checking Hours"
                value={wbsData?.totalCheckHr || 0}
                subValue={wbsData?.checkHrWithRework}
                subLabel="w/ Rework"
                color="indigo"
              />
              <StatCard
                label="Total Hours"
                value={
                  (wbsData?.totalExecHr || 0) + (wbsData?.totalCheckHr || 0)
                }
                color="gray"
              />
              <StatCard
                label="Rework Total"
                value={
                  (wbsData?.execHrWithRework || 0) +
                  (wbsData?.checkHrWithRework || 0)
                }
                color="red"
              />
            </div>
          </section>

          {/* Line Items Table */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1 h-6 bg-green-600 rounded-full"></div>
                <h3 className="text-lg font-bold text-gray-700">WBS Items</h3>
                <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full">
                  {lineItems?.length || 0} Items
                </span>
                {loading && (
                  <Loader2 className="w-4 h-4 text-green-600 animate-spin ml-2" />
                )}
              </div>
            </div>

            {lineItems && lineItems.length > 0 ? (
              <div className="space-y-6">
                <DataTable
                  columns={columns}
                  data={lineItems}
                  onRowClick={(row) => setSelectedWbsId(row.id)}
                  initialSorting={[
                    { id: "qtyNo", desc: true },
                    { id: "description", desc: false },
                  ]}
                />

                {selectedWbsId && (
                  <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">
                    <GetWBSLineItem
                      wbsId={selectedWbsId}
                      onClose={() => setSelectedWbsId(null)}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
                  <ListChecks className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-gray-700 font-medium">
                  No line items found for this WBS.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Footer Section */}
        <div className="px-8 py-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-4">
          <Button
            variant="outline"
            className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
          >
            Download Report
          </Button>
          <Button className="text-white shadow-lg shadow-green-100">
            Add Quantity
          </Button>
        </div>
      </div>
    </div>
  );
};

const DetailCard = ({
  label,
  value,
  icon,
}) => (
  <div className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-start gap-3">
    <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
      {icon}
    </div>
    <div>
      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-700">{value || "—"}</p>
    </div>
  </div>
);

const StatCard = ({
  label,
  value,
  subValue,
  subLabel,
  color,
}) => {
  const colors = {
    green: "bg-green-50 text-green-700 border-green-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
    gray: "bg-gray-50 text-gray-700 border-gray-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div
      className={`p-5 rounded-2xl border ${colors[color]} flex flex-col justify-between h-full`}
    >
      <div>
        <p className="text-[10px] uppercase font-bold opacity-70 tracking-wider mb-2">
          {label}
        </p>
        <p className="text-2xl font-black tracking-tight">{value ?? 0}h</p>
      </div>
      {subValue !== undefined && (
        <div className="mt-3 pt-3 border-t border-current/10 flex items-center justify-between">
          <span className="text-[9px] uppercase font-bold opacity-60">
            {subLabel}
          </span>
          <span className="text-xs font-bold">{subValue}h</span>
        </div>
      )}
    </div>
  );
};

export default GetWBSByID;
