import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
const api = {
  getOSUser: () => ipcRenderer.invoke('get-os-user'),
  exportInvoicePdf: (options) => ipcRenderer.invoke('export-invoice-pdf', options),
  showNotification: (notification) => ipcRenderer.invoke('show-notification', notification),
  getVersions: () => ({
    electron: process.versions.electron,
    chrome: process.versions.chrome,
    node: process.versions.node
  }),
  onSystemLocked: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('System lock listener must be a function.')
    }

    const listener = () => callback()
    ipcRenderer.on('system-locked', listener)
    return () => ipcRenderer.removeListener('system-locked', listener)
  },
  getUpdateStatus: () => ipcRenderer.invoke('updates:get-status'),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateStatus: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('Update status listener must be a function.')
    }

    const listener = (_, status) => callback(status)
    ipcRenderer.on('updates:status', listener)
    return () => ipcRenderer.removeListener('updates:status', listener)
  }
}

// ─── Floating Timer Widget API ───────────────────────────────────────────────
// Exposed as window.electronAPI (separate from window.api so it's tree-shakeable
// and the widget preload can remain independent).

const electronAPI = {
  // Main → widget
  startTaskTimer:  (taskData) => ipcRenderer.send('timer:start',  taskData),
  pauseTaskTimer:  ()         => ipcRenderer.send('timer:pause'),
  resumeTaskTimer: ()         => ipcRenderer.send('timer:resume'),
  stopTaskTimer:   ()         => ipcRenderer.send('timer:stop'),
  updateTaskTimer: (taskData) => ipcRenderer.send('timer:update-task', taskData),

  // Widget → main window relay
  onWidgetAction: (callback) => {
    if (typeof callback !== 'function') return () => {}
    const listener = (_e, payload) => callback(payload)
    ipcRenderer.on('main:widget-action', listener)
    return () => ipcRenderer.removeListener('main:widget-action', listener)
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
  contextBridge.exposeInMainWorld('electronAPI', electronAPI)
} else {
  window.api = api
  window.electronAPI = electronAPI
}
