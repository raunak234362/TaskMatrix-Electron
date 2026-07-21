import React, { useState } from "react";
import { Loader2, ListChecks, Layers } from "lucide-react";
import { Button } from "../../ui/button";
import DataTable from "../../ui/table";
import GetWBSLineItem from "./GetWBSLineItem";
import AddNewWBSItem from "./AddNewWBSItem";

// Helper function to convert decimal hours to hh:mm format
const formatDecimalHoursToTime = (decimalHours) => {
  if (!decimalHours || decimalHours === 0) return "00:00";
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const GetWBSByIDsHours = ({
  projectId,
  wbsData,
  lineItems,
  loading,
  columns,
  selectedWbsId,
  setSelectedWbsId,
  formatDate,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const bundleKey = wbsData?.bundle?.bundleKey || wbsData?.bundleKey || "";

  return (
    <>
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        {/* Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <SummaryCard
            label="Stage"
            value={wbsData.stage}
          />
          <SummaryCard
            label="Total Quantity"
            value={wbsData?.totalQtyNo || 0}
          />
          <SummaryCard
            label="Last Updated"
            value={formatDate(wbsData?.updatedAt)}
          />
        </div>

        {/* Hours Overview */}
        <section>
          <div className="flex items-center gap-2 mb-10 mt-10">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <h3 className="text-lg font-semibold text-black uppercase tracking-wider">
              Hours Overview
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="Execution Hours"
              value={wbsData?.totalExecHr / 60 || 0}
              subValue={(wbsData?.execHrWithRework || 0) / 60}
              subLabel="w/ Rework"
            />
            <StatCard
              label="Checking Hours"
              value={wbsData?.totalCheckHr / 60 || 0}
              subValue={(wbsData?.checkHrWithRework || 0) / 60}
              subLabel="w/ Rework"
            />
            <StatCard
              label="Total Hours"
              value={
                (wbsData?.totalExecHr / 60 || 0) + (wbsData?.totalCheckHr / 60 || 0)
              }
              subValue={
                (wbsData?.execHrWithRework / 60 || 0) +
                (wbsData?.checkHrWithRework / 60 || 0)
              }
              subLabel="Rework Total"
            />
          </div>
        </section>

        {/* Line Items Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 bg-green-600 rounded-full"></div>
              <h3 className="text-lg font-semibold text-black uppercase tracking-wider">WBS Items</h3>
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
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
                  <div className="w-full max-w-[90vw] max-h-[92vh] overflow-hidden">
                    <GetWBSLineItem
                      wbsId={selectedWbsId}
                      onClose={() => setSelectedWbsId(null)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center bg-gray-50 rounded-none border border-black border-dashed">
              <div className="w-16 h-16 bg-white border border-black flex items-center justify-center shadow-sm mb-4">
                <ListChecks className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-black font-semibold uppercase tracking-wider text-sm">
                No line items found for this WBS.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* Footer Section */}
      <div className="px-8 py-6 border-t border-black bg-white flex justify-end gap-4">
        <Button
          className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Download Report
        </Button>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
        >
          Add Quantity
        </Button>
      </div>

      <AddNewWBSItem
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        bundleKey={bundleKey}
        projectId={projectId}
      />
    </>
  );
};

const SummaryCard = ({ label, value }) => {
  const isLongValue = typeof value === "string" && value.length > 15;
  return (
    <div
      className="p-5 border border-black border-l-[6px] border-l-green-600 bg-white flex flex-col justify-center h-full shadow-sm hover:shadow-md transition-all duration-200"
      style={{ minHeight: "100px" }}
    >
      <div className="flex justify-between items-center w-full gap-4">
        <span className="text-xl font-semibold  text-black uppercase tracking-wider whitespace-nowrap">
          {label}
        </span>
        <span className={`font-semibold text-black text-right ${isLongValue ? "text-sm" : "text-2xl"}`}>
          {value || "—"}
        </span>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, subLabel }) => {
  return (
    <div
      className="p-5 border border-black border-l-[6px] border-l-green-600 bg-white flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-all duration-200"
      style={{ minHeight: "115px" }}
    >
      <div className="flex justify-between items-center w-full">
        <span className="text-lg font-semibold text-black uppercase tracking-wider">
          {label}
        </span>
        <span className="text-xl font-semibold text-black">
          {formatDecimalHoursToTime(value ?? 0)}
        </span>
      </div>
      {subValue !== undefined ? (
        <div className="mt-4 pt-3 border-t border-black/10 flex justify-between items-center w-full">
          <span className="text-[15px] font-bold text-gray-900 uppercase tracking-widest">
            {subLabel}
          </span>
          <span className="text-sm font-extrabold text-black">
            {formatDecimalHoursToTime(subValue)}
          </span>
        </div>
      ) : (
        <div className="mt-4 pt-3 border-t border-transparent flex justify-between items-center w-full invisible">
          <span className="text-[10px] uppercase tracking-widest">
            Spacer
          </span>
          <span className="text-sm font-extrabold">
            00:00
          </span>
        </div>
      )}
    </div>
  );
};

export default GetWBSByIDsHours;
