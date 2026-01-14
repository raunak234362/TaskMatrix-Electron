import React, { useEffect, useMemo, useState } from "react";
import Service from "../../api/Service";

import { AlertCircle, Loader2 } from "lucide-react";
import { openFileSecurely } from "../../utils/openFileSecurely";

import DataTable from "../ui/table";
import Button from "../fields/Button";
import CoResponseModal from "./CoResponseModal";
import COResponseDetailsModal from "./CoResponseDetailsModal";

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
  const [selectedResponse, setSelectedResponse] = useState(null);

  const userRole = sessionStorage.getItem("userRole");
  console.log(id);

  /* -------------------- SAFE DERIVED VALUES -------------------- */
  const encodedCO = useMemo(() => {
    if (!co) return "";
    return encodeURIComponent(JSON.stringify(co));
  }, [co]);

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

      const response = await Service.GetChangeOrder(id);
      console.log(response);

      setCO(response.data);
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
      cell: ({ row }) => (
        <p className="truncate max-w-[220px]">{row.original.reason}</p>
      ),
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
          {/* ================= LEFT: CO DETAILS ================= */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-5">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-green-700">
                CO #{co.changeOrderNumber}
              </h1>

              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${co.isAproovedByAdmin === true
                    ? "bg-green-100 text-green-700"
                    : co.isAproovedByAdmin === false
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
              >
                {co.isAproovedByAdmin === true
                  ? "Approved"
                  : co.isAproovedByAdmin === false
                    ? "Rejected"
                    : "Pending"}
              </span>
            </div>

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
              <h4 className="font-semibold text-gray-700 mb-1">Remarks</h4>
              <p className="bg-gray-50 p-3 rounded-lg border">
                {co.remarks || "—"}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
              <p className="bg-gray-50 p-3 rounded-lg border">
                {co.description || "—"}
              </p>
            </div>

            {(co.files ?? []).length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Attachments
                </h4>
                <ul className="space-y-1">
                  {(co.files ?? []).map((file) => (
                    <li key={file.id}>
                      <span
                        className="text-green-700 underline cursor-pointer"
                        onClick={() =>
                          openFileSecurely("changeOrder", co.id, file.id)
                        }
                      >
                        {file.originalName}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t">
              <button
                onClick={() =>
                  window.open(`/co-table?coData=${encodedCO}`, "_blank")
                }
                className="text-green-600 underline"
              >
                View Change Order Reference Table
              </button>
            </div>
          </div>

          {/* ================= RIGHT: RESPONSES ================= */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-green-700">
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
                pageSizeOptions={[5, 10]}
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

      {selectedResponse && (
        <COResponseDetailsModal
          response={selectedResponse}
          onClose={() => setSelectedResponse(null)}
          onSuccess={fetchCO}
        />
      )}
    </>
  );
};

export default GetCOByID;
