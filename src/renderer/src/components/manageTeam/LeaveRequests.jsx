import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, FileSpreadsheet, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
import HrLeaveReportPage from '../../pages/HrLeaveReportPage'
import {
  extractList,
  formatLeaveDate,
  getEmployeeName,
  getLeaveType,
  getRequestId,
  getRequestStatus
} from './leaveUtils'

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700 ring-amber-200',
  APPROVED: 'bg-green-50 text-green-700 ring-green-200',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200',
  LOP: 'bg-orange-50 text-orange-700 ring-orange-200',
  CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-200'
}

const normalizeRole = (role) => String(role || '').toUpperCase().trim().replace(/[\s-]+/g, '_')
const getRequesterRole = (request) => normalizeRole(
  request?.employee?.role || request?.user?.role || request?.employeeRole || request?.userRole || request?.role
)
const getRequesterId = (request) => request?.user?.id || request?.employee?.id || request?.requester?.id || request?.userId || request?.employeeId
const canReviewByRole = (approverRole, requesterRole) => {
  if (approverRole === 'ADMIN') return true
  if (requesterRole === 'HUMAN_RESOURCE') return approverRole === 'DEPUTY_MANAGER'
  if (requesterRole === 'DEPUTY_MANAGER') return false
  if (['OPERATION_EXECUTIVE', 'PROJECT_MANAGER_OFFICER'].includes(requesterRole)) {
    return ['HUMAN_RESOURCE', 'DEPUTY_MANAGER'].includes(approverRole)
  }
  return ['HUMAN_RESOURCE', 'DEPUTY_MANAGER'].includes(approverRole)
}

