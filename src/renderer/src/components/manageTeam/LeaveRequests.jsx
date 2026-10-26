import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Clock3, RefreshCw, Search, X } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../../api/Service'
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
  CANCELLED: 'bg-gray-100 text-gray-600 ring-gray-200'
}

const LeaveRequests = () => {
  const [requests, setRequests] = useState([])
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await Service.GetLeaveRequests()
      setRequests(extractList(response, ['requests', 'items']))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load leave requests.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const visibleRequests = useMemo(
    () =>
      requests.filter((request) => {
        const status = getRequestStatus(request)
        const matchesFilter = filter === 'ALL' || status === filter
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
        return matchesFilter && matchesSearch
      }),
    [filter, requests, search]
  )

  const updateRequest = async (request, action) => {
    const id = getRequestId(request)
    if (!id) {
      toast.error('This leave request is missing its ID.')
      return
    }
    setUpdatingId(id)
    try {
      if (action === 'approve') await Service.ApproveLeaveRequest(id)
      else await Service.RejectLeaveRequest(id)
      toast.success(`Leave request ${action === 'approve' ? 'approved' : 'rejected'}.`)
      await loadRequests()
    } catch (error) {
      toast.error(error?.response?.data?.message || `Unable to ${action} this leave request.`)
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
          <h2 className="mt-1 text-2xl font-bold text-gray-900">Leave requests</h2>
          <p className="mt-1 text-sm text-gray-500">
            Review and manage employee leave applications.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock3 size={18} className="text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">{pendingCount} pending</span>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
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
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status] || statusStyles.PENDING}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {status === 'PENDING' ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateRequest(request, 'approve')}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-2 text-xs font-bold text-white hover:bg-green-800 disabled:opacity-50"
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => updateRequest(request, 'reject')}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No action</span>
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
    </section>
  )
}

export default LeaveRequests
