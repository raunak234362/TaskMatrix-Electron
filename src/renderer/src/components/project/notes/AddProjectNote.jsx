import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Loader2, Paperclip, X, FileText, Flag, Palette, AlertCircle } from "lucide-react";
import Select from "react-select";
import Service from "../../../api/Service";
import RichTextEditor from "../../fields/RichTextEditor";

const AddProjectNote = ({
    projectId,
    project,
    onClose,
    onSuccess,
}) => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [taggedUserIds, setTaggedUserIds] = useState([]);
    const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
    const isClient = userRole === "client" || userRole === "client_admin";
    const [files, setFiles] = useState([]);
    const [priority, setPriority] = useState(0);
    const [colorCode, setColorCode] = useState("");
    const [flags, setFlags] = useState([]);
    const [newFlag, setNewFlag] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const [allUsers, setAllUsers] = useState([]);
    useEffect(() => {
        const fetchAll = async () => {
            let combined = [];
            try {
                const res = await Service.FetchAllUsers();
                const d = res?.data?.data || res?.data || res?.users || res || [];
                combined = [...combined, ...(Array.isArray(d) ? d : [])];
            } catch(e) { console.error("Error fetching internal users:", e); }

            const cdId = project?.connectionDesignerID || project?.connectionDesigner?.id || project?.connectionDesigner;
            if (cdId) {
                try {
                    const res = await Service.FetchConnectionDesignerByID(cdId.id || cdId);
                    const cde = res?.data?.CDEngineers || res?.CDEngineers || [];
                    combined = [...combined, ...(Array.isArray(cde) ? cde : [])];
                } catch(e) { console.error("Error fetching CD engineers:", e); }
            }

            const fabId = project?.fabricatorID || project?.fabricator?.id || project?.fabricator;
            if (fabId) {
                try {
                    const res = await Service.FetchAllClientsByFabricatorID(fabId.id || fabId);
                    const c = res?.data?.data || res?.data || res || [];
                    combined = [...combined, ...(Array.isArray(c) ? c : [])];
                } catch(e) { console.error("Error fetching clients:", e); }
            }
            // Remove duplicates by ID just in case
            const uniqueUsers = [];
            const seen = new Set();
            for (const u of combined) {
                const uid = u.id || u._id;
                if (!uid || !seen.has(uid)) {
                    if (uid) seen.add(uid);
                    uniqueUsers.push(u);
                }
            }
            setAllUsers(uniqueUsers);
        };
        fetchAll();
    }, [project]);

    const allowedRoles = [
        "connection_designer_engineer",
        "connection_designer_admin",
        "project_manager",
        "admin",
        "deputy_manager",
        "operation_executive",
        "client",
        "client_admin"
    ];

    const targetUsers = Array.isArray(allUsers) 
        ? allUsers.filter(u => u && u.role && allowedRoles.includes(String(u.role).toLowerCase()))
        : [];

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...selected]);
        e.target.value = "";
    };

    const removeFile = (index) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const addFlag = () => {
        if (newFlag.trim() && !flags.includes(newFlag.trim())) {
            setFlags([...flags, newFlag.trim()]);
            setNewFlag("");
        }
    };

    const removeFlag = (flagToRemove) => {
        setFlags(flags.filter(f => f !== flagToRemove));
    };

    const priorityOptions = [
        { value: 0, label: "Low" },
        { value: 1, label: "Medium" },
        { value: 2, label: "High" },
        { value: 3, label: "Urgent" },
        { value: 4, label: "Critical" },
    ];

    const colorOptions = [
        { code: "", name: "Default", bg: "bg-white" },
        { code: "#fee2e2", name: "Red", bg: "bg-red-100" },
        { code: "#dbeafe", name: "Blue", bg: "bg-blue-100" },
        { code: "#dcfce7", name: "Green", bg: "bg-green-100" },
        { code: "#fef9c3", name: "Yellow", bg: "bg-yellow-100" },
        { code: "#f3e8ff", name: "Purple", bg: "bg-purple-100" },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            setError("Title is required.");
            return;
        }
        if (!content.trim()) {
            setError("Content is required.");
            return;
        }

        setError(null);
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("title", title.trim());
            formData.append("content", content.trim());
            formData.append("projectId", projectId);
            formData.append("priority", priority);
            formData.append("colorCode", colorCode);
            flags.forEach(flag => formData.append("flags[]", flag));
            taggedUserIds.forEach(opt => formData.append("taggedUserIds[]", opt.value));
            files.forEach((file) => formData.append("files", file));

            await Service.AddTeamMeetingNotes(formData);
            onSuccess();
        } catch (err) {
            console.error("Error adding note:", err);
            setError("Failed to save note. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-black text-black uppercase tracking-tight flex items-center gap-2">
                        <FileText size={18} className="text-[#6bbd45]" />
                        Add Project Note
                    </h3>
                    <button
                        onClick={onClose}
                        className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                    >
                        Close
                    </button>
                </div>

                {/* Form */}
                <form
                    id="add-project-note-form"
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                >
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                            Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Note title..."
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6bbd45]/40 focus:border-[#6bbd45] transition-all"
                        />
                    </div>

                    {/* Content */}
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                            Content <span className="text-red-500">*</span>
                        </label>
                        <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#6bbd45]/40 transition-all">
                            <RichTextEditor
                                value={content}
                                onChange={setContent}
                                placeholder="Write note content here..."
                            />
                        </div>
                    </div>

                    {/* Tag User — hidden for client roles */}
                    {!isClient && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Tag User
                                </label>
                                <Select
                                    isMulti
                                    value={taggedUserIds}
                                    onChange={setTaggedUserIds}
                                    options={targetUsers.map(u => ({
                                        value: u.id || u._id,
                                        label: `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username
                                    }))}
                                    placeholder="Select users..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '0.75rem',
                                            borderColor: '#e5e7eb',
                                            padding: '2px'
                                        })
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                    Priority
                                </label>
                                <Select
                                    value={priorityOptions.find(opt => opt.value === priority)}
                                    onChange={(opt) => setPriority(opt.value)}
                                    options={priorityOptions}
                                    placeholder="Select priority..."
                                    className="text-sm"
                                    styles={{
                                        control: (base) => ({
                                            ...base,
                                            borderRadius: '0.75rem',
                                            borderColor: '#e5e7eb',
                                            padding: '2px'
                                        })
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Color and Flags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Note Color
                            </label>
                            <div className="flex items-center gap-2 flex-wrap p-2 border border-gray-200 rounded-xl bg-gray-50/50">
                                {colorOptions.map((opt) => (
                                    <button
                                        key={opt.name}
                                        type="button"
                                        title={opt.name}
                                        onClick={() => setColorCode(opt.code)}
                                        className={`w-8 h-8 rounded-full border-2 transition-all ${opt.bg} ${
                                            colorCode === opt.code 
                                                ? "border-[#6bbd45] scale-110 shadow-sm" 
                                                : "border-transparent hover:scale-105"
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                                Flags
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newFlag}
                                    onChange={(e) => setNewFlag(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addFlag();
                                        }
                                    }}
                                    placeholder="Add a flag..."
                                    className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6bbd45]/40 focus:border-[#6bbd45] transition-all"
                                />
                                <button
                                    type="button"
                                    onClick={addFlag}
                                    className="px-3 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-all font-bold text-xs"
                                >
                                    ADD
                                </button>
                            </div>
                            {flags.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {flags.map((flag) => (
                                        <span
                                            key={flag}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#6bbd45]/10 text-[#6bbd45] border border-[#6bbd45]/20 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                        >
                                            <Flag size={10} />
                                            {flag}
                                            <button
                                                type="button"
                                                onClick={() => removeFlag(flag)}
                                                className="hover:text-red-500"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Files */}
                    <div>
                        <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                            Attachments
                        </label>
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-[#6bbd45] hover:text-[#6bbd45] transition-colors"
                        >
                            <Paperclip size={14} />
                            Attach files
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        {files.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {files.map((file, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-1.5 bg-[#6bbd45]/10 border border-[#6bbd45]/30 text-black text-xs px-3 py-1.5 rounded-lg"
                                    >
                                        <Paperclip size={10} />
                                        <span className="max-w-[140px] truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => removeFile(i)}
                                            className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X size={10} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    )}
                </form>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-5 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-project-note-form"
                        disabled={submitting}
                        className="px-6 py-2 rounded-xl bg-[#6bbd45]/50 text-black border border-black text-sm font-black uppercase tracking-tight hover:bg-[#59a83a] transition-all flex items-center gap-2 disabled:opacity-60"
                    >
                        {submitting && <Loader2 size={14} className="animate-spin" />}
                        Save Note
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default AddProjectNote;
