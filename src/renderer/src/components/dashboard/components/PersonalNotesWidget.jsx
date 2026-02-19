/* eslint-disable react/prop-types */
import { MessageSquare, Calendar, User, ChevronRight } from 'lucide-react'

const PersonalNotesWidget = ({ projectNotes = [] }) => {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-amber-600" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-800">Notes & Updates</h3>
        </div>
        <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100">
          {projectNotes.length} NEW
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {projectNotes.length > 0 ? (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="col-span-12 lg:col-span-6">Content / Stage</div>
              <div className="hidden lg:block lg:col-span-3">Author</div>
              <div className="hidden lg:block lg:col-span-3 text-right">Date</div>
            </div>

            <div className="space-y-1">
              {projectNotes.map((note) => (
                <div
                  key={note.id}
                  className="grid grid-cols-12 gap-4 px-4 py-4 items-start hover:bg-amber-50/30 transition-colors border-b border-gray-50 group last:border-0"
                >
                  <div className="col-span-12 lg:col-span-6 flex items-start gap-4">
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0 mt-0.5">
                      <MessageSquare size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div
                        className="text-xs text-gray-700 font-medium prose prose-sm max-w-none line-clamp-2 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: note.content }}
                      />
                      <div className="mt-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black rounded-full uppercase tracking-widest">
                          {note.stage || 'Update'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="hidden lg:flex lg:col-span-3 items-center gap-2 mt-1">
                    <div className="p-1 bg-gray-100 rounded-full">
                      <User size={10} className="text-gray-400" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight truncate">
                      {note.createdBy?.firstName || 'Unknown'}
                    </span>
                  </div>

                  <div className="col-span-12 lg:col-span-3 flex justify-between lg:justify-end items-center mt-2 lg:mt-1">
                    <div className="flex items-center gap-1.5 lg:hidden">
                      <User size={10} className="text-gray-400" />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tight">
                        {note.createdBy?.firstName || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {formatDate(note.createdAt)}
                      </span>
                      <button className="p-1 text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
            <MessageSquare size={40} className="text-gray-100" strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest">No Updates</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PersonalNotesWidget
