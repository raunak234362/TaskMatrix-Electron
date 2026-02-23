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

  useEffect(() => {
    if (!task) {
      setElapsedSeconds(0)
      return
    }

    // Calculate total duration of all finished sessions
    const totalFinishedSeconds = (task.workingHourTask || [])
      .filter((wh) => wh.ended_at)
      .reduce((acc, wh) => acc + (Number(wh.duration_seconds) || 0), 0)

    // If task is not in progress, just show the finished seconds
    if (task.status?.toUpperCase() !== 'IN_PROGRESS') {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    // Find the currently active session (no ended_at)
    const activeSession = (task.workingHourTask || []).find((wh) => !wh.ended_at)

    if (!activeSession) {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    const startTime = new Date(activeSession.started_at).getTime()
    if (isNaN(startTime)) {
      setElapsedSeconds(totalFinishedSeconds)
      return
    }

    const updateTimer = () => {
      const now = new Date().getTime()
      const currentSessionSeconds = Math.max(0, Math.floor((now - startTime) / 1000))
      setElapsedSeconds(totalFinishedSeconds + currentSessionSeconds)
    }

    // Update immediately and then every second
    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [task])

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
    isActive: !!task && task.status?.toUpperCase() === 'IN_PROGRESS'
  }
}
