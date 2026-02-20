import { X } from 'lucide-react'
import DataTable from '../../ui/table'

const SubmittalListModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null

  const columns = [
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => <span className="font-medium text-gray-700">{row.original.subject}</span>
    },
    {
      accessorKey: 'project.name',
      header: 'Project',
      cell: ({ row }) => (
        <span className="text-gray-700">{row.original.project?.name || 'N/A'}</span>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isSubmitted = row.original.status === true
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
          >
            {isSubmitted ? 'Submitted to EOR' : 'Pending'}
          </span>
        )
      }
    },
    {
      accessorKey: 'approvalDate',
      header: 'Due Date',
      cell: ({ row }) => (
        <span className="text-gray-700">
          {row.original.approvalDate
            ? new Date(row.original.approvalDate).toLocaleDateString()
            : 'N/A'}
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
            <h3 className="text-xl  text-gray-700">Pending Submittals</h3>
            <p className="text-sm text-gray-700 mt-1">Showing {data.length} pending submittals</p>
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
            data={data}
            searchPlaceholder="Search submittals..."

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

export default SubmittalListModal
