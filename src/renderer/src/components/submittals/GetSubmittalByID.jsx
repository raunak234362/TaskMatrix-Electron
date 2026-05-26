import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { Loader2, AlertCircle, ChevronDown, ChevronUp, Clock, History, X } from "lucide-react";
import Button from "../fields/Button";
import DataTable from "../ui/table";
import RenderFiles from "../common/RenderFiles";

import SubmittalResponseModal from "./SubmittalResponseModal";
import SubmittalResponseDetailsModal from "./SubmittalResponseDetailsModal";
import UpdateSubmittalById from "./UpdateSubmittalById";

const Info = ({ label, value }) => (
  <div className="mb-2">
    <h4 className="text-sm text-gray-700">{label}</h4>
    <div className="font-medium text-gray-700">{value}</div>
  </div>
);

const getMilestoneLabel = (m) => {
  if (!m) return "—";
  const parts = [];
  if (m.subject) {
    parts.push(m.subject);
  } else if (m.description) {
    const plain = m.description.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
    const words = plain.split(/\s+/);
    const truncated = words.length > 10 ? words.slice(0, 10).join(" ") + "..." : plain;
    parts.push(truncated);
  }
  if (m.subSubject) {
    parts.push(m.subSubject);
  }
  if (m.stage) {
    parts.push(m.stage);
  }
  return parts.join(" - ") || "Unnamed Milestone";
};

// ── Version History Row ──────────────────────────────────────────────────────
const VersionRow = ({ version, index, total, isCurrent }) => {
  const [open, setOpen] = useState(false);

  const uploadedAt = version.createdAt || version.updatedAt || version.date;
  const uploader = version.user || version.sender;
  const uploaderName = uploader
    ? `${uploader.firstName || uploader.f_name || ""} ${uploader.lastName || uploader.l_name || ""}`.trim()
    : null;

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${isCurrent
        ? "border-[#6bbd45] bg-[#6bbd45]/5"
        : "border-gray-200 bg-white"
        }`}
    >
      {/* Row Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 hover:bg-black/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Version badge */}
          <span
            className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isCurrent
              ? "bg-[#6bbd45] text-white"
              : "bg-gray-100 text-gray-500"
              }`}
          >
            v{total - index}
            {isCurrent && " · Current"}
          </span>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {uploadedAt
                ? new Date(uploadedAt).toLocaleString()
                : "—"}
            </span>
            {uploaderName && (
              <span className="truncate text-gray-500">· by {uploaderName}</span>
            )}
          </div>
        </div>

        {/* Chevron */}
        <span className="shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Description */}
          {/* {(version.description) && (
            <div className="pt-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Description
              </p>
              <div
                className="p-3 bg-white border border-gray-200 rounded-lg prose prose-sm max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: version.description }}
              />
            </div>
          )} */}

          {/* Attached files for this version */}
          {(version.files?.length > 0 || version.file) && (
            <div className="pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Attachments
              </p>
              <RenderFiles
                files={[version]}
                table="submittals"
                parentId={version.submittalId || version.submittalsId}
                versionId={version.id}
                hideHeader
              />
            </div>
          )}

          {/* Nothing to show */}
          {!version.description && !version.files?.length && !version.file && (
            <p className="pt-3 text-xs text-gray-400 italic">
              No details available for this version.
            </p>
          )}
        </div>
      )}
    </div>
  );
};


