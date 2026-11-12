/**
 * Preload for the timer widget window.
 *
 * Exposes window.timerAPI — a minimal bridge between the widget HTML/JS
 * and the main process IPC channels.
 *
 * Rules:
 *  - contextIsolation: true  → must use contextBridge
 *  - nodeIntegration: false  → no require() in renderer
 *
 * electron-vite externalizes electron, so both import and require work here.
 */

import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('timerAPI', {
  /**
   * Called once by the widget JS when the page loads.
   * cb(taskData) is invoked with the task to display.
   * Returns an unsubscribe function.
   */
  onInitTimer: (cb) => {
    const listener = (_e, taskData) => cb(taskData)
    ipcRenderer.on('widget:init-timer', listener)
    return () => ipcRenderer.removeListener('widget:init-timer', listener)
  },

  /**
   * Receives pause/resume commands from the main process.
   * cb({ command: 'pause' | 'resume' })
   */
  onCommand: (cb) => {
    const listener = (_e, payload) => cb(payload)
    ipcRenderer.on('widget:command', listener)
    return () => ipcRenderer.removeListener('widget:command', listener)
  },

  /**
   * Widget buttons call this to tell the main process / main window
   * that the user took an action.
   * action: 'pause' | 'resume' | 'stop' | 'close'
   */
  sendAction: (action) => {
    ipcRenderer.send('widget:action', { action })
  },

  /** Hide this widget window (main process decides whether to close or hide). */
  closeWidget: () => {
    ipcRenderer.send('widget:action', { action: 'close' })
  }
})

