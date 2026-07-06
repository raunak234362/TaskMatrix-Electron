import { CalendarDays, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { formatDateTime } from "../../utils/dateUtils";
import { useState, useEffect } from "react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import RenderFiles from "../ui/RenderFiles";
import MultipleFileUpload from "../fields/MultipleFileUpload";

// Status dropdown options
const STATUS_OPTIONS = [
  { label: "Partial", value: "PARTIAL" },
  { label: "Complete", value: "COMPLETE" },
];

const getInitials = (firstName, lastName) => {
  const f = firstName ? firstName.charAt(0) : "";
  const l = lastName ? lastName.charAt(0) : "";
  return (f + l).toUpperCase() || "U";
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
  const [child, setChild] = useState(initialChild);

  useEffect(() => {
    const fetchChild = async () => {
      try {
        const res = await Service.GetRFIResponsebyId(initialChild.id);
        if (res) {
          const mainData = res.data || res;
          const children = res.childResponses || mainData.childResponses || [];
          setChild((prev) => ({ ...prev, ...mainData, childResponses: children }));
        }
      } catch (error) {
        console.error("Error fetching child response details", error);
      }
    };
    fetchChild();
  }, [initialChild.id]);

  const userName = child.user ? `${child.user.firstName || ""} ${child.user.lastName || ""}`.trim() : "User";
  const initials = getInitials(child.user?.firstName, child.user?.lastName);

  return (
    <div className="flex gap-3 w-full mt-2">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <div className="w-8 h-8 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
          {initials}
        </div>
      </div>
      
      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-3 bg-gray-50/80 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-sm">{userName}</span>
              {child.user?.role && (
                <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full tracking-wider">
                  {child.user.role}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500 flex items-center gap-1 font-medium">
              <CalendarDays className="w-3.5 h-3.5" />
              {formatDateTime(child.createdAt)}
            </span>
          </div>

          {/* Body */}
          <div className="p-4">
            <div
              className="text-gray-800 text-sm prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: child.reason }}
            />

            {/* Child Files */}
            {child.files?.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <RenderFiles
                  files={child.files}
                  table="rFIResponse"
                  parentId={child.id}
                />
              </div>
            )}
          </div>

          {/* Footer / Reply Action */}
          {canReply && (!replyMode || replyParentId !== child.id) && (
            <div className="px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => {
                  setReplyParentId(child.id);
                  setReplyMode(true);
                }}
                className="text-xs font-bold uppercase tracking-tight bg-green-200 border border-black p-2 text-black hover:text-black transition-colors flex items-center gap-1"
              >
                Reply
              </button>
            </div>
          )}

          {/* Reply Form */}
          {replyMode && replyParentId === child.id && (
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
                  key={nestedChild.id}
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

const RFIResponseDetailsModal = ({ response, onClose }) => {
  const [fullResponse, setFullResponse] = useState(response);
  const [isLoading, setIsLoading] = useState(false);
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyStatus, setReplyStatus] = useState(response.wbtStatus);
  const [replyParentId, setReplyParentId] = useState(response.id);

  useEffect(() => {
    const fetchFullResponse = async () => {
      setIsLoading(true);
      try {
        const res = await Service.GetRFIResponsebyId(response.id);
        if (res) {
          const mainData = res.data || res;
          const childResponses = res.childResponses || mainData.childResponses || [];
          
          setFullResponse({
            ...mainData,
            childResponses: childResponses
          });
          setReplyStatus(mainData.wbtStatus || response.wbtStatus);
        }
      } catch (error) {
        console.error("Error fetching RFI response details", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (response?.id) {
      fetchFullResponse();
    }
  }, [response?.id]);

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";
  const userId = sessionStorage.getItem("userId") || "";
  console.log(response);

  // 🔒 Allow Admin/Team and Client roles to reply
  const canReply = ["ADMIN", "STAFF", "MANAGER", "CLIENT", "CLIENT_ADMIN", "CLIENT_ESTIMATOR"].includes(userRole);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("reason", replyMessage);
    formData.append("rfiId", fullResponse.rfiId || response.rfiId);
    formData.append("parentResponseId", replyParentId);
    formData.append("userId", userId);
    formData.append("wbtStatus", replyStatus); // 👈 send selected status

    replyFiles.forEach((file) => formData.append("files", file));

    let fabricatorName = "";
    let projectName = "";
    const targetRfiId = fullResponse.rfiId || response.rfiId;
    if (targetRfiId) {
      const rfiRes = await Service.GetRFIbyId(targetRfiId);
      const rfi = rfiRes?.data || rfiRes;
      fabricatorName = rfi?.fabricator?.fabName || rfi?.fabricatorName || rfi?.project?.fabricator?.fabName || "";
      projectName = rfi?.project?.projectName || rfi?.project?.name || "";
    }

    await Service.addRFIResponse(formData, targetRfiId, fabricatorName, projectName);

    // Reset Form UI
    setReplyMode(false);
    setReplyMessage("");
    setReplyFiles([]);
    setReplyStatus(fullResponse.wbtStatus || response.wbtStatus);
    setReplyParentId(fullResponse.id || response.id);

    // Close to refresh parent UI
    onClose();
  };

  const renderReplyForm = () => (
    <div className="pt-4 space-y-4 border-t w-full animate-in fade-in zoom-in duration-200">
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Your Reply
        </label>
        <RichTextEditor
          value={replyMessage}
          onChange={setReplyMessage}
          placeholder="Type your reply..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Response Status
        </label>
        <select
          className="w-full border rounded-md p-2"
          value={replyStatus}
          onChange={(e) => setReplyStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Attach Files
        </label>
        <MultipleFileUpload onFilesChange={setReplyFiles} initialFiles={replyFiles} />
      </div>

      <div className="flex justify-end gap-3">
        <Button
          onClick={() => setReplyMode(false)}
          className="px-4 py-2 bg-gray-100 text-black rounded-lg font-bold uppercase tracking-tight hover:bg-gray-200 transition-all border border-gray-200"
        >
          Cancel
        </Button>
        <Button
          className="px-6 py-2 rounded-lg font-bold bg-primary/20 text-black uppercase tracking-tight border border-black shadow-md"
          onClick={handleReplySubmit}
        >
          Send Reply
        </Button>
      </div>
    </div>
  );

  return (
    <div className="project-component-container fixed inset-0 bg-black/60 flex justify-center items-center z-[120] backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#fafffb] w-full max-h-[95vh] overflow-y-auto p-5 rounded-3xl shadow-2xl space-y-5 relative border border-gray-100">
        {/* Close Button */}
        <div className="flex justify-between items-center mb-2">
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
<div className="h-[80vh] overflow-y-auto">
        {/* Main message */}
        {isLoading ? (
          <div className="flex flex-col justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
            <span className="text-gray-500 font-medium">Loading response details...</span>
          </div>
        ) : (
          <div className="flex gap-4 w-full pt-2">
            {/* Main Avatar */}
            <div className="flex-shrink-0 mt-1">
              <div className="w-11 h-11 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold shadow-sm">
                {getInitials(fullResponse.user?.firstName, fullResponse.user?.lastName)}
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="bg-white border-2 border-gray-200 rounded-xl shadow-sm overflow-hidden mb-8">
                <div className="flex justify-between items-center px-5 py-4 bg-gray-50 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-gray-900">
                      {fullResponse.user ? `${fullResponse.user.firstName || ""} ${fullResponse.user.lastName || ""}`.trim() : "User"}
                    </span>
                    {fullResponse.user?.role && (
                      <span className="text-[10px] uppercase font-bold text-gray-600 bg-gray-200 px-2 py-0.5 rounded-full tracking-wider">
                        {fullResponse.user.role}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-gray-500 flex items-center gap-1">
                    <CalendarDays className="w-3.5 h-3.5" />
                    {formatDateTime(fullResponse.createdAt)}
                  </span>
                </div>
                
                <div className="p-5">
                  <div
                    className="text-gray-800 text-sm prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: fullResponse.reason }}
                  />
                  {fullResponse.files?.length > 0 && (
                    <div className="mt-5 border-t border-gray-100 pt-4">
                      <RenderFiles
                        files={fullResponse.files}
                        table="rFIResponse"
                        parentId={fullResponse.id}
                      />
                    </div>
                  )}
                </div>

                {canReply && (!replyMode || replyParentId !== fullResponse.id) && (
                  <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button
                      className="px-6 py-2 bg-green-200 text-black rounded-lg font-bold uppercase tracking-tight hover:bg-green-300/90 transition-all shadow-md text-xs"
                      onClick={() => {
                        setReplyParentId(fullResponse.id);
                        setReplyMode(true);
                      }}
                    >
                      Reply to Thread
                    </Button>
                  </div>
                )}

                {replyMode && replyParentId === fullResponse.id && (
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
                          key={child.id}
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
          </div>
        )}

</div>
      </div>
    </div>
  );
};

export default RFIResponseDetailsModal;
