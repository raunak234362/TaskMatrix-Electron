import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import Service from "../../../api/Service";
import { X } from "lucide-react";
import Button from "../../fields/Button";
import RichTextEditor from "../../fields/RichTextEditor";

const MilestoneResponseModal = ({
    milestoneId,
    mileStoneVersionId,
    onClose,
    onSuccess,
}) => {
    const { register, handleSubmit, control, reset } =
        useForm();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const userId = sessionStorage.getItem("userId") || "";

            const formData = new FormData();
            formData.append("mileStoneId", milestoneId);
            formData.append("description", data.description);
            formData.append("mileStoneVersionId", mileStoneVersionId);
            formData.append("userId", userId);
            formData.append("status", data.status || "ON_TIME");

            if (data.link) formData.append("link", data.link);

            if (files.length > 0) {
                files.forEach((file) => formData.append("files", file));
            }

            await Service.addMilestoneResponse(formData);
            toast.success("Response added successfully!");
            reset();
            setFiles([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Milestone response submission failed:", err);
            toast.error("Failed to add response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white shadow-lg rounded-xl w-full max-w-4xl relative flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white rounded-t-xl z-10">
                    <h2 className="text-xl font-bold text-green-700">Add Milestone Response</h2>
                    <Button
                        onClick={onClose}
                        className="text-gray-700 text-black bg-red-200 hover:bg-red-500 hover:text-white "
                    >
                        close
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form
                        id="milestone-response-form"
                        className="space-y-4"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message *
                            </label>
                            <Controller
                                name="description"
                                control={control}
                                rules={{ required: "Message is required" }}
                                render={({ field }) => (
                                    <RichTextEditor
                                        value={field.value || ""}
                                        onChange={field.onChange}
                                        placeholder="Type your response..."
                                    />
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Status
                                </label>
                                <select
                                    {...register("status")}
                                    className="w-full border rounded-md p-2 bg-white"
                                    defaultValue="ON_TIME"
                                >
                                    <option value="">Select Status</option>
                                    <option value="DELAYED">Delayed</option>
                                    <option value="ON_TIME">On Time</option>
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="CLARIFICATION_REQUIRED">Needs Clarification</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Attach Files
                            </label>
                            <Controller
                                name="files"
                                control={control}
                                render={() => (
                                    <MultipleFileUpload
                                        onFilesChange={(uploadedFiles) => setFiles(uploadedFiles)}
                                    />
                                )}
                            />
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-4">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-400 rounded-lg hover:bg-gray-200"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="milestone-response-form"
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        {loading ? "Submitting..." : "Submit Response"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default MilestoneResponseModal;
