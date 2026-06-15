/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import Service from "../../api/Service";

import { Loader2, AlertCircle, Settings, Paperclip, User, Clock, MessageSquare, Send, Layout } from "lucide-react";
import ResponseModal from "./ResponseModal";
import RichTextEditor from "../fields/RichTextEditor";
import MultipleFileUpload from "../fields/MultipleFileUpload";
import DataTable from "../ui/table";

import ResponseDetailsModal from "./ResponseDetailsModal";
import Button from "../fields/Button";
import AddEstimation from "../estimation/AddEstimation";
import RenderFiles from "../ui/RenderFiles";
import QuotationRaise from "../connectionDesigner/QuotationRaise";
import { Trash2, X } from "lucide-react";
import { useDispatch } from "react-redux";
import { deleteRFQ } from "../../store/rfqSlice";
import { toast } from "react-toastify";
import EditRFQByID from "./EditRFQByID";
import ConnectionDesignerQuotaByID from "../connectionDesigner/ConnectionDesignerQuotaByID";
import { truncateWords } from "../../utils/stringUtils";
import GetEstimationByID from "../estimation/GetEstimationByID";

const isTrue = (val) => val === true || val === "true" || val === 1;

const GetRFQByID = ({ id, onClose }) => {
    const [rfq, setRfq] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [selectedCDQuota, setSelectedCDQuota] = useState(null);
    const [showEstimationModal, setShowEstimationModal] = useState(false);
    const [showEstimationDetails, setShowEstimationDetails] = useState(false);
    const [showCDQuotationModal, setShowCDQuotationModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);

    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState("");
    const [statusReason, setStatusReason] = useState("");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [activeTab, setActiveTab] = useState("responses");
    const [followUpDescription, setFollowUpDescription] = useState("");
    const [followUpFiles, setFollowUpFiles] = useState([]);
    const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);

    const dispatch = useDispatch();
    const fetchRfq = async () => {
        try {
            setLoading(true);
            const response = await Service.GetRFQbyId(id);
            setRfq(response.data || null);
        } catch {
            setError("Failed to load RFQ");
        } finally {
            setLoading(false);
        }
    };

    const handleCDQuotationModal = () => {
        setShowCDQuotationModal(true);
    };
    const handleCDQuotationModalClose = () => {
        setShowCDQuotationModal(false);
    };

    useEffect(() => {
        if (id) {
            fetchRfq();
        } else {
            setLoading(false);
            setError("No RFQ ID provided");
        }
    }, [id]);

    // Sync selected response for real-time updates in modal
    useEffect(() => {
        if (selectedResponse && rfq?.responses) {
            const updated = rfq.responses.find(r => r.id === selectedResponse.id);
            if (updated) setSelectedResponse(updated);
        }
    }, [rfq?.responses]);

    const handleDelete = async () => {
        console.log(
            "handleDelete called with text:",
            deleteConfirmText,
            "and ID:",
            id,
        );
        if (deleteConfirmText !== "DELETE") {
            console.log("Confirmation text mismatch");
            return;
        }

        try {
            setIsDeleting(true);
            console.log("Calling Service.DeleteRFQById...");
            const res = await Service.DeleteRFQById(id);
            console.log("Service.DeleteRFQById response:", res);
            dispatch(deleteRFQ(id));
            toast.success("RFQ deleted successfully");
            // Redirect or close view - assuming we want to close/go back
            // Since this is a detail view, we might need a way to tell the parent to refresh or close
            // For now, let's just show success and maybe the parent handles the state sync via Redux
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete RFQ");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteConfirmText("");
        }
    };

    const handleStatusUpdate = async () => {
        if (!newStatus) {
            toast.error("Please select a status");
            return;
        }
        if (!statusReason) {
            toast.error("Please provide a reason");
            return;
        }

        try {
            setIsUpdatingStatus(true);
            const payload = {
                wbtStatus: newStatus,
                reason: statusReason,
            };
            const fabricatorName = rfq?.fabricator?.fabName || rfq?.sender?.fabricator?.fabName || rfq?.fabricatorName || "";
            const rfqProjectName = rfq?.projectName || "";
            await Service.UpdateRFQById(id, payload, fabricatorName, rfqProjectName);
            toast.success("RFQ status updated successfully");
            setShowStatusModal(false);
            setNewStatus("");
            setStatusReason("");
            fetchRfq(); // Refresh data
        } catch (err) {
            console.error("Status update failed:", err);
            toast.error("Failed to update RFQ status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };
    const handleFollowUpSubmit = async (e) => {
        e.preventDefault();
        if (!followUpDescription.trim()) {
            toast.error("Please enter a message");
            return;
        }

        try {
            setIsSubmittingFollowUp(true);
            const formData = new FormData();
            formData.append("description", followUpDescription);
            if (followUpFiles.length > 0) {
                followUpFiles.forEach((file) => {
                    formData.append("files", file);
                });
            }

            const fabricatorName = rfq?.fabricator?.fabName || rfq?.sender?.fabricator?.fabName || rfq?.fabricatorName || "";
            const rfqProjectName = rfq?.projectName || "";
            await Service.addRFQFollowups(formData, id, fabricatorName, rfqProjectName);
            toast.success("Follow-up added successfully");
            setFollowUpDescription("");
            setFollowUpFiles([]);
            setShowFollowUpForm(false);
            fetchRfq(); // Refresh data
        } catch (err) {
            console.error("Follow-up submission failed:", err);
            toast.error("Failed to add follow-up");
        } finally {
            setIsSubmittingFollowUp(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border flex flex-col items-center justify-center border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-sm mx-auto h-[200px] relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <p className="text-gray-700 font-bold uppercase tracking-widest text-xs">Synchronizing details...</p>
                </div>
            </div>
        );
    }

    if (error || !rfq) {
        return (
            <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl border flex flex-col items-center justify-center border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-sm mx-auto h-[200px] relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    <AlertCircle className="w-6 h-6 mb-2 text-red-600" />
                    <p className="text-red-600">{error || "RFQ not found"}</p>
                </div>
            </div>
        );
    }

    const userRole = sessionStorage.getItem("userRole");

    const responseColumns = [
        {
            accessorKey: "createdByRole",
            header: "From",
            cell: ({ row }) => {
                const user = row.original.user;
                const displayName = user
                    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username
                    : row.original.createdByRole === "CLIENT"
                    ? "Client"
                    : "WBT Team";
                return (
                    <span className="font-bold text-black text-sm">
                        {displayName}
                    </span>
                );
            }
        },
        {
            accessorKey: "description",
            header: "Message",
            cell: ({ row }) => {
                const plainText = truncateWords(row.original.description, 20);
                return (
                    <div className="flex flex-col max-w-[200px]">
                        <p className="truncate text-sm font-bold text-black">{plainText}</p>
                        <span className="text-xs text-black font-bold uppercase tracking-wider">
                            {row.original.files?.length || 0} Attachments
                        </span>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => (
                <span className="text-black text-xs font-bold uppercase tracking-widest leading-none">
                    {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short'
                    })}
                    {" : "}
                    <span className="text-xs">
                        {new Date(row.original.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => (
                <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${row.original.status === "OPEN"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                        }`}
                >
                    {row.original.status}
                </span>
            ),
        },
    ];

    const cdQuotasColumns = [
        {
            accessorKey: "serialNo",
            header: "Serial No",
            cell: ({ row }) => <span className="font-bold text-gray-900 text-sm">{row.original.serialNo}</span>,
        },
        {
            accessorKey: "bidprice",
            header: "Bid Price",
            cell: ({ row }) => <span className="font-bold text-gray-700 text-sm">${row.original.bidprice || "0"}</span>,
        },
        {
            accessorKey: "estimatedHours",
            header: "Est. Hours",
            cell: ({ row }) => <span className="font-bold text-gray-700 text-sm">{row.original.estimatedHours || "0"}</span>,
        },
        {
            accessorKey: "weeks",
            header: "Weeks",
            cell: ({ row }) => <span className="font-bold text-gray-700 text-sm">{row.original.weeks || "0"}</span>,
        },
        {
            accessorKey: "createdAt",
            header: "Created",
            cell: ({ row }) => (
                <span className="text-gray-800 text-xs font-bold uppercase tracking-widest leading-none">
                    {new Date(row.original.createdAt).toLocaleDateString("en-IN", {
                        day: '2-digit',
                        month: 'short'
                    })}
                </span>
            ),
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const isApproved = row.original.approvalStatus;
                return (
                    <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${isApproved ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                        {isApproved ? "Approved" : "Pending"}
                    </span>
                );
            },
        },
    ];

    /* ---------------- TABLE STATE ---------------- */
    // Removed redundant useDataTable hook

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 font-roboto text-sm">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[95vw] mx-auto flex flex-col h-[95vh]">
                {/* Header */}
                <div className="flex-none p-4 sm:p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3 sm:gap-5">
                        <h3 className="text-lg sm:text-2xl font-bold text-black uppercase tracking-tight break-words overflow-hidden max-w-[280px] sm:max-w-xl">
                            {rfq?.projectName}
                        </h3>
                        <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border border-black shrink-0 ${rfq?.status === "RECEIVED"
                                ? "bg-orange-100 text-black"
                                : "bg-green-100 text-black"
                                }`}
                        >
                            {rfq?.status}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* EDIT RFQ */}
                        {userRole !== "CLIENT" && (
                            <>
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex-1 sm:flex-none px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
                                >
                                    Edit
                                </button>

                                <button
                                    onClick={() => setShowStatusModal(true)}
                                    className="flex-1 sm:flex-none px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm active:scale-95"
                                >
                                    Status
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                        >
                            Close
                        </button>

                        {/* DELETE RFQ */}
                        {/* <Button
                  type="button"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1 text-white rounded-md transition text-sm"
                >
                  Delete
                </Button> */}
                    </div>

                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
                      {/* ---------------- RIGHT COLUMN — RESPONSES & CD QUOTAS ---------------- */}
                      {userRole !== "ESTIMATOR" && userRole !== "ESTIMATION_HEAD" && (
                        <div className="bg-gray-100 p-4 sm:p-8 rounded-3xl border border-black shadow-sm space-y-6 sm:space-y-8 flex flex-col min-h-0">
                            {/* Header + Add Response Button */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-300 pb-4">
                                <div className="flex flex-wrap gap-3 items-center">
                                    <button
                                        onClick={() => setActiveTab("responses")}
                                        className={`px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm transition-all ${activeTab === "responses"
                                            ? "bg-green-50 text-black border-green-700/80"
                                            : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
                                            }`}
                                    >
                                        Responses
                                    </button>
                                    <button
                                        onClick={() => setActiveTab("cdQuotas")}
                                        className={`px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm transition-all ${activeTab === "cdQuotas"
                                            ? "bg-green-50 text-black border-green-700/80"
                                            : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
                                            }`}
                                    >
                                        CD Quotes
                                    </button>
                                    {(userRole === "ESTIMATOR" || userRole === "ESTIMATION_HEAD" || userRole === "ADMIN" || userRole === "OPERATION_EXECUTIVE" || userRole === "DEPUTY_MANAGER") && (
                                        <button
                                            onClick={() => setActiveTab("cdSent")}
                                            className={`px-6 py-1.5 border-2 rounded-lg font-bold text-sm uppercase tracking-tight shadow-sm transition-all ${activeTab === "cdSent"
                                                ? "bg-green-50 text-black border-green-700/80"
                                                : "bg-white text-gray-500 border-gray-300 hover:bg-green-50/40 hover:border-green-700/30 hover:text-black"
                                                }`}
                                        >
                                            Sent to CD
                                        </button>
                                    )}
                                </div>

                                {activeTab === "responses" && (userRole === "ADMIN" ||
                                    userRole === "DEPUTY_MANAGER" ||
                                    userRole === "OPERATION_EXECUTIVE" ||
                                    userRole === "ESTIMATION_HEAD") && (
                                        <button
                                            onClick={() => setShowResponseModal(true)}
                                            className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm whitespace-nowrap"
                                        >
                                            + Add Response
                                        </button>
                                    )}
                            </div>

                            <div className="flex-1 overflow-auto">
                                {activeTab === "responses" && (
                                    <>
                                        {showResponseModal && (
                                            <ResponseModal
                                                rfqId={id}
                                                onClose={() => setShowResponseModal(false)}
                                                onSuccess={fetchRfq}
                                            />
                                        )}

                                        {/* ---- RESPONSE TABLE ---- */}
                                        {rfq?.responses?.length ? (
                                            <DataTable
                                                columns={responseColumns}
                                                data={rfq.responses}
                                                onRowClick={(row) => setSelectedResponse(row)}
                                            />
                                        ) : (
                                            <p className="text-black italic font-bold p-4 text-center">No responses yet.</p>
                                        )}
                                    </>
                                )}

                                {activeTab === "cdQuotas" && (
                                    <>
                                        {/* ---- CDQUOTAS TABLE ---- */}
                                        {rfq?.CDQuotas?.length ? (
                                            <DataTable
                                                columns={cdQuotasColumns}
                                                data={rfq.CDQuotas}
                                                onRowClick={(row) => setSelectedCDQuota(row)}
                                            />
                                        ) : (
                                            <p className="text-black italic font-bold p-4 text-center">No CD Quotas available.</p>
                                        )}
                                    </>
                                )}

                                {activeTab === "cdSent" && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-black" />
                                                <h4 className="text-sm font-bold text-black uppercase tracking-wider">Recipients</h4>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {rfq?.connectionDesignerRFQ?.length ? (
                                                    rfq.connectionDesignerRFQ.map((cd) => (
                                                        <div key={cd.id} className="px-3 py-1.5 bg-white border border-black rounded-xl text-sm font-bold text-black shadow-sm">
                                                            {cd.name}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p className="text-sm text-black italic">No recipients assigned</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <Layout size={16} className="text-black" />
                                                <h4 className="text-sm font-bold text-black uppercase tracking-wider">Sent Package Description</h4>
                                            </div>
                                            <div 
                                                className="bg-white p-5 rounded-2xl border border-black prose prose-sm max-w-none text-sm font-medium text-black"
                                                dangerouslySetInnerHTML={{ __html: rfq?.CDDescription || "No description provided" }}
                                            />
                                        </div>

                                        <div className="space-y-4 pt-4 border-t border-gray-200">
                                            <div className="flex items-center gap-2">
                                                <Paperclip size={16} className="text-black" />
                                                <h4 className="text-sm font-bold text-black uppercase tracking-wider">Sent Attachments</h4>
                                            </div>
                                            <RenderFiles
                                                files={rfq?.CDAttachments || []}
                                                table="rFQ"
                                                parentId={rfq?.id}
                                                formatDate={(date) => new Date(date).toLocaleDateString()}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                      )}
                        {/* ---------------- LEFT COLUMN — RFQ DETAILS ---------------- */}
                        <div className="bg-gray-100 p-4 sm:p-8 rounded-3xl border border-black shadow-sm space-y-6 sm:space-y-8">


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Info label="Subject" value={rfq?.subject || ""} />
                                <Info label="Project Number" value={rfq?.projectNumber || ""} />
                                <Info label="Status" value={rfq?.status || ""} />
                                <Info label="Tools" value={rfq?.tools || "N/A"} />
                                <Info
                                    label="Due Date"
                                    value={
                                        rfq?.estimationDate
                                            ? new Date(rfq.estimationDate).toLocaleDateString()
                                            : "N/A"
                                    }
                                />
                                {userRole !== "ESTIMATOR" && userRole !== "ESTIMATION_HEAD" && (
                                    <Info label="Bid Amount (USD)" value={rfq?.bidPrice ?? "—"} />
                                )}
                                {(() => {
                                    const approvedQuota = rfq?.CDQuotas?.find(q => q.approvalStatus === true);
                                    if (approvedQuota) {
                                        const cdName = rfq?.connectionDesignerRFQ?.find(cd => cd.id === approvedQuota.connectionDesignerId)?.name;
                                        return <Info label="Connection Designer" value={cdName || "N/A"} />;
                                    }
                                    return null;
                                })()}
                            </div>
                            {/* Description */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowDescription((prev) => !prev)}
                                    className="text-sm font-bold text-black uppercase tracking-wider hover:underline transition-colors flex items-center gap-1"
                                >
                                    {showDescription ? 'Hide Description' : 'Show Description'}
                                </button>
                                {showDescription && (
                                    <div
                                        className="text-black bg-white p-4 rounded-xl border border-black prose prose-sm max-w-none text-sm font-medium break-words overflow-hidden"
                                        dangerouslySetInnerHTML={{
                                            __html: rfq?.description || "No description provided",
                                        }}
                                    />
                                )}
                            </div>

                            {/* ---------------- FOLLOW-UPS SECTION ---------------- */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-wider">
                                        <MessageSquare className="w-4 h-4" /> RFQ Follow-ups
                                    </h4>
                                    <button
                                        onClick={() => setShowFollowUpForm(!showFollowUpForm)}
                                        className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                                    >
                                        {showFollowUpForm ? "Cancel" : "+ Add Follow-up"}
                                    </button>
                                </div>

                                {/* Follow-up Form */}
                                {showFollowUpForm && (
                                    <form
                                        onSubmit={handleFollowUpSubmit}
                                        className="bg-white p-4 rounded-2xl border border-black shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200"
                                    >
                                        <RichTextEditor
                                            value={followUpDescription}
                                            onChange={setFollowUpDescription}
                                            placeholder="Type your follow-up message..."
                                        />
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-black uppercase tracking-widest">
                                                Attachments
                                            </label>
                                            <MultipleFileUpload
                                                onFilesChange={setFollowUpFiles}
                                                initialFiles={followUpFiles}
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={isSubmittingFollowUp}
                                                className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {isSubmittingFollowUp ? (
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                ) : (
                                                    <Send className="w-3 h-3" />
                                                )}
                                                {isSubmittingFollowUp ? "Sending..." : "Post Follow-up"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Follow-ups List */}
                                <div className="space-y-3">
                                    {rfq?.followUps && rfq.followUps.length > 0 ? (
                                        rfq.followUps.map((fu, idx) => (
                                            <div
                                                key={fu.id || idx}
                                                className="bg-white p-3 sm:p-4 rounded-2xl border border-black shadow-sm space-y-3"
                                            >
                                                <div className="flex items-center justify-between border-b border-black/5 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-100 border border-black flex items-center justify-center">
                                                            <User className="w-3 h-3 text-black" />
                                                        </div>
                                                        <span className="text-xs font-bold text-black uppercase tracking-wider">
                                                            {fu.createdByRole === "CLIENT"
                                                                ? rfq?.sender?.fabricator?.fabName || "Client"
                                                                : fu.user
                                                                ? `${fu.user.firstName || ""} ${fu.user.lastName || ""}`.trim() || fu.user.username
                                                                : "WBT Team"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(fu.createdAt).toLocaleString("en-IN", {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>

                                                <div
                                                    className="text-xs text-black leading-relaxed prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: fu.description }}
                                                />

                                                {fu.files && fu.files.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 pt-2 border-t border-black/5">
                                                        {fu.files.map((file, fIdx) => (
                                                            <button
                                                                key={file.id || fIdx}
                                                                onClick={async () => {
                                                                    try {
                                                                        const res = await Service.viewRfqFile(id, file.id);
                                                                        if (res) {
                                                                            const url = URL.createObjectURL(new Blob([res]));
                                                                            const link = document.createElement('a');
                                                                            link.href = url;
                                                                            link.setAttribute('download', file.fileName || 'attachment');
                                                                            document.body.appendChild(link);
                                                                            link.click();
                                                                            link.parentNode.removeChild(link);
                                                                        }
                                                                    } catch (err) {
                                                                        toast.error("Failed to download file");
                                                                    }
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-1 bg-gray-50 border border-black rounded-full hover:bg-gray-100 transition-all group"
                                                            >
                                                                <Paperclip className="w-3 h-3 text-black" />
                                                                <span className="text-xs font-bold text-black uppercase tracking-wider truncate max-w-[150px]">
                                                                    {file.originalName || file.fileName || "File"}
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center bg-gray-50 rounded-2xl border-2 border-dashed border-black">
                                            <p className="text-sm font-bold text-black uppercase tracking-[0.2em]">
                                                No follow-ups recorded yet
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Scopes */}
                            <div className="space-y-4">
                                <ScopeList 
                                    title="Connection Design Scope" 
                                    icon={<Settings className="w-4 h-4" />}
                                    items={[
                                        { label: "Connection Design", value: rfq?.connectionDesign },
                                        { label: "Misc Design", value: rfq?.miscDesign },
                                        { label: "Customer Design", value: rfq?.customerDesign },
                                        { 
                                            label: !isTrue(rfq?.customerDesign) && rfq?.sender?.fabricator?.fabName
                                                ? `Connection design by ${rfq.sender.fabricator.fabName}`
                                                : "Connection Design by WBT",
                                            value: !isTrue(rfq?.customerDesign) && (isTrue(rfq?.connectionDesign) || isTrue(rfq?.miscDesign))
                                        }
                                    ]} 
                                />

                                <ScopeList 
                                    title="Detailing Scope" 
                                    icon={<Layout className="w-4 h-4" />}
                                    items={[
                                        { label: "Detailing Main", value: rfq?.detailingMain },
                                        { label: "Detailing Misc", value: rfq?.detailingMisc }
                                    ]} 
                                />

                                <ScopeList 
                                    title="Material Take-off" 
                                    icon={<Layout className="w-4 h-4" />}
                                    items={[
                                        { label: "MTO - Manual", value: rfq?.MTOManual },
                                        { label: "MTO - Stick Model", value: isTrue(rfq?.MTOStickModel) || isTrue(rfq?.mtoStickModelEnabled) }
                                    ]} 
                                />

                                {(rfq?.MTOValue || rfq?.MTOStickModel || rfq?.MTOManualModel) && (
                                    <div className="p-4 bg-[#6bbd45]/5 rounded-xl border border-[#6bbd45]/20 overflow-hidden">
                                        <div 
                                            className="prose prose-sm max-w-none text-xs text-black font-bold leading-relaxed break-words"
                                            dangerouslySetInnerHTML={{ __html: rfq?.MTOValue || rfq?.MTOStickModel || rfq?.MTOManualModel }}
                                        />
                                    </div>
                                )}
                            </div>


                            {/* Files */}
                            <RenderFiles
                                files={rfq?.files || []}
                                table="rFQ"
                                parentId={rfq?.id}
                                formatDate={(date) => new Date(date).toLocaleDateString()}
                            />
                            {userRole !== "CLIENT" && (
                                <div className="flex flex-col gap-3 pt-2">
                                    {rfq?.estimations && rfq.estimations.length > 0 ? (
                                        <button
                                            onClick={() => setShowEstimationDetails(true)}
                                            className="w-full px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center"
                                        >
                                            View Estimation Details
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowEstimationModal(true)}
                                            className="w-full px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center"
                                        >
                                            Raise For Estimation
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleCDQuotationModal()}
                                        className="w-full px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-lg hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm text-center"
                                    >
                                        Raise for Connection Designer Quotation
                                    </button>
                                </div>
                            )}
                        </div>

                      
                    </div>
                </div>
                {showCDQuotationModal && (
                    <QuotationRaise
                        rfqId={id}
                        onClose={() => handleCDQuotationModalClose()}
                        onSuccess={fetchRfq} // refresh after submit
                    />
                )}

                {selectedResponse && (
                    <ResponseDetailsModal
                        response={selectedResponse}
                        onClose={() => setSelectedResponse(null)}
                        onSuccess={fetchRfq}
                    />
                )}

                {selectedCDQuota && (
                    <ConnectionDesignerQuotaByID
                        id={selectedCDQuota.id}
                        onClose={() => setSelectedCDQuota(null)}
                    />
                )}

                {showEstimationDetails && rfq?.estimations?.[0]?.id && (
                    <GetEstimationByID
                        id={rfq.estimations[0].id}
                        onClose={() => setShowEstimationDetails(false)}
                    />
                )}

                {/* Estimation Modal */}
                {showEstimationModal && (
                    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
                            <AddEstimation
                                initialRfqId={id}
                                onSuccess={() => {
                                    setShowEstimationModal(false);
                                    // Optionally refresh RFQ or show success message
                                }}
                                onClose={() => setShowEstimationModal(false)}
                            />
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl  text-red-600 flex items-center gap-2">
                                    <Trash2 size={24} /> Delete RFQ
                                </h3>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 bg-red-50 border border-red-600 text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
                                >
                                    Close
                                </button>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete this RFQ? This action cannot be
                                undone.
                                <br />
                                <span className="font-semibold text-sm mt-2 block">
                                    Please type <span className="text-red-600">DELETE</span> to
                                    confirm:
                                </span>
                            </p>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE here"
                                className="w-full px-4 py-2 border rounded-lg mb-6 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleteConfirmText !== "DELETE" || isDeleting}
                                    className={`flex-1 ${deleteConfirmText === "DELETE"
                                        ? "bg-red-600 hover:bg-red-700"
                                        : "bg-red-300 cursor-not-allowed"
                                        } text-white`}
                                >
                                    {isDeleting ? "Deleting..." : "Confirm Delete"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Change Modal */}
                {showStatusModal && (
                    <div className="fixed inset-0 z-[10002] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl  text-blue-600 flex items-center gap-2">
                                    Change RFQ Status
                                </h3>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    className="px-4 py-2 bg-red-50 border border-red-600 text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all"
                                    aria-label="Close"
                                >
                                    Close
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        New Status
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    >
                                        <option value="">Select Status</option>
                                        <option value="OPEN">OPEN</option>
                                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                                        <option value="CLOSED">CLOSED</option>
                                        <option value="AWARDED">AWARDED</option>
                                        <option value="RE_APPROVED">RE_APPROVED</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Reason for Change
                                    </label>
                                    <textarea
                                        value={statusReason}
                                        onChange={(e) => setStatusReason(e.target.value)}
                                        placeholder="Enter reason..."
                                        rows={3}
                                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <Button
                                    onClick={() => setShowStatusModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdatingStatus}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit RFQ Modal */}
                {showEditModal && (
                    <EditRFQByID
                        id={id}
                        onSuccess={() => {
                            setShowEditModal(false);
                            fetchRfq();
                        }}
                        onCancel={() => setShowEditModal(false)}
                    />
                )}
            </div>
        </div>
    );
};

const Info = ({ label, value }) => (
    <div className="flex justify-between items-center gap-4 py-2 border-b border-black/5 last:border-0">
        <p className="text-black text-sm font-bold uppercase tracking-wider">
            {label}:
        </p>
        <p className="text-black text-sm font-bold uppercase tracking-tight text-right">{value}</p>
    </div>
);

const ScopeList = ({ title, icon, items, className = "" }) => {
    const activeItems = items.filter(item => isTrue(item.value));
    
    if (activeItems.length === 0) return null;

    return (
        <div className={`p-4 bg-white rounded-2xl border border-black shadow-sm space-y-4 animate-in fade-in zoom-in duration-200 ${className}`}>
            <h4 className="text-sm font-bold text-black flex items-center gap-2 uppercase tracking-wider">
                {icon} {title}
            </h4>
            <div className="flex flex-wrap gap-2">
                {activeItems.map((item, idx) => (
                    <Scope key={idx} label={item.label} enabled={true} />
                ))}
            </div>
        </div>
    );
};

const Scope = ({ label, enabled }) => (
    <div
        className={`px-4 py-1.5 rounded-full border border-black text-xs font-bold uppercase tracking-wider shadow-sm transition-all ${enabled
            ? "bg-green-100 text-black"
            : "bg-gray-100 text-black/40"
            }`}
    >
        {label}
    </div>
);

export default GetRFQByID;
