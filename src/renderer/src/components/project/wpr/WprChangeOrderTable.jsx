import React from "react";
import { Clock, Plus } from "lucide-react";

const WprChangeOrderTable = ({
  coRows,
  canEdit,
  activeCell,
  editValue,
  setEditValue,
  inputRef,
  onCellClick,
  onCellSave,
  onKeyDown,
  onAddRow
}) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="text-black w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">3. Change Order Amount ($) Monthly Breakdown</h3>
        </div>
        {canEdit && (
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded-none text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </button>
        )}
      </div>

      <div className="overflow-x-auto border border-black rounded-none bg-white shadow-sm custom-scrollbar max-w-full">
        <table className="w-full text-center border-collapse min-w-[1000px] text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-3 text-left font-bold uppercase tracking-wider text-black border-r border-black/10">Change Order</th>
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                <th key={m} className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">{m}</th>
              ))}
              <th className="p-3 font-bold uppercase tracking-wider text-black">FY Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10 font-bold text-black">
            {coRows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                {/* CO number name */}
                <td
                  onClick={() => onCellClick("co", row.id, "changeOrder", row.changeOrder)}
                  className="p-3 text-left font-bold text-black border-r border-black/10 cursor-pointer hover:bg-slate-100/50"
                >
                  {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === "changeOrder" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold text-xs text-black"
                    />
                  ) : (
                    <span>{row.changeOrder}</span>
                  )}
                </td>

                {/* Monthly amount columns */}
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(m => (
                  <td
                    key={m}
                    onClick={() => onCellClick("co", row.id, m, row[m])}
                    className="p-3 border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black"
                  >
                    {activeCell?.table === "co" && activeCell.rowId === row.id && activeCell.field === m ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-8/12 bg-white border border-black px-1 py-0.5 rounded-none text-center text-xs text-black"
                      />
                    ) : (
                      <span className={row[m] === "Sent" ? "text-blue-600 font-bold" : ""}>{row[m] || "—"}</span>
                    )}
                  </td>
                ))}

                {/* Total */}
                <td className="p-3 font-bold text-black">{row.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WprChangeOrderTable;
