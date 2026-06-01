import React from "react";
import { Printer, Download, Save, Loader2, ArrowLeft } from "lucide-react";

const WprToolbar = ({
  canEdit,
  saving,
  selectedWeekLabel,
  onBackToWeeks,
  onSaveChanges,
  onExportPDF,
  exportingPDF,
  onPrint
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-slate-200 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onBackToWeeks}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-none transition-colors"
          title="Back to Weeks"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Work Progress Report</h2>
          <p className="text-sm font-medium text-slate-500 uppercase">Week of {selectedWeekLabel}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2">
        
        <button
          onClick={onExportPDF}
          disabled={exportingPDF}
          className={`flex items-center gap-2 px-5 py-2 text-black border-2 rounded-none text-sm font-bold uppercase tracking-tight shadow-sm transition-all ${exportingPDF ? 'bg-red-100 border-red-700/80 cursor-not-allowed' : 'bg-red-50 border-red-700/80 hover:bg-red-100 cursor-pointer'}`}
        >
          {exportingPDF ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          {exportingPDF ? "Exporting..." : "PDF Export"}
        </button>
       
      </div>
    </div>
  );
};

export default WprToolbar;
