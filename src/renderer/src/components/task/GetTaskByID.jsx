import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  Timer,
  Users,
  Pause,
  Play,
  Square,
  ClipboardList,
  Clock,
  Edit
} from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'
import { Button } from '../ui/button'
import EditTask from './EditTask'
import UpdateStatusModal from './components/UpdateStatusModal'
import Comment from "./comments/Comment";

const GetTaskByID = ({ id, onClose, refresh }) => {
  const userRole = sessionStorage.getItem("userRole")?.toLowerCase();
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [showWorkSummary, setShowWorkSummary] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [staffData, setStaffData] = useState([]);

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
        const data = await Service.FetchAllEmployee();
        setStaffData(data || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, [id])

  const handleAddComment = async (data) => {
    try {
      const user_id = sessionStorage.getItem("userId");
      const payload = {
        task_id: task.id,
        user_id: Number(user_id),
        data: data.comment,
      };
      await Service.AddTaskComment(payload);
      toast.success("Comment added successfully");
      fetchTask();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add comment");
    }
  };

  const handleAcknowledgeComment = async (commentId, data) => {
    try {
      const payload = {
        ...data,
      };
      await Service.AddTaskCommentAcknowledged(commentId, payload);
      toast.success("Comment acknowledged");
      fetchTask();
    } catch (error) {
      console.error(error);
      toast.error("Failed to acknowledge comment");
    }
  };

  const getActiveWorkID = () => {
    return task?.workingHourTask?.find((wh) => wh.ended_at === null)?.id || null
  }

  const activeWorkID = getActiveWorkID()

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
    if (!totalSeconds || isNaN(totalSeconds)) return "00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}`;
  };

  const handleAction = async (action) => {
    if (!task?.id) return
    try {
      setProcessing(true)
      switch (action) {
        case 'start':
          await Service.TaskStart(task.id)
          toast.success('Task started')
          break
        case 'pause':
          if (!activeWorkID) return toast.warning('No active session to pause')
          await Service.TaskPause(task.id, { whId: activeWorkID })
          toast.info('Task paused')
          break
        case 'resume':
          await Service.TaskResume(task.id)
          toast.success('Task resumed')
          break
        case 'end':
          await Service.TaskEnd(task.id, { whId: activeWorkID })
          toast.success('Task completed')
          break
      }
      await fetchTask()
      if (refresh) refresh()
    } catch {
      toast.error('Action failed. Please try again.')
    } finally {
      setProcessing(false)
    }
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
        return { label: 'Low', color: 'text-green-600', bg: 'bg-green-50' }
      case 2:
        return { label: 'Medium', color: 'text-orange-500', bg: 'bg-orange-50' }
      case 3:
        return { label: 'High', color: 'text-red-500', bg: 'bg-red-50' }
      case 4:
        return { label: 'Critical', color: 'text-gray-700', bg: 'bg-gray-50' }
      default:
        return { label: 'Normal', color: 'text-gray-500', bg: 'bg-gray-50' }
    }
  }

  if (loading) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#6bbd45]" />
          <p className="mt-4 text-lg font-medium text-gray-700">Loading task details...</p>
        </div>
      </div>,
      document.body
    )
  }

  if (!task) {
    return createPortal(
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
        <div className="bg-white rounded-2xl shadow-2xl p-10 text-center max-w-md">
          <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileText className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-semibold text-gray-800">Task Not Found</p>
          <p className="text-gray-600 mt-2">This task may have been deleted or is inaccessible.</p>
          <button
            onClick={onClose}
            className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden flex flex-col relative">

        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#6bbd45]/15 rounded-xl text-[#6bbd45]">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-800">{task.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                {/* <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ID: #{task.id}</span> */}
                <span className={`px-2 py-0.5 rounded text-sm border border-black font-bold uppercase ${priority.bg} ${priority.color}`}>{priority.label} Priority</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </button>
          </div>
        </div>

        {/* Action Bar (Top) */}
        <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap gap-3 items-center justify-end bg-white">
          {(userRole === "admin" ||
            userRole === "operation_executive" ||
            userRole === "project_manager" ||
            userRole === "department_manager" ||
            userRole === "deputy_manager") && (
              <>
                <button
                  onClick={() => setIsUpdatingStatus(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6bbd45]/20 text-black border border-black rounded-lg text-xs font-bold uppercase hover:bg-[#6bbd45]/30 transition-colors"
                >
                  <Timer className="w-4 h-4" /> Update Status
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#6bbd45]/20 text-black border border-black rounded-lg text-xs font-bold uppercase hover:bg-[#6bbd45]/30 transition-colors"
                >
                  <Edit className="w-4 h-4" /> Edit Task
                </button>
              </>
            )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {isEditing ? (
            <EditTask
              id={task.id}
              onClose={() => setIsEditing(false)}
              refresh={() => {
                fetchTask();
                if (refresh) refresh();
              }}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Main Info */}
              <div className="lg:col-span-2 space-y-8">

                {/* Info Grid */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#6bbd45]" /> Task Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <InfoItem icon={<Building2 />} label="Project" value={task.project?.name || '—'} />
                    <InfoItem icon={<Building2 />} label="WBS Item" value={task.projectBundle?.bundleKey?.replace(/_/g, ' ') || '—'} />
                    <InfoItem icon={<Hash />} label="Stage" value={task.Stage || '—'} />
                    <InfoItem
                      icon={<User />}
                      label="Assigned To"
                      value={task.user ? `${task.user.firstName} ${task.user.lastName}` : 'Unassigned'}
                    />
                    <InfoItem icon={<Calendar />} label="Due Date" value={toIST(task.due_date)} />
                    <InfoItem icon={<Clock />} label="Created At" value={toIST(task.created_on)} />
                    <InfoItem
                      icon={<Timer />}
                      label="Allocated Time"
                      value={formatHours(parseDurationToHours(task?.allocationLog?.allocatedHours))}
                    />
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mt-1"><Timer size={18} /></div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</p>
                        <span className={`inline-block mt-1 px-3 py-1 rounded-md text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#6bbd45]" />
                      Description
                    </h4>
                    <div
                      className="text-gray-600 text-sm leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  </div>
                )}

                {/* Comments */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#6bbd45]" />
                    Comments & Activity
                  </h4>
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
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 sticky top-0">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Timer className="w-5 h-5 text-slate-500" />
                        Work Session
                      </h3>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Total Time</p>
                        <p className="text-lg font-black text-slate-700 mt-1">{formatSecondsToHHMM(totalDurationSeconds)}</p>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase">Sessions</p>
                        <p className="text-lg font-black text-slate-700 mt-1">{task.workingHourTask.length}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-500 font-bold uppercase">
                          <tr>
                            <th className="px-3 py-2">Start</th>
                            <th className="px-3 py-2 text-right">Dur.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...task.workingHourTask].reverse().slice(0, 5).map((session, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-2 text-slate-600">
                                <div>{toIST(session.started_at).split(',')[0]}</div>
                                <div className="text-[10px] text-slate-400">{toIST(session.started_at).split(',')[1]}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono font-medium text-slate-700">
                                {session.duration_seconds ? formatHours(session.duration_seconds / 3600) : <span className="text-green-500 animate-pulse">Running</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {task.workingHourTask.length > 5 && (
                        <div className="px-3 py-2 text-center text-xs text-slate-400 bg-slate-50 border-t border-slate-100">
                          + {task.workingHourTask.length - 5} more sessions
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      {isUpdatingStatus && (
        <UpdateStatusModal
          taskId={task.id}
          currentStatus={task.status}
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
  <div className="flex items-start gap-3">
    <div className="p-2 bg-gray-50 rounded-lg text-gray-400 mt-1 shrink-0">
      {React.cloneElement(icon, { size: 18 })}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="font-semibold text-gray-800 mt-0.5 break-words text-sm">{value}</p>
    </div>
  </div>
)

export default GetTaskByID
