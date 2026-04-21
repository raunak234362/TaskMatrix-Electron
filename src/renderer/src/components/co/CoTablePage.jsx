import { useLocation } from "react-router-dom";
import CoTableView from "./CoTableView";

const CoTablePage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const encodedData = params.get("coData");

  if (!encodedData) {
    return <div className="p-6 text-red-500">No Change Order data found</div>;
  }

  let co;
  try {
    co = JSON.parse(encodedData);
  } catch (err) {
    console.error("Failed to parse CO data:", err);
    return (
      <div className="p-8 text-center bg-white rounded-3xl mt-10 shadow-xl border-4 border-red-50 max-w-xl mx-auto">
        <h2 className="text-xl font-black text-red-600 uppercase tracking-widest mb-4">Data Error</h2>
        <p className="text-gray-600 mb-6">The Change Order data is too large for the browser to transfer via URL, or the link is corrupted.</p>
        <button 
          onClick={() => window.close()}
          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 uppercase font-black tracking-widest text-[10px]"
        >
          Close Tab
        </button>
      </div>
    );
  }

  const rows = co.changeOrderTables || co.CoRefersTo || [];

  const totalQty = rows.reduce((s, r) => s + (r.QtyNo || 0), 0);
  const totalHours = rows.reduce((s, r) => s + (r.hours || 0), 0);
  const totalCost = rows.reduce((s, r) => s + (r.cost || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl  text-green-700">
              Change Order Reference Table
            </h1>
            <p className="text-sm text-gray-700">
              COR-{co.changeOrderNumber?.slice(-3) || "—"}
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
    <p className="text-2xl  text-gray-700 mt-1">{value}</p>
  </div>
);

export default CoTablePage;
