import { X, FileText, ClipboardList, RefreshCw, Search } from 'lucide-react'
import { createPortal } from 'react-dom'
import DataTable from '../../ui/table'

const DashboardListModal = ({ isOpen, onClose, type, data = [], onItemSelect }) => {
    if (!isOpen) return null

    const getTitle = () => {
        switch (type) {
            case 'PENDING_RFI': return { title: 'Pending Action on RFIs', icon: FileText, color: 'text-amber-600', iconBg: 'bg-amber-100' }
            case 'PENDING_SUBMITTALS': return { title: 'Pending Action on Submittals', icon: ClipboardList, color: 'text-purple-600', iconBg: 'bg-purple-100' }
            case 'CHANGE_ORDERS': return { title: 'Pending Action on Change Orders', icon: RefreshCw, color: 'text-rose-600', iconBg: 'bg-rose-100' }
            case 'PENDING_RFQ': return { title: 'Pending Action on RFQ ', icon: Search, color: 'text-cyan-600', iconBg: 'bg-cyan-100' }
            default: return { title: 'Items', icon: FileText, color: 'text-gray-600', iconBg: 'bg-gray-100' }
        }
    }

    const headerInfo = getTitle()

    const columns = [
        {
            accessorKey: 'subject',
            header: 'Subject / Title',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800">
                    {row.original.subject || row.original.title || row.original.name || 'No Subject'}
                </span>
            )
        },
        {
            accessorKey: 'project.name',
            header: 'Project',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium">
                    {row.original.project?.name || 'N/A'}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                if (type === 'PENDING_SUBMITTALS') {
                    const isSubmitted = row.original.status === true
                    return (
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${isSubmitted ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                            }`}>
                            {isSubmitted ? 'Pending' : 'Submitted to EOR'}
                        </span>
                    )
                }

                const status = row.original.status || 'PENDING'
                return (
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                            'bg-blue-100 text-blue-700'
                        }`}>
                        {status}
                    </span>
                )
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() :
                        row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
                </span>
            )
        }
    ]

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-5xl max-h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl ${headerInfo.iconBg} ${headerInfo.color}`}>
                            <headerInfo.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl  text-gray-800 tracking-tight">
                                {headerInfo.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-500">
                                You have <span className="text-gray-800 ">{data.length}</span> items requiring attention
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-red-100 border border-red-600 text-black font-bold rounded-xl transition-all hover:bg-red-200 active:scale-95 uppercase text-xs tracking-widest"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-hidden p-8 bg-[#fcfcfc]">
                    <DataTable
                        columns={columns}
                        data={data}
                        searchPlaceholder={`Filter ${headerInfo.title.toLowerCase()}...`}

                        onRowClick={(row) => {
                            // Pass the full row data to the parent
                            if (onItemSelect) onItemSelect(row);
                        }}
                    />
                </div>

                {/* Modal Footer */}
                
            </div>
        </div>,
        document.body
    )
}

export default DashboardListModal
