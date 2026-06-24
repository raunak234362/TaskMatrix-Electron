import { useEffect, useMemo, useState } from "react";
import Service from "../../api/Service";

import { AlertCircle, Loader2, X } from "lucide-react";

import DataTable from "../ui/table";
import CoTableView from "./CoTableView";
import CoResponseModal from "./CoResponseModal";
import COResponseDetailsModal from "./CoResponseDetailsModal";

import RenderFiles from "../common/RenderFiles";
import UpdateCO from "./UpdateCO";

/* -------------------- Small UI Helpers -------------------- */
const Info = ({ label, value, noBorder }) => (
  <div className={`flex items-center pb-2 text-sm gap-2 ${noBorder ? "" : "border-b border-gray-200"}`}>
    <span className="font-semibold text-black uppercase tracking-wider shrink-0">
      {label}:
    </span>
    <span className="text-black font-normal uppercase text-left truncate flex-1" title={value}>
      {value || "—"}
    </span>
  </div>
);

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
);

/* ========================================================= */
/* ======================= COMPONENT ======================= */
/* ========================================================= */

const GetCOByID = ({ id, projectId, onClose }) => {
  /* -------------------- STATE (ALL HOOKS AT TOP) -------------------- */
  const [loading, setLoading] = useState(true);
  const [co, setCO] = useState(null);
  const [error, setError] = useState(null);

  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [viewingVersionId, setViewingVersionId] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [tableRows, setTableRows] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);

  const userRole = sessionStorage.getItem("userRole");
  const userRoleLower = userRole?.toLowerCase() || "";
  const canSeeAllVersions = ['admin', 'deputy_manager', 'operation_executive', 'project_manager_officer'].includes(userRoleLower);

  /* -------------------- SAFE DERIVED VALUES -------------------- */
  const sortedVersions = useMemo(() => {
    if (!co?.versions) return [];
    const allVersions = [...co.versions].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    if (!canSeeAllVersions && allVersions.length > 0) {
      return [allVersions[allVersions.length - 1]];
    }
    return allVersions;
  }, [co?.versions, canSeeAllVersions]);

  const hasMultipleVersions = sortedVersions.length > 1;

  const currentVersion = useMemo(() => {
    if (!co) return null;
    if (!canSeeAllVersions && sortedVersions.length > 0) {
      return sortedVersions[0];
    }
    const targetId = viewingVersionId || co.currentVersionId;
    return co.versions?.find(v => v.id === targetId) || sortedVersions[0] || co;
  }, [co, sortedVersions, viewingVersionId, canSeeAllVersions]);

  const isViewingCurrent = useMemo(() => {
    if (!canSeeAllVersions) return true;
    return currentVersion?.id === co?.currentVersionId || (!co?.versions?.length);
  }, [currentVersion, co, canSeeAllVersions]);

  const responses = useMemo(() => {
    try {
      if (!co?.coResponses) return [];
      return Array.isArray(co.coResponses)
        ? co.coResponses
        : JSON.parse(co.coResponses);
    } catch (err) {
      console.error("Failed to parse CO responses", err);
      return [];
    }
  }, [co?.coResponses]);

  /* -------------------- FETCH CO -------------------- */
  const fetchCO = async () => {
    try {
      if (!projectId) {
        setError("Project ID is missing");
        return;
      }

      setLoading(true);
      const response = await Service.GetChangeOrderByID(id);
      setCO(response.data);
      if (response.data?.currentVersionId) {
        setViewingVersionId(response.data.currentVersionId);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load Change Order");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCO();
  }, [id, projectId]);

  /* -------------------- FETCH TABLE ROWS FOR POPUP -------------------- */
  useEffect(() => {
    if (!showTableModal) return;
    const coId = co?.id || co?._id;
    if (!coId) return;

    const fetchTableRows = async () => {
      try {
        setTableLoading(true);
        const response = await Service.GetAllCOTableRows(coId);
        const rows = response?.data || [];
        if (rows.length > 0) {
          setTableRows(rows);
        } else {
          // Fallback to inline data if API returns nothing
          const fallbackData = currentVersion
            ? currentVersion.changeOrderTables || co.CoRefersTo || []
            : co.CoRefersTo || [];
          setTableRows(fallbackData);
        }
      } catch (err) {
        console.error("Failed to fetch table rows for popup:", err);
        // Fallback to inline data
        const fallbackData = currentVersion
          ? currentVersion.changeOrderTables || co.CoRefersTo || []
          : co.CoRefersTo || [];
        setTableRows(fallbackData);
      } finally {
        setTableLoading(false);
      }
    };

    fetchTableRows();
  }, [showTableModal]);

  /* -------------------- EARLY RETURNS -------------------- */
  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-none p-8 flex items-center justify-center border border-gray-200 shadow-2xl">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-black" />
          <span className="text-sm font-bold uppercase tracking-wider text-black">Loading Change Order details...</span>
        </div>
      </div>
    );
  }

  if (error || !co) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-none p-8 flex items-center justify-center border border-red-200 shadow-2xl text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-bold uppercase tracking-wider">{error || "Change Order not found"}</span>
          <button
            onClick={onClose}
            className="ml-4 px-4 py-1 bg-red-50 text-red-700 border border-red-200 rounded-none text-xs font-bold uppercase tracking-wider animate-none cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  /* -------------------- RESPONSE TABLE COLUMNS -------------------- */
  const responseColumns = [
    {
      accessorKey: "createdByRole",
      header: "From",
      cell: ({ row }) => (
        <span className="font-semibold text-sm text-black">
          {row.original.createdByRole === "CLIENT" ? "Client" : "WBT Team"}
        </span>
      ),
    },
    {
      accessorKey: "reason",
      header: "Message",
      cell: ({ row }) => {
        const htmlContent = row.original.reason || row.original.description || "";
        const plainText = htmlContent.replace(/<[^>]*>?/gm, "") || "—";
        return (
          <p className="truncate max-w-[220px] text-black text-sm" title={plainText}>
            {plainText}
          </p>
        );
      },
    },
    {
      accessorKey: "files",
      header: "Files",
      cell: ({ row }) => {
        const count = row.original.files?.length ?? 0;
        return count > 0 ? (
          <span className="text-green-700 font-bold text-sm">{count} file(s)</span>
        ) : (
          <span className="text-black/40 text-sm">—</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-black text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status || "—";
        const statusStyles = status === "OPEN"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-yellow-50 text-yellow-700 border-yellow-200";
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-[10px] font-bold border uppercase tracking-wider ${statusStyles}`}>
            {status}
          </span>
        );
      },
    },
  ];

  /* ======================= RENDER ======================= */
  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-1 md:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[98%] flex flex-col h-full max-h-[98vh]">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
              <h1 className="text-xl font-bold text-black uppercase tracking-wider">Change Order Details</h1>
            </div>
            <div className="flex items-center gap-3">
              {userRole !== "CLIENT" && userRoleLower !== "project_manager" && userRoleLower !== "staff" && (
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                >
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </header>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            <div className="grid grid-cols-1 gap-6">
              {/* ================= LEFT DETAILS ================= */}
              <div className="bg-zinc-50 p-6 rounded-none border border-gray-200 space-y-6">
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-black uppercase tracking-tight">
                    COR-{co.changeOrderNumber?.slice(-3) || "—"}
                  </h1>

                  {/* 2-Column Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-2">
                    <Info label="Project" value={(co.Project?.name || co.project?.name) || "—"} />

                    <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
                      <span className="font-semibold text-black uppercase tracking-wider shrink-0">
                        Status:
                      </span>
                      {(() => {
                        const status = co.isAproovedByAdmin ? "APPROVED" : "PENDING";
                        const statusStyles = co.isAproovedByAdmin
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200";
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold uppercase tracking-tight border ${statusStyles}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>

                    <Info
                      label="Sender"
                      value={
                        (() => {
                          const s = [co.senders, co.Senders, co.sender, co.Sender].find(
                            (x) => x && typeof x === "object"
                          );
                          return s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() || s.username : "—";
                        })()
                      }
                    />

                    <Info
                      label="Recipient"
                      value={
                        (() => {
                          const r = [co.Recipients, co.recipients, co.Recipient, co.recipient].find(
                            (x) => x && typeof x === "object"
                          );
                          return r ? `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || r.username : "—";
                        })()
                      }
                    />

                    <Info
                      label="Created At"
                      value={co.createdAt ? new Date(co.createdAt).toLocaleString() : "—"}
                      noBorder={true}
                    />
                  </div>
                </div>

                {hasMultipleVersions && (
                  <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                    {sortedVersions.map((v, idx) => (
                      <button
                        key={v.id}
                        onClick={() => setViewingVersionId(v.id)}
                        className={`px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest transition-all border ${viewingVersionId === v.id
                          ? "bg-green-600 text-white border-green-600 shadow-sm"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                          }`}
                      >
                        v{v.versionNumber || sortedVersions.length - idx}
                        {v.id === co.currentVersionId && " (Current)"}
                      </button>
                    ))}
                  </div>
                )}

                {/* Subject Section */}
                <div className="mt-6">
                  <SectionTitle title="Subject" />
                  <div className="text-sm text-black font-normal bg-white p-4 border border-gray-200 rounded-none mt-4">
                    {currentVersion?.remarks || co.remarks || "—"}
                  </div>
                </div>

                {/* Description Section */}
                <div className="mt-6">
                  <SectionTitle title="Description" />
                  <div
                    className="text-sm text-black font-normal prose prose-sm max-w-none bg-white p-4 border border-gray-200 rounded-none mt-4"
                    dangerouslySetInnerHTML={{
                      __html: currentVersion?.description || co.description || "No description provided",
                    }}
                  />
                </div>

                {isViewingCurrent && (
                  <div className="pt-6">
                    <button
                      onClick={() => setShowTableModal(true)}
                      className="px-6 py-2 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-widest shadow-sm cursor-pointer"
                    >
                      View Change Order Reference Table
                    </button>
                  </div>
                )}

                {isViewingCurrent && (co.files ?? []).length > 0 && (
                  <div className="mt-6 pt-6 border-t border-gray-200 space-y-4">
                    <SectionTitle title="Attachments" />
                    <RenderFiles
                      files={co.files}
                      table="changeOrders"
                      parentId={co.id}
                      hideHeader={true}
                      hideSectionTitle={true}
                    />
                  </div>
                )}

                {!isViewingCurrent && (
                  <div className="pt-4 border-t text-sm text-gray-400 italic">
                    Only the current version files and table data are available for viewing.
                  </div>
                )}
              </div>

              {/* ================= RIGHT RESPONSES ================= */}
              <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                  <SectionTitle title="Responses" />
                  {userRole === "CLIENT" && (
                    <button
                      onClick={() => setShowResponseModal(true)}
                      className="px-6 py-2 bg-[#6bbd45] text-white border-2 border-green-700 hover:bg-[#5aa83a] transition-all font-bold text-xs uppercase tracking-widest cursor-pointer rounded-none"
                    >
                      + Add Response
                    </button>
                  )}
                </div>

                {responses.length > 0 ? (
                  <DataTable
                    columns={responseColumns}
                    data={responses}
                    onRowClick={(row) => setSelectedResponse(row)}
                  />
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <span className="text-black/60 text-sm font-semibold uppercase tracking-wider">
                      No responses yet
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {showResponseModal && (
        <CoResponseModal
          CoId={id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={fetchCO}
        />
      )}

      {showUpdateModal && (
        <UpdateCO
          coData={co}
          projectId={projectId}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={fetchCO}
        />
      )}

      {selectedResponse && (
        <COResponseDetailsModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onSuccess={fetchCO}
        />
      )}

      {/* ================= CO TABLE POPUP ================= */}
      {showTableModal && (() => {
        const sumCellValue = (val) => {
          if (val === undefined || val === null) return 0;
          if (val === "_MERGED_LEFT_" || val === "_MERGED_UP_" || val === -999999 || val === -999998) return 0;
          return Number(val) || 0;
        };

        const totalQty = tableRows.reduce((s, r) => s + sumCellValue(r.QtyNo), 0);
        const totalHours = tableRows.reduce((s, r) => s + sumCellValue(r.hours), 0);
        const totalCost = tableRows.reduce((s, r) => s + sumCellValue(r.cost), 0);

        return (
          <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-none shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200 shrink-0">
                <div>
                  <h1 className="text-xl font-bold text-black uppercase tracking-wider">
                    Change Order Reference Table
                  </h1>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">
                    COR-{co.changeOrderNumber?.slice(-3) || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs rounded-none bg-green-50 text-green-700 border border-green-200 font-bold uppercase tracking-wider">
                    Read Only
                  </span>
                  <button
                    onClick={() => setShowTableModal(false)}
                    className="text-gray-400 hover:text-black transition-colors p-1 rounded-none hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {tableLoading ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading table data...
                  </div>
                ) : (
                  <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[{ label: "Total Quantity", value: totalQty }, { label: "Total Hours", value: `${totalHours} hrs` }, { label: "Total Cost", value: `$${totalCost}` }].map((card) => (
                        <div key={card.label} className="bg-white rounded-none shadow-sm border p-4">
                          <p className="text-xs uppercase text-black font-bold tracking-wider">{card.label}</p>
                          <p className="text-2xl text-black mt-1 font-semibold">{card.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Table */}
                    <CoTableView rows={tableRows} />

                    {/* Footer */}
                    <div className="text-xs text-gray-400 text-center pt-2">
                      This table is auto-generated from the Change Order and is read-only.
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

export default GetCOByID;
