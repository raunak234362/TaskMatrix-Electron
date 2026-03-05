import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { formatDateTime } from "../../../utils/dateUtils";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import RichTextEditor from "../../fields/RichTextEditor";
import RenderFiles from "../../ui/RenderFiles";
import { toast } from "react-toastify";

const MilestoneResponseDetailsModal = ({
    response,
    milestoneId,
    onClose,
    onSuccess,
}) => {
    const [replyMode, setReplyMode] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyFiles, setReplyFiles] = useState([]);
    const [replyStatus, setReplyStatus] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleReplySubmit = async () => {
        if (!replyMessage.trim()) {
            toast.error("Please enter a message");
            return;
        }
        if (!replyStatus) {
            toast.error("Please select a status");
            return;
        }

        try {
            setIsSubmitting(true);
            const formData = new FormData();
            formData.append("description", replyMessage);
            formData.append("parentResponseId", response.id);
            formData.append("mileStoneId", milestoneId);
            formData.append("mileStoneVersionId", response.mileStoneVersionId);
            formData.append("userId", sessionStorage.getItem("userId") || "");
            if (replyStatus) formData.append("status", replyStatus);

            replyFiles.forEach((file) => formData.append("files", file));

            await Service.addMilestoneResponse(formData);

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

    const renderThread = (res) => {
        return (
            <div className="ml-4 border-l-2 border-green-100 pl-4 space-y-4 mt-4">
                {res.childResponses?.map((child) => (
                    <div key={child.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-green-700 uppercase">{child.userRole || "User"}</span>
                            <span className="text-[10px] text-gray-400">{formatDateTime(child.createdAt)}</span>
                        </div>
                        <div
                            className="text-sm prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: child.description }}
                        />

                        {child.files?.length > 0 && (
                            <div className="mt-3">
                                <RenderFiles files={child.files} table="milestoneResponse" parentId={child.id} />
                            </div>
                        )}

                        {child.childResponses?.length > 0 && renderThread(child)}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] backdrop-blur-sm p-4">
            <div className="bg-[#fafffb] h-[90vh] overflow-y-auto w-full max-w-5xl p-8 rounded-3xl shadow-2xl space-y-6 relative border border-green-100/50">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                        Response Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                    >
                        Close
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CalendarDays size={16} className="text-green-600" />
                            {formatDateTime(response.createdAt)}
                        </div>
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${response.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            response.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                            }`}>
                            {response.status}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Message</p>
                        <div
                            className="text-gray-700 prose prose-sm max-w-none bg-gray-50/50 p-4 rounded-xl border border-gray-50"
                            dangerouslySetInnerHTML={{ __html: response.description }}
                        />
                    </div>

                    {response.files?.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Attachments</p>
                            <RenderFiles
                                files={response.files}
                                table="milestoneResponse"
                                parentId={response.id}
                            />
                        </div>
                    )}
                </div>

                {replyMode && (
                    <div className="bg-white p-6 rounded-2xl border-2 border-green-100 shadow-lg space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-lg font-black text-black uppercase tracking-tight">
                            Write a Reply
                        </h3>

                        <RichTextEditor
                            value={replyMessage}
                            onChange={setReplyMessage}
                            placeholder="Type your reply..."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status Update</label>
                                <select
                                    value={replyStatus}
                                    onChange={(e) => setReplyStatus(e.target.value)}
                                    className="w-full border rounded-xl p-2.5 text-sm bg-gray-50"
                                >
                                    <option value="" disabled>Select status...</option>
                                    <option value="DELAYED">Delayed</option>
                                    <option value="ON_TIME">On Time</option>
                                    <option value="NOT_STARTED">Not Started</option>
                                    <option value="CLARIFICATION_REQUIRED">Clarification Required</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Attach Files</label>
                                <input
                                    type="file"
                                    multiple
                                    onChange={(e) => setReplyFiles(Array.from(e.target.files || []))}
                                    className="w-full border rounded-xl p-2 text-sm bg-gray-50"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                onClick={() => setReplyMode(false)}
                                className="px-6 py-2 bg-gray-100 text-black rounded-xl font-bold uppercase tracking-tight hover:bg-gray-200 transition-all text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="px-8 py-2 bg-green-600 text-white rounded-xl font-bold uppercase tracking-tight hover:bg-green-700 transition-all shadow-md text-xs disabled:opacity-50"
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
                            className="px-8 py-2 bg-green-600 text-white rounded-xl font-bold uppercase tracking-tight hover:bg-green-700 transition-all shadow-md text-xs"
                        >
                            Reply
                        </Button>
                    </div>
                )}

                {response.childResponses?.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-black text-black uppercase tracking-tight border-b border-green-100 pb-2 flex items-center gap-2">
                            Replies <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{response.childResponses.length}</span>
                        </h3>
                        {renderThread(response)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MilestoneResponseDetailsModal;
