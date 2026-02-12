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
    <div className="bg-white rounded-2xl border border-primary/5 shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full flex flex-col overflow-hidden group">
      <div className="p-4 border-b border-gray-100 bg-primary/5">
        <h3 className="text-sm font-black text-primary flex items-center justify-between uppercase tracking-wider">
          Project Updates
          {projectNotes.length > 0 && (
            <span className="w-6 h-6 bg-primary text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white shadow-sm font-black">
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
                className="p-4 rounded-xl border border-primary/5 bg-primary/2 hover:bg-primary/5 transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest shadow-sm">
                    {note.stage || 'Update'}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold">
                    <Calendar size={10} />
                    {formatDate(note.createdAt)}
                  </div>
                </div>
                <div
                  className="text-xs text-gray-700 font-bold prose prose-sm max-w-none line-clamp-3 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: note.content }}
                />
                <div className="mt-3 pt-3 border-t border-primary/10 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-black uppercase tracking-tight">
                    <User size={10} className="text-primary/60" />
                    {note.createdBy?.firstName} {note.createdBy?.lastName}
                  </div>
                  <button className="text-[10px] text-primary font-black hover:underline uppercase tracking-widest">
                    Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3 font-bold uppercase tracking-widest text-xs">
              <MessageSquare size={40} strokeWidth={1.5} className="text-primary/20" />
              <p>No Updates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PersonalNotesWidget
