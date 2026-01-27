/* eslint-disable react/prop-types */

import { Clock, Calendar, ArrowRight } from 'lucide-react'

const CurrentTaskWidget = ({ task, onTaskUpdate }) => {

  if (!task) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center h-48 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <h3 className="text-gray-500 font-medium">No Active Task</h3>
        <p className="text-sm text-gray-400 mt-1">Pick a task from your list to start working</p>
      </div>
    )
  }

  return (
    <div className="bg-[#6bbd45] text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              In Progress
            </span>
            <h3 className="text-2xl font-bold mt-3 leading-tight">
              {task.project?.name || task.estimation?.projectName || 'Untitled Project'}
            </h3>
            <p className="text-indigo-100 mt-1 flex items-center gap-2">
              <span className="opacity-80">
                {task.name ||
                  (task.estimation?.estimationNumber
                    ? `Estimation #${task.estimation.estimationNumber}`
                    : 'Untitled Task')}
              </span>
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-indigo-200" />
              <span className="text-indigo-100">
                Due: {new Date(task.due_date || task.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Note: Actions could be added here if we want direct control */}
        <button
          onClick={() => onTaskUpdate?.()} // Just linking to detail view for now
          className="w-full py-3 bg-white text-indigo-700 font-semibold rounded-xl hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 group shadow-lg shadow-black/10"
        >
          View Details
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

export default CurrentTaskWidget
