import React from "react";
import { CheckCircle, Plus } from "lucide-react";

const WprScheduleTable = ({
  scheduleRows,
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
          <CheckCircle className="text-black w-5 h-5" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">1. Project Schedule / Milestones</h3>
        </div>
        {canEdit && (
          <button
            onClick={onAddRow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 text-green-750 rounded-none text-xs font-bold uppercase transition-all shadow-sm cursor-pointer"
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
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-56">Phase / Subject</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 w-28">Start Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[15rem]">IFA - Submission Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[8rem]">BFA - Recd Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[10rem]">IFC - Sub Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[16rem]">COR Drawing Submission Date</th>
              <th className="p-3 font-bold uppercase tracking-wider text-black min-w-[20rem]">Status & Comment</th>
            </tr>
          </thead>
          <tbody className="">
            {scheduleRows.map((row) => (
              <tr
                key={row.id}
                className={`transition-colors ${row._type === "milestone"
                  ? "bg-[#f0f7ed] hover:bg-[#e6f3e2]"
                  : "bg-white hover:bg-slate-50"
                  }`}
              >
                {/* Phase cell */}
                <td
                  onClick={() => onCellClick("schedule", row.id, "phase", row.phase)}
                  className="p-3 font-bold border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black"
                >
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "phase" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none font-bold uppercase text-xs text-black"
                    />
                  ) : (
                    <span className="uppercase">{row.phase}</span>
                  )}
                </td>

                {/* Start Date */}
                <td
                  onClick={() => onCellClick("schedule", row.id, "startDate", row.startDate)}
                  className="p-3 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50"
                >
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "startDate" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={onCellSave}
                      onKeyDown={onKeyDown}
                      className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                    />
                  ) : (
                    <span>{row.startDate}</span>
                  )}
                </td>

                {/* IFA submission date */}
                <td className="p-0 border-r border-black/10 align-top h-[1px]">
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifaSubDate" ? (
                    <div className="p-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    </div>
                  ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${row.unifiedEntries.length}, minmax(0, 1fr))` }}>
                      {row.unifiedEntries.map((entry, i) => (
                        <div key={i} className="flex flex-col justify-center p-3">
                          {entry.ifaDate !== "—" ? (
                            <>
                              <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                {entry.subject}
                              </span>
                              <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                                {entry.stage && entry.stage.toUpperCase() !== "IFA" ? `${entry.stage.toUpperCase()} - ` : ""}{entry.ifaDate}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="block p-3 text-gray-400">—</span>
                  )}
                </td>

                {/* BFA date */}
                <td
                  onClick={() => onCellClick("schedule", row.id, "bfaRecdDate", row.bfaRecdDate)}
                  className="p-0 border-r border-black/10 align-top cursor-pointer hover:bg-slate-100/50 h-[1px]"
                >
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "bfaRecdDate" ? (
                    <div className="p-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    </div>
                  ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${row.unifiedEntries.length}, minmax(0, 1fr))` }}>
                      {row.unifiedEntries.map((entry, i) => (
                        <div key={i} className="flex flex-col justify-center p-3">
                          {entry.bfaDate !== "—" ? (
                            <>
                              <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                {entry.subject}
                              </span>
                              <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                                {entry.bfaDate}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="block p-3 text-gray-400">—</span>
                  )}
                </td>

                {/* IFC sub date */}
                <td className="p-0 border-r border-black/10 align-top h-[1px]">
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "ifcSubDate" ? (
                    <div className="p-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    </div>
                  ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${row.unifiedEntries.length}, minmax(0, 1fr))` }}>
                      {row.unifiedEntries.map((entry, i) => (
                        <div key={i} className="flex flex-col justify-center p-3">
                          {entry.ifcDate !== "—" ? (
                            <>
                              <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                {entry.subject}
                              </span>
                              <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                                {entry.ifcDate}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="block p-3 text-gray-400">—</span>
                  )}
                </td>

                {/* COR Drawing Sub date */}
                <td className="p-0 border-r border-black/10 align-top h-[1px]">
                  {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "corSubDate" ? (
                    <div className="p-3">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-1 rounded-none text-xs text-black"
                      />
                    </div>
                  ) : row.unifiedEntries && row.unifiedEntries.length > 0 ? (
                    <div className="grid h-full" style={{ gridTemplateRows: `repeat(${row.unifiedEntries.length}, minmax(0, 1fr))` }}>
                      {row.unifiedEntries.map((entry, i) => (
                        <div key={i} className="flex flex-col justify-center p-3">
                          {entry.corDate !== "—" ? (
                            <>
                              <span className="text-[11px] font-bold text-blue-800 leading-tight">
                                {entry.subject}
                              </span>
                              <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                                {entry.corDate}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="block p-3 text-gray-400">—</span>
                  )}
                </td>

                {/* Status & Comment */}
                <td className="p-0 align-top h-[1px]">
                  {(() => {
                    const STATUS_LABELS = {
                      WAITING_FOR_BFA: "Waiting for BFA",
                      BFA_RECEIVED: "BFA RECEIVED",
                      BFA_SENT: "BFA SENT",
                      SUBMITTED_TO_EOR: "Submitted to EOR",
                      RELEASE_FOR_FABRICATION: "Release for Fab",
                      NOT_APPROVED: "Not Approved",
                      REVISED_RESUBMITTAL: "Revised & Resubmitted",
                      REVISED_RESUBMIT_FOR_FABRICATION: "Revised & Resub for Fab",
                      PENDING: "Pending",
                      COMPLETE: "BFA - Complete",
                      COMPLETED: "BFA - Complete",
                      PARTIAL: "BFA - Partial",
                      SUCCESS: "BFA - Success",
                    };
                    const STATUS_COLORS = {
                      WAITING_FOR_BFA: "bg-purple-100 text-purple-700 border-purple-200",
                      BFA_RECEIVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
                      BFA_SENT: "bg-indigo-100 text-indigo-700 border-indigo-200",
                      SUBMITTED_TO_EOR: "bg-blue-100 text-blue-700 border-blue-200",
                      RELEASE_FOR_FABRICATION: "bg-green-100 text-green-700 border-green-200",
                      NOT_APPROVED: "bg-red-100 text-red-700 border-red-200",
                      REVISED_RESUBMITTAL: "bg-orange-100 text-orange-700 border-orange-200",
                      REVISED_RESUBMIT_FOR_FABRICATION: "bg-orange-100 text-orange-700 border-orange-200",
                      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-200",
                      COMPLETE: "bg-teal-100 text-teal-700 border-teal-200",
                      COMPLETED: "bg-teal-100 text-teal-700 border-teal-200",
                      PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
                      SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
                    };

                    const renderBadge = (rawStatus) => {
                      if (!rawStatus || rawStatus === "—") return null;
                      const st = String(rawStatus).toUpperCase();
                      const label = STATUS_LABELS[st] || rawStatus;
                      const colors = STATUS_COLORS[st] || "bg-gray-100 text-gray-700 border-gray-200";
                      return (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-widest border shrink-0 ${colors}`}>
                          {label}
                        </span>
                      );
                    };

                    if (row.unifiedEntries && row.unifiedEntries.length > 0) {
                      const allDone = row.unifiedEntries.every(entry => {
                        const st = String(entry.status || "—").toUpperCase();
                        return entry.bfaDate !== "—" || ["COMPLETE", "COMPLETED", "SUCCESS", "BFA_RECEIVED", "RELEASE_FOR_FABRICATION"].includes(st);
                      });

                      const hasAnyNotes = row.unifiedEntries.some(entry => entry.notes && typeof entry.notes === "string" && entry.notes.trim() !== "");

                      if (allDone && !hasAnyNotes) {
                        return (
                          <div className="flex h-full items-center gap-2 p-3">
                            {renderBadge("COMPLETE")}
                          </div>
                        );
                      }

                      return (
                        <div className="grid h-full" style={{ gridTemplateRows: `repeat(${row.unifiedEntries.length}, minmax(0, 1fr))` }}>
                          {row.unifiedEntries.map((entry, i) => {
                            const hasNote = entry.notes && typeof entry.notes === "string" && entry.notes.trim() !== "";
                            return (
                              <div key={i} className="flex flex-col justify-center gap-1.5 p-3 border-b border-black/5 last:border-b-0">
                                <div>{renderBadge(allDone ? "COMPLETE" : entry.status)}</div>
                                {hasNote && (
                                  <div className="text-[11px] text-gray-700 font-normal break-words">
                                    {entry.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    const hasComments = row.comments && row.comments !== "—" && typeof row.comments === "string" && row.comments.trim() !== "";
                    return (
                      <div className="flex flex-col justify-center gap-1.5 p-3 h-full">
                        <div>{renderBadge(row.submittalStatus)}</div>
                        {hasComments && (
                          <div className="text-[11px] text-gray-700 break-words font-normal">
                            {row.comments}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WprScheduleTable;
