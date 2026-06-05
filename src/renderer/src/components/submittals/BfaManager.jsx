import React, { useEffect, useState } from "react";
import Service from "../../api/Service";
import { Loader2, AlertCircle, Clock, History, FileText, ChevronDown, ChevronUp } from "lucide-react";
import Button from "../fields/Button";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RenderFiles from "../common/RenderFiles";
import { toast } from "react-toastify";

// ── Version History Row ──────────────────────────────────────────────────────
const BfaVersionRow = ({ version, index, total, isCurrent, bfaId }) => {
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
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 hover:bg-black/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isCurrent
              ? "bg-[#6bbd45] text-white"
              : "bg-gray-100 text-gray-500"
              }`}
          >
            v{total - index}
            {isCurrent && " · Current"}
          </span>

          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {uploadedAt ? new Date(uploadedAt).toLocaleString() : "—"}
            </span>
            {uploaderName && (
              <span className="truncate text-gray-500">· by {uploaderName}</span>
            )}
          </div>
        </div>

        <span className="shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {version.description && (
            <div className="pt-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Description
              </p>
              <div
                className="p-3 bg-white border border-gray-200 rounded-lg prose prose-sm max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: version.description }}
              />
            </div>
          )}

          {(() => {
            const filesArray = version.files || version.file || [];
            const hasFiles = filesArray.length > 0;
            return (
              <>
                {hasFiles && (
                  <div className="pt-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                      Attachments
                    </p>
                    <RenderFiles
                      files={[
                        {
                          ...version,
                          files: filesArray.map((f) => ({
                            ...f,
                            documentID: bfaId,
                            versionId: version.id,
                          }))
                        }
                      ]}
                      table="bfa"
                      parentId={bfaId}
                      hideHeader
                    />
                  </div>
                )}

                {!version.description && !hasFiles && (
                  <p className="pt-3 text-xs text-gray-400 italic">
                    No details available for this version.
                  </p>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// ── Main BfaManager Component ────────────────────────────────────────────────
const BfaManager = ({ submittalId, isAssist }) => {
  const [bfa, setBfa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const userRole = sessionStorage.getItem("userRole")?.toUpperCase();

  // Form Fields State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [status, setStatus] = useState("partial");
  const [submitting, setSubmitting] = useState(false);

  const fetchBfa = async () => {
    try {
      setLoading(true);
      const res = await Service.GetBFABySubmittalId(submittalId);
      if (res && res.data) {
        setBfa(res.data);
      } else {
        setBfa(null);
      }
    } catch (err) {
      console.error("Error fetching BFA:", err);
      setBfa(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submittalId) {
      fetchBfa();
    }
  }, [submittalId]);

  const handleCreateBfa = async () => {
    if (!subject.trim()) {
      toast.error("Subject is required");
      return;
    }
    const strippedDescription = description.replace(/<[^>]+>/g, "").trim();
    if (!strippedDescription) {
      toast.error("Description is required");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("submittalID", submittalId);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("status", status);
      files.forEach((file) => formData.append("files", file));

      await Service.AddBFA(formData);
      toast.success("BFA Raised Successfully!");

      // Reset form
      setSubject("");
      setDescription("");
      setFiles([]);
      setShowCreateModal(false);

      // Refresh BFA details
      fetchBfa();
    } catch (err) {
      console.error(err);
      toast.error("Failed to raise BFA");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBfa = async () => {
    const strippedDescription = description.replace(/<[^>]+>/g, "").trim();
    if (!strippedDescription) {
      toast.error("Description is required");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("description", description);
      formData.append("status", status);
      files.forEach((file) => formData.append("files", file));

      await Service.UpdateBFA(bfa.id, formData);
      toast.success("BFA Updated Successfully!");

      // Reset form
      setDescription("");
      setFiles([]);
      setShowUpdateModal(false);

      // Refresh BFA details
      fetchBfa();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update BFA");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-gray-700 justify-center">
        <Loader2 className="w-5 h-5 animate-spin" />
        Checking BFA status...
      </div>
    );
  }

  // Sort versions newest → oldest
  const sortedVersions = [...(bfa?.versions || [])].sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || b.date || 0) -
      new Date(a.createdAt || a.updatedAt || a.date || 0)
  );
  const hasMultipleVersions = sortedVersions.length > 1;
  const currentVersion = sortedVersions[0];

  return (
    <div className="bg-gray-100 p-6 rounded-xl border border-gray-100 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-black flex items-center gap-2">
            BFA
          </h2>
        </div>
        {bfa ? (
          (userRole !== "STAFF" || isAssist) && (
            <Button
              className="bg-[#6bbd45]/20 text-black border border-black hover:bg-[#6bbd45]/30 font-bold text-sm"
              onClick={() => {
                setDescription("");
                setFiles([]);
                setStatus(bfa.status || "partial");
                setShowUpdateModal(true);
              }}
            >
              Update BFA
            </Button>
          )
        ) : (
          (userRole !== "STAFF" || isAssist) && (
            <Button
              className="bg-[#6bbd45]/20 text-black border border-black hover:bg-[#6bbd45]/30 font-bold text-sm"
              onClick={() => {
                setSubject("");
                setDescription("");
                setFiles([]);
                setStatus("partial");
                setShowCreateModal(true);
              }}
            >
              + Upload BFA
            </Button>
          )
        )}
      </div>

      {bfa ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info label="BFA Subject" value={bfa.subject} />
            <div className="mb-2">
              <h4 className="text-sm text-gray-700">BFA Status</h4>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tight border mt-1 ${bfa.status === "APPROVED"
                ? "bg-green-100 text-green-700 border-green-200"
                : bfa.status === "REJECTED"
                  ? "bg-red-100 text-red-700 border-red-200"
                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                }`}>
                {bfa.status || "PENDING"}
              </span>
            </div>
          </div>

          {currentVersion?.description && (
            <div className="space-y-2">
              <h4 className="text-sm text-gray-700">Description</h4>
              <div
                className="p-4 bg-white border border-gray-200 rounded-xl prose prose-sm max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: currentVersion.description }}
              />
            </div>
          )}

          {(() => {
            const currentFiles = currentVersion?.files || currentVersion?.file || [];
            const hasCurrentFiles = currentFiles.length > 0;
            return hasCurrentFiles ? (
              <div className="space-y-2">
                <h4 className="text-sm text-gray-700">Attachments</h4>
                <RenderFiles
                  files={[
                    {
                      ...currentVersion,
                      files: currentFiles.map((f) => ({
                        ...f,
                        documentID: bfa.id,
                        versionId: currentVersion.id,
                      }))
                    }
                  ]}
                  table="bfa"
                  parentId={bfa.id}
                  hideHeader
                />
              </div>
            ) : null;
          })()}

          {/* Version History */}
          {hasMultipleVersions && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-black" />
                <h3 className="text-sm font-semibold text-gray-700">Version History</h3>
                <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-2 py-0.5 rounded-md">
                  {sortedVersions.length} versions
                </span>
              </div>
              <div className="space-y-2">
                {sortedVersions.map((version, index) => (
                  <BfaVersionRow
                    key={version.id || index}
                    version={version}
                    index={index}
                    total={sortedVersions.length}
                    isCurrent={index === 0}
                    bfaId={bfa.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-xl bg-white flex flex-col items-center justify-center">
          <FileText className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500 italic">No bacK FROM APPROVAL (BFA) associated with this submittal yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-xs font-bold text-black mt-2 hover:underline"
          >
            Raise BFA Now
          </button>
        </div>
      )}

      {/* CREATE BFA MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[210] animate-in fade-in duration-200">
          <div className="bg-white h-[80vh] overflow-y-auto p-6 rounded-xl w-full max-w-2xl shadow-lg relative space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold text-green-700">
              BFA
            </h2>

            <div>
              <label className="text-sm font-medium">BFA Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border border-gray-200 rounded-md p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-[#6bbd45] text-sm"
                placeholder="Enter BFA subject..."
              />
            </div>

            <div>
              <label className="text-sm font-medium">BFA Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-md p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-[#6bbd45] text-sm"
              >
                <option value="partial">Partial</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <div className="mt-1">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Explain BFA details..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Attachments</label>
              <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button onClick={() => setShowCreateModal(false)}>Cancel</Button>
              <Button className="bg-green-600 text-white font-bold" onClick={handleCreateBfa} disabled={submitting}>
                {submitting ? "Submitting..." : "Raise BFA"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* UPDATE BFA MODAL */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-[210] animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-xl w-full max-w-lg shadow-lg relative space-y-4 border border-gray-100">
            <h2 className="text-xl font-bold text-green-700">
              Update BFA (New Version)
            </h2>

            <div>
              <label className="text-sm font-medium">BFA Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-200 bg-white rounded-md p-2 mt-1 focus:outline-none focus:ring-1 focus:ring-[#6bbd45] text-sm"
              >
                <option value="partial">Partial</option>
                <option value="complete">Complete</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Description *</label>
              <div className="mt-1">
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  placeholder="Explain new version updates..."
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Attachments</label>
              <MultipleFileUpload onFilesChange={setFiles} initialFiles={files} />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <Button onClick={() => setShowUpdateModal(false)}>Cancel</Button>
              <Button className="bg-green-600 text-white font-bold" onClick={handleUpdateBfa} disabled={submitting}>
                {submitting ? "Updating..." : "Update BFA"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Info = ({ label, value }) => (
  <div className="mb-2">
    <h4 className="text-sm text-gray-700 font-medium">{label}</h4>
    <div className="text-sm text-gray-900 mt-1 font-semibold">{value || "—"}</div>
  </div>
);

export default BfaManager;
