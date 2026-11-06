/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, Notification, ipcMain, session, powerMonitor, dialog } from 'electron'
import { basename, join } from 'path'
import { writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

let mainWindow
const updateState = {
  status: 'idle',
  currentVersion: app.getVersion(),
  availableVersion: null,
  progress: 0,
  releaseNotes: '',
  checkedAt: null,
  error: null
}

autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

function getUpdateState() {
  return { ...updateState }
}

function publishUpdateState(nextState) {
  Object.assign(updateState, nextState)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updates:status', getUpdateState())
  }
}

function getReleaseNotes(info) {
  const notes = info?.releaseNotes
  const text = Array.isArray(notes)
    ? notes.map((entry) => entry?.note || '').filter(Boolean).join('\n\n')
    : typeof notes === 'string'
      ? notes
      : ''

  return text.slice(0, 8000)
}

function isUpdateSupported() {
  return (
    process.platform === 'win32' ||
    process.platform === 'darwin' ||
    (process.platform === 'linux' && Boolean(process.env.APPIMAGE))
  )
}

function assertMainWindowSender(event) {
  const senderWindow = BrowserWindow.fromWebContents(event.sender)
  if (!mainWindow || mainWindow.isDestroyed() || senderWindow !== mainWindow) {
    throw new Error('Update actions are only available to the main application window.')
  }
}

async function checkForUpdates() {
  if (!app.isPackaged) {
    publishUpdateState({ status: 'unsupported', error: 'Update checks are disabled in development builds.' })
    return getUpdateState()
  }

  if (!isUpdateSupported()) {
    publishUpdateState({
      status: process.platform === 'linux' ? 'manual' : 'unsupported',
      error:
        process.platform === 'linux'
          ? 'Debian package updates are managed by your system package manager.'
          : 'Automatic updates are not supported for this package.'
    })
    return getUpdateState()
  }

  publishUpdateState({ status: 'checking', error: null })
  try {
    await autoUpdater.checkForUpdates()
  } catch (error) {
    log.error('Update check failed:', error)
    publishUpdateState({
      status: 'error',
      checkedAt: new Date().toISOString(),
      error: 'Could not check for updates. Check your connection and try again.'
    })
  }

  return getUpdateState()
}

async function downloadUpdate() {
  if (!isUpdateSupported() || updateState.status !== 'available') {
    throw new Error('There is no supported update available to download.')
  }

  publishUpdateState({ status: 'downloading', progress: 0, error: null })
  try {
    await autoUpdater.downloadUpdate()
  } catch (error) {
    log.error('Update download failed:', error)
    publishUpdateState({
      status: 'error',
      error: 'The update could not be downloaded. Check your connection and try again.'
    })
  }

  return getUpdateState()
}

ipcMain.handle('updates:get-status', (event) => {
  assertMainWindowSender(event)
  return getUpdateState()
})

ipcMain.handle('updates:check', (event) => {
  assertMainWindowSender(event)
  return checkForUpdates()
})

ipcMain.handle('updates:download', (event) => {
  assertMainWindowSender(event)
  return downloadUpdate()
})

ipcMain.handle('updates:install', (event) => {
  assertMainWindowSender(event)
  if (!isUpdateSupported() || updateState.status !== 'downloaded') {
    throw new Error('The downloaded update is not ready to install.')
  }

  log.info('User requested application restart to install the downloaded update.')
  autoUpdater.quitAndInstall()
})

autoUpdater.on('checking-for-update', () => {
  publishUpdateState({ status: 'checking', error: null })
})

autoUpdater.on('update-available', (info) => {
  log.info(`Update ${info.version} is available.`)
  publishUpdateState({
    status: 'available',
    availableVersion: info.version,
    releaseNotes: getReleaseNotes(info),
    checkedAt: new Date().toISOString(),
    progress: 0,
    error: null
  })
})

autoUpdater.on('update-not-available', (info) => {
  log.info(`No update available; current version is ${info.version}.`)
  publishUpdateState({
    status: 'up-to-date',
    availableVersion: null,
    checkedAt: new Date().toISOString(),
    progress: 0,
    error: null
  })
})

autoUpdater.on('download-progress', (progress) => {
  publishUpdateState({ status: 'downloading', progress: Math.max(0, Math.min(100, progress.percent)) })
})

autoUpdater.on('update-downloaded', (info) => {
  log.info(`Update ${info.version} downloaded and is ready to install.`)
  publishUpdateState({
    status: 'downloaded',
    availableVersion: info.version,
    releaseNotes: getReleaseNotes(info),
    progress: 100,
    error: null
  })
})

autoUpdater.on('error', (error) => {
  log.error('Automatic update failed:', error)
  publishUpdateState({
    status: 'error',
    checkedAt: new Date().toISOString(),
    error: 'The update service encountered an error. You can try again later.'
  })
})

// ─────────────────────────────────────────────────────────────
// 🛑 DO NOT disable security in production
// ─────────────────────────────────────────────────────────────

// Disable hardware acceleration (more stable on Linux/VMs)
app.disableHardwareAcceleration()

// Fix GPU cache permission issues
app.commandLine.appendSwitch('gpu-disk-cache-dir', join(tmpdir(), 'taskmatrix-gpu-cache'))
app.commandLine.appendSwitch('disk-cache-dir', join(tmpdir(), 'taskmatrix-disk-cache'))

