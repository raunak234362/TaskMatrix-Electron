import React from 'react';
import { MessageCircleWarning, ChevronRight } from 'lucide-react';

const UnreadCommentsWidget = ({ unreadComments = [], onTaskClick }) => {
  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <MessageCircleWarning className="w-4 h-4 text-red-600" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-800">Unread Comments</h3>
        </div>
        <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100">
          {unreadComments.length} UNREAD
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {unreadComments.length > 0 ? (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="col-span-8 lg:col-span-9">Task</div>
              <div className="col-span-4 lg:col-span-3 text-right">Date</div>
            </div>

            <div className="space-y-1">
              {unreadComments.map((comment) => {
                const taskId = comment.task_id || comment.taskId;
                return (
                  <div
                    key={comment.id || comment._id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-red-50/30 transition-colors border-b border-gray-50 group last:border-0 cursor-pointer"
                    onClick={() => onTaskClick?.(taskId)}
                  >
                    <div className="col-span-8 lg:col-span-9 flex items-center gap-3 overflow-hidden">
                      <div className="p-1.5 rounded-lg shrink-0 text-red-500 bg-red-50">
                        <MessageCircleWarning size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-800 truncate group-hover:text-red-600 transition-colors">
                          {comment.task?.name || 'Task Detail'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
                          {comment.user ? (comment.user.username || comment.user.firstName) : 'System'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-4 lg:col-span-3 flex items-center justify-end gap-3">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {comment.created_on ? new Date(comment.created_on).toLocaleDateString() : ''}
                      </span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-red-500 transition-colors hidden lg:block" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
            <MessageCircleWarning size={40} className="text-gray-100" strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest">No unread comments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnreadCommentsWidget;
