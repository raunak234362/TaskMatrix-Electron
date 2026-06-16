import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import Service from "../../api/Service";
import RenderFiles from "../ui/RenderFiles";
import { toast } from "react-toastify";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";

const ConnectionDesignerQuotaByID = ({ id, onClose }) => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(true);
    const [replyMode, setReplyMode] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyStatus, setReplyStatus] = useState("IN_REVIEW");
    const [mainSteelPriceInput, setMainSteelPriceInput] = useState("0");
    const [miscSteelPriceInput, setMiscSteelPriceInput] = useState("0");
    const [replyFiles, setReplyFiles] = useState([]);
    const [selectedParentId, setSelectedParentId] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const userRole = sessionStorage.getItem("userRole");
    const canApprove = ["DEPUTY_MANAGER", "OPERATION_EXECUTIVE", "ADMIN", "DEPT_MANAGER"].includes(userRole);
    const isCDRole = ["CONNECTION_DESIGNER", "CONNECTION_DESIGNER_ENGINEER", "CONNECTION_DESIGNER_ADMIN"].includes(userRole?.toUpperCase());
    const canReply = canApprove || isCDRole;

    const fetchReplies = async (quotationId) => {
        try {
            setLoadingReplies(true);
            const res = await Service.getCDQuotaResponsesByQuotaId(quotationId);
            const data = res?.data || res || [];
            setReplies(data);
        } catch (err) {
            console.error("Error fetching replies:", err);
        } finally {
            setLoadingReplies(false);
        }
    };

    const fetchQuota = async () => {
        try {
            setLoading(true);
            const response = await Service.GetConnectionDesignerQuotaByID(id);
            console.log("Quota response:", response);
            const data = response?.data ? response.data : response;
            setQuota(data);
            if (data) {
                setMainSteelPriceInput(data.mainSteelPrice || "0");
                setMiscSteelPriceInput(data.miscSteelPrice || "0");
                fetchReplies(data.id);
            }
        } catch (err) {
            setError("Failed to load Connection Designer Quota details");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchQuota();
        }
    }, [id]);

    const buildTree = (list) => {
        const map = {};
        const roots = [];
        list.forEach((item) => {
            map[item.id] = { ...item, childResponses: [] };
        });
        list.forEach((item) => {
            const mappedItem = map[item.id];
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].childResponses.push(mappedItem);
            } else {
                roots.push(mappedItem);
            }
        });
        const sortTree = (nodes) => {
            nodes.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            nodes.forEach(node => {
                if (node.childResponses) sortTree(node.childResponses);
            });
        };
        sortTree(roots);
        return roots;
    };

    const renderThread = (res) => {
        return (
            <div className="ml-4 sm:ml-6 mt-4 border-l-2 border-black/10 pl-4 sm:pl-6 space-y-6">
                {res.childResponses?.map((child) => (
                    <div
                        key={child.id}
                        className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <span className="text-[10px] font-semibold text-black uppercase tracking-tight">
                                {child.userRole?.replace("_", " ") || "User"}
                            </span>
                            <div className="flex items-center gap-2">
                                {child.status && (
                                    <span className="text-[9px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-widest border border-blue-100">
                                        {child.status}
                                    </span>
                                )}
                                <span className="text-[9px] font-semibold bg-gray-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {new Date(child.createdAt).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div
                            className="prose prose-sm max-w-none text-black/80 font-medium rich-text-content"
                            dangerouslySetInnerHTML={{ __html: child.description || child.message }}
                        />
                        
                        {(child.mainSteelPrice > 0 || child.miscSteelPrice > 0) && (
                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                {child.mainSteelPrice > 0 && (
                                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                                        Main Steel: ${child.mainSteelPrice}
                                    </span>
                                )}
                                {child.miscSteelPrice > 0 && (
                                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-bold uppercase tracking-wider">
                                        Misc Steel: ${child.miscSteelPrice}
                                    </span>
                                )}
                                <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 font-bold uppercase tracking-wider">
                                    Total Bid: ${(parseFloat(child.mainSteelPrice || "0") + parseFloat(child.miscSteelPrice || "0")).toFixed(2)}
                                </span>
                            </div>
                        )}

                        {child.files && child.files.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-black/5">
                                <RenderFiles
                                    files={child.files}
                                    table="CDQuotaResponse"
                                    parentId={child.id}
                                    hideHeader
                                />
                            </div>
                        )}
                        
                        {canReply && (
                            <div className="mt-2 flex justify-end">
                                <button
                                    onClick={() => {
                                        setSelectedParentId(child.id);
                                        setMainSteelPriceInput(child.mainSteelPrice || quota.mainSteelPrice || "0");
                                        setMiscSteelPriceInput(child.miscSteelPrice || quota.miscSteelPrice || "0");
                                        setReplyStatus(child.status || "IN_REVIEW");
                                        setReplyMode(true);
                                    }}
                                    className="px-3 py-1 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-md hover:bg-blue-100 transition-all uppercase tracking-wider cursor-pointer"
                                >
                                    Reply to this
                                </button>
                            </div>
                        )}

                        {child.childResponses?.length > 0 && renderThread(child)}
                    </div>
                ))}
            </div>
        );
    };

    const handleReplySubmit = async () => {
        if (!replyMessage.trim()) {
            toast.error("Please enter a reply message");
            return;
        }

        try {
            setSubmitting(true);
            const userId = sessionStorage.getItem("userId") || "";
            const userRoleStr = sessionStorage.getItem("userRole") || "";

            const formData = new FormData();
            formData.append("quotaId", quota.id || id);
            formData.append("parentId", selectedParentId || quota.id || id);
            formData.append("description", replyMessage);
            formData.append("status", replyStatus);
            formData.append("mainSteelPrice", mainSteelPriceInput || "0");
            formData.append("miscSteelPrice", miscSteelPriceInput || "0");
            formData.append("userId", userId);
            formData.append("userRole", userRoleStr);

            if (replyFiles?.length) {
                replyFiles.forEach((file) => {
                    formData.append("files", file);
                });
            }

            await Service.addCDQuotaResponse(formData);
            toast.success("Reply sent successfully!");
            setReplyMessage("");
            setReplyFiles([]);
            setReplyMode(false);

            await fetchReplies(quota.id || id);
        } catch (err) {
            console.error("Reply submission error:", err);
            toast.error("Failed to send reply");
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        try {
            setIsApproving(true);
            await Service.ConnectionDesignerQuotaApproveByID(id);
            toast.success("Quota approved successfully");
            fetchQuota();
        } catch (err) {
            console.error("Approval failed:", err);
            toast.error("Failed to approve quota");
        } finally {
            setIsApproving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border flex flex-col items-center justify-center border-gray-100 overflow-hidden w-full max-w-sm mx-auto h-[200px] relative">
                    <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm">
                        Close
                    </button>
                    <Loader2 className="w-6 h-6 animate-spin mb-2" />
                    <p className="text-gray-700 font-medium">Loading quota details...</p>
                </div>
            </div>
        );
    }

    if (error || !quota) {
        return (
            <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border flex flex-col items-center justify-center border-gray-100 overflow-hidden w-full max-w-sm mx-auto h-[200px] relative">
                    <button onClick={onClose} className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm">
                        Close
                    </button>
                    <AlertCircle className="w-6 h-6 mb-2 text-red-600" />
                    <p className="text-red-600 font-medium">{error || "Quota not found"}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-3xl mx-auto flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex-none p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight uppercase">Quota Details</h2>
                        <span className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-widest border border-black ${quota.approvalStatus ? 'bg-green-100 text-black' : 'bg-yellow-100 text-black'}`}>
                            {quota.approvalStatus ? 'Approved' : 'Pending'}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {canReply && (
                            <button
                                onClick={() => {
                                    setSelectedParentId(quota.id);
                                    setMainSteelPriceInput(quota.mainSteelPrice || "0");
                                    setMiscSteelPriceInput(quota.miscSteelPrice || "0");
                                    setReplyStatus("IN_REVIEW");
                                    setReplyMode(true);
                                }}
                                className="px-4 sm:px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-xs sm:text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                            >
                                Reply
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
                    <div className="bg-gray-50 p-6 sm:p-8 rounded-3xl border border-gray-200 shadow-sm space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                            <Info label="Serial No" value={quota.serialNo || "—"} />
                            <Info label="Bid Price" value={quota.bidprice ? `$${quota.bidprice}` : "—"} />
                            <Info label="Est. Hours" value={quota.estimatedHours || "—"} />
                            <Info label="Weeks" value={quota.weeks || "—"} />
                            <Info label="Approval Date" value={quota.approvalDate ? new Date(quota.approvalDate).toLocaleDateString() : "—"} />
                            <Info label="Created At" value={quota.createdAt ? new Date(quota.createdAt).toLocaleDateString() : "—"} />
                        </div>

                        {quota.files && quota.files.length > 0 && (
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <RenderFiles
                                    files={quota.files}
                                    table="connectionDesignerQuota"
                                    parentId={quota.id}
                                    hideHeader={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* Threaded Replies Section */}
                    <div className="mt-8 border border-gray-200 rounded-3xl p-6 sm:p-8 bg-white shadow-sm space-y-6">
                        <h3 className="text-sm sm:text-base font-bold text-gray-900 uppercase tracking-tight">
                            Threaded Communications ({replies.length})
                        </h3>
                        {loadingReplies ? (
                            <div className="flex justify-center p-4">
                                <Loader2 className="w-6 h-6 animate-spin text-green-500" />
                            </div>
                        ) : buildTree(replies).length > 0 ? (
                            <div className="space-y-4">
                                {buildTree(replies).map((reply) => (
                                    <div
                                        key={reply.id}
                                        className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-xs animate-in fade-in duration-300"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-sm font-semibold text-gray-700">
                                                {reply.userRole?.replace("_", " ") || "User"}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                {reply.status && (
                                                    <span className="text-[9px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-widest border border-green-100">
                                                        {reply.status}
                                                    </span>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {new Date(reply.createdAt).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div
                                            className="text-sm text-gray-800 leading-relaxed rich-text-content prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: reply.description || reply.message }}
                                        />

                                        {/* Display prices if any */}
                                        {(reply.mainSteelPrice > 0 || reply.miscSteelPrice > 0) && (
                                            <div className="flex flex-wrap gap-2 mt-3 text-xs">
                                                {reply.mainSteelPrice > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                                                        Main Steel: ${reply.mainSteelPrice}
                                                    </span>
                                                )}
                                                {reply.miscSteelPrice > 0 && (
                                                    <span className="px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                                                        Misc Steel: ${reply.miscSteelPrice}
                                                    </span>
                                                )}
                                                <span className="px-2 py-1 rounded-md bg-green-50 text-green-700 border border-green-100 font-bold uppercase tracking-wider">
                                                    Total Bid: ${(parseFloat(reply.mainSteelPrice || "0") + parseFloat(reply.miscSteelPrice || "0")).toFixed(2)}
                                                </span>
                                            </div>
                                        )}

                                        {reply.files && reply.files.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-gray-200">
                                                <RenderFiles
                                                    files={reply.files}
                                                    table="CDQuotaResponse"
                                                    parentId={reply.id}
                                                    hideHeader
                                                />
                                            </div>
                                        )}

                                        {/* Reply Action */}
                                        {canReply && (
                                            <div className="mt-3 flex justify-end">
                                                <button
                                                    onClick={() => {
                                                        setSelectedParentId(reply.id);
                                                        setMainSteelPriceInput(reply.mainSteelPrice || quota.mainSteelPrice || "0");
                                                        setMiscSteelPriceInput(reply.miscSteelPrice || quota.miscSteelPrice || "0");
                                                        setReplyStatus(reply.status || "IN_REVIEW");
                                                        setReplyMode(true);
                                                    }}
                                                    className="px-4 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-xs uppercase tracking-tight shadow-sm cursor-pointer"
                                                >
                                                    Reply
                                                </button>
                                            </div>
                                        )}

                                        {reply.childResponses && reply.childResponses.length > 0 && renderThread(reply)}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-700 italic text-center py-4">No replies yet.</p>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                    {canApprove && !quota.approvalStatus && (
                        <button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="px-6 py-2 bg-green-200 border-2 border-black text-black font-black uppercase tracking-widest rounded-lg hover:bg-green-300 transition-all text-sm shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isApproving ? "Approving..." : "Approve Quota"}
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Reply Popup Modal */}
            {replyMode && (
                <div className="project-component-container fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col border border-gray-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Reply Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <h2 className="text-base font-bold text-gray-900 uppercase tracking-widest">
                                    Reply {selectedParentId && selectedParentId !== quota.id ? "(Threaded)" : ""}
                                </h2>
                            </div>
                            <button
                                onClick={() => setReplyMode(false)}
                                className="px-4 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-xs uppercase tracking-tight cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Reply Modal Body */}
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
                            <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:border-green-400 transition-all">
                                <RichTextEditor
                                    value={replyMessage}
                                    onChange={setReplyMessage}
                                    placeholder="Draft your reply..."
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block">
                                        Main Steel Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={mainSteelPriceInput}
                                        onChange={(e) => setMainSteelPriceInput(e.target.value)}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-xl outline-none font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block">
                                        Misc Steel Price (USD)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={miscSteelPriceInput}
                                        onChange={(e) => setMiscSteelPriceInput(e.target.value)}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-xl outline-none font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block">
                                        Status
                                    </label>
                                    <select
                                        value={replyStatus}
                                        onChange={(e) => setReplyStatus(e.target.value)}
                                        className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-green-100 outline-none font-semibold uppercase text-xs tracking-widest appearance-none cursor-pointer text-black"
                                    >
                                        <option value="IN_REVIEW">In Review</option>
                                        <option value="APPROVED">Approved</option>
                                        <option value="REJECTED">Rejected</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-widest block">
                                        Documents
                                    </label>
                                    <MultipleFileUpload onFilesChange={setReplyFiles} />
                                </div>
                            </div>
                        </div>

                        {/* Reply Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
                            <button
                                className="px-8 py-2.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg font-bold text-xs uppercase tracking-tight hover:bg-green-100 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                onClick={handleReplySubmit}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 size={14} className="animate-spin" />
                                        Sending...
                                    </div>
                                ) : (
                                    "Send Reply"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="flex justify-between items-center gap-4 py-3 border-b border-gray-200 border-dashed last:border-0">
        <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
            {label}:
        </p>
        <p className="text-gray-900 text-xs sm:text-sm font-bold uppercase tracking-tight text-right">{value}</p>
    </div>
);

export default ConnectionDesignerQuotaByID;
