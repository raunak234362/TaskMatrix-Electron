import React, { useState } from "react";
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
  const [expandedNotes, setExpandedNotes] = useState({});

  const toggleNote = (noteKey) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteKey]: !prev[noteKey],
    }));
  };

  const cleanHtmlContent = (htmlStr) => {
    if (!htmlStr) return "";
    if (!/<[a-z][\s\S]*>/i.test(String(htmlStr))) return String(htmlStr).trim();

    let text = String(htmlStr).replace(/<br\s*[\/]?>/gi, "\n");
    text = text.replace(/<\/p>|<\/div>|<\/li>/gi, "\n");
    text = text.replace(/<li>/gi, "• ");
    text = text.replace(/&nbsp;/gi, " ");

    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");
    return (doc.body.textContent || "").trim().replace(/\n{3,}/g, "\n\n");
  };

  const renderExpandableNote = (rawNoteText, noteKey, maxLength = 70) => {
    const noteText = cleanHtmlContent(rawNoteText);
    if (!noteText || noteText === "—") return null;

    if (noteText.length <= maxLength) {
      return (
        <div className="text-[11px] text-gray-700 font-normal break-words leading-tight whitespace-pre-line">
          {noteText}
        </div>
      );
    }

    const isExpanded = expandedNotes[noteKey];
    return (
      <div className="text-[11px] text-gray-700 font-normal break-words leading-tight whitespace-pre-line">
        <span>{isExpanded ? noteText : `${noteText.slice(0, maxLength)}... `}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleNote(noteKey);
          }}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline inline-block cursor-pointer focus:outline-none ml-1"
        >
          {isExpanded ? "Show less" : "READ MORE"}
        </button>
      </div>
    );
  };

  const STATUS_LABELS = {
    WAITING_FOR_BFA: "WAITING FOR BFA",
    BFA_RECEIVED: "BFA RECEIVED",
    BFA_SENT: "BFA SENT",
    SUBMITTED_TO_EOR: "SUBMITTED TO EOR",
    RELEASE_FOR_FABRICATION: "RELEASE FOR FAB",
    NOT_APPROVED: "NOT APPROVED",
    REVISED_RESUBMITTAL: "REVISED & RESUBMITTED",
    REVISED_RESUBMIT_FOR_FABRICATION: "REVISED & RESUB FOR FAB",
    PENDING: "PENDING",
    COMPLETE: "BFA - COMPLETE",
    COMPLETED: "BFA - COMPLETE",
    CLOSED: "BFA - COMPLETE",
    PARTIAL: "BFA - PARTIAL",
    SUCCESS: "BFA - SUCCESS",
    SENT: "SENT",
    "100%_COMPLETE": "100% COMPLETE",
    "100%_CLOSED": "100% COMPLETE",
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
    CLOSED: "bg-teal-100 text-teal-700 border-teal-200",
    PARTIAL: "bg-amber-100 text-amber-700 border-amber-200",
    SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-200",
    SENT: "bg-gray-100 text-gray-700 border-gray-200",
    "100%_COMPLETE": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "100%_CLOSED": "bg-emerald-100 text-emerald-700 border-emerald-200",
  };

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
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 w-56">Phase / Subject</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 w-28">Start Date</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[15rem]">IFA - Submission Date</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[8rem]">BFA - Recd Date</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[10rem]">IFC - Sub Date</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black border-r border-black/10 min-w-[16rem]">COR Drawing Submission Date</th>
              <th className="px-2 py-1.5 font-bold uppercase tracking-wider text-black min-w-[16rem]">Status & Comment</th>
            </tr>
          </thead>
          <tbody>
            {scheduleRows.flatMap((row) => {
              const userRole = (sessionStorage.getItem("userRole") || "").toUpperCase();
              const isConnectionDesigner = userRole.includes("CONNECTION_DESIGNER");

              const hasEntries = row.unifiedEntries && row.unifiedEntries.length > 0;
              const rowSpanCount = hasEntries ? row.unifiedEntries.length : 1;

              if (hasEntries) {
                return row.unifiedEntries.map((entry, index) => {
                  const isFirst = index === 0;
                  const isLast = index === rowSpanCount - 1;

                  const key = String(entry.status || "—").replace(/\s+/g, "_").toUpperCase();
                  const label = STATUS_LABELS[key] || String(entry.status || "—").replace(/_/g, " ");
                  const color = STATUS_COLORS[key] || "bg-gray-100 text-gray-600 border-gray-200";

                  const cleanNote = cleanHtmlContent(entry.notes);
                  const hasNote = cleanNote && cleanNote !== "—" && cleanNote.trim() !== "" && !["Waiting for BFA", "BFA Received", "100% Complete", "100% COMPLETE"].includes(cleanNote);

                  return (
                    <tr
                      key={`${row.id}-${index}`}
                      className={`border-b ${isLast ? "border-black/20" : "border-black/10"} transition-all ${
                        row._type === "milestone" ? "bg-[#f0f7ed] hover:bg-[#e6f3e2]" : "bg-white hover:bg-slate-50"
                      }`}
                    >
                      {/* Phase / Subject */}
                      {isFirst && (
                        <td
                          rowSpan={rowSpanCount}
                          onClick={() => onCellClick("schedule", row.id, "phase", row.phase)}
                          className="px-2 py-1.5 font-bold border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black align-top"
                        >
                          {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "phase" ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={onCellSave}
                              onKeyDown={onKeyDown}
                              className="w-full bg-white border border-black px-2 py-0.5 rounded-none font-bold uppercase text-xs text-black"
                            />
                          ) : (
                            <span className="uppercase">{row.phase}</span>
                          )}
                        </td>
                      )}

                      {/* Start Date */}
                      {isFirst && (
                        <td
                          rowSpan={rowSpanCount}
                          onClick={() => onCellClick("schedule", row.id, "startDate", row.startDate)}
                          className="px-2 py-1.5 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50 align-top"
                        >
                          {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "startDate" ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={onCellSave}
                              onKeyDown={onKeyDown}
                              className="w-full bg-white border border-black px-2 py-0.5 rounded-none text-xs text-black"
                            />
                          ) : (
                            <span>{row.startDate}</span>
                          )}
                        </td>
                      )}

                      {/* IFA submission date */}
                      <td className="px-2 py-1.5 border-r border-black/10 align-top">
                        {entry.ifaDate !== "—" ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-blue-800 leading-tight break-words">
                              {entry.subject}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                              {entry.ifaDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>

                      {/* BFA date */}
                      <td className="px-2 py-1.5 border-r border-black/10 align-top">
                        {entry.bfaDate !== "—" ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-blue-800 leading-tight break-words">
                              {entry.subject}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                              {entry.bfaDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>

                      {/* IFC sub date */}
                      <td className="px-2 py-1.5 border-r border-black/10 align-top">
                        {entry.ifcDate !== "—" ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-blue-800 leading-tight break-words">
                              {entry.subject}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                              {entry.ifcDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>

                      {/* COR Drawing Sub date */}
                      <td className="px-2 py-1.5 border-r border-black/10 align-top">
                        {entry.corDate !== "—" ? (
                          <div className="flex flex-col">
                            <span className="text-[11px] font-bold text-blue-800 leading-tight break-words">
                              {entry.subject}
                            </span>
                            <span className="text-[11px] text-blue-600 font-semibold leading-tight mt-0.5">
                              {entry.corDate}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Submittal Status & Comment */}
                      <td className="px-2 py-1.5 align-top">
                        <div className="flex flex-col gap-0.5">
                          {!(key === "WAITING_FOR_BFA" && isConnectionDesigner) && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest border ${color} shrink-0`}>
                                {label}
                              </span>
                            </div>
                          )}
                          {hasNote && renderExpandableNote(entry.notes, `note-${row.id}-${index}`)}
                        </div>
                      </td>
                    </tr>
                  );
                });
              }

              // Fallback single row when row has no submittals
              const key = String(row.submittalStatus || "—").replace(/\s+/g, "_").toUpperCase();
              const label = STATUS_LABELS[key] || String(row.submittalStatus || "—").replace(/_/g, " ");
              const color = STATUS_COLORS[key] || "bg-gray-100 text-gray-600 border-gray-200";

              return (
                <tr
                  key={row.id}
                  className={`border-b border-black/10 transition-all ${
                    row._type === "milestone" ? "bg-[#f0f7ed] hover:bg-[#e6f3e2]" : "bg-white hover:bg-slate-50"
                  }`}
                >
                  <td
                    onClick={() => onCellClick("schedule", row.id, "phase", row.phase)}
                    className="px-2 py-1.5 font-bold border-r border-black/10 cursor-pointer hover:bg-slate-100/50 text-black align-top"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "phase" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-0.5 rounded-none font-bold uppercase text-xs text-black"
                      />
                    ) : (
                      <span className="uppercase">{row.phase}</span>
                    )}
                  </td>

                  <td
                    onClick={() => onCellClick("schedule", row.id, "startDate", row.startDate)}
                    className="px-2 py-1.5 border-r border-black/10 font-bold text-black cursor-pointer hover:bg-slate-100/50 align-top"
                  >
                    {activeCell?.table === "schedule" && activeCell.rowId === row.id && activeCell.field === "startDate" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={onCellSave}
                        onKeyDown={onKeyDown}
                        className="w-full bg-white border border-black px-2 py-0.5 rounded-none text-xs text-black"
                      />
                    ) : (
                      <span>{row.startDate}</span>
                    )}
                  </td>

                  <td className="px-2 py-1.5 border-r border-black/10 align-top text-gray-400">—</td>
                  <td className="px-2 py-1.5 border-r border-black/10 align-top text-gray-400">—</td>
                  <td className="px-2 py-1.5 border-r border-black/10 align-top text-gray-400">—</td>
                  <td className="px-2 py-1.5 border-r border-black/10 align-top text-gray-400">—</td>

                  <td className="px-2 py-1.5 align-top">
                    {(() => {
                      const cleanComment = cleanHtmlContent(row.comments);
                      const hasComment = cleanComment && cleanComment !== "—" && cleanComment !== label;

                      if (row.submittalStatus && row.submittalStatus !== "—") {
                        if (key === "WAITING_FOR_BFA" && isConnectionDesigner) {
                          return <span className="text-gray-400">—</span>;
                        }
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[9px] font-black uppercase tracking-widest border ${color} w-fit`}>
                              {label}
                            </span>
                            {hasComment && renderExpandableNote(row.comments, `comment-${row.id}`)}
                          </div>
                        );
                      }
                      return hasComment ? (
                        renderExpandableNote(row.comments, `comment-${row.id}`)
                      ) : (
                        <span className="text-gray-400">—</span>
                      );
                    })()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WprScheduleTable;
