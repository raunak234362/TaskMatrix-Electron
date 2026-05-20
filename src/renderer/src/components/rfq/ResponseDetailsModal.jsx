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
    formData.append("wbtStatus", replyStatus);

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
      <div className="ml-4 border-l border-black pl-4 space-y-4 mt-2">
        {res.childResponses?.map((child) => (
          <div key={child.id} className="bg-white p-4 border border-black shadow-sm relative space-y-2">
            <div className="flex justify-between items-center border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-black uppercase border border-black px-2 py-0.5 rounded bg-white">
                  {child.user ? `${child.user.firstName} ${child.user.lastName}` : "User"}
                </span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black ${child.status === "APPROVED" ? "bg-green-100 text-black" :
                  child.status === "REJECTED" ? "bg-red-100 text-black" : "bg-blue-100 text-black"
                  }`}>
                  {child.status}
                </span>
              </div>
              <span className="text-[10px] font-bold text-black uppercase">
                {new Date(child.createdAt).toLocaleString()}
              </span>
            </div>

            {child.subject && (
              <div className="py-0.5">
                <span className="text-[10px] font-bold text-black block uppercase mb-0.5">Subject:</span>
                <p className="text-sm font-bold text-black uppercase">{child.subject}</p>
              </div>
            )}

            <div
              className="font-medium text-black prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: child.description }}
            />

            {(child.totalTonnageWithConnection || child.totalTonnageWithoutConnection || child.PageNumbers || child.pageNumbers) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-black pt-2">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-black font-bold uppercase">Tonnage (With Conn)</p>
                  <p className="text-sm font-bold text-black uppercase">{child.totalTonnageWithConnection || "—"}</p>
                </div>
                <div className="space-y-0.5 border-l border-black pl-4">
                  <p className="text-[10px] text-black font-bold uppercase">Tonnage (W/O Conn)</p>
                  <p className="text-sm font-bold text-black uppercase">{child.totalTonnageWithoutConnection || "—"}</p>
                </div>
                <div className="space-y-0.5 border-l border-black pl-4">
                  <p className="text-[10px] text-black font-bold uppercase">Page Numbers</p>
                  <div className="prose prose-sm max-w-none text-sm font-bold text-black uppercase" dangerouslySetInnerHTML={{ __html: child.PageNumbers || child.pageNumbers || "—" }} />
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
      <div className="bg-white shadow-2xl rounded-2xl border border-black w-[95%] max-w-7xl relative overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-[#6bbd45] rounded-full"></div>
            <h2 className="text-lg font-bold text-black uppercase">Response Details</h2>
          </div>
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
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-black font-bold uppercase">Main Message</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black ${response.status === "APPROVED" ? "bg-green-100 text-black" :
                  response.status === "REJECTED" ? "bg-red-100 text-black" : "bg-blue-100 text-black"
                  }`}>
                  {response.status}
                </span>
              </div>
              <span className="text-xs font-bold text-black uppercase border border-black px-2 py-0.5 rounded bg-white">
                {response.user ? `${response.user.firstName || ""} ${response.user.lastName || ""}`.trim() : "Sender"}
              </span>
            </div>

            {/* Subject Display */}
            {response.subject && (
              <div className="py-1">
                <span className="text-[10px] font-bold text-black block uppercase mb-0.5">Subject:</span>
                <p className="text-sm font-bold text-black uppercase">{response.subject}</p>
              </div>
            )}

            {/* Main Message Content */}
            <div
              className="text-black py-2 prose prose-sm max-w-none font-medium"
              dangerouslySetInnerHTML={{ __html: response.description }}
            />
          </div>

          {/* Additional Tonnage & Page Numbers Fields */}
          {(response.totalTonnageWithConnection || response.totalTonnageWithoutConnection || response.PageNumbers || response.pageNumbers) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-black pt-4">
              <div className="space-y-0.5">
                <p className="text-[10px] text-black font-bold uppercase">Tonnage (With Conn)</p>
                <p className="text-sm font-bold text-black uppercase">{response.totalTonnageWithConnection || "—"}</p>
              </div>
              <div className="space-y-0.5 border-l border-black pl-4">
                <p className="text-[10px] text-black font-bold uppercase">Tonnage (W/O Conn)</p>
                <p className="text-sm font-bold text-black uppercase">{response.totalTonnageWithoutConnection || "—"}</p>
              </div>
              <div className="space-y-0.5 border-l border-black pl-4">
                <p className="text-[10px] text-black font-bold uppercase">Page Numbers</p>
                <div className="prose prose-sm max-w-none text-sm font-bold text-black uppercase" dangerouslySetInnerHTML={{ __html: response.PageNumbers || response.pageNumbers || "—" }} />
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
          <div className="text-[10px] font-bold text-black uppercase pt-2">
            Submitted on: {new Date(response.createdAt).toLocaleString()}
          </div>

          {/* Reply Form Section */}
          {replyMode && (
            <div className="mt-8 border-t border-black pt-8 space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-[#6bbd45] rounded-full"></div>
                <h3 className="text-sm font-bold text-black uppercase tracking-widest">
                  Write a Reply
                </h3>
              </div>

              {/* Reply message */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-black uppercase tracking-widest">Message</label>
                <RichTextEditor
                  value={replyMessage}
                  onChange={setReplyMessage}
                  placeholder="Type your reply..."
                />
              </div>

              {/* Status Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black">
                  Response Status
                </label>
                <select
                  value={replyStatus}
                  onChange={(e) => setReplyStatus(e.target.value)}
                  className="w-full border-2 border-black rounded-lg p-3 text-sm font-bold uppercase outline-none bg-white"
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
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black">
                  Attach Files (Optional)
                </label>
                <MultipleFileUpload onFilesChange={setReplyFiles} initialFiles={replyFiles} />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setReplyMode(false)} 
                  className="px-6 py-2 bg-gray-100 border-2 border-black text-black font-bold uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-green-200 border-2 border-black text-black font-bold uppercase tracking-widest rounded-lg hover:bg-green-300 transition-all text-xs"
                  onClick={handleReplySubmit}
                >
                  Send Reply
                </button>
              </div>
            </div>
          )}

          {/* Replies Section */}
          {response.childResponses?.length > 0 && (
            <div className="mt-6 border-t border-black pt-4">
              <h3 className="text-xs font-bold uppercase text-black mb-2">Threaded Replies</h3>
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
