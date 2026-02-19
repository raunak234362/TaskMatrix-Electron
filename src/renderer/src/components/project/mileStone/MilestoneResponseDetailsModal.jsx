import { X, CalendarDays, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Button } from "../../ui/button";
import Service from "../../../api/Service";
import RichTextEditor from "../../fields/RichTextEditor";
import RenderFiles from "../../ui/RenderFiles";
import { toast } from "react-toastify";

const STATUS_OPTIONS = [
    { label: "Open", value: "OPEN" },
    { label: "Resolved", value: "RESOLVED" },
    { label: "Closed", value: "CLOSED" },
];

const MilestoneResponseDetailsModal = ({ response, onClose, onSuccess }) => {
    const [replyMode, setReplyMode] = useState(false);
    const [replyMessage, setReplyMessage] = useState("");
    const [replyFiles, setReplyFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState(response.status || "OPEN");
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const userRole = sessionStorage.getItem("userRole")?.toUpperCase() || "";
    const userId = sessionStorage.getItem("userId") || "";

    const canReply = ["ADMIN", "MANAGER", "DEPUTY_MANAGER", "STAFF"].includes(userRole);

    const handleReplySubmit = async () => {
        if (!replyMessage.trim()) {
            toast.error("Reply message cannot be empty");
            return;
        }

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("description", replyMessage);
            formData.append("mileStoneId", response.mileStoneId);
            formData.append("parentResponseId", response.id);
            formData.append("userId", userId);
            formData.append("userRole", userRole.toLowerCase());

            replyFiles.forEach((file) => formData.append("files", file));

            await Service.addMilestoneResponse(formData);
            toast.success("Reply sent successfully");

            setReplyMode(false);
            setReplyMessage("");
            setReplyFiles([]);

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Error submitting Milestone reply:", err);
            toast.error("Failed to send reply");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        try {
            setIsUpdatingStatus(true);
            await Service.UpdateMilestoneResponseStatus(response.id, { status });
            toast.success("Status updated successfully");
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error("Error updating status:", err);
            toast.error("Failed to update status");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
            <div className="bg-white w-full max-w-2xl p-6 rounded-xl space-y-5 relative max-h-[90vh] overflow-y-auto">
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4">
                    <X size={20} className="text-gray-400 hover:text-red-600 transition-colors" />
                </button>

                <h2 className="text-2xl font-bold text-green-700 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Response Details
                </h2>

                {/* Main message */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold text-sm">
                                {response.user?.firstName ? response.user.firstName[0] : "U"}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-900">
                                    {response.user ? `${response.user.firstName} ${response.user.lastName}` : "Unknown User"}
                                </p>
                                <p className="text-[10px] text-gray-500 uppercase font-medium">{response.userRole || "N/A"}</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="flex items-center gap-2">
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="text-xs border rounded-md p-1 bg-white focus:ring-1 focus:ring-green-500 outline-none"
                                >
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <Button
                                    size="sm"
                                    className="bg-blue-600 text-white text-[10px] h-7 px-2"
                                    onClick={handleStatusUpdate}
                                    disabled={isUpdatingStatus || status === response.status}
                                >
                                    {isUpdatingStatus ? "..." : "Update"}
                                </Button>
                            </div>
                            <div className="flex gap-2 items-center text-gray-500 text-xs text-nowrap">
                                <CalendarDays size={14} />
                                {new Date(response.createdAt).toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div
                        className="bg-white p-4 rounded-lg border border-gray-200 prose prose-sm max-w-none text-gray-700 min-h-[100px]"
                        dangerouslySetInnerHTML={{ __html: response.description }}
                    />
                </div>

                <RenderFiles
                    files={response.files || []}
                    table="mileStoneResponse"
                    parentId={response.id}
                />

                {/* Child Responses (Thread) */}
                {response.childResponses?.length > 0 && (
                    <div className="mt-6 space-y-4 border-t pt-6">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-green-600" />
                            Discussion Thread ({response.childResponses.length})
                        </h4>
                        <div className="space-y-4 pl-4 border-l-2 border-green-50">
                            {response.childResponses.map((child) => (
                                <div
                                    key={child.id}
                                    className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-sm shadow-sm"
                                >
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-gray-900">
                                                {child.user ? `${child.user.firstName} ${child.user.lastName}` : "User"}
                                            </span>
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500 uppercase font-medium">
                                                {child.userRole || "N/A"}
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {new Date(child.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    <div
                                        className="text-gray-700 mb-3 prose prose-sm max-w-none bg-white p-3 rounded-lg border border-gray-100"
                                        dangerouslySetInnerHTML={{ __html: child.description }}
                                    />

                                    <RenderFiles
                                        files={child.files || []}
                                        table="mileStoneResponse"
                                        parentId={child.id}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="px-6"
                    >
                        Close
                    </Button>
                    {canReply && !replyMode && (
                        <Button
                            className="bg-green-600 text-white hover:bg-green-700 px-6 shadow-sm"
                            onClick={() => setReplyMode(true)}
                        >
                            Reply
                        </Button>
                    )}
                </div>

                {/* Reply Form */}
                {replyMode && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-300 space-y-4 bg-green-50/30 p-4 rounded-xl border border-green-100">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">
                                Post your reply
                            </label>
                            <RichTextEditor
                                value={replyMessage}
                                onChange={setReplyMessage}
                                placeholder="Type your reply here..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Attachments</label>
                            <input
                                type="file"
                                multiple
                                className="w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 transition-all cursor-pointer"
                                onChange={(e) =>
                                    setReplyFiles(e.target.files ? Array.from(e.target.files) : [])
                                }
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => setReplyMode(false)}
                                className="text-gray-500"
                            >
                                Cancel
                            </Button>
                            <Button
                                className="bg-green-600 text-white hover:bg-green-700 px-6 shadow-md"
                                onClick={handleReplySubmit}
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send Reply"}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MilestoneResponseDetailsModal;
