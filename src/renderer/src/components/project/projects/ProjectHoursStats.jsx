import React from 'react'
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react'

const ProjectHoursStats = ({ projectStats, userRole }) => {
  if (!projectStats) return null

  return (
    <div className="space-y-4 mb-8">
      {/* Row 1: Estimations */}
      {userRole !== 'staff' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-black uppercase tracking-wider block">
                  Estimated Hours
                </span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-black tracking-tight">
              {projectStats.assigned.toFixed(2)}H
            </h3>
          </div>

          <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-black uppercase tracking-wider block">
                  Estimated Hours for Approval
                </span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-black tracking-tight">
              {(projectStats.assigned * 0.8).toFixed(2)}H
            </h3>
          </div>

          <div className="flex items-center justify-between bg-blue-50/40 p-4 rounded-none border border-black">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-none bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <span className="text-sm font-bold text-black uppercase tracking-wider block">
                  Estimated Hours for Fabrication
                </span>
              </div>
            </div>
            <h3 className="text-sm font-bold text-black tracking-tight">
              {(projectStats.assigned * 0.2).toFixed(2)}H
            </h3>
          </div>
        </div>
      )}

      {/* Row 2: Completion & Overrun */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex items-center justify-between bg-green-50/40 p-4 rounded-none border border-black">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none bg-green-100/50 flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-black uppercase tracking-wider block">
                Hours Completed
              </span>
            </div>
          </div>
          <h3 className="text-sm font-bold text-black tracking-tight">
            {projectStats.completedStr}
          </h3>
        </div>

        <div
          className={`flex items-center justify-between p-4 rounded-none border border-black ${
            projectStats.overrun > 0 ? 'bg-red-50/40' : 'bg-gray-50/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-none flex items-center justify-center shrink-0 ${
                projectStats.overrun > 0
                  ? 'bg-red-100/50 text-red-600'
                  : 'bg-gray-100/50 text-black'
              }`}
            >
              <AlertCircle size={18} />
            </div>
            <div>
              <span className="text-sm font-bold text-black uppercase tracking-wider block">
                Overrun / Delay
              </span>
              <span className="text-xs text-black font-semibold block mt-0.5">
                {projectStats.overrun > 0
                  ? 'PROJECT HAS OVERRUN ESTIMATE'
                  : 'PROJECT IS WITHIN ESTIMATES'}
              </span>
            </div>
          </div>
          <h3
            className={`text-sm font-bold tracking-tight ${
              projectStats.overrun > 0 ? 'text-red-600' : 'text-black'
            }`}
          >
            {projectStats.overrunStr}
          </h3>
        </div>
      </div>
    </div>
  )
}

export default ProjectHoursStats
