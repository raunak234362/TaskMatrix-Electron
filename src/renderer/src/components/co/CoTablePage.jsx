import { useLocation } from "react-router-dom";
import CoTableView from "./CoTableView";

const CoTablePage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const encodedData = params.get("coData");

  if (!encodedData) {
    return <div className="p-6 text-red-500">No Change Order data found</div>;
  }

  const co = JSON.parse(decodeURIComponent(encodedData));

  const rows = co.CoRefersTo || [];

  const totalQty = rows.reduce((s, r) => s + (r.QtyNo || 0), 0);
  const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.cost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-green-700">
              Change Order Reference Table
            </h1>
            <p className="text-sm text-gray-700">
              CO #{co.changeOrderNumber}
            </p>
          </div>

          <span className="px-4 py-1 text-sm rounded-full bg-green-100 text-green-700 font-semibold">
            Read Only
          </span>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Quantity" value={totalQty} />
          <SummaryCard label="Total Hours" value={`${totalHours} hrs`} />
          <SummaryCard label="Total Cost" value={`$${totalCost}`} />
        </div>

        {/* Table */}
        <CoTableView rows={rows} />

        {/* Footer */}
        <div className="text-xs text-gray-400 text-center pt-4">
          This table is auto-generated from the Change Order and is read-only.
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border p-4">
    <p className="text-xs uppercase text-gray-700 font-semibold">{label}</p>
    <p className="text-2xl font-bold text-gray-700 mt-1">{value}</p>
  </div>
);

export default CoTablePage;
