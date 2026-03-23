import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import MultipleFileUpload from "../../fields/MultipleFileUpload";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import RichTextEditor from "../../fields/RichTextEditor";


const NoteResponseModal = ({
    noteId,
    onClose,
    onSuccess,
}) => {
    const { handleSubmit, control, reset } =
        useForm();

    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const userId = sessionStorage.getItem("userId") || "";

            const formData = new FormData();
            formData.append("content", data.content);
            formData.append("userId", userId);

            if (data.parentResponseId) {
                formData.append("parentResponseId", data.parentResponseId);
            }

            if (files.length > 0) {
                files.forEach((file) => formData.append("files", file));
            }

            await Service.AddTeamMeetingResponse(noteId, formData);
            toast.success("Response added successfully!");
            reset();
            setFiles([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Note response submission failed:", err);
            toast.error("Failed to add response");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white shadow-lg rounded-xl w-full max-w-4xl relative flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-white rounded-t-xl z-10">
                    <h2 className="text-xl font-bold text-black uppercase tracking-tight">Add Response</h2>
                    <Button
                        onClick={onClose}
                        className="text-black border border-red-600 bg-red-50 hover:text-red-500 hover:bg-red-100 p-1 px-3"
                    >
                        close
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <form
                        id="note-response-form"
                        className="space-y-4"
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                Message *
                            </label>
                            <Controller
                                name="content"
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

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
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
                        className="px-6 py-2 border border-black/20 rounded-lg text-black hover:bg-gray-200 font-bold uppercase tracking-tight"
                    >
                        Cancel
                    </Button>

                    <Button
                        type="submit"
                        form="note-response-form"
                        disabled={loading}
                        className="px-8 py-2 bg-green-200 text-black border border-black rounded-lg hover:bg-green-300 transition disabled:opacity-50 font-bold uppercase tracking-tight"
                    >
                        {loading ? "Submitting..." : "Submit"}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NoteResponseModal;
