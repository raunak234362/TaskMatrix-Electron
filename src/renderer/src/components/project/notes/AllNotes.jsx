import { useEffect, useState } from 'react'
import { Loader2, Plus, FileText, Calendar, User, Paperclip } from 'lucide-react'
import Service from '../../../api/Service'

import Button from '../../fields/Button'
import AddNotes from './AddNotes'
import { openFileSecurely } from '../../../utils/openFileSecurely'

const AllNotes = ({ projectId }) => {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    if (projectId) fetchNotes()
  }, [projectId])

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await Service.GetProjectNotes(projectId)
      setNotes(response || [])
    } catch (error) {
      console.error('Error fetching notes:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Note
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
        </div>
      ) : notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200`}
                  >
                    {note.stage}
                  </span>
                  <span className="text-xs text-gray-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(note.createdAt)}
                  </span>
                </div>
                <div className="text-xs text-gray-700 flex items-center gap-1">
                  <User className="w-3 h-3" /> {note.createdBy?.firstName}{' '}
                  {note.createdBy?.lastName}
                </div>
              </div>

              {note.tags && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {note.tags.split(',').map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold rounded-full border border-green-100 uppercase tracking-wider"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div
                className="text-gray-700 text-sm mb-3 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />

              {note.files && note.files.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-100">
                  {note.files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => openFileSecurely('notes', projectId, file.id)}
                      className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded hover:bg-green-100 transition-colors"
                    >
                      <Paperclip className="w-3 h-3" /> {file.originalName}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-700">No notes found for this project.</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="text-green-600 font-medium hover:underline mt-2 text-sm"
          >
            Create the first note
          </button>
        </div>
      )}

      {showAddModal && (
        <AddNotes
          projectId={projectId}
          onNoteAdded={fetchNotes}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  )
}

export default AllNotes
