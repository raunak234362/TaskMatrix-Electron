import React, { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Tag,
  Hash,
  Flag,
  Calendar,
  Users
} from 'lucide-react'
import AddSelfTask from './Addselftask'
import SelfTaskService from '../../../api/services/selftask.service'
import GetSelfTaskByID from './GetSelfTaskByID'
import { useSelector } from 'react-redux'

const TASK_OWNER_OPTIONS = [
  { value: 'OPERATION_EXECUTIVE', label: 'Operation Executive', field: 'role' },
  {
    value: 'PROJECT_MANAGER_OFFICER',
    label: 'Project Manager Officer',
    field: 'role'
  },
  { value: 'DEPUTY_MANAGER', label: 'Deputy Manager', field: 'role' },
  { value: 'DEPT_MANAGER', label: 'Dept Manager', field: 'role' },
  { value: 'PROJECT_MANAGER', label: 'Project Manager', field: 'role' },
  { value: 'SOFTWARE_DEVELOPER', label: 'Software Developer', field: 'designation' }
]

const Selftask = () => {
  const [activeTab, setActiveTab] = useState('addTask')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedTaskId, setSelectedTaskId] = useState(null)
  const [selectedOwnerType, setSelectedOwnerType] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedTeamId, setSelectedTeamId] = useState('')
  const staffData = useSelector((state) => state.userInfo?.staffData || [])
  const teamData = useSelector((state) => state.userInfo?.teamData || [])

  const ownerType = TASK_OWNER_OPTIONS.find((option) => option.value === selectedOwnerType)
  const userOptions = ownerType
    ? staffData
        .filter(
          (staff) =>
            String(staff?.[ownerType.field] || '')
              .trim()
              .toUpperCase()
              .replace(/[\s-]+/g, '_') === ownerType.value
        )
        .map((staff) => {
          const id = staff.id ?? staff._id ?? staff.userId ?? staff.user_id
          const name =
            [staff.firstName, staff.lastName].filter(Boolean).join(' ') ||
            staff.name ||
            staff.username ||
            ownerType.label

          return { id, name }
        })
        .filter((staff) => staff.id != null && staff.id !== '')
        .sort((a, b) => a.name.localeCompare(b.name))
    : []

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      let res
      if (selectedTeamId) {
        res = await SelfTaskService.getSelfAssignedTasksByTeamId(selectedTeamId)
      } else if (selectedUserId) {
        res = await SelfTaskService.getSelfAssignedTasksByUserId(selectedUserId)
      } else if (selectedOwnerType) {
        setTasks([])
        return
      } else if (activeTab === 'notCompleted') {
        res = await SelfTaskService.getSelfAssignedNotCompletedTasks()
      } else {
        res = await SelfTaskService.getMySelfTask()
      }

      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.tasks)
            ? res.tasks
            : Array.isArray(res?.result)
              ? res.result
              : []

      setTasks(
        selectedUserId && activeTab === 'notCompleted'
          ? list.filter((task) => String(task.status || '').toUpperCase() !== 'COMPLETED')
          : list
      )
    } catch (err) {
      console.error('Failed to load self tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedOwnerType, selectedUserId, selectedTeamId])

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
    const s = String(status || '').toUpperCase()
    switch (s) {
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
                  <Filter className="w-3.5 h-3.5 text-gray-500" />
                  <select
                    value={selectedOwnerType}
                    onChange={(e) => {
                      setSelectedOwnerType(e.target.value)
                      setSelectedUserId('')
                    }}
                    aria-label="Filter employees by role or designation"
                    className="px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
                  >
                    <option value="">My Tasks</option>
                    {TASK_OWNER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedTeamId}
                    onChange={(e) => {
                      setSelectedTeamId(e.target.value)
                      setSelectedOwnerType('')
                      setSelectedUserId('')
                    }}
                    aria-label="Filter self-assigned tasks by team"
                    className="max-w-52 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
                  >
                    <option value="">All Teams</option>
                    {teamData.map((team) => (
                      <option key={team.id || team._id} value={team.id || team._id}>
                        {team.name || 'Unnamed Team'}
                      </option>
                    ))}
                  </select>
                  {selectedOwnerType && (
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      aria-label={`Select ${ownerType?.label || 'employee'}`}
                      className="max-w-52 px-2.5 py-1.5 bg-white border border-gray-300 rounded-lg text-xs text-gray-700 font-semibold focus:outline-none"
                    >
                      <option value="">
                        {userOptions.length ? 'Select employee' : 'No employees available'}
                      </option>
                      {userOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  )}
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
                    {selectedOwnerType && !selectedUserId
                      ? 'Select an employee to view their self-assigned tasks.'
                      : searchQuery || statusFilter !== 'ALL'
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="py-3 px-4">Serial / Task</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">Team</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {filteredTasks.map((t, idx) => {
                      const prio = getPriorityBadge(t.priority)
                      const statCls = getStatusBadge(t.status)
                      const taskId = t.id ?? t._id
                      return (
                        <tr
                          key={taskId ?? idx}
                          onClick={() => taskId != null && setSelectedTaskId(taskId)}
                          onKeyDown={(event) => {
                            if (taskId != null && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault()
                              setSelectedTaskId(taskId)
                            }
                          }}
                          role={taskId != null ? 'button' : undefined}
                          tabIndex={taskId != null ? 0 : undefined}
                          aria-label={taskId != null ? `Open task ${t.name || ''}` : undefined}
                          className={`transition hover:bg-gray-50/60 ${taskId != null ? 'cursor-pointer focus:outline-none focus-visible:bg-green-50' : ''}`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-0.5">
                              {t.serialNo && (
                                <span className="font-mono text-[10px] text-gray-400 font-semibold">
                                  #{t.serialNo}
                                </span>
                              )}
                              <span className="w-fit text-left font-semibold text-gray-900">
                                {t.name}
                              </span>
                              {t.description && (
                                <span className="text-[11px] text-gray-500 line-clamp-1">
                                  {t.description}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {t.categoryTag ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-medium text-[11px]">
                                <Tag className="w-3 h-3 text-gray-400" />
                                {t.categoryTag}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase ${prio.color}`}
                            >
                              <Flag className="w-3 h-3" />
                              {prio.label}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md border text-[11px] font-bold uppercase ${statCls}`}
                            >
                              {t.status || 'ASSIGNED'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {t.start_date || '—'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="text-gray-600 font-medium flex items-center gap-1 text-[11px]">
                              <Users className="w-3.5 h-3.5 text-blue-500" />
                              {t.team?.name || t.teamId || '—'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
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
