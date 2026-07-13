import React, { useEffect, useState } from 'react'
import Service from '../../api/Service'
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  X,
  FileText
} from 'lucide-react'
import Button from '../fields/Button'
import DataTable from '../ui/table'
import RenderFiles from '../common/RenderFiles'

import SubmittalResponseModal from './SubmittalResponseModal'
import SubmittalResponseDetailsModal from './SubmittalResponseDetailsModal'
import UpdateSubmittalById from './UpdateSubmittalById'
import BfaManager from './BfaManager'

const Info = ({ label, value, noBorder }) => (
  <div
    className={`flex items-center pb-2 text-sm gap-2 ${noBorder ? '' : 'border-b border-gray-200'}`}
  >
    <span className="font-semibold text-black uppercase tracking-wider shrink-0">{label}:</span>
    <span className="text-black font-normal uppercase text-left truncate flex-1" title={value}>
      {value || '—'}
    </span>
  </div>
)

const SectionTitle = ({ title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
)

const getMilestoneLabel = (m) => {
  if (!m) return '—'
  const parts = []
  if (m.subject) {
    parts.push(m.subject)
  } else if (m.description) {
    const plain = m.description
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .trim()
    const words = plain.split(/\s+/)
    const truncated = words.length > 10 ? words.slice(0, 10).join(' ') + '...' : plain
    parts.push(truncated)
  }
  if (m.subSubject) {
    parts.push(m.subSubject)
  }
  if (m.stage) {
    parts.push(m.stage)
  }
  return parts.join(' - ') || 'Unnamed Milestone'
}

// ── Version History Row ──────────────────────────────────────────────────────
const VersionRow = ({ version, index, total, isCurrent }) => {
  const [open, setOpen] = useState(false)

  const uploadedAt = version.createdAt || version.updatedAt || version.date
  const uploader = version.user || version.sender
  const uploaderName = uploader
    ? `${uploader.firstName || uploader.f_name || ''} ${uploader.lastName || uploader.l_name || ''}`.trim()
    : null

  return (
    <div
      className={`border rounded-xl overflow-hidden transition-all ${
        isCurrent ? 'border-[#6bbd45] bg-[#6bbd45]/5' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Row Header — always visible */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left gap-3 hover:bg-black/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Version badge */}
          <span
            className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
              isCurrent ? 'bg-[#6bbd45] text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            v{total - index}
            {isCurrent && ' · Current'}
          </span>

          {/* Timestamp */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {uploadedAt ? new Date(uploadedAt).toLocaleString() : '—'}
            </span>
            {uploaderName && <span className="truncate text-gray-500">· by {uploaderName}</span>}
          </div>
        </div>

        {/* Chevron */}
        <span className="shrink-0 text-gray-400">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded Content */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
          {/* Description */}
          {version.description && (
            <div className="pt-3">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                Description
              </p>
              <div
                className="p-3 bg-white border border-gray-200 rounded-lg prose prose-sm max-w-none text-sm text-gray-700"
                dangerouslySetInnerHTML={{ __html: version.description }}
              />
            </div>
          )}

          {/* Attached files for this version */}
          {(version.files?.length > 0 || version.file) && (
            <div className="pt-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                Attachments
              </p>
              <RenderFiles
                files={[version]}
                table="submittals"
                parentId={version.submittalId || version.submittalsId}
                versionId={version.id}
                hideHeader
                hideSectionTitle
              />
            </div>
          )}

          {/* Nothing to show */}
          {!version.description && !version.files?.length && !version.file && (
            <p className="pt-3 text-xs text-gray-400 italic">
              No details available for this version.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const GetSubmittalByID = ({ id, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [submittal, setSubmittal] = useState(null)
  const [error, setError] = useState(null)

  const [showResponseModal, setShowResponseModal] = useState(false)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedResponse, setSelectedResponse] = useState(null)
  const userRole = sessionStorage.getItem('userRole')?.toUpperCase()
  const currentUserId = sessionStorage.getItem('userId')
  const isAssist = submittal?.project?.assists?.some(
    (assist) =>
      String(assist.userId) === String(currentUserId) ||
      String(assist.user?.id) === String(currentUserId)
  )

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await Service.GetSubmittalbyId(id)
      setSubmittal(res.data)
    } catch {
      setError('Failed to load submittal')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-gray-700">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading submittal details...
      </div>
    )
  }

  if (!submittal || error) {
    return (
      <div className="flex items-center gap-2 py-8 text-red-600">
        <AlertCircle className="w-5 h-5" />
        {error || 'Submittal not found'}
      </div>
    )
  }

  // Sort versions newest → oldest
  const sortedVersions = [...(submittal.versions || [])].sort(
    (a, b) =>
      new Date(b.createdAt || b.updatedAt || b.date || 0) -
      new Date(a.createdAt || a.updatedAt || a.date || 0)
  )
  const hasMultipleVersions = sortedVersions.length > 1

  const responseColumns = [
    {
      accessorKey: 'user',
      header: 'From',
      cell: ({ row }) => {
        const user = row.original.user
        return (
          <span className="font-medium text-sm text-gray-700">
            {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '—'}
          </span>
        )
      }
    },
    {
      accessorKey: 'description',
      header: 'Message',
      cell: ({ row }) => {
        const description = row.original.description || '—'
        const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ')
        const words = stripHtml(description).trim().split(/\s+/)
        const truncated =
          words.length > 20 ? words.slice(0, 20).join(' ') + '...' : stripHtml(description)

        return (
          <div
            className="prose prose-sm max-w-none text-gray-700"
            style={{
              marginLeft: row.original.parentResponseId ? '20px' : '0px'
            }}
          >
            {truncated}
          </div>
        )
      }
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString()
    }
  ]

  return (
    <>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-1 md:p-2 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-none shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200 w-full max-w-[98%] flex flex-col h-full max-h-[98vh]">
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
              <h2 className="text-xl font-bold text-black tracking-tight uppercase">
                Submittal Details
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {(userRole !== 'STAFF' || isAssist) && (
                <button
                  className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                  onClick={() => setShowUpdateModal(true)}
                >
                  Update Submittal
                </button>
              )}
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                >
                  Close
                </button>
              )}
            </div>
          </header>

          {/* Body */}
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6 bg-gray-50">
            <div className="grid grid-cols-1 gap-6">
              {/* LEFT PANEL */}
              <div className="bg-white p-6 rounded-none border border-gray-200 space-y-6">
                <div className="space-y-4">
                  <h1 className="text-xl font-bold text-black uppercase tracking-tight">
                    {submittal.subject}
                  </h1>

                  {/* 2-Column Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 pt-2">
                    <Info label="Project" value={submittal.project?.name || '—'} />

                    <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
                      <span className="font-semibold text-black uppercase tracking-wider shrink-0">
                        Milestones:
                      </span>
                      <div className="flex flex-wrap gap-1.5 flex-1 justify-start">
                        {submittal.mileStones && submittal.mileStones.length > 0 ? (
                          submittal.mileStones.map((m) => (
                            <span
                              key={m.id || m._id}
                              className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold uppercase bg-green-50 text-green-700 border border-green-200"
                            >
                              {getMilestoneLabel(m)}
                            </span>
                          ))
                        ) : submittal.mileStoneBelongsTo ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold uppercase bg-green-50 text-green-700 border border-green-200">
                            {getMilestoneLabel(submittal.mileStoneBelongsTo)}
                          </span>
                        ) : (
                          <span className="text-black font-normal uppercase">—</span>
                        )}
                      </div>
                    </div>

                    <Info
                      label="Submitted By"
                      value={
                        submittal.sender
                          ? `${submittal.sender.firstName ?? ''} ${submittal.sender.lastName ?? ''}`.trim()
                          : '—'
                      }
                    />

                    <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
                      <span className="font-semibold text-black uppercase tracking-wider shrink-0">
                        Status:
                      </span>
                      {(() => {
                        const status = submittal.wbtStatus || submittal.status || 'PENDING'
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
                            className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold uppercase tracking-tight border ${getStatusStyles(key)}`}
                          >
                            {label}
                          </span>
                        )
                      })()}
                    </div>

                    <Info
                      label="Recipients"
                      value={
                        submittal.multipleRecipients?.length > 0
                          ? submittal.multipleRecipients
                              .map((r) => `${r.firstName} ${r.lastName}`)
                              .join(', ')
                          : '—'
                      }
                      noBorder
                    />

                    <Info
                      label="Created At"
                      value={new Date(submittal.date).toLocaleString()}
                      noBorder
                    />
                  </div>
                </div>

                {/* Single Version File Display */}
                {!hasMultipleVersions && sortedVersions.length === 1 && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <SectionTitle title="Attachments" />
                    <RenderFiles
                      files={sortedVersions}
                      table="submittals"
                      parentId={submittal.id}
                      versionId={sortedVersions[0]?.id}
                      hideHeader
                    />
                  </div>
                )}
              </div>

              {/* RIGHT PANEL - BFA Manager */}
              {String(submittal?.stage || "").toUpperCase() !== "IFC" && (
                <BfaManager submittalId={submittal.id} isAssist={isAssist} />
              )}

              {/* ── VERSION HISTORY (only when > 1 versions) ── */}
              {hasMultipleVersions && (
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-none p-6 space-y-4">
                  <div className="flex items-center gap-3 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                      <h2 className="text-lg font-bold text-black tracking-wider uppercase">
                        Version History
                      </h2>
                    </div>
                    <span className="ml-auto text-[10px] font-black text-gray-400 uppercase tracking-widest bg-white border border-gray-200 px-2 py-1 rounded-none">
                      {sortedVersions.length} versions
                    </span>
                  </div>

                  <div className="space-y-2">
                    {sortedVersions.map((version, index) => (
                      <VersionRow
                        key={version.id || index}
                        version={version}
                        index={index}
                        total={sortedVersions.length}
                        isCurrent={version.id === submittal.currentVersionId || index === 0}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* RESPONSES PANEL */}
              <div className="lg:col-span-2 bg-white p-6 rounded-none border border-gray-200 space-y-6">
                <div className="flex justify-between items-center pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#6bbd45] rounded-none" />
                    <h2 className="text-lg font-bold text-black tracking-wider uppercase">
                      Responses
                    </h2>
                  </div>
                  {(userRole === 'CLIENT_ADMIN' ||
                    userRole === 'CLIENT' ||
                    userRole === 'ADMIN' ||
                    userRole === 'PROJECT_MANAGER' ||
                    userRole === 'DEPT_MANAGER' ||
                    userRole === 'DEPUTY_MANAGER' ||
                    userRole === 'OPERATION_EXECUTIVE' ||
                    userRole === 'STAFF' ||
                    isAssist) && (
                    <button
                      className="px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                      onClick={() => setShowResponseModal(true)}
                    >
                      + Add Response
                    </button>
                  )}
                </div>

                {submittal.submittalsResponse?.length > 0 ? (
                  <DataTable
                    columns={responseColumns}
                    data={submittal.submittalsResponse}
                    onRowClick={(row) => setSelectedResponse(row)}
                  />
                ) : (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-none bg-white flex flex-col items-center justify-center">
                    <FileText className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-sm font-semibold text-black uppercase tracking-wider">
                      No responses yet.
                    </p>
                    {(userRole === 'CLIENT_ADMIN' ||
                      userRole === 'CLIENT' ||
                      userRole === 'ADMIN' ||
                      userRole === 'PROJECT_MANAGER' ||
                      userRole === 'DEPT_MANAGER' ||
                      userRole === 'DEPUTY_MANAGER' ||
                      userRole === 'OPERATION_EXECUTIVE' ||
                      userRole === 'STAFF' ||
                      isAssist) && (
                      <button
                        onClick={() => setShowResponseModal(true)}
                        className="mt-3 px-4 py-1.5 bg-gray-100 text-black border border-gray-300 rounded-none hover:bg-gray-200 transition-all font-bold text-xs uppercase tracking-wider cursor-pointer"
                      >
                        Add Response Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ADD RESPONSE MODAL */}
      {showResponseModal && (
        <SubmittalResponseModal
          submittalId={submittal.id}
          submittalVersionId={submittal.currentVersionId || sortedVersions[0]?.id}
          onClose={() => setShowResponseModal(false)}
          onSuccess={() => {
            setShowResponseModal(false)
            fetchData()
          }}
        />
      )}

      {/* RESPONSE DETAILS MODAL */}
      {selectedResponse && (
        <SubmittalResponseDetailsModal
          response={selectedResponse}
          onClose={() => {
            setSelectedResponse(null)
            fetchData()
          }}
        />
      )}

      {/* UPDATE SUBMITTAL MODAL */}
      {showUpdateModal && (
        <UpdateSubmittalById
          submittal={submittal}
          onClose={() => setShowUpdateModal(false)}
          onSuccess={() => {
            setShowUpdateModal(false)
            fetchData()
          }}
        />
      )}
    </>
  )
}

export default GetSubmittalByID
