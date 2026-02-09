/* eslint-disable react/prop-types */

import { Calendar, AlertCircle } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

const UpcomingDeadlinesWidget = ({ tasks = [] }) => {
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
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className=" text-gray-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          Upcoming Deadlines
        </h3>
        <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
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
                className="flex items-center p-3 rounded-xl border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all group"
              >
                <div className={`p-2 rounded-lg ${urgency} mr-3`}>
                  <AlertCircle size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4
                    className="text-sm font-semibold text-gray-800 truncate"
                    title={task.project?.name || task.estimation?.projectName}
                  >
                    {task.project?.name || task.estimation?.projectName || 'Untitled'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Due {format(new Date(dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Optional action button */}
                </div>
              </div>
            )
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
            <p>No upcoming deadlines!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingDeadlinesWidget
