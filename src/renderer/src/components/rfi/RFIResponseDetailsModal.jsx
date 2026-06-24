import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RenderFiles from "../common/RenderFiles";

// Status dropdown options
const STATUS_OPTIONS = [
  { label: "Partial", value: "PARTIAL" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Open", value: "OPEN" },
];

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
);

const RFIResponseDetailsModal = ({ response, onClose }) => {
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyStatus, setReplyStatus] = useState(response.wbtStatus);

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";
  const userId = sessionStorage.getItem("userId") || "";

  // 🔒 Only Admin/Team can reply (not client)
  const canReply = ["ADMIN", "PROJECT_MANAGER", "OPERATION_EXECUTIVE", "DEPT_MANAGER", "DEPUTY_MANAGER"].includes(userRole);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("reason", replyMessage);
    formData.append("rfiId", response.rfiId);
    formData.append("parentResponseId", response.id);
    formData.append("userId", userId);
    formData.append("wbtStatus", replyStatus); // 👈 send selected status

    replyFiles.forEach((file) => formData.append("files", file));

    let fabricatorName = "";
    let projectName = "";
    if (response.rfiId) {
      const rfiRes = await Service.GetRFIbyId(response.rfiId);
      const rfi = rfiRes?.data || rfiRes;
      const pid = rfi?.projectId || rfi?.project_id || rfi?.project?.id;
      if (pid) {
        const projectRes = await Service.GetProjectById(pid);
        const project = projectRes?.data || projectRes;
        fabricatorName = project?.fabricator?.fabName || project?.fabricatorName || "";
        projectName = project?.projectName || project?.name || "";
      }
    }

    await Service.addRFIResponse(formData, response.rfiId, fabricatorName, projectName);

    // Reset Form UI
    setReplyMode(false);
    setReplyMessage("");
    setReplyFiles([]);
    setReplyStatus(response.wbtStatus);

    // Close to refresh parent UI
    onClose();
  };

  const getSenderName = () => {
    if (response.user) {
      return `${response.user.firstName || ""} ${response.user.lastName || ""}`.trim();
    }
    if (response.userRole === "CLIENT" || response.userRole === "CLIENT_ADMIN") {
      return "WBT Team";
    }
    return "Client";
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
            <h1 className="text-xl font-bold text-black uppercase tracking-wider">Response Details</h1>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </header>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
          <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6 shadow-sm">
            {/* Metadata Box at the Top */}
            <div className="bg-[#ebf5ea]/80 border border-[#6bbd45]/20 p-4 rounded-none">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-16 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-black uppercase tracking-wider shrink-0">
                    Sender:
                  </span>
                  <span className="text-black font-normal uppercase whitespace-nowrap" title={getSenderName()}>
                    {getSenderName()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-black uppercase tracking-wider shrink-0">
                    Created At:
                  </span>
                  <span className="text-black font-normal uppercase whitespace-nowrap">
                    {new Date(response.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Response Message */}
            <div className="pt-2">
              <SectionTitle title="Response Message" />
              <div
                className="text-sm text-black font-normal prose prose-sm max-w-none bg-white p-4 border border-gray-200 rounded-none mt-4"
                dangerouslySetInnerHTML={{ __html: response.reason }}
              />
            </div>

            {/* Attachments Section */}
            {response.files?.length > 0 && (
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <SectionTitle title="Attachments" />
                <RenderFiles
                  files={response.files}
                  table="rFIResponse"
                  parentId={response.id}
                  hideHeader={true}
                  hideSectionTitle={true}
                />
              </div>
            )}

            {/* Reply Button (Inside the main card at the bottom) */}
            {canReply && !replyMode && (
              <div className="pt-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setReplyMode(true)}
                  className="px-8 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                >
                  Reply
                </button>
              </div>
            )}
          </div>

          {/* History / Child Responses */}
          {response.childResponses?.length > 0 && (
            <div className="bg-white p-6 rounded-none border border-gray-200 space-y-4 shadow-sm">
              <SectionTitle title="History" />
              <div className="space-y-4 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                {response.childResponses.map((child) => (
                  <div
                    key={child.id}
                    className="bg-gray-50 p-4 rounded-none border border-gray-200 text-sm space-y-2"
                  >
                    <div className="flex justify-between text-xs text-gray-500 pb-1 border-b border-gray-200">
                      <span className="font-semibold text-black uppercase tracking-wider">
                        {child.user ? `${child.user.firstName || ""} ${child.user.lastName || ""}`.trim() : "User"} ({child.user?.role || "N/A"})
                      </span>
                      <span>{new Date(child.createdAt).toLocaleString()}</span>
                    </div>
                    <div
                      className="text-black prose prose-sm max-w-none pt-1"
                      dangerouslySetInnerHTML={{ __html: child.reason }}
                    />

                    {child.files?.length > 0 && (
                      <div className="pt-2">
                        <RenderFiles
                          files={child.files}
                          table="rFIResponse"
                          parentId={child.id}
                          hideHeader={true}
                          hideSectionTitle={true}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Form (rendered as its own card below) */}
          {replyMode && (
            <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6 shadow-sm animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                <SectionTitle title="Your Reply" />
                <button onClick={() => setReplyMode(false)} className="text-gray-400 hover:text-black">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-black uppercase tracking-wider">
                    Message
                  </label>
                  <RichTextEditor
                    value={replyMessage}
                    onChange={setReplyMessage}
                    placeholder="Type your reply..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                      Response Status
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-none p-2 text-sm bg-white focus:outline-none focus:border-black uppercase font-medium"
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

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                      Attach Files
                    </label>
                    <MultipleFileUpload onFilesChange={setReplyFiles} initialFiles={replyFiles} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  className="px-6 py-2 bg-gray-50 text-black border border-gray-300 rounded-none hover:bg-gray-200 transition-all font-bold text-sm uppercase tracking-wider cursor-pointer"
                  onClick={() => setReplyMode(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-[#6bbd45] text-white border-2 border-green-700 hover:bg-[#5aa83a] transition-all font-bold text-sm uppercase tracking-wider cursor-pointer rounded-none"
                  onClick={handleReplySubmit}
                >
                  Send Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RFIResponseDetailsModal;