const GetSubmittalByID = ({ id, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [submittal, setSubmittal] = useState(null);
  const [error, setError] = useState(null);

  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState(null);
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await Service.GetSubmittalbyId(id);
      setSubmittal(res.data);
    } catch {
      setError("Failed to load submittal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading submittal details...
      </div>
    );
  }

  if (!submittal || error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-600">
        <AlertCircle className="w-5 h-5" />
        {error || "Submittal not found"}
      </div>
    );
  }

  // Sort versions newest → oldest
  const sortedVersions = [...(submittal.versions || [])].sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || b.date || 0) -
      new Date(a.createdAt || a.updatedAt || a.date || 0)
  );
  const hasMultipleVersions = sortedVersions.length > 1;

  const responseColumns = [
    {
      accessorKey: "user",
      header: "From",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <span className="font-medium text-sm text-gray-700">
            {user
              ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
              : "—"}
          </span>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Message",
      cell: ({ row }) => {
        const description = row.original.description || "—";
        const stripHtml = (html) => html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ");
        const words = stripHtml(description).trim().split(/\s+/);
        const truncated =
          words.length > 20 ? words.slice(0, 20).join(" ") + "..." : stripHtml(description);

        return (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            style={{
              marginLeft: row.original.parentResponseId ? "20px" : "0px",
            }}
          >
            {truncated}
          </div>
        );
      },
    },
    // {
    //   accessorKey: "status",
    //   header: "Status",
    //   cell: ({ row }) => {
    //     const status = row.original.status || "—";
    //     const formatStatus = (s) => s.replace(/_/g, " ");

    //     const getStatusStyles = (s) => {
    //       switch (s) {
    //         case "RELEASE_FOR_FABRICATION":
    //           return "bg-green-100 text-green-700 border-green-200";
    //         case "NOT_APPROVED":
    //           return "bg-red-100 text-red-700 border-red-200";
    //         case "REVISED_RESUBMITTAL":
    //         case "REVISED_RESUBMIT_FOR_FABRICATION":
    //           return "bg-orange-100 text-orange-700 border-orange-200";
    //         case "SUBMITTED_TO_EOR":
    //           return "bg-blue-100 text-blue-700 border-blue-200";
    //         default:
    //           return "bg-gray-100 text-gray-600 border-gray-200";
    //       }
    //     };

    //     return (
    //       <span
    //         className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border ${getStatusStyles(
    //           status
    //         )}`}
    //       >
    //         {formatStatus(status)}
    //       </span>
    //     );
    //   },
    // },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-1 md:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[98%] flex flex-col h-full max-h-[98vh]">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
            <div>
              <h2 className="text-xl font-black text-black tracking-tight uppercase">
                Submittal Details
              </h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
              >
                Close
              </button>
            )}
          </header>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-gray-50">
            <div className="grid grid-cols-1 gap-6">
               <div className="bg-gray-100 p-6 rounded-xl shadow-none border border-gray-100 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-[#6bbd45]">Responses</h2>
                  {(userRole === "CLIENT_ADMIN" || userRole === "CLIENT" || userRole === "ADMIN" || userRole === "PROJECT_MANAGER" || userRole === "DEPT_MANAGER" || userRole== "DEPUTY_MANAGER") && (
                    <Button
                      className="bg-[#6bbd45]/20 text-black border border-black hover:bg-[#6bbd45]/30"
                      onClick={() => setShowResponseModal(true)}
                    >
                      + Add Response
                    </Button>
                  )}
                </div>

                {submittal.submittalsResponse?.length > 0 ? (
                  <DataTable
                    columns={responseColumns}
                    data={submittal.submittalsResponse}
                    onRowClick={(row) => setSelectedResponse(row)}
                  />
                ) : (
                  <p className="text-gray-700 italic">No responses yet.</p>
                )}
              </div>
              {/* LEFT PANEL */}
              <div className="bg-gray-100 p-6 rounded-xl shadow-none border border-gray-100 space-y-5">
                <div className="flex justify-between items-center">
                  <h1 className="text-2xl text-black font-semibold">
                    {submittal.subject}
                  </h1>
                  <Button
                    className="bg-[#6bbd45]/20 text-black border border-black hover:bg-[#6bbd45]/30"
                    onClick={() => setShowUpdateModal(true)}
                  >
                    Update Submittal
                  </Button>
                </div>

                <Info label="Project" value={submittal.project?.name || "—"} />
                {submittal.mileStones && submittal.mileStones.length > 0 ? (
                  <div className="mb-2">
                    <h4 className="text-sm text-gray-700">Milestones</h4>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {submittal.mileStones.map((m) => (
                        <span
                          key={m.id || m._id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#6bbd45]/15 text-[#48b614] border border-[#6bbd45]/30"
                        >
                          {getMilestoneLabel(m)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : submittal.mileStoneBelongsTo ? (
                  <div className="mb-2">
                    <h4 className="text-sm text-gray-700">Milestone</h4>
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#6bbd45]/15 text-[#48b614] border border-[#6bbd45]/30">
                        {getMilestoneLabel(submittal.mileStoneBelongsTo)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Info label="Milestone" value="—" />
                )}
                <Info
                  label="Submitted By"
                  value={submittal.sender?.firstName || "—"}
                />
                <Info
                  label="Recipients"
                  value={
                    submittal.multipleRecipients?.length > 0
                      ? submittal.multipleRecipients
                          .map((r) => `${r.firstName} ${r.lastName}`)
                          .join(", ")
                      : "—"
                  }
                />
                <Info
                  label="Created At"
                  value={new Date(submittal.date).toLocaleString()}
                />

                {/* Single Version File Display */}
                {!hasMultipleVersions && sortedVersions.length === 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Attachments
                    </h4>
                    <RenderFiles
                      files={sortedVersions}
                      table="submittals"
                      parentId={submittal.id}
                      versionId={sortedVersions[0]?.id}
                      hideHeader
                    />
                  </div>
                )}
              </div>

              {/* RIGHT PANEL */}
             
            </div>

            {/* ── VERSION HISTORY (only when > 1 versions) ── */}
            {hasMultipleVersions && (
              <div className="bg-gray-100 border border-gray-100 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-[#6bbd45]" />
                  <h2 className="text-lg font-black text-black uppercase tracking-tight">
                    Version History
                  </h2>
                  <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 rounded-md">
                    {sortedVersions.length} versions
                  </span>
                </div>

                <div className="space-y-2">
                  {sortedVersions.map((version, index) => (
                    <VersionRow
                      key={version.id || index}
                      version={version}
                      index={index}
                      total={sortedVersions.length}
                      isCurrent={
                        version.id === submittal.currentVersionId ||
                        index === 0
                      }
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ADD RESPONSE MODAL */}
      {showResponseModal && (
        <SubmittalResponseModal
          submittalId={submittal.id}
          submittalVersionId={submittal.currentVersionId || sortedVersions[0]?.id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={() => {
            setShowResponseModal(false);
            fetchData();
          }}
        />
      )}

      {/* RESPONSE DETAILS MODAL */}
      {selectedResponse && (
        <SubmittalResponseDetailsModal
          response={selectedResponse}
          onClose={() => {
            setSelectedResponse(null);
            fetchData();
          }}
        />
      )}

      {/* UPDATE SUBMITTAL MODAL */}
      {showUpdateModal && (
        <UpdateSubmittalById
          submittal={submittal}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false);
            fetchData();
          }}
        />
      )}
    </>
  );
};

export default GetSubmittalByID;
