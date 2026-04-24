import { useState } from 'react'
import { X, FileText, ClipboardList, RefreshCw, Search } from 'lucide-react'
import { createPortal } from 'react-dom'
import DataTable from '../../ui/table'

const DashboardListModal = ({ isOpen, onClose, type, data = { wbt: [], clientSide: [] }, onItemSelect }) => {
    const [activeTab, setActiveTab] = useState('wbt')
    const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
    const showTabs = ['admin', 'deputy_manager', 'operation_executive', 'dept_manager', 'project_manager'].includes(userRole)

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

    // Handle both old array format and new object format
    const isSegmented = showTabs && !Array.isArray(data) && (data.wbt || data.clientSide)
    const effectiveData = isSegmented ? (data[activeTab] || []) : (data || [])
    const totalCount = isSegmented ? (data.wbt.length + data.clientSide.length) : data.length

    const changeOrderColumns = [
        {
            accessorKey: 'serialNo',
            header: 'Serial No',
            cell: ({ row }) => (
                <span className="font-semibold text-blue-700 text-xs tracking-wide">
                    {row.original.serialNo || '—'}
                </span>
            )
        },
        {
            accessorKey: 'changeOrderNumber',
            header: 'CO Number',
            cell: ({ row }) => (
                <span className="font-bold text-gray-800">
                    {row.original.changeOrderNumber || '—'}
                </span>
            )
        },
        {
            accessorKey: 'remarks',
            header: 'Remarks',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium">
                    {row.original.remarks || '—'}
                </span>
            )
        },
        {
            accessorKey: 'project',
            header: 'Project',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium truncate max-w-[150px] inline-block">
                    {row.original.Project?.name || row.original.project?.name || row.original.project || '—'}
                </span>
            )
        },
        {
            accessorKey: 'stage',
            header: 'Stage',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {row.original.stage || '—'}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const status = row.original.status || 'PENDING'
                const colorMap = {
                    'NOT_REPLIED': 'bg-amber-100 text-amber-700',
                    'PENDING': 'bg-amber-100 text-amber-700',
                    'APPROVED': 'bg-green-100 text-green-700',
                    'REJECTED': 'bg-red-100 text-red-700',
                    'COMPLETED': 'bg-green-100 text-green-700',
                }
                return (
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${colorMap[status] || 'bg-blue-100 text-blue-700'}`}>
                        {status.replace(/_/g, ' ')}
                    </span>
                )
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}
                </span>
            )
        }
    ]

    const defaultColumns = [
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
                    {row.original.Project?.name || row.original.project?.name || row.original.project || 'N/A'}
                </span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const rawStatus = row.original.status

                if (type === 'PENDING_SUBMITTALS') {
                    const isSubmitted = rawStatus === false
                    return (
                        <span className={`text-[10px] uppercase font-bold tracking-wider`}>
                            {isSubmitted ? 'Pending' : 'Submitted to EOR'}
                        </span>
                    )
                }

                if (type === 'PENDING_RFI') {
                    const isAnswered = rawStatus === false
                    return (
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isAnswered ? 'Answered' : 'Pending'}
                        </span>
                    )
                }

                const status = rawStatus || 'PENDING'
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

    const columns = type === 'CHANGE_ORDERS' ? changeOrderColumns : defaultColumns

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-7xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${headerInfo.iconBg} ${headerInfo.color}`}>
                            <headerInfo.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 tracking-tight">
                                {headerInfo.title}
                            </h3>
                            <p className="text-sm font-medium text-gray-500">
                                Total <span className="text-gray-800 font-bold">{totalCount}</span> items requiring attention
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {isSegmented && (
                    <div className="flex px-8 pt-4 bg-white border-b border-gray-50">
                        <button
                            onClick={() => setActiveTab('wbt')}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'wbt'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            WBT Side ({data.wbt.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('clientSide')}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'clientSide'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Client Side ({data.clientSide.length})
                        </button>
                    </div>
                )}

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto min-h-[50vh] p-8 bg-[#fcfcfc]">
                    <DataTable
                        columns={columns}
                        data={effectiveData}
                        searchPlaceholder={`Filter ${headerInfo.title.toLowerCase()}...`}
                        onRowClick={(row) => {
                            if (onItemSelect) onItemSelect(row);
                        }}
                    />
                </div>
            </div>
        </div>,
        document.body
    )
}

export default DashboardListModal
