/**
 * useFloatingTimer  —  React hook that wraps window.electronAPI (timer channels).
 *
 * Safe to use in a plain browser: when window.electronAPI is undefined every
 * call is a no-op and the hook returns a stable stub object.
 *
 * Usage:
 *   const timer = useFloatingTimer()
 *   timer.startTask(task)
 *   timer.pauseTask()
 *   timer.resumeTask()
 *   timer.stopTask()
 *
 * The hook also registers `onWidgetAction` once and fires the supplied
 * `onWidgetAction` callback whenever the floating widget's buttons are pressed.
 */

import { useEffect, useRef } from 'react'

// ── Thin wrapper around window.electronAPI (timer slice) ───────────────────

const ipc = (() => {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI
  }
  // Browser / no-electron stub — every method is a silent no-op
  const noop = () => () => {}
  return {
    startTaskTimer:  () => {},
    pauseTaskTimer:  () => {},
    resumeTaskTimer: () => {},
    stopTaskTimer:   () => {},
    updateTaskTimer: () => {},
    onWidgetAction:  noop,
  }
})()

/**
 * Build a minimal task-data snapshot from the full task object.
 * Only the fields the widget actually needs are sent — keeps IPC payload small.
 */
export function buildTimerPayload(task) {
  if (!task) return null
  return {
    id:      task.id,
    name:    task.name,
    status:  task.status,
    project: task.project ? { name: task.project.name } : null,
    allocationLog: task.allocationLog
      ? { allocatedHours: task.allocationLog.allocatedHours }
      : null,
    workingHourTask: (task.workingHourTask || []).map((wh) => ({
      id:               wh.id,
      started_at:       wh.started_at,
      ended_at:         wh.ended_at,
      duration_seconds: wh.duration_seconds
    }))
  }
}

/**
 * useFloatingTimer
 *
 * @param {Function} [onAction]  Optional callback invoked when the widget
 *                               buttons are pressed.
 *                               Signature: ({ action }) => void
 *                               action: 'pause' | 'resume' | 'stop' | 'close'
 */
export function useFloatingTimer(onAction) {
  const onActionRef = useRef(onAction)
  onActionRef.current = onAction

  useEffect(() => {
    if (typeof onActionRef.current !== 'function') return undefined
    // Register widget-action listener (main window receives widget button clicks)
    const unsubscribe = ipc.onWidgetAction((payload) => {
      if (typeof onActionRef.current === 'function') {
        onActionRef.current(payload)
      }
    })
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, []) // runs once

  return {
    /** Start (or replace) the timer for a task */
    startTask(task) {
      const payload = buildTimerPayload(task)
      if (payload) ipc.startTaskTimer(payload)
    },

    /** Tell the widget the task is now paused / on break */
    pauseTask() {
      ipc.pauseTaskTimer()
    },

    /** Tell the widget the task has resumed */
    resumeTask() {
      ipc.resumeTaskTimer()
    },

    /** Close the widget (task completed or moved to review) */
    stopTask() {
      ipc.stopTaskTimer()
    },

    /** Push refreshed task data into the widget without closing it */
    updateTask(task) {
      const payload = buildTimerPayload(task)
      if (payload) ipc.updateTaskTimer(payload)
    }
  }
}
