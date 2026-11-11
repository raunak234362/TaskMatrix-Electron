import { useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, Download, FileSpreadsheet, FileText as FilePdf, X } from "lucide-react";
import { toast } from "react-toastify";

const DateRangeExportModal = ({ defaultFrom, defaultTo, defaultFormat, onClose, onExport }) => {
  const [fromDate, setFromDate] = useState(defaultFrom || "");
  const [toDate, setToDate] = useState(defaultTo || "");
  const [format, setFormat] = useState(defaultFormat || "pdf");

  return createPortal(
    <div
      className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none border-2 border-black shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-50 border border-black">
              <CalendarDays className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-black uppercase">Date Range Performance Report</h3>
              <p className="text-[10px] font-bold text-black/60 uppercase">
                Download performance report for custom date period
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-black hover:bg-gray-100 border border-black cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-black text-xs font-bold focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="w-full px-3 py-2 bg-white border border-black text-xs font-bold focus:ring-1 focus:ring-green-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-black uppercase mb-1">Report Format & Content</label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setFormat("pdf_summary")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "pdf_summary" || format === "pdf"
                    ? "bg-green-700 text-white border-green-800 shadow"
                    : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FilePdf size={14} /> PDF Summary (EPS & KPIs Only)
                </span>
                <span className="text-[9px] font-normal opacity-80">(Overview Page)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf_detailed")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "pdf_detailed"
                    ? "bg-green-700 text-white border-green-800 shadow"
                    : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FilePdf size={14} /> PDF Full Report
                </span>
                <span className="text-[9px] font-normal opacity-80">(Summary + Hours Breakdown)</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-between px-3 py-2 border font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                  format === "excel"
                    ? "bg-green-700 text-white border-green-800 shadow"
                    : "bg-white text-black border-black hover:bg-gray-50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={14} /> Excel Workbook
                </span>
                <span className="text-[9px] font-normal opacity-80">(.XLSX)</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-black border border-black font-bold text-xs uppercase hover:bg-gray-200 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (!fromDate && !toDate) {
                toast.warn("Please select at least a From or To date");
                return;
              }
              onExport(format, "range", fromDate, toDate);
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white border border-black font-bold text-xs uppercase hover:bg-green-700 shadow cursor-pointer"
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default DateRangeExportModal;
