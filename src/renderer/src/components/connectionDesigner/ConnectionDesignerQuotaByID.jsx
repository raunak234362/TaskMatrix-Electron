import React, { useEffect, useState } from "react";
import { Loader2, AlertCircle, X } from "lucide-react";
import Service from "../../api/Service";
import RenderFiles from "../ui/RenderFiles";
import { toast } from "react-toastify";

const ConnectionDesignerQuotaByID = ({ id, onClose }) => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApproving, setIsApproving] = useState(false);

    const userRole = sessionStorage.getItem("userRole");
    const canApprove = ["DEPUTY_MANAGER", "OPERATION_EXECUTIVE", "ADMIN", "DEPT_MANAGER"].includes(userRole);

    const fetchQuota = async () => {
        try {
            setLoading(true);
            const response = await Service.GetConnectionDesignerQuotaByID(id);
            console.log("Quota response:", response);
            // Sometimes backend wraps in { data: ... }
            setQuota(response?.data ? response.data : response);
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

    const handleApprove = async () => {
        try {
            setIsApproving(true);
            await Service.ConnectionDesignerQuotaApproveByID(id);
            toast.success("Quota approved successfully");
            fetchQuota(); // Refresh data to show approved status
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
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
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
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    >
                        <X className="w-6 h-6" />
                    </button>
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
                        className="px-6 py-2 bg-white border-2 border-black text-black font-black uppercase tracking-widest rounded-lg hover:bg-gray-100 transition-all text-sm shadow-sm hover:shadow-md active:scale-95"
                    >
                        Close
                    </button>
                </div>
            </div>
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
