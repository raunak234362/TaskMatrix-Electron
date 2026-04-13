import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import RichTextEditor from "../fields/RichTextEditor";
import RenderFiles from "../common/RenderFiles";


const ResponseDetailsModal = ({
  response,
  onClose,
  onSuccess
}) => {
  console.log(response);
  const [replyMode, setReplyMode] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("PENDING");
  const [replyFiles, setReplyFiles] = useState([]);

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  // const handleReplySubmit = async () => {
  //   if (!replyMessage.trim()) return;

  //   const formData = new FormData();
  //   formData.append("description", replyMessage);
  //   formData.append("parentResponseId", response.id); // Threading HERE
  //   formData.append("rfqId", response.rfqId);
  //   formData.append("userId", sessionStorage.getItem("userId") || "");
  //   formData.append("wbtStatus", "OPEN");
  //   formData.append("status", "OPEN");

  //   try {
  //     await Service.addResponse(formData, responseId);

  //     setReplyMode(false);
  //     setReplyMessage("");
  //     onClose(); // close modal
  //     // trigger parent refresh
  //   } catch (err) {
  //     console.error("Reply failed:", err);
  //   }
  // };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("description", replyMessage);
    formData.append("parentResponseId", response.id);
    formData.append("rfqId", response.rfqId);
    formData.append("userId", sessionStorage.getItem("userId") || "");
    // formData.append("status", replyStatus);
    // formData.append("wbtStatus", replyStatus);

    // Attach files
    replyFiles.forEach((file) => formData.append("files", file));

    try {
      await Service.addResponse(formData, response.rfqId);

      setReplyMode(false);
      setReplyMessage("");
      setReplyFiles([]);
      setReplyStatus("PENDING");
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  const renderThread = (res) => {
    return (
      <div className="ml-4 border-l pl-4 space-y-4">
        {res.childResponses?.map((child) => (
          <div key={child.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm relative">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] bg-green-50 px-2 py-0.5 rounded">
                  {child.user ? `${child.user.firstName} ${child.user.lastName}` : "User"}
                </span>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${child.status === "APPROVED" ? "bg-green-100 text-green-700" :
                  child.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                  }`}>
                  {child.status}
                </span>
              </div>
              <span className="text-[10px] font-bold text-gray-400">
                {new Date(child.createdAt).toLocaleString()}
              </span>
            </div>
            <div
              className="font-medium text-gray-700 prose prose-sm max-w-none mb-3"
              dangerouslySetInnerHTML={{ __html: child.description }}
            />

            {child.files?.length > 0 && (
              <RenderFiles
                files={child.files}
                table="rfqResponse"
                parentId={child.id}
              />
            )}

            {/* Recursive threading */}
            {child.childResponses?.length > 0 && renderThread(child)}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white h-[90vh] overflow-y-auto max-w-4xl w-full p-6 rounded-xl shadow-xl space-y-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3">
          <h2 className="text-xl font-semibold text-green-700">
            Response Details
          </h2>
          <Button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </Button>
        </div>

        {/* Message */}
        <div className="space-y-1">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-700 font-bold uppercase tracking-widest text-[10px]">Main Message</p>
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${response.status === "APPROVED" ? "bg-green-100 text-green-700" :
                response.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                }`}>
                {response.status}
              </span>
            </div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
              {response.user ? `${response.user.firstName} ${response.user.lastName}` : "Sender"} · {response.user?.role?.replace("_", " ") || "N/A"}
            </span>
          </div>
          <div
            className="text-black p-4 rounded-xl border border-gray-200 bg-gray-50/30 prose prose-sm max-w-none shadow-xs"
            dangerouslySetInnerHTML={{ __html: response.description }}
          />
        </div>

        {/* Attachments */}
        <RenderFiles
          files={response.files}
          table="rfqResponse"
          parentId={response.id}
        />

        {/* Created At */}
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <CalendarDays size={16} />
          {new Date(response.createdAt).toLocaleString()}
        </div>

        {replyMode && (
          <div className="mt-4 border-t pt-4 space-y-3">
            <h3 className="text-md font-semibold text-green-700">
              Write a Reply
            </h3>

            {/* Reply message */}
            <div className="space-y-1">
              <RichTextEditor
                value={replyMessage}
                onChange={setReplyMessage}
                placeholder="Type your reply..."
              />
            </div>

            {/* Status Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Response Status
              </label>
              <select
                value={replyStatus}
                onChange={(e) => setReplyStatus(e.target.value)}
                className="w-full border rounded-md p-2"
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CLARIFICATION_REQUIRED">
                  Needs Clarification
                </option>
              </select>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Attach Files (Optional)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) =>
                  setReplyFiles(Array.from(e.target.files || []))
                }
                className="w-full border rounded-md p-2"
              />
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-end gap-2">
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

        {/* Replies Section */}
        {response.childResponses?.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm text-gray-700 font-semibold">Replies</h3>
            {renderThread(response)}
          </div>
        )}

        {/* Future  actions */}
        <div className="flex justify-end gap-3 pt-3">
          {[
            "client",
            "client_admin",
            "admin",
            "operation_executive",
            "dept_manager",
            "deputy_manager",
            "project_manager",
            "estimation_head"
          ].includes(userRole) ? (
            <Button
              onClick={() => setReplyMode(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
            >
              Reply
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailsModal;
