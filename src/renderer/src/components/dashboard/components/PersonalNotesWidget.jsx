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
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-black shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full flex flex-col hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-50 rounded-[4px]">
            <MessageSquare className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Notes & Updates</h3>
        </div>
        {projectNotes.length > 0 && (
          <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm border border-amber-100">
            {projectNotes.length} New
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {projectNotes.length > 0 ? (
          projectNotes.map((note) => (
            <div
              key={note.id}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-amber-100 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black rounded-full uppercase tracking-widest">
                  {note.stage || 'Update'}
                </span>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold uppercase">
                  <Calendar size={10} />
                  {formatDate(note.createdAt)}
                </div>
              </div>
              <div
                className="text-xs text-gray-600 font-medium prose prose-sm max-w-none line-clamp-2 leading-relaxed mb-2"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-bold uppercase">
                  <User size={10} />
                  {note.createdBy?.firstName}
                </div>
                <button className="text-[9px] text-amber-600 font-black hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                  View
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3 font-bold uppercase tracking-widest text-xs">
            <MessageSquare size={40} strokeWidth={1.5} className="text-gray-200" />
            <p>No Updates</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalNotesWidget
