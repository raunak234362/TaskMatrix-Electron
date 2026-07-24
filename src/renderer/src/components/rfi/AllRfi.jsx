import { useEffect, useState } from 'react'
import DataTable from '../ui/table'

import { useSelector } from 'react-redux'
import { Loader2, Inbox, MessageSquare, Search } from 'lucide-react'
import GetRFIByID from './GetRFIByID'
import Modal from '../ui/Modal'
import AddCommunication from '../communication/AddCommunication'
import Service from '../../api/Service'

const AllRFI = ({ rfiData, onUpdate }) => {
  const [rfis, setRFIs] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [prefilledData, setPrefilledData] = useState(null)

  const projects = useSelector((state) => state.projectInfo?.projectData || [])
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || [])
  const users = useSelector((state) => state.userInfo?.staffData || [])

  const userRole = sessionStorage.getItem('userRole') || ''
  const userRoleUpper = userRole.toUpperCase()

  const isClient = ['CLIENT', 'CLIENT_ADMIN', 'CLIENT_ESTIMATOR'].includes(userRoleUpper)
  const isConnectionDesigner = userRoleUpper.includes('CONNECTION_DESIGNER') || userRoleUpper.includes('CD_')
  const isWBTStaff = !isClient && !isConnectionDesigner

  const [activeTab, setActiveTab] = useState(
    isConnectionDesigner ? 'CONNECTION_DESIGNER' : 'GENERAL'
  )
  const [cdFilter, setCdFilter] = useState('sent')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRFIs = async () => {
    try {
      setLoading(true)
      const [sentRes, receivedRes] = await Promise.all([Service.RfiSent(), Service.RfiRecieved()])

      let sentArray = []
      if (sentRes) {
        if (Array.isArray(sentRes)) {
          sentArray = sentRes
        } else if (Array.isArray(sentRes['show rfi'])) {
          sentArray = sentRes['show rfi']
        } else if (Array.isArray(sentRes.data)) {
          sentArray = sentRes.data
        } else if (typeof sentRes === 'object') {
          const firstArray = Object.values(sentRes).find(Array.isArray)
          if (firstArray) sentArray = firstArray
        }
      }

      let receivedArray = []
      if (receivedRes) {
        if (Array.isArray(receivedRes)) {
          receivedArray = receivedRes
        } else if (Array.isArray(receivedRes['show rfi'])) {
          receivedArray = receivedRes['show rfi']
        } else if (Array.isArray(receivedRes.data)) {
          receivedArray = receivedRes.data
        } else if (typeof receivedRes === 'object') {
          const firstArray = Object.values(receivedRes).find(Array.isArray)
          if (firstArray) receivedArray = firstArray
        }
      }

      const normalizedSent = sentArray.map((item) => ({
        ...item,
        createdAt: item.createdAt || item.date || null,
        _flowType: 'sent'
      }))

      const normalizedReceived = receivedArray.map((item) => ({
        ...item,
        createdAt: item.createdAt || item.date || null,
        _flowType: 'received'
      }))

      const combined = [...normalizedSent]
      normalizedReceived.forEach((item) => {
        if (!combined.some((c) => c.id === item.id)) {
          combined.push(item)
        }
      })

      setRFIs(combined)
    } catch (error) {
      console.error('Error fetching RFIs:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (rfiData === undefined) {
      fetchRFIs()
    } else {
      let rfiArray = []
      if (Array.isArray(rfiData)) {
        rfiArray = rfiData
      } else if (rfiData && rfiData['show rfi']) {
        rfiArray = rfiData['show rfi']
      } else if (rfiData && rfiData.data) {
        rfiArray = rfiData.data
      } else if (rfiData && typeof rfiData === 'object') {
        const firstArray = Object.values(rfiData).find(Array.isArray)
        if (firstArray) rfiArray = firstArray
      }

      if (rfiArray.length > 0) {
        let normalized = rfiArray.map((item) => ({
          ...item,
          createdAt: item.createdAt || item.date || null
        }))
        setRFIs(normalized)
      } else {
        setRFIs([])
      }
      setLoading(false)
    }
  }, [rfiData, userRole])

  // const handleRowClick = (row) => {
  //   // setSelectedRfiID(row.id);
  // };

  // ✅ Define columns
  const columns = [
    { accessorKey: 'subject', header: 'Subject' },
    {
      accessorKey: 'sender',
      header: 'Sender',
      cell: ({ row }) => {
        const s = row.original.sender
        return s
          ? `${s.firstName ?? ''} ${s.middleName ?? ''} ${s.lastName ?? ''}`.trim() ||
              s.username ||
              '—'
          : '—'
      }
    },
    {
      accessorKey: 'multipleRecipients',
      header: 'To',
      cell: ({ row }) => {
        const recipients = row.original.multipleRecipients
        if (!recipients || recipients.length === 0) return '—'
        return (
          recipients
            .map((r) => `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim() || r.email)
            .filter(Boolean)
            .join(', ') || '—'
        )
      }
    }
  ]

  const getStatusInfo = (item) => {
    // If the RFI itself has a wbtStatus, use it directly (this is the most accurate)
    if (item.wbtStatus) {
      const statusStr = String(item.wbtStatus).toUpperCase()
      switch (statusStr) {
        case 'OPEN':
        case 'PENDING':
          return { label: statusStr, className: 'bg-blue-100 text-black shadow-sm' }
        case 'SENT':
          return { label: 'SENT', className: 'bg-purple-100 text-black shadow-sm' }
        case 'RECEIVED':
          return { label: 'RECEIVED', className: 'bg-teal-100 text-black shadow-sm' }
        case 'COMPLETE':
        case 'ANSWERED':
          return { label: statusStr, className: 'bg-green-100 text-black shadow-sm' }
        case 'PARTIAL':
          return { label: 'PARTIAL', className: 'bg-orange-100 text-black shadow-sm' }
        default:
          return { label: statusStr, className: 'bg-gray-100 text-black shadow-sm' }
      }
    }

    const responses = item.rfiresponse || []
    if (responses.length > 0) {
      const sorted = [...responses].sort(
        (a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)
      )
      const latest = sorted[0]
      const rfiStatus = latest.wbtStatus || latest.status
      if (rfiStatus) {
        const statusStr = rfiStatus.toUpperCase()
        switch (statusStr) {
          case 'OPEN':
            return { label: 'OPEN', className: 'bg-blue-100 text-black shadow-sm' }
          case 'PARTIAL':
            return { label: 'PARTIAL', className: 'bg-orange-100 text-black shadow-sm' }
          case 'COMPLETE':
            return { label: 'COMPLETE', className: 'bg-green-100 text-black shadow-sm' }
          default:
            return { label: statusStr, className: 'bg-gray-100 text-black shadow-sm' }
        }
      }
    }

    // Fallback if no responses exist and no wbtStatus
    if (item.status === false || item.status === 'OPEN' || item.status === 'PENDING') {
      return { label: 'PENDING', className: 'bg-green-100 text-black shadow-sm' }
    } else {
      return { label: 'ANSWERED', className: 'bg-orange-100 text-black shadow-sm' }
    }
  }

  columns.push(
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const statusInfo = getStatusInfo(row.original)
        return (
          <span
            className={`px-3 py-1 text-sm font-black uppercase tracking-normal rounded-full border border-black ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) =>
        row.original.createdAt
          ? new Date(row.original.createdAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })
          : '—'
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            const item = row.original
            setPrefilledData({
              projectId: item.project?.id || item.project || '',
              fabricatorId: item.fabricator?.id || item.fabricator || '',
              clientId: item.client?.id || item.client || '',
              subject: `Follow-up: ${item.subject || ''}`,
              notes: `Ref: RFI ${item.subject || ''}`
            })
            setIsFollowUpOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors shadow-sm tracking-normal"
          title="Create Follow-up"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Follow-up
        </button>
      )
    }
  )

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-700">
        <Loader2 className="w-6 h-6 animate-spin mb-2" />
        Loading RFIs...
      </div>
    )
  }

  const isCDRole = (roleStr) => {
    if (!roleStr) return false
    const r = String(roleStr).toUpperCase()
    return r.includes('CONNECTION_DESIGNER') || r.includes('CD_') || r === 'CD'
  }

  const isCDUser = (user) => {
    if (!user) return false

    const currentUserId = sessionStorage.getItem('userId')
    const userId = typeof user === 'object' ? user.id || user._id || user.sender_id : user

    if (userId && String(userId) === String(currentUserId)) {
      const currentUserRole = sessionStorage.getItem('userRole') || ''
      if (currentUserRole) {
        const role = currentUserRole.toUpperCase()
        if (role.includes('CONNECTION_DESIGNER') || role.includes('CD_')) return true
      }
    }

    let role = ''
    if (typeof user === 'object') {
      role = String(user.role || '').toUpperCase()
    }
    if (role) return isCDRole(role)

    if (!role && userId) {
      const matchedUser = users.find((u) => String(u.id || u._id) === String(userId))
      role = String(matchedUser?.role || '').toUpperCase()
    }

    return isCDRole(role)
  }

  const isClientUser = (user) => {
    if (!user) return false

    const currentUserId = sessionStorage.getItem('userId')
    const userId = typeof user === 'object' ? user.id || user._id || user.sender_id : user

    if (userId && String(userId) === String(currentUserId)) {
      const currentUserRole = sessionStorage.getItem('userRole') || ''
      if (currentUserRole) {
        const role = currentUserRole.toUpperCase()
        if (role.includes('CLIENT')) return true
      }
    }

    let role = ''
    if (typeof user === 'object') {
      role = String(user.role || '').toUpperCase()
    }

    if (!role && userId) {
      const matchedUser = users.find((u) => String(u.id || u._id) === String(userId))
      role = String(matchedUser?.role || '').toUpperCase()
    }

    return role.includes('CLIENT')
  }

  const getRFIFlowType = (item) => {
    if (item._flowType) return item._flowType

    const currentUserId = sessionStorage.getItem('userId')
    const senderId = String(item.sender?.id || item.sender_id || item.sender || '')
    const isSenderCurrentUser = senderId === String(currentUserId)

    if (isConnectionDesigner) {
      return isSenderCurrentUser ? 'sent' : 'received'
    }

    if (isClient) {
      return isSenderCurrentUser ? 'sent' : 'received'
    }

    if (isWBTStaff) {
      const isCD_RFI = isConnectionDesignerRFI(item)
      if (isCD_RFI) {
        const isSenderCD = item.sender && isCDUser(item.sender)
        return isSenderCD ? 'received' : 'sent'
      } else {
        const isSenderClient = item.sender && isClientUser(item.sender)
        return isSenderClient ? 'received' : 'sent'
      }
    }

    return 'received'
  }

  const isConnectionDesignerRFI = (item) => {
    if (!item) return false
    const isCDFlag =
      item.isConnectionDesign === true || String(item.isConnectionDesign).toLowerCase() === 'true'
    if (isCDFlag) return true

    if (item.sender && isCDUser(item.sender)) return true

    if (item.recepients && isCDUser(item.recepients)) return true

    if (Array.isArray(item.multipleRecipients) && item.multipleRecipients.some(isCDUser))
      return true

    return false
  }

  const generalRfis = rfis.filter((item) => {
    if (isConnectionDesignerRFI(item)) return false
    if (isClient) return true
    return getRFIFlowType(item) === cdFilter
  })

  const connectionDesignerRfis = rfis.filter((item) => {
    if (!isConnectionDesignerRFI(item)) return false
    return getRFIFlowType(item) === cdFilter
  })

  const displayedRfis = activeTab === 'CONNECTION_DESIGNER' ? connectionDesignerRfis : generalRfis

  const finalRfis = displayedRfis.filter(
    (item) =>
      !searchQuery ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // ✅ Empty state and Render DataTable
  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 mb-4 gap-4 pb-2 sm:pb-0">
        {isWBTStaff && (
          <div className="flex space-x-6 border-b border-gray-200 w-full sm:w-auto">
            <button
              className={`py-3 px-1 text-sm font-semibold tracking-normal border-b-2 transition-colors ${activeTab === 'GENERAL' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('GENERAL')}
            >
              General RFIs
            </button>
            <button
              className={`py-3 px-1 text-sm font-semibold tracking-normal border-b-2 transition-colors ${activeTab === 'CONNECTION_DESIGNER' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('CONNECTION_DESIGNER')}
            >
              Connection Designer&apos;s RFI
            </button>
          </div>
        )}
        <div className="flex items-center gap-4 pb-2 sm:pb-0 sm:mt-2 ml-auto">
          {!isClient && (
            <div className="flex bg-gray-100 p-1 rounded-lg gap-1 h-9 items-center">
              <button
                type="button"
                onClick={() => setCdFilter('sent')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all h-7 flex items-center ${
                  cdFilter === 'sent'
                    ? 'bg-white text-black shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                SENT
              </button>
              <button
                type="button"
                onClick={() => setCdFilter('received')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all h-7 flex items-center ${
                  cdFilter === 'received'
                    ? 'bg-white text-black shadow-sm border border-gray-200/50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                RECEIVED
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm tracking-normal focus:outline-none focus:ring-1 focus:ring-green-500 w-full sm:w-96"
            />
          </div>
        </div>
      </div>

      {!finalRfis || finalRfis.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-700">
          <Inbox className="w-10 h-10 mb-3 text-gray-400" />
          <p className="text-sm font-medium tracking-normal">No RFIs Available</p>
          <p className="text-sm tracking-normal text-gray-400">
            {isClient
              ? 'No RFIs have been received for this project yet.'
              : cdFilter === 'sent'
              ? 'No RFIs have been sent yet.'
              : 'No RFIs have been received yet.'}
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={finalRfis}
          detailComponent={({ row, close }) => (
            <GetRFIByID
              id={row.id}
              onClose={(wasDeleted) => {
                close()
                if (wasDeleted === true) {
                  if (onUpdate) onUpdate()
                  else fetchRFIs()
                }
              }}
              onUpdate={onUpdate}
            />
          )}
        />
      )}

      {isFollowUpOpen && (
        <Modal
          isOpen={isFollowUpOpen}
          onClose={() => setIsFollowUpOpen(false)}
          title="New Communication Follow-up"
          size="lg"
        >
          <AddCommunication
            projects={projects}
            fabricators={fabricators}
            onClose={() => setIsFollowUpOpen(false)}
            initialValues={prefilledData}
          />
        </Modal>
      )}
    </div>
  )
}

export default AllRFI
