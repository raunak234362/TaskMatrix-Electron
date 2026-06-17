import { useEffect, useState } from "react";
import {
    Loader2,
    Calendar,
    Trash2,
    ChevronDown,
    ChevronUp,
    Inbox,
    Flag,
    AlertCircle
} from "lucide-react";
import Service from "../../../api/Service";
import { toast } from "react-toastify";
import AddProjectNote from "./AddProjectNote";
import RenderFiles from "../../ui/RenderFiles";
import DataTable from "../../ui/table";
import NoteResponseModal from "./NoteResponseModal";
import NoteResponseDetailsModal from "./NoteResponseDetailsModal";
import { formatDateTime } from "../../../utils/dateUtils";
import { truncateWords } from "../../../utils/stringUtils";

const AllProjectNotes = ({ projectId, project }) => {
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
        "dept_manager",
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
            "dept_manager",
        ].includes(userRole);

        if (hasFullAccess) return true;

        // Users always see their own created notes
        if (note.createdBy?.id === currentUserId) return true;

        return true;
    });

    const getPriorityBadge = (priority) => {
        const p = Number(priority);
        switch (p) {
            case 4: return <span className="bg-gray-100 text-black text-sm font-normal px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-200 flex items-center gap-1"><AlertCircle size={10} className="text-black" />Critical</span>;
            case 3: return <span className="bg-gray-100 text-black text-sm font-normal px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-200">Urgent</span>;
            case 2: return <span className="bg-gray-100 text-black text-sm font-normal px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-200">High</span>;
            case 1: return <span className="bg-gray-100 text-black text-sm font-normal px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-200">Medium</span>;
            case 0: return <span className="bg-gray-100 text-black text-sm font-normal px-1.5 py-0.5 rounded uppercase tracking-widest border border-gray-100">Low</span>;
            default: return null;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">

                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
                >
                    + Add New Note
                </button>
            </div>

            {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Inbox className="w-12 h-12 mb-4 text-gray-200" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-sm">
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
                                    ? "shadow-md scale-[1.01]"
                                    : "hover:border-gray-200 shadow-sm"
                                    }`}
                                style={{
                                    borderLeftWidth: note.colorCode ? '6px' : '1px',
                                    borderLeftColor: note.colorCode || (isExpanded ? '#6bbd45' : '#f3f4f6'),
                                    borderColor: isExpanded ? '#6bbd45' : undefined
                                }}
                            >
                                <button
                                    onClick={() => handleExpandNote(note.id)}
                                    className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-gray-50/50"
                                >
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex flex-wrap gap-1.5 mb-2">
                                            {note.flags && note.flags.length > 0 && note.flags.map((flag, idx) => (
                                                <span key={idx} className="text-sm font-normal bg-gray-100 text-black px-1.5 py-0.5 rounded tracking-widest whitespace-nowrap uppercase border border-gray-200 flex items-center gap-1">
                                                    <Flag size={10} className="text-[#6bbd45]" />
                                                    {flag}
                                                </span>
                                            ))}
                                            {!['connection_designer_engineer', 'connection_designer_admin'].includes(userRole) && (() => {
                                                const rawList = [...(note.taggedUsers || []), ...(note.taggedUserIds || [])];
                                                const seenIds = new Set();
                                                const uniqueList = [];
                                                for (const u of rawList) {
                                                    const curId = u.id || u._id || (typeof u === 'string' ? u : JSON.stringify(u));
                                                    if (!seenIds.has(curId)) {
                                                        seenIds.add(curId);
                                                        uniqueList.push(u);
                                                    }
                                                }
                                                return uniqueList.map((u, idx) => {
                                                    const name = typeof u === 'string' ? u : `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username;
                                                    if (!name) return null;
                                                    return (
                                                        <span key={u.id || u._id || idx} className="text-sm font-normal bg-gray-100 text-black px-1.5 py-0.5 rounded tracking-widest whitespace-nowrap uppercase border border-gray-200">
                                                            @{name}
                                                        </span>
                                                    );
                                                });
                                            })()}
                                        </div>
                                        <div className="text-lg font-semibold text-black truncate pr-4 uppercase tracking-tight mb-2">
                                            {note.title || truncateWords(note.content?.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ") || "Untitled Note", 10)}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-normal text-black uppercase tracking-widest">
                                            {note.createdBy && (
                                                <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-0.5 rounded-full text-black">
                                                    {note.createdBy.firstName} {note.createdBy.lastName}
                                                </span>
                                            )}
                                            {note.createdAt && (
                                                <span className="flex items-center gap-1">
                                                    <Calendar size={12} className="text-black" />
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
                                            <p className="text-sm font-normal text-black uppercase tracking-widest">
                                                Observation / Discussion
                                            </p>
                                            <div
                                                className="prose prose-sm max-w-none text-black bg-gray-50/50 p-4 rounded-xl border border-gray-100 font-normal [&>p]:mb-1 [&>p]:mt-0"
                                                dangerouslySetInnerHTML={{
                                                    __html: note.content || "No content.",
                                                }}
                                            />
                                        </div>

                                        {/* Files */}
                                        {note.files && note.files.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-normal text-black uppercase tracking-widest">
                                                    Attached Intelligence
                                                </p>
                                                <RenderFiles
                                                    files={note.files}
                                                    table="teamMeetingNotes"
                                                    parentId={note.id}
                                                    formatDate={formatDateTime}
                                                />
                                            </div>
                                        )}

                                        {/* Responses Section */}
                                        <div className="space-y-4 pt-4 border-t border-gray-100">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-normal text-black uppercase tracking-widest flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-[#6bbd45] rounded-full"></span>
                                                    Responses
                                                </h4>
                                                <button
                                                    onClick={() => setShowResponseModal(note.id)}
                                                    className="px-4 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-normal text-sm uppercase tracking-tight shadow-sm cursor-pointer"
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
                                                                    const plainText = row.original.content?.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ") || "";
                                                                    return (
                                                                        <div className="space-y-1">
                                                                            <p className="truncate max-w-[300px] text-sm text-black font-normal">
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
                                                                        <span className="text-black font-normal text-sm">
                                                                            {count} file(s)
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-black font-normal text-sm">—</span>
                                                                    );
                                                                },
                                                            },
                                                            {
                                                                accessorKey: "createdAt",
                                                                header: "Date",
                                                                cell: ({ row }) => (
                                                                    <span className="text-black text-sm font-normal">
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
                                                                    <p className="text-sm font-normal text-black uppercase tracking-widest flex items-center gap-2">
                                                                        <span className="w-1.5 h-1.5 bg-[#6bbd45] rounded-full"></span>
                                                                        Replies ({replies.length})
                                                                    </p>
                                                                    <div className="space-y-3">
                                                                        {replies.map(reply => (
                                                                            <div key={reply.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm transition-all hover:border-[#6bbd45]/20">
                                                                                <div className="flex justify-between items-start mb-1">
                                                                                    <span className="text-sm font-normal text-[#6bbd45] uppercase tracking-wider">
                                                                                        {reply.createdBy ? `${reply.createdBy.firstName} ${reply.createdBy.lastName}` : (reply.firstName ? `${reply.firstName} ${reply.lastName}` : "User")}
                                                                                    </span>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-sm font-normal text-black">{formatDateTime(reply.createdAt)}</span>
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
                                                                                    className="text-sm text-black font-normal line-clamp-2"
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
                                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest italic">No responses recorded</p>
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
                <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <AddProjectNote
                            projectId={projectId}
                            project={project}
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
