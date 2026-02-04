import { useEffect, useState } from 'react'
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
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-10 flex flex-col items-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#6bbd45]" />
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
          <p className="text-xl font-semibold text-gray-800">Task Not Found</p>
          <p className="text-gray-600 mt-2">This task may have been deleted or is inaccessible.</p>
          <button
            onClick={onClose}
            className="mt-6 px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  const statusConfig = getStatusConfig(task.status)
  const priority = getPriorityLabel(task.priority)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#eef7e9] rounded-xl">
              <ClipboardList className="w-7 h-7 text-[#6bbd45]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-black">{task.name}</h2>
              {/* <p className="text-sm text-black">ID: #{task.id}</p> */}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsUpdatingStatus(true)}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 font-medium transition border-orange-200 text-white hover:bg-orange-50"
            >
              <Timer className="w-4 h-4" /> Update Status
            </Button>
            {(userRole === "admin" ||
              userRole === "operation_executive" ||
              userRole === "project_manager" ||
              userRole === "department_manager" ||
              userRole === "deputy_manager") && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 font-medium transition border-indigo-200 text-white bg-[#6bbd45] hover:bg-[#5aa33a]"
                >
                  <Edit className="w-4 h-4" /> Edit Task
                </Button>
              )}
            <button
              onClick={onClose}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
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
            <>
              {/* Task Info Card */}
              <div className="bg-[#f7fbf3] rounded-2xl p-8 border border-[#d4e9c8]">
                <h3 className="text-2xl font-bold text-[#2d501d] mb-6 flex items-center gap-3">
                  <FileText className="w-7 h-7" />
                  Task Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full ${priority.color.replace('text', 'bg')}`}
                      ></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">Priority</p>
                      <p className={`font-bold mt-1 ${priority.color}`}>{priority.label}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                      <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-black">Status</p>
                      <span
                        className={`inline-block mt-1 px-4 py-2 rounded-full font-semibold text-sm border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                      >
                        {statusConfig.label.replace(/_/g, ' ') || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="mt-8 p-6 bg-white/70 backdrop-blur rounded-xl border border-[#eef7e9]">
                    <h4 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#6bbd45]" />
                      Description
                    </h4>
                    <div
                      className="text-black leading-relaxed prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  </div>
                )}

                {/* Actions */}
                {/* <div className="mt-8 pt-6 border-t border-[#d4e9c8]">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Task Controls</h4>
              <div className="flex flex-wrap items-center gap-4">
                {(task.status === 'ASSIGNED' || task.status === 'REWORK') && (
                  <ActionButton
                    icon={<Play />}
                    color="emerald"
                    onClick={() => handleAction('start')}
                    disabled={processing}
                  >
                    Start Task
                  </ActionButton>
                )}
                {task.status === 'IN_PROGRESS' && (
                  <>
                    <ActionButton
                      icon={<Pause />}
                      color="amber"
                      onClick={() => handleAction('pause')}
                      disabled={processing}
                    >
                      Pause
                    </ActionButton>
                    <ActionButton
                      icon={<Square />}
                      color="red"
                      onClick={() => handleAction('end')}
                      disabled={processing}
                    >
                      End Task
                    </ActionButton>
                  </>
                )}
                {task.status === 'BREAK' && (
                  <ActionButton
                    icon={<Play />}
                    color="#6bbd45"
                    onClick={() => handleAction('resume')}
                    disabled={processing}
                  >
                    Resume Task
                  </ActionButton>
                )}
                {processing && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </div>
                )}
              </div>
            </div> */}
              </div>

              {/* Work Summary */}
              {task.workingHourTask && task.workingHourTask.length > 0 && (
                <div className="bg-[#f5f3ff] rounded-2xl p-6 border border-[#ddd6fe]">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-3">
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
                        value={formatSecondsToHHMM(totalDurationSeconds)}
                      />
                      <SummaryCardSession
                        icon={<Users />}
                        label="Breaks"
                        value={task.workingHourTask.length}
                      />
                      <SummaryCardStatus
                        icon={<Timer />}
                        label="Current Status"
                        value={statusConfig.label}
                        color={statusConfig.text}
                      />
                    </div>
                  )}
                  {showWorkSummary && ["admin", "human_resource", "operation_executive"].includes(userRole) && (
                    <div className="mt-6 bg-white/50 rounded-xl border border-indigo-100 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="bg-indigo-50/50 text-indigo-700 font-bold border-b border-indigo-100">
                            <th className="px-4 py-3">Activity</th>
                            <th className="px-4 py-3">Start Time</th>
                            <th className="px-4 py-3">End Time</th>
                            <th className="px-4 py-3 text-right">Duration</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-100">
                          {[...task.workingHourTask].reverse().map((session, idx) => (
                            <tr key={session.id || idx} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-4 py-3 font-semibold text-indigo-900 capitalize">
                                {session.type?.toLowerCase() || 'Work'}
                              </td>
                              <td className="px-4 py-3 text-gray-600">{toIST(session.started_at)}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {session.ended_at ? toIST(session.ended_at) : (
                                  <span className="text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                                    <Play className="w-3 h-3 fill-current" /> Running...
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">
                                {session.duration_seconds
                                  ? formatHours(session.duration_seconds / 3600)
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
              {/* Comments Section */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 mt-6">
                <Comment
                  comments={task.taskcomment}
                  onAddComment={handleAddComment}
                  staffData={staffData}
                  onAcknowledge={handleAcknowledgeComment}
                />
              </div>
            </>
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
    </div>
  )
}

// Helper Components
const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-start gap-4">
    <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
      {icon && <div className="w-6 h-6 text-[#6bbd45]">{icon}</div>}
    </div>
    <div>
      <p className="text-sm font-bold text-black">{label}</p>
      <p className="font-semibold text-black mt-1">{value}</p>
    </div>
  </div>
)

const ActionButton = ({ children, icon, color, onClick, disabled }) => {
  const colors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    amber: 'bg-amber-600 hover:bg-amber-700',
    red: 'bg-red-600 hover:bg-red-700',
    teal: 'bg-[#6bbd45] hover:bg-[#5aa33a]'
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-2 px-6 py-3 ${colors[color]} text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {icon}
      {children}
    </button>
  )
}

const SummaryCard = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl font-bold mt-2 ${color}`}>{value} hrs</p>
    </div>
  </div>
);
const SummaryCardSession = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl font-bold mt-2 ${color}`}>{value} </p>
    </div>
  </div>
);
const SummaryCardStatus = ({ icon, label, value, color = "text-indigo-700" }) => (
  <div className="bg-white/80 backdrop-blur flex flex-row gap-5 items-center justify-center p-2 rounded-xl border border-indigo-100 text-center">
    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-700">{label}</p>
      <p className={`text-xl font-bold mt-2 ${color}`}>{value} </p>
    </div>
  </div>
);

export default GetTaskByID
