/* eslint-disable react/prop-types */
import React, { useMemo } from 'react'
import { Calendar } from 'lucide-react'
import { format } from 'date-fns'
import DataTable from '../../ui/table'

const UpcomingDeadlinesWidget = ({ tasks = [], onTaskClick }) => {
  // Filter for pending tasks and sort by due date
  const upcoming = tasks
    .filter((t) => t.status === 'ASSIGNED' || t.status === 'REWORK')
    .sort((a, b) => new Date(a.due_date || a.endDate) - new Date(b.due_date || b.endDate))
    .slice(0, 10) // Show more in the popup list

  const columns = useMemo(() => [
    {
      header: 'Project / Task',
      accessorKey: 'task',
      cell: ({ row }) => (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-black truncate transition-colors">
            {row.original.project?.name || row.original.estimation?.projectName || 'Untitled Project'}
          </span>
          <span className="text-sm font-semibold text-black truncate">
            {row.original.name || 'Task Detail'}
          </span>
        </div>
      ),
    },
    {
      header: 'Due Date',
      accessorKey: 'due_date',
      cell: ({ row }) => {
        const dueDate = row.original.due_date || row.original.endDate;
        return (
          <span className="text-sm font-semibold text-black uppercase tracking-normal">
            {dueDate ? format(new Date(dueDate), 'MMM dd, yyyy') : ''}
          </span>
        );
      },
    },
  ], []);

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h3 className="text-md font-semibold uppercase text-black">Upcoming Assigned Tasks Deadlines</h3>
        </div>
        <div className="px-2 py-1 bg-gray-50/50 border border-gray-100 rounded text-sm font-semibold text-black uppercase tracking-normal">
          {upcoming.length} PENDING
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {upcoming.length > 0 ? (
          <div className="w-full">
            <DataTable 
              columns={columns} 
              data={upcoming} 
              pageSizeOptions={[5, 10, 25]} 
              onRowClick={(row) => onTaskClick?.(row.id)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <Calendar size={40} className="text-black" strokeWidth={1} />
            <p className="text-sm font-semibold text-black tracking-normal">No upcoming deadlines</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingDeadlinesWidget

