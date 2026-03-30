import { useEffect, useState } from "react";
import {
    Loader2,
    Calendar,
    Trash2,
    ChevronDown,
    ChevronUp,
    Inbox,
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import AddProjectNote from "./AddProjectNote";
import FileItem from "../../ui/FileItem";
import { openFileSecurely } from "../../../utils/openFileSecurely";
import DataTable from "../../ui/table";
import NoteResponseModal from "./NoteResponseModal";
import NoteResponseDetailsModal from "./NoteResponseDetailsModal";
import { formatDateTime } from "../../../utils/dateUtils";
import { truncateWords } from "../../../utils/stringUtils";

const AllProjectNotes = ({ projectId }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [showResponseModal, setShowResponseModal] = useState(null);
    const [selectedResponse, setSelectedResponse] = useState(null);
    const [activeNoteId, setActiveNoteId] = useState(null);

    const fetchNotes = async () => {
        try {
            setLoading(true);
            const res = await Service.GetTeamMeetingNotesByProjectId(projectId);
            const all = res?.data ?? res ?? [];
            const arr = Array.isArray(all) ? all : [];
            setNotes(arr);
        } catch (err) {
            console.error("Error fetching project notes:", err);
            setNotes([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [projectId]);

    const fetchResponsesForNote = async (noteId) => {
        try {
            const res = await Service.Getallrepliesforanote(noteId);
            const responses = res?.data ?? res ?? [];
            setNotes(prev => prev.map(n => n.id === noteId ? { ...n, responses } : n));
        } catch (err) {
            console.error("Error fetching responses for note:", err, noteId);
        }
    };

    const handleExpandNote = (id) => {
        if (expandedId === id) {
            setExpandedId(null);
        } else {
            setExpandedId(id);
            fetchResponsesForNote(id);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this note?")) return;
        try {
            setDeletingId(id);
            await Service.DeleteTeamMeetingNotes(id);
            toast.success("Note deleted successfully");
            fetchNotes();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete note");
        } finally {
            setDeletingId(null);
        }
    };

    const handleDeleteResponse = async (id, noteId) => {
        if (!window.confirm("Are you sure you want to delete this response?")) return;
        try {
            await Service.DeleteTeamMeetingResponse(id);
            toast.success("Response deleted successfully");
            fetchResponsesForNote(noteId);
        } catch (err) {
            console.error("Delete response failed:", err);
            toast.error("Failed to delete response");
        }
    };


    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-700">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                Loading Project Notes...
            </div>
        );
    }

    const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
    const isAuthorized = [
        "admin",
        "project_manager",
        "deputy_manager",
        "client",
        "client_admin",
        "project_manager_officer",
        "operation_executive",
        "estimation_head",
        "connection_designer_engineer",
        "connection_designer_admin",
    ].includes(userRole);

    if (!isAuthorized) {
        return null;
    }

    const currentUserId = sessionStorage.getItem("userId") || "";

    const filteredNotes = notes.filter((note) => {
        // Admin, internal staff, and Client Admins see everything for the project
        const hasFullAccess = [
            "admin",
            "project_manager",
            "deputy_manager",
            "project_manager_officer",
            "operation_executive",
            "estimation_head",
            "client_admin",
            "client",
            "connection_designer_engineer",
            "connection_designer_admin",
        ].includes(userRole);

        if (hasFullAccess) return true;

        // Users always see their own created notes
        if (note.createdBy?.id === currentUserId) return true;

        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">

                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-green-200 border border-black font-semibold text-black rounded-xl text-[10px] uppercase shadow-xl hover:bg-green-400 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    + Add New Note
                </button>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Inbox className="w-12 h-12 mb-4 text-gray-200" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">
                        No Project Notes Found
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredNotes.map((note) => {
                        const isExpanded = expandedId === note.id;
                        return (
                            <div
                                key={note.id}
                                className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${isExpanded
                                    ? "border-[#6bbd45] shadow-md scale-[1.01]"
                                    : "border-gray-100 hover:border-gray-200 shadow-sm"
                                    }`}
                            >
                                <button
                                    onClick={() => handleExpandNote(note.id)}
                                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/50"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            {note.serialNo && (
                                                <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded tracking-widest whitespace-nowrap uppercase">
                                                    {note.serialNo}
                                                </span>
                                            )}
                                            {note.visibility === "INTERNAL" && (
                                                <span className="text-[9px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded tracking-widest whitespace-nowrap uppercase">
                                                    Internal
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm font-black text-black truncate pr-4 uppercase tracking-tight mb-2">
                                            {note.title || truncateWords(note.content?.replace(/<[^>]*>?/gm, "") || "Untitled Note", 10)}
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {note.createdBy && (
                                                <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                                    {note.createdBy.firstName} {note.createdBy.lastName}
                                                </span>
                                            )}
                                            {note.createdAt && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={10} />
                                                    {new Intl.DateTimeFormat("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    }).format(new Date(note.createdAt))}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(note.id);
                                            }}
                                            disabled={deletingId === note.id}
                                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                            title="Delete note"
                                        >
                                            {deletingId === note.id ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                        {isExpanded ? (
                                            <ChevronUp size={16} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={16} className="text-gray-400" />
                                        )}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="px-5 pb-5 space-y-6 border-t border-gray-100 pt-5 bg-white">
                                        {/* Content */}
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                Observation / Discussion
                                            </p>
                                            <div
                                                className="prose prose-sm max-w-none text-gray-700 bg-gray-50/50 p-4 rounded-xl border border-gray-100 font-medium whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{
                                                    __html: note.content || "No content.",
                                                }}
                                            />
                                        </div>

                                        {/* Files */}
                                        {note.files && note.files.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                                    Attached Intelligence
                                                </p>
                                                <div className="flex flex-wrap gap-2">
                                                    {note.files.map((file) => (
                                                        <FileItem
                                                            key={file.id}
                                                            name={file.originalName || file.fileName || file.id}
                                                            onClick={() =>
                                                                openFileSecurely(
                                                                    "team-meeting-notes",
                                                                    note.id,
                                                                    file.id,
                                                                )
                                                            }
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Responses Section */}
                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-[10px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-[#6bbd45] rounded-full"></span>
                                                    Responses
                                                </h4>
                                                <button
                                                    onClick={() => setShowResponseModal(note.id)}
                                                    className="text-[11px] font-black text-black border border-black uppercase tracking-widest hover:bg-green-200 px-4 py-1.5  rounded-lg"
                                                >
                                                    + Add Response
                                                </button>
                                            </div>

                                            {note.responses && note.responses.length > 0 ? (
                                                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                                    <DataTable
                                                        columns={[
                                                            {
                                                                accessorKey: "content",
                                                                header: "Message",
                                                                cell: ({ row }) => {
                                                                    const plainText = row.original.content?.replace(/<[^>]*>?/gm, "") || "";
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <p className="truncate max-w-[300px] text-xs sm:text-sm font-medium">
                                                                                {plainText}
                                                                            </p>
                                                                        </div>
                                                                    );
                                                                },
                                                            },
                                                            {
                                                                accessorKey: "files",
                                                                header: "Files",
                                                                cell: ({ row }) => {
                                                                    const count = row.original.files?.length ?? 0;
                                                                    return count > 0 ? (
                                                                        <span className="text-black font-medium text-xs">
                                                                            {count} file(s)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-300">—</span>
                                                                    );
                                                                },
                                                            },
                                                            {
                                                                accessorKey: "createdAt",
                                                                header: "Date",
                                                                cell: ({ row }) => (
                                                                    <span className="text-gray-500 text-[10px] sm:text-xs">
                                                                        {formatDateTime(row.original.createdAt)}
                                                                    </span>
                                                                ),
                                                            },
                                                            {
                                                                id: "actions",
                                                                header: "Actions",
                                                                cell: ({ row }) => (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteResponse(row.original.id, note.id);
                                                                        }}
                                                                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                                                                        title="Delete response"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                ),
                                                            },
                                                        ]}
                                                        data={note.responses?.filter(r => !r.parentResponseId) || []}
                                                        detailComponent={({ row }) => {
                                                            const replies = note.responses?.filter(r => r.parentResponseId === row.id) || [];
                                                            if (replies.length === 0) return null;
                                                            return (
                                                                <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 ml-8 mb-4 space-y-4">
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                                        <span className="w-1 h-1 bg-[#6bbd45] rounded-full"></span>
                                                                        Replies ({replies.length})
                                                                    </p>
                                                                    <div className="space-y-3">
                                                                        {replies.map(reply => (
                                                                            <div key={reply.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-[#6bbd45]/20">
                                                                                <div className="flex justify-between items-start mb-1">
                                                                                    <span className="text-[10px] font-bold text-[#6bbd45] uppercase tracking-wider">
                                                                                        {reply.createdBy ? `${reply.createdBy.firstName} ${reply.createdBy.lastName}` : (reply.firstName ? `${reply.firstName} ${reply.lastName}` : "User")}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-[10px] text-gray-400">{formatDateTime(reply.createdAt)}</span>
                                                                                        <button
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleDeleteResponse(reply.id, note.id);
                                                                                            }}
                                                                                            className="p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                                                                                            title="Delete reply"
                                                                                        >
                                                                                            <Trash2 size={10} />
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                                <div
                                                                                    className="text-xs text-gray-700 line-clamp-2"
                                                                                    dangerouslySetInnerHTML={{ __html: reply.content }}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        }}
                                                        onRowClick={(row) => {
                                                            setSelectedResponse(row);
                                                            setActiveNoteId(note.id);
                                                        }}
                                                        pageSizeOptions={[5, 10]}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">No responses recorded</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <AddProjectNote
                            projectId={projectId}
                            onClose={() => setShowAddModal(false)}
                            onSuccess={() => {
                                setShowAddModal(false);
                                fetchNotes();
                            }}
                        />
                    </div>
                </div>
            )}

            {showResponseModal && (
                <NoteResponseModal
                    noteId={showResponseModal}
                    onClose={() => setShowResponseModal(null)}
                    onSuccess={() => {
                        fetchResponsesForNote(showResponseModal);
                    }}
                />
            )}

            {selectedResponse && activeNoteId && (
                <NoteResponseDetailsModal
                    noteId={activeNoteId}
                    response={selectedResponse}
                    onClose={() => {
                        setSelectedResponse(null);
                        setActiveNoteId(null);
                    }}
                    onSuccess={() => {
                        fetchResponsesForNote(activeNoteId);
                    }}
                />
            )}
        </div>
    );
};

export default AllProjectNotes;
