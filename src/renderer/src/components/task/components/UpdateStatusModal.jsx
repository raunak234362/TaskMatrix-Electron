import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, Clock, Play, Pause, Square } from "lucide-react";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import { Button } from "../../ui/button";

const UpdateStatusModal = ({ taskId, currentStatus, onClose, refresh }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const statusOptions = [
        { label: "Assigned", value: "ASSIGNED", icon: <Clock className="w-4 h-4" /> },
        { label: "In Progress", value: "IN_PROGRESS", icon: <Play className="w-4 h-4" /> },
        { label: "On Break", value: "BREAK", icon: <Pause className="w-4 h-4" /> },
        { label: "Completed", value: "COMPLETED", icon: <CheckCircle2 className="w-4 h-4" /> },
        { label: "Pending", value: "PENDING", icon: <AlertCircle className="w-4 h-4" /> },
        { label: "Rework", value: "REWORK", icon: <AlertCircle className="w-4 h-4" /> },
    ];

    const handleUpdate = async (newStatus) => {
        if (newStatus === currentStatus) return;
        try {
            setIsSubmitting(true);
            await Service.UpdateTaskById(taskId.toString(), { status: newStatus });
            toast.success(`Status updated to ${newStatus}`);
            refresh?.();
            onClose();
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update status");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Update Task Status</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-slate-500 mb-6 font-medium uppercase tracking-wider">Select New Status</p>
                    <div className="grid grid-cols-1 gap-3">
                        {statusOptions.map((option) => (
                            <button
                                key={option.value}
                                disabled={isSubmitting}
                                onClick={() => handleUpdate(option.value)}
                                className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 ${currentStatus === option.value
                                        ? "border-green-600 bg-green-50 text-green-700"
                                        : "border-slate-100 hover:border-green-200 hover:bg-slate-50 text-slate-700 font-medium"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${currentStatus === option.value ? "bg-green-100" : "bg-slate-100"}`}>
                                        {option.icon}
                                    </div>
                                    <span className="font-bold">{option.label}</span>
                                </div>
                                {currentStatus === option.value && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-200">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default UpdateStatusModal;
