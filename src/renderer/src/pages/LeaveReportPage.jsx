import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, RefreshCw, Send } from 'lucide-react'
import { toast } from 'react-toastify'
import Service from '../api/Service'
import {
  extractList,
  formatLeaveDate,
  getLeaveType,
  getRequestId,
  getRequestStatus
} from '../components/manageTeam/leaveUtils'

const statusStyles = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-green-50 text-green-700',
  REJECTED: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600'
}

const defaultLeaveTypes = ['SICK', 'PAID', 'CASUAL']

const getBalance = (balance, keys) => {
  for (const key of keys) {
    const value = balance?.[key]
    if (value !== undefined && value !== null) return value
  }
  return '—'
}

const getRemainingDays = (balance) => {
  const remaining = getBalance(balance, ['remaining', 'available', 'balance', 'remainingDays'])
  if (remaining !== '—') return remaining
  const allowance = Number(
    getBalance(balance, ['allowance', 'annualAllowance', 'total', 'allocated'])
  )
  const used = Number(getBalance(balance, ['used', 'usedDays', 'taken']))
  return Number.isFinite(allowance) && Number.isFinite(used) ? allowance - used : '—'
}

const LeaveReportPage = () => {
  const [balances, setBalances] = useState([])
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ type: '', startDate: '', endDate: '', reason: '' })

  const loadLeaveData = useCallback(async () => {
    setLoading(true)
    try {
      const [balanceResponse, requestResponse] = await Promise.all([
        Service.GetMyLeaveBalances(),
        Service.GetMyLeaveRequests()
      ])
      const nextBalances = extractList(balanceResponse, ['balances', 'items'])
      setBalances(nextBalances)
      setRequests(extractList(requestResponse, ['requests', 'items']))
      setForm((current) => ({
        ...current,
        type: current.type || (nextBalances.length ? getLeaveType(nextBalances[0]) : '')
      }))
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to load your leave information.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLeaveData()
  }, [loadLeaveData])

  const pendingCount = useMemo(
    () => requests.filter((request) => getRequestStatus(request) === 'PENDING').length,
    [requests]
  )
  const leaveTypes = useMemo(() => {
    const availableTypes = [...new Set(balances.map((balance) => getLeaveType(balance)).filter(Boolean))]
    return availableTypes.length ? availableTypes : defaultLeaveTypes
  }, [balances])

  const updateForm = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submitRequest = async (event) => {
    event.preventDefault()
    if (!form.type || !form.startDate || !form.endDate) {
      toast.error('Complete all fields before submitting your request.')
      return
    }
    if (form.endDate < form.startDate) {
      toast.error('The end date must be on or after the start date.')
      return
    }
    setSubmitting(true)
    try {
      await Service.ApplyForLeave({
        type: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason.trim() || undefined
      })
      toast.success('Your leave request has been submitted.')
      setForm((current) => ({ ...current, startDate: '', endDate: '', reason: '' }))
      await loadLeaveData()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to submit your leave request.')
    } finally {
      setSubmitting(false)
    }
  }

  const cancelRequest = async (request) => {
    const id = getRequestId(request)
    if (!id) {
      toast.error('This leave request is missing its ID.')
      return
    }
    try {
      await Service.CancelLeaveRequest(id)
      toast.success('Leave request cancelled.')
      await loadLeaveData()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to cancel this leave request.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Time away</p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">Leave Report</h1>
          <p className="mt-1 text-sm text-gray-500">
            Check your available leave and track your applications.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <Clock3 size={18} className="text-amber-700" />
          <span className="text-sm font-semibold text-amber-900">
            {pendingCount} pending request{pendingCount === 1 ? '' : 's'}
          </span>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-gray-500">
          <RefreshCw size={16} className="animate-spin" /> Loading your leave report…
        </div>
      ) : (
        <>
          <section>
            <div className="mb-3 flex items-center gap-2">
              <CalendarDays size={18} className="text-green-700" />
              <h2 className="font-bold text-gray-900">Available leave</h2>
            </div>
            {balances.length === 0 ? (
              <p className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No leave balance information is available yet.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {balances.map((balance, index) => (
                  <article
                    key={balance?.id ?? balance?._id ?? `${getLeaveType(balance)}-${index}`}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <p className="text-sm font-semibold text-gray-600">{getLeaveType(balance)}</p>
                    <p className="mt-3 text-3xl font-bold text-gray-900">
                      {getRemainingDays(balance)}
                      <span className="ml-1 text-sm font-medium text-gray-400">days left</span>
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      {getBalance(balance, ['used'])} used of{' '}
                      {getBalance(balance, ['allowance', 'annualAllowance'])}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-wider text-green-700">
                  New application
                </p>
                <h2 className="mt-1 text-lg font-bold text-gray-900">Request leave</h2>
              </div>
              <form onSubmit={submitRequest} className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">
                  Leave type
                  <select
                    name="type"
                    value={form.type}
                    onChange={updateForm}
                    required
                    className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  >
                    <option value="" disabled>
                      Select leave type
                    </option>
                    {leaveTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Start date
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={updateForm}
                      required
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </label>
                  <label className="block text-sm font-medium text-gray-700">
                    End date
                    <input
                      type="date"
                      name="endDate"
                      min={form.startDate || undefined}
                      value={form.endDate}
                      onChange={updateForm}
                      required
                      className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </label>
                </div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                  <textarea
                    name="reason"
                    value={form.reason}
                    onChange={updateForm}
                    rows={3}
                    placeholder="Add a short explanation"
                    className="mt-1.5 w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send size={16} /> {submitting ? 'Submitting…' : 'Submit request'}
                </button>
              </form>
            </section>

            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-bold text-gray-900">Request history</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Your recent and past leave applications.
                </p>
              </div>
              {requests.length === 0 ? (
                <p className="py-12 text-center text-sm text-gray-500">
                  You have not submitted any leave requests.
                </p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {requests.map((request, index) => {
                    const id = getRequestId(request) ?? index
                    const status = getRequestStatus(request)
                    return (
                      <li
                        key={id}
                        className="flex flex-wrap items-center justify-between gap-4 px-5 py-4"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900">{getLeaveType(request)}</p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[status] || statusStyles.PENDING}`}
                            >
                              {status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatLeaveDate(request?.startDate || request?.start_date)} –{' '}
                            {formatLeaveDate(request?.endDate || request?.end_date)}
                            {request?.days != null &&
                              ` · ${request.days} day${request.days === 1 ? '' : 's'}`}
                          </p>
                          {request?.reason && (
                            <p className="mt-2 max-w-lg truncate text-sm text-gray-600">
                              {request.reason}
                            </p>
                          )}
                        </div>
                        {status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => cancelRequest(request)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          </div>
        </>
      )}
    </div>
  )
}

export default LeaveReportPage
