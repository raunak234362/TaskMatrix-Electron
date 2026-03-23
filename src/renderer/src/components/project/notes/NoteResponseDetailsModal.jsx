import React, { useState } from "react";
import { CalendarDays, Trash2 } from "lucide-react";
import { formatDateTime } from "../../../utils/dateUtils";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import RichTextEditor from "../../fields/RichTextEditor";
import RenderFiles from "../../ui/RenderFiles";
import { toast } from "react-toastify";

const NoteResponseDetailsModal = ({
    noteId,
    response,
    onClose,
    onSuccess,
}) => {
    const [replyMode, setReplyMode] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyFiles, setReplyFiles] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReplySubmit = async () => {
        if (!replyMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("content", replyMessage);
            formData.append("parentResponseId", response.id);
            formData.append("userId", sessionStorage.getItem("userId") || "");

            replyFiles.forEach((file) => formData.append("files", file));

            await Service.AddTeamMeetingResponse(noteId, formData);

            toast.success("Reply sent successfully");
            setReplyMode(false);
            setReplyMessage("");
            setReplyFiles([]);
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Reply failed:", err);
            toast.error("Failed to send reply");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this?")) return;
        try {
            setIsSubmitting(true);
            await Service.DeleteTeamMeetingResponse(id);
            toast.success("Deleted successfully");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderThread = (res) => {
        return (
            <div className="ml-4 border-l-2 border-[#6bbd45]/20 pl-4 space-y-4 mt-4">
                {res.childResponses?.map((child) => (
                    <div key={child.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-[#6bbd45] uppercase tracking-wider">
                                {child.createdBy
                                    ? `${child.createdBy.firstName} ${child.createdBy.lastName}`
                                    : (child.firstName ? `${child.firstName} ${child.lastName}` : "User")}
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-400 font-medium">{formatDateTime(child.createdAt)}</span>
                                <button
                                    onClick={() => handleDelete(child.id)}
                                    className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                        <div
                            className="text-sm prose prose-sm max-w-none text-gray-700 font-medium"
                            dangerouslySetInnerHTML={{ __html: child.content }}
                        />

                        {child.files?.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-50">
                                <RenderFiles files={child.files} table="teamMeetingResponse" parentId={child.id} />
                            </div>
                        )}

                        {child.childResponses?.length > 0 && renderThread(child)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white h-[90vh] overflow-y-auto w-full max-w-5xl p-8 rounded-3xl shadow-2xl space-y-6 relative border border-gray-200 flex flex-col">
                <div className="flex justify-between items-center shrink-0">
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                        Response Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-6 py-1.5 bg-red-50 text-black border border-red-600 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                    >
                        Close
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                <CalendarDays size={14} className="text-[#6bbd45]" />
                                {formatDateTime(response.createdAt)}
                            </div>
                            <button
                                onClick={() => handleDelete(response.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase"
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Message</p>
                            <div
                                className="text-gray-800 prose prose-sm max-w-none bg-white p-4 rounded-xl border border-gray-100 shadow-inner font-medium"
                                dangerouslySetInnerHTML={{ __html: response.content }}
                            />
                        </div>

                        {response.files?.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Attachments</p>
                                <RenderFiles
                                    files={response.files}
                                    table="teamMeetingResponse"
                                    parentId={response.id}
                                />
                            </div>
                        )}
                    </div>

                    {replyMode && (
                        <div className="bg-white p-6 rounded-2xl border-2 border-[#6bbd45]/20 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <h3 className="text-lg font-black text-black uppercase tracking-tight border-b border-gray-100 pb-2">
                                Write a Reply
                            </h3>

                            <RichTextEditor
                                value={replyMessage}
                                onChange={setReplyMessage}
                                placeholder="Type your reply..."
                            />

                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Attach Files</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setReplyFiles(Array.from(e.target.files || []))}
                                    className="w-full border rounded-xl p-2.5 text-xs font-bold uppercase bg-gray-50/50"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    onClick={() => setReplyMode(false)}
                                    className="px-6 py-2 bg-gray-50 text-black border border-gray-200 rounded-xl font-bold uppercase tracking-tight hover:bg-gray-100 transition-all text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    className="px-8 py-2 bg-green-200 text-black border border-black rounded-xl font-bold uppercase tracking-tight hover:bg-green-300 transition-all shadow-md text-xs disabled:opacity-50"
                                    onClick={handleReplySubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Sending..." : "Send Reply"}
                                </Button>
                            </div>
                        </div>
                    )}

                    {!replyMode && (
                        <div className="flex justify-end">
                            <Button
                                onClick={() => setReplyMode(true)}
                                className="px-8 py-2 bg-green-200 text-black border border-black rounded-xl font-bold uppercase tracking-tight hover:bg-green-300 transition-all shadow-md text-xs"
                            >
                                Reply
                            </Button>
                        </div>
                    )}

                    {response.childResponses?.length > 0 && (
                        <div className="space-y-4 pt-4">
                            <h3 className="text-lg font-black text-black uppercase tracking-tight border-b border-[#6bbd45]/20 pb-2 flex items-center gap-2">
                                Replies <span className="text-xs bg-[#6bbd45]/10 text-[#6bbd45] px-2 py-0.5 rounded-full">{response.childResponses.length}</span>
                            </h3>
                            {renderThread(response)}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NoteResponseDetailsModal;
