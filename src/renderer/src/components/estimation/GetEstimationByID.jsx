import { useEffect, useState } from 'react'
import { Loader2, AlertCircle, MessageSquare } from 'lucide-react'
import Service from '../../api/Service'
import Button from '../fields/Button'
import AllEstimationTask from './estimationTask/AllEstimationTask'
import LineItemGroup from './estimationLineItem/LineItemGroup'
import EditEstimation from './EditEstimation'

import RenderFiles from '../ui/RenderFiles'
import InclusionExclusion from './InclusionExclusion'
import EditInclusionExclusion from './EditInclusionExclusion'
import EstimationResponseModal from './EstimationResponseModal'

const truncateText = (text, max = 40) => (text.length > max ? text.substring(0, max) + '...' : text)

const GetEstimationByID = ({ id, onRefresh }) => {
  const [estimation, setEstimation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEstimationTaskOpen, setIsEstimationTaskOpen] = useState(false)
  const [isHoursOpen, setIsHoursOpen] = useState(false)
  const [isInclusionOpen, setIsInclusionOpen] = useState(false)
  const [isEditingInclusion, setIsEditingInclusion] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showResponseModal, setShowResponseModal] = useState(false)
  const [isResponsesOpen, setIsResponsesOpen] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase() || "";
  const fetchEstimation = async () => {
    if (!id) {
      setError('Invalid Estimation ID')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await Service.GetEstimationById(id)
      setEstimation(response?.data)
    } catch (err) {
      console.error('Error fetching estimation:', err)
      setError('Failed to load estimation details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstimation()
  }, [id])

  const formatDateTime = (date) =>
    date
      ? new Date(date).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
      })
      : 'N/A'

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
      : 'N/A'

  const formatHours = (hours) => {
    if (hours == null || hours === '') return 'N/A'
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    if (isNaN(numHours)) return 'N/A'
    const h = Math.floor(numHours)
    const m = Math.round((numHours - h) * 60)
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Loading estimation details...
      </div>
    )
  }

  if (error || !estimation) {
    return (
      <div className="flex items-center justify-center py-8 text-red-600">
        <AlertCircle className="w-5 h-5 mr-2" />
        {error || 'Estimation not found'}
      </div>
    )
  }

  const {
    estimationNumber,
    projectName,
    status,
    description,
    tools,
    fabricatorName,
    fabricators,
    rfq,
    estimateDate,
    startDate,
    createdAt,
    updatedAt,
    finalHours,
    finalWeeks,
    finalPrice,
    createdBy,
    totalAgreatedHours,
    files,
    responses: estimationResponses = []
  } = estimation

  const statusColor =
    status === 'DRAFT'
      ? 'bg-orange-100 text-black'
      : status === 'COMPLETED'
        ? 'bg-green-100 text-black'
        : 'bg-blue-100 text-black'

  return (
    <div className="bg-gray-100 rounded-3xl p-8 border border-black shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Estimation #{estimationNumber}</h3>
          <p className="text-black/60 text-xs font-black uppercase tracking-widest">Project: {projectName}</p>
        </div>
        <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-black ${statusColor}`}>
          {status}
        </span>
      </div>

      {/* Top Grid */}
      <div className="grid max-sm:grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left Column */}
        <div className="space-y-3">
          {/* Fabricator */}
          {(fabricators?.fabName || fabricatorName) && (
            <InfoRow label="Fabricator" value={fabricators?.fabName || fabricatorName || 'N/A'} />
          )}

          {/* RFQ */}
          {rfq && (
            <InfoRow
              label="RFQ"
              value={
                <div className="flex flex-col text-right">
                  <span className="font-semibold">{rfq.projectName || 'RFQ Linked'}</span>
                  <span className="text-xs text-gray-700">
                    Project No: {rfq.projectNumber || 'N/A'} · Bid: {rfq.bidPrice || '-'}
                  </span>
                </div>
              }
            />
          )}

          {/* Tools */}
          {tools && <InfoRow label="Tools" value={tools} />}


          {/* Created By */}
          {createdBy && (
            <InfoRow
              label="Created By"
              value={
                <span>
                  {createdBy.firstName} {createdBy.lastName} (
                  {createdBy.username || createdBy.email || 'N/A'})
                </span>
              }
            />
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <InfoRow label="Estimate Date" value={formatDate(estimateDate)} />
          <InfoRow label="Start Date" value={startDate ? formatDate(startDate) : 'N/A'} />
          <InfoRow label="Created" value={formatDateTime(createdAt)} />
          <InfoRow label="Updated" value={formatDateTime(updatedAt)} />
          <InfoRow label="Total Agreed Hours" value={formatHours(totalAgreatedHours)} />
          <InfoRow label="Final Hours" value={formatHours(finalHours)} />
          <InfoRow label="Final Weeks" value={finalWeeks != null ? finalWeeks : 'N/A'} />
          <InfoRow
            label="Final Price"
            value={finalPrice != null ? `$${finalPrice.toLocaleString()}` : 'N/A'}
          />
        </div>
      </div>

      {/* Description toggle */}
      {description && (
        <div className="mt-6 space-y-2">
          <button
            onClick={() => setShowDescription((prev) => !prev)}
            className="text-sm font-black text-black/40 uppercase tracking-widest hover:text-black transition-colors flex items-center gap-1"
          >
            <span className="ml-1">{showDescription ? 'Hide Description' : 'Show Description'}</span>
          </button>
          {showDescription && (
            <div
              className="text-sm text-black bg-white rounded-xl border border-black/10 p-4 prose prose-sm max-w-none leading-relaxed"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          )}
        </div>
      )}

      {/* Files Section */}
      <div className='my-4'>

        <RenderFiles files={files || []} table="estimation" parentId={id} formatDate={formatDate} />
      </div>

      {/* Action Buttons (placeholders for future edit/view actions) */}
      <div className="py-3 flex flex-wrap gap-3">
        {
          userRole === 'admin' || userRole === 'estimation_head' && (
            <Button
              className="py-0 px-1 text-sm rounded-xl"
              onClick={() => setIsEstimationTaskOpen(!isEstimationTaskOpen)}
            >
              Estimation Task
            </Button>
          )
        }
        <Button
          className="py-0 px-2 text-sm rounded-xl"
          onClick={() => setIsHoursOpen(!isHoursOpen)}
        >
          Estimated Hours/Weeks
        </Button>
        <Button
          className="py-0 px-2 text-sm rounded-xl"
          onClick={() => setIsInclusionOpen(!isInclusionOpen)}
        >
          Inclusion/Exclusion
        </Button>
        <Button
          className="py-0 px-2 text-sm rounded-xl bg-green-100 text-black border border-black hover:bg-green-200 hover:text-black flex items-center gap-1"
          onClick={() => setIsResponsesOpen((prev) => !prev)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Inclusion/Exclusion Documents ({estimationResponses.length})
        </Button>
        <Button
          className="py-0 px-2 text-sm rounded-xl bg-green-100 text-black border border-black hover:bg-green-200 hover:text-black flex items-center gap-1"
          onClick={() => setShowResponseModal(true)}
        >
          + Add Response
        </Button>

        {(userRole === 'admin' || userRole === 'estimation_head') && (
          <Button className="py-0 px-2 text-sm rounded-xl" onClick={() => setIsEditing(!isEditing)}>
            Edit Estimation
          </Button>
        )}
      </div>
      {isEstimationTaskOpen && (
        <AllEstimationTask
          estimationId={estimation?.id || ''}
          onRefresh={fetchEstimation}
          // Many APIs return tasks either nested under `tasks` or `estimationTasks`
          // Fallback to an empty array to avoid runtime errors.
          estimations={
            Array.isArray(estimation?.tasks)
              ? estimation.tasks
              : Array.isArray(estimation?.estimationTasks)
                ? estimation.estimationTasks
                : []
          }
          onClose={() => setIsEstimationTaskOpen(false)}
        />
      )}
      {isHoursOpen && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg  text-gray-700">Estimated Hours/Weeks</h3>
            <button
              onClick={() => setIsHoursOpen(false)}
              className="text-gray-700 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-md text-sm transition-colors"
            >
              Close
            </button>
          </div>
          <LineItemGroup estimationId={estimation?.id} />
        </div>
      )}
      {isInclusionOpen && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg  text-gray-700">Inclusion/Exclusion</h3>
            <button
              onClick={() => setIsInclusionOpen(false)}
              className="text-black border border-black hover:text-black bg-red-100 hover:bg-red-200 px-3 py-1 rounded-md text-sm transition-colors"
            >
              Close
            </button>
          </div>
          {isEditingInclusion ? (
            <EditInclusionExclusion
              estimationId={estimation?.id || ''}
              onCancel={() => setIsEditingInclusion(false)}
              onSuccess={() => {
                setIsEditingInclusion(false)
                fetchEstimation()
              }}
            />
          ) : (
            <InclusionExclusion
              estimationId={estimation?.id || ''}
              onEdit={() => setIsEditingInclusion(true)}
            />
          )}
        </div>
      )}
      {isEditing && (
        <EditEstimation
          id={id}
          onSuccess={() => {
            setIsEditing(false)
            fetchEstimation()
            onRefresh?.()
          }}
          onCancel={() => setIsEditing(false)}
        />
      )}
      {showResponseModal && (
        <EstimationResponseModal
          estimationId={id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={fetchEstimation}
        />
      )}

      {/* Responses Panel */}
      {isResponsesOpen && (
        <div className="mt-6 border-t pt-6 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-base font-black text-black uppercase tracking-widest flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-black" />
              Responses
              <span className="ml-1 px-2 py-0.5 text-[10px] bg-black text-white rounded-full font-black">
                {estimationResponses.length}
              </span>
            </h3>
          </div>

          {estimationResponses.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No responses yet.</p>
          ) : (
            <div className="space-y-3">
              {estimationResponses.map((resp, idx) => (
                <div
                  key={resp.id}
                  className="bg-white border border-black/10 rounded-2xl p-4 space-y-3 shadow-sm"
                >
                  {/* Header: index + timestamp */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                      Response #{idx + 1}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {resp.createdAt
                        ? new Date(resp.createdAt).toLocaleString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                        : '—'}
                    </span>
                  </div>

                  {/* Message */}
                  {resp.message && (
                    <div
                      className="text-sm text-gray-700 prose prose-sm max-w-none leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: resp.message }}
                    />
                  )}

                  {/* Files */}
                  {resp.files?.length > 0 && (
                    <RenderFiles
                      files={resp.files}
                      table="estimationResponse"
                      parentId={resp.id}
                      formatDate={formatDate}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reusable Info Row
const InfoRow = ({ label, value }) => (
  <div className="flex justify-between gap-3 pb-1.5 border-b border-black/5 last:border-0">
    <span className="font-black text-black/40 uppercase tracking-widest text-[10px]">{label}:</span>
    <span className="text-black font-black uppercase tracking-tight text-xs text-right whitespace-pre-wrap">{value}</span>
  </div>
)

export default GetEstimationByID
