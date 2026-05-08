/* eslint-disable react/prop-types */
'use client'

import { useEffect, useState } from 'react'
import Service from '../../../api/Service'
import { toast } from 'react-toastify'
import {
  Loader2,
  Calendar,
  User,
  FileText,
  Clock4,
  ChevronDown,
  ChevronUp,
  Building2,
  Hash,
  FolderOpen,
  Timer,
  Users,
  Edit2,
  MessageSquare
} from 'lucide-react'
import CreateLineItemGroup from '../estimationLineItem/CreateLineItemGroup'
import LineItemGroup from '../estimationLineItem/LineItemGroup'
import EditEstimationTaskByID from './EditEstimationTaskByID'
import ReviewEstimationTaskModal from './ReviewEstimationTaskModal'

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
      {icon && <div className="w-6 h-6 text-green-600">{icon}</div>}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="font-semibold text-gray-700 mt-1">{value}</p>
    </div>
  </div>
)

const SummaryCard = ({ icon, label, value, color = 'text-indigo-700' }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl  mt-2 ${color}`}>{value}</p>
    </div>
  </div>
)

export default function EstTaskByID({ id, onClose, refresh }) {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState(null)
  const [showWorkSummary, setShowWorkSummary] = useState(true)
  const [refreshGroups, setRefreshGroups] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)

  const userRole = sessionStorage.getItem('userRole')
  const canEdit = ['ESTIMATION_HEAD', 'OPERATION_EXECUTIVE', 'DEPUTY_MANAGER'].includes(userRole)

  const fetchTask = async () => {
    if (!id) return
    try {
      setLoading(true)
      const taskRes = await Service.GetEstimationTaskById(id)
      const taskData = taskRes.data
      setTask(taskData)

      const summaryRes = await Service.SummaryEstimationTaskById(id)
      setSummary(summaryRes.data)
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to load estimation task')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTask()
  }, [id])

  const calculateTotalTime = () => {
    if (!task?.workinghours || !Array.isArray(task.workinghours)) return '0h 0m'
    
    let totalSeconds = 0
    task.workinghours.forEach((wh) => {
      if (wh.duration_seconds) {
        totalSeconds += wh.duration_seconds
      } else if (wh.started_at && !wh.ended_at) {
        const start = new Date(wh.started_at).getTime()
        if (!isNaN(start)) {
          const now = new Date().getTime()
          totalSeconds += Math.floor((now - start) / 1000)
        }
      }
    })

    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const toIST = (dateString) => {
    if (!dateString) return '—'
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusConfig = (status) => {
    const configs = {
      ASSIGNED: {
        label: 'Assigned',
        bg: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-300'
      },
      IN_PROGRESS: {
        label: 'In Progress',
        bg: 'bg-emerald-100',
        text: 'text-emerald-700',
        border: 'border-emerald-300'
      },
      BREAK: {
        label: 'On Break',
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300'
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300'
      }
    }
    return (
      configs[status || ''] || {
        label: status || 'Unknown',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300'
      }
    )
  }

  const statusConfig = getStatusConfig(task?.status)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-green-600" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading task details...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-700">Task Not Found</p>
          <p className="text-gray-700 mt-2">This task may have been deleted or is inaccessible.</p>
          <button
            onClick={onClose}
            className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-xl">
              <FileText className="w-7 h-7 text-green-700" />
            </div>
            <div>
              <h2 className="text-2xl text-gray-700 font-semibold">Estimation Task Details</h2>
              <p className="text-sm text-gray-500">{task.serialNo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-1.5 bg-indigo-50 text-indigo-700 border-2 border-indigo-700/80 rounded-lg hover:bg-indigo-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2"
                >
                  <Edit2 size={16} />
                  Edit
                </button>
               
                <button
                  onClick={() => setShowReviewModal(true)}
                  className="px-6 py-1.5 bg-amber-50 text-amber-700 border-2 border-amber-700/80 rounded-lg hover:bg-amber-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm flex items-center gap-2"
                >
                  <MessageSquare size={16} />
                  Review
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-lg hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Task Info Card */}
          <div className="bg-green-50 rounded-2xl p-8 border border-green-200">
            <h3 className="text-2xl text-green-900 mb-6 flex items-center gap-3">
              <FileText className="w-7 h-7" />
              Task Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoItem
                icon={<Building2 />}
                label="Project"
                value={task.estimation?.projectName || task.frontendDetails?.projectName || '—'}
              />
              <InfoItem
                icon={<Hash />}
                label="Serial No."
                value={task.serialNo || '—'}
              />
              <InfoItem
                icon={<User />}
                label="Assigned To"
                value={task.assignedTo ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}` : (task.assignedTo?.username || '—')}
              />
              <InfoItem icon={<Calendar />} label="Start Date" value={toIST(task.startDate)} />
              <InfoItem icon={<Calendar />} label="End Date" value={toIST(task.endDate)} />
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                  <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <span
                    className={`inline-block mt-1 px-4 py-2 rounded-full font-semibold text-sm border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {task.notes && (
              <div className="mt-8 p-6 bg-white/70 backdrop-blur rounded-xl border border-green-100">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  Notes
                </h4>
                <div
                  className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: task.notes }}
                />
              </div>
            )}
          </div>

          {/* Work Summary */}
          {task && (
            <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl text-indigo-900 flex items-center gap-3">
                  <Timer className="w-6 h-6" />
                  Work Summary
                </h3>
                <button
                  onClick={() => setShowWorkSummary(!showWorkSummary)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {showWorkSummary ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </button>
              </div>
              {showWorkSummary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SummaryCard
                    icon={<Clock4 />}
                    label="Total Time"
                    value={calculateTotalTime()}
                  />
                  <SummaryCard
                    icon={<Users />}
                    label="Sessions"
                    value={task?.workinghours?.length || 0}
                  />
                  <SummaryCard
                    icon={<Timer />}
                    label="Status"
                    value={statusConfig.label}
                    color={statusConfig.text}
                  />
                </div>
              )}

              {showWorkSummary && task.workinghours?.length > 0 && (
                <div className="mt-8 overflow-hidden rounded-xl border border-indigo-100 bg-white">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-indigo-50 text-indigo-900 font-semibold uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">Session Type</th>
                        <th className="px-6 py-4">Started At</th>
                        <th className="px-6 py-4">Ended At</th>
                        <th className="px-6 py-4 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {task.workinghours.map((session, index) => (
                        <tr key={session.id || index} className="hover:bg-gray-50 transition-colors text-gray-700">
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                              session.type === 'WORK' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                            }`}>
                              {session.type || 'WORK'}
                            </span>
                          </td>
                          <td className="px-6 py-4">{toIST(session.started_at)}</td>
                          <td className="px-6 py-4">{session.ended_at ? toIST(session.ended_at) : (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              In Progress
                            </span>
                          )}</td>
                          <td className="px-6 py-4 text-right font-mono">
                            {session.duration_seconds 
                              ? `${Math.floor(session.duration_seconds / 3600)}h ${Math.floor((session.duration_seconds % 3600) / 60)}m ${session.duration_seconds % 60}s`
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Line Item Groups Section */}
          <div className="border-t pt-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl text-gray-700 flex items-center gap-3">
                <FolderOpen className="w-7 h-7 text-green-600" />
                Line Item Groups
              </h3>
            </div>
            <div className="flex flex-col gap-6">
              <CreateLineItemGroup
                estimationId={task?.estimationId}
                onGroupCreated={() => setRefreshGroups((prev) => prev + 1)}
              />
              <LineItemGroup estimationId={task?.estimationId} refreshTrigger={refreshGroups} />
            </div>
          </div>
        </div>

        {/* Edit Modal */}
        {isEditing && (
          <EditEstimationTaskByID
            task={task}
            onClose={() => setIsEditing(false)}
            onSuccess={() => {
              fetchTask()
              if (refresh) refresh()
            }}
          />
        )}

        {/* Review Modal */}
        {showReviewModal && (
          <ReviewEstimationTaskModal
            task={task}
            onClose={() => setShowReviewModal(false)}
            refresh={() => {
              fetchTask()
              if (refresh) refresh()
            }}
          />
        )}
      </div>
    </div>
  )
}