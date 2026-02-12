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
    <div className="bg-primary text-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(22,163,74,0.3)] relative overflow-hidden">
      {/* Background Decorative Circles */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-black opacity-5 rounded-full blur-3xl"></div>

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
              In Progress
            </span>
            <h3 className="text-2xl font-black mt-3 leading-tight tracking-tight">
              {task.project?.name || task.estimation?.projectName || 'Untitled Project'}
            </h3>
            <p className="text-white/80 mt-1 flex items-center gap-2 text-sm font-bold">
              {task.name || (task.estimation?.estimationNumber
                ? `Estimation #${task.estimation.estimationNumber}`
                : 'Untitled Task')}
            </p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 mb-6">
          <div className="flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-white/70" />
              <span className="text-white/90">
                Deadline: {new Date(task.due_date || task.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onTaskUpdate?.()}
          className="w-full py-3 bg-white text-primary font-black rounded-xl hover:bg-green-50 transition-colors flex items-center justify-center gap-2 group shadow-xl shadow-black/10 text-sm uppercase tracking-wider"
        >
          View Task Details
          <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  )
}

export default CurrentTaskWidget
