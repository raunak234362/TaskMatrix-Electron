import { useEffect, useState } from 'react'
import DataTable from '../ui/table'

import { useSelector } from 'react-redux'
import { Loader2, Inbox, MessageSquare, ClipboardList, AlertCircle, Search } from 'lucide-react'
import Service from '../../api/Service'
import GetSubmittalByID from './GetSubmittalByID'
import Modal from '../ui/Modal'
import AddCommunication from '../communication/AddCommunication'

const AllSubmittals = ({ submittalData, projectId }) => {
  const [submittals, setSubmittals] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false)
  const [prefilledData, setPrefilledData] = useState(null)
  const [upcomingSubmittals, setUpcomingSubmittals] = useState([])

  const projects = useSelector((state) => state.projectInfo?.projectData || [])
  const fabricators = useSelector((state) => state.fabricatorInfo?.fabricatorData || [])

  const userRole = sessionStorage.getItem('userRole')

  const [activeTab, setActiveTab] = useState(
    userRole && userRole.toUpperCase().includes('CONNECTION_DESIGNER')
      ? 'CONNECTION_DESIGNER'
      : 'GENERAL'
  )
  const [searchQuery, setSearchQuery] = useState('')

  const fetchSubmittals = async () => {
    try {
      setLoading(true)
      let result

      if (projectId) {
        result = await Service.GetSubmittalByProjectId(projectId)
      } else if (userRole === 'CLIENT') result = await Service.SubmittalSent()
      else result = await Service.SubmittalRecieved()

      const data = Array.isArray(result?.data) ? result.data : []

      const normalized = data.map((item) => ({
        ...item,
        milestone: item.mileStoneBelongsTo || item.milestone || null,
        recipient: item.recepients || null,
        sender: item.sender || null,
        createdAt: item.createdAt || item.date || null,
        statusLabel:
          item.isAproovedByAdmin === true
            ? 'APPROVED'
            : item.isAproovedByAdmin === false
              ? 'REJECTED'
              : 'PENDING'
      }))

      setSubmittals(normalized)

      // Fetch upcoming submittals (milestones pending submittal)
      if (projectId) {
        try {
          const upcomingRes = await Service.GetPendingSubmittal()
          const upcomingData = Array.isArray(upcomingRes) ? upcomingRes : upcomingRes?.data || []
          const projectUpcoming = upcomingData.filter(
            (m) => String(m.projectId || m.project?.id) === String(projectId)
          )
          setUpcomingSubmittals(projectUpcoming)
        } catch (err) {
          console.error('Error fetching upcoming submittals:', err)
        }
      }
    } catch {
      setSubmittals([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (submittalData && submittalData.length > 0) {
      setSubmittals(submittalData)
      setLoading(false)
    } else {
      fetchSubmittals()
    }
  }, [projectId, submittalData])

  const columns = [
    { accessorKey: 'subject', header: 'Subject' },

    {
      accessorKey: 'sender',
      header: 'Sender',
      cell: ({ row }) => {
        const s = row.original.sender
        return s ? `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim() : '—'
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
    },

    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.wbtStatus || row.original.status || 'PENDING'

        const STATUS_LABELS = {
          WAITING_FOR_BFA: 'Waiting for BFA',
          BFA_RECEIVED: 'BFA RECEIVED',
          BFA_SENT: 'BFA SENT',
          SUBMITTED_TO_EOR: 'Submitted to EOR',
          RELEASE_FOR_FABRICATION: 'Release for Fabrication',
          NOT_APPROVED: 'Not Approved',
          REVISED_RESUBMITTAL: 'Revised & Resubmitted',
          REVISED_RESUBMIT_FOR_FABRICATION: 'Revised & Resubmit for Fabrication',
          PENDING: 'Pending'
        }

        const key = String(status).replace(/\s+/g, '_').toUpperCase()
        const label = STATUS_LABELS[key] || String(status).replace(/_/g, ' ')

        const getStatusStyles = (k) => {
          switch (k) {
            case 'WAITING_FOR_BFA':
              return 'bg-green-100 text-green-700 border-green-200'
            case 'BFA_RECEIVED':
              return 'bg-emerald-100 text-emerald-700 border-emerald-200'
            case 'BFA_SENT':
              return 'bg-indigo-100 text-indigo-700 border-indigo-200'
            case 'SUBMITTED_TO_EOR':
              return 'bg-blue-100 text-blue-700 border-blue-200'
            case 'RELEASE_FOR_FABRICATION':
              return 'bg-green-100 text-green-700 border-green-200'
            case 'NOT_APPROVED':
              return 'bg-red-100 text-red-700 border-red-200'
            case 'REVISED_RESUBMITTAL':
            case 'REVISED_RESUBMIT_FOR_FABRICATION':
              return 'bg-orange-100 text-orange-700 border-orange-200'
            case 'PENDING':
              return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            default:
              return 'bg-gray-100 text-gray-600 border-gray-200'
          }
        }

        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-semibold uppercase tracking-normal border ${getStatusStyles(key)}`}
          >
            {label}
          </span>
        )
      }
    },

    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.date).toLocaleString()
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
              notes: `Ref: Submittal ${item.subject || ''}`
            })
            setIsFollowUpOpen(true)
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors shadow-sm tracking-normal whitespace-nowrap"
          title="Create Follow-up"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Follow-up
        </button>
      )
    }
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-gray-700">
        <Loader2 className="animate-spin w-6 h-6" /> Loading Submittals...
      </div>
    )
  }

  const generalSubmittals = submittals.filter(
    (item) =>
      item.isConnectionDesign !== true && String(item.isConnectionDesign).toLowerCase() !== 'true'
  )
  const connectionDesignerSubmittals = submittals.filter(
    (item) =>
      item.isConnectionDesign === true || String(item.isConnectionDesign).toLowerCase() === 'true'
  )

  const displayedSubmittals =
    activeTab === 'CONNECTION_DESIGNER' ? connectionDesignerSubmittals : generalSubmittals

  const finalSubmittals = displayedSubmittals.filter(
    (item) =>
      !searchQuery ||
      (item.subject && item.subject.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="bg-white p-2 rounded-2xl shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 mb-4 gap-4 pb-2 sm:pb-0">
        <div className="flex space-x-6 border-b border-gray-200 w-full sm:w-auto">
          <button
            className={`py-3 px-1 text-sm font-semibold tracking-normal border-b-2 transition-colors ${activeTab === 'GENERAL' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('GENERAL')}
          >
            General Submittals
          </button>
          {connectionDesignerSubmittals.length > 0 && (
            <button
              className={`py-3 px-1 text-sm font-semibold tracking-normal border-b-2 transition-colors ${activeTab === 'CONNECTION_DESIGNER' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('CONNECTION_DESIGNER')}
            >
              Connection Designer&rsquo;s Submittals
            </button>
          )}
        </div>
        <div className="relative pb-2 sm:pb-0 sm:mt-2">
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

      {!finalSubmittals.length ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 py-8 text-gray-700 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <Inbox className="w-10 h-10 text-gray-400" />
            <p className="text-sm font-medium tracking-normal">No Submittals Available</p>
          </div>

          {upcomingSubmittals.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-green-700 tracking-normal flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Upcoming Submittals (Planned Milestones)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {upcomingSubmittals.map((milestone) => {
                  const dueDate = milestone.approvalDate || milestone.date
                  const isOverdue = dueDate && new Date(dueDate) < new Date()

                  return (
                    <div
                      key={milestone.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}
                        >
                          <ClipboardList size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">
                            {milestone.name || milestone.subject || 'Untitled Milestone'}
                          </h4>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-sm font-black uppercase tracking-normal text-gray-400 px-2 py-0.5 bg-gray-100 rounded-md">
                              {milestone.category}
                            </span>
                            {dueDate && (
                              <span
                                className={`text-sm font-bold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-500'} tracking-normal`}
                              >
                                {isOverdue && <AlertCircle size={10} />}
                                Due: {new Date(dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 md:mt-0 flex items-center gap-3">
                        <span className="text-sm font-semibold tracking-normal text-gray-400 italic">
                          Not yet submitted
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={finalSubmittals}
          detailComponent={({ row, close }) => <GetSubmittalByID id={row.id} onClose={close} />}
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

export default AllSubmittals