const LeaveRequests = ({ teamManager = false }) => {
  const [requests, setRequests] = useState([])
  const [managedTeamId, setManagedTeamId] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [decisionRequest, setDecisionRequest] = useState(null)
  const [decisionType, setDecisionType] = useState('APPROVED')
  const [decisionNote, setDecisionNote] = useState('')
  const [showHrReport, setShowHrReport] = useState(false)
  const approverRole = normalizeRole(sessionStorage.getItem('userRole'))

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      let response
      if (teamManager) {
        const teamsResponse = await Service.AllTeam()
        const teams = extractList(teamsResponse, ['teams', 'items'])
        const userId = String(sessionStorage.getItem('userId') || '')
        const managedTeams = teams.filter((team) => {
          const manager = team.managerID || team.managerId || team.manager
          const managerId = typeof manager === 'object' ? manager?.id || manager?._id : manager
          const projectManaged = (team.project || team.projects || []).some((project) => {
            const projectManager = project.managerID || project.managerId || project.manager
            const projectManagerId = typeof projectManager === 'object' ? projectManager?.id || projectManager?._id : projectManager
            return String(projectManagerId || '') === userId
          })
          const isTeamMember = (team.members || []).some((member) =>
            String(member.userId || member.user?.id || member.member?.id || '') === userId
          )
          const directlyManaged = String(managerId || '') === userId || projectManaged
          if (approverRole === 'PROJECT_MANAGER') return directlyManaged
          return directlyManaged || isTeamMember || approverRole === 'DEPT_MANAGER'
        })
        const teamIds = managedTeams.map((team) => team.id || team._id).filter(Boolean)
        if (!teamIds.length) {
          setManagedTeamId('')
          setRequests([])
          return
        }
        setManagedTeamId(teamIds[0])
        const teamResponses = await Promise.all(teamIds.map(async (teamId) => ({
          teamId,
          response: approverRole === 'PROJECT_MANAGER'
            ? await Service.GetTeamLeaveRequestsByManager(teamId, userId)
            : await Service.GetTeamLeaveRequests(teamId)
        })))
        const requestsById = new Map()
        teamResponses.forEach(({ teamId, response: teamResponse }) => {
          extractList(teamResponse, ['requests', 'items']).forEach((request, index) => {
            const requestId = getRequestId(request) || `${teamId}-${index}`
            if (!requestsById.has(requestId)) requestsById.set(requestId, { ...request, _teamId: teamId })
          })
        })
        setRequests([...requestsById.values()])
        return
      } else {
        response = await Service.GetLeaveRequests()
      }
      setRequests(extractList(response, ['requests', 'items']))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load leave requests.')
    } finally {
      setLoading(false)
    }
  }, [approverRole, teamManager])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const visibleRequests = useMemo(
    () =>
      requests.filter((request) => {
        const status = getRequestStatus(request)
        const matchesFilter = filter === 'ALL' || status === filter
        const matchesLeaveType = leaveTypeFilter === 'ALL' || getLeaveType(request).toUpperCase() === leaveTypeFilter
        const query = search.trim().toLowerCase()
        const matchesSearch =
          !query ||
          [
            getEmployeeName(request),
            getLeaveType(request),
            request?.reason,
            request?.employee?.email,
            request?.user?.email
          ].some((value) =>
            String(value || '')
              .toLowerCase()
              .includes(query)
          )
        return matchesFilter && matchesLeaveType && matchesSearch
      }),
    [filter, leaveTypeFilter, requests, search]
  )

  const updateRequest = async (request, action) => {
    const id = getRequestId(request)
    if (!id) {
      toast.error('This leave request is missing its ID.')
      return
    }
    setUpdatingId(id)
    try {
      if (teamManager && action === 'approve') await Service.ApproveTeamLeaveRequest(request._teamId || managedTeamId, id)
      else if (teamManager) await Service.RejectTeamLeaveRequest(request._teamId || managedTeamId, id)
      else if (action === 'approve') await Service.ApproveLeaveRequest(id)
      else await Service.RejectLeaveRequest(id)
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}.`)
      await loadRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || `Unable to ${action} this leave request.`)
    } finally {
      setUpdatingId(null)
    }
  }

  const openDecision = (request) => {
    setDecisionRequest(request)
    setDecisionType('APPROVED')
    setDecisionNote('')
  }

  const submitDecision = async (event) => {
    event.preventDefault()
    const requestId = getRequestId(decisionRequest)
    if (!requestId) return toast.error('This leave request is missing its ID.')
    const requiresNote = decisionType === 'REJECTED' || decisionType === 'LOP'
    if (requiresNote && !decisionNote.trim()) return toast.error('Add a reason for rejection or LOP.')
    setUpdatingId(requestId)
    try {
      const payload = { note: decisionNote.trim() || undefined }
      const requestTeamId = decisionRequest?._teamId || managedTeamId
      if (decisionType === 'REJECTED') {
        if (teamManager) await Service.RejectTeamLeaveRequest(requestTeamId, requestId, payload)
        else await Service.RejectLeaveRequest(requestId, payload)
      } else if (decisionType === 'LOP') {
        if (teamManager) await Service.LopTeamLeaveRequest(requestTeamId, requestId, payload)
        else await Service.LopLeaveRequest(requestId, payload)
      } else if (teamManager) await Service.ApproveTeamLeaveRequest(requestTeamId, requestId, payload)
      else await Service.ApproveLeaveRequest(requestId, payload)
      toast.success(decisionType === 'REJECTED' ? 'Leave request rejected.' : decisionType === 'LOP' ? 'Leave request marked as LOP.' : 'Leave request approved.')
      setDecisionRequest(null)
      await loadRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update this leave request.')
    } finally {
      setUpdatingId(null)
    }
  }

  const pendingCount = requests.filter((request) => getRequestStatus(request) === 'PENDING').length

  return (
    <section className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">
            People operations
          </p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900">{teamManager ? 'Team leave requests' : 'Leave requests'}</h2>
          <p className="mt-1 text-sm text-gray-500">
            {teamManager ? 'Review and manage leave applications from your team.' : 'Review and manage employee leave applications.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!teamManager && <button type="button" onClick={() => setShowHrReport(true)} className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-800"><FileSpreadsheet size={16} /> Generate HR report</button>}
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock3 size={18} className="text-amber-700" />
            <span className="text-sm font-semibold text-amber-900">{pendingCount} pending</span>
          </div>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'LOP'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                filter === status
                  ? 'bg-green-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'ALL' ? 'All requests' : status}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 md:w-72">
          <Search size={16} className="shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employee or leave type"
            className="w-full bg-transparent text-sm outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Leave type
          <select value={leaveTypeFilter} onChange={(event) => setLeaveTypeFilter(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium normal-case text-gray-700 outline-none focus:border-green-600">
            <option value="ALL">All types</option>
            <option value="LOP">LOP</option>
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-gray-500">
            <RefreshCw size={16} className="animate-spin" /> Loading leave requests…
          </div>
        ) : visibleRequests.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-gray-700">No leave requests found</p>
            <p className="mt-1 text-sm text-gray-500">Try another filter or refresh the list.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Employee</th>
                  <th className="px-5 py-3 font-semibold">Leave type</th>
                  <th className="px-5 py-3 font-semibold">Dates</th>
                  <th className="px-5 py-3 font-semibold">Reason</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleRequests.map((request, index) => {
                  const id = getRequestId(request) ?? index
                  const status = getRequestStatus(request)
                  const isUpdating = updatingId === id
                  const requesterRole = getRequesterRole(request)
                  const currentUserId = String(sessionStorage.getItem('userId') || '')
                  const requesterId = String(getRequesterId(request) || '')
                  const isOwnRequest = Boolean(currentUserId && requesterId && requesterId === currentUserId)
                  const isTeamManagerReview = teamManager &&
                    ['PROJECT_MANAGER', 'TEAM_LEAD', 'DEPT_MANAGER'].includes(approverRole) &&
                    !['HUMAN_RESOURCE', 'DEPUTY_MANAGER', 'OPERATION_EXECUTIVE', 'PROJECT_MANAGER_OFFICER'].includes(requesterRole)
                  const canReview = !isOwnRequest && (canReviewByRole(approverRole, requesterRole) || isTeamManagerReview)
                  return (
                    <tr key={id} className="align-top hover:bg-gray-50/70">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">{getEmployeeName(request)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {request?.employee?.email ||
                            request?.user?.email ||
                            request?.employee?.username ||
                            ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">
                        {getLeaveType(request)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                        <p>{formatLeaveDate(request?.startDate || request?.start_date)}</p>
                        <p className="mt-1 text-xs text-gray-400">
                          to {formatLeaveDate(request?.endDate || request?.end_date)}
                          {request?.days != null &&
                            ` · ${request.days} day${request.days === 1 ? '' : 's'}`}
                        </p>
                      </td>
                      <td className="max-w-xs px-5 py-4 text-gray-600">
                        <p className="line-clamp-2">{request?.reason || '—'}</p>
                        {request?.decisionNote && <p className="mt-1 line-clamp-2 text-xs text-gray-500">Decision note: {request.decisionNote}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status] || statusStyles.PENDING}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {status === 'PENDING' && canReview ? (
                          <button type="button" disabled={isUpdating} onClick={() => openDecision(request)} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50">Review</button>
                        ) : (
                          <span className="text-xs text-gray-400">{status === 'PENDING' ? 'Not assigned to you' : 'No action'}</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {decisionRequest && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
        <form onSubmit={submitDecision} role="dialog" aria-modal="true" aria-labelledby="team-leave-decision-title" className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-xl">
          <div>
            <h3 id="team-leave-decision-title" className="text-lg font-bold text-gray-900">Review leave request</h3>
            <p className="mt-1 text-sm text-gray-500">{getEmployeeName(decisionRequest)} · {getLeaveType(decisionRequest)}</p>
          </div>
          <label className="block text-sm font-semibold text-gray-700">Decision
            <select value={decisionType} onChange={(event) => setDecisionType(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5">
              <option value="APPROVED">Approve as requested</option>
              <option value="LOP">Approve as LOP</option>
              <option value="REJECTED">Reject request</option>
            </select>
          </label>
          <label className="block text-sm font-semibold text-gray-700">{decisionType === 'REJECTED' ? 'Rejection reason' : 'Reason'}{decisionType !== 'APPROVED' && <span className="text-red-600"> *</span>}
            <textarea value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} required={decisionType !== 'APPROVED'} rows={4} maxLength={2000} placeholder={decisionType === 'LOP' ? 'Explain why this leave is being recorded as LOP' : 'Add a note for the employee'} className="mt-1 block w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-green-600" />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDecisionRequest(null)} disabled={updatingId !== null} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
            <button type="submit" disabled={updatingId !== null} className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{updatingId !== null ? 'Saving…' : 'Save decision'}</button>
          </div>
        </form>
      </div>}
      {showHrReport && <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4" role="presentation">
        <section role="dialog" aria-modal="true" aria-label="HR leave report" className="mx-auto my-4 max-h-[calc(100vh-2rem)] max-w-7xl overflow-y-auto rounded-2xl bg-gray-50 shadow-2xl">
          <div className="sticky top-0 z-10 flex justify-end border-b border-gray-200 bg-white p-3">
            <button type="button" onClick={() => setShowHrReport(false)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"><X size={15} /> Close report</button>
          </div>
          <HrLeaveReportPage />
        </section>
      </div>}
    </section>
  )
}

export default LeaveRequests
