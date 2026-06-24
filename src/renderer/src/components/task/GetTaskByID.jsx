import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, FileText, Timer, ClipboardList, Edit } from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'
import EditTask from './EditTask'
import UpdateStatusModal from './components/UpdateStatusModal'
import Comment from './comments/Comment'

const LocalSectionTitle = ({ title }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="w-1.5 h-6 bg-green-600 rounded-none" />
    <h2 className="text-lg font-bold text-black tracking-wider uppercase">{title}</h2>
  </div>
)

const GetTaskByID = ({ id, onClose, refresh }) => {
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [staffData, setStaffData] = useState([])
  const [showAllSessions, setShowAllSessions] = useState(false)

  const fetchTask = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await Service.GetTaskById(id)
      setTask(response?.data)
    } catch (error) {
      console.error('Error fetching task:', error)
      toast.error('Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTask()
    const fetchStaff = async () => {
      try {
        const data = await Service.FetchAllEmployee()
        setStaffData(data || [])
      } catch (err) {
        console.error('Failed to fetch staff', err)
      }
    }
    fetchStaff()

    const handleTaskUpdated = () => {
      fetchTask()
      if (refresh) refresh()
    }
    window.addEventListener('task-updated', handleTaskUpdated)
    return () => window.removeEventListener('task-updated', handleTaskUpdated)
  }, [id])

  const handleAddComment = async (data) => {
    try {
      const user_id = sessionStorage.getItem('userId')
      const payload = {
        task_id: task.id,
        user_id: Number(user_id),
        data: data.comment
      }
      const res = await Service.AddTaskComment(payload)

      if (
        userRole === 'project_manager' ||
        userRole === 'dept_manager' ||
        userRole === 'deputy_manager' ||
        userRole === 'human_resource'
      ) {
        const newCommentId =
          res?.id || res?.data?.id || res?.comment?.id || res?.commentId || res?.taskComment?.id
        if (newCommentId) {
          try {
            await Service.AddTaskCommentAcknowledged(newCommentId, {
              acknowledged: true,
              acknowledgedTime: new Date()
            })
          } catch (ackError) {
            console.error('Failed to auto-acknowledge comment', ackError)
          }
        }
      }

      toast.success('Comment added successfully')
      await fetchTask()
      window.dispatchEvent(new Event('task-updated'))
    } catch (error) {
      console.error(error)
      toast.error('Failed to add comment')
    }
  }

  const handleAcknowledgeComment = async (commentId, data) => {
    try {
      const payload = {
        ...data
      }
      await Service.AddTaskCommentAcknowledged(commentId, payload)
      toast.success('Comment acknowledged')
      await fetchTask()
      window.dispatchEvent(new Event('task-updated'))
    } catch (error) {
      console.error(error)
      toast.error('Failed to acknowledge comment')
    }
  }

  const parseDurationToHours = (duration) => {
    if (!duration) return 0
    const parts = duration.split(/[:\s]+/)
    let hours = 0
    let minutes = 0
    if (parts.length >= 1) hours = parseFloat(parts[0].replace(/[^\d.]/g, '')) || 0
    if (parts.length >= 2) minutes = parseFloat(parts[1].replace(/[^\d.]/g, '')) || 0
    return hours + minutes / 60
  }

  const formatHours = (decimalHours) => {
    const totalMinutes = Math.round(decimalHours * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  }

  const totalDurationSeconds =
    task?.workingHourTask?.reduce((acc, wh) => acc + (Number(wh.duration_seconds) || 0), 0) || 0

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

  const formatSecondsToHHMM = (totalSeconds) => {
    if (!totalSeconds || isNaN(totalSeconds)) return '00:00'
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
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
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-300'
      },
      BREAK: {
        label: 'On Break',
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        border: 'border-orange-300'
      },
      COMPLETED: {
        label: 'Completed',
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-300'
      },
      PENDING: {
        label: 'Pending',
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-300'
      }
    }
    return (
      configs[status?.toUpperCase() || ''] || {
        label: status || 'Unknown',
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300'
      }
    )
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return { label: 'Low', color: 'text-yellow-600 border-yellow-500', bg: 'bg-yellow-50' }
      case 2:
        return { label: 'Medium', color: 'text-blue-600 border-blue-500', bg: 'bg-blue-50' }
      case 3:
        return { label: 'High', color: 'text-orange-600 border-orange-500', bg: 'bg-orange-50' }
      case 4:
        return { label: 'Critical', color: 'text-red-600 border-red-500', bg: 'bg-red-50' }
      default:
        return { label: 'Normal', color: 'text-gray-500 border-gray-300', bg: 'bg-gray-50' }
    }
  }

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-none border-2 border-black p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#6bbd45]" />
          <p className="mt-4 text-sm font-bold text-black uppercase">Loading task details...</p>
        </div>
      </div>,
      document.body
    )
  }

  if (!task) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-none border-2 border-black p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-none mx-auto mb-4 flex items-center justify-center border border-black">
            <FileText className="w-10 h-10 text-black" />
          </div>
          <p className="text-sm font-bold text-black uppercase">Task Not Found</p>
          <p className="text-black text-sm mt-2 uppercase">
            This task may have been deleted or is inaccessible.
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>,
      document.body
    )
  }

  const statusConfig = getStatusConfig(task.status)
  const priority = getPriorityLabel(task.priority)

  return createPortal(
    <div className="fixed inset-0 z-90 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#fcfdfc] rounded-none shadow-2xl w-full max-w-[95vw] lg:max-w-7xl h-[90vh] border-2 border-black overflow-hidden flex flex-col relative">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-[#fcfdfc] sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-50 text-black border border-black rounded-none">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-black tracking-tight uppercase">
                {task.wbsType ? `${task.wbsType.replace(/_/g, ' ').toUpperCase()} ` : ''} -{' '}
                {task.name}
              </h2>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`px-6 py-1.5 border rounded-none font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center ${priority.bg} ${priority.color}`}
                >
                  {priority.label} Priority
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {(userRole === 'admin' ||
              userRole === 'operation_executive' ||
              userRole === 'project_manager' ||
              userRole === 'dept_manager' ||
              userRole === 'deputy_manager') && (
              <>
                <button
                  onClick={() => setIsUpdatingStatus(true)}
                  className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                >
                  <Timer className="w-4 h-4" /> Update Status
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-1.5 bg-green-50 text-black border-2 border-green-700/80 rounded-none hover:bg-green-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm cursor-pointer"
                >
                  <Edit className="w-4 h-4" /> Edit Task
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="px-6 py-1.5 bg-red-50 text-black border-2 border-red-700/80 rounded-none hover:bg-red-100 transition-all font-bold text-sm uppercase tracking-tight shadow-sm inline-flex items-center justify-center cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column: Main Info */}
            <div className="lg:col-span-2 space-y-8">
              {/* Info Grid */}
              <div className="bg-[#f4faf0]/30 p-6 border border-green-600 rounded-none shadow-sm">
                <LocalSectionTitle title="Task Details" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                  <InfoItem label="Project" value={task.project?.name || '—'} />
                  <InfoItem
                    label="WBS Item"
                    value={task.projectBundle?.bundleKey?.replace(/_/g, ' ') || '—'}
                  />
                  <InfoItem label="Stage" value={task.Stage || '—'} />
                  <InfoItem
                    label="Assigned To"
                    value={
                      task.user ? `${task.user.firstName} ${task.user.lastName}` : 'Unassigned'
                    }
                  />
                  <InfoItem label="Due Date" value={toIST(task.due_date)} />
                  <InfoItem label="Created At" value={toIST(task.created_on)} />
                  <InfoItem
                    label="Allocated Time"
                    value={formatHours(parseDurationToHours(task?.allocationLog?.allocatedHours))}
                  />
                  <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
                    <span className="font-semibold text-black uppercase tracking-wider flex items-center gap-2 shrink-0">
                      Status:
                    </span>
                    <div className="flex justify-start">
                      <span
                        className={`px-4 py-0.5 border rounded-none font-semibold text-sm uppercase tracking-tight inline-flex items-center justify-center ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div className="bg-[#f4faf0]/30 p-6 border border-green-600 rounded-none shadow-sm">
                  <LocalSectionTitle title="Description" />
                  <div
                    className="text-black text-sm font-bold uppercase leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: task.description }}
                  />
                </div>
              )}

              {/* Comments */}
              <div className="bg-[#fcfdfc] p-6 border border-green-600 rounded-none shadow-sm">
                <LocalSectionTitle title="Comments & Activity" />
                <Comment
                  comments={task.taskcomment}
                  onAddComment={handleAddComment}
                  staffData={staffData}
                  onAcknowledge={handleAcknowledgeComment}
                />
              </div>
            </div>

            {/* Right Column: Work Summary */}
            <div className="space-y-6">
              {task.workingHourTask && task.workingHourTask.length > 0 && (
                <div className="bg-[#f4faf0]/30 p-6 border border-green-600 rounded-none sticky top-0">
                  <LocalSectionTitle title="Work Session" />

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-[#fcfdfc] p-4 border border-black rounded-none text-center">
                      <p className="text-sm font-semibold text-black uppercase">Total Time</p>
                      <p className="text-sm font-semibold text-black mt-1 uppercase">
                        {formatSecondsToHHMM(totalDurationSeconds)}
                      </p>
                    </div>
                    <div className="bg-[#fcfdfc] p-4 border border-black rounded-none text-center">
                      <p className="text-sm font-semibold text-black uppercase">Sessions</p>
                      <p className="text-sm font-semibold text-black mt-1 uppercase">
                        {task.workingHourTask.length}
                      </p>
                    </div>
                  </div>
                  {[
                    'admin',
                    'project_manager',
                    'human_resource',
                    'department_manager',
                    'deputy_manager',
                    'dept_manager'
                  ].includes(userRole) && (
                    <div className="bg-[#fcfdfc] rounded-none border border-black overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-[#f4faf0] text-black font-bold uppercase border-b border-black">
                          <tr>
                            <th className="px-3 py-2 text-sm font-semibold text-black uppercase">
                              Start
                            </th>
                            <th className="px-3 py-2 text-sm font-semibold text-black uppercase">
                              End/Pause
                            </th>
                            <th className="px-3 py-2 text-sm font-semibold text-black uppercase text-right">
                              Dur.
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-black">
                          {[...task.workingHourTask]
                            .reverse()
                            .slice(0, showAllSessions ? task.workingHourTask.length : 5)
                            .map((session, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 text-black text-sm font-medium uppercase">
                                  <div className="font-medium">
                                    {toIST(session.started_at).split(',')[1]}
                                  </div>
                                  <div className="text-sm text-black uppercase font-medium">
                                    {toIST(session.started_at).split(',')[0]}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-black text-sm font-medium uppercase">
                                  {session.ended_at ? (
                                    <>
                                      <div className="font-medium">
                                        {toIST(session.ended_at).split(',')[1]}
                                      </div>
                                      <div className="text-sm text-black uppercase font-medium">
                                        {toIST(session.ended_at).split(',')[0]}
                                      </div>
                                    </>
                                  ) : (
                                    <span className="text-green-600 font-medium uppercase text-sm animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-black text-sm uppercase">
                                  {session.duration_seconds
                                    ? formatHours(session.duration_seconds / 3600)
                                    : '--:--'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                      {task.workingHourTask.length > 5 && (
                        <button
                          onClick={() => setShowAllSessions(!showAllSessions)}
                          className="w-full px-3 py-2 text-center text-sm font-semibold text-black bg-[#f4faf0] border-t border-black hover:bg-gray-100 transition-colors uppercase"
                        >
                          {showAllSessions
                            ? 'Show Less'
                            : `+ ${task.workingHourTask.length - 5} more sessions`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {isEditing && (
        <EditTask
          id={task.id}
          onClose={() => setIsEditing(false)}
          refresh={() => {
            fetchTask()
            if (refresh) refresh()
          }}
        />
      )}
      {isUpdatingStatus && (
        <UpdateStatusModal
          taskId={task.id}
          currentStatus={task.status}
          hasUnacknowledgedComments={task.taskcomment?.some((c) => c.acknowledged === false)}
          onClose={() => setIsUpdatingStatus(false)}
          refresh={() => {
            fetchTask()
            if (refresh) refresh()
          }}
        />
      )}
    </div>,
    document.body
  )
}

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center pb-2 border-b border-gray-200 text-sm gap-2">
    <span className="font-semibold text-black uppercase tracking-wider flex items-center gap-2 shrink-0">
      {icon && React.cloneElement(icon, { size: 14, className: 'text-black' })}
      {label}:
    </span>
    <span
      className="font-medium text-black uppercase text-left truncate flex-1 max-w-[300px] md:max-w-[450px]"
      title={value}
    >
      {value}
    </span>
  </div>
)

export default GetTaskByID
