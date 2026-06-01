import React from "react";
import { Download, Eye } from "lucide-react";

const WprWeeksTable = ({
  projectWeeks,
  currentWeekLabel,
  onSelectWeek,
  onDownloadWeek
}) => {
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2.5 h-6 bg-[#6bbd45] rounded-none" />
        <h2 className="text-lg font-bold uppercase tracking-wider text-black">Work Progress Reports</h2>
      </div>

      <div className="overflow-x-auto border border-black bg-white shadow-sm custom-scrollbar max-w-full">
        <table className="w-full text-left border-collapse min-w-[600px] text-sm">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-4 font-bold uppercase tracking-wider text-black border-r border-black/10">Report Week</th>
              <th className="p-4 font-bold uppercase tracking-wider text-black border-r border-black/10 w-48">Start Date</th>
              <th className="p-4 font-bold uppercase tracking-wider text-black border-r border-black/10 w-48">End Date</th>
              <th className="p-4 font-bold uppercase tracking-wider text-center text-black w-48">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {/* Master Sheet Row */}
            <tr className="hover:bg-slate-50 transition-all bg-[#eaf4fe]">
              <td className="p-4 font-bold border-r border-black/10 text-black">
                Master Sheet (All Weeks)
              </td>
              <td className="p-4 border-r border-black/10 font-medium text-black">Project Start</td>
              <td className="p-4 border-r border-black/10 font-medium text-black">Project End / Today</td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onSelectWeek("All")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all font-bold text-xs uppercase"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => onDownloadWeek("All")}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all font-bold text-xs uppercase"
                  >
                    <Download className="w-3.5 h-3.5" /> PDF
                  </button>
                </div>
              </td>
            </tr>

            {/* Individual Weeks */}
            {[...projectWeeks].reverse().map((w) => {
              const isCurrent = w.label === currentWeekLabel;
              return (
                <tr key={w.label} className={`hover:bg-slate-50 transition-all ${isCurrent ? "bg-green-50/50" : ""}`}>
                  <td className="p-4 font-bold border-r border-black/10 text-black flex items-center gap-2">
                    {w.label}
                    {isCurrent && <span className="px-2 py-0.5 bg-green-200 text-green-800 text-[10px] rounded-full uppercase tracking-wider">Current</span>}
                  </td>
                  <td className="p-4 border-r border-black/10 font-medium text-black">
                    {w.start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="p-4 border-r border-black/10 font-medium text-black">
                    {w.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onSelectWeek(w.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all font-bold text-xs uppercase"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                      <button
                        onClick={() => onDownloadWeek(w.label)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-all font-bold text-xs uppercase"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {projectWeeks.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-slate-500 font-medium italic">
                  No weeks generated. Ensure project start date is set.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WprWeeksTable;
