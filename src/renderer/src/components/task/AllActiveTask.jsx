import { useEffect, useState, useMemo } from 'react'
import Service from '../../api/Service'
import {
  Loader2,
  AlertCircle,
  ClipboardList,
  Calendar,
  User,
  Briefcase,
  Tag,
  Eye,
  Filter
} from 'lucide-react'
import DateFilter from '../common/DateFilter'
import { matchesDateFilter } from '../../utils/dateFilter'

import DataTable from '../ui/table'
import FetchTaskByID from './FetchTaskByID'

const AllActiveTask = () => {
  const userRole = (sessionStorage.getItem('userRole') || '').toLowerCase().trim()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [specificTask, setSpecificTask] = useState('')
  const [displayTask, setDisplayTask] = useState(false)

  const [dateFilter, setDateFilter] = useState({
    type: 'all',
    year: new Date().getFullYear(),
    month: new Date().getMonth()
  })

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const response = (userRole === 'operation_executive_trainee' || userRole === 'operation_executive')
          ? await Service.GetAllTask()
          : await Service.GetNonCompletedTasks()

        // Ensure tasks is an array
        const taskData = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : Array.isArray(response?.tasks)
              ? response.tasks
              : response?.data
                ? Object.values(response.data)
                : []

        setTasks(taskData)
        setLoading(false)
      } catch (err) {
        setError(err)
        setLoading(false)
      }
    }
    fetchTasks()

    const handleTaskUpdated = () => {
      import('react-toastify').then(({ toast }) => {
        toast.info('Auto-refreshing tasks table...', { autoClose: 3000 })
      })
      fetchTasks()
    }
    window.addEventListener('task-updated', handleTaskUpdated)
    return () => window.removeEventListener('task-updated', handleTaskUpdated)
  }, [])

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      : '—'

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ASSIGNED':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 1:
        return { label: 'Low', color: 'text-yellow-600' }
      case 2:
        return { label: 'Medium', color: 'text-blue-600' }
      case 3:
        return { label: 'High', color: 'text-orange-600' }
      case 4:
        return { label: 'Critical', color: 'text-red-600' }
      default:
        return { label: 'Normal', color: 'text-gray-600' }
    }
  }

  // Filter out tasks with status "VALIDATE_COMPLETE", "COMPLETE_OTHER", "USER_FAULT"
  const filteredTasks = useMemo(() => {
    return tasks.filter(
      (task) =>
        (userRole !== 'operation_executive_trainee' || task.status !== 'COMPLETED') &&
        task.status !== 'VALIDATE_COMPLETE' &&
        task.status !== 'COMPLETE_OTHER' &&
        task.status !== 'WRONG_ALLOCATION' &&
        task.status !== 'ABSENT' &&
        task.status !== 'USER_FAULT' &&
        matchesDateFilter(task.created_on, dateFilter, task.due_date || task.dueDate)
    )
  }, [tasks, dateFilter, userRole])

  // Find the highest-priority unlockable task from ASSIGNED, IN_PROGRESS, BREAK, or REWORK
  const unlockableStatuses = ['ASSIGNED', 'IN_PROGRESS', 'BREAK', 'REWORK']

  const highestPriorityTask = useMemo(() => {
    return filteredTasks
      .filter((task) => unlockableStatuses.includes(task.status))
      .sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority // Higher priority first
        }
        if (new Date(a.due_date).getTime() !== new Date(b.due_date).getTime()) {
          return new Date(a.due_date) - new Date(b.due_date) // Earlier due date first
        }
        return new Date(a.created_on) - new Date(b.created_on) // Earlier created_on first
      })[0]
  }, [filteredTasks])

  const unlockableTaskId = highestPriorityTask?.id

  const handleTaskView = (taskId) => {
    setSpecificTask(taskId)
    setDisplayTask(true)
  }

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Task Details',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-black">{row.original.name}</span>
            <div
              className="text-xs text-black mt-1 line-clamp-1 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: row.original.description || 'No description'
              }}
            />
          </div>
        )
      },
      {
        accessorKey: 'project.name',
        header: 'Project & Stage',
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-black">
              <Briefcase className="w-3.5 h-3.5 text-black" />
              <span className="font-medium">{row.original.project?.name || 'N/A'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-black">
              <Tag className="w-3.5 h-3.5 text-black" />
              <span>Stage: {row.original.Stage || 'N/A'}</span>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'user.firstName',
        header: 'Assigned To',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-black font-bold text-xs shadow-sm border border-green-300">
              {row.original.user?.firstName?.charAt(0) || <User className="w-4 h-4 text-black" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-black">
                {row.original.user
                  ? `${row.original.user.firstName} ${row.original.user.lastName}`
                  : 'Unassigned'}
              </span>
              <span className="text-xs text-black">
                {row.original.department?.name || 'General'}
              </span>
            </div>
          </div>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <span
            className={`px-3 py-1 rounded-full text-xs  border ${getStatusColor(
              row.original.status
            )}`}
          >
            {row.original.status}
          </span>
        )
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ row }) => {
          const priority = getPriorityLabel(row.original.priority)
          return (
            <div className={`flex items-center gap-1.5 text-sm font-semibold ${priority.color}`}>
              <span
                className={`w-2 h-2 rounded-full ${priority.color.replace('text', 'bg')}`}
              ></span>
              {priority.label}
            </div>
          )
        }
      },
      {
        accessorKey: 'due_date',
        header: 'Due Date',
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-sm text-black">
            <Calendar className="w-4 h-4 text-black" />
            {formatDate(row.original.due_date)}
          </div>
        )
      },
      {
        accessorKey: 'id',
        header: 'View',
        cell: ({ row }) => {
          const task = row.original
          const canView =
            [
              'admin',
              'operation_executive',
              'operation_executive_trainee',
              'deputy_manager',
              'project_manager',
              'dept_manager'
            ].includes(userRole) ||
            task.status === 'IN_REVIEW' ||
            task.id === unlockableTaskId
          return (
            <button
              onClick={() => handleTaskView(task.id)}
              disabled={!canView}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                canView
                  ? 'bg-teal-500 text-white hover:bg-teal-600 hover:shadow-md'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
              }`}
            >
              <Eye className="w-4 h-4" />
              View
            </button>
          )
        }
      }
    ],
    [unlockableTaskId, userRole]
  )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-green-600">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium animate-pulse">Fetching active tasks...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500">
        <AlertCircle className="w-12 h-12 mb-4" />
        <h2 className="text-xl font-bold mb-2">Failed to load active tasks</h2>
        <p className="text-sm opacity-80">{error.message || 'Something went wrong'}</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-none border border-green-600 min-h-screen">
      <div className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold uppercase tracking-wider text-black">Active Tasks</h1>
            <span className="text-xs font-bold text-black border border-green-300 px-3 py-1 rounded-none bg-green-50 shadow-sm">
              {filteredTasks.length} Active {filteredTasks.length === 1 ? 'Task' : 'Tasks'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DateFilter dateFilter={dateFilter} setDateFilter={setDateFilter} />
          </div>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-bounce" />
          <h3 className="text-lg font-bold text-gray-700">No Active Tasks</h3>
          <p className="text-gray-500 text-sm mt-1">You do not have any tasks currently pending.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden p-4">
          <DataTable columns={columns} data={filteredTasks} />
        </div>
      )}

      {displayTask && (
        <FetchTaskByID
          id={specificTask}
          onClose={() => setDisplayTask(false)}
          refresh={async () => {
            try {
              setLoading(true)
              const response = (userRole === 'operation_executive_trainee' || userRole === 'operation_executive')
                ? await Service.GetAllTask()
                : await Service.GetNonCompletedTasks()
              const taskData = Array.isArray(response)
                ? response
                : Array.isArray(response?.data)
                  ? response.data
                  : Array.isArray(response?.tasks)
                    ? response.tasks
                    : response?.data
                      ? Object.values(response.data)
                      : []
              setTasks(taskData)
              setLoading(false)
            } catch (err) {
              setError(err)
              setLoading(false)
            }
          }}
        />
      )}
    </div>
  )
}

export default AllActiveTask
