import React, { useEffect, useState } from 'react'
import {
  Loader2,
  GraduationCap,
  CheckCircle,
  XCircle,
  RefreshCw,
  ClipboardList,
  AlertCircle,
  Plus,
  Layers,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Trophy
} from 'lucide-react'
import Service from '../../api/Service'
import { toast } from 'react-toastify'

// Roles that can see & manage pending trainings
const ALLOWED_ROLES = ['admin', 'operation_executive', 'deputy_manager', 'human_resource']

const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  APPROVED: {
    label: 'Approved',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  REJECTED: { label: 'Rejected', bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
}

const BATCH_STATUS_CONFIG = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-300'
  },
  ACTIVE: { label: 'Active', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300'
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    border: 'border-gray-300'
  }
}

const fmt = (dateStr) =>
  dateStr
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata'
      }).format(new Date(dateStr))
    : '—'

const getUserFullName = (req) => {
  if (req.raisedByName) return req.raisedByName
  const userObj = req.raisedBy || req.requestedBy || req.user
  if (!userObj) return '—'
  return `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || '—'
}

const getUserRole = (req) => {
  const userObj = req.raisedBy || req.requestedBy || req.user
  return userObj?.role || ''
}

// ─── Create Batch Modal ──────────────────────────────────────────────────────
const CreateBatchModal = ({ approvedRequests, prefillData, departments, onClose, onCreated }) => {
  const [form, setForm] = useState({
    sessionName: prefillData?.sessionName || '',
    topic: prefillData?.topic || '',
    departmentId: prefillData?.departmentId || '',
    sessionDescription: prefillData?.sessionDescription || '',
    trainerId: '',
    trainingProjectId: '',
    estimatedHours: prefillData?.estimatedHours || '02:00',
    dueDate: prefillData?.dueDate || '',
    priority: 2, // Default to Medium (2)
    requestIds: prefillData?.requestIds || []
  })
  const [submitting, setSubmitting] = useState(false)
  const [trainers, setTrainers] = useState([])
  const [loadingTrainers, setLoadingTrainers] = useState(false)
  const [projectsList, setProjectsList] = useState([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  useEffect(() => {
    const fetchTrainersAndProjects = async () => {
      try {
        setLoadingTrainers(true)
        setLoadingProjects(true)

        // Fetch trainers
        const roles = ['STAFF', 'PROJECT_MANAGER', 'DEPUTY_MANAGER', 'DEPT_MANAGER', 'ADMIN']
        const trainerPromises = roles.map((role) =>
          Service.FetchEmployeeByRole(role).catch((err) => {
            console.error(`Failed to fetch trainers for role ${role}`, err)
            return { data: { employees: [] } }
          })
        )
        const trainerResults = await Promise.all(trainerPromises)
        const allEmployees = trainerResults
          .flatMap((res) => res?.data?.employees || [])
          .filter(Boolean)

        const uniqueTrainers = []
        const seen = new Set()
        for (const emp of allEmployees) {
          const empId = emp.id || emp._id
          if (empId && !seen.has(empId)) {
            seen.add(empId)
            uniqueTrainers.push(emp)
          }
        }
        setTrainers(uniqueTrainers)

        // Fetch projects
        const projRes = await Service.GetAllProjects()
        setProjectsList(Array.isArray(projRes) ? projRes : projRes?.data || [])
      } catch (err) {
        console.error('Error fetching trainers/projects:', err)
      } finally {
        setLoadingTrainers(false)
        setLoadingProjects(false)
      }
    }
    fetchTrainersAndProjects()
  }, [])

  const allAvailableRequests = [...approvedRequests]
  if (prefillData?.requests) {
    prefillData.requests.forEach((r) => {
      const id = r.requestId || r.id || r._id
      if (!allAvailableRequests.some((existing) => (existing.id || existing._id) === id)) {
        allAvailableRequests.push({
          id: id,
          _id: id,
          task: { name: r.task?.name || r.taskName || 'Suggested Task' },
          topic: r.topic || prefillData.topic,
          raisedByName: r.raisedByName,
          raisedBy: r.raisedBy,
          requestedBy: r.requestedBy,
          user: r.user,
          ...r
        })
      }
    })
  }

  const toggleRequest = (id) => {
    setForm((prev) => ({
      ...prev,
      requestIds: prev.requestIds.includes(id)
        ? prev.requestIds.filter((r) => r !== id)
        : [...prev.requestIds, id]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.sessionName.trim()) return toast.warning('Session name is required')
    if (!form.topic.trim()) return toast.warning('Topic is required')
    if (!form.departmentId) return toast.warning('Department is required')
    if (!form.trainerId) return toast.warning('Trainer is required')
    if (!form.trainingProjectId) return toast.warning('Training Project is required')
    if (form.requestIds.length === 0) return toast.warning('Select at least one request to batch')

    if (form.estimatedHours && !/^\d{2}:\d{2}$/.test(form.estimatedHours)) {
      return toast.warning('Estimated Hours must be in HH:MM format (e.g. 02:00)')
    }

    try {
      setSubmitting(true)
      await Service.CreateTrainingBatch({
        sessionName: form.sessionName.trim(),
        topic: form.topic.trim(),
        departmentId: form.departmentId,
        sessionDescription: form.sessionDescription.trim() || undefined,
        trainerId: form.trainerId,
        trainingProjectId: form.trainingProjectId,
        estimatedHours: form.estimatedHours || undefined,
        dueDate: form.dueDate || undefined,
        priority: Number(form.priority),
        requestIds: form.requestIds
      })
      toast.success('Training batch created!')
      onCreated()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to create training batch')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl text-green-600">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Create Training Batch</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Row 1 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Session Name *
              </label>
              <input
                type="text"
                value={form.sessionName}
                onChange={(e) => setForm((p) => ({ ...p, sessionName: e.target.value }))}
                placeholder="e.g. SDS2 Batch — July 2026"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Topic *
              </label>
              <input
                type="text"
                value={form.topic}
                onChange={(e) => setForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="e.g. SDS2 Connection Design"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              />
            </div>
          </div>

          {/* Department & Trainer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Department *
              </label>
              <select
                required
                value={form.departmentId}
                onChange={(e) => setForm((p) => ({ ...p, departmentId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id || dept._id} value={dept.id || dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Trainer *
              </label>
              <select
                required
                value={form.trainerId}
                onChange={(e) => setForm((p) => ({ ...p, trainerId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              >
                <option value="">Select Trainer</option>
                {trainers.map((t) => {
                  const id = t.id || t._id
                  const roleLabel = (t.role || '').toUpperCase().replace('_', ' ')
                  return (
                    <option key={id} value={id}>
                      {`${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Unnamed'} ({roleLabel})
                    </option>
                  )
                })}
              </select>
              {loadingTrainers && (
                <p className="text-[10px] text-gray-400 mt-1">Loading trainers...</p>
              )}
            </div>
          </div>

          {/* Training Project */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Training Project *
            </label>
            <select
              required
              value={form.trainingProjectId}
              onChange={(e) => setForm((p) => ({ ...p, trainingProjectId: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
            >
              <option value="">Select Project</option>
              {projectsList.map((proj) => (
                <option key={proj.id || proj._id} value={proj.id || proj._id}>
                  {proj.name}
                </option>
              ))}
            </select>
            {loadingProjects && (
              <p className="text-[10px] text-gray-400 mt-1">Loading projects...</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Session Description
            </label>
            <textarea
              rows={2}
              value={form.sessionDescription}
              onChange={(e) => setForm((p) => ({ ...p, sessionDescription: e.target.value }))}
              placeholder="Optional details about the session..."
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700 resize-none"
            />
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Estimated Hours
              </label>
              <input
                type="text"
                value={form.estimatedHours}
                onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                placeholder="HH:MM (e.g. 02:00)"
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 outline-none text-sm text-gray-700"
              >
                <option value={1}>Low</option>
                <option value={2}>Medium</option>
                <option value={3}>High</option>
                <option value={4}>Critical</option>
              </select>
            </div>
          </div>

          {/* Select Requests */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Attach Approved Requests * ({form.requestIds.length} selected)
            </label>
            {allAvailableRequests.length === 0 ? (
              <div className="text-sm text-gray-400 italic py-3 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No approved requests available to batch
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                {allAvailableRequests.map((req) => {
                  const id = req.id || req._id
                  const checked = form.requestIds.includes(id)
                  return (
                    <label
                      key={id}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-green-50/60 transition-colors ${checked ? 'bg-green-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleRequest(id)}
                        className="w-4 h-4 accent-green-600 rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {req.task?.name || req.taskName || 'Task'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {req.topic} · {getUserFullName(req)}
                        </p>
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                submitting ||
                !form.sessionName.trim() ||
                !form.topic.trim() ||
                !form.departmentId ||
                !form.trainerId ||
                !form.trainingProjectId ||
                form.requestIds.length === 0
              }
              className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Layers className="w-4 h-4" />
              )}
              Create Batch
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Approve Training Modal ──────────────────────────────────────────────────
const ApproveTrainingModal = ({ request, onClose, onApproved }) => {
  const [form, setForm] = useState({
    name: request.task?.name || request.taskName || `Training: ${request.topic || 'General'}`,
    description: request.reason || `Training for task topic: ${request.topic || ''}`,
    estimatedHours: '02:00',
    dueDate: ''
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return toast.warning('Session name is required')
    if (!form.description.trim()) return toast.warning('Description is required')
    if (!/^\d{2}:\d{2}$/.test(form.estimatedHours)) {
      return toast.warning('Estimated Hours must be in HH:MM format (e.g. 02:00)')
    }
    if (!form.dueDate) return toast.warning('Due date is required')

    try {
      setSubmitting(true)
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        estimatedHours: String(form.estimatedHours),
        dueDate: new Date(form.dueDate).toISOString()
      }
      await Service.ApproveTraining(request.id || request._id, payload)
      toast.success('Training request approved successfully!')
      onApproved()
      onClose()
    } catch (err) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Failed to approve training request')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Approve Training Request</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-500">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm text-gray-600">
          <p>
            <strong>Topic:</strong> {request.topic || '—'}
          </p>
          <p>
            <strong>Task:</strong> {request.task?.name || request.taskName || '—'}
          </p>
          <p>
            <strong>Requested By:</strong> {getUserFullName(request)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase">Training Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 outline-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-600 uppercase">Description *</label>
            <textarea
              rows={2}
              required
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-green-400 outline-none text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Estimated Hours *</label>
              <input
                type="text"
                required
                value={form.estimatedHours}
                onChange={(e) => setForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                placeholder="HH:MM (e.g. 02:00)"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-600 uppercase">Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-400 outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#6bbd45] hover:bg-[#5aab37] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Confirm Approve
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── View Suggestion Modal ───────────────────────────────────────────────────
const ViewSuggestionModal = ({
  suggestion,
  selectedDeptId,
  batchesCount,
  onClose,
  onCreateBatch
}) => {
  const reqs = suggestion.suggestedRequests || suggestion.requests || suggestion.requestIds || []
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-green-100 text-green-700 rounded-xl">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Suggested Batch Details</h3>
              <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mt-0.5">
                {suggestion.topic}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Request detail list */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Participants List ({reqs.length})
          </p>
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-100 rounded-xl px-4 py-1.5">
            {reqs.map((r, idx) => (
              <div key={idx} className="py-3 flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {r.raisedByName || 'Participant'}
                  </p>
                  {r.teamName && (
                    <span className="inline-block text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-md font-medium mt-1">
                      {r.teamName}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs text-gray-500 block">
                    {fmt(r.requestedAt || r.createdAt)}
                  </span>
                </div>
              </div>
            ))}
            {reqs.length === 0 && (
              <p className="text-xs text-gray-400 italic py-4 text-center">
                No participants in suggestion
              </p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-gray-200 text-gray-600 font-semibold rounded-lg hover:bg-gray-50 text-sm"
          >
            Close
          </button>
          <button
            onClick={() => {
              onCreateBatch({
                topic: suggestion.topic,
                departmentId:
                  suggestion.departmentId ||
                  suggestion.department?._id ||
                  suggestion.department?.id ||
                  selectedDeptId,
                sessionName: `${suggestion.topic} Session — Batch ${batchesCount + 1}`,
                requestIds: reqs.map(
                  (r) => r.requestId || (typeof r === 'string' ? r : r.id || r._id)
                ),
                requests: reqs
              })
              onClose()
            }}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm shadow-md"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────
const PendingTrainings = () => {
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''

  const [activeTab, setActiveTab] = useState('requests')

  // ── Requests state ──
  const [trainings, setTrainings] = useState([])
  const [loadingReq, setLoadingReq] = useState(true)
  const [processingId, setProcessingId] = useState(null)
  const [rejectState, setRejectState] = useState({})
  const [approveModalData, setApproveModalData] = useState(null)

  // ── Batches state ──
  const [batches, setBatches] = useState([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [showCreateBatch, setShowCreateBatch] = useState(false)
  const [completingBatchId, setCompletingBatchId] = useState(null)
  const [suggestedBatches, setSuggestedBatches] = useState([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(true)
  const [prefillBatchData, setPrefillBatchData] = useState(null)
  const [departments, setDepartments] = useState([])
  const [selectedDeptId, setSelectedDeptId] = useState('')
  const [expandedBatchId, setExpandedBatchId] = useState(null)
  const [viewingSuggestion, setViewingSuggestion] = useState(null)

  const getBatchParticipants = (batch) => {
    const list = batch.requests || batch.suggestedRequests || batch.requestIds || []
    return list
      .map((r) => {
        if (typeof r === 'object' && r !== null) {
          return {
            name:
              r.raisedByName ||
              (r.raisedBy?.firstName
                ? `${r.raisedBy.firstName} ${r.raisedBy.lastName}`
                : r.requestedBy?.firstName
                  ? `${r.requestedBy.firstName} ${r.requestedBy.lastName}`
                  : getUserFullName(r)),
            team: r.teamName || '',
            date: r.requestedAt || r.createdAt || ''
          }
        }
        const found = trainings.find((t) => (t.id || t._id) === r)
        if (found) {
          return {
            name: getUserFullName(found),
            team: found.teamName || '',
            date: found.requestedAt || found.createdAt || ''
          }
        }
        return null
      })
      .filter(Boolean)
  }

  // ── Fetch requests ──
  const fetchTrainings = async () => {
    try {
      setLoadingReq(true)
      const res = await Service.GetPendingTraining()
      setTrainings(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch training requests')
    } finally {
      setLoadingReq(false)
    }
  }

  // ── Fetch batches ──
  const fetchBatches = async () => {
    try {
      setLoadingBatches(true)
      const res = await Service.GetAllTrainingBatches()
      setBatches(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch training batches')
    } finally {
      setLoadingBatches(false)
    }
  }

  const fetchSuggestions = async (deptId = selectedDeptId) => {
    try {
      setLoadingSuggestions(true)
      const res = await Service.GetSuggestedBatches(deptId)
      setSuggestedBatches(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error('Failed to fetch suggested batches', err)
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await Service.AllDepartments()
      setDepartments(Array.isArray(res) ? res : res?.data || [])
    } catch (err) {
      console.error('Failed to fetch departments', err)
    }
  }

  const refreshAll = () => {
    fetchTrainings()
    fetchBatches()
    fetchSuggestions(selectedDeptId)
    fetchDepartments()
  }

  useEffect(() => {
    fetchTrainings()
    fetchBatches()
    fetchDepartments()
  }, [])

  useEffect(() => {
    fetchSuggestions(selectedDeptId)
  }, [selectedDeptId])

  // (Direct direct approve is now handled via ApproveTrainingModal)

  const handleRejectOpen = (requestId) =>
    setRejectState((prev) => ({ ...prev, [requestId]: { open: true, reason: '' } }))

  const handleRejectSubmit = async (requestId) => {
    const state = rejectState[requestId]
    if (!state?.reason?.trim() || state.reason.trim().length < 5)
      return toast.warning('Please enter a rejection reason (min 5 characters)')
    try {
      setProcessingId(requestId)
      await Service.RejectTraining(requestId, { rejectionReason: state.reason.trim() })
      toast.success('Training request rejected')
      setRejectState((prev) => {
        const n = { ...prev }
        delete n[requestId]
        return n
      })
      fetchTrainings()
    } catch (err) {
      console.error(err)
      toast.error('Failed to reject training request')
    } finally {
      setProcessingId(null)
    }
  }

  const handleCompleteBatch = async (batchId) => {
    try {
      setCompletingBatchId(batchId)
      await Service.CompleteTrainingBatch(batchId)
      toast.success('Training batch marked as completed!')
      fetchBatches()
    } catch (err) {
      console.error(err)
      toast.error('Failed to complete training batch')
    } finally {
      setCompletingBatchId(null)
    }
  }

  const approvedRequests = trainings.filter(
    (r) => (r.status?.toUpperCase() || 'PENDING') === 'APPROVED'
  )
  const pendingCount = trainings.filter(
    (r) => (r.status?.toUpperCase() || 'PENDING') === 'PENDING'
  ).length
  const activeBatchCount = batches.filter(
    (b) => (b.status?.toUpperCase() || 'PENDING') !== 'COMPLETED'
  ).length

  // ── Access guard ──
  if (!ALLOWED_ROLES.includes(userRole)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-500 font-semibold uppercase tracking-wider text-sm">
          You do not have access to view training.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-xl text-green-600">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Training Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Review requests and manage training batches
            </p>
          </div>
        </div>
        <button
          onClick={refreshAll}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors text-sm font-semibold shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loadingReq || loadingBatches ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'requests'
              ? 'border-[#6bbd45] text-[#3a7a24] bg-[#6bbd45]/10'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Requests
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-400 text-white text-[10px] font-black rounded-full">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-5 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'batches'
              ? 'border-green-600 text-green-700 bg-green-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Batches
          {activeBatchCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 bg-green-500 text-white text-[10px] font-black rounded-full">
              {activeBatchCount}
            </span>
          )}
        </button>
      </div>

      {/* ══════════════════════ REQUESTS TAB ══════════════════════ */}
      {activeTab === 'requests' && (
        <>
          {loadingReq ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#6bbd45]" />
            </div>
          ) : trainings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <ClipboardList className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-semibold">No training requests</p>
              <p className="text-gray-400 text-sm">All requests have been actioned.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-3 bg-[#6bbd45]/10 border-b border-[#6bbd45]/20 flex items-center justify-between">
                <span className="text-sm font-bold text-[#3a7a24] uppercase tracking-wider">
                  {trainings.length} Total Request{trainings.length !== 1 ? 's' : ''}
                </span>
                <div className="flex gap-3 text-xs font-semibold">
                  <span className="text-yellow-700">{pendingCount} Pending</span>
                  <span className="text-green-700">
                    {trainings.filter((r) => r.status?.toUpperCase() === 'APPROVED').length}{' '}
                    Approved
                  </span>
                  <span className="text-red-700">
                    {trainings.filter((r) => r.status?.toUpperCase() === 'REJECTED').length}{' '}
                    Rejected
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold uppercase text-xs tracking-wide">
                      <th className="px-5 py-4">#</th>
                      <th className="px-5 py-4">Task</th>
                      <th className="px-5 py-4">Topic</th>
                      <th className="px-5 py-4 min-w-[200px]">Reason</th>
                      <th className="px-5 py-4">Requested By</th>
                      <th className="px-5 py-4">Date</th>
                      <th className="px-5 py-4">Status</th>
                      <th className="px-5 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {trainings.map((req, idx) => {
                      const isProcessing = processingId === (req.id || req._id)
                      const reqId = req.id || req._id
                      const rejectEntry = rejectState[reqId]
                      const status = req.status?.toUpperCase() || 'PENDING'
                      const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING
                      return (
                        <tr key={reqId} className="hover:bg-gray-50/70 transition-colors">
                          <td className="px-5 py-4 text-gray-500 font-medium">{idx + 1}</td>
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-800 truncate max-w-[160px]">
                              {req.task?.name || req.taskName || '—'}
                            </p>
                            {req.task?.serialNo && (
                              <p className="text-xs text-gray-400 mt-0.5">{req.task.serialNo}</p>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-block px-2.5 py-1 bg-[#6bbd45]/10 text-[#3a7a24] rounded-full text-xs font-semibold">
                              {req.topic || '—'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-gray-600 max-w-[200px]">
                            <p className="line-clamp-2 text-xs leading-relaxed">
                              {req.reason || '—'}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-700">{getUserFullName(req)}</p>
                            {getUserRole(req) && (
                              <p className="text-xs text-gray-400 mt-0.5 capitalize">
                                {getUserRole(req).replace(/_/g, ' ')}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                            {fmt(req.requestedAt || req.createdAt)}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {status === 'PENDING' ? (
                              <div className="flex flex-col gap-2">
                                {rejectEntry?.open ? (
                                  <div className="space-y-2 min-w-[200px]">
                                    <textarea
                                      rows={2}
                                      value={rejectEntry.reason}
                                      onChange={(e) =>
                                        setRejectState((prev) => ({
                                          ...prev,
                                          [reqId]: { ...prev[reqId], reason: e.target.value }
                                        }))
                                      }
                                      placeholder="Rejection reason..."
                                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs outline-none focus:border-red-400 resize-none"
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleRejectSubmit(reqId)}
                                        disabled={isProcessing}
                                        className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1 disabled:opacity-60"
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                          <XCircle className="w-3 h-3" />
                                        )}{' '}
                                        Confirm
                                      </button>
                                      <button
                                        onClick={() =>
                                          setRejectState((prev) => {
                                            const n = { ...prev }
                                            delete n[reqId]
                                            return n
                                          })
                                        }
                                        className="flex-1 py-1.5 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setApproveModalData(req)}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6bbd45] hover:bg-[#5aab37] text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-60"
                                    >
                                      <CheckCircle className="w-3 h-3" /> Approve
                                    </button>
                                    <button
                                      onClick={() => handleRejectOpen(reqId)}
                                      disabled={isProcessing}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-xs font-bold rounded-lg disabled:opacity-60"
                                    >
                                      <XCircle className="w-3 h-3" /> Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400 italic">No actions</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════════════════ BATCHES TAB ══════════════════════ */}
      {activeTab === 'batches' && (
        <>
          {/* Batch toolbar */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {batches.length} batch{batches.length !== 1 ? 'es' : ''} total
            </p>
            <button
              onClick={() => {
                setPrefillBatchData(null)
                setShowCreateBatch(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" /> New Batch
            </button>
          </div>

          {/* Suggested Batches Section */}
          <div className="bg-green-50/30 border border-green-100 rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-bold text-green-800 uppercase tracking-wider flex items-center gap-1.5">
                <span className="p-1 bg-green-100 text-green-700 rounded-lg">💡</span>
                Auto-Suggested Batches
              </h3>
              {/* Department Dropdown for filtering */}
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-gray-500">Filter by Department:</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-xl text-xs font-semibold focus:border-green-400 outline-none shadow-sm"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept.id || dept._id} value={dept.id || dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {loadingSuggestions ? (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-green-500" /> Loading suggestions...
              </div>
            ) : suggestedBatches.length === 0 ? (
              <p className="text-xs text-gray-400 italic">
                No automatic grouping suggestions. Approve more training requests to get
                recommendations.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedBatches.map((s, idx) => {
                  const reqs = s.suggestedRequests || s.requests || s.requestIds || []
                  const participantsStr =
                    reqs
                      .map((r) => r.raisedByName || getUserFullName(r))
                      .filter(Boolean)
                      .join(', ') || '—'
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-green-100 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm hover:border-green-200 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold truncate max-w-[120px]">
                            {s.topic}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {reqs.length} request{reqs.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 mt-2 truncate">
                          {s.topic} Session Group
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setViewingSuggestion(s)}
                          className="flex-1 py-2 border border-green-200 text-green-700 hover:bg-green-50 text-xs font-bold rounded-lg transition-colors text-center shadow-sm"
                        >
                          View Batch
                        </button>
                        <button
                          onClick={() => {
                            setPrefillBatchData({
                              topic: s.topic,
                              departmentId:
                                s.departmentId ||
                                s.department?._id ||
                                s.department?.id ||
                                selectedDeptId,
                              sessionName: `${s.topic} Session — Batch ${batches.length + 1}`,
                              requestIds: reqs.map(
                                (r) => r.requestId || (typeof r === 'string' ? r : r.id || r._id)
                              ),
                              requests: reqs
                            })
                            setShowCreateBatch(true)
                          }}
                          className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm font-bold"
                        >
                          Create Batch
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {loadingBatches ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
          ) : batches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Layers className="w-12 h-12 text-gray-300" />
              <p className="text-gray-500 font-semibold">No training batches yet</p>
              <p className="text-gray-400 text-sm">
                Create a batch from approved training requests.
              </p>
              <button
                onClick={() => setShowCreateBatch(true)}
                className="mt-2 flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm transition-colors"
              >
                <Plus className="w-4 h-4" /> Create First Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {batches.map((batch) => {
                const batchId = batch.id || batch._id
                const bStatus = batch.status?.toUpperCase() || 'PENDING'
                const bCfg = BATCH_STATUS_CONFIG[bStatus] || BATCH_STATUS_CONFIG.PENDING
                const isCompleting = completingBatchId === batchId
                return (
                  <div
                    key={batchId}
                    onClick={() => setExpandedBatchId(expandedBatchId === batchId ? null : batchId)}
                    className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer select-none"
                  >
                    {/* Card header */}
                    <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-base truncate">
                          {batch.sessionName || batch.topic || 'Batch'}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold">
                          {batch.topic || '—'}
                        </span>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${bCfg.bg} ${bCfg.text} ${bCfg.border}`}
                      >
                        {bCfg.label}
                      </span>
                    </div>

                    {/* Card body */}
                    <div className="px-5 py-4 space-y-2.5 text-sm text-gray-600">
                      {batch.sessionDescription && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {batch.sessionDescription}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                        {batch.estimatedHours && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {batch.estimatedHours}h
                          </span>
                        )}
                        {batch.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {fmt(batch.dueDate)}
                          </span>
                        )}
                        {batch.requestIds?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {batch.requestIds.length} participant
                            {batch.requestIds.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {batch.priority && (
                          <span
                            className={`flex items-center gap-1 font-semibold ${
                              batch.priority === 'CRITICAL' || batch.priority === 4
                                ? 'text-red-600'
                                : batch.priority === 'HIGH' || batch.priority === 3
                                  ? 'text-orange-600'
                                  : batch.priority === 'MEDIUM' || batch.priority === 2
                                    ? 'text-blue-600'
                                    : 'text-gray-500'
                            }`}
                          >
                            {batch.priority === 1 || batch.priority === 'LOW'
                              ? 'Low'
                              : batch.priority === 2 || batch.priority === 'MEDIUM'
                                ? 'Medium'
                                : batch.priority === 3 || batch.priority === 'HIGH'
                                  ? 'High'
                                  : batch.priority === 4 || batch.priority === 'CRITICAL'
                                    ? 'Critical'
                                    : batch.priority}
                          </span>
                        )}
                      </div>
                      {batch.createdAt && (
                        <p className="text-[11px] text-gray-400">Created {fmt(batch.createdAt)}</p>
                      )}
                    </div>

                    {/* Collapsible Participants area */}
                    {batch.requestIds?.length > 0 && (
                      <div
                        className="border-t border-gray-100 px-5 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            setExpandedBatchId(expandedBatchId === batchId ? null : batchId)
                          }
                          className="flex items-center justify-between w-full text-xs font-semibold text-gray-500 hover:text-green-700 transition-colors"
                        >
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            Participants ({batch.requestIds.length})
                          </span>
                          <span>
                            {expandedBatchId === batchId ? 'Hide Details' : 'Show Details'}
                          </span>
                        </button>
                        {expandedBatchId === batchId && (
                          <div className="mt-3 space-y-2 pl-3 border-l-2 border-green-100 max-h-36 overflow-y-auto pr-1">
                            {getBatchParticipants(batch).map((p, pIdx) => (
                              <div key={pIdx} className="text-xs flex justify-between items-start">
                                <div className="min-w-0">
                                  <span className="font-semibold text-gray-700 block truncate">
                                    {p.name}
                                  </span>
                                  {p.team && (
                                    <span className="inline-block text-[9px] bg-green-50 text-green-600 px-1 py-0.5 rounded font-medium mt-0.5">
                                      {p.team}
                                    </span>
                                  )}
                                </div>
                                {p.date && (
                                  <span className="text-[10px] text-gray-400 whitespace-nowrap shrink-0 ml-2 mt-0.5">
                                    {fmt(p.date)}
                                  </span>
                                )}
                              </div>
                            ))}
                            {getBatchParticipants(batch).length === 0 && (
                              <p className="text-xs text-gray-400 italic">
                                No participant details loaded
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Card footer */}
                    {bStatus !== 'COMPLETED' && bStatus !== 'CANCELLED' && (
                      <div
                        className="px-5 py-3 border-t border-gray-100 bg-gray-50"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleCompleteBatch(batchId)}
                          disabled={isCompleting}
                          className="w-full flex items-center justify-center gap-2 py-2 bg-[#6bbd45] hover:bg-[#5aab37] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-60"
                        >
                          {isCompleting ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trophy className="w-3 h-3" />
                          )}
                          Mark as Completed
                        </button>
                      </div>
                    )}
                    {bStatus === 'COMPLETED' && (
                      <div
                        className="px-5 py-3 border-t border-gray-100 bg-green-50 flex items-center justify-center gap-1.5 text-green-700 text-xs font-bold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Batch Completed
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Create Batch Modal */}
      {showCreateBatch && (
        <CreateBatchModal
          approvedRequests={approvedRequests}
          prefillData={prefillBatchData}
          departments={departments}
          onClose={() => {
            setShowCreateBatch(false)
            setPrefillBatchData(null)
          }}
          onCreated={() => {
            fetchBatches()
            fetchSuggestions(selectedDeptId)
          }}
        />
      )}

      {/* Approve Request Modal */}
      {approveModalData && (
        <ApproveTrainingModal
          request={approveModalData}
          onClose={() => setApproveModalData(null)}
          onApproved={fetchTrainings}
        />
      )}

      {/* View Suggestion Details Modal */}
      {viewingSuggestion && (
        <ViewSuggestionModal
          suggestion={viewingSuggestion}
          selectedDeptId={selectedDeptId}
          batchesCount={batches.length}
          onClose={() => setViewingSuggestion(null)}
          onCreateBatch={(prefilled) => {
            setPrefillBatchData(prefilled)
            setShowCreateBatch(true)
          }}
        />
      )}
    </div>
  )
}

export default PendingTrainings
