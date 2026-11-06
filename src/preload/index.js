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

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  contextBridge.exposeInMainWorld('api', api)
} else {
  window.api = api
}