// Windows notifications require AppUserModelID
if (process.platform === 'win32') {
  app.setAppUserModelId('com.whiteboard.taskmatrix')
}

// ─────────────────────────────────────────────────────────────
// 🪟 CREATE WINDOW
// ─────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    show: process.platform === 'linux',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      webSecurity: !is.dev
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function focusMainWindow() {
  if (!mainWindow) {
    createWindow()
    return
  }

  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

const hasSingleInstanceLock = app.requestSingleInstanceLock()
if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', focusMainWindow)
}

// ─────────────────────────────────────────────────────────────
// 🔔 SAFE NOTIFICATION HANDLER
// ─────────────────────────────────────────────────────────────

ipcMain.handle('show-notification', async (_, data) => {
  try {
    const title = data?.title || 'TaskMatrix'
    const body = data?.body || ''

    // ❌ Disable native notifications on Linux (prevents crash)
    if (process.platform === 'linux') {
      BrowserWindow.getAllWindows()[0]?.webContents.send('show-toast', {
        title,
        body
      })
      return { success: true, mode: 'renderer-toast' }
    }

    if (!Notification.isSupported()) {
      return { success: false, reason: 'not_supported' }
    }

    const notification = new Notification({
      title,
      body,
      icon: join(__dirname, '../../resources/icon.png')
    })

    notification.show()
    return { success: true, mode: 'native' }
  } catch (err) {
    console.error('Notification error:', err)
    return { success: false }
  }
})

// ─────────────────────────────────────────────────────────────
// 👤 USER IDENTITY HANDLER
// ─────────────────────────────────────────────────────────────

ipcMain.handle('get-os-user', () => {
  try {
    return process.env.USERNAME || require('os').userInfo().username || '';
  } catch (err) {
    console.error('Error fetching OS user:', err);
    return '';
  }
})

ipcMain.handle('export-invoice-pdf', async (event, { html, filename }) => {
  if (typeof html !== 'string' || !html.trim()) {
    return { success: false, error: 'Invoice content is empty' }
  }

  const safeFilename = basename(String(filename || 'Invoice.pdf'))
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    .replace(/\.pdf$/i, '')
  const defaultPath = join(app.getPath('downloads'), `${safeFilename || 'Invoice'}.pdf`)
  const parentWindow = BrowserWindow.fromWebContents(event.sender)
  const saveResult = await dialog.showSaveDialog(parentWindow, {
    title: 'Save invoice as PDF',
    defaultPath,
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  })

  if (saveResult.canceled || !saveResult.filePath) {
    return { canceled: true }
  }

  const pdfWindow = new BrowserWindow({
    show: false,
    webPreferences: { sandbox: true }
  })

  try {
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
    const pdf = await pdfWindow.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    })
    await writeFile(saveResult.filePath, pdf)
    const openError = await shell.openPath(saveResult.filePath)
    return { success: true, filePath: saveResult.filePath, openError }
  } catch (error) {
    console.error('Error exporting invoice PDF:', error)
    return { success: false, error: error.message || 'Failed to export invoice PDF' }
  } finally {
    if (!pdfWindow.isDestroyed()) pdfWindow.destroy()
  }
})

// ─────────────────────────────────────────────────────────────
// 🚀 APP READY
// ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return

  electronApp.setAppUserModelId('com.whiteboard.taskmatrix')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)

    window.webContents.on('before-input-event', (_, input) => {
      if (
        input.key === 'F12' ||
        (input.control && input.shift && input.key.toLowerCase() === 'i')
      ) {
        window.webContents.toggleDevTools()
      }
    })
  })

  // Listen for system lock to pause tasks
  powerMonitor.on('lock-screen', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('system-locked')
    })
  })
  
  // Also listen for system suspend (sleep)
  powerMonitor.on('suspend', () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('system-locked')
    })
  })

  // Safer CSP handling and CORS injection
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = is.dev
      ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
      : "default-src 'self'; script-src 'self'; connect-src 'self' https://project-station.whiteboardtec.com:* wss://project-station.whiteboardtec.com:* http://192.168.1.157:* ws://192.168.1.157:* https://api.github.com; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none';"

    const responseHeaders = {
      ...details.responseHeaders,
      'Content-Security-Policy': [csp]
    }

    // Bypass CORS for local backend and deployed backend
    const url = details.url.toLowerCase()
    if (url.includes('192.168.1.157') || url.includes('project-station.whiteboardtec.com')) {
      responseHeaders['Access-Control-Allow-Origin'] = ['*']
      responseHeaders['Access-Control-Allow-Headers'] = ['*']
      responseHeaders['Access-Control-Allow-Methods'] = ['*']
    }

    callback({
      responseHeaders
    })
  })

  createWindow()

  app.on('activate', () => {
    focusMainWindow()
  })
})

// ─────────────────────────────────────────────────────────────
// 🛑 CLOSE HANDLING
// ─────────────────────────────────────────────────────────────

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// ─────────────────────────────────────────────────────────────
// 📦 AUTO UPDATER
// ─────────────────────────────────────────────────────────────

log.transports.file.level = 'info'
autoUpdater.logger = log

// ─────────────────────────────────────────────────────────────
// 🛑 GLOBAL ERROR HANDLING (Prevents silent crashes)
// ─────────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})
