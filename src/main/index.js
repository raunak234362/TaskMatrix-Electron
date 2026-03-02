/* eslint-disable prettier/prettier */
import { app, shell, BrowserWindow, Notification, ipcMain, session } from 'electron'
import { join } from 'path'
import { tmpdir } from 'os'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log'

// ─────────────────────────────────────────────────────────────
// 🛑 DO NOT disable security in production
// ─────────────────────────────────────────────────────────────

// Disable hardware acceleration (more stable on Linux/VMs)
app.disableHardwareAcceleration()

// Fix GPU cache permission issues
app.commandLine.appendSwitch('gpu-disk-cache-dir', join(tmpdir(), 'taskmatrix-gpu-cache'))
app.commandLine.appendSwitch('disk-cache-dir', join(tmpdir(), 'taskmatrix-disk-cache'))

// 🔥 Force X11 instead of Wayland (Fix Linux notification crash)
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11')
}

// Windows notifications require AppUserModelID
if (process.platform === 'win32') {
  app.setAppUserModelId('com.taskmatrix.wbt')
}

// ─────────────────────────────────────────────────────────────
// 🪟 CREATE WINDOW
// ─────────────────────────────────────────────────────────────

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1600,
    height: 980,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      webSecurity: !is.dev
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

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
// 🚀 APP READY
// ─────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.taskmatrix.wbt')

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

  // Safer CSP handling
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = is.dev
      ? "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"
      : "default-src 'self'; script-src 'self'; connect-src 'self' https://project-station.whiteboardtec.com:5160 wss://project-station.whiteboardtec.com:5160; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; object-src 'none';"

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp]
      }
    })
  })

  createWindow()

  // 🔥 Only check updates in production + packaged
  if (!is.dev && app.isPackaged) {
    autoUpdater.checkForUpdatesAndNotify()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
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

autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...')
})

autoUpdater.on('update-available', (info) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('update-available', info)
  })
})

autoUpdater.on('update-downloaded', (info) => {
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('update-downloaded', info)
  })
})

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall()
})

// ─────────────────────────────────────────────────────────────
// 🛑 GLOBAL ERROR HANDLING (Prevents silent crashes)
// ─────────────────────────────────────────────────────────────

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason)
})