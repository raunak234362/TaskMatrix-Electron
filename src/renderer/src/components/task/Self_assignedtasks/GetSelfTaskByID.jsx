import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarDays, CheckCircle2, Clock3, Loader2, MessageSquare, Pause, Play, Square, X } from 'lucide-react'
import { toast } from 'react-toastify'
import SelfTaskService from '../../../api/services/selftask.service'

const formatDateTime = (value) => {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const GetSelfTaskByID = ({ id, onClose, refresh }) => {
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [comment, setComment] = useState('')

  const fetchTask = useCallback(async () => {
    if (id == null) return
    try {
      setLoading(true)
      const response = await SelfTaskService.getSelfTaskById(id)
      const payload = response?.data ?? response
      setTask(payload?.data ?? payload?.task ?? payload?.selfAssignedTask ?? payload ?? null)
    } catch (error) {
      console.error('Failed to load self-task details:', error)
      toast.error('Failed to load task details')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  const activeSession = useMemo(
    () => task?.workingHourTask?.find((session) => !session.ended_at),
    [task?.workingHourTask]
  )
  const status = String(task?.status || 'ASSIGNED').toUpperCase()
  const totalSeconds = (task?.workingHourTask || []).reduce(
    (total, session) => total + (Number(session.duration_seconds) || 0),
    0
  )
  const totalTime = `${Math.floor(totalSeconds / 3600)}h ${Math.floor((totalSeconds % 3600) / 60)}m`

  const runAction = async (action) => {
    const taskId = task?.id ?? task?._id ?? id
    if (processing || taskId == null) return
    if (action === 'end' && !window.confirm('End this task and mark it completed?')) return

    const actionMap = {
      start: SelfTaskService.startSelfTask,
      pause: SelfTaskService.pauseSelfTask,
      resume: SelfTaskService.resumeSelfTask,
      end: SelfTaskService.endSelfTask
    }

    try {
      setProcessing(true)
      await actionMap[action](taskId)
      const successMessage = {
        start: 'Task started',
        pause: 'Task paused',
        resume: 'Task resumed',
        end: 'Task completed'
      }
      toast.success(successMessage[action])
      await fetchTask()
      refresh?.()
    } catch (error) {
      console.error(`Failed to ${action} self-task:`, error)
      toast.error(error?.response?.data?.message || `Could not ${action} task`)
    } finally {
      setProcessing(false)
    }
  }

  const addComment = async (event) => {
    event.preventDefault()
    const value = comment.trim()
    const taskId = task?.id ?? task?._id ?? id
    if (!value || processing || taskId == null) return

    try {
      setProcessing(true)
      await SelfTaskService.addSelfTaskComment(taskId, value)
      setComment('')
      toast.success('Comment added')
      await fetchTask()
      refresh?.()
    } catch (error) {
      console.error('Failed to add self-task comment:', error)
      toast.error(error?.response?.data?.message || 'Could not add comment')
    } finally {
      setProcessing(false)
    }
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}>
      <section role="dialog" aria-modal="true" aria-labelledby="self-task-title" className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Self-assigned task</p>
            <h2 id="self-task-title" className="mt-1 text-xl font-bold text-gray-900">{task?.name || 'Task details'}</h2>
            {task?.serialNo && <p className="mt-1 font-mono text-xs text-gray-500">{task.serialNo}</p>}
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-gray-500 hover:bg-gray-200 hover:text-gray-900" aria-label="Close task details">
            <X className="h-5 w-5" />
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin text-green-600" /> Loading task details...
          </div>
        ) : !task ? (
          <div className="p-10 text-center text-sm text-gray-500">Task details are unavailable.</div>
        ) : (
          <div className="overflow-y-auto p-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Status</p>
                <p className="mt-1 font-semibold text-gray-900">{status.replaceAll('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total tracked</p>
                <p className="mt-1 font-semibold text-gray-900">{totalTime}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {status === 'ASSIGNED' && (
                  <button type="button" disabled={processing} onClick={() => runAction('start')} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                    <Play className="h-4 w-4" /> Start
                  </button>
                )}
                {status === 'IN_PROGRESS' && (
                  <>
                    <button type="button" disabled={processing} onClick={() => runAction('pause')} className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50">
                      <Pause className="h-4 w-4" /> Pause
                    </button>
                    <button type="button" disabled={processing} onClick={() => runAction('end')} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                      <Square className="h-4 w-4" /> End task
                    </button>
                  </>
                )}
                {(status === 'ON_HOLD' || status === 'BREAK') && (
                  <>
                    <button type="button" disabled={processing} onClick={() => runAction('resume')} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">
                      <Play className="h-4 w-4" /> Resume
                    </button>
                    <button type="button" disabled={processing} onClick={() => runAction('end')} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                      <Square className="h-4 w-4" /> End task
                    </button>
                  </>
                )}
                {status === 'COMPLETED' && <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-4 w-4" /> Completed</span>}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-800">{task.description || 'No description'}</p>
              </div>
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-500">Task information</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Category</dt><dd className="font-medium text-gray-800">{task.categoryTag || '—'}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Priority</dt><dd className="font-medium text-gray-800">{task.priority || '—'}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Start date</dt><dd className="inline-flex items-center gap-1 font-medium text-gray-800"><CalendarDays className="h-3.5 w-3.5" />{formatDateTime(task.start_date)}</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-gray-500">Department</dt><dd className="font-medium text-gray-800">{task.department?.name || '—'}</dd></div>
                </dl>
              </div>
            </div>

            <section className="mt-5 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-900"><Clock3 className="h-4 w-4 text-green-700" /> Work sessions</h3>
              {(task.workingHourTask || []).length ? (
                <ul className="space-y-2">
                  {task.workingHourTask.map((session) => (
                    <li key={session.id} className="flex flex-wrap justify-between gap-2 rounded-md bg-gray-50 px-3 py-2 text-xs text-gray-700">
                      <span>{formatDateTime(session.started_at)}{session.ended_at ? ` – ${formatDateTime(session.ended_at)}` : ' – Active'}</span>
                      <span>{Math.floor((Number(session.duration_seconds) || 0) / 60)} min</span>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-sm text-gray-500">No work sessions yet.</p>}
              {activeSession && <p className="mt-2 text-xs font-medium text-green-700">A work session is running.</p>}
            </section>

            <section className="mt-5 rounded-lg border border-gray-200 p-4">
              <h3 className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-gray-900"><MessageSquare className="h-4 w-4 text-green-700" /> Comments</h3>
              <form onSubmit={addComment} className="flex flex-col gap-2 sm:flex-row">
                <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={2} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100" />
                <button type="submit" disabled={processing || !comment.trim()} className="self-end rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50">Add comment</button>
              </form>
              <div className="mt-4 space-y-3">
                {(task.taskcomment || []).map((item) => (
                  <article key={item.id} className="rounded-md bg-gray-50 px-3 py-2">
                    <p className="whitespace-pre-wrap text-sm text-gray-800">{item.data}</p>
                    <p className="mt-1 text-xs text-gray-500">{[item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ') || 'User'} · {formatDateTime(item.created_on)}</p>
                  </article>
                ))}
                {!task.taskcomment?.length && <p className="text-sm text-gray-500">No comments yet.</p>}
              </div>
            </section>
          </div>
        )}
      </section>
    </div>,
    document.body
  )
}

export default GetSelfTaskByID
