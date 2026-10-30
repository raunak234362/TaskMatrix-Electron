import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { Flag, RefreshCw, Search, Tag } from 'lucide-react'
import { useSelector } from 'react-redux'
import DataTable from '../../ui/table'
import Service from '../../../api/Service'
import SelfTaskService from '../../../api/services/selftask.service'
import GetSelfTaskByID from './GetSelfTaskByID'

const getTaskPayload = (response) => response?.data ?? response

const getTaskList = (response) => {
  const payload = getTaskPayload(response)
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.tasks)) return payload.tasks
  if (Array.isArray(payload?.selfAssignedTasks)) return payload.selfAssignedTasks
  if (Array.isArray(payload?.result)) return payload.result
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const getPriorityLabel = (priority) =>
  ({ 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical', 5: 'Critical' })[
    Number(priority)
  ] || 'Medium'

const AllSelfTask = () => {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [assignedUserId, setAssignedUserId] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [teamId, setTeamId] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const staffData = useSelector((state) => state.userInfo?.staffData || [])
  const teamData = useSelector((state) => state.userInfo?.teamData || [])
  const [fetchedEmployees, setFetchedEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)

  useEffect(() => {
    if (staffData.length) return

    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true)
        const response = await Service.FetchAllEmployee()
        const payload = response?.data ?? response
        const employees = Array.isArray(payload)
          ? payload
          : payload?.employees || payload?.data?.employees || payload?.data || []
        if (!Array.isArray(employees)) {
          throw new Error('Employee list was not returned')
        }
        setFetchedEmployees(employees)
      } catch (error) {
        console.error('Failed to load employees for self-task filters:', error)
        toast.error(error?.response?.data?.message || 'Failed to load assigned users')
      } finally {
        setEmployeesLoading(false)
      }
    }

    fetchEmployees()
  }, [staffData.length])

  const fetchTasks = useCallback(async () => {
    if (!assignedUserId) {
      setTasks([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await SelfTaskService.getSelfTask({
        user_id: assignedUserId,
        status: status || undefined,
        priority: priority || undefined,
        teamId: teamId || undefined,
        categoryTag: category.trim() || undefined,
        search: search.trim() || undefined
      })
      setTasks(getTaskList(response))
    } catch (error) {
      console.error('Failed to load all self tasks:', error)
      toast.error(error?.response?.data?.message || 'Failed to load all self tasks')
    } finally {
      setLoading(false)
    }
  }, [assignedUserId, category, priority, search, status, teamId])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const employeeOptions = useMemo(
    () =>
      (staffData.length ? staffData : fetchedEmployees)
        .map((staff) => ({
          id: staff.id ?? staff._id ?? staff.userId ?? staff.user_id ?? staff.employeeId,
          name:
            [staff.firstName, staff.lastName].filter(Boolean).join(' ') ||
            staff.name ||
            staff.username ||
            staff.email ||
            ''
        }))
        .filter((staff) => staff.id != null && staff.id !== '' && staff.name)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [staffData, fetchedEmployees]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Task',
        cell: ({ row }) => {
          const task = row.original
          return (
            <div className="flex flex-col gap-0.5">
              {task.serialNo && (
                <span className="font-mono text-[10px] text-gray-400">
                  #{task.serialNo}
                </span>
              )}
              <span className="font-semibold text-gray-900">{task.name || '—'}</span>
              {task.description && (
                <span className="text-[11px] text-gray-500 line-clamp-1">
                  {task.description}
                </span>
              )}
            </div>
          )
        }
      },
      {
        id: 'assignedTo',
        accessorFn: (task) => {
          const owner =
            task.user || task.owner || task.assignee || task.userDetails || task.assignedTo
          const ownerId = task.user_id ?? task.userId ?? task.ownerId ?? task.owner_id
          const staffOwner = employeeOptions.find(
            (staff) => String(staff.id) === String(ownerId)
          )
          return (
            (typeof owner === 'string' ? owner : '') ||
            [owner?.firstName, owner?.lastName].filter(Boolean).join(' ') ||
            owner?.name ||
            owner?.username ||
            staffOwner?.name ||
            ''
          )
        },
        header: 'Assigned To'
      },
      {
        accessorKey: 'categoryTag',
        header: 'Category',
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-[11px]">
              <Tag className="w-3 h-3 text-gray-400" />
              {getValue()}
            </span>
          ) : '—'
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase bg-blue-50 text-blue-700 border-blue-300">
            <Flag className="w-3 h-3" />
            {getPriorityLabel(getValue())}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => (
          <span className="inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase bg-green-100 text-green-800 border-green-200">
            {String(getValue() || 'ASSIGNED').replace(/_/g, ' ')}
          </span>
        )
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ getValue }) => getValue() || '—'
      },
      {
        id: 'team',
        accessorFn: (task) => task.team?.name || task.teamId || '',
        header: 'Team',
        cell: ({ getValue }) => getValue() || '—'
      }
    ],
    [employeeOptions]
  )

  const handleRowClick = useCallback((task) => {
    const taskId = task.id ?? task._id
    if (taskId != null) setSelectedTaskId(taskId)
  }, [])

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Search className="w-4 h-4 text-gray-500" />
          <select
            value={assignedUserId}
            onChange={(event) => setAssignedUserId(event.target.value)}
            aria-label="Select assigned user to search tasks"
            className="max-w-56 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
          >
            <option value="">
              {employeesLoading
                ? 'Loading assigned users...'
                : employeeOptions.length
                  ? 'Select assigned user...'
                  : 'No assigned users available'}
            </option>
            {employeeOptions.map((staff) => (
              <option key={staff.id} value={staff.id}>{staff.name}</option>
            ))}
          </select>
          <input
            type="search"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            placeholder="Filter category..."
            aria-label="Filter by category"
            className="max-w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search task..."
            aria-label="Search tasks by name, description, or serial number"
            className="max-w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
          />
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            aria-label="Filter all self tasks by status"
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
          >
            <option value="">All Status</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            aria-label="Filter all self tasks by priority"
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
          >
            <option value="">All Priorities</option>
            <option value="1">Low</option>
            <option value="2">Medium</option>
            <option value="3">High</option>
            <option value="4">Critical</option>
            <option value="5">Critical</option>
          </select>
          <select
            value={teamId}
            onChange={(event) => setTeamId(event.target.value)}
            aria-label="Filter all self tasks by team"
            className="max-w-48 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
          >
            <option value="">All Teams</option>
            {teamData.map((team) => (
              <option key={team.id || team._id} value={team.id || team._id}>
                {team.name || 'Unnamed Team'}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchTasks}
            disabled={loading}
            className="px-3 py-2 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {!assignedUserId ? (
        <div className="p-12 text-center text-gray-500">
          Select an assigned user to load their self tasks.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={tasks}
          onRowClick={handleRowClick}
          pageSizeOptions={[10, 25, 50]}
          isLoading={loading}
        />
      )}

      {selectedTaskId != null && (
        <GetSelfTaskByID
          id={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          refresh={fetchTasks}
        />
      )}
    </div>
  )
}

export default AllSelfTask
