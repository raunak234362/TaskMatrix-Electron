/* eslint-disable react/prop-types */

import { Calendar, AlertCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const UpcomingDeadlinesWidget = ({ tasks = [], onTaskClick }) => {
  // Filter for pending tasks and sort by due date
  const upcoming = tasks
    .filter((t) => t.status !== 'COMPLETED' && t.status !== 'IN_PROGRESS') // Assuming In Progress is shown separately
    .sort((a, b) => new Date(a.due_date || a.endDate) - new Date(b.due_date || b.endDate))
    .slice(0, 5) // Show top 5

  const getUrgencyColor = (date) => {
    const days = differenceInDays(new Date(date), new Date())
    if (days < 0) return 'text-red-600 bg-red-50' // Overdue
    if (days <= 2) return 'text-orange-600 bg-orange-50' // Urgent
    return 'text-gray-600 bg-gray-50' // Normal
  }

  return (
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-black shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full flex flex-col hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-[4px]">
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Upcoming Deadlines</h3>
        </div>
        <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-widest shadow-sm border border-blue-100">
          {upcoming.length} Pending
        </span>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {upcoming.length > 0 ? (
          upcoming.map((task) => {
            const dueDate = task.due_date || task.endDate
            const urgency = getUrgencyColor(dueDate)
            return (
              <div
                key={task.id}
                className="flex items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:border-blue-100 transition-all group hover:shadow-md cursor-pointer"
                onClick={() => onTaskClick?.(task.id)}
              >
                <div className={`p-2 rounded-lg ${urgency} mr-3 shadow-sm`}>
                  <AlertCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-xs font-black text-gray-800 truncate uppercase tracking-tight group-hover:text-blue-600 transition-colors"
                    title={task.project?.name || task.estimation?.projectName}
                  >
                    {task.project?.name || task.estimation?.projectName || 'Untitled'}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5 font-bold">
                    DUE: {format(new Date(dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-3 font-bold uppercase tracking-widest text-xs">
            <Calendar size={40} strokeWidth={1.5} className="text-gray-200" />
            <p>No upcoming deadlines</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingDeadlinesWidget
