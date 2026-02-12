import { X } from 'lucide-react'
import DataTable from '../../ui/table'

const ProjectListModal = ({ isOpen, onClose, status, projects, onProjectSelect }) => {
  if (!isOpen) return null

  const columns = [
    {
      accessorKey: 'name',
      header: 'Project Name',
      cell: ({ row }) => <span className="font-medium text-gray-700">{row.original.name}</span>
    },
    {
      accessorKey: 'fabricator.name',
      header: 'Fabricator Name',
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.fabricator?.name || 'N/A'}</span>
      )
    },
    {
      accessorKey: 'stage',
      header: 'Stage',
      cell: ({ row }) => <span className="text-gray-700">{row.original.stage || 'N/A'}</span>
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-3 py-1 rounded-full text-xs  ${row.original.status === 'ACTIVE'
            ? 'bg-green-100 text-green-700'
            : row.original.status === 'COMPLETED'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-orange-100 text-orange-700'
            }`}
        >
          {row.original.status}
        </span>
      )
    }
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-[90%] max-w-[80%] max-h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-xl  text-gray-700 flex items-center gap-2">
              <div
                className={`w-2 h-6 rounded-full ${status.includes('ACTIVE') || status.includes('IFA')
                  ? 'bg-green-500'
                  : status.includes('COMPLETED') ||
                    status.includes('IFC') ||
                    status.includes('Done')
                    ? 'bg-blue-500'
                    : status.includes('ON_HOLD') ||
                      status.includes('CO#') ||
                      status.includes('On-Hold')
                      ? 'bg-orange-500'
                      : 'bg-gray-500'
                  }`}
              ></div>
              {status.replace('_', ' ')} Projects
            </h3>
            <p className="text-sm text-gray-700 mt-1">Showing {projects.length} projects</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DataTable
            columns={columns}
            data={projects}
            onRowClick={onProjectSelect}
            searchPlaceholder="Search projects..."

          />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors shadow-lg shadow-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProjectListModal
