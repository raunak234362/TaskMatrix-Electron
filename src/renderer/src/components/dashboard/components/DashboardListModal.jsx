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
            case 'UNAPPROVED_CHANGE_ORDERS': return { title: 'Unapproved Change Orders', icon: RefreshCw, color: 'text-red-600', iconBg: 'bg-red-100' }
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
            accessorKey: 'project',
            header: 'Project',
            cell: ({ row }) => (
                <span className="text-gray-800 font-bold truncate max-w-[280px] inline-block">
                    {row.original.Project?.name || row.original.project?.name || row.original.projectName || (typeof row.original.project === 'string' ? row.original.project : null) || '—'}
                </span>
            )
        },
        {
            accessorKey: 'changeOrderNumber',
            header: 'COR Number',
            cell: ({ row }) => (
                <span className="font-bold text-gray-800 whitespace-nowrap">
                    {row.original.changeOrderNumber || '—'}
                </span>
            )
        },
        {
            accessorKey: 'remarks',
            header: 'Subject',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium truncate max-w-[250px] inline-block">
                    {row.original.remarks || '—'}
                </span>
            )
        },
        {
            id: 'sentBy',
            header: 'Sent By',
            cell: ({ row }) => {
                const senderObj = row.original.senders || (typeof row.original.sender === 'object' ? row.original.sender : null);
                const senderName = senderObj 
                    ? `${senderObj.firstName || ''} ${senderObj.lastName || ''}`.trim() || senderObj.username || '—'
                    : '—';
                return (
                    <span className="text-gray-700 font-semibold truncate max-w-[200px] inline-block">
                        {senderName}
                    </span>
                );
            }
        },
        {
            id: 'sentTo',
            header: 'Sent To',
            cell: ({ row }) => {
                const recipients = row.original.multipleRecipients;
                if (!Array.isArray(recipients) || recipients.length === 0) {
                    return <span className="text-gray-400 font-medium">—</span>;
                }
                const names = recipients.map(r => `${r.firstName || ''} ${r.lastName || ''}`.trim() || r.username || 'Unknown').filter(Boolean);
                return (
                    <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={names.join(', ')}>
                        {names.join(', ')}
                    </span>
                );
            }
        },
        {
            accessorKey: 'stage',
            header: 'Stage',
            cell: ({ row }) => (
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
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
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${colorMap[status] || 'bg-blue-100 text-blue-700'}`}>
                        {status.replace(/_/g, ' ')}
                    </span>
                )
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '—'}
                </span>
            )
        }
    ].filter(col => !(activeTab === 'clientSide' && col.id === 'sentTo'))

    const defaultColumns = [
        {
            accessorKey: 'subject',
            header: 'Subject / Title',
            cell: ({ row }) => (
                <span className="font-semibold text-gray-800 truncate max-w-[250px] inline-block">
                    {row.original.subject || row.original.title || row.original.name || row.original.remarks || row.original.remark || 'No Subject'}
                </span>
            )
        },
        {
            accessorKey: 'project',
            header: 'Project',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium truncate max-w-[280px] inline-block">
                    {row.original.Project?.name || row.original.project?.name || row.original.projectName || (typeof row.original.project === 'string' ? row.original.project : null) || '—'}
                </span>
            )
        },
        {
            id: 'fabricator',
            header: 'Fabricator',
            cell: ({ row }) => (
                <span className="text-gray-600 font-medium truncate max-w-[200px] inline-block">
                    {row.original.Project?.fabricator?.fabName || row.original.project?.fabricator?.fabName || row.original.fabricator?.fabName || row.original.fabName || '—'}
                </span>
            )
        },
        {
            accessorKey: 'sender',
            header: 'Sent By',
            cell: ({ row }) => {
                const item = row.original.submittal || row.original.data || row.original;
                
                let senderObj = null;
                const possibleSenders = [item.senders, item.sender, item.createdBy, item.created_by, item.fabricator];
                for (const p of possibleSenders) {
                    if (p && typeof p === 'object') {
                        senderObj = p;
                        break;
                    }
                }
                if (!senderObj) {
                    for (const p of possibleSenders) {
                        if (p && typeof p === 'string') {
                            senderObj = p;
                            break;
                        }
                    }
                }

                let senderName = item.senderName || item.sender_name || '';
                
                if (!senderName && senderObj && typeof senderObj === 'object') {
                    senderName = `${senderObj.firstName || ''} ${senderObj.middleName || ''} ${senderObj.lastName || ''}`.replace(/\s+/g, ' ').trim() || senderObj.username || senderObj.fabName || senderObj.email || '';
                }
                if (!senderName && typeof senderObj === 'string') {
                    senderName = senderObj;
                }
                if (!senderName) {
                    const versions = item.versions || [];
                    for (const v of versions) {
                        let vSender = null;
                        const vPossibleSenders = [v.senders, v.sender, v.createdBy, v.created_by, v.fabricator];
                        for (const p of vPossibleSenders) {
                            if (p && typeof p === 'object') {
                                vSender = p;
                                break;
                            }
                        }
                        if (!vSender) {
                            for (const p of vPossibleSenders) {
                                if (p && typeof p === 'string') {
                                    vSender = p;
                                    break;
                                }
                            }
                        }

                        if (vSender && typeof vSender === 'object') {
                            const name = `${vSender.firstName || ''} ${vSender.middleName || ''} ${vSender.lastName || ''}`.replace(/\s+/g, ' ').trim() || vSender.username || vSender.fabName || vSender.email || '';
                            if (name) {
                                senderName = name;
                                break;
                            }
                        } else if (typeof vSender === 'string' && vSender) {
                            senderName = vSender;
                            break;
                        }
                    }
                }
                if (!senderName && (item.firstName || item.lastName || item.username || item.fabName)) {
                    senderName = `${item.firstName || ''} ${item.middleName || ''} ${item.lastName || ''}`.replace(/\s+/g, ' ').trim() || item.username || item.fabName || '';
                }
                return (
                    <span className="text-gray-700 font-semibold truncate max-w-[200px] inline-block">
                        {senderName || '—'}
                    </span>
                );
            }
        },
        {
            accessorKey: 'multipleRecipients',
            header: 'Sent To',
            cell: ({ row }) => {
                const item = row.original.submittal || row.original.data || row.original;
                
                let recipientName = item.recipientName || item.receipntName || item.recipient_name || item.recepientName || '';
                if (recipientName) {
                    return (
                        <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={recipientName}>
                            {recipientName}
                        </span>
                    );
                }

                const possibleRecs = [
                    item.multipleRecipients, 
                    item.recepients, 
                    item.recipients, 
                    item.Recipients,
                    item.recipient,
                    item.recepient
                ];
                
                // Try array of objects
                for (const p of possibleRecs) {
                    if (Array.isArray(p) && p.length > 0) {
                        const names = p.map(r => {
                            if (r && typeof r === 'object') {
                                return `${r.firstName || ''} ${r.middleName || ''} ${r.lastName || ''}`.replace(/\s+/g, ' ').trim() || r.username || r.email || r.fabName || 'Unknown';
                            }
                            return typeof r === 'string' ? r : '';
                        }).filter(Boolean);
                        if (names.length > 0) {
                            return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={names.join(', ')}>{names.join(', ')}</span>;
                        }
                    }
                }

                // Try single object
                for (const p of possibleRecs) {
                    if (p && typeof p === 'object' && !Array.isArray(p)) {
                        const name = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim() || p.username || p.email || p.fabName || 'Unknown';
                        return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={name}>{name}</span>;
                    }
                }

                // Check versions
                const versions = item.versions || [];
                for (const v of versions) {
                    const vPossible = [v.multipleRecipients, v.recepients, v.recipients, v.Recipients, v.recipient, v.recepient];
                    for (const p of vPossible) {
                        if (Array.isArray(p) && p.length > 0) {
                            const names = p.map(r => {
                                if (r && typeof r === 'object') {
                                    return `${r.firstName || ''} ${r.middleName || ''} ${r.lastName || ''}`.replace(/\s+/g, ' ').trim() || r.username || r.email || r.fabName || 'Unknown';
                                }
                                return typeof r === 'string' ? r : '';
                            }).filter(Boolean);
                            if (names.length > 0) {
                                return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={names.join(', ')}>{names.join(', ')}</span>;
                            }
                        }
                        if (p && typeof p === 'object' && !Array.isArray(p)) {
                            const name = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim() || p.username || p.email || p.fabName || 'Unknown';
                            return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={name}>{name}</span>;
                        }
                    }
                }

                // Check responses
                const resps = item.submittalsResponse || [];
                for (const r of resps) {
                    const rPossible = [r.multipleRecipients, r.recepients, r.recipients, r.Recipients, r.recipient, r.recepient];
                    for (const p of rPossible) {
                        if (Array.isArray(p) && p.length > 0) {
                            const names = p.map(rec => {
                                if (rec && typeof rec === 'object') {
                                    return `${rec.firstName || ''} ${rec.middleName || ''} ${rec.lastName || ''}`.replace(/\s+/g, ' ').trim() || rec.username || rec.email || rec.fabName || 'Unknown';
                                }
                                return typeof rec === 'string' ? rec : '';
                            }).filter(Boolean);
                            if (names.length > 0) {
                                return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={names.join(', ')}>{names.join(', ')}</span>;
                            }
                        }
                        if (p && typeof p === 'object' && !Array.isArray(p)) {
                            const name = `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.replace(/\s+/g, ' ').trim() || p.username || p.email || p.fabName || 'Unknown';
                            return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={name}>{name}</span>;
                        }
                    }
                }

                // Finally fall back to strings
                for (const p of possibleRecs) {
                    if (typeof p === 'string' && p) {
                        return <span className="text-gray-700 font-medium truncate max-w-[320px] inline-block" title={p}>{p}</span>;
                    }
                }

                return <span className="text-gray-400 font-medium">—</span>;
            }
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => {
                const rawStatus = row.original.wbtStatus || row.original.status

                if (type === 'PENDING_SUBMITTALS') {
                    const isPending = rawStatus === false || String(rawStatus).toUpperCase() === 'PENDING'
                    const statusText = typeof rawStatus === 'string' ? rawStatus : (isPending ? 'Pending' : 'Submitted to EOR')
                    
                    return (
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${isPending ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                            {statusText.replace(/_/g, ' ')}
                        </span>
                    )
                }

                if (type === 'PENDING_RFI') {
                    const isAnswered = rawStatus === false
                    return (
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {isAnswered ? 'Answered' : 'Pending'}
                        </span>
                    )
                }

                const statusStr = typeof rawStatus === 'string' ? rawStatus.toUpperCase() : 'PENDING'
                const colorMap = {
                    'NOT_REPLIED': 'bg-amber-100 text-amber-700',
                    'PENDING': 'bg-amber-100 text-amber-700',
                    'APPROVED': 'bg-green-100 text-green-700',
                    'REJECTED': 'bg-red-100 text-red-700',
                    'COMPLETED': 'bg-green-100 text-green-700',
                }
                return (
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${colorMap[statusStr] || 'bg-blue-100 text-blue-700'}`}>
                        {statusStr.replace(/_/g, ' ')}
                    </span>
                )
            }
        },
        {
            accessorKey: 'createdAt',
            header: 'Date',
            cell: ({ row }) => (
                <span className="text-xs text-gray-500 whitespace-nowrap">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() :
                        row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
                </span>
            )
        }
    ]

    const columns = type === 'CHANGE_ORDERS' ? changeOrderColumns : defaultColumns

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-white w-[96%] max-w-[1700px] h-[92vh] max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-100 animate-in zoom-in-95 duration-200">

                {/* Modal Header */}
                <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
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
                    <div className="flex px-8 pt-2 bg-white border-b border-gray-50 shrink-0">
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
                <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc]">
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
