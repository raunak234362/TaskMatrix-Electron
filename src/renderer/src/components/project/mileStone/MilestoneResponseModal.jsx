import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import Service from "../../../api/Service";
import { X } from "lucide-react";
import { Button } from "../../ui/button";
import RichTextEditor from "../../fields/RichTextEditor";
import { toast } from "react-toastify";

const MilestoneResponseModal = ({
    milestoneId,
    versionId,
    onClose,
    onSuccess,
}) => {
    const { handleSubmit, control, reset } = useForm();
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const userId = sessionStorage.getItem("userId") || "";
            const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";

            const formData = new FormData();
            formData.append("mileStoneId", milestoneId);
            if (versionId) {
                formData.append("versionId", versionId);
            }
            formData.append("description", data.description);
            formData.append("userRole", userRole);
            formData.append("userId", userId);

            files.forEach((file) => formData.append("files", file));

            await Service.addMilestoneResponse(formData);

            toast.success("Milestone response added successfully");
            reset();
            setFiles([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Error submitting Milestone response:", err);
            toast.error("Failed to add milestone response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
            <div className="bg-white w-full max-w-lg p-6 rounded-xl shadow-lg relative">
                <button onClick={onClose} className="absolute top-3 right-3">
                    <X className="text-gray-700 hover:text-red-500" size={18} />
                </button>

                <h2 className="text-xl font-semibold text-green-700">Add Milestone Response</h2>

                <form className="space-y-4 mt-4" onSubmit={handleSubmit(onSubmit)}>
                    {/* Message */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Response Description *</label>
                        <Controller
                            name="description"
                            control={control}
                            rules={{ required: "Description is required" }}
                            render={({ field }) => (
                                <RichTextEditor
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Write your response..."
                                />
                            )}
                        />
                    </div>

                    {/* File uploader */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Attachments</label>
                        <Controller
                            name="files"
                            control={control}
                            render={() => (
                                <MultipleFileUpload onFilesChange={(f) => setFiles(f)} />
                            )}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <Button onClick={onClose} variant="outline">Cancel</Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="bg-green-600 text-white hover:bg-green-700"
                        >
                            {loading ? "Submitting..." : "Submit Response"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MilestoneResponseModal;
