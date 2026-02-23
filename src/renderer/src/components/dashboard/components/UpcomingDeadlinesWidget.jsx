/* eslint-disable react/prop-types */
import { Calendar, AlertCircle, ChevronRight } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const UpcomingDeadlinesWidget = ({ tasks = [], onTaskClick }) => {
  // Filter for pending tasks and sort by due date
  const upcoming = tasks
    .filter((t) => t.status === 'ASSIGNED' || t.status === 'REWORK')
    .sort((a, b) => new Date(a.due_date || a.endDate) - new Date(b.due_date || b.endDate))
    .slice(0, 10) // Show more in the popup list

  const getUrgencyColor = (date) => {
    const days = differenceInDays(new Date(date), new Date())
    if (days < 0) return 'text-red-500 bg-red-50'
    if (days <= 2) return 'text-orange-500 bg-orange-50'
    return 'text-blue-500 bg-blue-50'
  }

  return (
    <div className="bg-white flex-1 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-800">Upcoming Assigned Tasks Deadlines</h3>
        </div>
        <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100">
          {upcoming.length} PENDING
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {upcoming.length > 0 ? (
          <div className="w-full">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50/50 rounded-lg mb-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="col-span-8 lg:col-span-9">Project / Task</div>
              <div className="col-span-4 lg:col-span-3 text-right">Due Date</div>
            </div>

            <div className="space-y-1">
              {upcoming.map((task) => {
                const dueDate = task.due_date || task.endDate
                const urgency = getUrgencyColor(dueDate)
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-blue-50/30 transition-colors border-b border-gray-50 group last:border-0 cursor-pointer"
                    onClick={() => onTaskClick?.(task.id)}
                  >
                    <div className="col-span-8 lg:col-span-9 flex items-center gap-3 overflow-hidden">
                      <div className={`p-1.5 rounded-lg shrink-0 ${urgency}`}>
                        <AlertCircle size={14} />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-gray-800 truncate group-hover:text-primary transition-colors">
                          {task.project?.name || task.estimation?.projectName || 'Untitled Project'}
                        </span>
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider truncate">
                          {task.name || 'Task Detail'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-4 lg:col-span-3 flex items-center justify-end gap-3">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        {format(new Date(dueDate), 'MMM dd, yyyy')}
                      </span>
                      <ChevronRight size={16} className="text-gray-300 group-hover:text-primary transition-colors hidden lg:block" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-gray-300 space-y-3">
            <Calendar size={40} className="text-gray-100" strokeWidth={1} />
            <p className="text-[10px] font-black uppercase tracking-widest">No upcoming deadlines</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingDeadlinesWidget
