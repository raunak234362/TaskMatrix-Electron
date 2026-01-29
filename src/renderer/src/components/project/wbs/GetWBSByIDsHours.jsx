/* eslint-disable @typescript-eslint/no-explicit-any */
import { Loader2, ListChecks, Clock, Layers } from "lucide-react";
import { Button } from "../../ui/button";
import DataTable from "../../ui/table";
import GetWBSLineItem from "./GetWBSLineItem";

// Helper function to convert decimal hours to hh:mm format
const formatDecimalHoursToTime = (decimalHours) => {
    if (!decimalHours || decimalHours === 0) return "00:00";
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const GetWBSByIDsHours = ({
    wbsData,
    lineItems,
    loading,
    columns,
    selectedWbsId,
    setSelectedWbsId,
    formatDate,
}) => {
    return (
        <>
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
                                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 p-4">
                                    <div className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
                                        <GetWBSLineItem
                                            wbsId={selectedWbsId}
                                            onClose={() => setSelectedWbsId(null)}
                                        />
                                    </div>
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
                {/* <Button
                    variant="outline"
                    className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
                >
                    Download Report
                </Button> */}
                {/* <Button className="text-white shadow-lg shadow-green-100">
                    Add Quantity
                </Button> */}
            </div>
        </>
    );
};

const DetailCard = ({ label, value, icon }) => (
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

const StatCard = ({ label, value, subValue, subLabel, color }) => {
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
                <p className="text-2xl font-black tracking-tight">
                    {formatDecimalHoursToTime(value ?? 0)}
                </p>
            </div>
            {subValue !== undefined && (
                <div className="mt-3 pt-3 border-t border-current/10 flex items-center justify-between">
                    <span className="text-[9px] uppercase font-bold opacity-60">
                        {subLabel}
                    </span>
                    <span className="text-xs font-bold">
                        {formatDecimalHoursToTime(subValue)}
                    </span>
                </div>
            )}
        </div>
    );
};

export default GetWBSByIDsHours;
