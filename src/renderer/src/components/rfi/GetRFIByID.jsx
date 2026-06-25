import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { AlertCircle, Loader2, FileText } from "lucide-react";
import DataTable from "../ui/table";
import RenderFiles from "../common/RenderFiles";
import RFIResponseModal from "./RFIResponseModal";
import RFIResponseDetailsModal from "./RFIResponseDetailsModal";
import { useSelector } from "react-redux";
import EditRFI from "./EditRFI";

const Info = ({ label, value, noBorder }) => (
  <div className={`flex items-center pb-2 text-sm gap-2 ${noBorder ? "" : "border-b border-gray-200"}`}>
    <span className="font-semibold text-black uppercase tracking-normal shrink-0">
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
    <h2 className="text-sm font-semibold text-black tracking-normal uppercase">{title}</h2>
  </div>
);

const GetRFIByID = ({ id, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(true);
  const [rfi, setRfi] = useState(null);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const users = useSelector((state) => state.userInfo?.staffData || []);

  const fetchRfi = async () => {
    try {
      setLoading(true);
      const response = await Service.GetRFIbyId(id);
      setRfi(response.data);
    } catch (err) {
      setError("Failed to load RFI");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRfi();
  }, [id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-none p-8 flex items-center justify-center border border-gray-200 shadow-2xl">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-black" />
          <span className="text-sm font-semibold uppercase tracking-normal text-black">Loading RFI details...</span>
        </div>
      </div>
    );
  }

  if (error || !rfi) {
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-none p-8 flex items-center justify-center border border-red-200 shadow-2xl text-red-600">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span className="text-sm font-semibold uppercase tracking-normal">{error || "RFI not found"}</span>
          <button
            onClick={onClose}
            className="ml-4 px-4 py-1 bg-red-50 text-red-700 border border-red-200 rounded-none text-sm font-semibold uppercase tracking-normal"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();
  const currentUserId = sessionStorage.getItem("userId");
  const isAssist = rfi?.project?.assists?.some(assist => 
    String(assist.userId) === String(currentUserId) || 
    String(assist.user?.id) === String(currentUserId)
  );

  const responseColumns = [
    {
      accessorKey: "createdByRole",
      header: "From",
      cell: ({ row }) => {
        const user = row.original.user;
        if (user) {
          return (
            <span className="font-semibold text-sm text-black">
              {`${user.firstName || ""} ${user.lastName || ""}`.trim()}
            </span>
          );
        }

        if (row.original.userRole === "CLIENT" || row.original.userRole === "CLIENT_ADMIN") {
          return <span className="font-semibold text-sm text-black">WBT Team</span>;
        }

        return <span className="font-semibold text-sm text-black">Client</span>;
      },
    },
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => {
        const htmlContent = row.original.reason || row.original.description || "";
        const plainText = htmlContent.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ");

        return (
          <p className="truncate max-w-[180px] text-black text-sm" title={plainText}>
            {plainText}
          </p>
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
      accessorKey: "wbtStatus",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.wbtStatus || row.original.status || "—";
        const getStatusStyles = (s) => {
          switch (s?.toUpperCase()) {
            case "OPEN":
              return "bg-blue-50 text-blue-700 border-blue-200";
            case "PARTIAL":
              return "bg-amber-50 text-amber-700 border-amber-200";
            case "COMPLETE":
              return "bg-green-50 text-green-700 border-green-200";
            default:
              return "bg-gray-50 text-gray-700 border-gray-200";
          }
        };

        return (
          <span
            className={`px-2 py-0.5 rounded-none text-sm font-semibold border uppercase tracking-normal ${getStatusStyles(status)}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-1 md:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[98%] flex flex-col h-full max-h-[98vh]">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
              <h1 className="text-sm font-semibold text-black uppercase tracking-normal">RFI Details</h1>
            </div>
            <div className="flex items-center gap-3">
              {(userRole !== "STAFF" || isAssist) && (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-normal shadow-sm cursor-pointer"
                >
                  Edit RFI
                </button>
              )}
              <button
                onClick={onClose}
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-semibold text-sm uppercase tracking-normal shadow-sm cursor-pointer"
              >
                Close
              </button>
            </div>
          </header>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
            <div className="grid grid-cols-1 gap-6">
              {/* Card 1: Details, Description & Attachments */}
              <div className="bg-zinc-50 p-6 rounded-none border border-gray-200 space-y-6">
                <div className="space-y-4">
                  <h1 className="text-sm font-semibold text-black uppercase tracking-normal">
                    {rfi.subject || "No Subject"}
                  </h1>

                  {/* 2-Column Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-2">
                    <Info label="Project" value={rfi.project?.name || "—"} />

                    <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
                      <span className="font-semibold text-black uppercase tracking-normal shrink-0">
                        Status:
                      </span>
                      {(() => {
                        const status = rfi.isAproovedByAdmin ? "APPROVED" : "PENDING";
                        const statusStyles = rfi.isAproovedByAdmin
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200";
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-sm font-semibold uppercase tracking-normal border ${statusStyles}`}>
                            {status}
                          </span>
                        );
                      })()}
                    </div>

                    <Info label="Fabricator" value={rfi?.fabricator?.fabName || "—"} />

                    <Info
                      label="Created At"
                      value={rfi?.date ? new Date(rfi.date).toLocaleString() : "—"}
                      noBorder={true}
                    />

                    <Info
                      label="Recipients"
                      value={
                        rfi.multipleRecipients?.length > 0
                          ? rfi.multipleRecipients.map((r) => `${r.firstName} ${r.lastName}`).join(", ")
                          : "—"
                      }
                      noBorder={true}
                    />
                  </div>
                </div>

                {/* Description Section */}
                <div className="mt-6 pt-6">
                  <SectionTitle title="Description" />
                  <div
                    className="text-sm text-black font-normal prose prose-sm max-w-none bg-white p-4 border border-gray-200 rounded-none"
                    dangerouslySetInnerHTML={{
                      __html: rfi.description || "No description provided",
                    }}
                  />
                </div>

                {/* Attachments Section */}
                {rfi.files?.length > 0 && (
                  <div className="mt-6 pt-6">
                    <SectionTitle title="Attachments" />
                    <RenderFiles files={rfi.files} table="rFI" parentId={rfi.id} hideSectionTitle={true} />
                  </div>
                )}
              </div>

              {/* Card 2: Responses */}
              <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6">
                <div className="flex justify-between items-center pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                    <h2 className="text-sm font-semibold text-black tracking-normal uppercase">Responses</h2>
                  </div>
                  {(userRole === "CLIENT" || userRole === "CLIENT_ADMIN" || userRole === "ADMIN" || userRole === "OPERATION_EXECUTIVE" || userRole?.includes("MANAGER") || userRole === "PROJECT_MANAGER" || userRole === "DEPT_MANAGER" || userRole === "DEPUTY_MANAGER" || isAssist) && (
                    <button
                      className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                      onClick={() => setShowModal(true)}
                    >
                      + Add Response
                    </button>
                  )}
                </div>

                <div className="flex-1">
                  {rfi.rfiresponse?.length > 0 ? (
                    <DataTable
                      columns={responseColumns}
                      data={rfi.rfiresponse}
                      onRowClick={(row) => setSelectedResponse(row)}
                    />
                  ) : (
                    <div className="text-center py-8 border border-dashed border-gray-300 rounded-none bg-white flex flex-col items-center justify-center">
                      <FileText className="w-10 h-10 text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-black uppercase tracking-wider">No responses yet.</p>
                      {(userRole === "CLIENT" || userRole === "CLIENT_ADMIN" || userRole === "ADMIN" || userRole === "OPERATION_EXECUTIVE" || userRole?.includes("MANAGER") || userRole === "PROJECT_MANAGER" || userRole === "DEPT_MANAGER" || userRole === "DEPUTY_MANAGER" || isAssist) && (
                        <button
                          onClick={() => setShowModal(true)}
                          className="mt-3 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-semibold text-sm uppercase tracking-normal cursor-pointer shadow-sm"
                        >
                          Add Response Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Response Modal */}
      {showModal && (
        <RFIResponseModal
          rfiId={id}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            fetchRfi();
            onUpdate?.();
          }}
        />
      )}

      {/* Edit RFI Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden w-full max-w-2xl max-h-[90vh] flex flex-col relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <EditRFI
                id={id}
                onSuccess={() => {
                  setShowEditModal(false);
                  fetchRfi();
                  onUpdate?.();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedResponse && (
        <RFIResponseDetailsModal
          response={selectedResponse}
          onClose={() => {
            setSelectedResponse(null);
            fetchRfi();
            onUpdate?.();
          }}
        />
      )}
    </>
  );
};

export default GetRFIByID;
