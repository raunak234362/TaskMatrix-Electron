import { useEffect, useState } from "react";
import Service from "../../../api/Service";
import { Loader2, X, Calendar, User, Tag } from "lucide-react";
import RenderFiles from "../../common/RenderFiles";

const GetNoteByID = ({ projectId, noteId, onClose }) => {
    const [note, setNote] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (projectId && noteId) {
            fetchNoteDetails();
        }
    }, [projectId, noteId]);

    const fetchNoteDetails = async () => {
        try {
            setLoading(true);
            const response = await Service.GetProjectNoteById(projectId, noteId);
            setNote(response);
        } catch (error) {
            console.error("Error fetching note details:", error);
        } finally {
            setLoading(false);
        }
    };
    console.log(note);
    

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short",
        });
    };

    if (!noteId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        Note Details
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-green-600">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p className="text-sm font-medium">Loading note...</p>
                        </div>
                    ) : note ? (
                        <div className="space-y-6">
                            {/* Meta Info */}
                            <div className="flex flex-wrap gap-4 text-sm text-gray-600 pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Tag className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-gray-700">{note.stage || "No Stage"}</span>
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span>{formatDate(note.createdAt)}</span>
                                </div>

                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <User className="w-4 h-4 text-purple-500" />
                                    <span>
                                        {note.createdBy?.firstName} {note.createdBy?.lastName}
                                    </span>
                                </div>
                            </div>

                            {/* Note Body */}
                            <div>
                                <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">
                                    Content
                                </h3>
                                <div
                                    className="prose prose-sm max-w-none text-gray-700 bg-gray-50/30 p-4 rounded-lg border border-gray-100"
                                    dangerouslySetInnerHTML={{ __html: note.content }}
                                />
                            </div>

                            {/* Attachments */}
                            <RenderFiles
                                files={note.files}
                                table="projectNotes"
                                parentId={note.id}
                            />
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-500">
                            Note not found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Helper for file icon based on extension
export default GetNoteByID;