import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import GetProjectById from '../../project/GetProjectById'

const ProjectDetailsModal = ({ project, onClose }) => {
  if (!project) return null

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full md:w-[90vw] max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <GetProjectById id={project.id} onClose={onClose} />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default ProjectDetailsModal
