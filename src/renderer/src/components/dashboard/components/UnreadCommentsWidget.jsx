import React, { useMemo } from 'react';
import { MessageCircleWarning } from 'lucide-react';
import DataTable from '../../ui/table';

const UnreadCommentsWidget = ({ unreadComments = [], onTaskClick }) => {
  const columns = useMemo(() => [
    {
      header: 'Task',
      accessorKey: 'task',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-black truncate transition-colors">
            {row.original.task?.name || 'Task Detail'}
          </span>
          <span className="text-sm font-semibold text-black truncate">
            {row.original.user ? (row.original.user.username || row.original.user.firstName) : 'System'}
          </span>
        </div>
      ),
    },
    {
      header: 'Date',
      accessorKey: 'created_on',
      cell: ({ row }) => (
        <span className="text-sm font-semibold text-black uppercase tracking-normal">
          {row.original.created_on ? new Date(row.original.created_on).toLocaleDateString() : ''}
        </span>
      ),
    },
  ], []);

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold uppercase text-black">Unread Comments</h3>
        </div>
        <div className="px-2 py-1 bg-gray-50/50 border border-gray-100 rounded text-sm font-semibold text-black uppercase tracking-normal">
          {unreadComments.length} UNREAD
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {unreadComments.length > 0 ? (
          <div className="w-full">
            <DataTable 
              columns={columns} 
              data={unreadComments} 
              pageSizeOptions={[5, 10, 25]} 
              onRowClick={(row) => onTaskClick?.(row.task_id || row.taskId)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <MessageCircleWarning size={40} className="text-black" strokeWidth={1} />
            <p className="text-sm font-semibold text-black tracking-normal">No unread comments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnreadCommentsWidget;
