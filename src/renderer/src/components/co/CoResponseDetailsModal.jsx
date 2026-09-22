import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import Button from "../fields/Button";
import Service from "../../api/Service";
import { CalendarDays, Loader2 } from "lucide-react";
import RenderFiles from "../common/RenderFiles";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RichTextEditor from "../fields/RichTextEditor";

const STATUS_OPTIONS = [
  { label: "Pending", value: "PENDING" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

const getSenderName = (resObj) => {
  if (resObj?.user) {
    const fullName = `${resObj.user.firstName || ""} ${resObj.user.lastName || ""}`.trim();
    if (fullName) return fullName;
  }
  if (resObj?.createdByRole === "CLIENT" || resObj?.userRole === "CLIENT" || resObj?.userRole === "CLIENT_ADMIN") {
    return "Client";
  }
  return "WBT Team";
};

const HistoryNode = ({
  initialChild,
  depth = 0,
  canReply,
  replyMode,
  replyParentId,
  setReplyParentId,
  setReplyMode,
  renderReplyForm
}) => {
  const [child] = useState(initialChild);
  const userName = getSenderName(child);

  return (
    <div className="flex gap-3 w-full mt-2 animate-in fade-in duration-200">
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50/80 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{userName}</span>
              {child.userRole && (
                <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full tracking-wider">
                  {child.userRole}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
              <CalendarDays className="w-3.5 h-3.5" />
              {new Date(child.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Body */}
          <div className="p-4">
            <div
              className="text-gray-800 text-sm prose prose-sm max-w-none font-medium"
              dangerouslySetInnerHTML={{ __html: child.description || child.reason }}
            />

            {/* Child Files */}
            {child.files?.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <RenderFiles
                  files={child.files}
                  table="cOResponse"
                  parentId={child.id || child._id}
                />
              </div>
            )}
          </div>

          {/* Footer / Reply Action */}
          {canReply && (!replyMode || replyParentId !== (child.id || child._id)) && (
            <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setReplyParentId(child.id || child._id);
                  setReplyMode(true);
                }}
                className="text-xs font-bold uppercase tracking-tight bg-green-200 border border-black px-4 py-1.5 text-black hover:bg-green-300 transition-colors flex items-center gap-1 rounded"
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply Form */}
          {replyMode && replyParentId === (child.id || child._id) && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              {renderReplyForm()}
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {child.childResponses?.length > 0 && (
          <div className="mt-4 border-l-2 border-gray-200 pl-4 ml-4 space-y-4">
            {[...child.childResponses]
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((nestedChild) => (
                <HistoryNode
                  key={nestedChild.id || nestedChild._id}
                  initialChild={nestedChild}
                  depth={depth + 1}
                  canReply={canReply}
                  replyMode={replyMode}
                  replyParentId={replyParentId}
                  setReplyParentId={setReplyParentId}
                  setReplyMode={setReplyMode}
                  renderReplyForm={renderReplyForm}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

const COResponseDetailsModal = ({
  response,
  onClose,
  onSuccess,
  CoId: propCoId,
  projectId: propProjectId,
  co: propCo,
  fabricatorName: propFabName,
  projectName: propProjName,
}) => {
  const reduxProjects = useSelector((state) => state.projectInfo?.projectData || []);
  const reduxFabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || []);

  const [fullResponse, setFullResponse] = useState(response);
  const [isLoading, setIsLoading] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyStatus, setReplyStatus] = useState(response.status || response.Status || "PENDING");
  const [replyParentId, setReplyParentId] = useState(response.id || response._id);

  const fetchCO = async () => {
    const coIdToFetch = propCoId || response?.CoId || response?.coId || response?.changeOrderId;
    if (!coIdToFetch) return;
    setIsLoading(true);
    try {
      const res = await Service.GetChangeOrderByID(coIdToFetch);
      if (res?.data) {
        const parsed = Array.isArray(res.data.coResponses)
          ? res.data.coResponses
          : JSON.parse(res.data.coResponses || "[]");

        // Build map and tree locally
        const map = {};
        parsed.forEach((item) => {
          const id = item.id || item._id;
          map[id] = { ...item, childResponses: [] };
        });

        parsed.forEach((item) => {
          const id = item.id || item._id;
          const mappedItem = map[id];
          const parentId = item.parentResponseId || item.ParentResponseId;
          if (parentId && map[parentId]) {
            map[parentId].childResponses.push(mappedItem);
          }
        });

        const myId = response.id || response._id;
        if (map[myId]) {
          setFullResponse(map[myId]);
          setReplyStatus(map[myId].status || map[myId].Status || "PENDING");
        }
      }
    } catch (error) {
      console.error("Error fetching CO responses", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (propCoId || response?.CoId || response?.coId) {
      fetchCO();
    }
  }, [response?.id, response?.CoId, propCoId]);

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";
  const userId = sessionStorage.getItem("userId") || "";

  // Allow roles to reply
  const canReply = ["ADMIN", "STAFF", "MANAGER", "CLIENT", "CLIENT_ADMIN", "PROJECT_MANAGER", "DEPT_MANAGER", "DEPUTY_MANAGER"].includes(userRole);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim() || submittingReply) return;

    try {
      setSubmittingReply(true);
      const coIdToUse = propCoId || response.CoId || response.coId || response.changeOrderId;
      const formData = new FormData();
      formData.append("CoId", coIdToUse || "");
      formData.append("description", replyMessage);
      formData.append("status", replyStatus);
      formData.append("userId", userId);
      formData.append("userRole", userRole);
      formData.append("parentResponseId", replyParentId);

      replyFiles.forEach((file) => formData.append("files", file));

      let fabricatorName = propFabName || "";
      let projectName = propProjName || "";
      let co = propCo;

      if (!co && coIdToUse) {
        try {
          const coRes = await Service.GetChangeOrderByID(coIdToUse);
          co = coRes?.data?.data || coRes?.data || coRes;
        } catch (e) {
          console.error("Error fetching CO by ID in reply:", e);
        }
      }

      if (!fabricatorName) {
        fabricatorName =
          co?.fabricator?.fabName ||
          co?.fabricator?.name ||
          co?.fabricatorName ||
          co?.Project?.fabricator?.fabName ||
          co?.Project?.fabricator?.name ||
          co?.Project?.fabricatorName ||
          co?.project?.fabricator?.fabName ||
          co?.project?.fabricator?.name ||
          co?.project?.fabricatorName ||
          "";
      }

      if (!projectName) {
        projectName =
          co?.projectName ||
          co?.project?.projectName ||
          co?.project?.name ||
          co?.Project?.projectName ||
          co?.Project?.name ||
          "";
      }

      const pid =
        (typeof propProjectId === "object" ? (propProjectId?.id || propProjectId?._id) : propProjectId) ||
        (typeof co?.project === "string" ? co.project : null) ||
        (typeof co?.Project === "string" ? co.Project : null) ||
        co?.projectId ||
        co?.project_id ||
        co?.ProjectId ||
        co?.project?.id ||
        co?.project?._id ||
        co?.Project?.id ||
        co?.Project?._id;

      let project = null;
      if (pid) {
        project = reduxProjects.find((p) => String(p.id || p._id) === String(pid));

        if (!project || !fabricatorName || !projectName) {
          try {
            const projectRes = await Service.GetProjectById(pid);
            const apiProj = projectRes?.data?.project || projectRes?.data?.data || projectRes?.data || projectRes;
            if (apiProj && typeof apiProj === "object") {
              project = { ...project, ...apiProj };
            }
          } catch (e) {
            console.error("Error fetching project by ID in reply:", e);
          }
        }
      }

      if (project) {
        if (!projectName) {
          projectName = project?.projectName || project?.name || "";
        }
        if (!fabricatorName) {
          fabricatorName =
            project?.fabricator?.fabName ||
            project?.fabricator?.name ||
            project?.fabricatorName ||
            "";

          if (!fabricatorName) {
            const fabId = project?.fabricatorId || (typeof project?.fabricator === "string" ? project.fabricator : null);
            if (fabId) {
              const fab = reduxFabricators.find((f) => String(f.id || f._id) === String(fabId));
              if (fab) {
                fabricatorName = fab.fabName || fab.name || "";
              }
            }
          }
        }
      }

      if (!fabricatorName) {
        const fabId = co?.fabricatorId || (typeof co?.fabricator === "string" ? co.fabricator : null);
        if (fabId) {
          const fab = reduxFabricators.find((f) => String(f.id || f._id) === String(fabId));
          if (fab) {
            fabricatorName = fab.fabName || fab.name || "";
          }
        }
      }

      if (!fabricatorName) fabricatorName = "UNKNOWN";
      if (!projectName) projectName = "UNKNOWN";

      await Service.addCOResponse(formData, response.id || response._id, fabricatorName, projectName);

      toast.success("Reply submitted successfully");
      setReplyMode(false);
      setReplyMessage("");
      setReplyFiles([]);
      setReplyStatus("PENDING");
      setReplyParentId(response.id || response._id);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to submit reply:", error);
      toast.error(error?.response?.data?.message || "Failed to submit reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const renderReplyForm = () => (
    <div className="pt-4 space-y-4 border-t w-full animate-in fade-in zoom-in duration-200">
      <div className="space-y-1">
        <label className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Your Reply
        </label>
        <RichTextEditor
          value={replyMessage}
          onChange={setReplyMessage}
          placeholder="Type your reply..."
        />
      </div>

      {/* Attachments */}
      <div className="space-y-1">
        <label className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Attachments
        </label>
        <MultipleFileUpload
          initialFiles={replyFiles}
          onFilesChange={setReplyFiles}
        />
      </div>

      {/* Status Picker for reply */}
      <div className="space-y-1">
        <label className="text-sm font-bold uppercase tracking-wide text-gray-700">
          Update Status
        </label>
        <select
          value={replyStatus}
          onChange={(e) => setReplyStatus(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-2.5 text-sm uppercase font-semibold text-gray-800 bg-white"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button
          onClick={() => setReplyMode(false)}
          className="px-6 py-2 bg-gray-100 text-black rounded-lg font-bold uppercase tracking-tight hover:bg-gray-200 transition-all border border-gray-200 text-xs"
        >
          Cancel
        </Button>
        <Button
          className="px-6 py-2 rounded-lg font-bold bg-[#6bbd45]/20 text-black uppercase tracking-tight border border-[#6bbd45]/40 hover:bg-[#6bbd45]/30 transition-all shadow-sm text-xs"
          onClick={handleReplySubmit}
          disabled={submittingReply}
        >
          {submittingReply ? "Sending..." : "Send Reply"}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="project-component-container fixed inset-0 bg-black/60 flex justify-center items-center z-[130] backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#fafffb] w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col rounded-3xl shadow-2xl relative border border-gray-100 p-6">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 shrink-0">
          <h2 className="text-xl font-black text-black uppercase tracking-tight">
            Response Details
          </h2>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-6 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
              <span className="text-gray-500 font-medium">Loading response details...</span>
            </div>
          ) : (
            <div className="w-full pt-2">
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
                <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">
                      {getSenderName(fullResponse)}
                    </span>
                    {fullResponse.userRole && (
                      <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full tracking-wider">
                        {fullResponse.userRole}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {new Date(fullResponse.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="p-5">
                  <div
                    className="text-gray-800 text-sm prose prose-sm max-w-none font-medium"
                    dangerouslySetInnerHTML={{ __html: fullResponse.description || fullResponse.reason }}
                  />
                  {fullResponse.files?.length > 0 && (
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <RenderFiles
                        files={fullResponse.files}
                        table="cOResponse"
                        parentId={fullResponse.id || fullResponse._id}
                      />
                    </div>
                  )}
                </div>

                {canReply && (!replyMode || replyParentId !== (fullResponse.id || fullResponse._id)) && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button
                      className="px-6 py-2 bg-green-200 text-black rounded-lg font-bold uppercase tracking-tight hover:bg-green-300/90 transition-all shadow-md text-xs"
                      onClick={() => {
                        setReplyParentId(fullResponse.id || fullResponse._id);
                        setReplyMode(true);
                      }}
                    >
                      Reply
                    </Button>
                  </div>
                )}

                {replyMode && replyParentId === (fullResponse.id || fullResponse._id) && (
                  <div className="p-5 border-t border-gray-200 bg-gray-50">
                    {renderReplyForm()}
                  </div>
                )}
              </div>

              {/* Child Responses (Thread) */}
              {fullResponse.childResponses?.length > 0 && (
                <div className="space-y-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1 flex items-center gap-2">
                    <div className="h-px bg-gray-200 flex-1" />
                    Thread ({fullResponse.childResponses.length} Replies)
                    <div className="h-px bg-gray-200 flex-1" />
                  </h3>

                  <div className="space-y-6">
                    {[...fullResponse.childResponses]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((child) => (
                        <HistoryNode
                          key={child.id || child._id}
                          initialChild={child}
                          depth={0}
                          canReply={canReply}
                          replyMode={replyMode}
                          replyParentId={replyParentId}
                          setReplyParentId={setReplyParentId}
                          setReplyMode={setReplyMode}
                          renderReplyForm={renderReplyForm}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default COResponseDetailsModal;
