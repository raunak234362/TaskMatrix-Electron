import React from 'react'
import { X } from 'lucide-react'

const ProjectDetailsCard = ({ project, userRole, handleRemoveAssist, formatDate }) => {
  if (!project) return null

  const isAssistRemovalAllowed =
    userRole === 'admin' || userRole === 'system_admin' || userRole === 'project_manager'

  return (
    <div className="bg-[#f4faf0] p-6 rounded-none mt-8">
      {/* Project Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Department:</span>
            <span className="font-bold text-black uppercase">
              {project.department?.name || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Team :</span>
            <span className="font-bold text-black uppercase">{project.team?.name || '—'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">WBT Manager:</span>
            <span className="font-bold text-black uppercase text-right">
              {project.manager
                ? `${project.manager.firstName} ${project.manager.lastName}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Client PM:</span>
            <span className="font-bold text-black uppercase text-right">
              {project.clientProjectManagers && project.clientProjectManagers.length > 0
                ? project.clientProjectManagers
                    .map((pm) => `${pm.firstName || ''} ${pm.lastName || ''}`.trim())
                    .join(', ')
                : '—'}
            </span>
          </div>
          {project.assists && project.assists.length >= 0 && (
            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
              <span className="font-bold text-black uppercase tracking-wider">Assists:</span>
              <div className="flex flex-wrap gap-2">
                {project.assists.map((assist) => {
                  const fName = assist.user?.firstName || assist.firstName || ''
                  const lName = assist.user?.lastName || assist.lastName || ''
                  const assistId = assist.userId || assist.user?.id || assist.user
                  return (
                    <span
                      key={assistId}
                      className="flex items-center gap-1 bg-green-100/50 px-2 py-0.5 rounded text-xs font-bold text-black uppercase border border-green-200"
                    >
                      {`${fName} ${lName}`.trim()}
                      {isAssistRemovalAllowed && (
                        <button
                          onClick={() => handleRemoveAssist(assistId)}
                          className="text-red-500 hover:text-red-700 p-0.5 rounded-full hover:bg-red-50 transition-colors ml-1"
                          title="Remove Assist"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Fabricator:</span>
            <span className="font-bold text-black uppercase">
              {project.fabricator?.fabName || '—'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Stage:</span>
            <span className="font-bold text-black uppercase">{project.stage || '—'}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Start Date:</span>
            <span className="font-bold text-black">{formatDate(project.startDate)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Approval Date:</span>
            <span className="font-bold text-black">{formatDate(project.approvalDate)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <span className="font-bold text-black uppercase tracking-wider">Fabrication Date:</span>
            <span className="font-bold text-black">{formatDate(project.fabricationDate)}</span>
          </div>
        </div>
      </div>

      {/* Connection Design Scope */}
      <div className="mt-6">
        <h4 className="text-base font-semibold text-green-800 uppercase tracking-normal mb-3">
          Connection Design Scope
        </h4>
        <div className="flex flex-wrap gap-2">
          {project.connectionDesign && (
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-normal">
              Main Design
            </span>
          )}
          {project.miscDesign && (
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-normal">
              Misc Design
            </span>
          )}
          {project.customerDesign && (
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-normal">
              Customer Design
            </span>
          )}
          {!project.connectionDesign &&
            !project.miscDesign &&
            !project.customerDesign && (
              <span className="text-sm text-gray-700 font-semibold uppercase tracking-normal">
                No Connection Design scope defined.
              </span>
            )}
        </div>
      </div>

      {/* Detailing Scope */}
      <div className="mt-6">
        <h4 className="text-base font-semibold text-green-800 uppercase tracking-normal mb-3">
          Detailing Scope
        </h4>
        <div className="flex flex-wrap gap-2">
          {project.detailingMain && (
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-normal">
              Detailing Main
            </span>
          )}
          {project.detailingMisc && (
            <span className="px-3 py-1.5 bg-white border border-gray-200 text-black text-sm font-semibold rounded-none uppercase tracking-normal">
              Detailing Misc
            </span>
          )}
          {!project.detailingMain && !project.detailingMisc && (
            <span className="text-sm text-gray-700 font-semibold uppercase tracking-normal">
              No Detailing scope defined.
            </span>
          )}
        </div>
      </div>

      {/* Project Scope Description */}
      {project.description && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-black uppercase tracking-wider mb-3">
            Project Scope
          </h4>
          <div
            className="text-black bg-white p-4 rounded-none prose prose-sm max-w-none font-medium"
            dangerouslySetInnerHTML={{
              __html: project.description
            }}
          />
        </div>
      )}
    </div>
  )
}

export default ProjectDetailsCard
