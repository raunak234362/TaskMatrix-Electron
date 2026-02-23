import React, { useState } from "react";
import { X } from "lucide-react";
import { Button } from "../../ui/button";
import { toast } from "react-toastify";
import Service from "../../../api/Service";

const UpdateCompletionPer = ({ milestoneId, onClose, onSuccess }) => {
    const [percentage, setPercentage] = useState(0);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            // Assuming there is an endpoint for this, or using a generic update
            await Service.UpdateCompletionPercentById(milestoneId, {
                completionPercentage: Number(percentage)
            });
            toast.success("Completion percentage updated");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating percentage:", error);
            toast.error("Failed to update percentage");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Update Completion Percentage</h3>
                <button onClick={onClose}>
                    <X size={20} className="text-gray-400 hover:text-gray-600" />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Completion Percentage ({percentage}%)
                    </label>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={percentage}
                        onChange={(e) => setPercentage(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                    />
                    <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button variant="outline" onClick={onClose} type="button">
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        disabled={loading}
                        className="bg-teal-600 text-white hover:bg-teal-700"
                    >
                        {loading ? "Updating..." : "Update Progress"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default UpdateCompletionPer;
