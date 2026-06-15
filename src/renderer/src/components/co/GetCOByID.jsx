import { useEffect, useMemo, useState } from "react";
import Service from "../../api/Service";

import { AlertCircle, Loader2, X } from "lucide-react";


import DataTable from "../ui/table";
import Button from "../fields/Button";
import CoTableView from "./CoTableView";
import CoResponseModal from "./CoResponseModal";
import COResponseDetailsModal from "./CoResponseDetailsModal";

import RenderFiles from "../common/RenderFiles";
import UpdateCO from "./UpdateCO";

/* -------------------- Small UI Helper -------------------- */
const Info = ({ label, value }) => (
  <div>
    <h4 className="text-sm text-gray-700">{label}</h4>
    <div className="text-gray-700 font-medium">{value}</div>
  </div>
);

/* -------------------- Props -------------------- */

/* ========================================================= */
/* ======================= COMPONENT ======================= */
/* ========================================================= */

const GetCOByID = ({ id, projectId }) => {
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
  console.log(id);

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
      console.log(response);

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
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading Change Order details...
      </div>
    );
  }

  if (error || !co) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || "Change Order not found"}
      </div>
    );
  }

  /* -------------------- RESPONSE TABLE COLUMNS -------------------- */
  const responseColumns = [
    {
      accessorKey: "createdByRole",
      header: "From",
      cell: ({ row }) => (
        <span className="font-medium text-sm">
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
          <p className="truncate max-w-[220px]" title={plainText}>
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
          <span className="text-green-700 font-medium">{count} file(s)</span>
        ) : (
          <span className="text-gray-400">—</span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-gray-700 text-sm">
          {new Date(row.original.createdAt).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === "OPEN"
            ? "bg-green-100 text-green-700"
            : "bg-yellow-100 text-yellow-700"
            }`}
        >
          {row.original.status}
        </span>
      ),
    },
  ];

  /* ======================= RENDER ======================= */
  return (
    <>
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================= LEFT DETAILS ================= */}
          <div className="bg-gray-100 p-6 rounded-lg shadow-none border border-gray-100 space-y-5">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl text-black font-semibold">
                COR-{co.changeOrderNumber?.slice(-3) || "—"}
              </h1>

              <div className="flex items-center gap-2">
                {userRole !== "CLIENT" && userRoleLower !== "project_manager" && userRoleLower !== "staff" && (
                  <Button
                    variant="outline"
                    className="border-green-600 px-4 bg-green-50 text-black rounded-lg "
                    onClick={() => setShowUpdateModal(true)}
                  >
                    Edit
                  </Button>
                )}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${co.isAproovedByAdmin === true
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                    }`}
                >
                  {co.isAproovedByAdmin === true
                    ? "Approved By Admin"
                    : "Pending"}
                </span>
              </div>
            </div>

            {hasMultipleVersions && (
              <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                {sortedVersions.map((v, idx) => (
                  <button
                    key={v.id}
                    onClick={() => setViewingVersionId(v.id)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border ${viewingVersionId === v.id
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

            <Info
              label="Sender"
              value={
                co.senders
                  ? `${co.senders.firstName ?? ""} ${co.senders.lastName ?? ""}`
                  : "—"
              }
            />

            <Info
              label="Recipient"
              value={
                co.recipients
                  ? `${co.recipients.firstName ?? ""} ${co.recipients.lastName ?? ""
                  }`
                  : "—"
              }
            />

            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Subject</h4>
              <p className="bg-gray-50 p-3 rounded-lg border">
                {currentVersion?.remarks || co.remarks || "—"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
              <div
                className="bg-white p-3 rounded-lg border"
                dangerouslySetInnerHTML={{ __html: currentVersion?.description || co.description || "—" }}
              ></div>
            </div>

            {isViewingCurrent && (co.files ?? []).length > 0 && (
              <RenderFiles
                files={co.files}
                table="changeOrders"
                parentId={co.id}
              />
            )}

            {isViewingCurrent && (
              <div className="pt-2">
                <button
                  onClick={() => setShowTableModal(true)}
                  className="px-6 py-2 bg-green-50 text-green-700 border border-green-600 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-green-100 transition-all shadow-sm"
                >
                  View Change Order Reference Table
                </button>
              </div>
            )}

            {!isViewingCurrent && (
              <div className="pt-4 border-t text-sm text-gray-400 italic">
                Only the current version files and table data are available for viewing.
              </div>
            )}
          </div>

          {/* ================= RIGHT ================= */}
          <div className="bg-gray-100 p-6 rounded-xl shadow-none border border-gray-100 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-black">
                Responses
              </h2>

              {userRole === "CLIENT" && (
                <Button
                  className="bg-green-600 text-white"
                  onClick={() => setShowResponseModal(true)}
                >
                  + Add Response
                </Button>
              )}
            </div>

            {responses.length > 0 ? (
              <DataTable
                columns={responseColumns}
                data={responses}
                onRowClick={(row) => setSelectedResponse(row)}
              />
            ) : (
              <p className="text-gray-700 italic">No responses yet.</p>
            )}
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
        const totalQty = tableRows.reduce((s, r) => s + (Number(r.QtyNo) || 0), 0);
        const totalHours = tableRows.reduce((s, r) => s + (Number(r.hours) || 0), 0);
        const totalCost = tableRows.reduce((s, r) => s + (Number(r.cost) || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
              {/* Modal Header */}
              <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200 shrink-0">
                <div>
                  <h1 className="text-xl font-bold text-green-700">
                    Change Order Reference Table
                  </h1>
                  <p className="text-sm text-gray-500">
                    COR-{co.changeOrderNumber?.slice(-3) || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 text-xs rounded-full bg-green-100 text-green-700 font-semibold">
                    Read Only
                  </span>
                  <button
                    onClick={() => setShowTableModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
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
                        <div key={card.label} className="bg-white rounded-xl shadow-sm border p-4">
                          <p className="text-xs uppercase text-gray-700 font-semibold">{card.label}</p>
                          <p className="text-2xl text-gray-700 mt-1">{card.value}</p>
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
