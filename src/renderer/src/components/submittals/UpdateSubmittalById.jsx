import { useState } from "react";
import { X, Check, Loader2, Upload } from "lucide-react";
import Service from "../../api/Service";
import RichTextEditor from "../fields/RichTextEditor";

const UpdateSubmittalById = ({ submittal, onClose, onSuccess }) => {
    const [subject, setSubject] = useState(submittal?.subject || "");
    const [description, setDescription] = useState(
        submittal?.description || submittal?.currentVersion?.description || ""
    );
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!subject.trim()) {
            setError("Subject is required.");
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            const formData = new FormData();
            formData.append("subject", subject.trim());
            formData.append("description", description);
            if (file) {
                formData.append("file", file);
            }

            await Service.updateSubmittalVersionById(submittal.id, formData);

            onSuccess?.();
            onClose();
        } catch (err) {
            console.error("Update submittal failed:", err);
            setError(
                err?.response?.data?.message || "Failed to update submittal. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* ── Header ── */}
                <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
                    <div>
                        <h2 className="text-xl font-black text-black tracking-tight uppercase">
                            Update Submittal
                        </h2>
                        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                            A new version will be created
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-red-50 border border-red-300 text-black font-black text-[10px] uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all flex items-center gap-1.5"
                    >
                        <X className="w-3 h-3" />
                        Close
                    </button>
                </header>

                {/* ── Body ── */}
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

                    {/* Error */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Subject */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter submittal subject..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#6bbd45]/40 focus:border-[#6bbd45] bg-gray-50 transition-all"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                            Description
                        </label>
                        <div className="border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Write the submittal description..."
                            />
                        </div>
                    </div>

                    {/* File Upload (new version) */}
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-black uppercase tracking-[0.15em] ml-1">
                            New Version File <span className="text-gray-400">(Optional)</span>
                        </label>
                        <label className="flex items-center gap-3 w-full px-4 py-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#6bbd45] hover:bg-[#6bbd45]/5 transition-all group">
                            <Upload className="w-5 h-5 text-gray-400 group-hover:text-[#6bbd45] transition-colors shrink-0" />
                            <div className="flex-1 min-w-0">
                                {file ? (
                                    <span className="text-sm font-semibold text-black truncate block">
                                        {file.name}
                                    </span>
                                ) : (
                                    <span className="text-sm text-gray-400">
                                        Click to upload a new version file
                                    </span>
                                )}
                            </div>
                            {file && (
                                <button
                                    type="button"
                                    onClick={(e) => { e.preventDefault(); setFile(null); }}
                                    className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <input
                                type="file"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />
                        </label>
                        {file && (
                            <p className="text-[10px] text-gray-400 ml-1">
                                {(file.size / 1024).toFixed(1)} KB · {file.type || "Unknown type"}
                            </p>
                        )}
                    </div>
                </div>

                {/* ── Footer ── */}
                <footer className="p-6 border-t border-gray-200 bg-white flex justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-8 py-3 bg-gray-50 border border-gray-300 hover:bg-gray-100 text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className={`px-8 py-3 rounded-lg font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-2 ${submitting
                                ? "bg-gray-100 text-black/20 cursor-not-allowed"
                                : "bg-[#6bbd45]/15 hover:bg-[#6bbd45]/30 text-black border border-black active:scale-95"
                            }`}
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Check className="w-4 h-4" />
                                Save Update
                            </>
                        )}
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default UpdateSubmittalById;