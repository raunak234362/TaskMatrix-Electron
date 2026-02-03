import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import Button from "../fields/Button";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";
import RenderFiles from "../common/RenderFiles";

// Status options for submittal
const STATUS_OPTIONS = [
  { label: "Not Approved", value: "NOT_APPROVED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];


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

  const canReply = ["ADMIN", "STAFF", "MANAGER"].includes(userRole);

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("reason", replyMessage);
    formData.append("submittalsId", response.submittalsId);
    formData.append("parentResponseId", response.id);
    formData.append("userId", userId);
    formData.append("status", replyStatus);

    replyFiles.forEach((file) => formData.append("files", file));

    try {
      await Service.addSubmittalResponse(formData, response.submittalsId);
      onClose(); // close to refresh parent
    } catch (err) {
      console.error("Failed to send submittal reply:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-white w-full max-w-lg p-6 rounded-xl space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-700 hover:text-red-600"
        >
          <X size={18} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-bold text-green-700">Response Details</h2>

        {/* Parent Message */}
        <div
          className="bg-gray-100 p-3 rounded-md border prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{
            __html: response.reason || response.description,
          }}
        />

        <RenderFiles
          files={response.files}
          table="submittalsResponse"
          parentId={response.id}
        />

        {/* Timestamp */}
        <div className="flex items-center gap-2 text-xs text-gray-700">
          <CalendarDays size={14} />
          {new Date(response.createdAt).toLocaleString()}
        </div>

        {/* 🔥 CHILD RESPONSES THREAD */}
        {response.childResponses?.length > 0 && (
          <div className="mt-4 space-y-4 border-t pt-4 max-h-60 overflow-y-auto">
            <h4 className="text-sm font-semibold text-gray-700">History</h4>

            {response.childResponses.map((child) => (
              <div
                key={child.id}
                className="bg-gray-50 p-3 rounded border text-sm"
              >
                <div className="flex justify-between text-xs text-gray-700 mb-1">
                  <span className="font-medium text-gray-700">
                    {child.user?.firstName || "User"}{" "}
                    {child.user?.lastName || ""} ({child.user?.role || "N/A"})
                  </span>
                  <span>{new Date(child.createdAt).toLocaleString()}</span>
                </div>

                <div
                  className="text-gray-700 mb-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: child.reason || child.description,
                  }}
                />

                <RenderFiles
                  files={child.files}
                  table="submittalsResponse"
                  parentId={child.id}
                />
              </div>
            ))}
          </div>
        )}

        {/* Reply Button */}
        {canReply && !replyMode && (
          <Button
            className="bg-blue-600 text-white mt-4"
            onClick={() => setReplyMode(true)}
          >
            Reply
          </Button>
        )}

        {/* Reply Form */}
        {replyMode && (
          <div className="pt-4 space-y-4 border-t">
            {/* Message */}
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

            {/* Status */}
            <select
              className="w-full border rounded p-2"
              value={replyStatus}
              onChange={(e) => setReplyStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* File Upload */}
            <input
              type="file"
              multiple
              onChange={(e) =>
                setReplyFiles(e.target.files ? Array.from(e.target.files) : [])
              }
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button onClick={() => setReplyMode(false)}>Cancel</Button>
              <Button
                className="bg-green-600 text-white"
                onClick={handleReplySubmit}
              >
                Send Reply
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubmittalResponseDetailsModal;
