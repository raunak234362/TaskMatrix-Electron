import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import RenderFiles from "../common/RenderFiles";
import MultipleFileUpload from "../fields/MultipleFileUpload";

// Status options for submittal
const STATUS_OPTIONS = [
  { label: "Submitted to EOR", value: "SUBMITTED_TO_EOR" },
  { label: "Revised & Resubmitted", value: "REVISED_RESUBMITTAL" },
  { label: "NOT APPROVED", value: "NOT_APPROVED" },
  { label: "RELEASE_FOR_FABRICATION", value: "RELEASE_FOR_FABRICATION" },
  { label: "REVISED_RESUBMIT_FOR_FABRICATION", value: "REVISED_RESUBMIT_FOR_FABRICATION" },
];


const Info = ({ label, value }) => (
  <div className="space-y-1">
    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    <div
      className="text-sm text-gray-700 font-medium prose prose-sm max-w-none"
      dangerouslySetInnerHTML={{ __html: value || "—" }}
    />
  </div>
);

const SubmittalResponseDetailsModal = ({
  response,
  onClose,
}) => {
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [replyStatus, setReplyStatus] = useState("NOT_APPROVED");

  const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";
  const userId = sessionStorage.getItem("userId") || "";

  // Define roles that can reply
  const canReply = ["ADMIN", "STAFF", "MANAGER", "PROJECT_MANAGER", "DEPT_MANAGER", "DEPUTY_MANAGER", "CLIENT_ADMIN"].includes(userRole);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("reason", replyMessage);
    formData.append("description", replyMessage);
    formData.append("submittalsId", response.submittalsId);
    formData.append("submittalVersionId", response.submittalVersionId);
    formData.append("parentResponseId", response.id);
    formData.append("userId", userId);
    formData.append("userRole", userRole);
    formData.append("status", replyStatus);

    replyFiles.forEach((file) => formData.append("files", file));

    try {
      await Service.addSubmittalResponse(formData);
      onClose();
    } catch (err) {
      console.error("Failed to send submittal reply:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-4xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
          <div>
            <h2 className="text-xl font-black text-black tracking-tight uppercase">
              Response Details
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </header>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8 bg-gray-50">
          {/* Main Details Panel */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <Info label="Reason" value={response.reason} />
              <Info label="Description" value={response.description} />
            </div>

            {/* Attachments */}
            {(response.files?.length > 0) && (
              <div className="pt-4 border-t border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                  Attachments
                </p>
                <RenderFiles
                  files={response.files}
                  table="submittalsResponse"
                  parentId={response.id}
                  hideHeader
                />
              </div>
            )}

            {/* Timestamp */}
            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
              <CalendarDays size={14} className="text-gray-400" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {new Date(response.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 🔥 CHILD RESPONSES THREAD (History) */}
          {response.childResponses?.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-black uppercase tracking-tight">History</h4>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-3">
                {response.childResponses.map((child) => (
                  <div
                    key={child.id}
                    className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-bold text-gray-700 uppercase tracking-tight">
                        {child.user?.firstName || "User"} {child.user?.lastName || ""}
                        <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded text-[10px] text-gray-400">
                          {child.user?.role || "N/A"}
                        </span>
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {new Date(child.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div
                      className="text-sm text-gray-600 prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: child.reason || child.description,
                      }}
                    />

                    {child.files?.length > 0 && (
                      <div className="pt-2">
                        <RenderFiles
                          files={child.files}
                          table="submittalsResponse"
                          parentId={child.id}
                          hideHeader
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reply Form Section */}
          <div className="pt-2">
            {!replyMode ? (
              <Button
                className="bg-[#6bbd45] text-white hover:bg-[#5aa83a] shadow-md px-8 py-2 font-bold uppercase text-xs tracking-widest"
                onClick={() => setReplyMode(true)}
              >
                Reply
              </Button>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-lg space-y-5 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-black uppercase tracking-tight">Your Reply</h3>
                  <button onClick={() => setReplyMode(false)} className="text-gray-400 hover:text-black">
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-4">
                  <RichTextEditor
                    value={replyMessage}
                    onChange={setReplyMessage}
                    placeholder="Type your reply..."
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</label>
                      <select
                        className="w-full border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-[#6bbd45] focus:border-transparent transition-all"
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
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attachments</label>
                      <MultipleFileUpload onFilesChange={setReplyFiles} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    className="text-gray-500 hover:bg-gray-100"
                    onClick={() => setReplyMode(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#6bbd45] text-white hover:bg-[#5aa83a] shadow-md px-8 font-bold uppercase text-xs tracking-widest"
                    onClick={handleReplySubmit}
                  >
                    Send Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittalResponseDetailsModal;
