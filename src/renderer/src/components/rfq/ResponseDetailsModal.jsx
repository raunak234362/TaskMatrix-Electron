
import { useState, useEffect } from "react";
import Service from "../../api/Service";

import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import RenderFiles from "../common/RenderFiles";


const ResponseDetailsModal = ({
  response: initialResponse,
  onClose,
  onSuccess
}) => {
  console.log(initialResponse);
  const [replyMode, setReplyMode] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyStatus, setReplyStatus] = useState("PENDING");
  const [replyType, setReplyType] = useState("");
  const [replyFiles, setReplyFiles] = useState([]);
  const [rfqDetails, setRfqDetails] = useState(null);
  const [localResponse, setLocalResponse] = useState(initialResponse);
  
  const [expandedThreads, setExpandedThreads] = useState({});
  const [history, setHistory] = useState([initialResponse.id]);
  const currentResponseId = history[history.length - 1];

  const fetchResponseDetails = async (idToFetch) => {
    try {
      const res = await Service.getRFQResponseById(idToFetch);
      let data = res?.data || res;
      if (Array.isArray(data)) {
        data = data[0];
      }
      if (data) {
        setLocalResponse(data);
      }
    } catch (err) {
      console.error("Error fetching fresh response details:", err);
    }
  };

  useEffect(() => {
    if (currentResponseId) {
      fetchResponseDetails(currentResponseId);
    }
  }, [currentResponseId]);

  const handleBack = () => {
    if (history.length > 1) {
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  const handleViewThread = (childId) => {
    setHistory((prev) => [...prev, childId]);
  };

  useEffect(() => {
    const fetchRfq = async () => {
      try {
        const res = await Service.GetRFQbyId(initialResponse.rfqId);
        if (res?.data) {
          setRfqDetails(res.data);
        }
      } catch (err) {
        console.error("Error fetching RFQ in response modal reply:", err);
      }
    };
    if (localResponse?.rfqId) {
      fetchRfq();
    }
  }, [localResponse?.rfqId]);

  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const showWbtStatusRoles = ["staff", "admin", "project_manager", "deputy_manager", "dept_manager", "operation_executive"];
  const getStatusToShow = (item) => {
    const s = showWbtStatusRoles.includes(userRole) ? (item.wbtStatus || item.status) : item.status;
    return s || "UNKNOWN";
  };

  const handleReplySubmit = async () => {
    if (!replyMessage.trim()) return;

    const formData = new FormData();
    formData.append("description", replyMessage);
    formData.append("parentResponseId", replyTargetId || localResponse.id);
    formData.append("rfqId", localResponse.rfqId);
    formData.append("userId", sessionStorage.getItem("userId") || "");
    formData.append("status", replyStatus);
    formData.append("wbtStatus", replyStatus);
    formData.append("type", replyType);

    // Attach files
    replyFiles.forEach((file) => formData.append("files", file));

    try {
      const fabricatorName = rfqDetails?.fabricator?.fabName || rfqDetails?.sender?.fabricator?.fabName || rfqDetails?.fabricatorName || "";
      const rfqProjectName = rfqDetails?.projectName || "";
      await Service.addResponse(formData, localResponse.rfqId, fabricatorName, rfqProjectName);

      if (replyStatus === "APPROVED") {
        try {
          const payload = {
            wbtStatus: "AWARDED",
            reason: "RFQ Approved/Awarded via Response Details Reply",
          };
          await Service.UpdateRFQById(localResponse.rfqId, payload, fabricatorName, rfqProjectName);
        } catch (approveErr) {
          console.error("Failed to auto-update RFQ status to AWARDED:", approveErr);
        }
      }

      setReplyMode(false);
      setReplyTargetId(null);
      setReplyMessage("");
      setReplyFiles([]);
      setReplyStatus("PENDING");
      setReplyType("");
      if (currentResponseId) {
        await fetchResponseDetails(currentResponseId);
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName.substring(0, 2).toUpperCase();
    if (username) return username.substring(0, 2).toUpperCase();
    return "NA";
  };

  const renderThread = (res) => {
    return (
      <div className="space-y-6">
        {res.childResponses?.map((child) => (
          <div key={child.id} className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xs font-bold text-gray-700">
                  {getInitials(child.user?.firstName, child.user?.lastName, child.user?.username)}
                </span>
              </div>
              <div className="flex-1 border border-gray-200 bg-white flex flex-col">
                <div className="bg-gray-50/50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-black uppercase">
                    {child.user?.firstName ? `${child.user?.firstName} ${child.user?.lastName}` : child.user?.username || "Team Member"}
                  </span>
                  <div className="flex items-center gap-2">
                    {child.type && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black bg-yellow-100 text-black">
                        {child.type}
                      </span>
                    )}
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black ${getStatusToShow(child) === "APPROVED" ? "bg-green-100 text-black" : getStatusToShow(child) === "REJECTED" ? "bg-red-100 text-black" : "bg-blue-100 text-black"}`}>
                      {getStatusToShow(child)}
                    </span>
                    <span className="text-gray-400 text-[10px] flex items-center gap-1 font-semibold uppercase tracking-wider">
                      📅 {new Date(child.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {child.subject && (
                  <div className="px-4 pt-3 pb-1">
                    <span className="text-[10px] font-bold text-black block uppercase mb-0.5">Subject:</span>
                    <p className="text-sm font-bold text-black uppercase">{child.subject}</p>
                  </div>
                )}
                <div className="p-4 flex-1">
                  <div
                    className="prose prose-sm max-w-none text-gray-700 font-medium uppercase"
                    dangerouslySetInnerHTML={{ __html: child.description }}
                  />
                </div>
                {child.files?.length > 0 && (
                  <div className="px-4 pb-4">
                    <div className="border border-green-100/50 p-4">
                      <span className="text-xs font-bold text-black uppercase tracking-widest block mb-3">
                        Attachments
                      </span>
                      <RenderFiles
                        files={child.files}
                        table="rfqResponse"
                        parentId={child.id}
                      />
                    </div>
                  </div>
                )}
                {["client", "client_admin", "admin", "operation_executive", "dept_manager", "deputy_manager", "project_manager", "estimation_head"].includes(userRole) && (
                  <div className="bg-white border-t border-gray-100 p-2 flex justify-end gap-2">
                    {child.childResponses?.length > 0 && (
                      <button
                        onClick={() => setExpandedThreads(prev => ({ ...prev, [child.id]: !prev[child.id] }))}
                        className="px-4 py-1.5 bg-[#e2f1f8] text-black border border-black/80 font-bold text-[10px] uppercase tracking-widest hover:bg-[#c9e4f5]"
                      >
                        {expandedThreads[child.id] ? "HIDE THREAD" : `VIEW THREAD (${child.childResponses.length})`}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setReplyTargetId(child.id);
                        setReplyMode(true);
                      }}
                      className="px-4 py-1.5 bg-[#dbe8d3] text-black border border-black/80 font-bold text-[10px] uppercase tracking-widest hover:bg-[#c9d8c0]"
                    >
                      REPLY
                    </button>
                  </div>
                )}
              </div>
            </div>
            {child.childResponses?.length > 0 && expandedThreads[child.id] && (
              <div className="ml-12 border-l-2 border-gray-100 pl-4 animate-in slide-in-from-top-2 duration-200">
                {renderThread(child)}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10002] p-4">
      <div className="bg-white shadow-2xl rounded-2xl border border-black w-[95%] max-w-7xl relative overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-5 flex justify-between items-center bg-[#fcfdfc] border-b border-black/10 shrink-0">
          <div className="flex items-center gap-3">
            {history.length > 1 && (
              <button
                onClick={() => {
                  if (history.length > 1) {
                    setHistory((prev) => prev.slice(0, -1));
                  }
                }}
                className="px-3 py-1.5 bg-gray-100 text-black border border-black/20 font-bold text-xs uppercase tracking-tight hover:bg-gray-200"
              >
                Back
              </button>
            )}
            <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
              RESPONSE DETAILS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-white text-black border border-red-600 font-bold text-xs sm:text-sm uppercase tracking-tight hover:bg-red-50"
          >
            CLOSE
          </button>
        </div>

        {/* Inner Scrolling Body */}
        <div className="overflow-y-auto flex-1 p-6 custom-scrollbar space-y-6">
          {/* Message & Meta Header */}
          <div className="space-y-2">
            <div className="flex justify-between items-center border-b border-black pb-1">
              <div className="flex items-center gap-2">
                <p className="text-xs text-black font-bold uppercase">Main Message</p>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black ${getStatusToShow(localResponse) === "APPROVED" ? "bg-green-100 text-black" :
                  getStatusToShow(localResponse) === "REJECTED" ? "bg-red-100 text-black" : "bg-blue-100 text-black"
                  }`}>
                  {getStatusToShow(localResponse)}
                </span>
                {(localResponse.type || localResponse.Type) && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-black bg-yellow-100 text-black">
                    {localResponse.type || localResponse.Type}
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-black uppercase border border-black px-2 py-0.5 rounded bg-white">
                {localResponse.user ? `${localResponse.user.firstName || ""} ${localResponse.user.lastName || ""}`.trim() : "Sender"}
              </span>
            </div>

            {/* Subject Display */}
            {localResponse.subject && (
              <div className="py-1">
                <span className="text-[10px] font-bold text-black block uppercase mb-0.5">Subject:</span>
                <p className="text-sm font-bold text-black uppercase">{localResponse.subject}</p>
              </div>
            )}

            {/* Main Message Content */}
            <div
              className="text-black py-2 prose prose-sm max-w-none font-medium"
              dangerouslySetInnerHTML={{ __html: localResponse.description }}
            />
          </div>

          {/* Additional Tonnage & Page Numbers Fields */}
          {(localResponse.totalTonnageWithConnection || localResponse.totalTonnageWithoutConnection || localResponse.PageNumbers || localResponse.pageNumbers) ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-black pt-4">
              <div className="space-y-0.5">
                <p className="text-[10px] text-black font-bold uppercase">Tonnage (With Conn)</p>
                <p className="text-sm font-bold text-black uppercase">{localResponse.totalTonnageWithConnection || "—"}</p>
              </div>
              <div className="space-y-0.5 border-l border-black pl-4">
                <p className="text-[10px] text-black font-bold uppercase">Tonnage (W/O Conn)</p>
                <p className="text-sm font-bold text-black uppercase">{localResponse.totalTonnageWithoutConnection || "—"}</p>
              </div>
              <div className="space-y-0.5 border-l border-black pl-4">
                <p className="text-[10px] text-black font-bold uppercase">Page Numbers</p>
                <div className="prose prose-sm max-w-none text-sm font-bold text-black uppercase" dangerouslySetInnerHTML={{ __html: localResponse.PageNumbers || localResponse.pageNumbers || "—" }} />
              </div>
            </div>
          ) : null}

          {/* Attachments */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-black uppercase tracking-widest block">
              Attachments
            </span>
            <div className="bg-white border border-gray-200">
              <div className="p-4 sm:p-5">
                <RenderFiles
                  files={localResponse.files}
                  table="rfqResponse"
                  parentId={localResponse.id}
                />
              </div>
              {["client", "client_admin", "admin", "operation_executive", "dept_manager", "deputy_manager", "project_manager", "estimation_head"].includes(userRole) && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-3 flex justify-end">
                  <button
                    onClick={() => {
                      setReplyTargetId(localResponse.id);
                      setReplyMode(true);
                    }}
                    className="px-4 py-2 bg-[#dbe8d3] text-black border border-black/80 font-bold text-[10px] uppercase tracking-widest hover:bg-[#c9d8c0]"
                  >
                    REPLY TO THREAD
                  </button>
                </div>
              )}
            </div>
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
                  <option value="">SELECT STATUS</option>
                  {(() => {
                    const tType = localResponse?.type || localResponse?.Type;
                    return (
                      <>
                        <option value="WBT_SUBMITTED">WBT Submitted</option>
                        <option value="PENDING">Pending</option>
                        {tType === "MTO" ? (
                          <option value="COMPLETED">COMPLETED</option>
                        ) : (
                          <option value="APPROVED">Approved/Awarded</option>
                        )}
                        <option value="REJECTED">Rejected</option>
                        <option value="CLARIFICATION_REQUIRED">Needs Clarification</option>
                      </>
                    );
                  })()}
                </select>
              </div>

              {/* Type Dropdown */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-black">
                  Type
                </label>
                <select
                  value={replyType}
                  onChange={(e) => setReplyType(e.target.value)}
                  className="w-full border-2 border-black rounded-lg p-3 text-sm font-bold uppercase outline-none bg-white"
                >
                  <option value="">SELECT TYPE</option>
                  <option value="MTO">MTO</option>
                  <option value="DETAILING">DETAILING</option>
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
          {localResponse.childResponses?.length > 0 && (
            <div className="pt-6 pb-2">
              <div className="flex items-center mb-6">
                <div className="flex-1 border-t border-gray-200"></div>
                <span className="mx-4 text-gray-400 font-bold uppercase tracking-widest text-xs">
                  THREAD ({localResponse.childResponses.length} REPLIES)
                </span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>
              {renderThread(localResponse)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponseDetailsModal;
