import React from 'react'
import { FileText, Settings, Clock, FolderOpenDot } from 'lucide-react'

const ProjectQuickCounts = ({
  rfiCount,
  submittalCount,
  changeOrderCount,
  milestonesCount,
  filesCount,
  setActiveTab
}) => {
  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <button
          onClick={() => setActiveTab('rfi')}
          className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
              <FileText size={16} />
            </div>
            <span className="text-sm font-bold text-black uppercase tracking-wider truncate">
              RFIs
            </span>
          </div>
          <span className="text-sm font-bold text-black pr-1">{rfiCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('submittals')}
          className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
              <FileText size={16} />
            </div>
            <span className="text-sm font-bold text-black uppercase tracking-wider truncate">
              Submittals
            </span>
          </div>
          <span className="text-sm font-bold text-black pr-1">{submittalCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('changeOrder')}
          className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
              <Settings size={16} />
            </div>
            <span className="text-sm font-bold text-black uppercase tracking-wider truncate">
              Change Orders
            </span>
          </div>
          <span className="text-sm font-bold text-black pr-1">{changeOrderCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('milestones')}
          className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
              <Clock size={16} />
            </div>
            <span className="text-sm font-bold text-black uppercase tracking-wider truncate">
              Milestones
            </span>
          </div>
          <span className="text-sm font-bold text-black pr-1">{milestonesCount}</span>
        </button>

        <button
          onClick={() => setActiveTab('files')}
          className="w-full flex items-center justify-between bg-green-50/20 p-3 rounded-none border border-black hover:bg-green-50/40 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-none bg-green-100/40 flex items-center justify-center text-green-600 shrink-0">
              <FolderOpenDot size={16} />
            </div>
            <span className="text-sm font-bold text-black uppercase tracking-wider truncate">
              Docs / Files
            </span>
          </div>
          <span className="text-sm font-bold text-black pr-1">{filesCount}</span>
        </button>
      </div>
    </div>
  )
}

export default ProjectQuickCounts
