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
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("submittalID", submittalId);
      formData.append("subject", subject);
      formData.append("description", description);
      formData.append("status", status);
      files.forEach((file) => formData.append("files", file));

      const submittalDetails = await Service.GetSubmittalbyId(submittalId);
      const pid = submittalDetails?.projectId || submittalDetails?.project_id || submittalDetails?.data?.projectId || submittalDetails?.data?.project_id || submittalDetails?.project?.id || submittalDetails?.data?.project?.id;
      let fabricatorName = "";
      let projectName = "";
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }
      await Service.AddBFA(formData, fabricatorName, projectName);
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
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("description", description);
      formData.append("status", status);
      files.forEach((file) => formData.append("files", file));

      const submittalDetails = await Service.GetSubmittalbyId(submittalId);
      const pid = submittalDetails?.projectId || submittalDetails?.project_id || submittalDetails?.data?.projectId || submittalDetails?.data?.project_id || submittalDetails?.project?.id || submittalDetails?.data?.project?.id;
      let fabricatorName = "";
      let projectName = "";
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }
      await Service.UpdateBFA(bfa.id, formData, fabricatorName, projectName);
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
    <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6">
      <div className="flex justify-between items-center pb-4">
        <SectionTitle title="BFA" />
        {bfa ? (
          (userRole !== "STAFF" || isAssist) && (
            <button
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              onClick={() => {
                setDescription("");
                setFiles([]);
                setStatus(bfa.status || "partial");
                setShowUpdateModal(true);
              }}
            >
              Update BFA
            </button>
          )
        ) : (
          (userRole !== "STAFF" || isAssist) && (
            <button
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              onClick={() => {
                setSubject("");
                setDescription("");
                setFiles([]);
                setStatus("partial");
                setShowCreateModal(true);
              }}
            >
              + Upload BFA
            </button>
          )
        )}
      </div>

      {bfa ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Info label="BFA Subject" value={bfa.subject} />
            <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
              <span className="font-semibold text-black uppercase tracking-wider shrink-0">
                BFA Status:
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold uppercase tracking-tight border ${bfa.status === "APPROVED"
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
            <div className="space-y-4">
              <SectionTitle title="Description" />
              <div
                className="p-4 bg-white border border-gray-200 rounded-none prose prose-sm max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: currentVersion.description }}
              />
            </div>
          )}

          {(() => {
            const currentFiles = currentVersion?.files || currentVersion?.file || [];
            const hasCurrentFiles = currentFiles.length > 0;
            return hasCurrentFiles ? (
              <div className="space-y-4">
                <SectionTitle title="Attachments" />
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
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-3 pb-4">
                <div className="flex items-center gap-3">
                  <History className="w-5 h-5 text-black" />
                  <SectionTitle title="Version History" />
                </div>
                <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-2 py-0.5 rounded-none">
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
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-none bg-white flex flex-col items-center justify-center">
          <FileText className="w-10 h-10 text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-black uppercase tracking-wider">No BACK FROM APPROVAL (BFA) associated with this submittal yet.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-3 px-4 py-1.5 bg-gray-100 text-black border border-gray-300 rounded-none hover:bg-gray-200 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
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
              <label className="text-sm font-medium">BFA Subject (Optional)</label>
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
              <label className="text-sm font-medium">Description (Optional)</label>
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
              <label className="text-sm font-medium">Description (Optional)</label>
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
  <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
    <span className="font-semibold text-black uppercase tracking-wider shrink-0">
      {label}:
    </span>
    <span className="text-black font-normal uppercase text-left truncate flex-1" title={value}>
      {value || "—"}
    </span>
  </div>
);

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
);

export default BfaManager;
