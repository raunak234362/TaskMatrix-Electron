import { useState, useMemo, useEffect, useRef } from 'react'
import { X, FileText, ClipboardList, RefreshCw, Search, ChevronDown } from 'lucide-react'
import { createPortal } from 'react-dom'
import DataTable from '../../ui/table'

const PendingActionList = ({ isOpen, onClose, type, data = { wbt: [], clientSide: [] }, clientSideCount, onItemSelect }) => {
    const [activeTab, setActiveTab] = useState('')
    const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
    const showTabs = ['admin', 'deputy_manager', 'operation_executive', 'dept_manager', 'project_manager'].includes(userRole)

    // Filter and sort states
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedFabricator, setSelectedFabricator] = useState('ALL FABRICATORS')
    const [selectedStatus, setSelectedStatus] = useState('All Statuses')
    const [selectedStage, setSelectedStage] = useState('All Stages')
    const [sortBy, setSortBy] = useState('date_desc')

    // Fabricator dropdown states
    const [fabSearchQuery, setFabSearchQuery] = useState('')
    const [isFabDropdownOpen, setIsFabDropdownOpen] = useState(false)
    const fabDropdownRef = useRef(null)

    // Close fabricator dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (fabDropdownRef.current && !fabDropdownRef.current.contains(event.target)) {
                setIsFabDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isOpen) return null

    const getTitle = () => {
        switch (type) {
            case 'PENDING_RFI': return { title: 'Pending Action on RFIs', icon: FileText, color: 'text-amber-600', iconBg: 'bg-amber-100' }
            case 'PENDING_SUBMITTALS': return { title: 'Pending Action on Submittals', icon: ClipboardList, color: 'text-purple-600', iconBg: 'bg-purple-100' }
            case 'CHANGE_ORDERS': return { title: 'Pending Action on Change Orders', icon: RefreshCw, color: 'text-rose-600', iconBg: 'bg-rose-100' }
            case 'PENDING_RFQ': return { title: 'Pending Action on RFQ ', icon: Search, color: 'text-cyan-600', iconBg: 'bg-cyan-100' }
            case 'UNAPPROVED_CHANGE_ORDERS': return { title: 'Unapproved Change Orders', icon: RefreshCw, color: 'text-red-600', iconBg: 'bg-red-100' }
            case 'PENDING_APPROVALS': return { title: 'Pending Approvals', icon: FileText, color: 'text-purple-600', iconBg: 'bg-purple-100' }
            default: return { title: 'Items', icon: FileText, color: 'text-gray-600', iconBg: 'bg-gray-100' }
        }
    }

    const headerInfo = getTitle()

    // Handle both old array format and new object format
    const isWbtSegmented = showTabs && !Array.isArray(data) && (data.wbt || data.clientSide)
    const isApprovalSegmented = !Array.isArray(data) && type === 'PENDING_APPROVALS'
    const displayedClientCount = clientSideCount != null && Number.isFinite(Number(clientSideCount))
        ? Number(clientSideCount)
        : (data.clientSide?.length || 0)

    const currentTab = activeTab || (isWbtSegmented ? 'wbt' : isApprovalSegmented ? 'RFI' : '')
    const effectiveData = useMemo(() => {
        const raw = isWbtSegmented || isApprovalSegmented ? (data[currentTab] || []) : (data || [])
        return Array.isArray(raw) ? raw : []
    }, [data, currentTab, isWbtSegmented, isApprovalSegmented])

    const totalCount = isWbtSegmented ? ((data.wbt?.length || 0) + displayedClientCount)
        : isApprovalSegmented ? ((data.RFI?.length || 0) + (data.Submittals?.length || 0) + (data.ChangeOrder?.length || 0))
            : (Array.isArray(data) ? data.length : 0)

    // Helper extractors
    const getProjectName = (item) => {
        return (
            item?.Project?.name ||
            item?.project?.name ||
            item?.projectName ||
            (typeof item?.project === 'string' ? item.project : '') ||
            ''
        )
    }

    const getFabricatorName = (item) => {
        return (
            item?.Project?.fabricator?.fabName ||
            item?.project?.fabricator?.fabName ||
            item?.fabricator?.fabName ||
            item?.Project?.fabricator?.name ||
            item?.project?.fabricator?.name ||
            item?.fabricator?.name ||
            item?.fabName ||
            item?.fabricatorName ||
            ''
        )
    }

    const getStageName = (item) => {
        return item?.stage || item?.Project?.stage || item?.project?.stage || ''
    }

    const getStatusName = (item) => {
        const rawStatus = item?.wbtStatus ?? item?.status
        if (type === 'PENDING_SUBMITTALS') {
            const isPending = rawStatus === false || String(rawStatus).toUpperCase() === 'PENDING'
            return isPending ? 'PENDING' : 'SUBMITTED_TO_EOR'
        }
        if (type === 'PENDING_RFI') {
            const isAnswered = rawStatus === false
            return isAnswered ? 'ANSWERED' : 'PENDING'
        }
        if (typeof rawStatus === 'string') return rawStatus.toUpperCase()
        return rawStatus ? String(rawStatus).toUpperCase() : 'PENDING'
    }

    const getDateValue = (item) => {
        const d = item?.createdAt || item?.date || item?.created_at || item?.updatedAt
        return d ? new Date(d).getTime() : 0
    }

    // Fabricator options
    const fabricatorOptions = useMemo(() => {
        const set = new Set()
        effectiveData.forEach((item) => {
            const fab = getFabricatorName(item)
            if (fab && fab !== '—' && fab !== 'N/A') set.add(fab)
        })
        return ['ALL FABRICATORS', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    }, [effectiveData])

    const filteredFabricatorOptions = useMemo(() => {
        if (!fabSearchQuery.trim()) return fabricatorOptions
        const q = fabSearchQuery.toLowerCase().trim()
        return fabricatorOptions.filter((f) => f.toLowerCase().includes(q))
    }, [fabricatorOptions, fabSearchQuery])

    // Status options
    const statusOptions = useMemo(() => {
        const set = new Set()
        effectiveData.forEach((item) => {
            const st = getStatusName(item)
            if (st) set.add(st)
        })
        return ['All Statuses', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    }, [effectiveData, type])

    // Stage options
    const stageOptions = useMemo(() => {
        const set = new Set()
        effectiveData.forEach((item) => {
            const stg = getStageName(item)
            if (stg && stg !== '—' && stg !== 'N/A') set.add(stg)
        })
        if (set.size === 0) return []
        return ['All Stages', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
    }, [effectiveData])

    // Filtered and sorted data
    const filteredAndSortedData = useMemo(() => {
        const result = effectiveData.filter((item) => {
            // 1. Search term
            if (searchTerm.trim()) {
                const q = searchTerm.toLowerCase().trim()
                const proj = getProjectName(item).toLowerCase()
                const fab = getFabricatorName(item).toLowerCase()
                const subj = (
                    item.subject ||
                    item.title ||
                    item.name ||
                    item.remarks ||
                    item.remark ||
                    ''
                ).toLowerCase()
                const num = (
                    item.changeOrderNumber ||
                    item.rfiNumber ||
                    item.serialNo ||
                    item.number ||
                    ''
                ).toLowerCase()

                const senderObj = item.senders || (typeof item.sender === 'object' ? item.sender : null)
                const senderName = (
                    item.senderName ||
                    item.sender_name ||
                    (senderObj ? `${senderObj.firstName || ''} ${senderObj.lastName || ''}` : '')
                ).toLowerCase()

                if (
                    !proj.includes(q) &&
                    !fab.includes(q) &&
                    !subj.includes(q) &&
                    !num.includes(q) &&
                    !senderName.includes(q)
                ) {
                    return false
                }
            }

            // 2. Fabricator
            if (
                selectedFabricator &&
                selectedFabricator !== 'ALL FABRICATORS' &&
                selectedFabricator !== 'All Fabricators'
            ) {
                const fab = getFabricatorName(item).toLowerCase()
                if (fab !== selectedFabricator.toLowerCase()) {
                    return false
                }
            }

            // 3. Status
            if (
                selectedStatus &&
                selectedStatus !== 'All Statuses' &&
                selectedStatus !== 'ALL STATUSES'
            ) {
                const st = getStatusName(item).toLowerCase()
                if (st !== selectedStatus.toLowerCase()) {
                    return false
                }
            }

            // 4. Stage
            if (
                selectedStage &&
                selectedStage !== 'All Stages' &&
                selectedStage !== 'ALL STAGES'
            ) {
                const stg = getStageName(item).toLowerCase()
                if (stg !== selectedStage.toLowerCase()) {
                    return false
                }
            }

            return true
        })

        // Sorting
        return [...result].sort((a, b) => {
            if (sortBy === 'date_asc') {
                return getDateValue(a) - getDateValue(b)
            }
            if (sortBy === 'date_desc') {
                return getDateValue(b) - getDateValue(a)
            }
            if (sortBy === 'project_asc') {
                return getProjectName(a).localeCompare(getProjectName(b))
            }
            if (sortBy === 'project_desc') {
                return getProjectName(b).localeCompare(getProjectName(a))
            }
            if (sortBy === 'fabricator_asc') {
                return getFabricatorName(a).localeCompare(getFabricatorName(b))
            }
            if (sortBy === 'status') {
                return getStatusName(a).localeCompare(getStatusName(b))
            }
            return 0
        })
    }, [effectiveData, searchTerm, selectedFabricator, selectedStatus, selectedStage, sortBy, type])

    const hasActiveFilters =
        Boolean(searchTerm.trim()) ||
        (selectedFabricator !== 'ALL FABRICATORS' && selectedFabricator !== 'All Fabricators') ||
        (selectedStatus !== 'All Statuses' && selectedStatus !== 'ALL STATUSES') ||
        (selectedStage !== 'All Stages' && selectedStage !== 'ALL STAGES') ||
        sortBy !== 'date_desc'

    const handleClearFilters = () => {
        setSearchTerm('')
        setSelectedFabricator('ALL FABRICATORS')
        setSelectedStatus('All Statuses')
        setSelectedStage('All Stages')
        setSortBy('date_desc')
        setFabSearchQuery('')
    }

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
                <span className="font-semibold text-black truncate max-w-[250px] inline-block">
                    {row.original.subject || row.original.title || row.original.name || row.original.remarks || row.original.remark || 'No Subject'}
                </span>
            )
        },
        {
            accessorKey: 'project',
            header: 'Project',
            cell: ({ row }) => (
                <span className="text-black font-medium truncate max-w-[280px] inline-block">
                    {row.original.Project?.name || row.original.project?.name || row.original.projectName || (typeof row.original.project === 'string' ? row.original.project : null) || '—'}
                </span>
            )
        },
        {
            id: 'fabricator',
            header: 'Fabricator',
            cell: ({ row }) => (
                <span className="text-black font-medium truncate max-w-[200px] inline-block">
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
                    <span className="text-black font-medium truncate max-w-[200px] inline-block">
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
                        <span className="text-black font-medium truncate max-w-[320px] inline-block" title={recipientName}>
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
                        <span className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${isAnswered ? 'Answered' : 'Pending'} ${isAnswered ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
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
                <span className="text-sm text-black whitespace-nowrap">
                    {row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() :
                        row.original.date ? new Date(row.original.date).toLocaleDateString() : 'N/A'}
                </span>
            )
        }
    ].filter(col => {
        if (type === 'PENDING_RFQ') {
            return !['subject', 'multipleRecipients'].includes(col.accessorKey)
        }

        return true
    })

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
                                {filteredAndSortedData.length !== effectiveData.length && (
                                    <span className="ml-1 text-green-700 font-semibold">
                                        (Showing {filteredAndSortedData.length} filtered)
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                {isWbtSegmented && (
                    <div className="flex px-8 pt-2 bg-white border-b border-gray-50 shrink-0">
                        <button
                            onClick={() => {
                                setActiveTab('wbt')
                                setIsFabDropdownOpen(false)
                            }}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 cursor-pointer ${currentTab === 'wbt'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            WBT Side ({data.wbt?.length || 0})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('clientSide')
                                setIsFabDropdownOpen(false)
                            }}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 cursor-pointer ${currentTab === 'clientSide'
                                ? 'border-green-600 text-green-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Client Side ({displayedClientCount})
                        </button>
                    </div>
                )}
                {isApprovalSegmented && (
                    <div className="flex px-8 pt-2 bg-white border-b border-gray-50 shrink-0">
                        <button
                            onClick={() => {
                                setActiveTab('RFI')
                                setIsFabDropdownOpen(false)
                            }}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 cursor-pointer ${currentTab === 'RFI'
                                ? 'border-purple-600 text-purple-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            RFI ({data.RFI?.length || 0})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('Submittals')
                                setIsFabDropdownOpen(false)
                            }}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 cursor-pointer ${currentTab === 'Submittals'
                                ? 'border-purple-600 text-purple-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Submittals ({data.Submittals?.length || 0})
                        </button>
                        <button
                            onClick={() => {
                                setActiveTab('ChangeOrder')
                                setIsFabDropdownOpen(false)
                            }}
                            className={`px-6 py-3 text-sm font-black uppercase tracking-widest transition-all border-b-4 cursor-pointer ${currentTab === 'ChangeOrder'
                                ? 'border-purple-600 text-purple-700'
                                : 'border-transparent text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Change Orders ({data.ChangeOrder?.length || 0})
                        </button>
                    </div>
                )}

                {/* Filters Bar matching Snapshot Style */}
                <div className="px-8 py-3.5 border-b border-gray-100 bg-white shrink-0">
                    <div className="flex flex-wrap items-end gap-5">
                        {/* Search Input */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[240px]">
                            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                                Search
                            </label>
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="text"
                                    placeholder="Search by project, subject, name..."
                                    className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md pl-9 pr-3 py-2 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all placeholder:text-gray-500 placeholder:font-normal shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Fabricator Filter with Search Combobox */}
                        <div
                            className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[220px] relative"
                            ref={fabDropdownRef}
                        >
                            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                                Fabricator
                            </label>
                            <div
                                onClick={() => setIsFabDropdownOpen((prev) => !prev)}
                                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none hover:border-gray-400 transition-all shadow-sm flex items-center justify-between"
                            >
                                <span className="truncate">{selectedFabricator || 'ALL FABRICATORS'}</span>
                                <ChevronDown size={16} className="text-gray-500 shrink-0 ml-2" />
                            </div>

                            {isFabDropdownOpen && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 overflow-hidden flex flex-col max-h-60 min-w-[220px]">
                                    <div className="p-2 border-b border-gray-200 bg-gray-50 sticky top-0">
                                        <div className="relative">
                                            <Search
                                                size={14}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search fabricator..."
                                                className="w-full text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded pl-8 pr-2 py-1.5 focus:outline-none focus:border-green-600"
                                                value={fabSearchQuery}
                                                onChange={(e) => setFabSearchQuery(e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="overflow-y-auto max-h-48 py-1">
                                        {filteredFabricatorOptions.length > 0 ? (
                                            filteredFabricatorOptions.map((f) => (
                                                <div
                                                    key={f}
                                                    onClick={() => {
                                                        setSelectedFabricator(f)
                                                        setIsFabDropdownOpen(false)
                                                    }}
                                                    className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-green-50 hover:text-green-700 transition-colors ${
                                                        selectedFabricator === f
                                                            ? 'bg-green-100 text-green-800 font-semibold'
                                                            : 'text-gray-700'
                                                    }`}
                                                >
                                                    {f}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 italic">
                                                No fabricators found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[170px]">
                            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                                Status
                            </label>
                            <select
                                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                            >
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stage Filter (if available) */}
                        {stageOptions.length > 0 && (
                            <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[160px]">
                                <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                                    Stage
                                </label>
                                <select
                                    className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
                                    value={selectedStage}
                                    onChange={(e) => setSelectedStage(e.target.value)}
                                >
                                    {stageOptions.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Sort By Dropdown */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-auto min-w-[170px]">
                            <label className="text-xs font-semibold text-gray-800 uppercase tracking-normal">
                                Sort By
                            </label>
                            <select
                                className="w-full text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-md px-3 py-2 cursor-pointer focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600 hover:border-gray-400 transition-all shadow-sm"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="date_desc">Newest First</option>
                                <option value="date_asc">Oldest First</option>
                                <option value="project_asc">Project (A-Z)</option>
                                <option value="project_desc">Project (Z-A)</option>
                                <option value="fabricator_asc">Fabricator (A-Z)</option>
                                <option value="status">Status</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-green-50 text-black border border-green-700/80 rounded-md hover:bg-green-100 transition-all font-semibold text-xs uppercase tracking-normal shadow-sm flex items-center gap-1.5 h-[38px] cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" /> Clear Filters
                            </button>
                        )}
                    </div>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-[#fcfcfc]">
                    <DataTable
                        columns={columns}
                        data={filteredAndSortedData}
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

export default PendingActionList
