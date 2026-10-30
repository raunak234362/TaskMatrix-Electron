import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Plus,
  ClipboardList,
  Clock,
  Search,
  RefreshCw,
  Tag,
  Flag,
  Calendar,
  Users
} from 'lucide-react'
import AddSelfTask from './Addselftask'
import AllSelfTask from './AllSelfTask'
import SelfTaskService from '../../../api/services/selftask.service'
import GetSelfTaskByID from './GetSelfTaskByID'
import DataTable from '../../ui/table'

const getPriorityBadge = (priority) => {
  switch (Number(priority)) {
    case 1:
      return { label: 'Low', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' }
    case 2:
      return { label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-300' }
    case 3:
      return { label: 'High', color: 'bg-amber-50 text-amber-700 border-amber-300' }
    case 4:
    case 5:
      return { label: 'Critical', color: 'bg-rose-50 text-rose-700 border-rose-300' }
    default:
      return { label: 'Medium', color: 'bg-gray-50 text-gray-700 border-gray-300' }
  }
}

const getStatusBadge = (status) => {
  const normalizedStatus = String(status || '').toUpperCase()
  switch (normalizedStatus) {
    case 'COMPLETED':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'ON_HOLD':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-600 border-gray-200'
    default:
      return 'bg-green-100 text-green-800 border-green-200'
  }
}

const Selftask = () => {
  const [activeTab, setActiveTab] = useState('addTask')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      const res = activeTab === 'notCompleted'
        ? await SelfTaskService.getSelfAssignedNotCompletedTasks()
        : await SelfTaskService.getMySelfTask()

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.tasks)
            ? res.tasks
            : Array.isArray(res?.result)
              ? res.result
              : []

      setTasks(list)
    } catch (err) {
      console.error('Failed to load self tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'myTasks' || activeTab === 'notCompleted') {
      fetchTasks()
    }
  }, [activeTab, fetchTasks])

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      (t.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.categoryTag || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.serialNo || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'ALL' ||
      String(t.status || '').toUpperCase() === statusFilter.toUpperCase()

    return matchesSearch && matchesStatus
  })

  const taskColumns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Serial / Task',
        cell: ({ row }) => {
          const task = row.original
          return (
            <div className="flex flex-col gap-0.5">
              {task.serialNo && (
                <span className="font-mono text-[10px] text-gray-400 font-semibold">
                  #{task.serialNo}
                </span>
              )}
              <span className="w-fit text-left font-semibold text-gray-900">
                {task.name}
              </span>
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
        accessorKey: 'categoryTag',
        header: 'Category',
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
              <Tag className="w-3 h-3 text-gray-400" />
              {getValue()}
            </span>
          ) : <span className="text-gray-400">—</span>
      },
      {
        accessorKey: 'priority',
        header: 'Priority',
        cell: ({ getValue }) => {
          const priority = getPriorityBadge(getValue())
          return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase ${priority.color}`}>
              <Flag className="w-3 h-3" />
              {priority.label}
            </span>
          )
        }
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ getValue }) => {
          const status = getValue() || 'ASSIGNED'
          return (
            <span className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase ${getStatusBadge(status)}`}>
              {status}
            </span>
          )
        }
      },
      {
        accessorKey: 'start_date',
        header: 'Start Date',
        cell: ({ getValue }) => (
          <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            {getValue() || '—'}
          </span>
        )
      },
      {
        id: 'team',
        accessorFn: (task) => task.team?.name || task.teamId || '',
        header: 'Team',
        cell: ({ getValue }) => (
          <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            {getValue() || '—'}
          </span>
        )
      }
    ],
    []
  )

  const handleTaskRowClick = useCallback((task) => {
    const taskId = task.id ?? task._id
    if (taskId != null) setSelectedTaskId(taskId)
  }, [])

  return (
    <div className="h-full w-full flex flex-col min-h-0 bg-gray-50/40 p-4">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-3 bg-white p-3 rounded-xl shadow-2xs">
        <div>
          <h1 className="text-lg font-bold uppercase tracking-tight text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-green-600" />
            Self Assigned Tasks
          </h1>
          <p className="text-xs text-gray-500">
            Create, manage, and monitor your personal tasks
          </p>
        </div>

        {/* Action Buttons / Navigation */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('addTask')}
            className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-tight rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'addTask'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Plus className="w-4 h-4" />
            Add Self Task
          </button>

          <button
            onClick={() => setActiveTab('myTasks')}
            className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-tight rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'myTasks'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            My Self Tasks
          </button>

          <button
            onClick={() => setActiveTab('allTasks')}
            className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-tight rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'allTasks'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            All Self Tasks
          </button>

          <button
            onClick={() => setActiveTab('notCompleted')}
            className={`px-4 py-1.5 border text-xs font-bold uppercase tracking-tight rounded-lg shadow-2xs inline-flex items-center gap-1.5 transition cursor-pointer ${
              activeTab === 'notCompleted'
                ? 'bg-green-600 text-white border-green-700'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Clock className="w-4 h-4" />
            Incomplete Tasks
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 mt-4 overflow-y-auto">
        {activeTab === 'allTasks' && <AllSelfTask />}
        {activeTab === 'addTask' && (
          <AddSelfTask
            onCancel={() => setActiveTab('myTasks')}
            onSuccess={() => {
              setActiveTab('myTasks')
            }}
          />
        )}

        {(activeTab === 'myTasks' || activeTab === 'notCompleted') && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
            {/* Filter Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, category, serial no..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ASSIGNED">Assigned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchTasks}
                  disabled={loading}
                  className="px-3 py-1.5 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            {/* Content Table or Cards */}
            {loading ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs">Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="p-12 text-center text-gray-500 flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                  <ClipboardList className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-700">No self-assigned tasks found</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {searchQuery || statusFilter !== 'ALL'
                      ? 'Try clearing your filters'
                      : 'You have not created any self-assigned tasks yet.'}
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('addTask')}
                  className="mt-2 px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Task Now
                </button>
              </div>
            ) : (
              <DataTable
                columns={taskColumns}
                data={filteredTasks}
                onRowClick={handleTaskRowClick}
                pageSizeOptions={[10, 25, 50]}
              />
            )}
          </div>
        )}
      </div>
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

export default Selftask
