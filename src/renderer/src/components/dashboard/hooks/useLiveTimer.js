import { useState, useEffect } from 'react'

/**
 * useLiveTimer hook tracks the elapsed time of a task in real-time.
 * It counts the total finished sessions + the current active session (if any).
 *
 * @param {Object} task The task object containing status and workingHourTask array.
 * @returns {Object} { elapsedSeconds, formattedTime, isActive }
 */
export const useLiveTimer = (task) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const hasTask = Boolean(task)
  const taskId = task?.id ?? task?._id ?? null
  const taskStatus = task?.status ?? null
  const taskStartTime = task?.startTime ?? null
  const workingHours = task?.workingHourTask || []

  const totalFinishedSeconds = workingHours
    .filter((wh) => wh.ended_at)
    .reduce((acc, wh) => acc + (Number(wh.duration_seconds) || 0), 0)

  const activeSession = workingHours.find((wh) => !wh.ended_at)
  const activeSessionStartedAt = activeSession?.started_at ?? taskStartTime ?? null

  useEffect(() => {
    if (!hasTask) {
      setElapsedSeconds(0)
      return
    }

    // If task is not in progress, just show the finished seconds
    if (String(taskStatus || '').toUpperCase() !== 'IN_PROGRESS') {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    if (!activeSessionStartedAt) {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    const startTime = new Date(activeSessionStartedAt).getTime()
    if (isNaN(startTime)) {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    const updateTimer = () => {
      const now = Date.now()
      const currentSessionSeconds = Math.max(0, Math.floor((now - startTime) / 1000))
      setElapsedSeconds(totalFinishedSeconds + currentSessionSeconds)
    }

    // Update immediately and then every second
    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [hasTask, taskId, taskStatus, taskStartTime, totalFinishedSeconds, activeSessionStartedAt])

  const formatTime = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    // Using HH:MM:SS format
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return {
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isActive: hasTask && String(taskStatus || '').toUpperCase() === 'IN_PROGRESS'
  }
}
