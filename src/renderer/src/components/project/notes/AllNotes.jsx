import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import Service from "../../../api/Service";
import Button from "../../fields/Button";
import AddNotes from "./AddNotes";
import GetNoteByID from "./GetNoteByID";
import RenderFiles from "../../common/RenderFiles";

const AllNotes = ({ projectId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState(null);

  useEffect(() => {
    if (projectId) fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const response = await Service.GetProjectNotes(projectId);
      setNotes(response || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStickyColor = (index) => {
    const colors = [
      "bg-yellow-50 border-yellow-200",
      "bg-blue-50 border-blue-200",
      "bg-green-50 border-green-200",
      "bg-pink-50 border-pink-200",
      "bg-purple-50 border-purple-200",
      "bg-orange-50 border-orange-200",
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-green-600" />
          Project Notes
        </h3>
        <Button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-green-200 hover:bg-green-300 text-black"
        >
          <Plus className="w-4 h-4" /> Add Note
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-green-600" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-1">
          {notes.map((note, index) => (
            <div
              key={note.id}
              onClick={() => setSelectedNoteId(note.id)}
              className={`${getStickyColor(
                index
              )} border-l-4 rounded-r-xl p-5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer relative group flex flex-col h-[280px]`}
            >
              {/* Header Info */}
              <div className="flex justify-between items-start mb-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/50 border border-current/10">
                  {note.stage}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold opacity-60 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(note.createdAt).split(',')[0]}
                  </span>
                </div>
              </div>

              {/* Content Preview */}
              <div
                className="text-gray-800 text-sm mb-4 line-clamp-6 flex-1 prose-sm prose-p:my-1 prose-headings:my-1"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />

              {/* Footer / Meta */}
              <div className="mt-auto pt-3 border-t border-current/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-white/80 flex items-center justify-center text-[10px] font-bold uppercase shadow-sm border border-current/5">
                    {note.createdBy?.firstName?.charAt(0)}
                  </div>
                  <span className="text-[10px] font-medium opacity-70 truncate max-w-[80px]">
                    {note.createdBy?.firstName} {note.createdBy?.lastName}
                  </span>
                </div>

                {note.files?.length > 0 && (
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/40 rounded-full text-[10px] font-bold">
                    <FileText className="w-3 h-3" />
                    {note.files.length}
                  </div>
                )}
              </div>

              {/* Corner Fold Effect Decor */}
              <div className="absolute bottom-0 right-0 w-4 h-4 bg-white/20 rounded-tl-lg"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-gray-800 font-bold mb-1">No Project Notes</h3>
          <p className="text-gray-500 text-sm mb-4">Start by adding important information here.</p>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-green-200 hover:bg-green-300 text-black px-8"
          >
            Create First Note
          </Button>
        </div>
      )}

      {showAddModal && (
        <AddNotes
          projectId={projectId}
          onNoteAdded={fetchNotes}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {selectedNoteId && (
        <GetNoteByID
          projectId={projectId}
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
        />
      )}
    </div>
  );
};

export default AllNotes;
