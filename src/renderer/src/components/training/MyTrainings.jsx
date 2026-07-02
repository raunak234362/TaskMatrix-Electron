import React, { useEffect, useState } from 'react'
import {
  Loader2,
  CheckCircle,
  Clock,
  Users,
  Calendar,
  Trophy,
  AlertCircle,
  Layers,
  GraduationCap,
  RefreshCw,
  CheckCircle2
} from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'

const BATCH_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  ACTIVE: { label: 'Active', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300'
  }
}

const fmt = (dateStr) =>
  dateStr
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }).format(new Date(dateStr))
    : '—'

const MyTrainings = () => {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState(null)
  const [expandedBatchId, setExpandedBatchId] = useState(null)

  const fetchMyBatches = async () => {
    try {
      setLoading(true)
      const res = await Service.GetMyTrainingBatches()
      setBatches(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch your training batches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMyBatches()
  }, [])

  const handleCompleteBatch = async (batchId) => {
    try {
      setCompletingId(batchId)
      await Service.CompleteTrainingBatch(batchId)
      toast.success('Training batch marked as completed!')
      fetchMyBatches()
    } catch (err) {
      console.error(err)
      toast.error('Failed to complete training batch')
    } finally {
      setCompletingId(null)
    }
  }

  const getBatchParticipants = (batch) => {
    const list = batch.requests || batch.suggestedRequests || batch.requestIds || []
    return list
      .map((r) => {
        if (typeof r === 'object' && r !== null) {
          const userObj = r.raisedBy || r.requestedBy || r.user
          const name =
            r.raisedByName ||
            (userObj?.firstName
              ? `${userObj.firstName} ${userObj.lastName || ''}`.trim()
              : 'Participant')
          return {
            name,
            team: r.teamName || r.team || '',
            date: r.requestedAt || r.createdAt || ''
          }
        }
        return {
          name: `Request ID: ${r}`,
          team: '',
          date: ''
        }
      })
      .filter(Boolean)
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-green-100 rounded-2xl text-green-700">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">My Trainings</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              View and manage training batches assigned to you
            </p>
          </div>
        </div>
        <button
          onClick={fetchMyBatches}
          disabled={loading}
          className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-xl transition-colors disabled:opacity-60"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      ) : batches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
          <Layers className="w-12 h-12 text-gray-300" />
          <p className="text-gray-500 font-semibold">No training batches assigned</p>
          <p className="text-gray-400 text-sm">
            You are not currently set as a trainer or participant in any batches.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {batches.map((batch) => {
            const batchId = batch.id || batch._id
            const bStatus = batch.status?.toUpperCase() || 'PENDING'
            const bCfg = BATCH_STATUS_CONFIG[bStatus] || BATCH_STATUS_CONFIG.PENDING
            const isCompleting = completingId === batchId
            const participants = getBatchParticipants(batch)

            return (
              <div
                key={batchId}
                onClick={() => setExpandedBatchId(expandedBatchId === batchId ? null : batchId)}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer select-none"
              >
                {/* Card header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 text-base truncate">
                      {batch.sessionName || batch.topic || 'Batch'}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                      {batch.topic || '—'}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${bCfg.bg} ${bCfg.text} ${bCfg.border}`}
                  >
                    {bCfg.label}
                  </span>
                </div>

                {/* Card body */}
                <div className="px-5 py-4 space-y-2.5 text-sm text-gray-600">
                  {batch.sessionDescription && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {batch.sessionDescription}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                    {batch.estimatedHours && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {batch.estimatedHours}h
                      </span>
                    )}
                    {batch.dueDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {fmt(batch.dueDate)}
                      </span>
                    )}
                    {participants.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {participants.length} participant
                        {participants.length !== 1 ? 's' : ''}
                      </span>
                    )}
                    {batch.priority && (
                      <span
                        className={`flex items-center gap-1 font-semibold ${
                          batch.priority === 'CRITICAL' || batch.priority === 4
                            ? 'text-red-600'
                            : batch.priority === 'HIGH' || batch.priority === 3
                              ? 'text-orange-600'
                              : batch.priority === 'MEDIUM' || batch.priority === 2
                                ? 'text-blue-600'
                                : 'text-gray-500'
                        }`}
                      >
                        {batch.priority === 1 || batch.priority === 'LOW'
                          ? 'Low'
                          : batch.priority === 2 || batch.priority === 'MEDIUM'
                            ? 'Medium'
                            : batch.priority === 3 || batch.priority === 'HIGH'
                              ? 'High'
                              : batch.priority === 4 || batch.priority === 'CRITICAL'
                                ? 'Critical'
                                : batch.priority}
                      </span>
                    )}
                  </div>
                  {batch.createdAt && (
                    <p className="text-[11px] text-gray-400 font-medium">
                      Created {fmt(batch.createdAt)}
                    </p>
                  )}
                </div>

                {/* Collapsible Participants Area */}
                {participants.length > 0 && (
                  <div
                    className="border-t border-gray-100 px-5 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setExpandedBatchId(expandedBatchId === batchId ? null : batchId)
                      }
                      className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-green-700 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        Participants ({participants.length})
                      </span>
                      <span>{expandedBatchId === batchId ? 'Hide Details' : 'Show Details'}</span>
                    </button>
                    {expandedBatchId === batchId && (
                      <div className="mt-3 space-y-2 pl-3 border-l-2 border-green-100 max-h-36 overflow-y-auto pr-1">
                        {participants.map((p, pIdx) => (
                          <div key={pIdx} className="text-xs flex justify-between items-start">
                            <div className="min-w-0">
                              <span className="font-semibold text-gray-700 block truncate">
                                {p.name}
                              </span>
                              {p.team && (
                                <span className="inline-block text-[9px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-medium mt-0.5">
                                  {p.team}
                                </span>
                              )}
                            </div>
                            {p.date && (
                              <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 ml-2 mt-0.5">
                                {fmt(p.date)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card footer */}
                {bStatus !== 'COMPLETED' && bStatus !== 'CANCELLED' && (
                  <div
                    className="px-5 py-3 border-t border-gray-100 bg-gray-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleCompleteBatch(batchId)}
                      disabled={isCompleting}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-[#6bbd45] hover:bg-[#5aab37] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                    >
                      {isCompleting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trophy className="w-3 h-3" />
                      )}
                      Mark as Completed
                    </button>
                  </div>
                )}
                {bStatus === 'COMPLETED' && (
                  <div
                    className="px-5 py-3 border-t border-gray-100 bg-green-50 flex items-center justify-center gap-1.5 text-green-700 text-xs font-bold"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <CheckCircle2 className="w-4 h-4" /> Batch Completed
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default MyTrainings
