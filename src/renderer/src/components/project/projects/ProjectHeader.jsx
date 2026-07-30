import React from 'react'

const ProjectHeader = ({
  project,
  userRole,
  archiving,
  handleArchiveProject,
  setShowAssistsModal,
  handleEditModel,
  onClose
}) => {
  if (!project) return null

  const isArchivingAllowed = [
    'admin',
    'deputy_manager',
    'project_manager_officer',
    'operation_executive'
  ].includes(userRole)

  const isEditAllowed = [
    'admin',
    'operation_executive',
    'dept_manager',
    'deputy_manager',
    'project_manager'
  ].includes(userRole)

  return (
    <div className="sticky top-0 z-30 bg-[#fcfdfc] flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-gray-100">
      <div>
        <div className="flex flex-wrap items-center gap-4">
          <h2 className="text-lg md:text-2xl font-semibold text-gray-900 tracking-tight uppercase">
            {project.name}
          </h2>
          {isArchivingAllowed && (
            <button
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
              onClick={handleArchiveProject}
              disabled={archiving}
            >
              {archiving ? 'Archiving...' : 'Archive'}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="px-6 py-1.5 bg-gray-200 text-black border border-gray-500 rounded-none font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center">
            PROJECT NO: {project.projectNumber || project.serialNo}
          </span>
          {project.stage && (
            <span className="px-6 py-1.5 bg-blue-50 text-blue-800 border border-blue-600/60 rounded-none font-bold text-sm uppercase tracking-tight inline-flex items-center justify-center">
              STAGE: {project.stage}
            </span>
          )}
          <span
            className={`px-6 py-1.5 border rounded-none font-bold text-sm uppercase tracking-tight inline-flex items-center justify-center ${
              project.status === 'ACTIVE'
                ? 'bg-green-50 text-green-800 border-green-600/60'
                : 'bg-red-50 text-red-800 border-red-600/60'
            }`}
          >
            STATUS: {project.status}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:mt-1">
        {isEditAllowed && (
          <>
            <button
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
              onClick={() => setShowAssistsModal(true)}
            >
              Add Assists
            </button>
            <button
              className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
              onClick={() => handleEditModel(project)}
            >
              Edit
            </button>
          </>
        )}

        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        )}
      </div>
    </div>
  )
}

export default ProjectHeader
