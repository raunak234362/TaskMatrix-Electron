import { useRef, useState } from "react";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useLocation } from "react-router-dom";
import CoTableView from "./CoTableView";

const CoTablePage = () => {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportRef = useRef(null);
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const hideCost = ["staff", "project_manager", "dept_manager"].includes(userRole);
  const canSeeCost = !hideCost;

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

  const sumCellValue = (val) => {
    if (val === undefined || val === null) return 0;
    if (val === "_MERGED_LEFT_" || val === "_MERGED_UP_" || val === -999999 || val === -999998) return 0;
    return Number(val) || 0;
  };

  const totalQty = rows.reduce((s, r) => s + sumCellValue(r.QtyNo), 0);
  const totalHours = rows.reduce((s, r) => s + sumCellValue(r.hours), 0);
  const totalCost = rows.reduce((s, r) => s + sumCellValue(r.cost), 0);

  const handleDownloadPdf = async () => {
    if (!exportRef.current) return;

    setIsExportingPdf(true);

    try {
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `COR-${co.changeOrderNumber || "table"}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Failed to export CO table PDF:", error);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 flex justify-between items-center gap-3">
          <div>
            <h1 className="text-2xl  text-green-700">
              Change Order Reference Table
            </h1>
            <p className="text-sm text-gray-700">
              COR-{co.changeOrderNumber?.slice(-3) || "—"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExportingPdf}
              className="inline-flex items-center gap-2 rounded-lg border border-green-600 bg-green-50 px-4 py-2 text-sm font-semibold text-green-700 transition hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Download className="h-4 w-4" />
              {isExportingPdf ? "Preparing PDF..." : "Download PDF"}
            </button>
            <span className="px-4 py-1 text-sm rounded-full bg-green-100 text-green-700 font-semibold">
              Read Only
            </span>
          </div>
        </div>

        <div ref={exportRef} className="space-y-6">
          {/* Summary Cards */}
          <div className={`grid grid-cols-1 gap-4 ${canSeeCost ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <SummaryCard label="Total Quantity" value={totalQty} />
            <SummaryCard label="Total Hours" value={`${totalHours} hrs`} />
            {canSeeCost && <SummaryCard label="Total Cost" value={`$${totalCost}`} />}
          </div>

          {/* Table */}
          <CoTableView rows={rows} canSeeCost={canSeeCost} />
        </div>

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
