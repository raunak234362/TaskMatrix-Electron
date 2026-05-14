import { X, CalendarDays } from "lucide-react";
import { useState } from "react";
import Service from "../../api/Service";
import Button from "../fields/Button";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
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
      <div className="ml-4 border-l-2 border-green-500/20 pl-4 space-y-4 mt-3">
        {res.childResponses?.map((child) => (
          <div key={child.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm relative space-y-3">
            <div className="flex justify-between items-center">
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

            {child.subject && (
              <div className="px-3 py-1.5 bg-white rounded border border-gray-100">
                <span className="text-[8px] font-bold text-gray-400 block uppercase tracking-widest">Subject</span>
                <p className="text-xs font-bold text-gray-800">{child.subject}</p>
              </div>
            )}

            <div
              className="font-medium text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: child.description }}
            />

            {(child.totalTonnageWithConnection || child.totalTonnageWithoutConnection || child.PageNumbers || child.pageNumbers) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border border-green-100 bg-green-50/10 mt-2">
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Tonnage (With Conn)</p>
                  <p className="text-xs font-black text-black mt-0.5">{child.totalTonnageWithConnection || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Tonnage (W/O Conn)</p>
                  <p className="text-xs font-black text-black mt-0.5">{child.totalTonnageWithoutConnection || "—"}</p>
                </div>
                <div>
                  <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Page Numbers</p>
                  <p className="text-xs font-black text-black mt-0.5">{child.PageNumbers || child.pageNumbers || "—"}</p>
                </div>
              </div>
            ) : null}

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white shadow-2xl rounded-2xl border border-gray-200 w-[90%] max-w-5xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 shrink-0 bg-white">
          <h2 className="text-xl font-black text-black tracking-tight">Response Details</h2>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Inner Scrolling Body */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar space-y-6">
          {/* Message & Meta Header */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-700 font-bold uppercase tracking-widest text-[10px]">Main Message</p>
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${response.status === "APPROVED" ? "bg-green-100 text-green-700" :
                  response.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                  }`}>
                  {response.status}
                </span>
              </div>
              <span className="text-[10px] font-black text-black uppercase tracking-[0.2em] bg-green-50 px-2 py-0.5 rounded">
                {response.user ? `${response.user.firstName || ""} ${response.user.lastName || ""}`.trim() : "Sender"}
              </span>
            </div>

            {/* Subject Display */}
            {response.subject && (
              <div className="px-4 py-2 bg-gray-50/80 rounded-xl border border-gray-100">
                <span className="text-[9px] font-bold text-gray-400 block uppercase tracking-widest">Subject</span>
                <p className="text-sm font-bold text-gray-800">{response.subject}</p>
              </div>
            )}

            {/* Main Message Content */}
            <div
              className="text-black p-4 rounded-xl border border-gray-200 bg-gray-50/30 prose prose-sm max-w-none shadow-xs"
              dangerouslySetInnerHTML={{ __html: response.description }}
            />
          </div>

          {/* Additional Tonnage & Page Numbers Fields */}
          {(response.totalTonnageWithConnection || response.totalTonnageWithoutConnection || response.PageNumbers || response.pageNumbers) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-green-100 bg-green-50/20">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tonnage (With Conn)</p>
                <p className="text-sm font-black text-black mt-0.5">{response.totalTonnageWithConnection || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Tonnage (W/O Conn)</p>
                <p className="text-sm font-black text-black mt-0.5">{response.totalTonnageWithoutConnection || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Page Numbers</p>
                <p className="text-sm font-black text-black mt-0.5">{response.PageNumbers || response.pageNumbers || "—"}</p>
              </div>
            </div>
          ) : null}

          {/* Attachments */}
          <RenderFiles
            files={response.files}
            table="rfqResponse"
            parentId={response.id}
          />

          {/* Created At */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>Submitted on:</span>
            {new Date(response.createdAt).toLocaleString()}
          </div>

          {/* Reply Form Section */}
          {replyMode && (
            <div className="mt-6 border-t pt-6 space-y-4 animate-in fade-in duration-200">
              <h3 className="text-md font-bold text-green-700 uppercase tracking-wider text-sm">
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
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                  Response Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-medium outline-none focus:border-green-500"
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
                <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
                  Attach Files (Optional)
                </label>
                <MultipleFileUpload onFilesChange={setReplyFiles} initialFiles={replyFiles} />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-2">
                <Button onClick={() => setReplyMode(false)} className="bg-gray-100 text-gray-700 hover:bg-gray-200">Cancel</Button>
                <Button
                  className="bg-green-600 text-white hover:bg-green-700"
                  onClick={handleReplySubmit}
                >
                  Send Reply
                </Button>
              </div>
            </div>
          )}

          {/* Replies Section */}
          {response.childResponses?.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Threaded Replies</h3>
              {renderThread(response)}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
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
              <button
                onClick={() => setReplyMode(true)}
                className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
              >
                Reply
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailsModal;
