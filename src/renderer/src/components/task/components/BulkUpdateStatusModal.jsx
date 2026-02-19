import React, { useState } from "react";
import { X, CheckCircle2, AlertCircle, Clock, Play, Pause } from "lucide-react";
import { toast } from "react-toastify";
import Service from "../../../api/Service";
import { Button } from "../../ui/button";

const BulkUpdateStatusModal = ({ selectedIds, onClose, refresh }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);

    const statusOptions = [
        { label: "Assigned", value: "ASSIGNED", icon: <Clock className="w-4 h-4" /> },
        { label: "In Progress", value: "IN_PROGRESS", icon: <Play className="w-4 h-4" /> },
        { label: "On Break", value: "BREAK", icon: <Pause className="w-4 h-4" /> },
        { label: "Completed", value: "COMPLETED", icon: <CheckCircle2 className="w-4 h-4" /> },
        { label: "Pending", value: "PENDING", icon: <AlertCircle className="w-4 h-4" /> },
        { label: "Absent", value: "ABSENT", icon: <AlertCircle className="w-4 h-4" /> },
        { label: "Wrong Allocation", value: "WRONG_ALLOCATION", icon: <AlertCircle className="w-4 h-4" /> },
        { label: "Rework", value: "REWORK", icon: <AlertCircle className="w-4 h-4" /> },
    ];

    const handleBulkUpdate = async (newStatus) => {
        if (!selectedIds || selectedIds.length === 0) return;

        setIsSubmitting(true);
        setProgress(0);
        let successCount = 0;
        let failCount = 0;

        try {
            // Process updates in parallel but track individual results
            const updatePromises = selectedIds.map(async (id, index) => {
                try {
                    await Service.UpdateTaskById(id, { status: newStatus });
                    successCount++;
                } catch (error) {
                    console.error(`Failed to update task ${id}:`, error);
                    failCount++;
                } finally {
                    setProgress(prev => prev + 1);
                }
            });

            await Promise.all(updatePromises);

            if (successCount > 0) {
                toast.success(`Successfully updated ${successCount} tasks to ${newStatus}`);
            }
            if (failCount > 0) {
                toast.error(`Failed to update ${failCount} tasks`);
            }

            refresh?.();
            onClose();
        } catch (error) {
            console.error("Critical error during bulk update:", error);
            toast.error("An unexpected error occurred during bulk update");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-transparent dark:border-slate-800">
                <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                        Update Status ({selectedIds.length} Tasks)
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                    </button>
                </div>

                <div className="p-6">
                    {isSubmitting ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mb-4">
                                <div className="bg-green-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${(progress / selectedIds.length) * 100}%` }}></div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 animate-pulse">Updating tasks... {progress}/{selectedIds.length}</p>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 font-medium uppercase tracking-wider">Select New Status</p>
                            <div className="grid grid-cols-1 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                {statusOptions.map((option) => (
                                    <button
                                        key={option.value}
                                        disabled={isSubmitting}
                                        onClick={() => handleBulkUpdate(option.value)}
                                        className="flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all duration-200 border-slate-100 dark:border-slate-700 hover:border-green-200 dark:hover:border-green-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                                                {option.icon}
                                            </div>
                                            <span className="">{option.label}</span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 px-6 py-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BulkUpdateStatusModal;
