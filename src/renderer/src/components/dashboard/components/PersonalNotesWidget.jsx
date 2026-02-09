/* eslint-disable react/prop-types */
import { MessageSquare, Calendar, User } from 'lucide-react'

const PersonalNotesWidget = ({ projectNotes = [] }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short'
    })
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 h-full flex flex-col overflow-hidden group">
      <div className="p-4 border-b border-slate-100 bg-pink-50/30">
        <h3 className="text-sm  text-pink-600 flex items-center justify-between">
          Project Updates
          {projectNotes.length > 0 && (
            <span className="w-5 h-5 bg-pink-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white">
              {projectNotes.length}
            </span>
          )}
        </h3>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {projectNotes.length > 0 ? (
            projectNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl border border-slate-50 bg-pink-50/20 hover:bg-pink-50/40 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-1 bg-pink-100 text-pink-700 text-[10px]  rounded-lg uppercase tracking-wider">
                    {note.stage || 'Update'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 ">
                    <Calendar size={10} />
                    {formatDate(note.createdAt)}
                  </div>
                </div>
                <div
                  className="text-sm text-slate-700 font-medium prose prose-sm max-w-none line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                <div className="mt-3 pt-3 border-t border-pink-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-semibold">
                    <User size={10} />
                    {note.createdBy?.firstName} {note.createdBy?.lastName}
                  </div>
                  <button className="text-[10px] text-pink-600  hover:underline">
                    View Full Update
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3">
              <MessageSquare size={40} strokeWidth={1.5} />
              <p className="text-sm font-medium">No project updates found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalNotesWidget
