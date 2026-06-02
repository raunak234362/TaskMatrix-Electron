import React from "react";
import { HelpCircle, Plus } from "lucide-react";

const WprRfiTable = ({
  rfis,
  canEdit,
  activeCell,
  editValue,
  setEditValue,
  inputRef,
  onCellClick,
  onCellSave,
  onKeyDown,
  onAddRow,
  onRowClick
}) => {

  const handleTdClick = (e, field, value, rowId) => {
    if (canEdit) {
      e.stopPropagation();
      onCellClick("rfi", rowId, field, value);
    } else if (onRowClick) {
      onRowClick(rowId);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <HelpCircle className="text-black w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">2. RFI Status Overview</h3>
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
        <table className="w-full text-left border-collapse min-w-[800px] text-xs">
          <thead>
            <tr className="bg-slate-100 border-b border-black">
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-24">RFI No.</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-28">Sent Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">Customer Response</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-36">Response Received</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10">Whiteboard Response</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black w-24">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {rfis.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onRowClick && onRowClick(row.id)}>
                {/* RFI No. */}
                <td
                  onClick={(e) => handleTdClick(e, "rfiNo", row.rfiNo, row.id)}
                  className="p-3 border-r border-black/10 font-bold text-black hover:bg-slate-100/50"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "rfiNo" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold text-xs text-black"
                    />
                  ) : (
                    <span>{row.rfiNo}</span>
                  )}
                </td>

                {/* Sent Date */}
                <td
                  onClick={(e) => handleTdClick(e, "sentDate", row.sentDate, row.id)}
                  className="p-3 border-r border-black/10 font-bold text-black hover:bg-slate-100/50"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "sentDate" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                    />
                  ) : (
                    <span>{row.sentDate}</span>
                  )}
                </td>

                {/* Customer Response */}
                <td
                  onClick={(e) => handleTdClick(e, "customerResponse", row.customerResponse, row.id)}
                  className="p-3 border-r border-black/10 font-bold text-black hover:bg-slate-100/50"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "customerResponse" ? (
                    <textarea
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                    />
                  ) : (
                    <span>{row.customerResponse?.replace(/&NBSP;|&nbsp;/gi, ' ')}</span>
                  )}
                </td>

                {/* Response Recd Date */}
                <td
                  onClick={(e) => handleTdClick(e, "responseReceivedDate", row.responseReceivedDate, row.id)}
                  className="p-3 border-r border-black/10 font-bold text-black hover:bg-slate-100/50"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "responseReceivedDate" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                    />
                  ) : (
                    <span>{row.responseReceivedDate}</span>
                  )}
                </td>

                {/* WBT Response */}
                <td
                  onClick={(e) => handleTdClick(e, "wbtResponse", row.wbtResponse, row.id)}
                  className="p-3 border-r border-black/10 font-bold text-black hover:bg-slate-100/50"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "wbtResponse" ? (
                    <textarea
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                    />
                  ) : (
                    <span>{row.wbtResponse?.replace(/&NBSP;|&nbsp;/gi, ' ')}</span>
                  )}
                </td>

                {/* Status */}
                <td
                  onClick={(e) => handleTdClick(e, "status", row.status, row.id)}
                  className="p-3 font-bold text-xs hover:bg-slate-100/50 text-black"
                >
                  {activeCell?.table === "rfi" && activeCell.rowId === row.id && activeCell.field === "status" ? (
                    <select
                      ref={inputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full bg-white border border-black px-1 py-1 rounded-none text-xs uppercase font-bold text-black"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="PARTIAL">PARTIAL</option>
                      <option value="CLOSED">CLOSED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="ANSWERED">ANSWERED</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-none border border-black ${row.status === "OPEN" ? "bg-blue-50 text-blue-700" :
                      row.status === "PARTIAL" ? "bg-orange-50 text-orange-700" :
                        (row.status === "COMPLETE" || row.status === "CLOSED") ? "bg-green-50 text-green-700" :
                          row.status === "PENDING" ? "bg-green-50 text-green-700" :
                            row.status === "ANSWERED" ? "bg-orange-50 text-orange-700" :
                              "bg-slate-50 text-slate-700"
                      }`}>
                      {row.status === "COMPLETE" || row.status === "CLOSED" ? "CLOSE" : row.status}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WprRfiTable;
