import { useState } from 'react'
import { AllNotes } from '../components'
import { useSelector } from 'react-redux'

const NotesPage = () => {
  const projects = useSelector((state) => state.projectInfo?.projectData || [])
  const [selectedProjectId, setSelectedProjectId] = useState('')

  return (
    <div className="p-4">
      <h1 className="text-2xl  mb-4">Project Notes</h1>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Project</label>
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          className="w-full md:w-1/3 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">Select a project to view notes</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} ({project.projectNumber})
            </option>
          ))}
        </select>
      </div>

      {selectedProjectId ? (
        <AllNotes projectId={selectedProjectId} />
      ) : (
        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <p className="text-gray-500">Please select a project to view or add notes.</p>
        </div>
      )}
    </div>
  )
}

export default NotesPage
