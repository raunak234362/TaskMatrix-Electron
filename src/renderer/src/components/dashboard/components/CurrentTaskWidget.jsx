/* eslint-disable react/prop-types */

import { Clock, Calendar, ArrowRight, PlayCircle } from 'lucide-react'

const CurrentTaskWidget = ({ task, onTaskUpdate }) => {

  const CardWrapper = ({ children }) => (
    <div className="bg-white p-4 lg:p-6 rounded-2xl border border-gray-100 shadow-[0_15px_40px_rgba(22,163,74,0.08),0_10px_20px_rgba(0,0,0,0.05)] transition-all duration-500 hover:shadow-[0_20px_60px_rgba(22,163,74,0.15),0_15px_30px_rgba(0,0,0,0.1)] h-full flex flex-col justify-between hover:-translate-y-1">
      {children}
    </div>
  )

  if (!task) {
    return (
      <CardWrapper>
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-green-50 rounded-[4px]">
            <PlayCircle className="w-4 h-4 text-primary" />
          </div>
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Current Focus</h3>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 text-center opacity-50">
          <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3">
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">No Active Task</p>
        </div>
      </CardWrapper>
    )
  }

  return (
    <CardWrapper>
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-[4px]">
              <PlayCircle className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Current Focus</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-black uppercase tracking-wider text-primary border border-primary/10">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Active
          </span>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight line-clamp-2">
            {task.project?.name || task.estimation?.projectName || 'Untitled Project'}
          </h3>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-wide line-clamp-2">
            {task.name || (task.estimation?.estimationNumber
              ? `Estimation #${task.estimation.estimationNumber}`
              : 'Untitled Task')}
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs font-bold text-gray-500">
          <Calendar size={14} className="text-gray-400" />
          <span className="uppercase tracking-wider">
            Due: {new Date(task.due_date || task.endDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      <button
        onClick={() => onTaskUpdate?.()}
        className="w-full mt-4 py-2.5 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 group shadow-lg text-xs uppercase tracking-widest"
      >
        View Details
        <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    </CardWrapper>
  )
}

export default CurrentTaskWidget
